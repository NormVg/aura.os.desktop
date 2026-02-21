<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { renderMarkdown } from '../utils/markdown'
import { useChatStore } from '../stores/chat'
import ChatInput from './ChatInput.vue'
import ReplyChips from './ReplyChips.vue'
import QuestionCard from './QuestionCard.vue'
import AuraLogo from './AuraLogo.vue'
import {
  Wrench,
  Clock,
  Calculator,
  Cloud,
  Globe,
  Bell,
  Timer,
  ChevronDown,
  ChevronRight,
  Loader2,
  Copy,
  Check
} from 'lucide-vue-next'

const chatStore = useChatStore()
const {
  messages,
  suggestions,
  contextMessages,
  replyingTo,
  isStreaming,
  streamingText,
  pendingToolCalls,
  pendingQuestion
} = storeToRefs(chatStore)

// ── Tool UI helpers ─────────────────────────────────────────
const toolIcons = {
  getCurrentTime: Clock,
  calculate: Calculator,
  getWeather: Cloud,
  openUrl: Globe,
  setReminder: Bell,
  wait: Timer
}
const expandedTools = ref({}) // reactive object: { [id]: bool }
function toggleTool(id) {
  expandedTools.value[id] = !expandedTools.value[id]
}
function toolIcon(name) {
  return toolIcons[name] || Wrench
}
function formatArgs(args) {
  return Object.entries(args || {})
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ')
}

// ── DOM refs ────────────────────────────────────────────────
const messagesEl = ref(null)
const chatInputRef = ref(null)
const browserAgentLogsEl = ref(null)

// ── Browser Agent Logs State ────────────────────────────────
const browserAgentLogs = ref([])
watch(isStreaming, (newVal) => {
  if (newVal) browserAgentLogs.value = [] // clear logs on new message
})

function scrollAgentLogsTop() {
  if (browserAgentLogsEl.value) {
    browserAgentLogsEl.value.scrollTop = browserAgentLogsEl.value.scrollHeight
  }
}

function useSuggestion(s) {
  chatStore.setReplyingTo(s)
  // Focus input after setting reply
  if (chatInputRef.value?.focus) {
    chatInputRef.value.focus()
  }
}

function handleAddToContext(msg) {
  // Toggle message in context
  if (contextMessages.value.includes(msg.id)) {
    chatStore.removeContextMessage(msg.id)
  } else {
    chatStore.addContextMessage(msg.id)
  }
}

