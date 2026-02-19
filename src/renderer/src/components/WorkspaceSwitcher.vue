<script setup>
import { ref } from 'vue'
import { useWorkspaceStore } from '../stores/workspaces.js'

const emit = defineEmits(['expand'])
const ws = useWorkspaceStore()

// ── Rename ─────────────────────────────────────────────────
const editingId = ref(null)
const editLabel = ref('')

function startRename(workspace) {
  editingId.value = workspace.id
  editLabel.value = workspace.label
}

function commitRename(id) {
  ws.renameWorkspace(id, editLabel.value)
  editingId.value = null
}

function cancelRename() {
  editingId.value = null
}
</script>

<template>
  <div class="ws-switcher">
    <!-- Workspace tabs -->
    <div v-for="workspace in ws.state.workspaces" :key="workspace.id" class="ws-tab"
      :class="{ active: ws.state.activeId === workspace.id }">
      <!-- Inline rename input -->
      <input v-if="editingId === workspace.id" class="ws-rename-input" v-model="editLabel"
        @keydown.enter="commitRename(workspace.id)" @keydown.escape="cancelRename" @blur="commitRename(workspace.id)"
        v-focus />
      <!-- Label button -->
      <button v-else class="ws-btn" @click="ws.setActive(workspace.id)" @dblclick="startRename(workspace)">
        {{ workspace.label }}
      </button>

      <!-- Delete button (only when active and more than 1 workspace) -->
      <button v-if="ws.state.activeId === workspace.id && ws.state.workspaces.length > 1" class="ws-delete"
        title="Delete workspace" @click.stop="ws.deleteWorkspace(workspace.id)">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- Add workspace -->
    <button class="ws-add" title="New workspace" @click="ws.createWorkspace()">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      </svg>
    </button>

    <div class="ws-divider" />

    <!-- Expand -->
    <button class="ws-btn expand-btn" title="Expand" @click="emit('expand')">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  </div>
</template>

<!-- Auto-focus directive for rename input -->
<script>
export default {
  directives: {
    focus: {
      mounted(el) { el.focus(); el.select() }
    }
  }
}
</script>

<style scoped>
.ws-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
}

/* Tab wrapper holds label + delete */
.ws-tab {
  display: flex;
  align-items: center;
  border-radius: 7px;
  transition: background 0.12s;
}

.ws-tab.active {
  background: rgba(205, 198, 247, 0.1);
}

.ws-btn {
  height: 26px;
  padding: 0 10px;
  background: none;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: rgba(205, 198, 247, 0.4);
  cursor: pointer;
  transition: color 0.12s;
  white-space: nowrap;
}

.ws-tab:hover .ws-btn,
.ws-tab.active .ws-btn {
  color: #cdc6f7;
}

.ws-tab:not(.active):hover {
  background: rgba(205, 198, 247, 0.07);
}

/* Inline rename input */
.ws-rename-input {
  height: 22px;
  padding: 0 8px;
  background: rgba(205, 198, 247, 0.1);
  border: 1px solid rgba(205, 198, 247, 0.25);
  border-radius: 5px;
  font-size: 12px;
  font-family: 'Inter', sans-serif;
  color: #cdc6f7;
  outline: none;
  width: 80px;
  margin: 0 4px;
}

/* Delete × button */
.ws-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  background: none;
  border: none;
  border-radius: 4px;
  color: rgba(205, 198, 247, 0.3);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}

.ws-delete:hover {
  background: rgba(255, 80, 80, 0.15);
  color: #ff6b6b;
}

/* Add + button */
.ws-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: none;
  border: none;
  border-radius: 6px;
  color: rgba(205, 198, 247, 0.35);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  margin-left: 2px;
}

.ws-add:hover {
  background: rgba(205, 198, 247, 0.1);
  color: #cdc6f7;
}

.ws-divider {
  width: 1px;
  height: 16px;
  background: rgba(205, 198, 247, 0.12);
  margin: 0 4px;
}

.expand-btn {
  width: 26px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
