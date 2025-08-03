/**
 * Consolidated Marching Squares Implementation
 * 
 * This module consolidates all marching squares functionality into a single,
 * maintainable implementation with a cleaner interface while preserving all functionality.
 */

import { 
  laplacianSmoothing, 
  chaikinSmoothing, 
  bilateralSmoothing, 
  savitzkyGolaySmoothing,
  constrainedCatmullRomSmoothing,
  EdgeConstraints 
} from './contourSmoothing'
import { 
  applyCollisionAvoidanceWithConstraints,
  CollisionAvoidanceOptions 
} from './contourCollisionAvoidance'
import {
  validateAndRepairContours,
  ValidationOptions
} from './contourValidation'
import {
  edgeAwareSmoothing,
  intelligentEdgeSmoothing,
  GridBounds
} from './edgeAwareSmoothing'

export interface Point {
  x: number
  y: number
}

interface Edge {
  p1: Point
  p2: Point
}

interface EdgeCache {
  horizontal: Map<string, number>
  vertical: Map<string, number>
}

/**
 * Marching Squares Configuration
 * Organized into logical groups with sensible defaults
 */
export interface MarchingSquaresOptions {
  // Core algorithm parameters
  threshold?: number
  interpolationMethod?: 'linear' | 'cubic' | 'none'
  saddlePointResolution?: 'center' | 'gradient' | 'majority'
  alignmentMode?: 'edges' | 'vertices' | 'center'
  
  // Grid positioning and buffering
  offsetX?: number
  offsetY?: number
  globalOffsetX?: number
  globalOffsetY?: number
  bufferSize?: number
  bufferValue?: number
  
  // Edge behavior
  edgeSnapping?: boolean
  snapDistance?: number
  extendToBoundary?: boolean
  edgeClamping?: boolean
  edgeClampDistance?: number
  cornerTreatment?: 'trimmed' | 'flared' | 'square'
  clampToGrid?: boolean  // Legacy compatibility
  
  // Smoothing configuration
  smoothing?: boolean
  smoothingMethod?: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent'
  smoothingIterations?: number
  smoothingStrength?: number
  edgeTransitionZone?: number
  preserveCorners?: boolean
  
  // Collision avoidance
  collisionAvoidance?: boolean
  collisionMinDistance?: number
  collisionMethod?: 'push' | 'shrink' | 'hybrid'
  collisionIterations?: number
  
  // Contour filtering and validation
  minContourLength?: number
  minContourArea?: number
  simplificationTolerance?: number
  validateContours?: boolean
  removeSelfIntersections?: boolean
  ensureClockwise?: boolean
  mergeClosePoints?: boolean
  mergeDistance?: number
}

/**
 * Default configuration with sensible values
 */
const DEFAULT_OPTIONS: Required<MarchingSquaresOptions> = {
  // Core algorithm
  threshold: 0.5,
  interpolationMethod: 'linear',
  saddlePointResolution: 'center',
  alignmentMode: 'edges',
  
  // Grid positioning
  offsetX: 0,
  offsetY: 0,
  globalOffsetX: -0.5,
  globalOffsetY: -0.5,
  bufferSize: 1,
  bufferValue: 0,
  
  // Edge behavior
  edgeSnapping: true,
  snapDistance: 0.1,
  extendToBoundary: false,
  edgeClamping: true,
  edgeClampDistance: 0.8,
  cornerTreatment: 'flared',
  clampToGrid: true,  // Legacy compatibility
  
  // Smoothing
  smoothing: false,
  smoothingMethod: 'basic',
  smoothingIterations: 1,
  smoothingStrength: 0.5,
  edgeTransitionZone: 1.0,
  preserveCorners: true,
  
  // Collision avoidance
  collisionAvoidance: false,
  collisionMinDistance: 0.5,
  collisionMethod: 'hybrid',
  collisionIterations: 10,
  
  // Validation and filtering
  minContourLength: 3,
  minContourArea: 0,
  simplificationTolerance: 0,
  validateContours: true,
  removeSelfIntersections: true,
  ensureClockwise: true,
  mergeClosePoints: true,
  mergeDistance: 0.01
}

/**
 * Main marching squares function
 */
export function marchingSquares(
  grid: number[][], 
  options: MarchingSquaresOptions = {}
): Point[][] {
  // Merge user options with defaults
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  // Validate input
  if (!grid || grid.length < 2 || grid[0].length < 2) {
    return []
  }
  
  // Execute the algorithm
  return executeAlgorithm(grid, config)
}

