/**
 * Stage 1: Core Marching Squares algorithm configuration
 * Handles binary field generation and basic contour extraction
 */
export interface MarchingSquaresAlgorithmConfig {
  // Core threshold that determines inside/outside
  threshold: number
  
  // How to handle saddle point cases (where exactly 2 corners are above threshold)
  saddlePointResolution: 'center' | 'gradient' | 'majority'
  
  // Alignment and positioning controls
  alignment: {
    mode: 'edges' | 'vertices' | 'center'
    offsetX: number // -1 to 1, where 0.5 = half cell
    offsetY: number // -1 to 1, where 0.5 = half cell
  }
  
  // Edge behavior controls
  edgeBehavior: {
    clampToGrid: boolean
    extendToBoundary: boolean
    snapDistance: number // 0-1 as fraction of cell size
  }
}

/**
 * Default configuration for marching squares algorithm
 */
export const DEFAULT_MARCHING_SQUARES_ALGORITHM_CONFIG: MarchingSquaresAlgorithmConfig = {
  threshold: 0.5,
  saddlePointResolution: 'center',
  alignment: {
    mode: 'edges',
    offsetX: 0.5,
    offsetY: 0.5
  },
  edgeBehavior: {
    clampToGrid: true,
    extendToBoundary: false,
    snapDistance: 0.1
  }
}
