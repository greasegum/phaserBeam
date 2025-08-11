/**
 * PhaserBeam Core API
 * Provides a clean interface to the entire contour generation system
 */

// Export main engine and types
export { MarchingSquaresEngine } from './engine/MarchingSquaresEngine'
export type { ProcessingResult } from './engine/MarchingSquaresEngine'

// Core contour processing exports
export * from './algorithms'

// Geometry utilities
export * from './geometry'
export * from './ScalarField'
export * from './ScalarFieldEnhancements'
export * from './PerformanceMonitor'

// New modular exports
export * from './grid/mask'
export * from './fields/scalarFieldGenerator'
export * from './contours/marchingSquares'

// Grid system
export * from './grid/GridSystem'

// Rendering system
export * from './rendering/BeamRenderer'

// Configuration
export * from './config/SceneConfigManager'
export * from './configuration/MarchingSquaresConfig'

// Rendering components

// Renderer exports
export * from '../renderers/contours/phaserRenderer'

// Service exports
export * from '../services/contourService'

// Legacy compatibility exports
export { renderContours, ContourStyles } from './ContourRenderer'

// BezierRendering exports (avoid Point conflict by being explicit)
export { 
  drawBezierContour,
  createSmoothBezierPath,
  drawCubicBezierContour,
  applyTensionSmoothing,
  interpolateContourPoints
} from './BezierRendering'
export type { EdgeConstraints } from './BezierRendering'

// Unified contour processing entry point with enhancement support
import { MarchingSquaresEngine, ProcessingResult } from './engine/MarchingSquaresEngine'
import { MarchingSquaresConfig } from './configuration/MarchingSquaresConfig'
import { EdgeConstraint } from './algorithms/SmoothingAlgorithm'
import { enhanceScalarField } from './ScalarFieldEnhancements'
import { EnhancementConfig } from './configuration/EnhancementConfig'
import { logger } from '../utils/Result'

/**
 * Extended configuration for enhanced processing
 */
export interface EnhancedProcessingConfig extends Partial<MarchingSquaresConfig> {
  /** Enhancement settings for improved contour quality */
  enhancement?: EnhancementConfig
}

/**
 * Process a scalar grid into contours using unified core pipeline with optional enhancement.
 * NEW: Now supports advanced algorithms from ScalarFieldEnhancements!
 * @param grid 2D array of scalar values
 * @param config Configuration including optional enhancement
 * @param constraints Optional edge constraints for smoothing
 * @returns ProcessingResult containing contours and metrics
 */
export function processGrid(
  grid: number[][],
  config: EnhancedProcessingConfig = {},
  constraints?: EdgeConstraint[]
): ProcessingResult {
  let processedGrid = grid
  
  // Apply enhancement if configured (integrates orphaned algorithms!)
  if (config.enhancement?.enabled && config.enhancement.algorithm !== 'none') {
    const enhancementStart = performance.now()
    logger.info('Applying grid enhancement in core pipeline', { 
      algorithm: config.enhancement.algorithm,
      strength: config.enhancement.strength 
    })
    
    processedGrid = enhanceScalarField(
      grid,
      config.enhancement.algorithm,
      {
        strength: config.enhancement.strength,
        iterations: config.enhancement.iterations,
        preserveEdges: config.enhancement.preserveEdges,
        ...config.enhancement.algorithmParams[config.enhancement.algorithm]
      }
    )
    
    const enhancementTime = performance.now() - enhancementStart
    logger.debug('Grid enhancement completed in core', { enhancementTime: enhancementTime.toFixed(2) })
  }
  
  const engine = new MarchingSquaresEngine(config)
  return engine.process(processedGrid, constraints)
}

/**
 * Legacy function for compatibility - delegates to enhanced processGrid
 */
export function processGridBasic(
  grid: number[][],
  config: Partial<MarchingSquaresConfig> = {},
  constraints?: EdgeConstraint[]
): ProcessingResult {
  return processGrid(grid, config, constraints)
}