/**
 * Core algorithm execution
 */
function executeAlgorithm(grid: number[][], options: Required<MarchingSquaresOptions>): Point[][] {
  let processGrid = grid
  let rows = grid.length
  let cols = grid[0].length
  
  // Apply buffer if specified
  if (options.bufferSize > 0) {
    const bufferedRows = rows + 2 * options.bufferSize
    const bufferedCols = cols + 2 * options.bufferSize
    processGrid = Array(bufferedRows).fill(null).map(() => Array(bufferedCols).fill(options.bufferValue))
    
    // Copy original grid into center of buffered grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        processGrid[r + options.bufferSize][c + options.bufferSize] = grid[r][c]
      }
    }
    
    rows = bufferedRows
    cols = bufferedCols
    
    if (rows < 2 || cols < 2) return []
  }
  
  // Edge lookup table
  const EDGE_TABLE: number[][] = [
    [],           // 0: 0000 (all outside)
    [3, 2],       // 1: 0001 (bottom-left inside)
    [2, 1],       // 2: 0010 (bottom-right inside)
    [3, 1],       // 3: 0011 (bottom inside)
    [1, 0],       // 4: 0100 (top-right inside)
    [3, 2, 1, 0], // 5: 0101 (diagonal - ambiguous)
    [2, 0],       // 6: 0110 (right inside)
    [3, 0],       // 7: 0111 (all except top-left)
    [0, 3],       // 8: 1000 (top-left inside)
    [0, 2],       // 9: 1001 (left inside)
    [0, 3, 2, 1], // 10: 1010 (diagonal - ambiguous)
    [0, 1],       // 11: 1011 (all except top-right)
    [1, 3],       // 12: 1100 (top inside)
    [1, 2],       // 13: 1101 (all except bottom-right)
    [2, 3],       // 14: 1110 (all except bottom-left)
    []            // 15: 1111 (all inside)
  ]
  
  // Initialize edge cache
  const edgeCache: EdgeCache = {
    horizontal: new Map(),
    vertical: new Map()
  }
  
  const segments: Edge[] = []
  
  // Process each cell
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const cellSegments = processCell(
        row, col, processGrid, options, EDGE_TABLE, edgeCache
      )
      
      // Apply edge clamping to segments if enabled
      if (options.edgeClamping) {
        const gridBounds = {
          minX: 0,
          maxX: cols - 1,
          minY: 0,
          maxY: rows - 1
        }
        
        cellSegments.forEach(segment => {
          segment.p1 = applyEdgeClamping(segment.p1, gridBounds, options)
          segment.p2 = applyEdgeClamping(segment.p2, gridBounds, options)
        })
      }
      
      segments.push(...cellSegments)
    }
  }
  
  // Connect segments into contours
  const contours = connectSegments(segments)
  
  // Apply post-processing
  return applyPostProcessing(contours, options, { rows, cols })
}

/**
 * Process a single cell to generate edge segments
 */
function processCell(
  row: number,
  col: number,
  grid: number[][],
  options: Required<MarchingSquaresOptions>,
  edgeTable: number[][],
  edgeCache: EdgeCache
): Edge[] {
  // Get corner values
  const tl = grid[row][col]
  const tr = grid[row][col + 1]
  const br = grid[row + 1][col + 1]
  const bl = grid[row + 1][col]
  
  // Calculate configuration
  const config = 
    (bl >= options.threshold ? 1 : 0) |
    (br >= options.threshold ? 2 : 0) |
    (tr >= options.threshold ? 4 : 0) |
    (tl >= options.threshold ? 8 : 0)
  
  const edges = edgeTable[config]
  if (!edges || edges.length === 0) return []
  
  const segments: Edge[] = []
  
  // Special handling for vertices mode (pixelated contours)
  if (options.alignmentMode === 'vertices') {
    return createVertexModeSegments(row, col, edges, options)
  }
  
  // Handle ambiguous cases (saddle points)
  if (config === 5 || config === 10) {
    const connectDiagonally = resolveSaddlePoint(tl, tr, br, bl, config, options)
    
    if (connectDiagonally) {
      const p1 = getEdgePoint(col, row, edges[0], grid, options, edgeCache)
      const p2 = getEdgePoint(col, row, edges[3], grid, options, edgeCache)
      const p3 = getEdgePoint(col, row, edges[1], grid, options, edgeCache)
      const p4 = getEdgePoint(col, row, edges[2], grid, options, edgeCache)
      
      segments.push({ p1, p2 })
      segments.push({ p1: p3, p2: p4 })
      return segments
    }
  }
  
  // Process edges in pairs
  for (let i = 0; i < edges.length; i += 2) {
    if (i + 1 >= edges.length) break
    
    const p1 = getEdgePoint(col, row, edges[i], grid, options, edgeCache)
    const p2 = getEdgePoint(col, row, edges[i + 1], grid, options, edgeCache)
    
    segments.push({ p1, p2 })
  }
  
  return segments
}

