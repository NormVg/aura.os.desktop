<script setup>
import { reactive, ref, watch, onMounted } from 'vue'

const props = defineProps({
  id: { type: Number, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  w: { type: Number, default: 0 },
  h: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  title: { type: String, default: '' },
})

const emit = defineEmits(['move', 'resize'])

// ── Refs ───────────────────────────────────────────────────
const contentEl = ref(null)
const pos = reactive({ x: props.x, y: props.y })
const size = reactive({ w: props.w, h: props.h })

// Padding around inner content to leave room for handles
const PADDING = 48
let minW = PADDING * 2
let minH = PADDING * 2

// ── When workspace switches, props update — sync local state ─
watch(() => [props.x, props.y], ([x, y]) => { pos.x = x; pos.y = y })
watch(() => [props.w, props.h], ([w, h]) => { if (w) size.w = w; if (h) size.h = h })

// ── Measure inner content on mount ─────────────────────────
onMounted(() => {
  if (!contentEl.value) return
  const inner = contentEl.value.firstElementChild
  if (inner) {
    const rect = inner.getBoundingClientRect()
    minW = Math.max(PADDING * 2, rect.width + PADDING)
    minH = Math.max(PADDING * 2, rect.height + PADDING)
  }
  // Only set size if not already restored from store
  if (!size.w) size.w = minW
  if (!size.h) size.h = minH
})

// ── Drag (move) ────────────────────────────────────────────
let dragging = false
let dragStart = { mx: 0, my: 0, px: 0, py: 0 }

function onDragDown(e) {
  if (e.button !== 0) return
  e.stopPropagation()
  dragging = true
  dragStart = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragUp)
}

function onDragMove(e) {
  if (!dragging) return
  pos.x = dragStart.px + (e.clientX - dragStart.mx) / props.scale
  pos.y = dragStart.py + (e.clientY - dragStart.my) / props.scale
}

function onDragUp() {
  if (!dragging) return
  dragging = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragUp)
  // Persist to store
  emit('move', { id: props.id, x: pos.x, y: pos.y })
}

// ── Resize ─────────────────────────────────────────────────
let resizing = false
let resizeStart = { mx: 0, my: 0, w: 0, h: 0 }

function onResizeDown(e) {
  if (e.button !== 0) return
  e.stopPropagation()
  resizing = true
  resizeStart = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeUp)
}

function onResizeMove(e) {
  if (!resizing) return
  size.w = Math.max(minW, resizeStart.w + (e.clientX - resizeStart.mx) / props.scale)
  size.h = Math.max(minH, resizeStart.h + (e.clientY - resizeStart.my) / props.scale)
}

function onResizeUp() {
  if (!resizing) return
  resizing = false
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeUp)
  // Persist to store
  emit('resize', { id: props.id, w: size.w, h: size.h })
}

// ── Hover ──────────────────────────────────────────────────
const hovered = ref(false)
</script>

<template>
  <div class="widget" :style="{
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    width: size.w ? `${size.w}px` : 'max-content',
    height: size.h ? `${size.h}px` : 'max-content',
  }" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <!-- Drag handle — top-right -->
    <div class="drag-handle" :class="{ visible: hovered }" @mousedown="onDragDown" title="Drag">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5" cy="5" r="1.4" fill="currentColor" />
        <circle cx="11" cy="5" r="1.4" fill="currentColor" />
        <circle cx="5" cy="11" r="1.4" fill="currentColor" />
        <circle cx="11" cy="11" r="1.4" fill="currentColor" />
      </svg>
    </div>

    <!-- Content slot — measured on mount -->
    <div ref="contentEl" class="widget-content">
      <slot />
    </div>

    <!-- Resize handle — bottom-right -->
    <div class="resize-handle" :class="{ visible: hovered }" @mousedown="onResizeDown" title="Resize">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <line x1="3" y1="11" x2="11" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="7" y1="11" x2="11" y2="7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.widget {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.2) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 20px 60px rgba(0, 0, 0, 0.55),
    0 4px 16px rgba(0, 0, 0, 0.35);
  will-change: transform;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.widget:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow:
    0 2px 0 rgba(255, 255, 255, 0.26) inset,
    0 -1px 0 rgba(0, 0, 0, 0.2) inset,
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 4px 16px rgba(0, 0, 0, 0.35);
}

/* ── Drag handle ── */
.drag-handle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.3);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
}

.drag-handle.visible {
  opacity: 1;
}

.drag-handle:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.7);
}

.drag-handle:active {
  cursor: grabbing;
}

/* ── Content ── */
.widget-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Resize handle ── */
.resize-handle {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.25);
  cursor: nwse-resize;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
  z-index: 10;
}

.resize-handle.visible {
  opacity: 1;
}

.resize-handle:hover {
  color: rgba(255, 255, 255, 0.6);
}
</style>
