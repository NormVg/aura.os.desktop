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

// Normalize older single-image schemas into the new array schema if necessary
const initialImages = []
if (props.data?.images && Array.isArray(props.data.images)) {
  initialImages.push(...props.data.images)
} else if (props.data?.imageUrl) {
  initialImages.push({ url: props.data.imageUrl, caption: props.data.imageName || '' })
}

const images = ref(initialImages)
const inputUrl = ref('')
const inputCaption = ref('')
const error = ref(null)

function addImage() {
  const url = inputUrl.value.trim()
  if (!url) return

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    error.value = 'Invalid URL format'
    setTimeout(() => {
      error.value = null
    }, 3000)
    return
  }

  images.value.push({
    url: url,
    caption: inputCaption.value.trim()
  })

  inputUrl.value = ''
  inputCaption.value = ''
  saveData()
}

function removeImage(index) {
  images.value.splice(index, 1)
  saveData()
}

function saveData() {
  wsStore.updateWidget(props.id, {
    data: { images: images.value }
  })
}

function onImageError(event, index) {
  // If an image fully fails to load, mark its object so CSS can handle it visually
  if (images.value[index]) {
    images.value[index].failed = true
  }
}

watch(
  () => props.data,
  (newData) => {
    if (newData?.images) {
      images.value = [...newData.images]
    } else if (newData?.imageUrl) {
      // Graceful fallback for legacy AI payloads setting `imageUrl` manually
      images.value = [{ url: newData.imageUrl, caption: newData.imageName || '' }]
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="image-widget" :class="{ 'has-images': images.length > 0 }">
    <div v-if="isEditing" class="editor-section scrollable">
      <div v-if="error" class="error-toast">{{ error }}</div>

      <div class="image-input">
        <input v-model="inputUrl" placeholder="Enter image URL..." @keydown.enter="addImage" />
        <input
          v-model="inputCaption"
          class="image-name-input"
          placeholder="Caption (optional)"
          @keydown.enter="addImage"
        />
        <button @click="addImage">Add</button>
      </div>

      <div v-if="images.length > 0" class="image-list-editor">
        <p class="section-title">Current Images</p>
        <div v-for="(img, idx) in images" :key="idx" class="image-list-item">
          <img :src="img.failed ? '' : img.url" class="thumbnail" />
          <div class="item-details">
            <span class="url-text">{{ img.url }}</span>
            <span v-if="img.caption" class="caption-text">{{ img.caption }}</span>
          </div>
          <button class="remove-btn" @click.stop="removeImage(idx)">X</button>
        </div>
      </div>
    </div>

    <div class="image-container scrollable-y" @dblclick.self="emit('toggle-edit')">
      <div
        v-if="images.length > 0"
        class="gallery-grid"
        :class="gridClass"
        @dblclick.self="emit('toggle-edit')"
      >
        <div v-for="(img, idx) in images" :key="idx" class="image-wrapper">
          <div v-if="img.failed" class="image-failed">Failed to load</div>
          <img
            v-else
            :src="img.url"
            :alt="img.caption || 'Image'"
            @error="(e) => onImageError(e, idx)"
            loading="lazy"
          />
          <div v-if="img.caption && !img.failed" class="image-caption">{{ img.caption }}</div>
        </div>
      </div>

      <div v-else class="placeholder" @dblclick="emit('toggle-edit')">
        <span>No images loaded (Double-click to edit)</span>
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

.scrollable-y {
  overflow-y: auto;
  overflow-x: hidden;
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-height: 50%;
  overflow-y: auto;
  z-index: 10;
}

.error-toast {
  color: #e06c75;
  background: rgba(224, 108, 117, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.image-input {
  display: flex;
  flex-direction: column;
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

.section-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 12px 0 8px;
}

.image-list-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 10px;
  border-radius: 8px;
}

.image-list-item .thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  background: rgba(0, 0, 0, 0.3);
}

.item-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.url-text {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.8);
}

.caption-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.remove-btn:hover {
  color: #e06c75;
}

.image-container {
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-auto-rows: 250px;
  gap: 4px;
  padding: 4px;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* If there's only 1 image, make it fill the whole vertical space instead of restricting to 250px */
.gallery-grid:has(> :last-child:nth-child(1)) {
  grid-auto-rows: 100%;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* ensure we don't clip critical graph data */
  background: rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

/* If there are multiple images, let them crop nicely like a gallery layout instead of shrink-fitting */
.gallery-grid:not(:has(> :last-child:nth-child(1))) .image-wrapper img {
  object-fit: cover;
}

.image-caption {
  position: absolute;
  bottom: 0px;
  left: 0;
  width: 100%;
  padding: 24px 16px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 300;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-caption {
  opacity: 1;
}

.image-failed,
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 300;
  text-align: center;
  padding: 40px;
}

.image-failed {
  background: rgba(255, 0, 0, 0.05);
  color: #e06c75;
}
</style>
