<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import Canvas from './components/Canvas.vue'
import Widget from './components/Widget.vue'
import Taskbar from './components/Taskbar.vue'
import SidePanel from './components/SidePanel.vue'
import StateBar from './components/StateBar.vue'
import TextBlock from './components/TextBlock.vue'
import WorkspaceSwitcher from './components/WorkspaceSwitcher.vue'
import AuraLogo from './components/AuraLogo.vue'
import WidgetNote from './components/widgets/WidgetNote.vue'
import WidgetClock from './components/widgets/WidgetClock.vue'
import WidgetTodo from './components/widgets/WidgetTodo.vue'
import WidgetImageViewer from './components/widgets/WidgetImageViewer.vue'
import WidgetTimer from './components/widgets/WidgetTimer.vue'
import MermaidWidget from './components/MermaidWidget.vue'
import { useWorkspaceStore } from './stores/workspaces.js'

// ...

// Template update:
/*
          <Widget v-for="w in active.widgets" :key="w.id" :id="w.id" :x="w.x" :y="w.y" :w="w.w" :h="w.h"
            :scale="active.scale" @move="({ id, x, y }) => wsStore.updateWidget(id, { x, y })"
            @resize="({ id, w, h }) => wsStore.updateWidget(id, { w, h })">
            <WidgetNote v-if="w.type === 'note'" :id="w.id" :data="w.data" />
            <WidgetClock v-else-if="w.type === 'clock'" :id="w.id" />
            <div v-else class="demo-widget">Widget {{ w.id }}</div>
          </Widget>
*/
import { useChatStore } from './stores/chat'
import { useSettingsStore } from './stores/settings'
import { renderMarkdown } from './utils/markdown'
import { Mic, FileText, Bot, Volume2, Loader2, Sparkles } from 'lucide-vue-next'

// ... (existing code)

// In template:
// <component :is="voiceStatusConfig.icon" class="v-icon" :class="{ spin: voiceStatusConfig.spin, 'pulse-ring': voiceStatusConfig.class === 'pulse-ring' }" :size="16" />

// Expanded state:
// <div class="voice-header" style="padding: 14px 18px 8px;">
//   <Sparkles :size="16" class="v-icon" />
//   <span class="v-label">Recent Response</span>
// </div>

const wsStore = useWorkspaceStore()
const chatStore = useChatStore()
const { active, state } = storeToRefs(wsStore)
const { voiceStatus, voiceTranscript, voiceAiText, pendingToolCalls } = storeToRefs(chatStore)

// Initial state: if sidepanel is open, statebar is closed
const expanded = ref(!state.value.sidePanelOpen)
const sidePanelRef = ref(null)

const slideDir = computed(() => state.value.switchDirection)

// ── Voice active = show voice in StateBar ───────────────────
const voiceActive = computed(() => !!voiceStatus.value && voiceStatus.value !== 'done')

const voiceStatusConfig = computed(() => {
  switch (voiceStatus.value) {
    case 'recording':
      return { icon: Mic, text: 'Listening…', spin: false }
    case 'transcribing':
      return { icon: Loader2, text: 'Transcribing…', spin: true }
    case 'thinking':
      return { icon: Sparkles, text: 'Thinking…', spin: false, class: 'pulse-ring' }
    case 'speaking':
      return { icon: Volume2, text: 'Speaking…', spin: false }
    default:
      return { icon: Loader2, text: 'Processing…', spin: true }
  }
})

// Build the voice StateBar content (AI text only)
const voiceAiTextClean = computed(() => {
  if (!voiceAiText.value) return ''
  return voiceAiText.value.replace(/\[emotion:\w+\]/g, '').trim()
})

// ── Mutual exclusivity: sidebar ↔ voice statebar ↔ manual statebar ──
watch(
  () => state.value.sidePanelOpen,
  (isOpen) => {
    if (isOpen) {
      expanded.value = false
      if (voiceActive.value) chatStore.clearVoiceState()
    }
  }
)

watch(expanded, (isExpanded) => {
  if (isExpanded) {
    // modifying state directly triggers the store action/watcher
    state.value.sidePanelOpen = false
    if (voiceActive.value) chatStore.clearVoiceState()
  }
})

watch(voiceActive, (isActive) => {
  if (isActive) {
    state.value.sidePanelOpen = false
    expanded.value = false
  }
})

function onVoiceStart() {
  // Triggered by IconStrip, handled by watch(voiceActive) mostly,
  // but good to be explicit just in case
  state.value.sidePanelOpen = false
  expanded.value = false
}

function onVoiceEnd() {
  // Voice ended logic
}

