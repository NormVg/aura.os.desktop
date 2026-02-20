<script setup>
import { ref, computed, watch, inject } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useWorkspaceStore } from '../../stores/workspaces'

const props = defineProps({
  id: { type: Number, required: true },
  data: { type: Object, default: () => ({}) },
  title: { type: String, default: 'Note' },
  isEditing: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-edit'])

const wsStore = useWorkspaceStore()

const isEditing = computed(() => props.isEditing)

const content = ref(props.data?.content || '')

const renderedMarkdown = computed(() => renderMarkdown(content.value))

let timer = null
function onInput() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    wsStore.updateWidget(props.id, { data: { content: content.value } })
  }, 500)
}

watch(
  () => props.data?.content,
  (newContent) => {
    if (newContent !== undefined && newContent !== content.value) {
      content.value = newContent
    }
  },
  { deep: true }
)

const renderMarkdown = (text) => {
  if (!text) return ''
  const rawHtml = marked.parse(text)
  return DOMPurify.sanitize(rawHtml)
}
</script>

<template>
  <div class="note-widget">
    <textarea
      v-if="isEditing"
      v-model="content"
      placeholder="Type markdown notes..."
      @input="onInput"
      autofocus
      spellcheck="false"
    />

    <div
      v-else
      class="markdown-preview"
      v-html="renderedMarkdown || '<span style=\'opacity:0.5\'>Empty note...</span>'"
      @dblclick="emit('toggle-edit')"
    />
  </div>
</template>

<style scoped>
.note-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

textarea {
  flex: 1;
  width: 100%;
  background: transparent;
  /* fully transparent to blend with wrapper glass */
  border: none;
  border-radius: 8px;
  resize: none;
  padding: 8px 4px;
  color: #e8e4ff;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  outline: none;
  font-weight: 300;
  transition: background 0.2s ease;
}

textarea:focus {
  background: rgba(255, 255, 255, 0.02);
}

textarea::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

/* Custom Scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.markdown-preview {
  flex: 1;
  overflow: auto;
  padding: 8px 4px;
  background: transparent;
  font-size: 14px;
  font-weight: 300;
  line-height: 1.6;
  color: #e8e4ff;
}

/* Markdown styles */
.markdown-preview :deep(p) {
  margin: 0 0 12px;
}

.markdown-preview :deep(h1),
.markdown-preview :deep(h2),
.markdown-preview :deep(h3) {
  margin: 20px 0 12px;
  color: #fff;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.markdown-preview :deep(code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  background: rgba(124, 106, 255, 0.15);
  border-radius: 6px;
  padding: 2px 6px;
  color: #c6baff;
}

.markdown-preview :deep(pre) {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-preview :deep(pre code) {
  background: none;
  padding: 0;
  color: #e8e4ff;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  padding-left: 20px;
  margin: 12px 0;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid #7c6aff;
  padding-left: 16px;
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  background: linear-gradient(90deg, rgba(124, 106, 255, 0.08) 0%, transparent 100%);
  border-radius: 0 8px 8px 0;
}

.markdown-preview :deep(a) {
  color: #a89fd4;
  text-decoration: none;
  border-bottom: 1px solid rgba(168, 159, 212, 0.3);
  transition: all 0.2s ease;
}

.markdown-preview :deep(a:hover) {
  color: #fff;
  border-bottom-color: #fff;
}

.markdown-preview :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 10px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 500;
  color: #fff;
}

/* Custom Scrollbar for preview */
.markdown-preview::-webkit-scrollbar {
  width: 6px;
}

.markdown-preview::-webkit-scrollbar-track {
  background: transparent;
}

.markdown-preview::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.markdown-preview::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
