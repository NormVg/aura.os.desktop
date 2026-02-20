<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { renderMarkdown } from '../utils/markdown'
import mermaid from 'mermaid'

const props = defineProps({
  text: { type: String, default: '' }
})

const emit = defineEmits(['reply', 'close'])

const copied = ref(false)
const textBodyRef = ref(null)

const html = computed(() => renderMarkdown(props.text))

async function renderMermaidDiagrams() {
  await nextTick()
  if (!textBodyRef.value) return

  const mermaidElements = textBodyRef.value.querySelectorAll('.mermaid-diagram[data-mermaid-code]')

  for (const element of mermaidElements) {
    const code = element.getAttribute('data-mermaid-code')
    const id = element.getAttribute('data-mermaid-id')

    if (!code || !id) continue

    try {
      // Decode HTML entities
      const decodedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      const { svg } = await mermaid.render(`${id}-svg`, decodedCode)
      element.innerHTML = svg
    } catch (err) {
      console.error('Mermaid rendering error:', err)
      element.innerHTML = `<pre style="color: #e06c75;">Mermaid Error: ${err.message}</pre>`
    }
  }
}

function copy() {
  navigator.clipboard.writeText(props.text)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

onMounted(() => {
  renderMermaidDiagrams()
})

watch(
  () => props.text,
  () => {
    renderMermaidDiagrams()
  }
)
</script>

<template>
  <div class="text-block">
    <div ref="textBodyRef" class="text-body" v-html="html" />

    <div class="actions">
      <button class="action-btn" title="Reply" @click="emit('reply')">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 17 4 12 9 7" />
          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
      </button>

      <button class="action-btn" :class="{ copied }" title="Copy" @click="copy">
        <svg
          v-if="!copied"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <svg
          v-else
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      <button class="action-btn" title="Collapse" @click="emit('close')">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.text-block {
  max-width: 48vw;
  padding: 16px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-body {
  font-size: 13.5px;
  line-height: 1.65;
  color: #cdc6f7;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.text-body :deep(p) {
  margin: 0 0 8px;
}

.text-body :deep(p:last-child) {
  margin-bottom: 0;
}

.text-body :deep(strong) {
  color: #e8e4ff;
  font-weight: 600;
}

.text-body :deep(em) {
  color: #a89fd4;
  font-style: italic;
}

.text-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  background: rgba(205, 198, 247, 0.1);
  border-radius: 4px;
  padding: 1px 5px;
  color: #cdc6f7;
}

.text-body :deep(pre) {
  background: rgba(205, 198, 247, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
  overflow-x: auto;
  margin: 6px 0;
}

.text-body :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  white-space: pre;
}

.text-body :deep(ul),
.text-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}

.text-body :deep(li) {
  margin-bottom: 2px;
}

.text-body :deep(a) {
  color: #e8e4ff;
  text-decoration: none;
}

.text-body :deep(a:hover) {
  text-decoration: underline;
}

.text-body :deep(blockquote) {
  border-left: 2px solid rgba(205, 198, 247, 0.3);
  margin: 6px 0;
  padding-left: 10px;
  color: #a89fd4;
}

/* ── Tables ── */
.text-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 13px;
  background: rgba(205, 198, 247, 0.03);
  border-radius: 6px;
  overflow: hidden;
}

.text-body :deep(thead) {
  background: rgba(205, 198, 247, 0.08);
}

.text-body :deep(th) {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #e8e4ff;
  border-bottom: 1px solid rgba(205, 198, 247, 0.15);
}

.text-body :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(205, 198, 247, 0.08);
}

.text-body :deep(tr:last-child td) {
  border-bottom: none;
}

.text-body :deep(tbody tr:hover) {
  background: rgba(205, 198, 247, 0.05);
}

/* ── Mermaid Diagrams ── */
.text-body :deep(.mermaid-diagram) {
  margin: 12px 0;
  padding: 16px;
  background: rgba(205, 198, 247, 0.03);
  border-radius: 8px;
  overflow-x: auto;
  text-align: center;
}

.text-body :deep(.mermaid-diagram svg) {
  max-width: 100%;
  height: auto;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 7px;
  color: rgba(205, 198, 247, 0.35);
  cursor: pointer;
  transition:
    background 0.12s ease,
    color 0.12s ease;
}

.action-btn:hover {
  background: rgba(205, 198, 247, 0.08);
  color: #cdc6f7;
}

.action-btn:active {
  background: rgba(205, 198, 247, 0.12);
}

.action-btn.copied {
  color: #a89fd4;
}

/* ── Syntax Highlighting Manual Overrides (Atom One Darkish) ── */
.text-body :deep(.hljs-comment),
.text-body :deep(.hljs-quote) {
  color: #7f848e;
  font-style: italic;
}

.text-body :deep(.hljs-doctag),
.text-body :deep(.hljs-keyword),
.text-body :deep(.hljs-formula) {
  color: #c678dd;
}

.text-body :deep(.hljs-section),
.text-body :deep(.hljs-name),
.text-body :deep(.hljs-selector-tag),
.text-body :deep(.hljs-deletion),
.text-body :deep(.hljs-subst) {
  color: #e06c75;
}

.text-body :deep(.hljs-literal) {
  color: #56b6c2;
}

.text-body :deep(.hljs-string),
.text-body :deep(.hljs-regexp),
.text-body :deep(.hljs-addition),
.text-body :deep(.hljs-attribute),
.text-body :deep(.hljs-meta-string) {
  color: #98c379;
}

.text-body :deep(.hljs-built_in),
.text-body :deep(.hljs-class .hljs-title) {
  color: #e6c07b;
}

.text-body :deep(.hljs-attr),
.text-body :deep(.hljs-variable),
.text-body :deep(.hljs-template-variable),
.text-body :deep(.hljs-type),
.text-body :deep(.hljs-selector-class),
.text-body :deep(.hljs-selector-attr),
.text-body :deep(.hljs-selector-pseudo),
.text-body :deep(.hljs-number) {
  color: #d19a66;
}

.text-body :deep(.hljs-symbol),
.text-body :deep(.hljs-bullet),
.text-body :deep(.hljs-link),
.text-body :deep(.hljs-meta),
.text-body :deep(.hljs-selector-id),
.text-body :deep(.hljs-title) {
  color: #61aeee;
}

.text-body :deep(.hljs-emphasis) {
  font-style: italic;
}

.text-body :deep(.hljs-strong) {
  font-weight: bold;
}
</style>
