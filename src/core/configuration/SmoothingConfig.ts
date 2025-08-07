/**
 * Stage 3: Smoothing configuration
 * Controls post-processing of contours after extraction
 */
export interface SmoothingConfig {
  // Core smoothing settings
  enabled: boolean
  algorithm: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'
  iterations: number
  strength: number // 0-1
  
  // Edge preservation
  edgePreservation: {
    enabled: boolean
    bufferDistance: number // Distance from edges to preserve
    preserveStraightSegments: boolean
    curvatureThreshold: number // Threshold for detecting corners/features
  }
  
  // Collision avoidance (prevents contour overlap)
  collision: {
    enabled: boolean
    method: 'repulsion' | 'shrink' | 'hybrid'
    minDistance: number // grid units
    maxIterations: number
  }
  
  // Filtering options
  filtering: {
    minContourArea: number
    minContourLength: number
    maxContours: number
  }
}

/**
 * Default configuration for smoothing
 */
export const DEFAULT_SMOOTHING_CONFIG: SmoothingConfig = {
  enabled: true,
  algorithm: 'edge-aware',
  iterations: 1,
  strength: 0.3,
  
  edgePreservation: {
    enabled: true,
    bufferDistance: 2.0,
    preserveStraightSegments: true,
    curvatureThreshold: 0.1
  },
  
  collision: {
    enabled: false,
    method: 'hybrid',
    minDistance: 0.5,
    maxIterations: 10
  },
  
  filtering: {
    minContourArea: 0,
    minContourLength: 3,
    maxContours: 100
  }
}