// ── Tool Event Handlers ───────────────────────────────────────
const settingsStore = useSettingsStore()

onMounted(() => {
  // Handle speak tool
  window.api.on('aura:tool:speak', async ({ text }) => {
    const settings = settingsStore.state.ai
    const ttsProvider = settings.tts?.provider || 'sarvam'

    // Use existing voice infrastructure to generate and play audio
    try {
      let audioBase64
      if (ttsProvider === 'edge') {
        // Edge TTS via IPC
        const result = await window.api.edgeTTS({ text, voice: settings.tts?.edgeVoice })
        audioBase64 = result.audioBase64
      } else {
        // Sarvam TTS via IPC
        const result = await window.api.sarvamTTS({
          text,
          sarvamKey: settings.keys?.sarvam,
          speaker: settings.tts?.speaker
        })
        audioBase64 = result.audioBase64
      }

      // Play the audio and wait for it to finish
      if (audioBase64) {
        const audioData = atob(audioBase64)
        const bytes = new Uint8Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) bytes[i] = audioData.charCodeAt(i)
        const blob = new Blob([bytes], { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)

        // Wait for audio to finish
        await new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.play()
        })

        // Notify main process that speaking is done
        window.api.invoke('aura:tool:speak:done')
      } else {
        // No audio generated, still notify done
        window.api.invoke('aura:tool:speak:done')
      }
    } catch (err) {
      console.error('[Tool:Speak] Error:', err)
      // Notify done even on error
      window.api.invoke('aura:tool:speak:done')
    }
  })

  // Handle listen tool
  window.api.on('aura:tool:listen:start', async ({ timeout }) => {
    console.log('[Tool:Listen] Started - timeout:', timeout)
    try {
      // Start recording immediately (no prompt)
      console.log('[Tool:Listen] Starting recording...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      const chunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log('[Tool:Listen] Chunk received:', e.data.size, 'bytes')
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('[Tool:Listen] Recording stopped, chunks:', chunks.length)
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks, { type: 'audio/webm' })
        console.log('[Tool:Listen] Blob size:', blob.size, 'bytes')
        const reader = new FileReader()

        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1]
          console.log('[Tool:Listen] Base64 length:', base64.length)

          // Transcribe via IPC
          try {
            const settings = settingsStore.state.ai
            console.log('[Tool:Listen] Calling STT...')
            const result = await window.api.auraSTT({
              audioBase64: base64,
              sarvamKey: settings.keys?.sarvam
            })

            console.log('[Tool:Listen] STT result:', result)
            // Send result back to main process
            window.api.send('aura:tool:listen:result', {
              success: true,
              transcript: result.transcript,
              languageCode: result.languageCode
            })
          } catch (err) {
            console.error('[Tool:Listen] STT error:', err)
            window.api.send('aura:tool:listen:result', {
              error: err.message
            })
          }
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start()
      console.log('[Tool:Listen] Recording started')

      // Start timeout AFTER recording starts (so user gets full timeout duration)
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('[Tool:Listen] Timeout - stopping recording')
          mediaRecorder.stop()
        }
      }, timeout * 1000)
    } catch (err) {
      console.error('[Tool:Listen] Error:', err)
      window.api.send('aura:tool:listen:result', {
        error: err.message
      })
    }
  })

  // Handle widget control tool
  window.api.on(
    'aura:tool:widget',
    async ({ action, widgetType, widgetId, data, position, size }) => {
      console.log('[Tool:Widget] Received:', { action, widgetType, widgetId, data, position, size })

      try {
        if (action === 'create') {
          if (!widgetType) {
            window.api.send('aura:tool:widget:result', {
              error: 'Validation Error: widgetType is required to create a new widget.'
            })
            return
          }

          let widgetData = {
            type: widgetType,
            ...position,
            ...size
          }

          // Structure data based on widget type
          if (widgetType === 'mermaid') {
            const diagramCode = data || `graph TD\nA[Start] --> B[Process]\nB --> C[End]`
            try {
              const m = await import('mermaid')
              await m.default.parse(diagramCode)
            } catch (err) {
              window.api.send('aura:tool:widget:result', {
                error: `Mermaid Syntax Error: The diagram code provided is invalid. The parser returned: ${err.message}`
              })
              return
            }
            widgetData.data = diagramCode
            widgetData.w = widgetData.w || 500
            widgetData.h = widgetData.h || 400
          } else if (widgetType === 'note') {
            widgetData.data = { content: data || '' }
            widgetData.w = widgetData.w || 400
            widgetData.h = widgetData.h || 300
          } else if (widgetType === 'todo') {
            try {
              const items = data ? (typeof data === 'string' ? JSON.parse(data) : data) : []
              if (!Array.isArray(items))
                throw new Error('Root data structure must be an array of todo items')
              widgetData.data = { items }
            } catch (err) {
              window.api.send('aura:tool:widget:result', {
                error: `Parsing Error: The 'data' field for a 'todo' widget must be a valid JSON array format. Received error: ${err.message}`
              })
              return
            }
            widgetData.w = widgetData.w || 350
            widgetData.h = widgetData.h || 400
          } else if (widgetType === 'image') {
            widgetData.data = { imageUrl: data || '', imageName: '' }
            widgetData.w = widgetData.w || 450
            widgetData.h = widgetData.h || 400
          } else if (widgetType === 'timer') {
            try {
              const timerData = data
                ? typeof data === 'string'
                  ? JSON.parse(data)
                  : data
                : { minutes: 5, seconds: 0 }
              if (typeof timerData.minutes !== 'number' || typeof timerData.seconds !== 'number') {
                throw new Error("Must include numeric 'minutes' and 'seconds'")
              }
              widgetData.data = { minutes: timerData.minutes, seconds: timerData.seconds }
            } catch (err) {
              window.api.send('aura:tool:widget:result', {
                error: `Parsing Error: Timer data must be a valid JSON object with 'minutes' and 'seconds' numbers. Error: ${err.message}`
              })
              return
            }
            widgetData.w = widgetData.w || 280
            widgetData.h = widgetData.h || 320
          } else {
            window.api.send('aura:tool:widget:result', {
              error: `Unknown widget type: '${widgetType}'. Allowed: mermaid, note, todo, image, timer.`
            })
            return
          }

          console.log('[Tool:Widget] Creating widget:', widgetData)
          const id = wsStore.addWidget(widgetData)
          const newWidget = active.value.widgets.find((w) => w.id === id)

          window.api.send('aura:tool:widget:result', {
            success: true,
            widgetId: id,
            message: `Created ${widgetType} widget with ID ${id}`,
            widget: newWidget
              ? {
                  id: newWidget.id,
                  type: newWidget.type,
                  x: newWidget.x,
                  y: newWidget.y,
                  w: newWidget.w,
                  h: newWidget.h,
                  data: newWidget.data
                }
              : null
          })
        } else if (action === 'update') {
          if (!widgetId) {
            window.api.send('aura:tool:widget:result', {
              error: 'Validation Error: widgetId is required to update an existing widget.'
            })
            return
          }

          const widget = active.value.widgets.find((w) => w.id === widgetId)
          if (!widget) {
            window.api.send('aura:tool:widget:result', {
              error: `Target Error: Widget with ID ${widgetId} not found on the active canvas.`
            })
            return
          }

          const updateData = {}

          if (data !== undefined) {
            if (widget.type === 'mermaid') {
              try {
                const m = await import('mermaid')
                await m.default.parse(data)
              } catch (err) {
                window.api.send('aura:tool:widget:result', {
                  error: `Mermaid Syntax Error: Failed to parse updated diagram code. ${err.message}`
                })
                return
              }
              updateData.data = data
            } else if (widget.type === 'note') {
              updateData.data = { content: data }
            } else if (widget.type === 'todo') {
              try {
                const items = typeof data === 'string' ? JSON.parse(data) : data
                if (!Array.isArray(items)) throw new Error('Todo items must be an array')
                updateData.data = { items }
              } catch (err) {
                window.api.send('aura:tool:widget:result', {
                  error: `Parsing Error: Failed to parse todo list update. ${err.message}`
                })
                return
              }
            } else if (widget.type === 'image') {
              updateData.data = { imageUrl: data, imageName: widget.data?.imageName || '' }
            } else if (widget.type === 'timer') {
              try {
                const timerData = typeof data === 'string' ? JSON.parse(data) : data
                if (timerData.minutes === undefined || timerData.seconds === undefined)
                  throw new Error('Missing minutes/seconds fields')
                updateData.data = {
                  minutes: Number(timerData.minutes) || 0,
                  seconds: Number(timerData.seconds) || 0
                }
              } catch (err) {
                window.api.send('aura:tool:widget:result', {
                  error: `Parsing Error: Failed to parse timer update data. ${err.message}`
                })
                return
              }
            }
          }

          if (position) Object.assign(updateData, position)
          if (size) Object.assign(updateData, size)

          wsStore.updateWidget(widgetId, updateData)

          const updatedWidget = active.value.widgets.find((w) => w.id === widgetId)

          window.api.send('aura:tool:widget:result', {
            success: true,
            message: `Successfully updated widget ${widgetId}`,
            widget: updatedWidget
              ? {
                  id: updatedWidget.id,
                  type: updatedWidget.type,
                  x: updatedWidget.x,
                  y: updatedWidget.y,
                  w: updatedWidget.w,
                  h: updatedWidget.h,
                  data: updatedWidget.data
                }
              : null
          })
        } else if (action === 'get') {
          if (!widgetId) {
            window.api.send('aura:tool:widget:result', {
              error: 'Validation Error: widgetId is required for getting a widget.'
            })
            return
          }

          const widget = active.value.widgets.find((w) => w.id === widgetId)
          if (!widget) {
            window.api.send('aura:tool:widget:result', {
              error: `Target Error: Widget with ID ${widgetId} was not found on the canvas.`
            })
            return
          }

          window.api.send('aura:tool:widget:result', {
            success: true,
            widget: {
              id: widget.id,
              type: widget.type,
              data: widget.data,
              x: widget.x,
              y: widget.y,
              w: widget.w,
              h: widget.h
            }
          })
        } else {
          window.api.send('aura:tool:widget:result', {
            error: `Action Error: Unknown action '${action}'. Valid actions are 'create', 'update', or 'get'.`
          })
        }
      } catch (err) {
        console.error('[Tool:Widget] Error:', err)
        window.api.send('aura:tool:widget:result', {
          error: `Internal execution error in renderer payload parser: ${err.message}`
        })
      }
    }
  )
})

