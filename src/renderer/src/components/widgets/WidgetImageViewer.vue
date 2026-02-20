<script setup>
import { ref, watch, computed } from 'vue'
import { useWorkspaceStore } from '../../stores/workspaces'

const props = defineProps({
  id: { type: Number, required: true },
  data: { type: Object, default: () => ({}) },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-edit'])

const wsStore = useWorkspaceStore()
const isEditing = computed(() => props.isEditing)
const imageUrl = ref(props.data?.imageUrl || '')
const imageName = ref(props.data?.imageName || '')
const inputUrl = ref(imageUrl.value)
const isLoading = ref(false)
const error = ref(null)

function loadImage() {
  const url = inputUrl.value.trim()
  if (!url) return

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    error.value = 'Invalid URL format'
    return
  }

  isLoading.value = true
  error.value = null
  imageUrl.value = url

  wsStore.updateWidget(props.id, {
    data: {
      imageUrl: url,
      imageName: imageName.value
    }
  })
}

function onImageLoad() {
  isLoading.value = false
}

function onImageError() {
  isLoading.value = false
  error.value = 'Failed to load image'
}

watch(
  () => props.data,
  (newData) => {
    if (newData?.imageUrl && newData.imageUrl !== imageUrl.value) {
      imageUrl.value = newData.imageUrl
      inputUrl.value = newData.imageUrl
      isLoading.value = true
      error.value = null
    }
    if (newData?.imageName) {
      imageName.value = newData.imageName
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="image-widget" :class="{ 'has-image': !!imageUrl }">
    <div v-if="isEditing" class="editor-section">
      <div class="image-input">
        <input v-model="inputUrl" placeholder="Enter image URL..." @keydown.enter="loadImage" />
        <button @click="loadImage">Load</button>
      </div>

      <input
        v-model="imageName"
        class="image-name-input"
        placeholder="Image caption (optional)..."
        @input="loadImage"
      />
    </div>

    <div class="image-container" @dblclick="emit('toggle-edit')">
      <div v-if="isLoading" class="loading">Loading...</div>

      <div v-else-if="error" class="error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="imageUrl" class="image-wrapper">
        <img
          :src="imageUrl"
          :alt="imageName || 'Image'"
          @load="onImageLoad"
          @error="onImageError"
        />
        <div v-if="imageName" class="image-caption">{{ imageName }}</div>
      </div>

      <div v-else class="placeholder">
        <span>No image loaded</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.4);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.image-input {
  display: flex;
  gap: 8px;
}

.image-input input {
  flex: 1;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
}

.image-input input:focus {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(124, 106, 255, 0.4);
}

.image-input button {
  padding: 10px 20px;
  background: rgba(124, 106, 255, 0.2);
  border: 1px solid rgba(124, 106, 255, 0.4);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.image-input button:hover {
  background: rgba(124, 106, 255, 0.3);
  transform: translateY(-1px);
}

.image-name-input {
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  outline: none;
  backdrop-filter: blur(8px);
  transition: border-color 0.2s ease;
}

.image-name-input:focus {
  border-color: rgba(124, 106, 255, 0.4);
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.image-caption {
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  padding: 24px 16px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 300;
  text-align: center;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-widget:hover .image-caption {
  opacity: 1;
}

.loading,
.error,
.placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 300;
  text-align: center;
  padding: 40px;
}

.error {
  color: #e06c75;
}
</style>
