/**
 * High-level contour processing service that orchestrates the entire pipeline
 */

import type { GridDimensions } from '../core/grid/mask'
import type { FieldGenConfig } from '../core/fields/scalarFieldGenerator'
import type { MarchingSquaresConfig, ContourPath, Point2D } from '../core/contours/marchingSquares'
import type { ContourStyle } from '../renderers/contours/phaserRenderer'

import { cellSetToGridMask } from '../core/grid/mask'
import { generateScalarField } from '../core/fields/scalarFieldGenerator'
import { extractContours, extractContoursFromBinary } from '../core/contours/marchingSquares'
import { OptimizedContourProcessor, createOptimizedContourProcessor } from '../utils/OptimizedContourProcessor'
import { Result, success, failure, logger } from '../utils/Result'
import { enhanceScalarField } from '../core/ScalarFieldEnhancements'
import { EnhancementConfig } from '../core/configuration/EnhancementConfig'

export interface ContourConfig {
  /** Grid dimensions */
  grid: GridDimensions
  
  /** Scalar field generation settings (optional - if not provided, uses binary processing) */
  field?: FieldGenConfig
  
  /** Marching squares algorithm settings */
  marchingSquares: MarchingSquaresConfig
  
  /** Enhancement settings (NEW - integrates orphaned algorithms) */
  enhancement?: EnhancementConfig
  
  /** Optional post-processing */
  postProcessing?: {
    /** Minimum contour length to keep */
    minLength?: number
    /** Maximum number of contours to return */
    maxContours?: number
    /** Whether to merge nearby contours */
    mergeNearby?: boolean
    /** Distance threshold for merging */
    mergeThreshold?: number
  }
}

export interface ContourResult {
  /** Generated contour paths */
  contours: ContourPath[]
  
  /** Intermediate data for debugging/inspection */
  debug?: {
    /** Boolean mask derived from cell selection */
    gridMask: boolean[][]
    /** Generated scalar field */
    scalarField: number[][]
    /** Enhanced scalar field (if enhancement was applied) */
    enhancedScalarField?: number[][]
    /** Processing statistics */
    stats: {
      selectedCells: number
      totalCells: number
      contourCount: number
      processingTime: number
      enhancementTime?: number
      enhancementAlgorithm?: string
    }
  }
}

/**
 * Main entry point for contour processing
 * Converts selected cells to contours through the complete pipeline
 */
export function processSelectedCells(
  selectedCells: Set<string>,
  config: ContourConfig,
  includeDebug: boolean = false
): ContourResult {
  const startTime = performance.now()
  
  // Step 1: Convert cell selection to grid mask
  const gridMask = cellSetToGridMask(selectedCells, config.grid)
  
  // Step 2: Choose processing path based on configuration
  let contours: ContourPath[]
  let scalarField: number[][] | undefined
  let enhancedScalarField: number[][] | undefined
  let enhancementTime: number | undefined
  
  if (config.field) {
    // Use enhanced pipeline with scalar field generation
    scalarField = generateScalarField(gridMask, config.field)
    
    // Step 2a: Apply enhancement if configured (NEW - integrates orphaned algorithms!)
    if (config.enhancement?.enabled && config.enhancement.algorithm !== 'none') {
      const enhancementStart = performance.now()
      logger.info('Applying scalar field enhancement', { 
        algorithm: config.enhancement.algorithm,
        strength: config.enhancement.strength,
        iterations: config.enhancement.iterations
      })
      
      enhancedScalarField = enhanceScalarField(
        scalarField,
        config.enhancement.algorithm,
        {
          strength: config.enhancement.strength,
          iterations: config.enhancement.iterations,
          preserveEdges: config.enhancement.preserveEdges,
          ...config.enhancement.algorithmParams[config.enhancement.algorithm]
        }
      )
      
      enhancementTime = performance.now() - enhancementStart
      logger.debug('Enhancement completed', { enhancementTime: enhancementTime.toFixed(2) })
      
      // Use enhanced field for contour extraction
      contours = extractContours(enhancedScalarField, config.marchingSquares)
    } else {
      // Use original scalar field
      contours = extractContours(scalarField, config.marchingSquares)
    }
  } else {
    // Use direct binary processing - convert to scalar field for potential enhancement
    scalarField = gridMask.map(row => row.map(cell => cell ? 1 : 0))
    
    // Step 2a: Apply enhancement if configured (even for binary processing)
    if (config.enhancement?.enabled && config.enhancement.algorithm !== 'none') {
      const enhancementStart = performance.now()
      logger.info('Applying enhancement to binary field', {
        algorithm: config.enhancement.algorithm
      })
      
      enhancedScalarField = enhanceScalarField(
        scalarField,
        config.enhancement.algorithm,
        {
          strength: config.enhancement.strength,
          iterations: config.enhancement.iterations,
          preserveEdges: config.enhancement.preserveEdges,
          ...config.enhancement.algorithmParams[config.enhancement.algorithm]
        }
      )
      
      enhancementTime = performance.now() - enhancementStart
      contours = extractContours(enhancedScalarField, config.marchingSquares)
    } else {
      // Use standard binary processing
      contours = extractContoursFromBinary(gridMask, config.marchingSquares)
    }
  }
  
  // Step 3: Apply post-processing if configured
  if (config.postProcessing) {
    contours = applyPostProcessing(contours, config.postProcessing)
  }
  
  const endTime = performance.now()
  const processingTime = endTime - startTime
  
  // Build result
  const result: ContourResult = { contours }
  
  if (includeDebug) {
    result.debug = {
      gridMask,
      scalarField: scalarField || gridMask.map(row => row.map(val => val ? 1 : 0)),
      enhancedScalarField,
      stats: {
        selectedCells: selectedCells.size,
        totalCells: config.grid.cols * config.grid.rows,
        contourCount: contours.length,
        processingTime,
        enhancementTime,
        enhancementAlgorithm: config.enhancement?.enabled ? config.enhancement.algorithm : undefined
      }
    }
  }
  
  return result
}

