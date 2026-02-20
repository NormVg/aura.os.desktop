<script setup>
// App Tray — standalone app launcher, independent of workspaces
import { FileText, Clock, GitBranch, CheckSquare, Image, Timer, Globe } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspaces'

const wsStore = useWorkspaceStore()

const appItems = [
  { id: 'note', label: 'Note', icon: FileText, color: '#FFB74D' },
  { id: 'todo', label: 'Todo', icon: CheckSquare, color: '#66BB6A' },
  { id: 'mermaid', label: 'Diagram', icon: GitBranch, color: '#7c6aff' },
  { id: 'image', label: 'Image', icon: Image, color: '#EC407A' },
  { id: 'timer', label: 'Timer', icon: Timer, color: '#FF7043' },
  { id: 'webview', label: 'Web', icon: Globe, color: '#AB47BC' },
  { id: 'clock', label: 'Clock', icon: Clock, color: '#42A5F5' }
]

function launch(app) {
  if (app.id === 'note') {
    wsStore.addWidget({ type: 'note', w: 400, h: 300, data: { content: '' } })
  } else if (app.id === 'clock') {
    wsStore.addWidget({ type: 'clock', w: 240, h: 140 })
  } else if (app.id === 'mermaid') {
    wsStore.addWidget({
      type: 'mermaid',
      w: 500,
      h: 400,
      data: `graph TD
A[Start] --> B[Process]
B --> C[End]`
    })
  } else if (app.id === 'todo') {
    wsStore.addWidget({
      type: 'todo',
      w: 350,
      h: 400,
      data: { items: [] }
    })
  } else if (app.id === 'image') {
    wsStore.addWidget({
      type: 'image',
      w: 450,
      h: 400,
      data: { imageUrl: '', imageName: '' }
    })
  } else if (app.id === 'timer') {
    wsStore.addWidget({
      type: 'timer',
      w: 280,
      h: 320,
      data: { minutes: 5, seconds: 0 }
    })
  } else if (app.id === 'webview') {
    wsStore.addWidget({
      type: 'webview',
      w: 600,
      h: 500,
      data: { url: 'https://google.com' }
    })
  }
}
</script>

<template>
  <div class="tray-inner">
    <button
      v-for="app in appItems"
      :key="app.id"
      class="tray-item"
      :title="app.label"
      :style="{ '--icon-color': app.color }"
      @click="launch(app)"
    >
      <component :is="app.icon" :size="20" color="#ffffff" stroke-width="2.5" />
    </button>
  </div>
</template>

<style scoped>
.tray-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(20, 20, 24, 0.6);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tray-inner::-webkit-scrollbar {
  display: none;
}

.tray-item {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.tray-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--icon-color);
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: -1;
}

.tray-item:hover {
  transform: translateY(-2px) scale(1.05);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.tray-item:hover::before {
  opacity: 0.1;
  /* Subtle tint of the icon color on hover */
}
</style>
