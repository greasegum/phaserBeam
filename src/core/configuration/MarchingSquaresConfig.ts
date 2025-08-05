/**
 * Professional configuration management for marching squares
 * Maintains all advanced geometric controls with proper organization
 */

export interface MarchingSquaresConfig {
  // Core Algorithm Settings
  algorithm: AlgorithmConfig
  
  // Geometric Controls
  geometry: GeometryConfig
  
  // Visual Processing
  processing: ProcessingConfig
  
  // Performance Settings
  performance: PerformanceConfig
}

export interface AlgorithmConfig {
  threshold: number
  interpolationMethod: 'linear' | 'cubic' | 'none'
  saddlePointResolution: 'center' | 'gradient' | 'majority'
}

export interface GeometryConfig {
  // Grid alignment controls
  alignment: {
    mode: 'edges' | 'vertices' | 'center'
    offsetX: number // -1 to 1, where 0.5 = half cell
    offsetY: number // -1 to 1, where 0.5 = half cell
  }
  
  // Edge behavior
  edges: {
    clampToGrid: boolean
    extendToBoundary: boolean
    snapDistance: number // 0-1 as fraction of cell size
  }
  
  // Buffer zone
  buffer: {
    enabled: boolean
    size: number // cells
    value: number // 0-1
    fadeDistance: number // cells for gradient
  }
  
  // Transform controls
  transform: {
    globalOffsetX: number // in grid units
    globalOffsetY: number // in grid units
    scale: number // multiplier
    rotation: number // degrees
  }
}

export interface ProcessingConfig {
  // Smoothing
  smoothing: {
    enabled: boolean
    algorithm: 'laplacian' | 'chaikin' | 'catmull-rom' | 'bezier'
    iterations: number
    strength: number // 0-1
    preserveCorners: boolean
    cornerThreshold: number // degrees
  }
  
  // Simplification
  simplification: {
    enabled: boolean
    tolerance: number // Douglas-Peucker tolerance
    minVertices: number
    preserveTopology: boolean
  }
  
  // Collision avoidance
  collision: {
    enabled: boolean
    method: 'repulsion' | 'shrink' | 'morph'
    minDistance: number // grid units
    maxIterations: number
    priority: 'equal' | 'area' | 'perimeter'
  }
  
  // Filtering
  filtering: {
    minContourArea: number
    minContourLength: number
    maxContours: number
    mergeDistance: number
  }
}

export interface PerformanceConfig {
  // Optimization settings
  enableCaching: boolean
  interpolationCache: boolean
  multiThreading: boolean
  
  // Quality vs performance
  quality: 'draft' | 'balanced' | 'high'
  
  // Limits
  maxGridSize: number
  maxContourPoints: number
}

/**
 * Configuration validation
 */
export class ConfigValidator {
  static validate(config: Partial<MarchingSquaresConfig>): MarchingSquaresConfig {
    return {
      algorithm: this.validateAlgorithm(config.algorithm),
      geometry: this.validateGeometry(config.geometry),
      processing: this.validateProcessing(config.processing),
      performance: this.validatePerformance(config.performance)
    }
  }
  
  private static validateAlgorithm(algorithm?: Partial<AlgorithmConfig>): AlgorithmConfig {
    return {
      threshold: this.clamp(algorithm?.threshold ?? 0.5, 0, 1),
      interpolationMethod: algorithm?.interpolationMethod ?? 'linear',
      saddlePointResolution: algorithm?.saddlePointResolution ?? 'center'
    }
  }
  
  private static validateGeometry(geometry?: Partial<GeometryConfig>): GeometryConfig {
    return {
      alignment: {
        mode: geometry?.alignment?.mode ?? 'edges',
        offsetX: this.clamp(geometry?.alignment?.offsetX ?? 0.5, -1, 1),
        offsetY: this.clamp(geometry?.alignment?.offsetY ?? 0.5, -1, 1)
      },
      edges: {
        clampToGrid: geometry?.edges?.clampToGrid ?? true,
        extendToBoundary: geometry?.edges?.extendToBoundary ?? false,
        snapDistance: this.clamp(geometry?.edges?.snapDistance ?? 0.1, 0, 1)
      },
      buffer: {
        enabled: geometry?.buffer?.enabled ?? false,
        size: Math.max(0, geometry?.buffer?.size ?? 0),
        value: this.clamp(geometry?.buffer?.value ?? 0, 0, 1),
        fadeDistance: Math.max(0, geometry?.buffer?.fadeDistance ?? 0)
      },
      transform: {
        globalOffsetX: geometry?.transform?.globalOffsetX ?? 0,
        globalOffsetY: geometry?.transform?.globalOffsetY ?? 0,
        scale: Math.max(0.1, geometry?.transform?.scale ?? 1),
        rotation: (geometry?.transform?.rotation ?? 0) % 360
      }
    }
  }
  