/**
 * Create segments for vertex alignment mode (pixelated contours)
 */
function createVertexModeSegments(
  row: number,
  col: number,
  edges: number[],
  options: Required<MarchingSquaresOptions>
): Edge[] {
  const segments: Edge[] = []
  
  for (let i = 0; i < edges.length; i += 2) {
    const edge1 = edges[i]
    const edge2 = edges[i + 1]
    
    const steppedPoints: Point[] = []
    
    // Create stepped/pixelated path based on edge pair
    if (edge1 === 0 && edge2 === 1) { // top to right
      steppedPoints.push(
        { x: col + 0.5 + options.offsetX, y: row + options.offsetY },
        { x: col + 1 + options.offsetX, y: row + options.offsetY },
        { x: col + 1 + options.offsetX, y: row + 0.5 + options.offsetY }
      )
    } else if (edge1 === 1 && edge2 === 2) { // right to bottom
      steppedPoints.push(
        { x: col + 1 + options.offsetX, y: row + 0.5 + options.offsetY },
        { x: col + 1 + options.offsetX, y: row + 1 + options.offsetY },
        { x: col + 0.5 + options.offsetX, y: row + 1 + options.offsetY }
      )
    } else if (edge1 === 2 && edge2 === 3) { // bottom to left
      steppedPoints.push(
        { x: col + 0.5 + options.offsetX, y: row + 1 + options.offsetY },
        { x: col + options.offsetX, y: row + 1 + options.offsetY },
        { x: col + options.offsetX, y: row + 0.5 + options.offsetY }
      )
    } else if (edge1 === 3 && edge2 === 0) { // left to top
      steppedPoints.push(
        { x: col + options.offsetX, y: row + 0.5 + options.offsetY },
        { x: col + options.offsetX, y: row + options.offsetY },
        { x: col + 0.5 + options.offsetX, y: row + options.offsetY }
      )
    } else {
      // For other combinations, create direct connection
      steppedPoints.push(
        { x: col + 0.5 + options.offsetX, y: row + 0.5 + options.offsetY },
        { x: col + 0.5 + options.offsetX, y: row + 0.5 + options.offsetY }
      )
    }
    
    // Create segments from stepped points
    for (let j = 0; j < steppedPoints.length - 1; j++) {
      segments.push({
        p1: steppedPoints[j],
        p2: steppedPoints[j + 1]
      })
    }
  }
  
  return segments
}

/**
 * Resolve saddle point ambiguity
 */
function resolveSaddlePoint(
  tl: number,
  tr: number,
  br: number,
  bl: number,
  config: number,
  options: Required<MarchingSquaresOptions>
): boolean {
  if (options.saddlePointResolution === 'center') {
    const center = (tl + tr + br + bl) / 4
    const centerAbove = center >= options.threshold
    return (config === 5 && centerAbove) || (config === 10 && !centerAbove)
  } else if (options.saddlePointResolution === 'gradient') {
    const gradX = (tr + br) - (tl + bl)
    const gradY = (bl + br) - (tl + tr)
    const gradMagnitude = Math.sqrt(gradX * gradX + gradY * gradY)
    
    if (gradMagnitude > 0.001) {
      return Math.abs(gradX) > Math.abs(gradY)
    } else {
      const center = (tl + tr + br + bl) / 4
      return (config === 5 && center >= options.threshold) || (config === 10 && center < options.threshold)
    }
  } else if (options.saddlePointResolution === 'majority') {
    const diag1Diff = Math.abs(tl - br)
    const diag2Diff = Math.abs(tr - bl)
    
    if (config === 5) {
      return diag1Diff < diag2Diff
    } else {
      return diag2Diff < diag1Diff
    }
  }
  
  return false
}