/**
 * Apply post-processing filters to contours
 */
function applyPostProcessing(
  contours: ContourPath[],
  config: NonNullable<ContourConfig['postProcessing']>
): ContourPath[] {
  let processed = contours
  
  // Filter by minimum length
  if (config.minLength !== undefined) {
    processed = processed.filter(contour => {
      const length = contour.metadata?.perimeter || calculateContourLength(contour.points)
      return length >= config.minLength!
    })
  }
  
  // Merge nearby contours
  if (config.mergeNearby && config.mergeThreshold !== undefined) {
    processed = mergeNearbyContours(processed, config.mergeThreshold)
  }
  
  // Limit number of contours
  if (config.maxContours !== undefined && processed.length > config.maxContours) {
    // Sort by area/length and keep the largest ones
    processed = processed
      .sort((a, b) => {
        const aSize = a.metadata?.area || a.metadata?.perimeter || 0
        const bSize = b.metadata?.area || b.metadata?.perimeter || 0
        return bSize - aSize
      })
      .slice(0, config.maxContours)
  }
  
  return processed
}

/**
 * Calculate contour length if not already in metadata
 */
function calculateContourLength(points: Point2D[]): number {
  let length = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    length += Math.sqrt(dx * dx + dy * dy)
  }
  return length
}

/**
 * Merge contours that are close to each other using optimized spatial indexing
 */
function mergeNearbyContours(
  contours: ContourPath[],
  threshold: number
): ContourPath[] {
  // Use optimized processor for better performance
  const processor = createOptimizedContourProcessor()
  const result = processor.mergeNearbyContours(contours, threshold)
  
  if (Result.isSuccess(result)) {
    const stats = processor.getStatistics()
    logger.info('Optimized contour merging completed', {
      originalCount: contours.length,
      mergedCount: result.data.length,
      complexity: stats.estimatedComplexity,
      indexDepth: stats.indexDepth
    })
    processor.destroy() // Clean up resources
    return result.data
  } else {
    logger.warn('Optimized merging failed, falling back to basic algorithm', {
      error: result.error.message
    })
    processor.destroy()
    
    // Fallback to simple merging without O(n²) distance calculation
    return mergeContoursBasic(contours, threshold)
  }
}

/**
 * Basic contour merging fallback (still optimized to avoid O(n²))
 */
function mergeContoursBasic(contours: ContourPath[], threshold: number): ContourPath[] {
  // Use bounding box approximation instead of point-by-point distance
  const merged: ContourPath[] = []
  const used = new Set<number>()
  
  for (let i = 0; i < contours.length; i++) {
    if (used.has(i)) continue
    
    let currentContour = contours[i]
    used.add(i)
    
    // Find contours to merge using fast bounding box check
    for (let j = i + 1; j < contours.length; j++) {
      if (used.has(j)) continue
      
      const distance = getContourDistanceFast(currentContour, contours[j])
      if (distance <= threshold) {
        currentContour = mergeContours(currentContour, contours[j])
        used.add(j)
      }
    }
    
    merged.push(currentContour)
  }
  
  return merged
}

/**
 * Calculate minimum distance between two contours (DEPRECATED - O(n²) complexity)
 * Use getContourDistanceFast for better performance
 */
function getContourDistance(contour1: ContourPath, contour2: ContourPath): number {
  logger.warn('Using deprecated O(n²) distance calculation - consider using getContourDistanceFast')
  
  // Limit points to avoid extreme performance issues
  const maxPoints = 10
  const points1 = contour1.points.length > maxPoints ? 
    samplePoints(contour1.points, maxPoints) : contour1.points
  const points2 = contour2.points.length > maxPoints ? 
    samplePoints(contour2.points, maxPoints) : contour2.points
  
  let minDistance = Infinity
  
  for (const point1 of points1) {
    for (const point2 of points2) {
      const dx = point1.x - point2.x
      const dy = point1.y - point2.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      minDistance = Math.min(minDistance, distance)
    }
  }
  
  return minDistance
}

/**
 * Fast contour distance calculation using bounding box approximation
 */
