<script setup>
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const store = useSettingsStore()
const { state } = storeToRefs(store)
</script>

<template>
  <div class="settings-content about-content">
    <h2>About Aura OS</h2>
    <p class="version">Version {{ state.about.version }}</p>
    <p class="desc">
      Experimental desktop environment.<br />
      Designed for focus and flow.
    </p>
    <div class="credits">
      Made with ❤️ by Vishnu
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

.about-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.version {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  font-family: monospace;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 6px;
}

.desc {
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 300px;
}

.credits {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}
</style>
