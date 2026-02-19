/**
 * Plugin API - Provides controlled access to Aura capabilities
 */
export class PluginAPI {
  constructor(plugin, pluginManager) {
    this.plugin = plugin
    this.pluginManager = pluginManager
    this.eventListeners = new Map() // event -> Set<callback>
  }

  /**
   * Get plugin info
   * @returns {{id: string, name: string, version: string}}
   */
  getPluginInfo() {
    return {
      id: this.plugin.id,
      name: this.plugin.manifest.name,
      version: this.plugin.manifest.version
    }
  }

  /**
   * Check if plugin has permission
   * @param {import('./types.js').Permission} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    return this.plugin.manifest.permissions?.includes(permission) || false
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event).add(callback)

    // Add cleanup
    this.pluginManager.loader.addCleanup(this.plugin.id, () => {
      this.off(event, callback)
    })
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data)
        } catch (err) {
          console.error(`[PluginAPI] Event handler error in ${this.plugin.id}:`, err)
        }
      }
    }
  }

  /**
   * Log message
   * @param {...any} args - Log arguments
   */
  log(...args) {
    console.log(`[Plugin:${this.plugin.id}]`, ...args)
  }

  /**
   * Log error
   * @param {...any} args - Error arguments
   */
  error(...args) {
    console.error(`[Plugin:${this.plugin.id}]`, ...args)
  }
}
