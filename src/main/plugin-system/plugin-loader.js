/**
 * Plugin Loader - Loads and unloads plugin code
 */
import { pathToFileURL } from 'url'

export class PluginLoader {
  constructor() {
    this.loadedPlugins = new Map() // pluginId -> { instance, cleanup }
  }

  /**
   * Load a plugin
   * @param {import('./types.js').Plugin} plugin - Plugin to load
   * @param {any} api - Plugin API to inject
   * @returns {Promise<void>}
   */
  async loadPlugin(plugin, api) {
    try {
      // Dynamically import the plugin's main entry point
      const mainPath = pathToFileURL(plugin.path + '/' + plugin.manifest.main).href
      const pluginModule = await import(mainPath)

      // Get the default export (plugin factory function)
      const pluginFactory = pluginModule.default || pluginModule

      if (typeof pluginFactory !== 'function') {
        throw new Error('Plugin must export a function as default export')
      }

      // Execute plugin factory with API
      const pluginInstance = pluginFactory(api)

      // Call activate lifecycle hook if present
      if (pluginInstance && typeof pluginInstance.activate === 'function') {
        await pluginInstance.activate()
      }

      // Store instance
      this.loadedPlugins.set(plugin.id, {
        instance: pluginInstance,
        cleanup: []
      })

      plugin.instance = pluginInstance
      plugin.loaded = true
      plugin.activatedAt = new Date()

      console.log(`[PluginLoader] Loaded plugin: ${plugin.id}`)
    } catch (err) {
      plugin.error = err.message
      plugin.loaded = false
      console.error(`[PluginLoader] Failed to load plugin ${plugin.id}:`, err)
      throw err
    }
  }

  /**
   * Unload a plugin
   * @param {import('./types.js').Plugin} plugin - Plugin to unload
   * @returns {Promise<void>}
   */
  async unloadPlugin(plugin) {
    const loaded = this.loadedPlugins.get(plugin.id)
    if (!loaded) {
      return
    }

    try {
      // Call deactivate lifecycle hook if present
      if (loaded.instance && typeof loaded.instance.deactivate === 'function') {
        await loaded.instance.deactivate()
      }

      // Run cleanup functions
      for (const cleanup of loaded.cleanup) {
        try {
          cleanup()
        } catch (err) {
          console.error(`[PluginLoader] Cleanup error for ${plugin.id}:`, err)
        }
      }

      // Remove from loaded plugins
      this.loadedPlugins.delete(plugin.id)

      plugin.instance = null
      plugin.loaded = false
      plugin.deactivatedAt = new Date()

      console.log(`[PluginLoader] Unloaded plugin: ${plugin.id}`)
    } catch (err) {
      console.error(`[PluginLoader] Failed to unload plugin ${plugin.id}:`, err)
      throw err
    }
  }

  /**
   * Reload a plugin
   * @param {import('./types.js').Plugin} plugin - Plugin to reload
   * @param {any} api - Plugin API to inject
   * @returns {Promise<void>}
   */
  async reloadPlugin(plugin, api) {
    await this.unloadPlugin(plugin)
    await this.loadPlugin(plugin, api)
  }

  /**
   * Add cleanup function for a plugin
   * @param {string} pluginId - Plugin ID
   * @param {Function} cleanup - Cleanup function
   */
  addCleanup(pluginId, cleanup) {
    const loaded = this.loadedPlugins.get(pluginId)
    if (loaded) {
      loaded.cleanup.push(cleanup)
    }
  }
}