onUnmounted(() => {
  // Clean up listeners if needed
})
</script>

<template>
  <div class="desktop">
    <Transition name="workspace" :style="{ '--dir': slideDir }">
      <div class="workspace-layer" :key="active.id">
        <Canvas
          :initialPanX="active.panX"
          :initialPanY="active.panY"
          :initialScale="active.scale"
          @scale="(s) => wsStore.updateCanvas({ scale: s })"
          @pan="(p) => wsStore.updateCanvas({ panX: p.x, panY: p.y })"
        >
          <TransitionGroup name="widget-anim">
            <Widget
              v-for="w in active.widgets"
              :key="w.id"
              :id="w.id"
              :x="w.x"
              :y="w.y"
              :w="w.w"
              :h="w.h"
              :type="w.type"
              :scale="active.scale"
              @move="({ id, x, y }) => wsStore.updateWidget(id, { x, y })"
              @resize="({ id, w, h }) => wsStore.updateWidget(id, { w, h })"
            >
              <template #default="{ isEditing, toggleEdit }">
                <WidgetNote
                  v-if="w.type === 'note'"
                  :id="w.id"
                  :data="w.data"
                  :is-editing="isEditing"
                  @toggle-edit="toggleEdit"
                />
                <WidgetClock v-else-if="w.type === 'clock'" />
                <WidgetTodo v-else-if="w.type === 'todo'" :id="w.id" :data="w.data" />
                <WidgetImageViewer
                  v-else-if="w.type === 'image'"
                  :id="w.id"
                  :data="w.data"
                  :is-editing="isEditing"
                  @toggle-edit="toggleEdit"
                />
                <WidgetTimer v-else-if="w.type === 'timer'" :id="w.id" :data="w.data" />
                <MermaidWidget
                  v-else-if="w.type === 'mermaid'"
                  :initialCode="w.data"
                  :title="w.title || 'Mermaid Diagram'"
                  :is-editing="isEditing"
                  @toggle-edit="toggleEdit"
                  @update="(code) => wsStore.updateWidget(w.id, { data: code })"
                  @updateTitle="(title) => wsStore.updateWidget(w.id, { title })"
                />
                <div v-else class="demo-widget">
                  Widget {{ w.id }} <br />
                  <span style="font-size: 10px; opacity: 0.5">{{ w.type || 'generic' }}</span>
                </div>
              </template>
            </Widget>
          </TransitionGroup>
        </Canvas>
      </div>
    </Transition>
  </div>

  <!-- Aura Logo — top left -->
  <div class="aura-logo-corner">
    <AuraLogo />
  </div>

  <Taskbar />

  <!-- Voice StateBar — shown during voice-to-voice -->
  <Transition name="state-bar" mode="out-in">
    <!-- Active Voice State -->
    <StateBar v-if="voiceActive" key="voice">
      <div class="voice-state-content">
        <div class="voice-header">
          <component
            :is="voiceStatusConfig.icon"
            class="v-icon"
            :class="{
              spin: voiceStatusConfig.spin,
              'pulse-ring': voiceStatusConfig.class === 'pulse-ring'
            }"
            :size="16"
          />
          <span class="v-label">{{ voiceStatusConfig.text }}</span>
        </div>

        <!-- User Text -->
        <div v-if="voiceTranscript" class="voice-user-text">"{{ voiceTranscript }}"</div>

        <!-- Tool Calls -->
        <div v-if="pendingToolCalls.length > 0" class="voice-tool-calls">
          <div v-for="tc in pendingToolCalls" :key="tc.id" class="voice-tool-call">
            <Loader2 v-if="tc.status === 'running'" :size="12" class="tool-icon spin" />
            <span class="tool-name">{{ tc.toolName }}</span>
          </div>
        </div>

        <!-- Use TextBlock for content if available -->
        <div class="voice-body-wrapper" v-if="voiceAiTextClean">
          <TextBlock :text="voiceAiTextClean" @close="() => {}" />
        </div>
      </div>
    </StateBar>

    <!-- Manual Expanded State -->
    <StateBar v-else-if="expanded" key="expanded">
      <div
        v-if="voiceAiTextClean"
        class="voice-state-content"
        style="max-height: 500px; padding: 0"
      >
        <div class="voice-header" style="padding: 14px 18px 8px">
          <Sparkles :size="16" class="v-icon" style="color: #c678dd" />
          <span class="v-label">Recent Response</span>
        </div>
        <TextBlock :text="voiceAiTextClean" @close="expanded = false" />
      </div>
      <TextBlock v-else text="" @close="expanded = false" />
    </StateBar>

    <!-- Collapsed State -->
    <StateBar v-else key="collapsed">
      <WorkspaceSwitcher @expand="expanded = true" />
    </StateBar>
  </Transition>

  <SidePanel ref="sidePanelRef" @voiceStart="onVoiceStart" @voiceEnd="onVoiceEnd" />
