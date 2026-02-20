<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps({
  initialPanX: { type: Number, default: 0 },
  initialPanY: { type: Number, default: 0 },
  initialScale: { type: Number, default: 1 }
})

const emit = defineEmits(['scale', 'pan'])

// ── State ──────────────────────────────────────────────────
const offset = reactive({ x: props.initialPanX, y: props.initialPanY })
const scale = ref(props.initialScale)

// Emit changes so parent can persist per-workspace
let scaleT = null
watch(scale, (s) => {
  clearTimeout(scaleT)
  scaleT = setTimeout(() => emit('scale', s), 100)
})

let panT = null
watch(offset, (o) => {
  clearTimeout(panT)
  panT = setTimeout(() => emit('pan', { x: o.x, y: o.y }), 100)
})

const ZOOM_MIN = 0.15
const ZOOM_MAX = 4
const ZOOM_SPEED = 0.001

// ── Derived transform ──────────────────────────────────────
const transform = computed(() => `translate(${offset.x}px, ${offset.y}px) scale(${scale.value})`)

const gridBgPos = computed(() => {
  const size = 18 * scale.value
  const x = ((offset.x % size) + size) % size
  const y = ((offset.y % size) + size) % size
  return `${x}px ${y}px`
})

const gridBgSize = computed(() => {
  const size = 18 * scale.value
  return `${size}px ${size}px`
})

// ── Pan ────────────────────────────────────────────────────
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })

function startPan(e) {
  const isWidgetClick = e.target.closest('.widget')

  // Pan on Middle Click (1), Alt+Left Click, or Left Click (0) directly on the empty canvas
  if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && !isWidgetClick)) {
    e.preventDefault()
    isPanning.value = true
    panStart.x = e.clientX - offset.x
    panStart.y = e.clientY - offset.y
  }
}

function doPan(e) {
  if (!isPanning.value) return
  offset.x = e.clientX - panStart.x
  offset.y = e.clientY - panStart.y
}

function endPan() {
  isPanning.value = false
}

// ── Zoom ───────────────────────────────────────────────────
const canvasEl = ref(null)

function onWheel(e) {
  // If hovering over a widget, allow normal scroll, unless they are holding Cmd/Ctrl to explicitly zoom.
  const isWidget = e.target.closest('.widget')
  if (isWidget && !e.ctrlKey && !e.metaKey) {
    return // Skip zooming, let the wheel event scroll the widget natively
  }

  e.preventDefault()
  const rect = canvasEl.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const delta = -e.deltaY * ZOOM_SPEED
  const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale.value * (1 + delta)))
  const ratio = newScale / scale.value
  offset.x = mouseX - ratio * (mouseX - offset.x)
  offset.y = mouseY - ratio * (mouseY - offset.y)
  scale.value = newScale
}

// ── Prevent Alt from triggering browser menu ──────────────
function onKeyDown(e) {
  if (e.code === 'AltLeft' || e.code === 'AltRight') e.preventDefault()
}

const cursor = computed(() => (isPanning.value ? 'grabbing' : 'default'))

// ── Lifecycle ──────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('mouseup', endPan)
  window.addEventListener('mousemove', doPan)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mouseup', endPan)
  window.removeEventListener('mousemove', doPan)
})
</script>

<template>
  <div
    ref="canvasEl"
    class="canvas-root"
    :style="{ cursor }"
    @mousedown="startPan"
    @wheel="onWheel"
  >
    <div
      class="canvas-grid"
      :style="{
        backgroundPosition: gridBgPos,
        backgroundSize: gridBgSize
      }"
    />
    <div class="canvas-world" :style="{ transform }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.canvas-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  user-select: none;
}

.canvas-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
}

.canvas-world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}
</style>
