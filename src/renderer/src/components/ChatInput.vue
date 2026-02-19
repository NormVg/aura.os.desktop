<script setup>
import { ref, watch } from 'vue'
import watermark from '../assets/watermark.png'
import iconVoice from '../assets/icons/voice.svg'
import iconVoiceStop from '../assets/icons/voice-stop.svg'
import iconAttach from '../assets/icons/attachment.svg'
import iconEnter from '../assets/icons/enter.svg'
import { useVoice } from '../composables/useVoice'

const emit = defineEmits(['send'])
const input = ref('')
const textareaEl = ref(null)

// Voice
const { isRecording, transcript, toggleRecording } = useVoice()

// When transcript arrives, fill input
watch(transcript, (t) => {
  if (t) {
    input.value = t
    transcript.value = ''
    autoResize()
  }
})

function autoResize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function send() {
  const text = input.value.trim()
  if (!text) return
  emit('send', text)
  input.value = ''
  if (textareaEl.value) textareaEl.value.style.height = 'auto'
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function focus() {
  textareaEl.value?.focus()
}

// Expose focus method to parent
defineExpose({ focus })
</script>

<template>
  <div class="ci-outer">
    <div class="ci-inner">
      <!-- Reply context bar -->
      <div v-if="replyingTo" class="ci-reply-bar">
        <div class="ci-reply-content">
          <span class="ci-reply-label">Replying to:</span>
          <span class="ci-reply-text">{{ replyingTo.label }}</span>
        </div>
        <button class="ci-reply-close" @click="removeReply" title="Cancel reply">
          <X :size="12" />
        </button>
      </div>

      <!-- Watermark logo — image only, bottom-right -->
      <img :src="watermark" class="ci-watermark" alt="" />

      <!-- Text input -->
      <textarea ref="textareaEl" v-model="input" class="ci-textarea" placeholder="Can you please send me the report"
        rows="1" @keydown="onKeydown" @input="autoResize" />

      <!-- Top-right action icons -->
      <div class="ci-actions">
        <!-- Waveform / voice -->
        <button class="ci-icon" :class="{ recording: isRecording }" title="Voice" @click="toggleRecording">
          <img :src="isRecording ? iconVoiceStop : iconVoice" class="ci-icon-img" alt="voice" />
        </button>

        <!-- Paperclip / attach -->
        <button class="ci-icon" title="Attach">
          <img :src="iconAttach" class="ci-icon-img" alt="attach" />
        </button>

        <!-- Send -->
        <button class="ci-send" title="Send" @click="send">
          <img :src="iconEnter" class="ci-send-img" alt="send" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Outer border shell ── */
.ci-outer {
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px;
  position: relative;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

/* ── Inner dark container ── */
.ci-inner {
  background: rgba(22, 21, 30, 0.88);
  border-radius: 14px;
  min-height: 100px;
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset;
}

/* ── Reply context bar ── */
.ci-reply-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: rgba(205, 198, 247, 0.06);
  border: 1px solid rgba(205, 198, 247, 0.1);
  border-radius: 8px;
  font-size: 11px;
}

.ci-reply-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.ci-reply-label {
  color: rgba(205, 198, 247, 0.4);
  font-weight: 500;
  flex-shrink: 0;
}

.ci-reply-text {
  color: rgba(205, 198, 247, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ci-reply-close {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  color: rgba(205, 198, 247, 0.4);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

.ci-reply-close:hover {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 80, 80, 0.2);
  color: #ff7b7b;
}

/* ── Watermark — image only ── */
.ci-watermark {
  position: absolute;
  bottom: -35px;
  right: -14px;
  width: 90px;
  height: 90px;
  object-fit: contain;
  opacity: 0.15;
  pointer-events: none;
  user-select: none;
}

/* ── Textarea ── */
.ci-textarea {
  width: calc(100% - 120px);
  background: none;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: rgba(205, 198, 247, 0.5);
  line-height: 1.5;
  min-height: 22px;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: none;
}

.ci-textarea::-webkit-scrollbar {
  display: none;
}

.ci-textarea::placeholder {
  color: rgba(205, 198, 247, 0.22);
}

/* ── Actions — top-right ── */
.ci-actions {
  position: absolute;
  top: 16px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.ci-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgba(180, 175, 210, 0.5);
  cursor: pointer;
  transition: color 0.12s;
  padding: 0;
}

.ci-icon:hover {
  color: rgba(205, 198, 247, 0.85);
}

.ci-icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  opacity: 0.7;
  transition: opacity 0.12s;
}

.ci-icon:hover .ci-icon-img {
  opacity: 1;
}

/* ── Send diamond ── */
.ci-send {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.12s;
}

.ci-send:hover {
  opacity: 0.8;
}

.ci-send-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

/* ── Recording indicator ── */
.ci-icon.recording {
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.3);
  border-radius: 8px;
}

.ci-icon.recording:hover {
  background: rgba(255, 80, 80, 0.25);
}

.ci-icon.recording .ci-icon-img {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 80, 80, 0.4));
}
</style>