</template>

<style scoped>
.desktop {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.workspace-layer {
  position: absolute;
  inset: 0;
}

.demo-widget {
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-family: 'Inter', sans-serif;
}

.aura-logo-corner {
  position: fixed;
  top: 28px;
  left: 28px;
  /* width: 48px;
  height: 48px; */
  z-index: 200;
  pointer-events: none;
  transform: scaleX(-1);
  backdrop-filter: blur(5px);
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* border: 1px solid salmon; */
}

/* ── Workspace switch — directional slide + fade ── */
.workspace-enter-active,
.workspace-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
}

/* Enter: slide in from the direction of travel */
.workspace-enter-from {
  opacity: 0;
  transform: translateX(calc(var(--dir) * 40px));
}

.workspace-enter-to {
  opacity: 1;
  transform: translateX(0);
}

/* Leave: slide out opposite direction */
.workspace-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.workspace-leave-to {
  opacity: 0;
  transform: translateX(calc(var(--dir) * -40px));
}

/* ── Widget animations ── */
.widget-anim-move {
  transition: none !important;
}

.widget-anim-enter-active,
.widget-anim-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.widget-anim-enter-from,
.widget-anim-leave-to {
  opacity: 0 !important;
  scale: 0.85 !important;
}

/* ── StateBar enter/leave ── */
.state-bar-enter-active {
  transition:
    opacity 0.25s ease,
    transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.state-bar-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.4, 0, 1, 1);
}

