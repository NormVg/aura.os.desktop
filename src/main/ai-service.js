import { streamText, generateText, stepCountIs } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOllama } from 'ollama-ai-provider-v2'
import { EdgeTTS } from 'edge-tts-universal'

// ── Provider factory ──────────────────────────────────────────
function createProvider(modelEntry, keys) {
  if (modelEntry.provider === 'openrouter') {
    const openrouter = createOpenRouter({
      apiKey: keys.openrouter,
    })
    return openrouter.chat(modelEntry.modelId)
  }

  if (modelEntry.provider === 'google') {
    const google = createGoogleGenerativeAI({
      apiKey: keys.google,
    })
    return google(modelEntry.modelId)
  }

  if (modelEntry.provider === 'ollama') {
    const ollama = createOllama({
      baseURL: keys.ollamaBaseURL || 'http://localhost:11434/api',
    })
    return ollama(modelEntry.modelId)
  }

  throw new Error(`Unknown provider: ${modelEntry.provider}`)
}

// ── Resolve model from role ───────────────────────────────────
function resolveModel(role, settings) {
  const modelId = settings.roles[role]
  if (!modelId) throw new Error(`No model assigned to role "${role}"`)

  const entry = settings.models.find(m => m.id === modelId)
  if (!entry) throw new Error(`Model "${modelId}" not found in registry`)

  return createProvider(entry, settings.keys)
}

import { auraTools } from './tools.js'

// ── Stream chat ───────────────────────────────────────────────
export async function handleChat({ messages, role = 'chat', settings, sender }) {
  try {
    const model = resolveModel(role, settings)

    const systemPrompt = settings.systemPrompt || `You are Aura, a helpful AI assistant embedded in Aura OS — a creative desktop environment. You can help with ANY task: writing, coding, answering questions, brainstorming, analysis, and more. You also have access to tools (like opening URLs, getting weather, doing math) — use them when helpful, but they are optional extras. Never refuse a task just because there's no tool for it. Be warm, concise, and genuinely helpful.`

    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: auraTools,
      toolChoice: 'auto',
      stopWhen: stepCountIs(10),
    })

    // Use fullStream to capture tool calls, results, and text
    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          sender.send('aura:chat:token', part.delta)
          break
        case 'tool-call':
          sender.send('aura:chat:toolcall', {
            toolName: part.toolName,
            toolCallId: part.toolCallId,
            args: part.input,
          })
          break
        case 'tool-result':
          sender.send('aura:chat:toolresult', {
            toolName: part.toolName,
            toolCallId: part.toolCallId,
            args: part.input,
            result: part.output,
          })
          break
        case 'error':
          console.error('[AI Stream Error]', part.error)
          break
      }
    }

    // Get final text
    const finalText = await result.text
    sender.send('aura:chat:done', { text: finalText })
  } catch (err) {
    console.error('[AI Service] Error:', err)
    sender.send('aura:chat:error', { message: err.message || 'Unknown AI error' })
  }
}

// ── Speech-to-text via Sarvam REST API ────────────────────────
export async function handleSTT({ audioBase64, sarvamKey, languageCode = 'unknown' }) {
  const formData = new FormData()

  // Convert base64 to blob
  const binaryStr = atob(audioBase64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'audio/webm' })
  formData.append('file', blob, 'recording.webm')
  formData.append('model', 'saaras:v3')
  formData.append('language_code', languageCode)
  formData.append('mode', 'translit')

  const response = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Sarvam STT failed: ${response.status} ${errText}`)
  }

  const data = await response.json()
  return { transcript: data.transcript, languageCode: data.language_code }
}

// ── Edge TTS (free, no API key) ──────────────────────────────
export async function handleEdgeTTS({ text, voice = 'hi-IN-MadhurNeural' }) {
  const safeText = (text && typeof text === 'string' && text.trim()) ? text.trim() : 'No response available.'
  const tts = new EdgeTTS()
  await tts.synthesize(safeText, voice, { rate: '18%', pitch: '-2Hz', volume: '0%' })
  const audioBuffer = await tts.toArrayBuffer()
  const uint8 = new Uint8Array(audioBuffer)
  let binary = ''
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i])
  const base64 = btoa(binary)
  return { audioBase64: base64 }
}

// ── Text-to-speech via Sarvam Bulbul REST API ────────────────
export async function handleTTS({ text, sarvamKey, languageCode = 'en-IN', speaker = 'anushka', pitch = 0, pace = 1.0, loudness = 1.0 }) {
  const response = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': sarvamKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      model: 'bulbul:v3',
      speaker,
      // pitch, loudness, pace not supported in v3 yet
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Sarvam TTS failed: ${response.status} ${errText}`)
  }

  const data = await response.json()
  return { audioBase64: data.audios?.[0] || '' }
}

// ── Voice-to-voice: STT → AI → TTS ──────────────────────────

export async function handleVoiceConvo({ audioBase64, settings, messages = [], sender }) {
  try {
    // 1. STT
    sender.send('aura:voice:status', 'transcribing')
    const sttResult = await handleSTT({
      audioBase64,
      sarvamKey: settings.keys.sarvam,
    })
    const userText = sttResult.transcript
    sender.send('aura:voice:transcript', userText)

    // 2. AI response (with tools support)
    sender.send('aura:voice:status', 'thinking')
    const model = resolveModel('chat', settings)
    const systemPrompt = settings.systemPrompt || 'You are Aura, a helpful AI assistant. Be concise and warm. Keep responses short for voice output — 1-3 sentences max.'

    // Build full conversation history: prior messages + new user message
    const fullMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ]

    const aiResult = await generateText({
      model,
      system: systemPrompt,
      messages: fullMessages,
      tools: auraTools,
      maxSteps: 5,
    })
    const aiText = aiResult.text
    sender.send('aura:voice:aitext', aiText)

    // 3. TTS
    sender.send('aura:voice:status', 'speaking')

    // Strip emotion tags for TTS e.g. "Hello [emotion:happy] world" -> "Hello  world"
    let ttsText = aiText.replace(/\[emotion:\w+\]/g, '').trim()

    // Strip code blocks (```...```) and inline code (`...`)
    ttsText = ttsText.replace(/```[\s\S]*?```/g, ' (code block removed) ')
    // Remove brackets and special chars that sound bad in TTS
    ttsText = ttsText.replace(/[\[\]{}()<>*]/g, '')

    const ttsProvider = settings.tts?.provider || 'sarvam'
    let ttsResult

    if (ttsProvider === 'edge') {
      ttsResult = await handleEdgeTTS({
        text: ttsText,
        voice: settings.tts?.edgeVoice || 'en-US-AriaNeural',
      })
    } else {
      // Sarvam: Truncate to 500 char limit (safe buffer 450)
      if (ttsText.length > 450) {
        ttsText = ttsText.slice(0, 450) + '...'
      }
      ttsResult = await handleTTS({
        text: ttsText,
        sarvamKey: settings.keys.sarvam,
        languageCode: 'en-IN',
        speaker: settings.tts?.speaker,
        pitch: settings.tts?.pitch,
        pace: settings.tts?.pace,
        loudness: settings.tts?.loudness,
      })
    }
    sender.send('aura:voice:audio', ttsResult.audioBase64)
    sender.send('aura:voice:status', 'done')
  } catch (err) {
    console.error('[Voice Convo] Error:', err)
    sender.send('aura:voice:error', { message: err.message || 'Voice conversation failed' })
  }
}
