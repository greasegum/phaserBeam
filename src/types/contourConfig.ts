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

/** Preset configurations for common use cases */
export const CONTOUR_PRESETS = {
  default: {
    core: { threshold: 0.5, cellSize: 1 },
    smoothing: { enabled: true, strength: 0.5 },
    edges: { clampToBeam: true, bufferSize: 0 },
    separation: { enabled: true, minDistance: 0.5 }
  },
  
  sharp: {
    core: { threshold: 0.5, cellSize: 1 },
    smoothing: { enabled: false, strength: 0 },
    edges: { clampToBeam: true, bufferSize: 0 },
    separation: { enabled: true, minDistance: 0.3 }
  },
  
  organic: {
    core: { threshold: 0.5, cellSize: 1 },
    smoothing: { enabled: true, strength: 0.8 },
    edges: { clampToBeam: true, bufferSize: 1 },
    separation: { enabled: true, minDistance: 0.7 }
  },
  
  technical: {
    core: { threshold: 0.5, cellSize: 1 },
    smoothing: { enabled: true, strength: 0.3 },
    edges: { clampToBeam: true, bufferSize: 0 },
    separation: { enabled: false, minDistance: 0 }
  }
} as const

export type ContourPreset = keyof typeof CONTOUR_PRESETS