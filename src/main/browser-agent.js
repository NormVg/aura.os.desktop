/**
 * Aura Browser Agent — Autonomous browser automation engine
 *
 * Spawns a real Chromium BrowserWindow, captures screenshots,
 * reasons about page state using a vision-capable model, and
 * executes granular browser actions in a self-correcting loop.
 *
 * If the model does not support vision (images), the agent
 * automatically falls back to text-only mode using DOM text
 * extraction via executeJavaScript.
 */
import { generateText } from 'ai'
import { tool } from 'ai'
import { z } from 'zod'
import { BrowserWindow } from 'electron'

// ── System Prompts ────────────────────────────────────────────
const VISION_SYSTEM_PROMPT = `You are Aura's Browser Agent — an autonomous web automation pilot.

You are controlling a real Chromium browser. After every action, you receive a fresh screenshot of the current page.

# How to operate
1. LOOK at the screenshot carefully to understand the current page state.
2. THINK about what action to take next to accomplish the user's task.
3. ACT by calling exactly ONE tool per reasoning step.
4. REPEAT until the task is done, then call the "done" tool.

# Coordinate System
- Screenshots have a resolution that will be provided. Top-left is (0,0).
- When clicking, estimate the CENTER of the target element's bounding box.
- Be precise with coordinates — off-by-50px is acceptable, but off-by-200px is not.

# Rules
- NEVER guess or hallucinate content — only use what you see in screenshots.
- If a page is loading, use waitFor(1500) and take another screenshot.
- If you encounter a login form, describe it and call done() — NEVER enter credentials.
- If something fails, try a different approach (e.g., use executeJS instead of click).
- Maximum 25 steps. Be efficient.
- Always call done() when finished with a clear summary of what was accomplished.`

const TEXT_ONLY_SYSTEM_PROMPT = `You are Aura's Browser Agent — an autonomous web automation pilot running in TEXT-ONLY mode (no screenshots).

You are controlling a real Chromium browser. After every action, you receive the page's text content, title, and URL — but NO visual screenshot.

# How to operate
1. READ the page text carefully to understand the page structure and content.
2. THINK about what action to take next to accomplish the user's task.
3. ACT by calling tools. Prefer executeJS and getPageInfo for navigation and data extraction since you cannot see the page visually.
4. REPEAT until the task is done, then call the "done" tool.

# Strategy for text-only mode
- Use getPageInfo() liberally to understand what's on the page.
- Use executeJS() to query specific elements: document.querySelector(), document.querySelectorAll(), etc.
- Use executeJS() to click elements by selector instead of coordinates: document.querySelector('a.some-link').click()
- Use executeJS() to fill forms: document.querySelector('input[name="q"]').value = 'search term'
- Use navigate() for direct URL navigation.
- Avoid the click(x,y) tool since you cannot see coordinates.

# Rules
- Use executeJS to interact with the DOM since you have no visual reference for coordinates.
- If a page is loading, use waitFor(1500) and call getPageInfo again.
- If you encounter a login form, describe it and call done() — NEVER enter credentials.
- Maximum 25 steps. Be efficient.
- Always call done() when finished with a clear summary of what was accomplished.`

// ── Screenshot helper ─────────────────────────────────────────
async function captureScreenshot(win) {
  const image = await win.webContents.capturePage()
  return image.toPNG().toString('base64')
}