// ── Send ─────────────────────────────────────────
async function send(text) {
  if (!text) return
  chatStore.sendMessage(text)
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

// Auto-scroll while streaming
watch(streamingText, () => {
  nextTick(scrollToBottom)
})

// ── Question IPC listener ──────────────────────────────────
onMounted(() => {
  if (window.api?.auraQuestion) {
    window.api.auraQuestion.onAsk((questionData) => {
      chatStore.setPendingQuestion(questionData)
      nextTick(scrollToBottom)
    })
  }

  // Browser Agent Live Logs
  if (window.api?.auraBrowserAgent) {
    window.api.auraBrowserAgent.onStatus((data) => {
      browserAgentLogs.value.push(data)
      nextTick(scrollAgentLogsTop)
      nextTick(scrollToBottom)
    })
  }
})

onUnmounted(() => {
  if (window.api?.auraQuestion) {
    window.api.auraQuestion.removeListeners()
  }
  if (window.api?.auraBrowserAgent) {
    window.api.auraBrowserAgent.removeListeners()
  }
})

function handleAnswer(response) {
  chatStore.answerQuestion(response)
}

// ── Markdown ───────────────────────────────────────────────
function renderMd(text) {
  // Strip emotion tags for display
  const clean = text.replace(/\[emotion:\w+\]/g, '')
  return renderMarkdown(clean)
}

// ── Copy ───────────────────────────────────────────────────
const copiedId = ref(null)
function copy(msg) {
  navigator.clipboard.writeText(msg.text)
  copiedId.value = msg.id
  setTimeout(() => (copiedId.value = null), 1500)
}

function copyText(text, id) {
  navigator.clipboard.writeText(text)
  copiedId.value = id
  setTimeout(() => (copiedId.value = null), 1500)
}
</script>

<template>
  <div class="chat-wrap">
    <!-- Messages scroll area -->
    <div ref="messagesEl" class="messages">
      <!-- Empty State -->
      <div v-if="messages.length === 0 && !isStreaming" class="empty-state">
        <div class="empty-logo">
          <AuraLogo />
        </div>
        <h3 class="empty-title">Hi there! I'm Aura.</h3>
        <p class="empty-desc">
          I can help you write code, plan projects, or just chat. How can I help you today?
        </p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="msg-row" :class="msg.role">
        <!-- User bubble -->
        <div v-if="msg.role === 'user'" class="user-bubble">
          <span class="user-text">{{ msg.text }}</span>
          <button
            class="inline-copy-btn"
            :class="{ copied: copiedId === 'user-' + msg.id }"
            @click="copyText(msg.text, 'user-' + msg.id)"
            title="Copy"
          >
            <component :is="copiedId === 'user-' + msg.id ? Check : Copy" :size="12" />
          </button>
        </div>

        <!-- AI message -->
        <div v-else class="ai-msg">
          <!-- Per-message tool call cards -->
          <div v-if="msg.toolCalls && msg.toolCalls.length" class="tool-calls-wrap">
            <div v-for="tc in msg.toolCalls" :key="tc.id" class="tool-card done">
              <div class="tool-header" @click="toggleTool(tc.id)">
                <component :is="toolIcon(tc.toolName)" :size="14" class="tool-icon" />
                <span class="tool-name">{{ tc.toolName }}</span>
                <span class="tool-args" v-if="formatArgs(tc.args)">
                  ({{ formatArgs(tc.args) }})
                  <button
                    class="inline-copy-btn"
                    :class="{ copied: copiedId === 'args-' + tc.id }"
                    @click.stop="copyText(formatArgs(tc.args), 'args-' + tc.id)"
                    title="Copy arguments"
                  >
                    <component :is="copiedId === 'args-' + tc.id ? Check : Copy" :size="12" />
                  </button>
                </span>
                <component
                  :is="expandedTools[tc.id] ? ChevronDown : ChevronRight"
                  :size="14"
                  class="tool-status-icon"
                />
              </div>
              <div v-if="expandedTools[tc.id]" class="tool-result">
                <pre>{{ JSON.stringify(tc.result, null, 2) }}</pre>
              </div>
            </div>
          </div>
          <div class="ai-text" v-html="renderMd(msg.text)" />
          <div class="msg-actions">
            <!-- Copy -->
            <button class="msg-act-btn" :class="{ copied: copiedId === msg.id }" @click="copy(msg)">
              <svg
                v-if="copiedId !== msg.id"
                width="14"
                height="14"
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
                width="14"
                height="14"
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
            <!-- Reply -->
            <button
              class="msg-act-btn"
              :class="{ active: contextMessages.includes(msg.id) }"
              @click="handleAddToContext(msg)"
              :title="contextMessages.includes(msg.id) ? 'Remove from context' : 'Add to context'"
            >
              <svg
                width="14"
                height="14"
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
          </div>
        </div>
      </div>

      <!-- Live tool call cards while streaming -->
      <div v-if="pendingToolCalls.length" class="tool-calls-wrap">
        <div
          v-for="tc in pendingToolCalls"
          :key="tc.id"
          class="tool-card"
          :class="{ done: tc.status === 'done' }"
        >
          <div class="tool-header" @click="toggleTool(tc.id)">
            <component :is="toolIcon(tc.toolName)" :size="14" class="tool-icon" />
            <span class="tool-name">{{ tc.toolName }}</span>
            <span class="tool-args" v-if="formatArgs(tc.args)">
              ({{ formatArgs(tc.args) }})
              <button
                class="inline-copy-btn"
                :class="{ copied: copiedId === 'args-' + tc.id }"
                @click.stop="copyText(formatArgs(tc.args), 'args-' + tc.id)"
                title="Copy arguments"
              >
                <component :is="copiedId === 'args-' + tc.id ? Check : Copy" :size="12" />
              </button>
            </span>

            <component
              v-if="tc.status === 'running'"
              :is="Loader2"
              :size="14"
              class="tool-status-icon spin"
              style="margin-right: 4px;"
            />

            <component
              :is="expandedTools[tc.id] !== false ? ChevronDown : ChevronRight"
              :size="14"
              class="tool-status-icon"
            />
          </div>
          <div v-if="tc.status === 'done' && expandedTools[tc.id]" class="tool-result">
            <pre>{{ JSON.stringify(tc.result, null, 2) }}</pre>
          </div>

          <!-- Live Browser Agent Logs -->
          <div
            v-if="
              tc.toolName === 'browserAgent' &&
              browserAgentLogs.length > 0 &&
              expandedTools[tc.id] !== false
            "
            class="agent-logs"
            ref="browserAgentLogsEl"
          >
            <div
              v-for="(log, i) in browserAgentLogs"
              :key="i"
              class="agent-log-line"
              :class="log.phase"
            >
              <span class="log-step">[{{ log.step }}]</span>
              <span class="log-phase">{{ log.phase.toUpperCase() }}</span>
              <span class="log-msg">{{ log.message }}</span>
              <button
                class="inline-copy-btn"
                :class="{ copied: copiedId === 'log-' + i }"
                @click.stop="copyText(log.message, 'log-' + i)"
                title="Copy log text"
              >
                <component :is="copiedId === 'log-' + i ? Check : Copy" :size="12" />
              </button>
            </div>
            <div v-if="tc.status === 'running'" class="agent-log-line thinking">
              <span class="streaming-cursor">|</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Streaming AI bubble -->
      <div v-if="isStreaming" class="msg-row ai">
        <div class="ai-msg">
          <div class="ai-text" v-if="streamingText" v-html="renderMd(streamingText)" />
          <span class="streaming-cursor">|</span>
        </div>
      </div>

      <!-- Pending Question -->
      <div v-if="pendingQuestion" class="msg-row ai">
        <QuestionCard
          :question="pendingQuestion.question"
          :options="pendingQuestion.options"
          :allowCustom="pendingQuestion.allowCustom"
          :customPlaceholder="pendingQuestion.customPlaceholder"
          @answer="handleAnswer"
        />
      </div>
    </div>

    <!-- Bottom section: suggestions + input -->
    <div class="bottom">
      <ReplyChips :suggestions="suggestions" @select="useSuggestion" />

      <!-- Input -->
      <ChatInput ref="chatInputRef" @send="send" />
    </div>
  </div>
</template>

<style scoped>
.chat-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  position: relative;
}

