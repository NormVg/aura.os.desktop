/**
 * Plugin System Type Definitions
 * Using JSDoc for TypeScript-like type safety
 */

/**
 * @typedef {'storage' | 'ai:chat' | 'ai:tools' | 'ui:components' | 'ui:settings' | 'ui:sidebar' | 'notifications' | 'clipboard' | 'filesystem:read' | 'filesystem:write' | 'network'} Permission
 */

/**
 * @typedef {'sidebar' | 'settings' | 'chat-toolbar' | 'main-panel' | 'context-menu'} UILocation
 */

/**
 * @typedef {Object} ComponentContribution
 * @property {string} id - Component identifier
 * @property {UILocation} location - Where to render
 * @property {string} component - Path to Vue component file
 * @property {Record<string, any>} [props] - Default props
 * @property {number} [order] - Display order
 */

/**
 * @typedef {Object} SettingsContribution
 * @property {string} id - Settings panel identifier
 * @property {string} title - Panel title
 * @property {string} component - Path to settings component
 */

/**
 * @typedef {Object} SidebarContribution
 * @property {string} id - Sidebar item identifier
 * @property {string} label - Display label
 * @property {string} [icon] - Icon path or name
 * @property {string} component - Component to show when clicked
 * @property {number} [order] - Display order
 */

/**
 * @typedef {Object} ToolParameter
 * @property {string} name - Parameter name
 * @property {'string' | 'number' | 'boolean' | 'object' | 'array'} type - Parameter type
 * @property {string} description - Parameter description
 * @property {boolean} required - Whether parameter is required
 * @property {any} [default] - Default value
 */

/**
 * @typedef {Object} ToolContribution
 * @property {string} name - Tool name for AI
 * @property {string} description - What the tool does
 * @property {ToolParameter[]} parameters - Tool parameters schema
 * @property {string} handler - Path to handler function
 */

/**
 * @typedef {Object} PluginContributions
 * @property {ComponentContribution[]} [components] - UI components
 * @property {SettingsContribution} [settings] - Settings panel
 * @property {SidebarContribution[]} [sidebar] - Sidebar items
 * @property {ToolContribution[]} [tools] - AI tools
 */

/**
 * @typedef {Object} PluginManifest
 * @property {string} id - Unique identifier (e.g., "com.example.weather")
 * @property {string} name - Display name
 * @property {string} version - Semantic version (e.g., "1.0.0")
 * @property {string} description - Short description
 * @property {string} author - Author name
 * @property {string} auraVersion - Compatible Aura version (e.g., "^1.0.0")
 * @property {string} main - Main process entry (e.g., "./main.js")
 * @property {string} [renderer] - Renderer process entry (e.g., "./renderer.js")
 * @property {Permission[]} permissions - Requested permissions
 * @property {PluginContributions} [contributes] - UI/tool contributions
 * @property {Record<string, string>} [dependencies] - Dependencies
 * @property {string} [icon] - Path to plugin icon
 * @property {string} [homepage] - Homepage URL
 * @property {string} [repository] - Repository URL
 * @property {string} [license] - License identifier
 */

/**
 * @typedef {Object} PermissionGrant
 * @property {Permission} permission - Permission type
 * @property {boolean} granted - Whether granted
 * @property {Date} [grantedAt] - When granted
 */

/**
 * @typedef {Object} Plugin
 * @property {string} id - Plugin ID
 * @property {PluginManifest} manifest - Plugin manifest
 * @property {string} path - Absolute path to plugin directory
 * @property {boolean} enabled - Whether plugin is enabled
 * @property {boolean} loaded - Whether plugin is loaded
 * @property {string} [error] - Error message if failed
 * @property {any} [instance] - Plugin instance from entry point
 * @property {any} [api] - Injected API
 * @property {Date} [activatedAt] - When activated
 * @property {Date} [deactivatedAt] - When deactivated
 */

/**
 * @typedef {Object} ValidationError
 * @property {string} field - Field that failed validation
 * @property {string} message - Error message
 */

/**
 * @typedef {Object} ValidationWarning
 * @property {string} field - Field with warning
 * @property {string} message - Warning message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} errors - Validation errors
 * @property {ValidationWarning[]} warnings - Validation warnings
 */

/**
 * @typedef {Object} PluginSettings
 * @property {string} pluginId - Plugin ID
 * @property {boolean} enabled - Whether enabled
 * @property {Record<string, any>} config - Plugin-specific configuration
 * @property {PermissionGrant[]} permissions - Permission grants
 */

export {}
