/**
 * Aura Browser Agent — Autonomous browser automation engine
 *
 * Architecture: DOM Snapshot + Ref-based Interaction
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Instead of guessing pixel coordinates from screenshots, the agent:
 * 1. Calls snapshot() to label all interactive elements with [data-aura-ref="eN"] IDs
 * 2. Uses click(ref) and fill(ref, text) to interact via querySelector — always works
 * 3. Uses getPageText() to read content
 * 4. navigate() for direct URL navigation
 *
 * Works with any model — no vision required.
 * Inspired by Vercel's agent-browser accessibility-tree approach.
 */
import { generateText, tool, jsonSchema } from 'ai'
import { BrowserWindow } from 'electron'

// ── System Prompt ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Aura's Browser Agent — an autonomous web automation AI.

You control a real Chromium browser using tools. You cannot see the page visually, but you can:
- Get a structured snapshot of all interactive elements via snapshot()
- Click elements by their ref ID (e.g. "e3") via click()
- Type into inputs by ref via fill()
- Navigate to URLs via navigate()
- Read page text content via getPageText()
- Run JavaScript via executeJS()
- Wait for pages to load via waitFor()

## How to operate
1. When you arrive at a new page, call snapshot() FIRST to discover all interactive elements.
2. Use the element refs from snapshot() to click and fill — never guess or make up refs.
3. After navigation or major page changes, call snapshot() again.
4. Use getPageText() to read content like search results, articles, etc.
5. Call done() when the task is complete with a clear summary.