/* ── Messages ── */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 28px 20px 14px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  scrollbar-width: none;
  /* Fade-in from top for depth */
  mask-image: linear-gradient(to bottom, transparent 0%, black 60px);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 60px);
}

.messages::-webkit-scrollbar {
  display: none;
}

.msg-row {
  display: flex;
  flex-direction: column;
}

.msg-row.user {
  align-items: flex-end;
}

.msg-row.ai {
  align-items: flex-start;
}

/* User bubble */
.user-bubble {
  background: rgba(205, 198, 247, 0.08);
  border: 1px solid rgba(205, 198, 247, 0.12);
  border-radius: 20px 20px 6px 20px;
  padding: 10px 18px;
  font-size: 14px;
  color: #e0daf7;
  max-width: 75%;
  line-height: 1.5;
  box-shadow:
    0 4px 20px rgba(140, 120, 240, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.05) inset;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.user-text {
  flex: 1;
  word-break: break-word;
}

/* AI message */
.ai-msg {
  max-width: 90%;
}

.ai-text {
  font-size: 14px;
  line-height: 1.7;
  color: rgba(205, 198, 247, 0.78);
  letter-spacing: 0.005em;
}

.ai-text :deep(p) {
  margin: 0 0 6px;
}

.ai-text :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-text :deep(strong) {
  color: #e0daf7;
  font-weight: 600;
}

/* Inline code */
.ai-text :deep(code):not(pre code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  background: rgba(205, 198, 247, 0.08);
  border-radius: 4px;
  padding: 1px 5px;
  color: #cdc6f7;
}

/* Code blocks */
.ai-text :deep(pre) {
  background: #1e1e24;
  /* Darker bg for blocks */
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
  overflow-x: auto;
}

.ai-text :deep(pre code) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12.5px;
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  white-space: pre;
}

