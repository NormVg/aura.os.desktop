/**
 * Question Manager - Handles AI questions to users
 */
import { randomUUID } from 'crypto'
import { BrowserWindow } from 'electron'

class QuestionManager {
  constructor() {
    this.pendingQuestions = new Map()
  }

  async askQuestion({ question, options, allowCustom = true, customPlaceholder }) {
    const id = randomUUID()

    const questionData = {
      id,
      question,
      options,
      allowCustom,
      customPlaceholder: customPlaceholder || 'Enter your answer...',
      timestamp: Date.now()
    }

    // Create promise that will be resolved when user answers
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingQuestions.delete(id)
        resolve({ answer: 'timeout', isCustom: false, timestamp: Date.now() })
      }, 300000) // 5 minute timeout

      this.pendingQuestions.set(id, {
        data: questionData,
        resolve: (response) => {
          clearTimeout(timeout)
          resolve(response)
        },
        reject: (error) => {
          clearTimeout(timeout)
          reject(error)
        },
        timeout
      })
    })

    // Send question to renderer
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('aura:question:ask', questionData)
    }

    // Wait for user response
    const response = await promise

    // Clean up
    this.pendingQuestions.delete(id)

    return response
  }

  resolveQuestion(id, answer) {
    const question = this.pendingQuestions.get(id)
    if (question) {
      question.resolve(answer)
    }
  }

  rejectQuestion(id, error) {
    const question = this.pendingQuestions.get(id)
    if (question) {
      question.reject(error)
    }
  }
}

export const questionManager = new QuestionManager()
