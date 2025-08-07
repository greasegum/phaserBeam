/**
 * Configuration validation and utility functions for marching squares configuration
 */

import { MarchingSquaresConfig } from './MarchingSquaresConfig'
import { MarchingSquaresAlgorithmConfig, DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG } from './MarchingSquaresAlgorithmConfig'
import { InterpolationConfig, DEFAULT_INTERPOLATION_CONFIG } from './InterpolationConfig'
import { SmoothingConfig, DEFAULT_SMOOTHING_CONFIG } from './SmoothingConfig'
import { PerformanceConfig, DEFAULT_PERFORMANCE_CONFIG } from './PerformanceConfig'

// Type for partial config with nested partials
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Default complete configuration
 */
export const DEFAULT_CONFIG: MarchingSquaresConfig = {
  algorithm: DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG,
  interpolation: DEFAULT_INTERPOLATION_CONFIG,
  smoothing: DEFAULT_SMOOTHING_CONFIG,
  performance: DEFAULT_PERFORMANCE_CONFIG
}

/**
 * Configuration utilities
 */
export class ConfigUtils {
  /**
   * Validate a configuration object, filling in defaults as needed
   */
  static validateConfig(config?: DeepPartial<MarchingSquaresConfig>): MarchingSquaresConfig {
    if (!config) return { ...DEFAULT_CONFIG }
    
    return {
      algorithm: this.validateAlgorithm(config.algorithm),
      interpolation: this.validateInterpolation(config.interpolation),
      smoothing: this.validateSmoothing(config.smoothing),
      performance: this.validatePerformance(config.performance)
    }
  }
  
  /**
   * Validate algorithm configuration
   */
  static validateAlgorithm(algorithm?: DeepPartial<MarchingSquaresAlgorithmConfig>): MarchingSquaresAlgorithmConfig {
    if (!algorithm) return { ...DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG }
    
    return {
      threshold: this.clamp(algorithm.threshold ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.threshold, 0, 1),
      saddlePointResolution: algorithm.saddlePointResolution ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.saddlePointResolution,
      alignment: {
        mode: algorithm.alignment?.mode ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.alignment.mode,
        offsetX: this.clamp(algorithm.alignment?.offsetX ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.alignment.offsetX, -1, 1),
        offsetY: this.clamp(algorithm.alignment?.offsetY ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.alignment.offsetY, -1, 1)
      },
      edgeBehavior: {
        clampToGrid: algorithm.edgeBehavior?.clampToGrid ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.edgeBehavior.clampToGrid,
        extendToBoundary: algorithm.edgeBehavior?.extendToBoundary ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.edgeBehavior.extendToBoundary,
        snapDistance: this.clamp(algorithm.edgeBehavior?.snapDistance ?? DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.edgeBehavior.snapDistance, 0, 1)
      }
    }
  }
  
  /**
   * Validate interpolation configuration
   */
  static validateInterpolation(interpolation?: DeepPartial<InterpolationConfig>): InterpolationConfig {
    if (!interpolation) return { ...DEFAULT_INTERPOLATION_CONFIG }
    
    return {
      enabled: interpolation.enabled ?? DEFAULT_INTERPOLATION_CONFIG.enabled,
      method: interpolation.method ?? DEFAULT_INTERPOLATION_CONFIG.method,
      scalarField: {
        method: interpolation.scalarField?.method ?? DEFAULT_INTERPOLATION_CONFIG.scalarField.method,
        radius: Math.max(0.1, interpolation.scalarField?.radius ?? DEFAULT_INTERPOLATION_CONFIG.scalarField.radius),
        edgeClamping: {
          enabled: interpolation.scalarField?.edgeClamping?.enabled ?? DEFAULT_INTERPOLATION_CONFIG.scalarField.edgeClamping.enabled,
          strength: this.clamp(interpolation.scalarField?.edgeClamping?.strength ?? DEFAULT_INTERPOLATION_CONFIG.scalarField.edgeClamping.strength, 0, 1),
          distance: Math.max(0, interpolation.scalarField?.edgeClamping?.distance ?? DEFAULT_INTERPOLATION_CONFIG.scalarField.edgeClamping.distance)
        }
      },
      transform: {
        globalOffsetX: interpolation.transform?.globalOffsetX ?? DEFAULT_INTERPOLATION_CONFIG.transform.globalOffsetX,
        globalOffsetY: interpolation.transform?.globalOffsetY ?? DEFAULT_INTERPOLATION_CONFIG.transform.globalOffsetY,
        scale: Math.max(0.1, interpolation.transform?.scale ?? DEFAULT_INTERPOLATION_CONFIG.transform.scale)
      }
    }
  }
  
