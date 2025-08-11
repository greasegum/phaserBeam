import { MarchingSquaresConfig } from './MarchingSquaresConfig'
import { InterpolationConfig, DEFAULT_INTERPOLATION_CONFIG } from './InterpolationConfig'
import { SmoothingConfig, DEFAULT_SMOOTHING_CONFIG } from './SmoothingConfig'
import { MarchingSquaresAlgorithmConfig, DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG } from './MarchingSquaresAlgorithmConfig'
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './PerformanceConfig'

/**
 * Unified Configuration Manager
 * Provides a clean interface for managing all algorithm settings
 */
export class UnifiedConfigManager {
  private config: MarchingSquaresConfig
  private listeners: Set<(config: MarchingSquaresConfig) => void> = new Set()

  constructor(initialConfig?: Partial<MarchingSquaresConfig>) {
    this.config = {
      algorithm: { ...DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG, ...initialConfig?.algorithm },
      interpolation: { ...DEFAULT_INTERPOLATION_CONFIG, ...initialConfig?.interpolation },
      smoothing: { ...DEFAULT_SMOOTHING_CONFIG, ...initialConfig?.smoothing },
      performance: { ...DEFAULT_PERFORMANCE_CONFIG, ...initialConfig?.performance }
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): MarchingSquaresConfig {
    return { ...this.config }
  }

  /**
   * Update the configuration
   */
  updateConfig(updates: Partial<MarchingSquaresConfig>): void {
    this.config = {
      ...this.config,
      algorithm: { ...this.config.algorithm, ...updates.algorithm },
      interpolation: { ...this.config.interpolation, ...updates.interpolation },
      smoothing: { ...this.config.smoothing, ...updates.smoothing },
      performance: { ...this.config.performance, ...updates.performance }
    }
    this.notifyListeners()
  }

  /**
   * Update algorithm-specific settings
   */
  updateAlgorithmSettings(settings: Partial<MarchingSquaresAlgorithmConfig>): void {
    this.config.algorithm = { ...this.config.algorithm, ...settings }
    this.notifyListeners()
  }

  /**
   * Update interpolation settings
   */
  updateInterpolationSettings(settings: Partial<InterpolationConfig>): void {
    this.config.interpolation = { ...this.config.interpolation, ...settings }
    this.notifyListeners()
  }

  /**
   * Update smoothing settings
   */
  updateSmoothingSettings(settings: Partial<SmoothingConfig>): void {
    this.config.smoothing = { ...this.config.smoothing, ...settings }
    this.notifyListeners()
  }

  /**
   * Update performance settings
   */
  updatePerformanceSettings(settings: Partial<PerformanceConfig>): void {
    this.config.performance = { ...this.config.performance, ...settings }
    this.notifyListeners()
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = {
      algorithm: { ...DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG },
      interpolation: { ...DEFAULT_INTERPOLATION_CONFIG },
      smoothing: { ...DEFAULT_SMOOTHING_CONFIG },
      performance: { ...DEFAULT_PERFORMANCE_CONFIG }
    }
    this.notifyListeners()
  }

  /**
   * Add a configuration change listener
   */
  addListener(listener: (config: MarchingSquaresConfig) => void): void {
    this.listeners.add(listener)
  }

  /**
   * Remove a configuration change listener
   */
  removeListener(listener: (config: MarchingSquaresConfig) => void): void {
    this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }

  /**
   * Get configuration as a simple object for UI binding
   */
  getUIConfig() {
    return {
      // Algorithm settings
      threshold: this.config.algorithm.threshold,
      saddlePointResolution: this.config.algorithm.saddlePointResolution,
      alignmentMode: this.config.algorithm.alignment.mode,
      alignmentOffsetX: this.config.algorithm.alignment.offsetX,
      alignmentOffsetY: this.config.algorithm.alignment.offsetY,
      clampToGrid: this.config.algorithm.edgeBehavior.clampToGrid,
      extendToBoundary: this.config.algorithm.edgeBehavior.extendToBoundary,
      snapDistance: this.config.algorithm.edgeBehavior.snapDistance,

      // Interpolation settings
      interpolationEnabled: this.config.interpolation.enabled,
      interpolationMethod: this.config.interpolation.method,
      scalarFieldMethod: this.config.interpolation.scalarField.method,
      scalarFieldRadius: this.config.interpolation.scalarField.radius,
      edgeClampingEnabled: this.config.interpolation.scalarField.edgeClamping.enabled,
      edgeClampStrength: this.config.interpolation.scalarField.edgeClamping.strength,
      edgeClampDistance: this.config.interpolation.scalarField.edgeClamping.distance,

      // Smoothing settings
      smoothingEnabled: this.config.smoothing.enabled,
      smoothingAlgorithm: this.config.smoothing.algorithm,
      smoothingIterations: this.config.smoothing.iterations,
      smoothingStrength: this.config.smoothing.strength,
      edgePreservationEnabled: this.config.smoothing.edgePreservation.enabled,
      edgeBufferDistance: this.config.smoothing.edgePreservation.bufferDistance,
      preserveStraightSegments: this.config.smoothing.edgePreservation.preserveStraightSegments,
      curvatureThreshold: this.config.smoothing.edgePreservation.curvatureThreshold,
      collisionEnabled: this.config.smoothing.collision.enabled,
      collisionMethod: this.config.smoothing.collision.method,
      collisionMinDistance: this.config.smoothing.collision.minDistance,
      collisionIterations: this.config.smoothing.collision.maxIterations,

      // Performance settings
      enableCaching: this.config.performance.enableCaching,
      interpolationCache: this.config.performance.interpolationCache,
      quality: this.config.performance.quality,
      maxGridSize: this.config.performance.maxGridSize,
      maxContourPoints: this.config.performance.maxContourPoints
    }
  }

  /**
   * Update configuration from UI values
   */
  updateFromUI(uiConfig: any): void {
    this.updateConfig({
      algorithm: {
        threshold: uiConfig.threshold,
        saddlePointResolution: uiConfig.saddlePointResolution,
        alignment: {
          mode: uiConfig.alignmentMode,
          offsetX: uiConfig.alignmentOffsetX,
          offsetY: uiConfig.alignmentOffsetY
        },
        edgeBehavior: {
          clampToGrid: uiConfig.clampToGrid,
          extendToBoundary: uiConfig.extendToBoundary,
          snapDistance: uiConfig.snapDistance
        }
      },
      interpolation: {
        enabled: uiConfig.interpolationEnabled,
        method: uiConfig.interpolationMethod,
        scalarField: {
          method: uiConfig.scalarFieldMethod,
          radius: uiConfig.scalarFieldRadius,
          edgeClamping: {
            enabled: uiConfig.edgeClampingEnabled,
            strength: uiConfig.edgeClampStrength,
            distance: uiConfig.edgeClampDistance
          }
        },
        transform: {
          globalOffsetX: 0,
          globalOffsetY: 0,
          scale: 1
        }
      },
      smoothing: {
        enabled: uiConfig.smoothingEnabled,
        algorithm: uiConfig.smoothingAlgorithm,
        iterations: uiConfig.smoothingIterations,
        strength: uiConfig.smoothingStrength,
        edgePreservation: {
          enabled: uiConfig.edgePreservationEnabled,
          bufferDistance: uiConfig.edgeBufferDistance,
          preserveStraightSegments: uiConfig.preserveStraightSegments,
          curvatureThreshold: uiConfig.curvatureThreshold
        },
        collision: {
          enabled: uiConfig.collisionEnabled,
          method: uiConfig.collisionMethod,
          minDistance: uiConfig.collisionMinDistance,
          maxIterations: uiConfig.collisionIterations
        },
        filtering: {
          minContourArea: 0,
          minContourLength: 3,
          maxContours: 100
        }
      },
      performance: {
        enableCaching: uiConfig.enableCaching,
        interpolationCache: uiConfig.interpolationCache,
        quality: uiConfig.quality,
        maxGridSize: uiConfig.maxGridSize,
        maxContourPoints: uiConfig.maxContourPoints
      }
    })
  }
} 