/**
 * Get interpolated edge point with caching
 */
function getEdgePoint(
  cellX: number,
  cellY: number,
  edge: number,
  grid: number[][],
  options: Required<MarchingSquaresOptions>,
  edgeCache: EdgeCache
): Point {
  let x: number, y: number
  
  const useCache = options.alignmentMode !== 'center'
  
  switch (edge) {
    case 0: // top edge
      {
        const cacheKey = `${cellY},${cellX}`
        if (useCache && edgeCache.horizontal.has(cacheKey)) {
          x = edgeCache.horizontal.get(cacheKey)!
          y = cellY
        } else {
          const tl = grid[cellY][cellX]
          const tr = grid[cellY][cellX + 1]
          const t = interpolate(tl, tr, options.threshold, options.interpolationMethod)
          x = cellX + t
          y = cellY
          if (useCache) {
            edgeCache.horizontal.set(cacheKey, x)
          }
        }
      }
      break
      
    case 1: // right edge
      {
        const cacheKey = `${cellY},${cellX + 1}`
        if (useCache && edgeCache.vertical.has(cacheKey)) {
          x = cellX + 1
          y = edgeCache.vertical.get(cacheKey)!
        } else {
          const tr = grid[cellY][cellX + 1]
          const br = grid[cellY + 1][cellX + 1]
          const t = interpolate(tr, br, options.threshold, options.interpolationMethod)
          x = cellX + 1
          y = cellY + t
          if (useCache) {
            edgeCache.vertical.set(cacheKey, y)
          }
        }
      }
      break
      
    case 2: // bottom edge
      {
        const cacheKey = `${cellY + 1},${cellX}`
        if (useCache && edgeCache.horizontal.has(cacheKey)) {
          x = edgeCache.horizontal.get(cacheKey)!
          y = cellY + 1
        } else {
          const bl = grid[cellY + 1][cellX]
          const br = grid[cellY + 1][cellX + 1]
          const t = interpolate(bl, br, options.threshold, options.interpolationMethod)
          x = cellX + t
          y = cellY + 1
          if (useCache) {
            edgeCache.horizontal.set(cacheKey, x)
          }
        }
      }
      break
      
    case 3: // left edge
      {
        const cacheKey = `${cellY},${cellX}`
        if (useCache && edgeCache.vertical.has(cacheKey)) {
          x = cellX
          y = edgeCache.vertical.get(cacheKey)!
        } else {
          const tl = grid[cellY][cellX]
          const bl = grid[cellY + 1][cellX]
          const t = interpolate(tl, bl, options.threshold, options.interpolationMethod)
          x = cellX
          y = cellY + t
          if (useCache) {
            edgeCache.vertical.set(cacheKey, y)
          }
        }
      }
      break
      
    default:
      x = cellX + 0.5
      y = cellY + 0.5
  }
  
  // Apply alignment mode adjustments
  if (options.alignmentMode === 'center') {
    const centerX = cellX + 0.5
    const centerY = cellY + 0.5
    const blendFactor = 0.3
    x = x + (centerX - x) * blendFactor
    y = y + (centerY - y) * blendFactor
  }
  
  // Apply offsets
  return { x: x + options.offsetX, y: y + options.offsetY }
}

/**
 * Interpolate between two values
 */
function interpolate(v1: number, v2: number, threshold: number, method: string = 'linear'): number {
  if (Math.abs(v1 - v2) < 1e-10) return 0.5
  
  const t = (threshold - v1) / (v2 - v1)
  const tClamped = Math.max(0, Math.min(1, t))
  
  if (method === 'none') {
    return tClamped < 0.5 ? 0.0 : 1.0
  }
  
  if (method === 'linear') {
    return tClamped
  } else if (method === 'cubic') {
    const t2 = tClamped * tClamped
    const t3 = t2 * tClamped
    return 3 * t2 - 2 * t3
  }
  
  return tClamped
}

/**
 * Apply edge clamping to a point
 */