## Rules
- ALWAYS call snapshot() first on any new page before interacting.
- Use refs from snapshot() — never use executeJS just to click if you have the ref.
- If a snapshot yields no useful elements, try getPageText() to understand what's there.
- If something fails, re-snapshot and try a different element.
- Never enter credentials if you see a login form — call done() describing what you found.
- Be efficient — maximum 30 steps.
- Always call done() when finished.`

// ── DOM Snapshot helper ───────────────────────────────────────
const SNAPSHOT_SCRIPT = `
(() => {
  // Tag all interactive elements with stable refs
  const SELECTORS = [
    'a[href]', 'button', 'input', 'textarea', 'select',
    '[role="button"]', '[role="link"]', '[role="textbox"]',
    '[role="checkbox"]', '[role="option"]', '[role="menuitem"]',
    '[onclick]', '[tabindex]:not([tabindex="-1"])'
  ].join(', ')

  const seen = new Set()
  const elements = []
  let id = 1

  for (const el of document.querySelectorAll(SELECTORS)) {
    if (seen.has(el)) continue
    seen.add(el)

    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    if (getComputedStyle(el).visibility === 'hidden') continue
    if (getComputedStyle(el).display === 'none') continue

    const ref = 'e' + id++
    el.setAttribute('data-aura-ref', ref)

    const tag = el.tagName.toLowerCase()
    const type = el.type || ''
    const label = (
      el.getAttribute('aria-label') ||
      el.getAttribute('placeholder') ||
      el.getAttribute('title') ||
      el.getAttribute('name') ||
      el.textContent?.trim().slice(0, 80) ||
      el.value?.slice(0, 40) ||
      ''
    ).replace(/\\s+/g, ' ').trim()

    const entry = { ref, tag, label }
    if (type) entry.type = type
    if (el.href) entry.href = el.href.slice(0, 120)
    if (el.disabled) entry.disabled = true
    if (tag === 'input' || tag === 'textarea') entry.value = el.value || ''

    elements.push(entry)
  }

  return {
    url: location.href,
    title: document.title,
    count: elements.length,
    elements
  }
})()
`

const GET_PAGE_TEXT_SCRIPT = `
(() => {
  const title = document.title
  const url = location.href

  // Get main body text, excluding scripts and styles
  const clone = document.body.cloneNode(true)
  for (const el of clone.querySelectorAll('script, style, noscript, nav, footer')) {
    el.remove()
  }
  const bodyText = (clone.innerText || clone.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 8000)

  // Top links
  const links = Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 40)
    .map(a => a.textContent.trim().slice(0, 60) + ' → ' + a.href)
    .filter(s => s.trim())
    .join('\\n')

  return { title, url, bodyText, links }
})()
`

// ── Error detail extractor (digs into nested AI SDK errors) ──
function extractErrorDetails(err) {
  let details = err.message || ''
  if (err.responseBody) details += ' ' + err.responseBody
  if (err.lastError) {
    details += ' ' + (err.lastError.message || '')
    if (err.lastError.responseBody) details += ' ' + err.lastError.responseBody
  }
  if (err.errors && Array.isArray(err.errors)) {
    for (const e of err.errors) {
      if (e.responseBody) details += ' ' + e.responseBody
    }
  }
  return details
}

// ── Browser Agent Orchestrator ────────────────────────────────
export async function runBrowserAgent({
  task,
  startUrl,
  headless = false,
  settings,
  resolveModel,
  sender
}) {
  let browserWin = null

  try {
    // 1. Create the browser window
    browserWin = new BrowserWindow({
      width: 1280,
      height: 900,
      show: !headless,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    })

    browserWin.webContents.setAudioMuted(true)

    // Navigate to start URL
    if (startUrl && startUrl !== 'about:blank') {
      await browserWin.loadURL(startUrl)
    } else {
      await browserWin.loadURL('about:blank')
    }

    // 2. Resolve the model
    let agentModel
    try {
      agentModel = resolveModel('vision', settings)
    } catch {
      try {
        agentModel = resolveModel('chat', settings)
      } catch (err) {
        sender.send('aura:browser:agent:done', {
          error: `No model configured. Please assign a model in Settings → Model Routing. (${err.message})`
        })
        return { error: 'No model configured' }
      }
    }

    // 3. Define tools — using jsonSchema() instead of Zod to bypass Zod v4/v3 mismatch
    //    in ai-sdk-ollama (which detects Zod via .parse and falls back to empty schemas)
    const browserTools = {
      snapshot: tool({
        description:
          'Get a snapshot of all interactive elements on the current page. Returns a list of elements with ref IDs. ALWAYS call this first when arriving on a new page.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Brief reason for taking a snapshot' }
          },
          required: ['reason']
        }),
        execute: async () => {
          try {
            await new Promise((r) => setTimeout(r, 600))
            const snap = await browserWin.webContents.executeJavaScript(SNAPSHOT_SCRIPT)
            return snap
          } catch (err) {
            return { error: err.message, url: browserWin.webContents.getURL() }
          }
        }
      }),

      navigate: tool({
        description: 'Navigate the browser to a URL.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Full URL to navigate to, including https://' }
          },
          required: ['url']
        }),
        execute: async ({ url }) => {
          try {
            const normalized = url.startsWith('http') ? url : 'https://' + url
            await browserWin.loadURL(normalized)
            await new Promise((r) => setTimeout(r, 1500))
            return {
              success: true,
              title: browserWin.webContents.getTitle(),
              url: browserWin.webContents.getURL()
            }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      click: tool({
        description:
          'Click an element by its ref ID from snapshot(). Get refs by calling snapshot() first.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            ref: { type: 'string', description: 'Element ref from snapshot, e.g. "e3"' }
          },
          required: ['ref']
        }),
        execute: async ({ ref }) => {
          try {
            const result = await browserWin.webContents.executeJavaScript(`
              (() => {
                const el = document.querySelector('[data-aura-ref="${ref}"]')
                if (!el) return { error: 'Element not found: ${ref}. Call snapshot() again.' }
                el.scrollIntoView({ behavior: 'instant', block: 'center' })
                el.focus()
                el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
                el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))
                el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
                return {
                  success: true,
                  tag: el.tagName.toLowerCase(),
                  label: (el.textContent || '').trim().slice(0, 60),
                  href: el.href || ''
                }
              })()
            `)
            await new Promise((r) => setTimeout(r, 800))
            return result
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      fill: tool({
        description:
          'Type text into an input or textarea by ref ID. Clears existing value first.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            ref: { type: 'string', description: 'Element ref from snapshot, e.g. "e2"' },
            text: { type: 'string', description: 'Text to type into the element' },
            submit: { type: 'boolean', description: 'Set true to press Enter after typing to submit' }
          },
          required: ['ref', 'text', 'submit']
        }),
        execute: async ({ ref, text, submit }) => {
          const pressEnter = submit === true
          try {
            const focusResult = await browserWin.webContents.executeJavaScript(`
              (() => {
                const el = document.querySelector('[data-aura-ref="${ref}"]')
                if (!el) return { error: 'Element not found: ${ref}. Call snapshot() again.' }
                el.scrollIntoView({ behavior: 'instant', block: 'center' })
                el.focus()
                el.select?.()
                el.value = ''
                el.dispatchEvent(new Event('input', { bubbles: true }))
                el.dispatchEvent(new Event('change', { bubbles: true }))
                return { success: true, tag: el.tagName.toLowerCase(), cleared: true }
              })()
            `)

            if (focusResult.error) return focusResult

            await browserWin.webContents.insertText(text)
            await new Promise((r) => setTimeout(r, 200))

            await browserWin.webContents.executeJavaScript(`
              (() => {
                const el = document.querySelector('[data-aura-ref="${ref}"]')
                if (el) {
                  el.dispatchEvent(new Event('input', { bubbles: true }))
                  el.dispatchEvent(new Event('change', { bubbles: true }))
                }
              })()
            `)

            if (pressEnter) {
              await new Promise((r) => setTimeout(r, 100))
              browserWin.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
              browserWin.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' })
              await new Promise((r) => setTimeout(r, 1200))
            } else {
              await new Promise((r) => setTimeout(r, 300))
            }

            return { success: true, typed: text, pressedEnter: pressEnter }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      getPageText: tool({
        description:
          'Read the text content of the current page including body text and links.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Brief reason for reading the page' }
          },
          required: ['reason']
        }),
        execute: async () => {
          try {
            await new Promise((r) => setTimeout(r, 400))
            return await browserWin.webContents.executeJavaScript(GET_PAGE_TEXT_SCRIPT)
          } catch (err) {
            return {
              error: err.message,
              title: browserWin.webContents.getTitle(),
              url: browserWin.webContents.getURL()
            }
          }
        }
      }),

      scroll: tool({
        description: 'Scroll the page up or down to reveal more content.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['up', 'down'], description: 'Direction to scroll' },
            pixels: { type: 'number', description: 'Number of pixels to scroll, e.g. 400' }
          },
          required: ['direction', 'pixels']
        }),
        execute: async ({ direction, pixels }) => {
          try {
            const amount = pixels || 400
            const delta = direction === 'down' ? amount : -amount
            await browserWin.webContents.executeJavaScript(
              `window.scrollBy({ top: ${delta}, behavior: 'smooth' })`
            )
            await new Promise((r) => setTimeout(r, 500))
            const scrollY = await browserWin.webContents.executeJavaScript('window.scrollY')
            return { success: true, scrollY, direction, amount }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      executeJS: tool({
        description:
          'Run arbitrary JavaScript in the page context. Use for complex interactions.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            script: { type: 'string', description: 'JavaScript code to execute in the page' }
          },
          required: ['script']
        }),
        execute: async ({ script }) => {
          try {
            const result = await browserWin.webContents.executeJavaScript(script)
            const resultStr =
              result === undefined
                ? 'undefined'
                : result === null
                  ? 'null'
                  : typeof result === 'object'
                    ? JSON.stringify(result).slice(0, 2000)
                    : String(result).slice(0, 2000)
            return { success: true, result: resultStr }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      waitFor: tool({
        description: 'Wait for a specified number of milliseconds. Use after navigation.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            milliseconds: { type: 'number', description: 'Milliseconds to wait, max 8000' }
          },
          required: ['milliseconds']
        }),
        execute: async ({ milliseconds }) => {
          const duration = Math.min(milliseconds || 2000, 8000)
          await new Promise((r) => setTimeout(r, duration))
          return { waited: duration, url: browserWin.webContents.getURL() }
        }
      }),

      done: tool({
        description:
          'Signal that the task is complete. Call when finished or cannot proceed.',
        inputSchema: jsonSchema({
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Summary of what was accomplished' }
          },
          required: ['summary']
        }),
        execute: async ({ summary }) => {
          return { done: true, summary }
        }
      })
    }

    // 4. Run the agent
    const MAX_OUTER_STEPS = 15 // outer loop iterations
    const MAX_INNER_STEPS = 8 // AI SDK inner steps per generateText call
    const MAX_CONSECUTIVE_ERRORS = 3

    let messages = [
      {
        role: 'user',
        content: `TASK: ${task}\n\nThe browser is now open. URL: ${browserWin.webContents.getURL()}\n\nCall snapshot() to see the interactive elements on the page, then take action.`
      }
    ]

    let finished = false
    let finalSummary = ''
    let consecutiveErrors = 0
    let step = 0

    while (step < MAX_OUTER_STEPS && !finished) {
      step++

      const pageTitle = browserWin.webContents.getTitle()
      const pageUrl = browserWin.webContents.getURL()

      sender.send('aura:browser:agent:status', {
        step,
        phase: 'thinking',
        message: `[Step ${step}] Thinking... (page: ${pageTitle || pageUrl})`
      })

      try {
        const result = await generateText({
          model: agentModel,
          system: SYSTEM_PROMPT,
          messages,
          tools: browserTools,
          maxSteps: MAX_INNER_STEPS,
          onStepFinish: ({ text, toolCalls, toolResults }) => {
            // Stream thoughts
            if (text && text.trim()) {
              sender.send('aura:browser:agent:status', {
                step,
                phase: 'thinking',
                message: text.trim()
              })
            }
            // Stream tool calls
            if (toolCalls && toolCalls.length > 0) {
              for (const tc of toolCalls) {
                // Try both .input and .args depending on SDK version
                const args = tc.input ?? tc.args ?? {}
                const argsStr =
                  Object.keys(args).length > 0 ? JSON.stringify(args) : ''
                sender.send('aura:browser:agent:status', {
                  step,
                  phase: 'acting',
                  message: `Call: ${tc.toolName}(${argsStr})`,
                  toolName: tc.toolName,
                  args
                })
              }
            }
            // Stream tool results
            if (toolResults && toolResults.length > 0) {
              for (const tr of toolResults) {
                const res = tr.output ?? tr.result
                const resStr =
                  res === undefined
                    ? 'undefined'
                    : typeof res === 'object'
                      ? JSON.stringify(res).slice(0, 500)
                      : String(res).slice(0, 500)
                sender.send('aura:browser:agent:status', {
                  step,
                  phase: 'acting',
                  message: `Result (${tr.toolName}): ${resStr}`,
                  toolName: tr.toolName
                })
              }
            }
          }
        })

        // Reset error counter on success
        consecutiveErrors = 0

        // Add assistant response to history
        if (result.text && result.text.trim()) {
          messages.push({ role: 'assistant', content: result.text })
        }

        // Check each step's tool results for done()
        if (result.steps) {
          for (const agentStep of result.steps) {
            const toolResults = agentStep.toolResults ?? []
            for (const tr of toolResults) {
              const res = tr.output ?? tr.result
              if (res && res.done === true) {
                finished = true
                finalSummary = res.summary
                break
              }
            }
            if (finished) break
          }
        }

        // Also add the new page context for next iteration
        if (!finished) {
          const newUrl = browserWin.webContents.getURL()
          const newTitle = browserWin.webContents.getTitle()
          messages.push({
            role: 'user',
            content: `[Step ${step} complete] Page is now: "${newTitle}" at ${newUrl}. Continue with the task — call snapshot() if you navigated to a new page.`
          })
        }
      } catch (err) {
        console.error('[BrowserAgent] Step error:', err)
        const errMsg = extractErrorDetails(err)
        consecutiveErrors++

        sender.send('aura:browser:agent:status', {
          step,
          phase: 'error',
          message: `Error (attempt ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${err.message}`
        })

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          const statusCode = err.statusCode || err.lastError?.statusCode || 'unknown'
          finalSummary =
            `Browser agent aborted after ${MAX_CONSECUTIVE_ERRORS} consecutive failures (HTTP ${statusCode}).\n` +
            `This usually means the model doesn't support tool calling or is overloaded.\n` +
            `Try a different model in Settings → Model Routing.\n\nError: ${errMsg.slice(0, 300)}`

          sender.send('aura:browser:agent:status', {
            step,
            phase: 'abort',
            message: `Aborting after ${MAX_CONSECUTIVE_ERRORS} consecutive errors.`
          })

          finished = true
          break
        }

        // Add error context so the model can adapt
        messages.push({
          role: 'user',
          content: `[Error on step ${step}] ${err.message}. Please try a different approach.`
        })
      }
    }

    if (!finished) {
      finalSummary = `Browser agent reached the step limit (${MAX_OUTER_STEPS} outer iterations). Task may be partially completed.`
    }

    // 5. Cleanup
    sender.send('aura:browser:agent:done', {
      success: true,
      summary: finalSummary,
      url: browserWin.isDestroyed() ? '' : browserWin.webContents.getURL()
    })

    if (!browserWin.isDestroyed()) browserWin.close()

    return { success: true, summary: finalSummary }
  } catch (err) {
    console.error('[BrowserAgent] Fatal error:', err)
    if (browserWin && !browserWin.isDestroyed()) browserWin.close()
    sender.send('aura:browser:agent:done', { error: err.message })
    return { error: err.message }
  }
}
