<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePluginsStore } from '../../stores/plugins'
import { Loader2, Power, PowerOff, Package, Plus, CheckCircle, XCircle } from 'lucide-vue-next'

const pluginsStore = usePluginsStore()
const { plugins, loading, error } = storeToRefs(pluginsStore)

const installing = ref(false)
const installMessage = ref(null)

onMounted(() => {
  pluginsStore.loadPlugins()
})

async function togglePlugin(plugin) {
  try {
    if (plugin.enabled) {
      await pluginsStore.disablePlugin(plugin.id)
    } else {
      await pluginsStore.enablePlugin(plugin.id)
    }
  } catch (err) {
    console.error('Failed to toggle plugin:', err)
  }
}

async function installPlugin() {
  installing.value = true
  installMessage.value = null

  try {
    const result = await pluginsStore.installPlugin()

    if (result.canceled) {
      installMessage.value = null
    } else if (result.success) {
      installMessage.value = {
        type: 'success',
        text: 'Plugin installed successfully!'
      }
      setTimeout(() => {
        installMessage.value = null
      }, 3000)
    }
  } catch (err) {
    installMessage.value = {
      type: 'error',
      text: err.message || 'Failed to install plugin'
    }
    setTimeout(() => {
      installMessage.value = null
    }, 5000)
  } finally {
    installing.value = false
  }
}
</script>

<template>
  <div class="settings-plugins">
    <div class="settings-header">
      <div class="header-content">
        <div>
          <h2 class="settings-title">Plugins</h2>
          <p class="settings-desc">Manage installed plugins to extend Aura's functionality</p>
        </div>
        <button class="install-btn" @click="installPlugin" :disabled="installing">
          <Loader2 v-if="installing" :size="18" class="spin" />
          <Plus v-else :size="18" />
          <span>{{ installing ? 'Installing...' : 'Install Plugin' }}</span>
        </button>
      </div>

      <div v-if="installMessage" class="install-message" :class="installMessage.type">
        <CheckCircle v-if="installMessage.type === 'success'" :size="16" />
        <XCircle v-else :size="16" />
        <span>{{ installMessage.text }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="24" class="spin" />
      <span>Loading plugins...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <p>Failed to load plugins: {{ error }}</p>
    </div>

    <div v-else-if="plugins.length === 0" class="empty-state">
      <Package :size="48" class="empty-icon" />
      <h3>No plugins installed</h3>
      <p>Plugins will appear here once installed in the plugins directory</p>
    </div>

    <div v-else class="plugins-list">
      <div v-for="plugin in plugins" :key="plugin.id" class="plugin-card">
        <div class="plugin-info">
          <div class="plugin-header">
            <h3 class="plugin-name">{{ plugin.name }}</h3>
            <span class="plugin-version">v{{ plugin.version }}</span>
          </div>
          <p class="plugin-desc">{{ plugin.description }}</p>
          <div class="plugin-meta">
            <span class="plugin-author">by {{ plugin.author }}</span>
            <span class="plugin-id">{{ plugin.id }}</span>
          </div>
          <div v-if="plugin.error" class="plugin-error">Error: {{ plugin.error }}</div>
        </div>

        <div class="plugin-actions">
          <button
            class="toggle-btn"
            :class="{ active: plugin.enabled }"
            @click="togglePlugin(plugin)"
            :title="plugin.enabled ? 'Disable plugin' : 'Enable plugin'"
          >
            <Power v-if="plugin.enabled" :size="18" />
            <PowerOff v-else :size="18" />
            <span>{{ plugin.enabled ? 'Enabled' : 'Disabled' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-plugins {
  padding: 24px;
}

.settings-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  color: #e0daf7;
  margin-bottom: 6px;
}

.settings-desc {
  font-size: 13px;
  color: rgba(205, 198, 247, 0.5);
  line-height: 1.5;
}

.install-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(205, 198, 247, 0.1);
  border: 1px solid rgba(205, 198, 247, 0.2);
  border-radius: 10px;
  color: #cdc6f7;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.install-btn:hover:not(:disabled) {
  background: rgba(205, 198, 247, 0.16);
  border-color: rgba(205, 198, 247, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(140, 120, 240, 0.2);
}

.install-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.install-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  animation: slideIn 0.3s ease;
}

.install-message.success {
  background: rgba(140, 220, 140, 0.12);
  border: 1px solid rgba(140, 220, 140, 0.3);
  color: #b8e6b8;
}

.install-message.error {
  background: rgba(255, 80, 80, 0.12);
  border: 1px solid rgba(255, 80, 80, 0.3);
  color: #ff7b7b;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: rgba(205, 198, 247, 0.6);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #ff7b7b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  color: rgba(205, 198, 247, 0.2);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 16px;
  font-weight: 600;
  color: rgba(205, 198, 247, 0.6);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 13px;
  color: rgba(205, 198, 247, 0.4);
  max-width: 300px;
}

.plugins-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: rgba(205, 198, 247, 0.04);
  border: 1px solid rgba(205, 198, 247, 0.1);
  border-radius: 12px;
  transition: all 0.2s;
}

.plugin-card:hover {
  background: rgba(205, 198, 247, 0.06);
  border-color: rgba(205, 198, 247, 0.15);
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.plugin-name {
  font-size: 15px;
  font-weight: 600;
  color: #e0daf7;
}

.plugin-version {
  font-size: 11px;
  color: rgba(205, 198, 247, 0.4);
  background: rgba(205, 198, 247, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.plugin-desc {
  font-size: 13px;
  color: rgba(205, 198, 247, 0.6);
  line-height: 1.5;
  margin-bottom: 8px;
}

.plugin-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: rgba(205, 198, 247, 0.4);
}

.plugin-author {
  font-style: italic;
}

.plugin-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.plugin-error {
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 80, 80, 0.1);
  border: 1px solid rgba(255, 80, 80, 0.2);
  border-radius: 6px;
  font-size: 12px;
  color: #ff7b7b;
}

.plugin-actions {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(205, 198, 247, 0.08);
  border: 1px solid rgba(205, 198, 247, 0.15);
  border-radius: 8px;
  color: rgba(205, 198, 247, 0.6);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:hover {
  background: rgba(205, 198, 247, 0.12);
  border-color: rgba(205, 198, 247, 0.25);
  color: #cdc6f7;
}

.toggle-btn.active {
  background: rgba(140, 220, 140, 0.12);
  border-color: rgba(140, 220, 140, 0.3);
  color: #b8e6b8;
}

.toggle-btn.active:hover {
  background: rgba(140, 220, 140, 0.18);
  border-color: rgba(140, 220, 140, 0.4);
}
</style>
