<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useWorkspaceStore } from '../../stores/workspaces'

const props = defineProps({
  id: { type: Number, required: true },
  data: { type: Object, default: () => ({}) },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-edit'])

const wsStore = useWorkspaceStore()
const isEditing = computed(() => props.isEditing)
const url = ref(props.data?.url || '')
const inputUrl = ref(url.value)
const isLoading = ref(false)
const error = ref(null)

const iframeRef = ref(null)

function loadSite() {
  let targetUrl = inputUrl.value.trim()
  if (!targetUrl) return

  // Automatically append https:// if missing
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl
  }

  try {
    new URL(targetUrl)
  } catch {
    error.value = 'Invalid URL format'
    return
  }

  isLoading.value = true
  error.value = null
  url.value = targetUrl
  inputUrl.value = targetUrl // update the input to reflect formatting

  wsStore.updateWidget(props.id, {
    data: { url: targetUrl }
  })
}

function onIframeLoad() {
  isLoading.value = false
}

function onIframeError() {
  isLoading.value = false
  error.value = 'Failed to load webpage.'
}

watch(
  () => props.data,
  (newData) => {
    if (newData?.url && newData.url !== url.value) {
      url.value = newData.url
      inputUrl.value = newData.url
      isLoading.value = true
      error.value = null
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="webview-widget" :class="{ 'has-content': !!url }">
    <!-- Editor overlay -->
    <div v-if="isEditing" class="editor-section">
      <div class="url-input">
        <input
          v-model="inputUrl"
          placeholder="Enter website URL (e.g. google.com)"
          @keydown.enter="loadSite"
        />
        <button @click="loadSite">Load</button>
      </div>
      <p class="hint">Double-click headers to toggle edit mode</p>
    </div>

    <div class="site-container" @dblclick.self="emit('toggle-edit')">
      <div v-if="error" class="error-overlay" @dblclick="emit('toggle-edit')">
        <span>{{ error }}</span>
        <button @click="loadSite" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="url" class="webview-wrapper">
        <div v-if="isLoading && !isEditing" class="loading-bar"></div>
        <iframe
          ref="iframeRef"
          :src="url"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          class="native-webview"
          :class="{ dimmed: isEditing }"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>
      </div>

      <div v-else class="placeholder" @dblclick="emit('toggle-edit')">
        <span>No website loaded</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.webview-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  backdrop-filter: blur(12px);
}

.url-input {
  display: flex;
  gap: 8px;
}

.url-input input {
  flex: 1;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.url-input input:focus {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(124, 106, 255, 0.4);
}

.url-input button {
  padding: 10px 20px;
  background: rgba(124, 106, 255, 0.2);
  border: 1px solid rgba(124, 106, 255, 0.4);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.url-input button:hover {
  background: rgba(124, 106, 255, 0.3);
  transform: translateY(-1px);
}

.hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  text-align: center;
}

.site-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  /* Native webviews look best on white backgrounds usually */
}

/* Fallback styling for empty or transparent webviews */
.webview-widget:not(.has-content) .site-container {
  background: transparent;
}

.webview-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.native-webview {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  transition: opacity 0.3s ease;
}

.native-webview.dimmed {
  opacity: 0.3;
  pointer-events: none;
}

.loading-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: #7c6aff;
  animation: loadingSlide 2s infinite linear;
  z-index: 5;
  box-shadow: 0 0 8px rgba(124, 106, 255, 0.8);
}

@keyframes loadingSlide {
  0% {
    width: 0%;
    left: 0%;
    right: auto;
  }

  49% {
    width: 100%;
    left: 0%;
    right: auto;
  }

  50% {
    width: 100%;
    right: 0%;
    left: auto;
  }

  100% {
    width: 0%;
    right: 0%;
    left: auto;
  }
}

.placeholder,
.error-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 300;
  cursor: pointer;
  /* encourages double click */
}

.error-overlay {
  background: rgba(30, 0, 0, 0.8);
  color: #e06c75;
}

.retry-btn {
  padding: 6px 16px;
  background: transparent;
  border: 1px solid rgba(224, 108, 117, 0.5);
  border-radius: 6px;
  color: #e06c75;
  cursor: pointer;
  font-size: 12px;
}

.retry-btn:hover {
  background: rgba(224, 108, 117, 0.1);
}
</style>