  /**
   * Validate smoothing configuration
   */
  static validateSmoothing(smoothing?: DeepPartial<SmoothingConfig>): SmoothingConfig {
    if (!smoothing) return { ...DEFAULT_SMOOTHING_CONFIG }
    
    return {
      enabled: smoothing.enabled ?? DEFAULT_SMOOTHING_CONFIG.enabled,
      algorithm: smoothing.algorithm ?? DEFAULT_SMOOTHING_CONFIG.algorithm,
      iterations: this.clamp(smoothing.iterations ?? DEFAULT_SMOOTHING_CONFIG.iterations, 1, 10),
      strength: this.clamp(smoothing.strength ?? DEFAULT_SMOOTHING_CONFIG.strength, 0, 1),
      
      edgePreservation: {
        enabled: smoothing.edgePreservation?.enabled ?? DEFAULT_SMOOTHING_CONFIG.edgePreservation.enabled,
        bufferDistance: Math.max(0, smoothing.edgePreservation?.bufferDistance ?? DEFAULT_SMOOTHING_CONFIG.edgePreservation.bufferDistance),
        preserveStraightSegments: smoothing.edgePreservation?.preserveStraightSegments ?? DEFAULT_SMOOTHING_CONFIG.edgePreservation.preserveStraightSegments,
        curvatureThreshold: Math.max(0, smoothing.edgePreservation?.curvatureThreshold ?? DEFAULT_SMOOTHING_CONFIG.edgePreservation.curvatureThreshold)
      },
      
      collision: {
        enabled: smoothing.collision?.enabled ?? DEFAULT_SMOOTHING_CONFIG.collision.enabled,
        method: smoothing.collision?.method ?? DEFAULT_SMOOTHING_CONFIG.collision.method,
        minDistance: Math.max(0, smoothing.collision?.minDistance ?? DEFAULT_SMOOTHING_CONFIG.collision.minDistance),
        maxIterations: this.clamp(smoothing.collision?.maxIterations ?? DEFAULT_SMOOTHING_CONFIG.collision.maxIterations, 1, 50)
      },
      
      filtering: {
        minContourArea: Math.max(0, smoothing.filtering?.minContourArea ?? DEFAULT_SMOOTHING_CONFIG.filtering.minContourArea),
        minContourLength: Math.max(3, smoothing.filtering?.minContourLength ?? DEFAULT_SMOOTHING_CONFIG.filtering.minContourLength),
        maxContours: Math.max(1, smoothing.filtering?.maxContours ?? DEFAULT_SMOOTHING_CONFIG.filtering.maxContours)
      }
    }
  }
  
  /**
   * Validate performance configuration
   */
  static validatePerformance(performance?: DeepPartial<PerformanceConfig>): PerformanceConfig {
    if (!performance) return { ...DEFAULT_PERFORMANCE_CONFIG }
    
    return {
      interpolationCache: performance.interpolationCache ?? DEFAULT_PERFORMANCE_CONFIG.interpolationCache,
      parallelProcessing: performance.parallelProcessing ?? DEFAULT_PERFORMANCE_CONFIG.parallelProcessing,
      workerCount: this.clamp(performance.workerCount ?? DEFAULT_PERFORMANCE_CONFIG.workerCount, 1, 8),
      maxCacheSize: Math.max(1, performance.maxCacheSize ?? DEFAULT_PERFORMANCE_CONFIG.maxCacheSize),
      precisionLevel: this.clamp(performance.precisionLevel ?? DEFAULT_PERFORMANCE_CONFIG.precisionLevel, 1, 10)
    }
  }
  
