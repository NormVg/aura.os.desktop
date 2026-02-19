<script setup>
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const store = useSettingsStore()
const { state } = storeToRefs(store)
</script>

<template>
  <div class="settings-content">
    <h2>Appearance</h2>
    <div class="setting-group">
      <label>Theme</label>
      <div class="theme-options">
        <button class="theme-btn" :class="{ active: state.appearance.theme === 'Dark' }"
          @click="state.appearance.theme = 'Dark'">Dark</button>
        <button class="theme-btn" :class="{ active: state.appearance.theme === 'Light' }"
          @click="state.appearance.theme = 'Light'">Light</button>
      </div>
    </div>
    <div class="setting-group">
      <label>Transparency: {{ Math.round(state.appearance.transparency * 100) }}%</label>
      <input type="range" min="0.5" max="1" step="0.05" v-model.number="state.appearance.transparency" />
    </div>
  </div>
</template>

<style scoped>
h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #fff;
  letter-spacing: -0.5px;
}

.setting-group {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

/* Theme Buttons */
.theme-options {
  display: flex;
  gap: 12px;
}

.theme-btn {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.theme-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.theme-btn.active {
  background: rgba(205, 198, 247, 0.15);
  border-color: #cdc6f7;
  color: #cdc6f7;
}

/* Range Input (basic styling, might inherit or need specific) */
input[type="range"] {
  width: 100%;
  accent-color: #cdc6f7;
}
</style>
