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

// Unified contour processing entry point
import { MarchingSquaresEngine, ProcessingResult } from './engine/MarchingSquaresEngine'
import { MarchingSquaresConfig } from './configuration/MarchingSquaresConfig'
import { EdgeConstraint } from './algorithms/SmoothingAlgorithm'
/**
 * Process a scalar grid into contours using unified core pipeline.
 * @param grid 2D array of scalar values
 * @param config Partial marching squares configuration
 * @param constraints Optional edge constraints for smoothing
 * @returns ProcessingResult containing contours and metrics
 */
export function processGrid(
  grid: number[][],
  config: Partial<MarchingSquaresConfig> = {},
  constraints?: EdgeConstraint[]
): ProcessingResult {
  const engine = new MarchingSquaresEngine(config)
  return engine.process(grid, constraints)
}
