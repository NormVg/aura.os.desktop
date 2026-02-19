<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { storeToRefs } from 'pinia'
import { Plus, X, Settings as IconSettings, Palette as IconPalette, Info as IconInfo, Sparkles as IconBot, Brain as IconBrain, Package as IconPackage } from 'lucide-vue-next'
import SettingsGeneral from './settings/SettingsGeneral.vue'
import SettingsAppearance from './settings/SettingsAppearance.vue'
import SettingsAbout from './settings/SettingsAbout.vue'
import SettingsAI from './settings/SettingsAI.vue'
import SettingsPersonality from './settings/SettingsPersonality.vue'
import SettingsPlugins from './settings/SettingsPlugins.vue'

const props = defineProps(['isOpen'])
const emit = defineEmits(['close'])

const store = useSettingsStore()
const { state } = storeToRefs(store)

const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'General', icon: IconSettings, component: SettingsGeneral },
  { id: 'appearance', label: 'Appearance', icon: IconPalette, component: SettingsAppearance },
  { id: 'ai', label: 'Models & Voice', icon: IconBot, component: SettingsAI },
  { id: 'personality', label: 'Personality', icon: IconBrain, component: SettingsPersonality },
  { id: 'plugins', label: 'Plugins', icon: IconPackage, component: SettingsPlugins },
  { id: 'about', label: 'About', icon: IconInfo, component: SettingsAbout },
]

function close() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <!-- Sidebar -->
        <div class="modal-sidebar">
          <div class="sidebar-header">Settings</div>
          <button v-for="tab in tabs" :key="tab.id" class="sidebar-item" :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id">
            <component :is="tab.icon" :size="16" class="tab-icon" />
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Main Content -->
        <div class="modal-main">
          <button class="close-btn" @click="close">
            <X :size="18" />
          </button>


          <Transition name="fade" mode="out-in">
            <component :is="tabs.find(t => t.id === activeTab)?.component" :key="activeTab" />
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 1000px;
  height: 700px;
  background: rgba(30, 30, 34, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
  display: flex;
  overflow: hidden;
  color: #eee;
}

/* Sidebar */
.modal-sidebar {
  width: 200px;
  background: rgba(20, 20, 22, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-header {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 12px;
  padding-left: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
}

.sidebar-item.active {
  background: rgba(205, 198, 247, 0.1);
  color: #cdc6f7;
  font-weight: 500;
}

.tab-icon {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.sidebar-item:hover .tab-icon,
.sidebar-item.active .tab-icon {
  opacity: 1;
}

/* Main Content */
.modal-main {
  flex: 1;
  padding: 40px;
  position: relative;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 8px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* Transition styles below */

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal-content {
  transition: transform 0.2s ease-in;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.92) translateY(15px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
