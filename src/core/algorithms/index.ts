/**
 * Core Algorithms Export File
 * Provides a clean interface to all algorithm implementations
 */

// Binary Marching Squares Algorithm (core implementation)
export * from './BinaryMarchingSquares'

// Legacy Marching Squares Algorithm
export { MarchingSquaresAlgorithm } from './MarchingSquaresAlgorithm'

// Interpolation Algorithm
export { InterpolationAlgorithm } from './InterpolationAlgorithm'

// Smoothing Algorithm
export { SmoothingAlgorithm } from './SmoothingAlgorithm'
export type { EdgeConstraint } from './SmoothingAlgorithm'
