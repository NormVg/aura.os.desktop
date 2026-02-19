import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'

export const useChatStore = defineStore('chat', () => {
  // ── Messages ──────────────────────────────────────────────
  const messages = ref([])

  // ── Streaming state ───────────────────────────────────────
  const isStreaming = ref(false)
  const streamingText = ref('')

  // ── Context chips (messages included in current AI request) ─────
  const contextMessages = ref([]) // Array of message IDs to include as context

  const suggestions = computed(() => {
    // Show chips for messages that will be included as context
    if (!contextMessages.value.length) return []

    return contextMessages.value.map(msgId => {
      const msg = messages.value.find(m => m.id === msgId)
      if (!msg) return null
      const snippet = msg.text.slice(0, 50) + (msg.text.length > 50 ? '...' : '')
      return {
        id: msgId,
        label: snippet,
        messageId: msgId,
        fullText: msg.text
      }
    }).filter(Boolean)
  })

  const replyingTo = ref(null)
  const emotion = ref('normal')
  const pendingToolCalls = ref([]) // tool calls during current streaming turn

  // ── Emotion parsing ───────────────────────────────────────
  function parseAndStripEmotions(text) {
    const emotionRegex = /\[emotion:(\w+)\]/g
    let lastEmotion = null
    let match
    while ((match = emotionRegex.exec(text)) !== null) {
      lastEmotion = match[1]
    }
    if (lastEmotion) setEmotion(lastEmotion)
    return text.replace(emotionRegex, '').trim()
  }

  // ── Send message via IPC ──────────────────────────────────
  async function sendMessage(text) {
    if (!text.trim() || isStreaming.value) return
    if (!window.api?.auraChat) {
      console.error('auraChat IPC not available')
      return
    }

    const settingsStore = useSettingsStore()

    // Add user message
    addMessage('user', text)

    // Set streaming state
    isStreaming.value = true
    streamingText.value = ''
    pendingToolCalls.value = []
    setEmotion('think')

    // Clean up old listeners
    window.api.auraChat.removeListeners()

    // Set up listeners
    window.api.auraChat.onToken((token) => {
      if (typeof token !== 'string') return
      streamingText.value += token
      // Check for emotion tags inline
      const emotionRegex = /\[emotion:(\w+)\]/g
      let match
      while ((match = emotionRegex.exec(token)) !== null) {
        setEmotion(match[1])
      }
    })

    window.api.auraChat.onToolCall((data) => {
      pendingToolCalls.value.push({
        id: data.toolCallId,
        toolName: data.toolName,
        args: data.args,
        result: null,
        status: 'running',
      })
    })

    window.api.auraChat.onToolResult((data) => {
      const tc = pendingToolCalls.value.find(t => t.id === data.toolCallId)
      if (tc) {
        tc.result = data.result
        tc.status = 'done'
      }
    })

    window.api.auraChat.onDone((data) => {
      const cleanText = parseAndStripEmotions(data.text || streamingText.value)
      // Attach accumulated tool calls to this AI message
      addMessage('ai', cleanText, [...pendingToolCalls.value])
      pendingToolCalls.value = []
      isStreaming.value = false
      streamingText.value = ''
      setEmotion('speaking')
      // Clear context after sending
      contextMessages.value = []
      window.api.auraChat.removeListeners()
    })

    window.api.auraChat.onError((err) => {
      addMessage('ai', `⚠️ Error: ${err.message}`)
      isStreaming.value = false
      streamingText.value = ''
      setEmotion('normal')
      contextMessages.value = []
      window.api.auraChat.removeListeners()
    })

    // Build messages payload for AI
 const aiMessages = messages.value.map(m => ({
      role: m.role === 'ai' ? 'assistant' : m.role,
      content: m.text,
    }))

    // Send via IPC
    const aiSettings = JSON.parse(JSON.stringify(settingsStore.state.ai))

    window.api.auraChat.send({
      messages: aiMessages,
      role: 'chat',
      settings: aiSettings,
    })
  }

  // ── Stop streaming ────────────────────────────────────────
  function stopStreaming() {
    if (window.api?.auraChat) {
      window.api.auraChat.stop()
    }
    if (streamingText.value) {
      const cleanText = parseAndStripEmotions(streamingText.value)
      addMessage('ai', cleanText)
    }
    isStreaming.value = false
    streamingText.value = ''
    window.api?.auraChat?.removeListeners()
  }
  // ── Actions ───────────────────────────────────────────────
  function addMessage(role, text, toolCalls = []) {
    messages.value.push({ id: Date.now(), role, text, toolCalls })
  }

  function addContextMessage(messageId) {
    if (!contextMessages.value.includes(messageId)) {
      contextMessages.value.push(messageId)
    }
  }

  function removeContextMessage(messageId) {
    contextMessages.value = contextMessages.value.filter(id => id !== messageId)
  }

  function clearContext() {
    contextMessages.value = []
  }

  function setReplyingTo(suggestion) {
    replyingTo.value = suggestion
  }

  function clearReplyingTo() {
    replyingTo.value = null
  }

  function setEmotion(newEmotion) {
    emotion.value = newEmotion
  }

  // ── Voice-to-voice state (for StateBar display) ───────────
  const voiceStatus = ref('')       // recording | transcribing | thinking | speaking | done
  const voiceTranscript = ref('')    // user's spoken text
  const voiceAiText = ref('')        // AI's reply text

  // ── Question state ────────────────────────────────────────
  const pendingQuestion = ref(null)

  function setPendingQuestion(questionData) {
    pendingQuestion.value = questionData
  }

  function answerQuestion(response) {
    if (!pendingQuestion.value) return

    const questionId = pendingQuestion.value.id

    // Send response via IPC
    if (window.api?.auraQuestion) {
      window.api.auraQuestion.respond({
        questionId,
        response: {
          ...response,
          timestamp: Date.now()
        }
      })
    }

    // Clear pending question
    pendingQuestion.value = null
  }

  function clearPendingQuestion() {
    pendingQuestion.value = null
  }

  function setVoiceState({ status, transcript, aiText }) {
    if (status !== undefined) voiceStatus.value = status
    if (transcript !== undefined) voiceTranscript.value = transcript
    if (aiText !== undefined) voiceAiText.value = aiText
  }

  function clearVoiceState() {
    voiceStatus.value = ''
    // Don't clear text so it persists in UI
    // voiceTranscript.value = ''
    // voiceAiText.value = ''
  }

  function clearVoiceText() {
    voiceTranscript.value = ''
    voiceAiText.value = ''
  }

  return {
    messages,
    isStreaming,
    streamingText,
    suggestions,
    contextMessages,
    replyingTo,
    emotion,
    pendingToolCalls,
    voiceStatus,
    voiceTranscript,
    voiceAiText,
    pendingQuestion,
    addMessage,
    sendMessage,
    stopStreaming,
    addContextMessage,
    removeContextMessage,
    clearContext,
    setReplyingTo,
    clearReplyingTo,
    setEmotion,
    setVoiceState,
    clearVoiceState,
    clearVoiceText,
    setPendingQuestion,
    answerQuestion,
    clearPendingQuestion,
  }
})