  private static validateProcessing(processing?: Partial<ProcessingConfig>): ProcessingConfig {
    return {
      smoothing: {
        enabled: processing?.smoothing?.enabled ?? true,
        algorithm: processing?.smoothing?.algorithm ?? 'laplacian',
        iterations: this.clamp(processing?.smoothing?.iterations ?? 2, 1, 10),
        strength: this.clamp(processing?.smoothing?.strength ?? 0.5, 0, 1),
        preserveCorners: processing?.smoothing?.preserveCorners ?? false,
        cornerThreshold: this.clamp(processing?.smoothing?.cornerThreshold ?? 45, 0, 180)
      },
      simplification: {
        enabled: processing?.simplification?.enabled ?? false,
        tolerance: Math.max(0, processing?.simplification?.tolerance ?? 0.1),
        minVertices: Math.max(3, processing?.simplification?.minVertices ?? 3),
        preserveTopology: processing?.simplification?.preserveTopology ?? true
      },
      collision: {
        enabled: processing?.collision?.enabled ?? true,
        method: processing?.collision?.method ?? 'repulsion',
        minDistance: Math.max(0, processing?.collision?.minDistance ?? 0.5),
        maxIterations: this.clamp(processing?.collision?.maxIterations ?? 10, 1, 50),
        priority: processing?.collision?.priority ?? 'equal'
      },
      filtering: {
        minContourArea: Math.max(0, processing?.filtering?.minContourArea ?? 0),
        minContourLength: Math.max(3, processing?.filtering?.minContourLength ?? 3),
        maxContours: Math.max(1, processing?.filtering?.maxContours ?? 100),
        mergeDistance: Math.max(0, processing?.filtering?.mergeDistance ?? 0)
      }
    }
  }
  
  private static validatePerformance(performance?: Partial<PerformanceConfig>): PerformanceConfig {
    return {
      enableCaching: performance?.enableCaching ?? true,
      interpolationCache: performance?.interpolationCache ?? true,
      multiThreading: performance?.multiThreading ?? false,
      quality: performance?.quality ?? 'balanced',
      maxGridSize: Math.max(10, performance?.maxGridSize ?? 1000),
      maxContourPoints: Math.max(100, performance?.maxContourPoints ?? 10000)
    }
  }
  
  private static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }
}


/**
 * Configuration builder for fluent API
 */
export class ConfigBuilder {
  private config: Partial<MarchingSquaresConfig> = {}
  
  static create(): ConfigBuilder {
    return new ConfigBuilder()
  }
  
  
  withThreshold(threshold: number): ConfigBuilder {
    this.config.algorithm = { ...this.config.algorithm, threshold }
    return this
  }
  
  withAlignment(mode: 'edges' | 'vertices' | 'center', offsetX?: number, offsetY?: number): ConfigBuilder {
    this.config.geometry = {
      ...this.config.geometry,
      alignment: { mode, offsetX: offsetX ?? 0.5, offsetY: offsetY ?? 0.5 }
    }
    return this
  }
  
  withSmoothing(enabled: boolean, algorithm?: ProcessingConfig['smoothing']['algorithm'], strength?: number): ConfigBuilder {
    this.config.processing = {
      ...this.config.processing,
      smoothing: {
        ...this.config.processing?.smoothing,
        enabled,
        algorithm: algorithm ?? 'laplacian',
        strength: strength ?? 0.5
      }
    }
    return this
  }
  
  withCollisionAvoidance(enabled: boolean, minDistance?: number): ConfigBuilder {
    this.config.processing = {
      ...this.config.processing,
      collision: {
        ...this.config.processing?.collision,
        enabled,
        minDistance: minDistance ?? 0.5
      }
    }
    return this
  }
  
  build(): MarchingSquaresConfig {
    return ConfigValidator.validate(this.config)
  }
}