function getContourDistanceFast(contour1: ContourPath, contour2: ContourPath): number {
  const bounds1 = calculateContourBounds(contour1)
  const bounds2 = calculateContourBounds(contour2)
  
  // Calculate distance between bounding box centers
  const center1X = (bounds1.minX + bounds1.maxX) / 2
  const center1Y = (bounds1.minY + bounds1.maxY) / 2
  const center2X = (bounds2.minX + bounds2.maxX) / 2
  const center2Y = (bounds2.minY + bounds2.maxY) / 2
  
  const dx = center2X - center1X
  const dy = center2Y - center1Y
  
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate bounding box for contour
 */
function calculateContourBounds(contour: ContourPath): { minX: number; minY: number; maxX: number; maxY: number } {
  if (contour.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  
  let minX = contour.points[0].x, maxX = contour.points[0].x
  let minY = contour.points[0].y, maxY = contour.points[0].y
  
  for (const point of contour.points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  
  return { minX, minY, maxX, maxY }
}

/**
 * Sample points from contour for performance
 */
function samplePoints(points: Point2D[], maxSamples: number): Point2D[] {
  if (points.length <= maxSamples) {
    return points
  }
  
  const step = points.length / maxSamples
  const sampled: Point2D[] = []
  
  for (let i = 0; i < maxSamples; i++) {
    const index = Math.floor(i * step)
    sampled.push(points[index])
  }
  
  return sampled
}

/**
 * Merge two contours into one
 */
function mergeContours(contour1: ContourPath, contour2: ContourPath): ContourPath {
  // Simple merge: concatenate points
  // More sophisticated merging could connect endpoints optimally
  return {
    points: [...contour1.points, ...contour2.points],
    closed: false, // Merged contours are typically not closed
    level: contour1.level,
    metadata: {
      area: (contour1.metadata?.area || 0) + (contour2.metadata?.area || 0),
      perimeter: (contour1.metadata?.perimeter || 0) + (contour2.metadata?.perimeter || 0),
      bounds: mergeBounds(contour1.metadata?.bounds, contour2.metadata?.bounds)
    }
  }
}

/**
 * Merge bounding boxes
 */
function mergeBounds(
  bounds1?: { minX: number; minY: number; maxX: number; maxY: number },
  bounds2?: { minX: number; minY: number; maxX: number; maxY: number }
): { minX: number; minY: number; maxX: number; maxY: number } | undefined {
  if (!bounds1 && !bounds2) return undefined
  if (!bounds1) return bounds2
  if (!bounds2) return bounds1
  
  return {
    minX: Math.min(bounds1.minX, bounds2.minX),
    minY: Math.min(bounds1.minY, bounds2.minY),
    maxX: Math.max(bounds1.maxX, bounds2.maxX),
    maxY: Math.max(bounds1.maxY, bounds2.maxY)
  }
}

/**
 * Create default contour configuration
 */
export function createDefaultContourConfig(
  gridDimensions: GridDimensions
): ContourConfig {
  return {
    grid: gridDimensions,
    
    field: {
      selectedValue: 1,
      unselectedValue: 0,
      padEdges: true,
      smoothing: {
        method: 'gaussian',
        radius: 1.5,
        iterations: 2
      }
    },
    
    marchingSquares: {
      threshold: 0.5,
      edgePolicy: 'clamp',
      interpolate: true,
      coordinateSystem: 'grid'
    },
    
    postProcessing: {
      minLength: 2,
      maxContours: 50,
      mergeNearby: true,
      mergeThreshold: 1.0
    }
  }
}

/**
 * Create contour configuration optimized for section loss visualization
 */
export function createSectionLossContourConfig(
  gridDimensions: GridDimensions,
  worldTransform?: MarchingSquaresConfig['worldTransform']
): ContourConfig {
  return {
    grid: gridDimensions,
    
    field: {
      selectedValue: 1,
      unselectedValue: 0,
      padEdges: true,
      smoothing: {
        method: 'gaussian',
        radius: 2.0,
        iterations: 3
      }
    },
    
    marchingSquares: {
      threshold: 0.5,
      edgePolicy: 'clamp',
      interpolate: true,
      coordinateSystem: worldTransform ? 'world' : 'grid',
      worldTransform
    },
    
    postProcessing: {
      minLength: 5,
      maxContours: 20,
      mergeNearby: true,
      mergeThreshold: 2.0
    }
  }
}

/**
 * Create contour configuration for debug visualization
 */
export function createDebugContourConfig(
  gridDimensions: GridDimensions
): ContourConfig {
  return {
    grid: gridDimensions,
    
    field: {
      selectedValue: 1,
      unselectedValue: 0,
      padEdges: false, // No smoothing for debug
    },
    
    marchingSquares: {
      threshold: 0.5,
      edgePolicy: 'none',
      interpolate: false, // Sharp edges for debug
      coordinateSystem: 'grid'
    },
    
    postProcessing: {
      minLength: 0, // Keep all contours for debug
      maxContours: 1000
    }
  }
}

// Re-export types for convenience
export type { ContourPath, Point2D } from '../core/contours/marchingSquares'
export type { ContourStyle } from '../renderers/contours/phaserRenderer'
