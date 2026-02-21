#!/usr/bin/env node
/**
 * Aura Browser Agent — Vision Debug Script
 *
 * Tests image/vision support at each layer:
 *   1. Raw Ollama API (direct HTTP POST)
 *   2. AI SDK + ollama-ai-provider-v2
 *   3. AI SDK + Google Gemini (if key set)
 *   4. AI SDK + OpenRouter (if key set)
 *
 * Run: node src/main/debug-vision.mjs
 */

import { generateText } from 'ai'
import { createOllama } from 'ai-sdk-ollama'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import fs from 'fs'
import path from 'path'

// ── Config ────────────────────────────────────────────────────
const OLLAMA_BASE = 'http://localhost:11434'
const OLLAMA_VISION_MODEL = 'qwen3-vl:235b-cloud' // change to your model
const GOOGLE_API_KEY = '' // paste here to test Google
const OPENROUTER_API_KEY = '' // paste here to test OpenRouter

// ── Create a tiny test image (1x1 red PNG) ────────────────────
function createTestPNG() {
  // Minimal valid 1x1 red PNG (67 bytes)
  const pngHex =
    '89504e470d0a1a0a0000000d494844520000000100000001080200' +
    '00009001260000000f49444154789c626460f80f00000101006018' +
    'e3660000000049454e44ae426082'
  return Buffer.from(pngHex, 'hex')
}

// ── Use a real screenshot if available ────────────────────────
async function getTestImage() {
  // First check if we have a saved screenshot
  const screenshotPath = path.join(process.cwd(), 'debug-screenshot.png')
  if (fs.existsSync(screenshotPath)) {
    console.log('  Using saved screenshot:', screenshotPath)
    return fs.readFileSync(screenshotPath)
  }
  console.log('  Using synthetic 1x1 red PNG (no screenshot available)')
  console.log('  Tip: Save a real screenshot as debug-screenshot.png in project root\n')
  return createTestPNG()
}

// ── Divider ───────────────────────────────────────────────────
function divider(label) {
  console.log('\n' + '═'.repeat(60))
  console.log(`  ${label}`)
  console.log('═'.repeat(60))
}

// ── Test 1: Raw Ollama API ────────────────────────────────────
async function testRawOllama(imageBuffer) {
  divider('TEST 1: Raw Ollama API (direct HTTP POST)')

  const base64 = imageBuffer.toString('base64')
  console.log('  Image size:', imageBuffer.length, 'bytes')
  console.log('  Base64 length:', base64.length, 'chars')
  console.log('  Base64 preview:', base64.substring(0, 60) + '...')
  console.log('  Model:', OLLAMA_VISION_MODEL)
  console.log()

  // Ollama expects images as raw base64 strings in the images array
  const payload = {
    model: OLLAMA_VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: 'What do you see in this image? Be very brief.',
        images: [base64] // Ollama native format: array of base64 strings
      }
    ],
    stream: false
  }

  console.log('  Sending request...')
  try {
    const resp = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const body = await resp.text()
    console.log('  Status:', resp.status, resp.statusText)

    if (resp.ok) {
      const data = JSON.parse(body)
      console.log('  ✅ SUCCESS! Response:', data.message?.content?.substring(0, 200))
    } else {
      console.log('  ❌ FAILED! Response body:', body.substring(0, 300))
    }
  } catch (err) {
    console.log('  ❌ ERROR:', err.message)
  }
}

// ── Test 2: AI SDK + Ollama Provider ──────────────────────────
async function testAISDKOllama(imageBuffer) {
  divider('TEST 2: AI SDK + ai-sdk-ollama')

  const base64 = imageBuffer.toString('base64')
  console.log('  Model:', OLLAMA_VISION_MODEL)
  console.log()

  const ollama = createOllama({ baseURL: OLLAMA_BASE })
  const model = ollama(OLLAMA_VISION_MODEL)

  // Test A: Buffer directly
  console.log('  --- Test 2A: image as Buffer (type: file) ---')
  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              // The critical fix: ai-sdk-ollama uses 'file' for images
              type: 'file',
              data: imageBuffer,
              mediaType: 'image/png'
            },
            { type: 'text', text: 'What do you see? Be very brief.' }
          ]
        }
      ]
    })
    console.log('  ✅ SUCCESS! Response:', result.text?.substring(0, 200))
  } catch (err) {
    console.log('  ❌ FAILED:', err.message?.substring(0, 200))
    if (err.responseBody) console.log('  Response body:', err.responseBody?.substring(0, 200))
    if (err.lastError?.responseBody)
      console.log('  Inner error:', err.lastError.responseBody?.substring(0, 200))
  }

  // Test B: base64 data URL
  console.log('\n  --- Test 2B: image as data URL (type: file) ---')
  try {
    const dataUrl = `data:image/png;base64,${base64}`
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: new URL(dataUrl),
              mediaType: 'image/png'
            },
            { type: 'text', text: 'What do you see? Be very brief.' }
          ]
        }
      ]
    })
    console.log('  ✅ SUCCESS! Response:', result.text?.substring(0, 200))
  } catch (err) {
    console.log('  ❌ FAILED:', err.message?.substring(0, 200))
    if (err.responseBody) console.log('  Response body:', err.responseBody?.substring(0, 200))
    if (err.lastError?.responseBody)
      console.log('  Inner error:', err.lastError.responseBody?.substring(0, 200))
  }

  // Test C: raw base64 string
  console.log('\n  --- Test 2C: image as string (type: file) ---')
  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: base64,
              mediaType: 'image/png'
            },
            { type: 'text', text: 'What do you see? Be very brief.' }
          ]
        }
      ]
    })
    console.log('  ✅ SUCCESS! Response:', result.text?.substring(0, 200))
  } catch (err) {
    console.log('  ❌ FAILED:', err.message?.substring(0, 200))
    if (err.responseBody) console.log('  Response body:', err.responseBody?.substring(0, 200))
    if (err.lastError?.responseBody)
      console.log('  Inner error:', err.lastError.responseBody?.substring(0, 200))
  }
}

