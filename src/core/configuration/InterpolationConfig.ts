/**
 * Stage 2: Interpolation configuration
 * Controls how scalar fields are generated and manipulated
 */
export interface InterpolationConfig {
  // Whether to use interpolation for smoother contours
  enabled: boolean
  
  // Interpolation method between grid points
  method: 'linear' | 'cubic' | 'none'
  
  // Scalar field generation and manipulation
  scalarField: {
    // Method for generating the scalar field
    method: 'gaussian' | 'distance' | 'box' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping' | 'none'
    
    // Radius of influence for field generation algorithms
    radius: number
    
    // For edge-based methods
    edgeClamping: {
      enabled: boolean
      strength: number // 0-1, higher means stronger clamping to edges
      distance: number // Distance threshold for edge clamping
    }
  }
  
  // Global transformations (applied after interpolation)
  transform: {
    globalOffsetX: number // in grid units
    globalOffsetY: number // in grid units
    scale: number // multiplier
  }
}

/**
 * Default configuration for interpolation
 */
export const DEFAULT_INTERPOLATION_CONFIG: InterpolationConfig = {
  enabled: true,
  method: 'linear',
  scalarField: {
    method: 'edge-clamping',
    radius: 1,
    edgeClamping: {
      enabled: true,
      strength: 0.95,
      distance: 0.8
    }
  },
  transform: {
    globalOffsetX: 0,
    globalOffsetY: 0,
    scale: 1
  }
}
