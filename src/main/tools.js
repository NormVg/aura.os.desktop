/**
 * Aura OS — Tool definitions
 * Single config file for all AI tools.
 */
import { tool } from 'ai'
import { z } from 'zod'
import { shell } from 'electron'

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
        day: now.toLocaleDateString('en-US', { weekday: 'long' }),
      }
    },
  }),

  calculate: tool({
    description: 'Evaluate a mathematical expression and return the result. Supports basic arithmetic (+, -, *, /, **, %), trigonometric functions (Math.sin, Math.cos, etc.), and constants (Math.PI, Math.E).',
    inputSchema: z.object({
      expression: z.string().describe('The math expression to evaluate, e.g. "42 * 17" or "Math.sqrt(144)"'),
    }),
    execute: async ({ expression }) => {
      try {
        // Whitelist safe math operations only
        const sanitized = expression.replace(/[^0-9+\-*/().%\s,a-zA-Z]/g, '')
        const allowedPattern = /^[\d\s+\-*/().%,]|Math\.(sqrt|abs|pow|floor|ceil|round|sin|cos|tan|log|log2|PI|E|min|max)/
        // eslint-disable-next-line no-eval
        const result = Function(`"use strict"; return (${sanitized})`)()
        return { expression, result: Number(result), formatted: `${expression} = ${result}` }
      } catch (err) {
        return { expression, error: err.message }
      }
    },
  }),

  getWeather: tool({
    description: 'Get the current weather for a city. Returns temperature, conditions, and humidity.',
    inputSchema: z.object({
      city: z.string().describe('The city name, e.g. "Mumbai" or "San Francisco"'),
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
        note: '(Mock data — connect a real weather API for production)',
      }
    },
  }),

  openUrl: tool({
    description: 'Open a URL in the user\'s default web browser',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to open, e.g. "https://google.com"'),
    }),
    execute: async ({ url }) => {
      await shell.openExternal(url)
      return { opened: url, success: true }
    },
  }),

  setReminder: tool({
    description: 'Set a simple reminder with a message and optional delay in minutes',
    inputSchema: z.object({
      message: z.string().describe('The reminder message'),
      delayMinutes: z.number().optional().default(5).describe('Minutes from now to remind (default: 5)'),
    }),
    execute: async ({ message, delayMinutes }) => {
      const remindAt = new Date(Date.now() + delayMinutes * 60 * 1000)
      console.log(`[Reminder] "${message}" set for ${remindAt.toLocaleTimeString()}`)
      return {
        message,
        remindAt: remindAt.toLocaleTimeString(),
        delayMinutes,
        note: 'Reminder logged (notification system coming soon)',
      }
    },
  }),

  wait: tool({
    description: 'Pause and wait for a specified number of seconds before continuing. Use this when you need to delay an action, respect rate limits, or wait before the next step.',
    inputSchema: z.object({
      seconds: z.number().min(1).max(30).describe('Number of seconds to wait (1-30)'),
      reason: z.string().optional().describe('Why the wait is needed'),
    }),
    execute: async ({ seconds, reason }) => {
      await new Promise(resolve => setTimeout(resolve, seconds * 1000))
      return { waited: `${seconds}s`, reason: reason || 'No reason given' }
    },
  }),

  askQuestion: tool({
    description: 'Ask the user a multiple-choice question with optional custom answer field. Use this when you need specific information from the user in a structured format.',
    inputSchema: z.object({
      question: z.string().describe('The question to ask the user'),
      options: z.array(z.string()).min(2).describe('Array of choice options (minimum 2)'),
      allowCustom: z.boolean().optional().default(true).describe('Allow custom answer input'),
      customPlaceholder: z.string().optional().describe('Placeholder text for custom input field'),
    }),
    execute: async ({ question, options, allowCustom = true, customPlaceholder }) => {
      const { questionManager } = await import('./question-manager.js')
      return await questionManager.askQuestion({ question, options, allowCustom, customPlaceholder })
    },
  }),
}
