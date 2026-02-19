import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { handleChat, handleSTT, handleVoiceConvo } from './ai-service.js'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    menuBarVisible: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // ── State Persistence ──────────────────────────────────────
  const STATE_PATH = path.join(app.getPath('userData'), 'aura-state.json')

  ipcMain.handle('state:load', async () => {
    try {
      const data = await fs.readFile(STATE_PATH, 'utf-8')
      return JSON.parse(data)
    } catch (e) {
      return {} // return empty if file doesn't exist or error
    }
  })

  ipcMain.handle('state:save', async (_, key, value) => {
    try {
      let current = {}
      try {
        const fileContent = await fs.readFile(STATE_PATH, 'utf-8')
        current = JSON.parse(fileContent)
      } catch (e) {
        // file doesn't exist or is invalid, start fresh
      }

      current[key] = value
      await fs.writeFile(STATE_PATH, JSON.stringify(current, null, 2))
      return true
    } catch (e) {
      console.error('Failed to save state:', e)
      return false
    }
  })

  // ── AI Chat ───────────────────────────────────────────────
  ipcMain.handle('aura:chat', async (event, payload) => {
    await handleChat({
      messages: payload.messages,
      role: payload.role || 'chat',
      settings: payload.settings,
      sender: event.sender,
    })
  })

  // ── Speech-to-Text ────────────────────────────────────────
  ipcMain.handle('aura:stt', async (_, payload) => {
    return await handleSTT({
      audioBase64: payload.audioBase64,
      sarvamKey: payload.sarvamKey,
      languageCode: payload.languageCode,
    })
  })

  // ── Voice-to-Voice Conversation ───────────────────────────
  ipcMain.handle('aura:voice:convo', async (event, payload) => {
    await handleVoiceConvo({
      audioBase64: payload.audioBase64,
      settings: payload.settings,
      messages: payload.messages || [],
      sender: event.sender,
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
