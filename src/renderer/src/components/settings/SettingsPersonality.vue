<script setup>
import { useSettingsStore } from '../../stores/settings'
import { storeToRefs } from 'pinia'

const store = useSettingsStore()
const { state } = storeToRefs(store)
</script>

<template>
  <div class="settings-content">
    <h2>Personality & Behavior</h2>

    <div class="section">
      <h3>System Prompt</h3>
      <p class="section-desc">
        Define Aura's core personality, tone, and rules. This prompt is sent with every conversation
        start.
      </p>

      <div class="prompt-container">
        <textarea
          v-model="state.ai.systemPrompt"
          class="sys-prompt"
          placeholder="You are Aura, a helpful and witty AI assistant. You speak casually but professionally..."
        />
        <div class="prompt-footer">
          <span>{{ state.ai.systemPrompt.length }} characters</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Quick Presets (Coming Soon)</h3>
      <div class="presets">
        <div class="preset-card">Professional</div>
        <div class="preset-card">Friendly</div>
        <div class="preset-card">Sarcastic</div>
        <div class="preset-card">Concise</div>
      </div>
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

h3 {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.section {
  margin-bottom: 32px;
}

.section-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin: -8px 0 16px;
  line-height: 1.5;
  max-width: 600px;
}

.prompt-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sys-prompt {
  width: 100%;
  height: 400px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e0daf7;
  padding: 16px;
  border-radius: 12px;
  outline: none;
  font-size: 14px;
  font-family: 'JetBrains Mono', 'Inter', monospace;
  line-height: 1.6;
  resize: none;
  transition: border-color 0.2s;
}

.sys-prompt:focus {
  border-color: #cdc6f7;
}

.sys-prompt::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.prompt-footer {
  text-align: right;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
}

.presets {
  display: flex;
  gap: 10px;
  opacity: 0.5;
  pointer-events: none;
  /* Disabled for now */
}

.preset-card {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
