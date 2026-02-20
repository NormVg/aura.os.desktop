<script setup>
import { ref, watch } from 'vue'
import iconSidebar from '../assets/icons/sidebar.svg'
import iconSidebarClose from '../assets/icons/sidebar-close.svg'
import iconVoice from '../assets/icons/voice.svg'
import iconVoiceStop from '../assets/icons/voice-stop.svg'
import iconCube from '../assets/icons/cube.svg'
import iconCubeFull from '../assets/icons/cube-full.svg'
import AppTray from './AppTray.vue'
import { Settings as IconSettings } from 'lucide-vue-next'
import { useSettingsStore } from '../stores/settings'
import { useChatStore } from '../stores/chat'
import { storeToRefs } from 'pinia'

const props = defineProps({
  isOpen: Boolean
})
const emit = defineEmits(['toggle', 'openSettings', 'voiceStart', 'voiceEnd'])

const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const { voiceStatus } = storeToRefs(chatStore)

// ── App tray ────────────────────────────────────────────────
const trayOpen = ref(false)
let trayCloseTimer = null

function openTray() {
  clearTimeout(trayCloseTimer)
  trayOpen.value = true
}
function closeTray() {
  trayCloseTimer = setTimeout(() => {
    trayOpen.value = false
  }, 200)
}

// ── Voice-to-voice ──────────────────────────────────────────
const voiceActive = ref(false)
let mediaRecorder = null
let chunks = []

async function toggleVoice() {
  if (voiceActive.value) {
    stopVoice()
  } else {
    startVoice()
  }
}

async function startVoice() {
  chatStore.setVoiceState({ status: 'recording' })
  chatStore.setEmotion('listening')
  chatStore.clearVoiceText() // Clear old text on new session
  voiceActive.value = true
  chunks = []
  emit('voiceStart')

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      const blob = new Blob(chunks, { type: 'audio/webm' })
      const reader = new FileReader()

      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]
        sendVoiceConvo(base64)
      }
      reader.readAsDataURL(blob)
    }

    mediaRecorder.start()
  } catch (err) {
    console.error('Microphone access denied:', err)
    voiceActive.value = false
    chatStore.clearVoiceState()
  }
}

function stopVoice() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
    chatStore.setVoiceState({ status: 'transcribing' })
  }
}

function sendVoiceConvo(audioBase64) {
  if (!window.api?.auraVoice) return

  window.api.auraVoice.removeListeners()

  // Track tool calls during voice conversation
  const voiceToolCalls = []

  // Listen for tool calls (reuse chat events since voice sends to same channel)
  window.api.auraChat.onToolCall((data) => {
    const toolCall = {
      id: data.toolCallId,
      toolName: data.toolName,
      args: data.args,
      result: null,
      status: 'running'
    }
    voiceToolCalls.push(toolCall)
    // Update chat store for live display in StateBar
    chatStore.pendingToolCalls.push(toolCall)
  })

  window.api.auraChat.onToolResult((data) => {
    const tc = voiceToolCalls.find((t) => t.id === data.toolCallId)
    if (tc) {
      tc.result = data.result
      tc.status = 'done'
    }
    // Update in chat store as well
    const storeTc = chatStore.pendingToolCalls.find((t) => t.id === data.toolCallId)
    if (storeTc) {
      storeTc.result = data.result
      storeTc.status = 'done'
    }
  })

  window.api.auraVoice.onStatus((s) => {
    if (s === 'done') {
      // Ignore 'done' status update here.
      // Wait for audio.onended to clear state.
      window.api.auraVoice.removeListeners()
      window.api.auraChat.removeListeners()
      return
    }

    chatStore.setVoiceState({ status: s })
    if (s === 'thinking') chatStore.setEmotion('think')
    if (s === 'speaking') chatStore.setEmotion('speaking')
  })

  window.api.auraVoice.onTranscript((text) => {
    chatStore.setVoiceState({ transcript: text })
    chatStore.addMessage('user', text)
  })

  window.api.auraVoice.onAiText((text) => {
    chatStore.setVoiceState({ aiText: text })
    // Add AI message with accumulated tool calls
    chatStore.addMessage('ai', text, [...voiceToolCalls])
    // Clear pending tool calls after adding to message
    chatStore.pendingToolCalls = []
  })

  window.api.auraVoice.onAudio((base64Audio) => {
    playBase64Audio(base64Audio)
  })

  window.api.auraVoice.onError((err) => {
    console.error('[Voice]', err.message)
    voiceActive.value = false
    chatStore.clearVoiceState()
    chatStore.setEmotion('normal')
    chatStore.pendingToolCalls = []
    emit('voiceEnd')
    window.api.auraVoice.removeListeners()
    window.api.auraChat.removeListeners()
  })

  const aiSettings = JSON.parse(JSON.stringify(settingsStore.state.ai))
  const chatMessages = chatStore.messages.map((m) => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.text
  }))
  window.api.auraVoice.convo({ audioBase64, settings: aiSettings, messages: chatMessages })
}

