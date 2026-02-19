<script setup>
import { computed, ref, watch } from 'vue'
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
const { voiceStatus, voiceTranscript, voiceAiText } = storeToRefs(chatStore)

// Initial state: if sidepanel is open, statebar is closed
const expanded = ref(!state.value.sidePanelOpen)
const sidePanelRef = ref(null)

const slideDir = computed(() => state.value.switchDirection)

// ── Voice active = show voice in StateBar ───────────────────
const voiceActive = computed(() => !!voiceStatus.value && voiceStatus.value !== 'done')

const voiceStatusConfig = computed(() => {
  switch (voiceStatus.value) {
    case 'recording': return { icon: Mic, text: 'Listening…', spin: false }
    case 'transcribing': return { icon: Loader2, text: 'Transcribing…', spin: true }
    case 'thinking': return { icon: Sparkles, text: 'Thinking…', spin: false, class: 'pulse-ring' }
    case 'speaking': return { icon: Volume2, text: 'Speaking…', spin: false }
    default: return { icon: Loader2, text: 'Processing…', spin: true }
  }
})

// Build the voice StateBar content (AI text only)
const voiceAiTextClean = computed(() => {
  if (!voiceAiText.value) return ''
  return voiceAiText.value.replace(/\[emotion:\w+\]/g, '').trim()
})

// ── Mutual exclusivity: sidebar ↔ voice statebar ↔ manual statebar ──
watch(() => state.value.sidePanelOpen, (isOpen) => {
  if (isOpen) {
    expanded.value = false
    if (voiceActive.value) chatStore.clearVoiceState()
  }
})

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
</script>

<template>
  <div class="desktop">
    <Transition name="workspace" :style="{ '--dir': slideDir }">
      <div class="workspace-layer" :key="active.id">
        <Canvas :initialPanX="active.panX" :initialPanY="active.panY" :initialScale="active.scale"
          @scale="s => wsStore.updateCanvas({ scale: s })" @pan="p => wsStore.updateCanvas({ panX: p.x, panY: p.y })">
          <Widget v-for="w in active.widgets" :key="w.id" :id="w.id" :x="w.x" :y="w.y" :w="w.w" :h="w.h"
            :scale="active.scale" @move="({ id, x, y }) => wsStore.updateWidget(id, { x, y })"
            @resize="({ id, w, h }) => wsStore.updateWidget(id, { w, h })">
            <WidgetNote v-if="w.type === 'note'" :id="w.id" :data="w.data" />
            <WidgetClock v-else-if="w.type === 'clock'" />
            <div v-else class="demo-widget">
              Widget {{ w.id }} <br>
              <span style="font-size:10px; opacity:0.5">{{ w.type || 'generic' }}</span>
            </div>
          </Widget>
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
          <component :is="voiceStatusConfig.icon" class="v-icon"
            :class="{ spin: voiceStatusConfig.spin, 'pulse-ring': voiceStatusConfig.class === 'pulse-ring' }"
            :size="16" />
          <span class="v-label">{{ voiceStatusConfig.text }}</span>
        </div>

        <!-- User Text -->
        <div v-if="voiceTranscript" class="voice-user-text">
          "{{ voiceTranscript }}"
        </div>

        <!-- Use TextBlock for content if available -->
        <div class="voice-body-wrapper" v-if="voiceAiTextClean">
          <TextBlock :text="voiceAiTextClean" @close="() => { }" />
        </div>
      </div>
    </StateBar>

    <!-- Manual Expanded State -->
    <StateBar v-else-if="expanded" key="expanded">
      <div v-if="voiceAiTextClean" class="voice-state-content" style="max-height: 500px; padding: 0;">
        <div class="voice-header" style="padding: 14px 18px 8px;">
          <Sparkles :size="16" class="v-icon" style="color: #c678dd;" />
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

/* ── StateBar enter/leave ── */
.state-bar-enter-active {
  transition: opacity 0.25s ease, transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.state-bar-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.4, 0, 1, 1);
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
