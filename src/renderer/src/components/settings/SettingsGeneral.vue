<script setup>
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const store = useSettingsStore()
const { state } = storeToRefs(store)
</script>

<template>
  <div class="settings-content">
    <h2>General</h2>
    <div class="setting-group">
      <label>Language</label>
      <select v-model="state.general.language">
        <option>English</option>
        <option>Spanish</option>
        <option>French</option>
      </select>
    </div>
    <div class="setting-group toggle-row">
      <label>Launch on Startup</label>
      <input type="checkbox" v-model="state.general.launchOnStartup" />
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

/* Inputs */
select,
input[type="text"] {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  padding: 10px 12px;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s;
}

select:focus,
input:focus {
  border-color: #cdc6f7;
}

/* Checkbox */
input[type="checkbox"] {
  accent-color: #cdc6f7;
  width: 16px;
  height: 16px;
}

/* Toggle Row */
.toggle-row {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.toggle-row label {
  margin: 0;
  color: #eee;
}
</style>
