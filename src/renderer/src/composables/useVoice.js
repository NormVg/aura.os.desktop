/**
 * useVoice — composable for recording audio + Sarvam STT
 * Records via MediaRecorder → base64 → IPC aura:stt → transcript
 */
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

export function useVoice() {
  const isRecording = ref(false)
  const transcript = ref('')
  const error = ref('')

  let mediaRecorder = null
  let chunks = []

  async function startRecording() {
    error.value = ''
    transcript.value = ''

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunks = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop())

        const blob = new Blob(chunks, { type: 'audio/webm' })
        const reader = new FileReader()

        reader.onloadend = async () => {
          const base64 = reader.result.split(',')[1] // strip data:...;base64,
          try {
            const settings = useSettingsStore()
            const sarvamKey = settings.state.ai.keys.sarvam
            if (!sarvamKey) {
              error.value = 'Sarvam API key not configured'
              return
            }

            const result = await window.api.auraStt.transcribe({
              audioBase64: base64,
              sarvamKey,
              languageCode: 'unknown',
            })
            transcript.value = result.transcript || ''
          } catch (err) {
            error.value = err.message || 'Speech-to-text failed'
          }
        }

        reader.readAsDataURL(blob)
      }

      mediaRecorder.start()
      isRecording.value = true
    } catch (err) {
      error.value = 'Microphone access denied'
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      isRecording.value = false
    }
  }

  function toggleRecording() {
    if (isRecording.value) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return {
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  }
}
