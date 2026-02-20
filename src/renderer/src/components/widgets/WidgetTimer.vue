<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useWorkspaceStore } from '../../stores/workspaces'
import { Play, Pause, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  id: { type: Number, required: true },
  data: { type: Object, default: () => ({}) }
})

const wsStore = useWorkspaceStore()

// Timer state
const minutes = ref(props.data?.minutes ?? 5)
const seconds = ref(props.data?.seconds ?? 0)
const isRunning = ref(false)
const totalSeconds = ref(minutes.value * 60 + seconds.value)
const remainingSeconds = ref(totalSeconds.value)

let intervalId = null

const displayTime = computed(() => {
  const mins = Math.floor(remainingSeconds.value / 60)
  const secs = remainingSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const progress = computed(() => {
  if (totalSeconds.value === 0) return 0
  return ((totalSeconds.value - remainingSeconds.value) / totalSeconds.value) * 100
})

function start() {
  if (isRunning.value) return

  isRunning.value = true
  intervalId = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    } else {
      stop()
      // Timer finished - could add notification here
      console.log('[Timer] Finished!')
    }
  }, 1000)
}

function pause() {
  isRunning.value = false
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function reset() {
  pause()
  totalSeconds.value = minutes.value * 60 + seconds.value
  remainingSeconds.value = totalSeconds.value
  saveTimer()
}

function setTimer() {
  pause()
  totalSeconds.value = minutes.value * 60 + seconds.value
  remainingSeconds.value = totalSeconds.value
  saveTimer()
}

function saveTimer() {
  wsStore.updateWidget(props.id, {
    data: {
      minutes: minutes.value,
      seconds: seconds.value
    }
  })
}

watch(
  () => props.data,
  (newData) => {
    if (newData && typeof newData === 'object') {
      if (newData.minutes !== undefined) minutes.value = newData.minutes
      if (newData.seconds !== undefined) seconds.value = newData.seconds
      totalSeconds.value = minutes.value * 60 + seconds.value
      if (!isRunning.value) {
        remainingSeconds.value = totalSeconds.value
      }
    }
  },
  { deep: true }
)

onMounted(() => {
  window.addEventListener('aura:widget:start', handleRemoteStart)
  window.addEventListener('aura:widget:stop', handleRemoteStop)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  window.removeEventListener('aura:widget:start', handleRemoteStart)
  window.removeEventListener('aura:widget:stop', handleRemoteStop)
})

function handleRemoteStart(e) {
  if (e.detail?.id === props.id) start()
}

function handleRemoteStop(e) {
  if (e.detail?.id === props.id) pause()
}
</script>

<template>
  <div class="timer-widget">
    <div class="timer-display">
      <div class="time-text">{{ displayTime }}</div>
      <div class="progress-ring">
        <svg width="150" height="150" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r="82"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            stroke-width="5"
          />
          <circle
            cx="90"
            cy="90"
            r="82"
            fill="none"
            stroke="#7c6aff"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="515.22"
            :stroke-dashoffset="515.22 * (1 - progress / 100)"
            transform="rotate(-90 90 90)"
            style="transition: stroke-dashoffset 0.3s ease"
          />
        </svg>
      </div>
    </div>

    <div class="timer-controls">
      <button v-if="!isRunning" @click="start" class="control-btn primary">
        <Play :size="16" />
      </button>
      <button v-else @click="pause" class="control-btn primary">
        <Pause :size="16" />
      </button>
      <button @click="reset" class="control-btn">
        <RotateCcw :size="16" />
      </button>
    </div>

    <div class="timer-inputs">
      <div class="input-group">
        <input v-model.number="minutes" type="number" min="0" max="99" @change="setTimer" />
        <span class="input-label">min</span>
      </div>
      <span class="separator">:</span>
      <div class="input-group">
        <input v-model.number="seconds" type="number" min="0" max="59" @change="setTimer" />
        <span class="input-label">sec</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0;
}

.timer-display {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 0 12px rgba(124, 106, 255, 0.4));
  /* Neon glow effect */
}

.time-text {
  font-size: 38px;
  font-weight: 200;
  /* Ultra-light */
  color: #fff;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0em;
  z-index: 1;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.timer-controls {
  display: flex;
  gap: 16px;
  /* slightly more spaced out */
}

/* Glassmorphism control buttons */
.control-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  /* very subtle */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(8px);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
  transform: scale(1.08);
  /* slight pop on hover */
}

.control-btn:active {
  transform: scale(0.95);
}

/* Primary play/pause button */
.control-btn.primary {
  background: rgba(124, 106, 255, 0.15);
  border-color: rgba(124, 106, 255, 0.3);
  color: #fff;
}

.control-btn.primary:hover {
  background: rgba(124, 106, 255, 0.25);
  border-color: rgba(124, 106, 255, 0.5);
  box-shadow: 0 8px 24px rgba(124, 106, 255, 0.25);
}

.timer-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -8px;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.input-group input {
  width: 54px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  /* almost transparent */
  border: 1px solid transparent;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
  color: #fff;
  font-size: 18px;
  font-weight: 300;
  text-align: center;
  outline: none;
  transition: all 0.2s ease;
}

.input-group input:focus,
.input-group input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-bottom-color: #7c6aff;
}

/* Hide number arrows */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 4px;
}

.separator {
  font-size: 20px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
  transform: translateY(-8px);
}
</style>