  /**
   * Utility function to clamp a value between min and max
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }
}

/**
 * Configuration builder for fluent API
 */
export class ConfigBuilder {
  private config: DeepPartial<MarchingSquaresConfig> = {}
  
  /**
   * Create a new configuration builder
   */
  static create(): ConfigBuilder {
    return new ConfigBuilder()
  }
  
  /**
   * Build the final configuration
   */
  build(): MarchingSquaresConfig {
    return ConfigUtils.validateConfig(this.config)
  }
  
  /**
   * Set the marching squares threshold
   */
  withThreshold(threshold: number): ConfigBuilder {
    this.config.algorithm = {
      ...this.config.algorithm,
      threshold
    }
    return this
  }
  
  /**
   * Set alignment mode
   */
  withAlignmentMode(mode: MarchingSquaresAlgorithmConfig['alignment']['mode']): ConfigBuilder {
    this.config.algorithm = {
      ...this.config.algorithm,
      alignment: {
        ...(this.config.algorithm?.alignment || {}),
        mode
      }
    }
    return this
  }
  
  /**
   * Set alignment offset
   */
  withAlignmentOffset(offsetX: number, offsetY: number): ConfigBuilder {
    this.config.algorithm = {
      ...this.config.algorithm,
      alignment: {
        ...(this.config.algorithm?.alignment || {}),
        offsetX,
        offsetY
      }
    }
    return this
  }
  
  /**
   * Configure edge behavior
   */
  withEdgeBehavior(clampToGrid: boolean, snapDistance?: number): ConfigBuilder {
    this.config.algorithm = {
      ...this.config.algorithm,
      edgeBehavior: {
        ...(this.config.algorithm?.edgeBehavior || {}),
        clampToGrid,
        snapDistance: snapDistance !== undefined ? snapDistance : 
          (this.config.algorithm?.edgeBehavior?.snapDistance || DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG.edgeBehavior.snapDistance)
      }
    }
    return this
  }
  
  /**
   * Enable or disable interpolation
   */
  withInterpolation(enabled: boolean, method?: InterpolationConfig['method']): ConfigBuilder {
    this.config.interpolation = {
      ...this.config.interpolation,
      enabled,
      method: method || this.config.interpolation?.method || DEFAULT_INTERPOLATION_CONFIG.method
    }
    return this
  }
  
  /**
   * Configure scalar field
   */
  withScalarField(
    method: InterpolationConfig['scalarField']['method'], 
    radius?: number
  ): ConfigBuilder {
    this.config.interpolation = {
      ...this.config.interpolation,
      scalarField: {
        ...(this.config.interpolation?.scalarField || {}),
        method,
        radius: radius !== undefined ? radius : 
          (this.config.interpolation?.scalarField?.radius || DEFAULT_INTERPOLATION_CONFIG.scalarField.radius)
      }
    }
    return this
  }
  
  /**
   * Configure smoothing
   */
  withSmoothing(
    enabled: boolean, 
    algorithm?: SmoothingConfig['algorithm'], 
    strength?: number
  ): ConfigBuilder {
    this.config.smoothing = {
      ...this.config.smoothing,
      enabled,
      algorithm: algorithm || this.config.smoothing?.algorithm || DEFAULT_SMOOTHING_CONFIG.algorithm,
      strength: strength !== undefined ? strength : 
        (this.config.smoothing?.strength || DEFAULT_SMOOTHING_CONFIG.strength)
    }
    return this
  }
  
  /**
   * Configure performance settings
   */
  withPerformance(
    interpolationCache: boolean,
    parallelProcessing?: boolean
  ): ConfigBuilder {
    this.config.performance = {
      ...this.config.performance,
      interpolationCache,
      parallelProcessing: parallelProcessing !== undefined ? parallelProcessing :
        (this.config.performance?.parallelProcessing || DEFAULT_PERFORMANCE_CONFIG.parallelProcessing)
    }
    return this
  }
}
