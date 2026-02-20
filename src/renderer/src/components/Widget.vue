<script setup>
import { reactive, ref, watch, onMounted, provide } from 'vue'
import { Edit2, Eye, Trash2 } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspaces.js'

const props = defineProps({
  id: { type: Number, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  w: { type: Number, default: 0 },
  h: { type: Number, default: 0 },
  scale: { type: Number, default: 1 },
  title: { type: String, default: '' },
  type: { type: String, default: '' }
})

const emit = defineEmits(['move', 'resize'])
const wsStore = useWorkspaceStore()

// ── Refs ───────────────────────────────────────────────────
const contentEl = ref(null)
const pos = reactive({ x: props.x, y: props.y })
const size = reactive({ w: props.w, h: props.h })

const isEditing = ref(false)
function toggleEdit() {
  isEditing.value = !isEditing.value
}

// Only show edit toggle for Note, Mermaid, Image, and Webview
const supportsEditing = ref(
  props.type === 'note' ||
    props.type === 'mermaid' ||
    props.type === 'image' ||
    props.type === 'webview'
)

// Editing state is now passed via scoped slot

// Padding around inner content to leave room for handles
const PADDING = 48
let minW = PADDING * 2
let minH = PADDING * 2

// ── When workspace switches, props update — sync local state ─
watch(
  () => [props.x, props.y],
  ([x, y]) => {
    pos.x = x
    pos.y = y
  }
)
watch(
  () => [props.w, props.h],
  ([w, h]) => {
    if (w) size.w = w
    if (h) size.h = h
  }
)

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

// Delete Widget
function deleteWidget() {
  wsStore.removeWidget(props.id)
}

// ── Hover ──────────────────────────────────────────────────
const hovered = ref(false)
</script>

<template>
  <div
    class="widget"
    :style="{
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      width: size.w ? `${size.w}px` : 'max-content',
      height: size.h ? `${size.h}px` : 'max-content'
    }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- Floating Action Menu (top-left) -->
    <div class="floating-action-menu" :class="{ visible: hovered }">
      <button
        v-if="supportsEditing"
        class="action-btn"
        @click.stop="toggleEdit"
        :title="isEditing ? 'View Mode' : 'Edit Mode'"
      >
        <Eye v-if="isEditing" :size="14" />
        <Edit2 v-else :size="14" />
        <span>{{ isEditing ? 'View' : 'Edit' }}</span>
      </button>
      <button class="action-btn danger" @click.stop="deleteWidget" title="Delete Widget">
        <Trash2 :size="14" />
      </button>
    </div>

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
    <div ref="contentEl" class="widget-content" :class="{ 'is-editing': isEditing }">
      <slot :isEditing="isEditing" :toggleEdit="toggleEdit" />
    </div>

    <!-- Resize handle — bottom-right -->
    <div
      class="resize-handle"
      :class="{ visible: hovered }"
      @mousedown="onResizeDown"
      title="Resize"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <line
          x1="3"
          y1="11"
          x2="11"
          y2="3"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
        <line
          x1="7"
          y1="11"
          x2="11"
          y2="7"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.widget {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 24px;
  background: rgba(30, 30, 34, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  will-change: transform;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
  /* Removed overflow: hidden so the menu can sit outside */
}

.widget:hover {
  border-color: rgba(124, 106, 255, 0.3);
  box-shadow:
    0 8px 12px rgba(0, 0, 0, 0.15),
    0 24px 48px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 20px rgba(124, 106, 255, 0.15);
}

/* ── Floating Action Menu ── */
.floating-action-menu {
  position: absolute;
  /* Sit right outside the bottom edge */
  bottom: -42px;
  left: 12px;
  z-index: 20;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(-8px);
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}

/* Invisible bridge hover gap to prevent mouseleave when moving from widget to menu */
.floating-action-menu::before {
  content: '';
  position: absolute;
  top: -24px;
  /* Cover the gap to the widget */
  left: 0;
  right: 0;
  height: 24px;
  background: transparent;
}

.floating-action-menu.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(30, 30, 34, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  color: #cdc6f7;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn span {
  margin-top: 1px;
}

.action-btn:hover {
  background: rgba(124, 106, 255, 0.3);
  border-color: rgba(124, 106, 255, 0.5);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.action-btn:active {
  transform: translateY(1px);
}

.action-btn.danger:hover {
  background: rgba(224, 108, 117, 0.25);
  border-color: rgba(224, 108, 117, 0.5);
  color: #e06c75;
}

/* ── Drag handle ── */
.drag-handle {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 48px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0);
  /* Hidden SVGs, we will use a sleek line */
  cursor: grab;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.drag-handle::after {
  content: '';
  display: block;
  width: 32px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.3);
  transition:
    background 0.3s ease,
    width 0.3s ease;
}

.drag-handle.visible {
  opacity: 1;
}

.drag-handle:hover::after {
  background: rgba(255, 255, 255, 0.7);
  width: 40px;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:active::after {
  background: #7c6aff;
}

/* Hide old dots */
.drag-handle svg {
  display: none;
}

/* ── Content ── */
.widget-content {
  width: 100%;
  height: 100%;
  padding: 24px 20px 24px 20px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 24px;
  transition: padding 0.3s ease;
}

.widget-content.is-editing {
  /* Extra padding not needed now that the menu is completely outside */
  padding-top: 24px;
}

/* ── Resize handle ── */
.resize-handle {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.2);
  cursor: nwse-resize;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    color 0.3s ease,
    transform 0.2s ease;
  z-index: 10;
}

.resize-handle.visible {
  opacity: 1;
}

.resize-handle:hover {
  color: #7c6aff;
  transform: scale(1.1);
}

/* Redesign Chevron Resize SVG */
.resize-handle svg {
  width: 14px;
  height: 14px;
}
</style>
