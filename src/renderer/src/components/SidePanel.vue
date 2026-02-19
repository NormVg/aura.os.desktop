<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import ChatSidebar from './ChatSidebar.vue'
import IconStrip from './IconStrip.vue'
import SettingsModal from './SettingsModal.vue'
import { useWorkspaceStore } from '../stores/workspaces.js'

defineEmits(['voiceStart', 'voiceEnd'])

const wsStore = useWorkspaceStore()
const isOpen = ref(wsStore.state.sidePanelOpen !== undefined ? wsStore.state.sidePanelOpen : true)
const MIN_W = 700
const MAX_W = 900
const panelWidth = ref(Math.max(MIN_W, wsStore.state.sidePanelWidth || 700))

const showSettings = ref(false)
const isResizing = ref(false)

let _syncing = false
watch(isOpen, v => { if (!_syncing) { _syncing = true; wsStore.updateSidePanel(v, undefined); _syncing = false } })
watch(panelWidth, v => { if (!_syncing) { _syncing = true; wsStore.updateSidePanel(undefined, v); _syncing = false } })
watch(() => wsStore.state.sidePanelOpen, v => { if (!_syncing && v !== undefined) { _syncing = true; isOpen.value = v; _syncing = false } })
watch(() => wsStore.state.sidePanelWidth, v => { if (!_syncing && v !== undefined) { _syncing = true; panelWidth.value = v; _syncing = false } })

function toggle() { isOpen.value = !isOpen.value }

function closeSidebar() { isOpen.value = false }
defineExpose({ closeSidebar, isOpen })

function startResize(e) {
  if (!isOpen.value) return
  e.preventDefault()
  isResizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function doResize(e) {
  if (!isResizing.value) return
  const w = window.innerWidth - e.clientX
  panelWidth.value = Math.min(MAX_W, Math.max(MIN_W, w))
}

function endResize() {
  if (!isResizing.value) return
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', endResize)
})
onUnmounted(() => {
  window.removeEventListener('mousemove', doResize)
  window.removeEventListener('mouseup', endResize)
})
</script>

<template>
  <!-- Chat panel — slides in/out from right -->
  <div class="chat-panel" :class="{ closed: !isOpen }" :style="{ width: panelWidth + 'px' }">
    <div class="resize-handle" @mousedown="startResize" />
    <div class="chat-area">
      <div class="grid-gg" />
      <ChatSidebar />
    </div>
    <div class="curve-left" />
  </div>

  <IconStrip :isOpen="isOpen" @toggle="toggle" @openSettings="showSettings = true" @voiceStart="$emit('voiceStart')"
    @voiceEnd="$emit('voiceEnd')" />

  <SettingsModal :isOpen="showSettings" @close="showSettings = false" />
</template>

<style scoped>
/* ── Chat panel ── */
.chat-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 10px;
  background: linear-gradient(160deg, rgba(32, 31, 40, 0.82) 0%, rgba(22, 21, 28, 0.92) 100%);
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  border-left: 1px solid rgba(205, 198, 247, 0.07);
  border-radius: 10px 0 0 10px;
  box-shadow:
    -8px 0 40px rgba(0, 0, 0, 0.55),
    -1px 0 0 rgba(255, 255, 255, 0.04) inset,
    0 0 80px rgba(140, 120, 240, 0.04) inset;
  display: flex;
  flex-direction: row;
  z-index: 100;
  user-select: none;
  overflow: hidden;
  transform: translateX(0);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
  opacity: 1;
}

.chat-panel.closed {
  transform: translateX(100%);
  opacity: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(205, 198, 247, 0.08);
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.grid-gg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.chat-area :deep(.chat-wrap) {
  position: relative;
  z-index: 1;
}

.curve-left {
  position: absolute;
  bottom: 0;
  left: -16px;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 0 0, transparent 16px, #1e1e22 16px);
  pointer-events: none;
}
</style>