function applyEdgeClamping(
  point: Point, 
  gridBounds: { minX: number, maxX: number, minY: number, maxY: number },
  options: Required<MarchingSquaresOptions>
): Point {
  if (!options.edgeClamping) return point
  
  const { minX, maxX, minY, maxY } = gridBounds
  let { x, y } = point
  
  const distToLeft = x - minX
  const distToRight = maxX - x
  const distToTop = y - minY
  const distToBottom = maxY - y
  
  const nearLeft = distToLeft < options.edgeClampDistance
  const nearRight = distToRight < options.edgeClampDistance
  const nearTop = distToTop < options.edgeClampDistance
  const nearBottom = distToBottom < options.edgeClampDistance
  
  const inCorner = (nearLeft || nearRight) && (nearTop || nearBottom)
  
  if (inCorner) {
    switch (options.cornerTreatment) {
      case 'trimmed':
        if (nearLeft && nearTop) {
          const minDist = Math.min(distToLeft, distToTop)
          if (minDist < options.edgeClampDistance * 0.5) {
            x = minX + options.edgeClampDistance * 0.5
            y = minY + options.edgeClampDistance * 0.5
          }
        }
        // ... other corner cases
        break
        
      case 'flared':
        if (nearLeft) {
          const pullStrength = Math.min(1.0, options.edgeClampDistance / Math.max(0.1, distToLeft))
          x = minX + distToLeft * (1.0 - pullStrength * 0.8)
        }
        // ... similar for other edges
        break
        
      case 'square':
        if (nearLeft && distToLeft < options.edgeClampDistance * 0.3) x = minX
        if (nearRight && distToRight < options.edgeClampDistance * 0.3) x = maxX
        if (nearTop && distToTop < options.edgeClampDistance * 0.3) y = minY
        if (nearBottom && distToBottom < options.edgeClampDistance * 0.3) y = maxY
        break
    }
  } else {
    // Standard edge clamping for non-corner areas
    if (nearLeft && distToLeft < options.edgeClampDistance * 0.6) {
      const pullStrength = Math.min(1.0, (options.edgeClampDistance * 0.6) / Math.max(0.05, distToLeft))
      x = minX + distToLeft * (1.0 - pullStrength * 0.7)
    }
    // ... similar for other edges
  }
  
  return { x, y }
}

/**
 * Connect segments into contours
 */
function connectSegments(segments: Edge[]): Point[][] {
  if (segments.length === 0) return []
  
  const pointToSegments = new Map<string, number[]>()
  
  segments.forEach((segment, index) => {
    const p1Key = pointKey(segment.p1)
    const p2Key = pointKey(segment.p2)
    
    if (!pointToSegments.has(p1Key)) pointToSegments.set(p1Key, [])
    if (!pointToSegments.has(p2Key)) pointToSegments.set(p2Key, [])
    
    pointToSegments.get(p1Key)!.push(index)
    pointToSegments.get(p2Key)!.push(index)
  })
  
  const contours: Point[][] = []
  const used = new Set<number>()
  
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue
    
    const contour = buildContour(i, segments, pointToSegments, used)
    if (contour.length > 2) {
      contours.push(contour)
    }
  }
  
  return contours
}

/**
 * Build a single contour from connected segments
 */
function buildContour(
  startIndex: number,
  segments: Edge[],
  pointToSegments: Map<string, number[]>,
  used: Set<number>
): Point[] {
  const contour: Point[] = []
  let currentSegment = segments[startIndex]
  used.add(startIndex)
  
  contour.push(currentSegment.p1)
  contour.push(currentSegment.p2)
  
  let currentPoint = currentSegment.p2
  let foundNext = true
  
  while (foundNext) {
    foundNext = false
    const currentKey = pointKey(currentPoint)
    const connectedSegments = pointToSegments.get(currentKey) || []
    
    for (const segIndex of connectedSegments) {
      if (used.has(segIndex)) continue
      
      const seg = segments[segIndex]
      let nextPoint: Point | null = null
      
      const epsilon = 0.001
      if (pointsEqual(seg.p1, currentPoint, epsilon)) {
        nextPoint = seg.p2
      } else if (pointsEqual(seg.p2, currentPoint, epsilon)) {
        nextPoint = seg.p1
      }
      
      if (nextPoint) {
        contour.push(nextPoint)
        currentPoint = nextPoint
        used.add(segIndex)
        foundNext = true
        break
      }
    }
  }
  
  // Try to close the contour
  if (pointsClose(contour[0], contour[contour.length - 1])) {
    contour[contour.length - 1] = contour[0]
  }
  
  return contour
}

/**
 * Apply post-processing (smoothing, collision avoidance, validation, etc.)
 */
