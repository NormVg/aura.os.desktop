import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePluginsStore = defineStore('plugins', () => {
  const plugins = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadPlugins() {
    if (!window.api?.auraPlugins) return

    loading.value = true
    error.value = null

    try {
      plugins.value = await window.api.auraPlugins.list()
    } catch (err) {
      error.value = err.message
      console.error('[PluginsStore] Failed to load plugins:', err)
    } finally {
      loading.value = false
    }
  }

  async function enablePlugin(pluginId) {
    if (!window.api?.auraPlugins) return

    try {
      const result = await window.api.auraPlugins.enable(pluginId)
      if (result.success) {
        await loadPlugins()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function disablePlugin(pluginId) {
    if (!window.api?.auraPlugins) return

    try {
      const result = await window.api.auraPlugins.disable(pluginId)
      if (result.success) {
        await loadPlugins()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function installPlugin() {
    if (!window.api?.auraPlugins) return

    try {
      const result = await window.api.auraPlugins.install()

      if (result.canceled) {
        return { canceled: true }
      }

      if (result.success) {
        await loadPlugins()
        return { success: true, pluginId: result.pluginId }
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    plugins,
    loading,
    error,
    loadPlugins,
    enablePlugin,
    disablePlugin,
    installPlugin
  }
})