// ── Page text helper (for text-only fallback) ─────────────────
async function extractPageText(win) {
  try {
    const title = win.webContents.getTitle()
    const url = win.webContents.getURL()
    const bodyText = await win.webContents.executeJavaScript(
      `document.body ? document.body.innerText.substring(0, 5000) : '(empty page)'`
    )
    const links = await win.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('a[href]')).slice(0, 30).map(a => a.textContent.trim() + ' → ' + a.href).join('\\n')`
    )
    const inputs = await win.webContents.executeJavaScript(
      `Array.from(document.querySelectorAll('input, textarea, button, select')).slice(0, 20).map(el => el.tagName + '[' + (el.type||'') + '] name=' + (el.name||'') + ' id=' + (el.id||'') + ' placeholder=' + (el.placeholder||'')).join('\\n')`
    )
    return { title, url, bodyText, links, inputs }
  } catch {
    return { title: '', url: '', bodyText: '(failed to extract page text)', links: '', inputs: '' }
  }
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
      title: 'Aura Browser Agent',
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    sender.send('aura:browser:agent:status', {
      step: 0,
      phase: 'init',
      message: 'Browser window created. Navigating...'
    })

    // Navigate to starting URL
    if (startUrl) {
      await browserWin.loadURL(startUrl)
    } else {
      await browserWin.loadURL('about:blank')
    }

    // 2. Resolve the vision model
    let visionModel
    try {
      visionModel = resolveModel('vision', settings)
    } catch {
      // Fallback to chat model if no vision model assigned
      try {
        visionModel = resolveModel('chat', settings)
      } catch (err) {
        sender.send('aura:browser:agent:done', {
          error: `No vision or chat model configured. Please assign a model in Settings → Model Routing. (${err.message})`
        })
        return { error: 'No model configured' }
      }
    }

    // 3. Define the agent's browser tools
    const browserTools = {
      navigate: tool({
        description: 'Navigate to a URL in the browser.',
        inputSchema: z.object({
          url: z.string().describe('The full URL to navigate to')
        }),
        execute: async ({ url }) => {
          try {
            await browserWin.loadURL(url)
            // Wait a moment for the page to settle
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
          'Click at specific pixel coordinates on the page. Use the screenshot to estimate where to click.',
        inputSchema: z.object({
          x: z.number().describe('X coordinate (pixels from left)'),
          y: z.number().describe('Y coordinate (pixels from top)')
        }),
        execute: async ({ x, y }) => {
          try {
            browserWin.webContents.sendInputEvent({
              type: 'mouseDown',
              x,
              y,
              button: 'left',
              clickCount: 1
            })
            browserWin.webContents.sendInputEvent({
              type: 'mouseUp',
              x,
              y,
              button: 'left',
              clickCount: 1
            })
            await new Promise((r) => setTimeout(r, 800))
            return { success: true, clicked: { x, y } }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      type: tool({
        description:
          'Type text into the currently focused input element. Optionally press Enter after typing.',
        inputSchema: z.object({
          text: z.string().describe('The text to type'),
          pressEnter: z.boolean().optional().default(false).describe('Press Enter after typing')
        }),
        execute: async ({ text, pressEnter }) => {
          try {
            // Use insertText for reliable character input
            await browserWin.webContents.insertText(text)
            if (pressEnter) {
              await new Promise((r) => setTimeout(r, 100))
              browserWin.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Return' })
              browserWin.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Return' })
            }
            await new Promise((r) => setTimeout(r, 500))
            return { success: true, typed: text, pressedEnter: pressEnter }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      scroll: tool({
        description: 'Scroll the page up or down.',
        inputSchema: z.object({
          direction: z.enum(['up', 'down']).describe('Direction to scroll'),
          amount: z.number().optional().default(400).describe('Pixels to scroll')
        }),
        execute: async ({ direction, amount }) => {
          try {
            const deltaY = direction === 'down' ? amount : -amount
            browserWin.webContents.sendInputEvent({
              type: 'mouseWheel',
              x: 640,
              y: 450,
              deltaX: 0,
              deltaY
            })
            await new Promise((r) => setTimeout(r, 500))
            const scrollY = await browserWin.webContents.executeJavaScript('window.scrollY')
            return { success: true, scrollY }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      executeJS: tool({
        description:
          'Execute raw JavaScript in the page context. Use this to interact with elements programmatically, extract data, or perform actions that are hard to do with click/type. In text-only mode, prefer this for clicking elements by CSS selector.',
        inputSchema: z.object({
          script: z.string().describe('JavaScript code to execute in the page')
        }),
        execute: async ({ script }) => {
          try {
            const result = await browserWin.webContents.executeJavaScript(script)
            return { success: true, result: result !== undefined ? String(result) : 'undefined' }
          } catch (err) {
            return { error: err.message }
          }
        }
      }),

      waitFor: tool({
        description:
          'Wait for a specified duration. Use this to let pages load or animations finish.',
        inputSchema: z.object({
          ms: z.number().describe('Milliseconds to wait (max 10000)')
        }),
        execute: async ({ ms }) => {
          const duration = Math.min(ms, 10000)
          await new Promise((r) => setTimeout(r, duration))
          return { waited: duration }
        }
      }),

      getPageInfo: tool({
        description:
          'Get metadata about the current page including title, URL, visible text, links, and form elements. Essential in text-only mode.',
        inputSchema: z.object({}),
        execute: async () => {
          return await extractPageText(browserWin)
        }
      }),

      done: tool({
        description:
          'Signal that the task is complete. Call this when you have finished the automation or cannot proceed further.',
        inputSchema: z.object({
          summary: z
            .string()
            .describe(
              'A brief summary of what was accomplished or why the task could not be completed'
            )
        }),
        execute: async ({ summary }) => {
          return { done: true, summary }
        }
      })
    }

    // 4. Autonomous loop — with automatic vision/text-only detection
    const MAX_STEPS = 25
    let messages = []
    let finished = false
    let finalSummary = ''
    let useVision = true // start optimistic, auto-downgrade on first image error

    for (let step = 0; step < MAX_STEPS && !finished; step++) {
      const pageTitle = browserWin.webContents.getTitle()
      const pageUrl = browserWin.webContents.getURL()

      let stepMessage

      if (useVision) {
        // Vision mode: capture screenshot and send as image content part
        const screenshotBase64 = await captureScreenshot(browserWin)

        sender.send('aura:browser:agent:status', {
          step: step + 1,
          phase: 'thinking',
          message: `[Vision] Analyzing page: ${pageTitle}`,
          screenshot: screenshotBase64,
          url: pageUrl
        })

        stepMessage = {
          role: 'user',
          content: [
            {
              type: 'image',
              image: Buffer.from(screenshotBase64, 'base64'),
              mimeType: 'image/png'
            },
            {
              type: 'text',
              text:
                step === 0
                  ? `TASK: ${task}\n\nThis is the current browser page (${pageUrl}). The viewport is 1280x900 pixels. Analyze the screenshot and decide what to do first.`
                  : `Step ${step + 1}: Here is the updated page after your last action (${pageUrl}). What should we do next?`
            }
          ]
        }
      } else {
        // Text-only mode: extract DOM text and pass as plain text
        const pageInfo = await extractPageText(browserWin)

        sender.send('aura:browser:agent:status', {
          step: step + 1,
          phase: 'thinking',
          message: `[Text] Reading page: ${pageTitle}`,
          url: pageUrl
        })

        const pageDescription = `PAGE TITLE: ${pageInfo.title}
URL: ${pageInfo.url}

PAGE TEXT (first 5000 chars):
${pageInfo.bodyText}

LINKS ON PAGE:
${pageInfo.links || '(none found)'}

FORM ELEMENTS:
${pageInfo.inputs || '(none found)'}`

        stepMessage = {
          role: 'user',
          content:
            step === 0
              ? `TASK: ${task}\n\nHere is the current page content:\n\n${pageDescription}\n\nDecide what to do first. Use executeJS to interact with elements by CSS selector since you cannot see the page visually.`
              : `Step ${step + 1}: Here is the updated page after your last action:\n\n${pageDescription}\n\nWhat should we do next?`
        }
      }

      messages.push(stepMessage)

      try {
        // Call the model with all browser tools
        const result = await generateText({
          model: visionModel,
          system: useVision ? VISION_SYSTEM_PROMPT : TEXT_ONLY_SYSTEM_PROMPT,
          messages,
          tools: browserTools,
          maxSteps: 3
        })

        // Capture the assistant's response into history
        if (result.text) {
          messages.push({ role: 'assistant', content: result.text })
        }

        // Check tool results for "done" signal
        if (result.steps) {
          for (const agentStep of result.steps) {
            if (agentStep.toolResults) {
              for (const tr of agentStep.toolResults) {
                sender.send('aura:browser:agent:status', {
                  step: step + 1,
                  phase: 'acting',
                  message: `Executed: ${tr.toolName}`,
                  toolName: tr.toolName,
                  args: tr.args
                })

                if (tr.result && tr.result.done) {
                  finished = true
                  finalSummary = tr.result.summary
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('[BrowserAgent] Step error:', err)

        // Detect image/vision incompatibility and auto-downgrade
        const errMsg = (err.message || '') + (err.responseBody || '')
        const isImageError =
          errMsg.includes('image') ||
          errMsg.includes('ImageData') ||
          errMsg.includes('unmarshal') ||
          errMsg.includes('vision') ||
          errMsg.includes('multimodal')

        if (useVision && isImageError) {
          console.log('[BrowserAgent] Vision not supported by model. Switching to text-only mode.')
          useVision = false

          sender.send('aura:browser:agent:status', {
            step: step + 1,
            phase: 'fallback',
            message:
              'Model does not support vision/images. Switching to text-only DOM analysis mode.'
          })

          // Remove the failed image message from history and retry this step
          messages.pop()
          step-- // retry this step in text-only mode
          continue
        }

        sender.send('aura:browser:agent:status', {
          step: step + 1,
          phase: 'error',
          message: `Error: ${err.message}`
        })

        // Try to recover by continuing the loop
        messages.push({
          role: 'assistant',
          content: `I encountered an error: ${err.message}. Let me try a different approach.`
        })
      }
    }

    if (!finished) {
      finalSummary =
        'Browser agent reached maximum step limit (25). The task may be partially completed.'
    }

    // 5. Cleanup
    sender.send('aura:browser:agent:done', {
      success: true,
      summary: finalSummary,
      url: browserWin.webContents.getURL()
    })

    browserWin.close()

    return { success: true, summary: finalSummary }
  } catch (err) {
    console.error('[BrowserAgent] Fatal error:', err)
    if (browserWin && !browserWin.isDestroyed()) browserWin.close()
    sender.send('aura:browser:agent:done', {
      error: err.message
    })
    return { error: err.message }
  }
}
