/**
 * Plugin Manager - Orchestrates plugin discovery, loading, and lifecycle
 */
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'
import { PluginValidator } from './plugin-validator.js'
import { PluginLoader } from './plugin-loader.js'
import { PluginAPI } from './plugin-api.js'

export class PluginManager {
  constructor() {
    this.validator = new PluginValidator()
    this.loader = new PluginLoader()
    this.plugins = new Map() // pluginId -> Plugin
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins')
  }

  /**
   * Initialize plugin system
   * @returns {Promise<void>}
   */
  async initialize() {
    // Ensure plugins directory exists
    try {
      await fs.mkdir(this.pluginsDir, { recursive: true })
    } catch (err) {
      console.error('[PluginManager] Failed to create plugins directory:', err)
    }

    // Discover and load enabled plugins
    await this.discoverPlugins()
    await this.initializePlugins()

    console.log(`[PluginManager] Initialized with ${this.plugins.size} plugins`)
  }

  /**
   * Discover plugins in plugins directory
   * @returns {Promise<void>}
   */
  async discoverPlugins() {
    try {
      const entries = await fs.readdir(this.pluginsDir, { withFileTypes: true })
      const pluginDirs = entries.filter((e) => e.isDirectory())

      for (const dir of pluginDirs) {
        const pluginPath = path.join(this.pluginsDir, dir.name)
        try {
          const { manifest, validation } = await this.validator.validatePlugin(pluginPath)

          if (!validation.valid) {
            console.warn(`[PluginManager] Invalid plugin at ${pluginPath}:`, validation.errors)
            continue
          }

          // Check for duplicate ID
          if (this.plugins.has(manifest.id)) {
            console.warn(`[PluginManager] Duplicate plugin ID: ${manifest.id}`)
            continue
          }

          // Create plugin object
          const plugin = {
            id: manifest.id,
            manifest,
            path: pluginPath,
            enabled: true, // Default to enabled for MVP
            loaded: false,
            error: null,
            instance: null,
            api: null,
            activatedAt: null,
            deactivatedAt: null
          }

          this.plugins.set(manifest.id, plugin)
          console.log(`[PluginManager] Discovered plugin: ${manifest.id}`)
        } catch (err) {
          console.error(`[PluginManager] Error discovering plugin at ${pluginPath}:`, err)
        }
      }
    } catch (err) {
      console.error('[PluginManager] Failed to discover plugins:', err)
    }
  }

  /**
   * Initialize all enabled plugins
   * @returns {Promise<void>}
   */
  async initializePlugins() {
    for (const plugin of this.plugins.values()) {
      if (plugin.enabled && !plugin.loaded) {
        try {
          await this.enablePlugin(plugin.id)
        } catch (err) {
          console.error(`[PluginManager] Failed to initialize plugin ${plugin.id}:`, err)
        }
      }
    }
  }

  /**
   * Enable a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<boolean>}
   */
  async enablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (plugin.loaded) {
      return true
    }

    try {
      // Create Plugin API
      plugin.api = new PluginAPI(plugin, this)

      // Load plugin
      await this.loader.loadPlugin(plugin, plugin.api)

      plugin.enabled = true
      return true
    } catch (err) {
      plugin.error = err.message
      plugin.enabled = false
      throw err
    }
  }

  /**
   * Disable a plugin
   * @param {string} pluginId - Plugin ID
   * @returns {Promise<boolean>}
   */
  async disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (!plugin.loaded) {
      return true
    }

    try {
      await this.loader.unloadPlugin(plugin)
      plugin.enabled = false
      return true
    } catch (err) {
      throw err
    }
  }

  /**
   * Get all installed plugins
   * @returns {import('./types.js').Plugin[]}
   */
  getInstalledPlugins() {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugin by ID
   * @param {string} pluginId - Plugin ID
   * @returns {import('./types.js').Plugin | null}
   */
  getPluginById(pluginId) {
    return this.plugins.get(pluginId) || null
  }

  /**
   * Install a plugin from a source directory
   * @param {string} sourcePath - Path to plugin source directory
   * @returns {Promise<{success: boolean, error?: string, pluginId?: string}>}
   */
  async installPlugin(sourcePath) {
    try {
      // Validate plugin
      const { manifest, validation } = await this.validator.validatePlugin(sourcePath)

      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
        }
      }

      // Check for duplicate ID
      if (this.plugins.has(manifest.id)) {
        return {
          success: false,
          error: `Plugin with ID "${manifest.id}" is already installed`
        }
      }

      // Copy plugin to plugins directory
      const destPath = path.join(this.pluginsDir, manifest.id)
      await this.copyDirectory(sourcePath, destPath)

      // Create plugin object
      const plugin = {
        id: manifest.id,
        manifest,
        path: destPath,
        enabled: true,
        loaded: false,
        error: null,
        instance: null,
        api: null,
        activatedAt: null,
        deactivatedAt: null
      }

      this.plugins.set(manifest.id, plugin)

      // Enable the plugin
      await this.enablePlugin(manifest.id)

      console.log(`[PluginManager] Installed plugin: ${manifest.id}`)

      return {
        success: true,
        pluginId: manifest.id
      }
    } catch (err) {
      console.error('[PluginManager] Failed to install plugin:', err)
      return {
        success: false,
        error: err.message
      }
    }
  }

  /**
   * Copy directory recursively
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @returns {Promise<void>}
   */
  async copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true })
    const entries = await fs.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath)
      } else {
        await fs.copyFile(srcPath, destPath)
      }
    }
  }

  /**
   * Shutdown all plugins
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log('[PluginManager] Shutting down plugins...')
    for (const plugin of this.plugins.values()) {
      if (plugin.loaded) {
        try {
          await this.disablePlugin(plugin.id)
        } catch (err) {
          console.error(`[PluginManager] Error shutting down plugin ${plugin.id}:`, err)
        }
      }
    }
  }
}