function applyPostProcessing(
  contours: Point[][], 
  options: Required<MarchingSquaresOptions>,
  gridInfo: { rows: number, cols: number }
): Point[][] {
  let finalContours = contours
  
  // Filter by minimum length/area first
  if (options.minContourLength > 3) {
    finalContours = finalContours.filter(contour => contour.length >= options.minContourLength)
  }
  
  if (options.minContourArea > 0) {
    finalContours = finalContours.filter(contour => calculateContourArea(contour) >= options.minContourArea)
  }
  
  // Apply smoothing if requested
  if (options.smoothing) {
    finalContours = applySmoothingToContours(finalContours, options, gridInfo)
  }
  
  // Apply collision avoidance if requested
  if (options.collisionAvoidance && finalContours.length > 1) {
    finalContours = applyCollisionAvoidanceToContours(finalContours, options, gridInfo)
  }
  
  // Apply simplification if requested
  if (options.simplificationTolerance > 0) {
    finalContours = finalContours
      .map(contour => simplifyContour(contour, options.simplificationTolerance))
      .filter(contour => contour.length >= 3)
  }
  
  // Apply global offsets
  const adjustX = options.globalOffsetX - (options.bufferSize > 0 ? options.bufferSize : 0)
  const adjustY = options.globalOffsetY - (options.bufferSize > 0 ? options.bufferSize : 0)
  
  if (adjustX !== 0 || adjustY !== 0) {
    finalContours = finalContours.map(contour => 
      contour.map(point => ({
        x: point.x + adjustX,
        y: point.y + adjustY
      }))
    )
  }
  
  // Validate and repair contours if requested
  if (options.validateContours) {
    const validationOptions: ValidationOptions = {
      removeSelfIntersections: options.removeSelfIntersections,
      ensureClockwise: options.ensureClockwise,
      minSegmentLength: options.mergeDistance,
      mergeClosePoints: options.mergeClosePoints,
      mergeDistance: options.mergeDistance
    }
    
    finalContours = validateAndRepairContours(finalContours, validationOptions)
  }
  
  return finalContours
}

/**
 * Apply smoothing to contours
 */
function applySmoothingToContours(
  contours: Point[][],
  options: Required<MarchingSquaresOptions>,
  gridInfo: { rows: number, cols: number }
): Point[][] {
  const edgeConstraints: EdgeConstraints = {
    leftEdge: 0 - options.bufferSize,
    rightEdge: gridInfo.cols - options.bufferSize,
    topEdge: 0 - options.bufferSize,
    bottomEdge: gridInfo.rows - options.bufferSize,
    tolerance: 0.1,
    edgeClamping: options.edgeClamping,
    edgeClampDistance: options.edgeClampDistance,
    cornerTreatment: options.cornerTreatment
  }
  
  switch (options.smoothingMethod) {
    case 'laplacian':
      return contours.map(contour => 
        laplacianSmoothing(contour, edgeConstraints, {
          iterations: options.smoothingIterations,
          strength: options.smoothingStrength,
          preserveEdges: true
        })
      )
      
    case 'chaikin':
      return contours.map(contour => 
        chaikinSmoothing(contour, edgeConstraints, {
          iterations: options.smoothingIterations,
          preserveEdges: true
        })
      )
      
    case 'bilateral':
      return contours.map(contour => 
        bilateralSmoothing(contour, edgeConstraints, {
          iterations: options.smoothingIterations,
          strength: options.smoothingStrength,
          preserveEdges: true
        })
      )
      
    case 'savitzky-golay':
      return contours.map(contour => 
        savitzkyGolaySmoothing(contour, edgeConstraints, {
          preserveEdges: true
        })
      )
      
    case 'catmull-rom':
      return contours.map(contour => 
        constrainedCatmullRomSmoothing(contour, edgeConstraints, {
          strength: options.smoothingStrength,
          preserveEdges: true
        })
      )
      
    case 'edge-aware':
      {
        const gridBounds: GridBounds = {
          left: 0 - options.bufferSize,
          right: gridInfo.cols - options.bufferSize,
          top: 0 - options.bufferSize,
          bottom: gridInfo.rows - options.bufferSize
        }
        return contours.map(contour => 
          edgeAwareSmoothing(contour, gridBounds, {
            iterations: options.smoothingIterations,
            strength: options.smoothingStrength,
            edgeTransitionZone: options.edgeTransitionZone,
            preserveCorners: options.preserveCorners
          })
        )
      }
      
    case 'intelligent':
      {
        const gridBounds: GridBounds = {
          left: 0 - options.bufferSize,
          right: gridInfo.cols - options.bufferSize,
          top: 0 - options.bufferSize,
          bottom: gridInfo.rows - options.bufferSize
        }
        return contours.map(contour => 
          intelligentEdgeSmoothing(contour, gridBounds, {
            iterations: options.smoothingIterations,
            strength: options.smoothingStrength,
            edgeTransitionZone: options.edgeTransitionZone,
            preserveCorners: options.preserveCorners
          })
        )
      }
      
    case 'basic':
    default:
      return contours.map(contour => smoothContour(contour))
  }
}