function playBase64Audio(base64) {
  const audioData = atob(base64)
  const bytes = new Uint8Array(audioData.length)
  for (let i = 0; i < audioData.length; i++) bytes[i] = audioData.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)

  // Keep state as 'speaking' until audio ends
  audio.onended = () => {
    URL.revokeObjectURL(url)
    // Audio finished, now we can clear state
    voiceActive.value = false
    chatStore.setEmotion('normal')
    chatStore.clearVoiceState()
    emit('voiceEnd')
  }

  audio.play()
}
</script>

<template>
  <div class="icon-strip">
    <!-- Toggle button -->
    <button
      class="strip-btn toggle-btn"
      :class="{ open: isOpen }"
      @click="emit('toggle')"
      title="Toggle chat"
    >
      <img :src="isOpen ? iconSidebar : iconSidebarClose" class="strip-icon" alt="toggle" />
    </button>

    <div class="strip-divider" />

    <!-- Voice button -->
    <div class="voice-wrap">
      <button
        class="strip-btn voice-btn"
        :class="{ active: voiceActive }"
        @click="toggleVoice"
        title="Voice convo"
      >
        <img
          :src="voiceActive ? iconVoiceStop : iconVoice"
          class="strip-icon voice-icon"
          alt="voice"
        />
      </button>
    </div>

    <!-- Cube button with hover tray -->
    <div class="cube-wrap" @mouseenter="openTray" @mouseleave="closeTray">
      <div
        class="app-tray"
        :class="{ visible: trayOpen }"
        @mouseenter="openTray"
        @mouseleave="closeTray"
      >
        <AppTray />
      </div>
      <button class="strip-btn cube-btn">
        <img :src="trayOpen ? iconCubeFull : iconCube" class="strip-icon" alt="apps" />
      </button>
    </div>

    <div class="strip-divider" />

    <!-- Settings -->
    <button class="strip-btn" title="Settings" @click="emit('openSettings')">
      <IconSettings :size="20" class="strip-icon" />
    </button>
  </div>
</template>

<style scoped>
.icon-strip {
  position: fixed;
  bottom: 10px;
  right: 0;
  background: linear-gradient(180deg, #26252f 0%, #1c1b23 100%);
  border-left: 1px solid rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px 0 0 0;
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 101;
  user-select: none;
  box-shadow:
    -4px -4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.icon-strip::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: -16px;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 0 0, transparent 16px, #1e1e20 16px);
}

.strip-divider {
  width: 24px;
  height: 1px;
  background: rgba(205, 198, 247, 0.08);
  margin: 4px 0;
}

.strip-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 10px;
  color: rgba(205, 198, 247, 0.3);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    box-shadow 0.15s;
}

.strip-btn:hover {
  background: rgba(205, 198, 247, 0.07);
  color: #cdc6f7;
  box-shadow: 0 0 12px rgba(160, 140, 240, 0.12);
}

.toggle-btn.open {
  color: rgba(205, 198, 247, 0.55);
}

.toggle-btn:hover {
  color: #cdc6f7 !important;
}

.strip-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  opacity: 0.45;
  transition: opacity 0.15s;
}

.toggle-btn .strip-icon {
  filter: invert(1);
}

.strip-btn:hover .strip-icon {
  opacity: 0.9;
}

.toggle-btn.open .strip-icon {
  opacity: 0.65;
}

/* ── Voice button ── */
.voice-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.voice-icon {
  width: 24px;
  height: 24px;
}

.voice-btn.active {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.3);
  box-shadow: none;
}

.voice-btn.active:hover {
  background: rgba(255, 80, 80, 0.25);
}

.voice-btn.active .strip-icon {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 80, 80, 0.4));
}

/* ── Cube hover tray ── */
.cube-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.app-tray {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%) translateX(12px);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.app-tray.visible {
  opacity: 1;
  pointer-events: all;
  transform: translateY(-50%) translateX(0);
}
</style>
