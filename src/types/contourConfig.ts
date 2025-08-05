/**
 * Simplified contour configuration with sensible defaults
 * Reduces 20+ parameters to essential groups
 */

export interface ContourConfig {
  /** Core algorithm settings */
  core: {
    threshold: number
    cellSize: number
  }
  
  /** Visual smoothing - simplified to just what matters */
  smoothing: {
    enabled: boolean
    strength: number // 0-1, controls all smoothing aspects
  }
  
  /** Edge behavior - simplified */
  edges: {
    clampToBeam: boolean
    bufferSize: number // Grid cells of padding
  }
  
  /** Region separation */
  separation: {
    enabled: boolean
    minDistance: number // Grid units between regions
  }
}