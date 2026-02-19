<script setup>
// App Tray — standalone app launcher, independent of workspaces
import { FileText, Clock } from 'lucide-vue-next'
import { useWorkspaceStore } from '../stores/workspaces'

const wsStore = useWorkspaceStore()

const appItems = [
  { id: 'note', label: 'Note', icon: FileText, color: '#FFB74D' },
  { id: 'clock', label: 'Clock', icon: Clock, color: '#4EC9E8' },
  // { id: 'browser', label: 'Browser', icon: Globe, color: '#4CAF50' }, // Future
]

function launch(app) {
  if (app.id === 'note') {
    wsStore.addWidget({ type: 'note', w: 300, h: 240, data: { content: '' } })
  } else if (app.id === 'clock') {
    wsStore.addWidget({ type: 'clock', w: 240, h: 140 })
  }
}
</script>

<template>
  <div class="tray-inner">
    <button v-for="app in appItems" :key="app.id" class="tray-item" :title="app.label" @click="launch(app)">
      <component :is="app.icon" :size="22" :stroke="app.color" />
    </button>
  </div>
</template>

<style scoped>
.tray-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(30, 30, 34, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  max-width: 320px;
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
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s, background 0.15s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tray-item:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
</style>
