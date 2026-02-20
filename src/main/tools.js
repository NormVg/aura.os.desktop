/**
 * Aura OS — Tool definitions
 * Single config file for all AI tools.
 */
import { tool } from 'ai'
import { z } from 'zod'
import { shell, ipcMain } from 'electron'

// ── Tools registry ────────────────────────────────────────────
export const auraTools = {
  getCurrentTime: tool({
    description: 'Get the current date and time in a human-readable format',
    inputSchema: z.object({}),
    execute: async () => {
      const now = new Date()
      return {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        iso: now.toISOString(),
        day: now.toLocaleDateString('en-US', { weekday: 'long' })
      }
    }
  }),

  calculate: tool({
    description:
      'Evaluate a mathematical expression and return the result. Supports basic arithmetic (+, -, *, /, **, %), trigonometric functions (Math.sin, Math.cos, etc.), and constants (Math.PI, Math.E).',
    inputSchema: z.object({
      expression: z
        .string()
        .describe('The math expression to evaluate, e.g. "42 * 17" or "Math.sqrt(144)"')
    }),
    execute: async ({ expression }) => {
      try {
        // Whitelist safe math operations only
        const sanitized = expression.replace(/[^0-9+\-*/().%\s,a-zA-Z]/g, '')
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${sanitized})`)()
        return { expression, result: Number(result), formatted: `${expression} = ${result}` }
      } catch (err) {
        return { expression, error: err.message }
      }
    }
  }),

  getWeather: tool({
    description:
      'Get the current weather for a city. Returns temperature, conditions, and humidity.',
    inputSchema: z.object({
      city: z.string().describe('The city name, e.g. "Mumbai" or "San Francisco"')
    }),
    execute: async ({ city }) => {
      // Mock weather data for now (can be replaced with real API later)
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm', 'Clear']
      const condition = conditions[Math.floor(Math.random() * conditions.length)]
      const temp = Math.floor(Math.random() * 25) + 15
      const humidity = Math.floor(Math.random() * 40) + 40
      return {
        city,
        temperature: `${temp}°C`,
        condition,
        humidity: `${humidity}%`,
        note: '(Mock data — connect a real weather API for production)'
      }
    }
  }),

  openUrl: tool({
    description: "Open a URL in the user's default web browser",
    inputSchema: z.object({
      url: z.string().describe('The URL to open, e.g. "https://google.com"')
    }),
    execute: async ({ url }) => {
      await shell.openExternal(url)
      return { opened: url, success: true }
    }
  }),

  wait: tool({
    description:
      'Pause and wait for a specified number of seconds before continuing. Use this when you need to delay an action, respect rate limits, or wait before the next step.',
    inputSchema: z.object({
      seconds: z.number().min(1).max(30).describe('Number of seconds to wait (1-30)'),
      reason: z.string().optional().describe('Why the wait is needed')
    }),
    execute: async ({ seconds, reason }) => {
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
      return { waited: `${seconds}s`, reason: reason || 'No reason given' }
    }
  }),

  askQuestion: tool({
    description:
      'Ask the user a multiple-choice question with optional custom answer field. Use this when you need specific information from the user in a structured format.',
    inputSchema: z.object({
      question: z.string().describe('The question to ask the user'),
      options: z.array(z.string()).min(2).describe('Array of choice options (minimum 2)'),
      allowCustom: z.boolean().optional().default(true).describe('Allow custom answer input'),
      customPlaceholder: z.string().optional().describe('Placeholder text for custom input field')
    }),
    execute: async ({ question, options, allowCustom = true, customPlaceholder }) => {
      const { questionManager } = await import('./question-manager.js')
      return await questionManager.askQuestion({
        question,
        options,
        allowCustom,
        customPlaceholder
      })
    }
  }),

  speak: tool({
    description:
      'Convert text to speech and play it aloud. Use this when you want to speak something to the user audibly.',
    inputSchema: z.object({
      text: z.string().describe('The text to speak aloud')
    }),
    execute: async ({ text }) => {
      const { BrowserWindow } = await import('electron')
      const { ipcMain } = await import('electron')

      // Send TTS request to renderer
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return { error: 'No active window found' }
      }

      win.webContents.send('aura:tool:speak', { text })

      // Wait for audio to finish playing
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          ipcMain.removeHandler('aura:tool:speak:done')
          resolve({
            success: true,
            text,
            message: 'Speaking timeout'
          })
        }, 30000) // 30 second timeout

        ipcMain.handleOnce('aura:tool:speak:done', async () => {
          clearTimeout(timeoutId)
          resolve({
            success: true,
            text,
            message: 'Finished speaking'
          })
        })
      })
    }
  }),

  listen: tool({
    description:
      "Listen to the user's voice input and transcribe it to text. Use this when you want to hear what the user says. Note: Use the speak tool first if you want to ask a question before listening.",
    inputSchema: z.object({
      timeout: z.number().optional().default(10).describe('Maximum seconds to listen (default: 10)')
    }),
    execute: async ({ timeout = 10 }) => {
      const { BrowserWindow } = await import('electron')
      const { ipcMain } = await import('electron')

      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return { error: 'No active window found' }
      }

      // Send request to renderer to start recording (no prompt)
      win.webContents.send('aura:tool:listen:start', { timeout })

      // Wait for transcript from renderer
      return new Promise((resolve) => {
        const timeoutId = setTimeout(
          () => {
            ipcMain.removeListener('aura:tool:listen:result', listener)
            resolve({ error: 'Listening timeout', timeout })
          },
          (timeout + 5) * 1000
        ) // Extra 5 seconds for processing

        const listener = (event, result) => {
          clearTimeout(timeoutId)
          ipcMain.removeListener('aura:tool:listen:result', listener)
          resolve(result)
        }

        ipcMain.once('aura:tool:listen:result', listener)
      })
    }
  }),

  widgetControl: tool({
    description:
      'Control widgets on the canvas. Can create, update, or retrieve data from widgets. Available widget types: "mermaid" (diagram editor), "note" (markdown notes), "todo" (task list), "image" (image viewer), "timer" (countdown timer).',
    inputSchema: z.object({
      action: z
        .enum(['create', 'update', 'get'])
        .describe(
          'Action to perform: create (new widget), update (modify existing), get (retrieve data)'
        ),
      widgetType: z
        .enum(['mermaid', 'note', 'todo', 'image', 'timer'])
        .optional()
        .describe('Type of widget (required for create)'),
      widgetId: z.number().optional().describe('Widget ID (required for update/get)'),
      data: z
        .string()
        .optional()
        .describe(
          'Data to set (for mermaid: diagram code, for note: markdown content, for todo: JSON array of items, for image: image URL, for timer: JSON with minutes and seconds)'
        ),
      title: z.string().optional().describe('Widget title'),
      position: z
        .object({
          x: z.number().optional(),
          y: z.number().optional()
        })
        .optional()
        .describe('Widget position on canvas'),
      size: z
        .object({
          w: z.number().optional(),
          h: z.number().optional()
        })
        .optional()
        .describe('Widget size')
    }),
    execute: async ({ action, widgetType, widgetId, data, position, size }) => {
      const { BrowserWindow } = await import('electron')

      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        return { error: 'No active window found' }
      }

      win.webContents.send('aura:tool:widget', {
        action,
        widgetType,
        widgetId,
        data,
        position,
        size
      })

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          ipcMain.removeListener('aura:tool:widget:result', listener)
          resolve({
            error:
              'Widget control timeout - no response from renderer within 15 seconds. The canvas may be overloaded. Let the user know.'
          })
        }, 15000)

        const listener = (event, result) => {
          clearTimeout(timeoutId)
          ipcMain.removeListener('aura:tool:widget:result', listener)
          resolve(result)
        }

        ipcMain.once('aura:tool:widget:result', listener)
      })
    }
  })
}
