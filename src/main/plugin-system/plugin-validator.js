/**
 * Plugin Validator - Validates plugin manifests and structure
 */
import { promises as fs } from 'fs'
import path from 'path'
import semver from 'semver'

const ALLOWED_PERMISSIONS = [
  'storage',
  'ai:chat',
  'ai:tools',
  'ui:components',
  'ui:settings',
  'ui:sidebar',
  'notifications',
  'clipboard',
  'filesystem:read',
  'filesystem:write',
  'network'
]

const AURA_VERSION = '1.0.0' // Current Aura version

export class PluginValidator {
  /**
   * Validate plugin manifest
   * @param {any} manifest - Manifest object to validate
   * @returns {import('./types.js').ValidationResult}
   */
  validateManifest(manifest) {
    const errors = []
    const warnings = []

    // Check if manifest is an object
    if (!manifest || typeof manifest !== 'object') {
      return {
        valid: false,
        errors: [{ field: 'manifest', message: 'Manifest must be a valid object' }],
        warnings: []
      }
    }

    // Required fields
    const requiredFields = ['id', 'name', 'version', 'description', 'author', 'auraVersion', 'main']
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push({ field, message: `Required field '${field}' is missing` })
      }
    }

    // Validate ID format (lowercase dot-separated)
    if (manifest.id && !/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(manifest.id)) {
      errors.push({
        field: 'id',
        message: 'Plugin ID must be lowercase dot-separated (e.g., "com.example.plugin")'
      })
    }

    // Validate version format (semantic versioning)
    if (manifest.version && !semver.valid(manifest.version)) {
      errors.push({
        field: 'version',
        message: 'Version must follow semantic versioning (e.g., "1.0.0")'
      })
    }

    // Validate auraVersion format and compatibility
    if (manifest.auraVersion) {
      if (!semver.validRange(manifest.auraVersion)) {
        errors.push({
          field: 'auraVersion',
          message: 'auraVersion must be a valid semver range (e.g., "^1.0.0")'
        })
      } else if (!semver.satisfies(AURA_VERSION, manifest.auraVersion)) {
        errors.push({
          field: 'auraVersion',
          message: `Plugin requires Aura ${manifest.auraVersion}, but current version is ${AURA_VERSION}`
        })
      }
    }

    // Validate permissions
    if (manifest.permissions) {
      if (!Array.isArray(manifest.permissions)) {
        errors.push({
          field: 'permissions',
          message: 'Permissions must be an array'
        })
      } else {
        for (const permission of manifest.permissions) {
          if (!ALLOWED_PERMISSIONS.includes(permission)) {
            errors.push({
              field: 'permissions',
              message: `Unknown permission: ${permission}`
            })
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate plugin structure (files exist)
   * @param {string} pluginPath - Path to plugin directory
   * @param {import('./types.js').PluginManifest} manifest - Plugin manifest
   * @returns {Promise<import('./types.js').ValidationResult>}
   */
  async validateStructure(pluginPath, manifest) {
    const errors = []
    const warnings = []

    try {
      // Check main entry point exists
      const mainPath = path.join(pluginPath, manifest.main)
      try {
        await fs.access(mainPath)
      } catch {
        errors.push({
          field: 'main',
          message: `Main entry point not found: ${manifest.main}`
        })
      }

      // Check renderer entry point if specified
      if (manifest.renderer) {
        const rendererPath = path.join(pluginPath, manifest.renderer)
        try {
          await fs.access(rendererPath)
        } catch {
          warnings.push({
            field: 'renderer',
            message: `Renderer entry point not found: ${manifest.renderer}`
          })
        }
      }

      // Check component files if specified
      if (manifest.contributes?.components) {
        for (const component of manifest.contributes.components) {
          const componentPath = path.join(pluginPath, component.component)
          try {
            await fs.access(componentPath)
          } catch {
            errors.push({
              field: 'contributes.components',
              message: `Component file not found: ${component.component}`
            })
          }
        }
      }
    } catch (err) {
      errors.push({
        field: 'structure',
        message: `Failed to validate structure: ${err.message}`
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate complete plugin (manifest + structure)
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Promise<{manifest: import('./types.js').PluginManifest | null, validation: import('./types.js').ValidationResult}>}
   */
  async validatePlugin(pluginPath) {
    const errors = []
    const warnings = []

    // Read manifest.json
    let manifest = null
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      manifest = JSON.parse(manifestContent)
    } catch (err) {
      return {
        manifest: null,
        validation: {
          valid: false,
          errors: [{ field: 'manifest.json', message: `Failed to read manifest: ${err.message}` }],
          warnings: []
        }
      }
    }

    // Validate manifest
    const manifestValidation = this.validateManifest(manifest)
    errors.push(...manifestValidation.errors)
    warnings.push(...manifestValidation.warnings)

    // If manifest is invalid, don't proceed with structure validation
    if (!manifestValidation.valid) {
      return {
        manifest,
        validation: {
          valid: false,
          errors,
          warnings
        }
      }
    }

    // Validate structure
    const structureValidation = await this.validateStructure(pluginPath, manifest)
    errors.push(...structureValidation.errors)
    warnings.push(...structureValidation.warnings)

    return {
      manifest,
      validation: {
        valid: errors.length === 0,
        errors,
        warnings
      }
    }
  }
}
