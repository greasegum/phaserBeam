/**
 * Centralized configuration manager for BeamElevationScene
 * Eliminates boilerplate getter/setter methods with a generic approach
 */

import type { ScalarFieldMethod } from '../ScalarField'

export interface SceneConfig {
  // Contour rendering options
  showRawMarchingSquares: boolean
  showControlPoints: boolean
  showBlurredField: boolean
  
  // Marching squares algorithm
  interpolationMethod: 'linear' | 'cubic' | 'none'
  saddlePointResolution: 'center' | 'gradient' | 'majority'
  threshold: number
  alignmentMode: 'edges' | 'vertices' | 'center'
  clampToGrid: boolean
  extendToBoundary: boolean
  snapDistance: number
  
  // Smoothing options
  smoothingMethod: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'
  smoothingIterations: number
  smoothingStrength: number
  
  // Edge processing
  edgeClamping: boolean
  edgeClampStrength: number
  edgeClampDistance: number
  cornerTreatment: 'trimmed' | 'flared' | 'square'
  
  // Scalar field
  scalarFieldMethod: ScalarFieldMethod
  scalarFieldRadius: number
  
  // Collision avoidance
  collisionAvoidance: boolean
  collisionMinDistance: number
  collisionMethod: 'repulsion' | 'shrink' | 'hybrid'
  collisionIterations: number
  
  // Contour alignment (read-only, computed values)
  readonly contourOffsetX: number
  readonly contourOffsetY: number
  readonly contourGlobalOffsetX: number
  readonly contourGlobalOffsetY: number
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  // Contour rendering options
  showRawMarchingSquares: false,
  showControlPoints: false,
  showBlurredField: false,
  
  // Marching squares algorithm
  interpolationMethod: 'linear',
  saddlePointResolution: 'center',
  threshold: 0.5,
  alignmentMode: 'edges',
  clampToGrid: true,
  extendToBoundary: false,
  snapDistance: 0.1,
  
  // Smoothing options
  smoothingMethod: 'edge-aware',
  smoothingIterations: 1,
  smoothingStrength: 0.3,
  
  // Edge processing
  edgeClamping: true,
  edgeClampStrength: 0.95,
  edgeClampDistance: 0.8,
  cornerTreatment: 'flared',
  
  // Scalar field
  scalarFieldMethod: 'edge-preserving',
  scalarFieldRadius: 2,
  
  // Collision avoidance
  collisionAvoidance: false,
  collisionMinDistance: 0.5,
  collisionMethod: 'hybrid',
  collisionIterations: 10,
  
  // Contour alignment (fixed values for optimal grid alignment)
  contourOffsetX: 0.5,
  contourOffsetY: 0.5,
  contourGlobalOffsetX: -1,
  contourGlobalOffsetY: -1
}

export class SceneConfigManager {
  private config: SceneConfig
  private onChange?: () => void

  constructor(initialConfig: Partial<SceneConfig> = {}, onChange?: () => void) {
    this.config = { ...DEFAULT_SCENE_CONFIG, ...initialConfig }
    this.onChange = onChange
  }

  /**
   * Update multiple configuration values at once
   */
  updateConfig(updates: Partial<SceneConfig>): void {
    // Filter out readonly properties
    const allowedUpdates = { ...updates }
    delete (allowedUpdates as any).contourOffsetX
    delete (allowedUpdates as any).contourOffsetY
    delete (allowedUpdates as any).contourGlobalOffsetX
    delete (allowedUpdates as any).contourGlobalOffsetY
    
    this.config = { ...this.config, ...allowedUpdates }
    this.onChange?.()
  }

  /**
   * Update a single configuration value
   */
  setValue<K extends keyof SceneConfig>(key: K, value: SceneConfig[K]): void {
    // Prevent modification of readonly properties
    if (['contourOffsetX', 'contourOffsetY', 'contourGlobalOffsetX', 'contourGlobalOffsetY'].includes(key as string)) {
      console.warn(`Cannot modify readonly property: ${key}`)
      return
    }
    
    this.config[key] = value
    this.onChange?.()
  }

  /**
   * Get a configuration value
   */
  getValue<K extends keyof SceneConfig>(key: K): SceneConfig[K] {
    return this.config[key]
  }

  /**
   * Get the entire configuration object
   */
  getConfig(): Readonly<SceneConfig> {
    return this.config
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_SCENE_CONFIG }
    this.onChange?.()
  }

  /**
   * Validate configuration values
   */
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate ranges
    if (this.config.threshold < 0 || this.config.threshold > 1) {
      errors.push('Threshold must be between 0 and 1')
    }
    if (this.config.smoothingIterations < 0 || this.config.smoothingIterations > 10) {
      errors.push('Smoothing iterations must be between 0 and 10')
    }
    if (this.config.smoothingStrength < 0 || this.config.smoothingStrength > 1) {
      errors.push('Smoothing strength must be between 0 and 1')
    }
    if (this.config.edgeClampStrength < 0 || this.config.edgeClampStrength > 1) {
      errors.push('Edge clamp strength must be between 0 and 1')
    }
    if (this.config.scalarFieldRadius < 1 || this.config.scalarFieldRadius > 10) {
      errors.push('Scalar field radius must be between 1 and 10')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Export configuration as JSON
   */
  export(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  import(json: string): boolean {
    try {
      const imported = JSON.parse(json)
      this.updateConfig(imported)
      return true
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return false
    }
  }
}
