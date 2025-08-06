/**
 * PhaserBeam Core API
 * Provides a clean interface to the entire contour generation system
 */

// Export main engine and types
export { MarchingSquaresEngine } from './engine/MarchingSquaresEngine'
export type { ProcessingResult } from './engine/MarchingSquaresEngine'

// Export algorithms
export * from './algorithms'

// Export configuration
export * from './configuration/MarchingSquaresConfig'
export * from './configuration/MarchingSquaresAlgorithmConfig'
export * from './configuration/InterpolationConfig'
export * from './configuration/SmoothingConfig'
export * from './configuration/PerformanceConfig'
export * from './configuration/ConfigUtils'

// Export geometry types
export * from './geometry'

// Export rendering utilities
export * from './ContourRenderer'

// Export scalar field utilities
export * from './ScalarField'

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