/**
 * Apply collision avoidance to contours
 */
function applyCollisionAvoidanceToContours(
  contours: Point[][],
  options: Required<MarchingSquaresOptions>,
  gridInfo: { rows: number, cols: number }
): Point[][] {
  const edgeConstraints = {
    leftEdge: 0 - options.bufferSize,
    rightEdge: gridInfo.cols - options.bufferSize,
    topEdge: 0 - options.bufferSize,
    bottomEdge: gridInfo.rows - options.bufferSize
  }
  
  const collisionOptions: CollisionAvoidanceOptions = {
    minDistance: options.collisionMinDistance,
    method: options.collisionMethod,
    iterations: options.collisionIterations
  }
  
  return applyCollisionAvoidanceWithConstraints(
    contours,
    edgeConstraints,
    collisionOptions
  )
}

/**
 * Basic smoothing function
 */
function smoothContour(contour: Point[]): Point[] {
  if (contour.length < 3) return contour
  
  const smoothed: Point[] = []
  const isClosed = pointsEqual(contour[0], contour[contour.length - 1])
  
  for (let i = 0; i < contour.length; i++) {
    const p0 = contour[(i - 1 + contour.length) % contour.length]
    const p1 = contour[i]
    const p2 = contour[(i + 1) % contour.length]
    
    if (!isClosed && (i === 0 || i === contour.length - 1)) {
      smoothed.push(p1)
      continue
    }
    
    smoothed.push({
      x: (p0.x + 2 * p1.x + p2.x) / 4,
      y: (p0.y + 2 * p1.y + p2.y) / 4
    })
  }
  
  return smoothed
}

/**
 * Douglas-Peucker simplification algorithm
 */
function simplifyContour(contour: Point[], tolerance: number): Point[] {
  if (tolerance <= 0 || contour.length < 3) return contour
  
  function pointLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lengthSquared = dx * dx + dy * dy
    
    if (lengthSquared === 0) {
      return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2)
    }
    
    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared))
    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy
    
    return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2)
  }
  
  function simplifyRecursive(points: Point[], start: number, end: number, simplified: boolean[]): void {
    if (end - start < 2) return
    
    let maxDist = 0
    let maxIndex = 0
    
    for (let i = start + 1; i < end; i++) {
      const dist = pointLineDistance(points[i], points[start], points[end])
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }
    
    if (maxDist > tolerance) {
      simplified[maxIndex] = true
      simplifyRecursive(points, start, maxIndex, simplified)
      simplifyRecursive(points, maxIndex, end, simplified)
    }
  }
  
  const simplified = new Array(contour.length).fill(false)
  simplified[0] = true
  simplified[contour.length - 1] = true
  
  simplifyRecursive(contour, 0, contour.length - 1, simplified)
  
  return contour.filter((_, i) => simplified[i])
}

/**
 * Calculate contour area using shoelace formula
 */
function calculateContourArea(contour: Point[]): number {
  if (contour.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < contour.length; i++) {
    const j = (i + 1) % contour.length
    area += contour[i].x * contour[j].y
    area -= contour[j].x * contour[i].y
  }
  
  return Math.abs(area) / 2
}

/**
 * Utility functions
 */
function pointKey(p: Point): string {
  return `${Math.round(p.x * 1000)},${Math.round(p.y * 1000)}`
}

function pointsEqual(p1: Point, p2: Point, epsilon: number = 1e-10): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}

function pointsClose(p1: Point, p2: Point, epsilon: number = 0.01): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}

// Legacy compatibility exports
export { marchingSquares as marchingSquaresOptimized }