/* ── Tables ── */
.ai-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 10px 0;
  font-size: 13px;
  background: rgba(205, 198, 247, 0.03);
  border-radius: 6px;
  overflow: hidden;
}

.ai-text :deep(thead) {
  background: rgba(205, 198, 247, 0.08);
}

.ai-text :deep(th) {
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #e8e4ff;
  border-bottom: 1px solid rgba(205, 198, 247, 0.15);
}

.ai-text :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(205, 198, 247, 0.08);
}

.ai-text :deep(tr:last-child td) {
  border-bottom: none;
}

.ai-text :deep(tbody tr:hover) {
  background: rgba(205, 198, 247, 0.05);
}

/* ── Syntax Highlighting Manual Overrides (Atom One Darkish) ── */
.ai-text :deep(.hljs-comment),
.ai-text :deep(.hljs-quote) {
  color: #7f848e;
  font-style: italic;
}

.ai-text :deep(.hljs-doctag),
.ai-text :deep(.hljs-keyword),
.ai-text :deep(.hljs-formula) {
  color: #c678dd;
}

.ai-text :deep(.hljs-section),
.ai-text :deep(.hljs-name),
.ai-text :deep(.hljs-selector-tag),
.ai-text :deep(.hljs-deletion),
.ai-text :deep(.hljs-subst) {
  color: #e06c75;
}

.ai-text :deep(.hljs-literal) {
  color: #56b6c2;
}

.ai-text :deep(.hljs-string),
.ai-text :deep(.hljs-regexp),
.ai-text :deep(.hljs-addition),
.ai-text :deep(.hljs-attribute),
.ai-text :deep(.hljs-meta-string) {
  color: #98c379;
}

.ai-text :deep(.hljs-built_in),
.ai-text :deep(.hljs-class .hljs-title) {
  color: #e6c07b;
}

.ai-text :deep(.hljs-attr),
.ai-text :deep(.hljs-variable),
.ai-text :deep(.hljs-template-variable),
.ai-text :deep(.hljs-type),
.ai-text :deep(.hljs-selector-class),
.ai-text :deep(.hljs-selector-attr),
.ai-text :deep(.hljs-selector-pseudo),
.ai-text :deep(.hljs-number) {
  color: #d19a66;
}

.ai-text :deep(.hljs-symbol),
.ai-text :deep(.hljs-bullet),
.ai-text :deep(.hljs-link),
.ai-text :deep(.hljs-meta),
.ai-text :deep(.hljs-selector-id),
.ai-text :deep(.hljs-title) {
  color: #61aeee;
}

.ai-text :deep(.hljs-emphasis) {
  font-style: italic;
}

.ai-text :deep(.hljs-strong) {
  font-weight: bold;
}

.msg-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.msg-act-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
  border-radius: 7px;
  color: rgba(205, 198, 247, 0.25);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s,
    border-color 0.12s;
}

.msg-act-btn:hover {
  background: rgba(205, 198, 247, 0.07);
  border-color: rgba(205, 198, 247, 0.1);
  color: #cdc6f7;
}

.msg-act-btn.copied {
  color: #a89fd4;
}

.msg-act-btn.active {
  background: rgba(205, 198, 247, 0.12);
  border-color: rgba(205, 198, 247, 0.2);
  color: #cdc6f7;
}

/* ── Inline Copy Button ── */
.inline-copy-btn {
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.4;
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  transition: opacity 0.15s, background 0.15s;
}

.inline-copy-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.inline-copy-btn.copied {
  color: #a89fd4;
  opacity: 1;
}

.tool-args .inline-copy-btn,
.agent-log-line .inline-copy-btn {
  opacity: 0;
}

.tool-header:hover .inline-copy-btn,
.agent-log-line:hover .inline-copy-btn {
  opacity: 0.4;
}

.tool-header:hover .inline-copy-btn:hover,
.agent-log-line:hover .inline-copy-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.tool-args .inline-copy-btn.copied,
.agent-log-line .inline-copy-btn.copied {
  opacity: 1;
}