// ── Test 3: Check Ollama model capabilities ───────────────────
async function testOllamaModelInfo() {
  divider('TEST 3: Ollama Model Capabilities Check')

  try {
    const resp = await fetch(`http://localhost:11434/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: OLLAMA_VISION_MODEL })
    })

    if (resp.ok) {
      const data = await resp.json()
      const template = data.template || '(no template)'
      const params = data.parameters || '(no params)'
      const families = data.details?.families || []
      const projector = data.details?.families?.includes('clip') || template.includes('image')

      console.log('  Model:', OLLAMA_VISION_MODEL)
      console.log('  Families:', families.join(', ') || '(none)')
      console.log('  Has vision projector (clip):', projector ? '✅ Yes' : '❌ No')
      console.log('  Template preview:', template.substring(0, 200))

      if (!projector) {
        console.log('\n  ⚠️  This model may NOT support vision. Look for "clip" in families.')
      }
    } else {
      const body = await resp.text()
      console.log('  ❌ Failed to get model info:', body.substring(0, 200))
    }
  } catch (err) {
    console.log('  ❌ Error:', err.message)
  }
}

// ── Test 4: AI SDK + Google Gemini (if key set) ───────────────
async function testGoogle(imageBuffer) {
  if (!GOOGLE_API_KEY) {
    divider('TEST 4: Google Gemini — SKIPPED (no API key)')
    console.log('  Set GOOGLE_API_KEY in script to test')
    return
  }

  divider('TEST 4: AI SDK + Google Gemini')

  const google = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })
  const model = google('gemini-2.0-flash')

  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: imageBuffer, mimeType: 'image/png' },
            { type: 'text', text: 'What do you see? Be very brief.' }
          ]
        }
      ]
    })
    console.log('  ✅ SUCCESS! Response:', result.text?.substring(0, 200))
  } catch (err) {
    console.log('  ❌ FAILED:', err.message?.substring(0, 200))
  }
}

// ── Test 5: AI SDK + OpenRouter (if key set) ──────────────────
async function testOpenRouter(imageBuffer) {
  if (!OPENROUTER_API_KEY) {
    divider('TEST 5: OpenRouter — SKIPPED (no API key)')
    console.log('  Set OPENROUTER_API_KEY in script to test')
    return
  }

  divider('TEST 5: AI SDK + OpenRouter')

  const openrouter = createOpenRouter({ apiKey: OPENROUTER_API_KEY })
  const model = openrouter.chat('google/gemini-2.0-flash-001')

  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: imageBuffer, mimeType: 'image/png' },
            { type: 'text', text: 'What do you see? Be very brief.' }
          ]
        }
      ]
    })
    console.log('  ✅ SUCCESS! Response:', result.text?.substring(0, 200))
  } catch (err) {
    console.log('  ❌ FAILED:', err.message?.substring(0, 200))
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🔬 Aura Browser Agent — Vision Debug Tool')
  console.log('  Testing image/vision support across providers...\n')

  const imageBuffer = await getTestImage()

  await testOllamaModelInfo()
  await testRawOllama(imageBuffer)
  await testAISDKOllama(imageBuffer)
  await testGoogle(imageBuffer)
  await testOpenRouter(imageBuffer)

  divider('DONE')
  console.log('  Review results above to identify the failing layer.')
  console.log('  If Test 1 (raw) passes but Test 2 fails,')
  console.log('  the issue is in the ollama-ai-provider-v2 SDK.')
  console.log()
}

main().catch(console.error)