.state-bar-enter-from,
.state-bar-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* ── Voice StateBar content ── */
.voice-state-content {
  max-width: 48vw;
  max-height: 60vh;
  /* Prevent it from taking full height */
  overflow-y: auto;
  /* Scroll if too long */
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cdc6f7;
  font-size: 13px;
  font-weight: 600;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 4px;
}

.v-icon {
  color: #a89fd4;
}

.v-icon.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* Pulse Ring Animation for thinking */
.v-icon.pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

/* Voice Tool Calls */
.voice-tool-calls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
}

.voice-tool-call {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(205, 198, 247, 0.05);
  border: 1px solid rgba(205, 198, 247, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: rgba(205, 198, 247, 0.7);
}

.voice-tool-call .tool-icon {
  color: #a89fd4;
  flex-shrink: 0;
}

.voice-tool-call .tool-name {
  font-weight: 500;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.1);
    opacity: 1;
  }

  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}

.voice-user-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  padding: 4px 8px;
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 8px;
}

.voice-body {
  font-size: 13.5px;
  line-height: 1.65;
  color: #e0daf7;
  font-family: 'Inter', sans-serif;
}

.voice-body :deep(p) {
  margin: 0 0 4px;
}

.voice-body :deep(p:last-child) {
  margin-bottom: 0;
}

.voice-body :deep(strong) {
  color: #fff;
  font-weight: 600;
}
</style>
