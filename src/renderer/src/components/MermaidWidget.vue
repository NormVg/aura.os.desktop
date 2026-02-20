<script setup>
import { ref, watch, nextTick, inject, computed } from 'vue'
import mermaid from 'mermaid'

const props = defineProps({
  initialCode: { type: String, default: '' },
  title: { type: String, default: 'Mermaid Diagram' },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['update', 'updateTitle', 'toggle-edit'])

const code = ref(
  props.initialCode ||
    `graph TD
A[Start] --> B[Process]
B --> C[End]`
)

const svgContainer = ref(null)
const error = ref('')
const widgetTitle = ref(props.title)
const isEditingTitle = ref(false)

const isEditing = computed(() => props.isEditing)

async function renderDiagram() {
  if (!code.value.trim()) {
    error.value = 'Code is empty'
    return
  }

  try {
    error.value = ''
    const id = `mermaid-widget-${Date.now()}`
    const { svg } = await mermaid.render(id, code.value)
    if (svgContainer.value) {
      svgContainer.value.innerHTML = svg
    }
    emit('update', code.value)
  } catch (err) {
    console.error('Mermaid render error:', err)
    error.value = err.message
  }
}

let renderTimer = null
function onCodeInput() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => {
    renderDiagram()
  }, 500)
}

watch(
  () => props.initialCode,
  (newCode) => {
    if (newCode && newCode !== code.value) {
      code.value = newCode
      renderDiagram()
    }
  }
)

watch(
  () => props.title,
  (newTitle) => {
    if (newTitle) {
      widgetTitle.value = newTitle
    }
  }
)

function saveTitle() {
  isEditingTitle.value = false
  emit('updateTitle', widgetTitle.value)
}

function handleTitleKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveTitle()
  } else if (e.key === 'Escape') {
    widgetTitle.value = props.title
    isEditingTitle.value = false
  }
}

// Initial render
nextTick(() => {
  renderDiagram()
})
</script>

<template>
  <div class="mermaid-widget">
    <div class="header" v-if="isEditing || isEditingTitle">
      <input
        v-if="isEditingTitle"
        v-model="widgetTitle"
        class="title-input"
        @blur="saveTitle"
        @keydown="handleTitleKeydown"
        autofocus
      />
      <span
        v-else
        class="title"
        @dblclick="isEditingTitle = true"
        title="Double-click to edit title"
      >
        {{ widgetTitle }}
      </span>
    </div>

    <div v-if="isEditing" class="editor-section">
      <textarea
        v-model="code"
        class="code-editor"
        placeholder="Enter Mermaid code..."
        spellcheck="false"
        @input="onCodeInput"
      />
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div
      v-show="!isEditing"
      ref="svgContainer"
      class="diagram-container"
      @dblclick="emit('toggle-edit')"
    />
  </div>
</template>

<style scoped>
.mermaid-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  justify-content: flex-end;
  /* align title right */
  align-items: center;
  padding-bottom: 8px;
  padding-left: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s ease;
  letter-spacing: 0.01em;
}

.title:hover {
  background: rgba(255, 255, 255, 0.08);
}

.title-input {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(124, 106, 255, 0.6);
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
  font-family: inherit;
  backdrop-filter: blur(8px);
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.code-editor {
  flex: 1;
  width: 100%;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #c6baff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
}

.code-editor:focus {
  border-color: rgba(124, 106, 255, 0.5);
  background: rgba(0, 0, 0, 0.4);
}

/* Custom Scrollbar for code editor */
.code-editor::-webkit-scrollbar {
  width: 6px;
}

.code-editor::-webkit-scrollbar-track {
  background: transparent;
}

.code-editor::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.error {
  padding: 10px 14px;
  background: rgba(224, 108, 117, 0.1);
  border: 1px solid rgba(224, 108, 117, 0.3);
  border-radius: 8px;
  color: #e06c75;
  font-size: 13px;
  backdrop-filter: blur(4px);
}

.diagram-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 8px;
  padding: 12px;
}

.diagram-container :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  width: auto !important;
  height: auto !important;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

/* Custom Scrollbar for diagram container */
.diagram-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.diagram-container::-webkit-scrollbar-track {
  background: transparent;
}

.diagram-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}

.diagram-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
