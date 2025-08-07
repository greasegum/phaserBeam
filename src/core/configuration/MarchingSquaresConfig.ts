/**
 * Professional configuration management for marching squares
 * Clear separation of concerns for contour generation pipeline:
 * 1. Marching Squares: Core algorithm with threshold and saddle point handling
 * 2. Interpolation: Scalar field generation and manipulation
 * 3. Smoothing: Contour refinement and post-processing
 */

import { MarchingSquaresAlgorithmConfig } from './MarchingSquaresAlgorithmConfig'
import { InterpolationConfig } from './InterpolationConfig'
import { SmoothingConfig } from './SmoothingConfig'
import { PerformanceConfig } from './PerformanceConfig'

/**
 * Main configuration interface for marching squares engine
 */
export interface MarchingSquaresConfig {
  // Stage 1: Core Marching Squares Algorithm
  algorithm: MarchingSquaresAlgorithmConfig
  
  // Stage 2: Interpolation Controls
  interpolation: InterpolationConfig
  
  // Stage 3: Smoothing and Post-processing
  smoothing: SmoothingConfig
  
  // Performance Settings
  performance: PerformanceConfig
}

// Export all configuration types
export * from './MarchingSquaresAlgorithmConfig'
export * from './InterpolationConfig'
export * from './SmoothingConfig'
export * from './PerformanceConfig'
export * from './ConfigUtils'
