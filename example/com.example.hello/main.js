/**
 * Hello Plugin - Example plugin for testing
 */
export default function(api) {
  api.log('Hello Plugin initializing...')

  return {
    activate() {
      api.log('Hello Plugin activated!')
      api.log('Plugin info:', api.getPluginInfo())
    },

    deactivate() {
      api.log('Hello Plugin deactivated!')
    }
  }
}
