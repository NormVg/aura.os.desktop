<script setup>
import { useChatStore } from '../stores/chat'

defineProps({
  suggestions: { type: Array, default: () => [] }
})

const emit = defineEmits(['select'])
const chatStore = useChatStore()

function removeContextMessage(messageId) {
  chatStore.removeContextMessage(messageId)
}
</script>

<template>
  <div v-if="suggestions.length" class="rc-bar">
    <TransitionGroup name="chip">
      <div v-for="s in suggestions" :key="s.id" class="rc-chip">
        <span class="rc-prefix">context</span>
        <span class="rc-label">{{ s.label }}</span>
        <button class="rc-remove" @click.stop="removeContextMessage(s.messageId)" title="Remove">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 2l6 6M8 2l-6 6"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Outer container */
.rc-bar {
  display: flex;
  gap: 8px;
  padding: 5px;
  background: rgba(20, 19, 26, 0.7);
  border: 1px solid rgba(205, 198, 247, 0.07);
  border-radius: 12px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(205, 198, 247, 0.2) transparent;
  margin-bottom: 10px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rc-bar::-webkit-scrollbar {
  height: 6px;
}

.rc-bar::-webkit-scrollbar-track {
  background: transparent;
}

.rc-bar::-webkit-scrollbar-thumb {
  background: rgba(205, 198, 247, 0.2);
  border-radius: 3px;
}

.rc-bar::-webkit-scrollbar-thumb:hover {
  background: rgba(205, 198, 247, 0.3);
}

/* Each chip */
.rc-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 225px;
  height: 36px;
  padding: 0 14px;
  background: linear-gradient(135deg, rgba(205, 198, 247, 0.06) 0%, rgba(30, 28, 38, 0.9) 100%);
  border: 1px solid rgba(205, 198, 247, 0.09);
  border-radius: 9px;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.25),
    0 1px 0 rgba(255, 255, 255, 0.04) inset;
}

.rc-chip:hover {
  background: linear-gradient(135deg, rgba(205, 198, 247, 0.1) 0%, rgba(35, 33, 45, 0.95) 100%);
  border-color: rgba(205, 198, 247, 0.16);
  transform: translateY(-1px);
  box-shadow:
    0 4px 16px rgba(140, 120, 240, 0.14),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.rc-chip:active {
  transform: translateY(0);
  transition: all 0.1s;
}

/* Chip enter/leave animations */
.chip-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chip-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.chip-enter-from {
  opacity: 0;
  transform: scale(0.8) translateX(-20px);
}

.chip-leave-to {
  opacity: 0;
  transform: scale(0.8) translateX(20px);
}

.chip-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* "replying" — muted */
.rc-prefix {
  font-size: 11px;
  font-family: 'Inter', sans-serif;
  color: rgba(205, 198, 247, 0.32);
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

/* Bold label */
.rc-label {
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: rgba(205, 198, 247, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Remove button */
.rc-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(205, 198, 247, 0.06);
  border: 1px solid rgba(205, 198, 247, 0.1);
  color: rgba(205, 198, 247, 0.4);
  cursor: pointer;
  opacity: 0;
  margin-left: auto;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(0.8);
}

.rc-chip:hover .rc-remove {
  opacity: 1;
  transform: scale(1);
}

.rc-remove:hover {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 80, 80, 0.2);
  color: #ff7b7b;
  transform: scale(1.1) rotate(90deg);
}

.rc-remove:active {
  transform: scale(0.95) rotate(90deg);
}
</style>