/* ── Empty State ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  padding-bottom: 40px;
}

.empty-logo {
  margin-bottom: 24px;
  opacity: 0.8;
  transform: scale(1.5);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #e0daf7;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  max-width: 260px;
  line-height: 1.5;
}

/* ── Bottom section ── */
.bottom {
  padding: 0 70px 20px 24px;
  position: relative;
  flex-shrink: 0;
}

/* Input bar */
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 12px 12px 12px 18px;
}

.chat-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  resize: none;
  font-size: 13.5px;
  font-family: 'Inter', sans-serif;
  color: #cdc6f7;
  line-height: 1.5;
  min-height: 22px;
  max-height: 100px;
  overflow-y: auto;
}

.chat-input::placeholder {
  color: rgba(205, 198, 247, 0.25);
}

.input-btns {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.in-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: rgba(205, 198, 247, 0.3);
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
}

.in-btn:hover {
  background: rgba(205, 198, 247, 0.07);
  color: #cdc6f7;
}

.in-btn.send {
  background: rgba(205, 198, 247, 0.1);
  color: #cdc6f7;
}

.in-btn.send:hover {
  background: rgba(205, 198, 247, 0.18);
  color: #e8e4ff;
}

/* Bot avatar — positioned bottom-right overlapping the input */
.bot-avatar {
  position: absolute;
  bottom: 0;
  right: 6px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ── Streaming cursor ── */
.streaming-cursor {
  display: inline-block;
  color: #cdc6f7;
  font-weight: 300;
  animation: blink 0.8s steps(2) infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

/* ── Tool call cards ── */
.tool-calls-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 8px 0;
}

.tool-card {
  background: transparent;
  border: 1px solid rgba(205, 198, 247, 0.04);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  opacity: 0.6;
}

.tool-card:hover {
  opacity: 1;
  background: rgba(205, 198, 247, 0.02);
  border-color: rgba(205, 198, 247, 0.08);
}

.tool-card.done {
  border-color: rgba(140, 220, 140, 0.08);
}

.tool-card.done:hover {
  border-color: rgba(140, 220, 140, 0.15);
}

.tool-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 11px;
  color: rgba(205, 198, 247, 0.4);
  transition: all 0.2s;
}

.tool-header:hover {
  background: rgba(205, 198, 247, 0.03);
  color: rgba(205, 198, 247, 0.6);
}

.tool-icon {
  color: rgba(205, 198, 247, 0.5);
  flex-shrink: 0;
  opacity: 0.6;
}

.tool-header:hover .tool-icon {
  opacity: 1;
}

.tool-name {
  font-weight: 500;
  color: rgba(205, 198, 247, 0.6);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

.tool-args {
  color: rgba(205, 198, 247, 0.3);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.tool-status-icon {
  margin-left: auto;
  flex-shrink: 0;
  color: rgba(205, 198, 247, 0.25);
  opacity: 0.5;
}

.tool-header:hover .tool-status-icon {
  opacity: 1;
}

.tool-status-icon.spin {
  animation: tool-spin 1s linear infinite;
  color: rgba(205, 198, 247, 0.5);
  opacity: 1;
}

@keyframes tool-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.tool-result {
  border-top: 1px solid rgba(205, 198, 247, 0.04);
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.08);
}

.tool-result pre {
  margin: 0;
  font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: rgba(140, 220, 140, 0.5);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  opacity: 0.8;
}
.agent-logs {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #a0a0b0;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.agent-log-line {
  margin-bottom: 4px;
  word-break: break-word;
}

.agent-log-line.thinking .log-phase {
  color: #8a63d2;
}
.agent-log-line.acting .log-phase {
  color: #56b6c2;
}
.agent-log-line.error .log-phase {
  color: #e06c75;
}
.agent-log-line.fallback .log-phase {
  color: #e6c07b;
}
.agent-log-line.abort .log-phase {
  color: #e06c75;
  font-weight: bold;
}

.log-step {
  color: #606070;
  margin-right: 6px;
}

.log-phase {
  font-weight: 600;
  margin-right: 6px;
}

.log-msg {
  color: #d0d0e0;
}
</style>
