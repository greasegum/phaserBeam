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
  selectiveEdgeSmoothing,
  intelligentSelectiveSmoothing,
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
  scalarFieldMethod?: 'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving'
  
  // Edge detection parameters (separate from contour threshold)
  edgeDetectionThreshold?: number // Threshold for detecting activated edges (default: 0.1)
  edgeDetectionEnabled?: boolean // Whether to use edge detection for clamping (default: true)
  
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
  edgeClampDistance?: number
  cornerTreatment?: 'trimmed' | 'flared' | 'square'
  clampToGrid?: boolean  // Legacy compatibility
  
  // Smoothing configuration
  smoothing?: boolean
  smoothingMethod?: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective' | 'intelligent-selective'
  smoothingIterations?: number
  smoothingStrength?: number
  edgeTransitionZone?: number
  preserveCorners?: boolean
  
  // Selective smoothing options
  edgeBufferDistance?: number // Distance from edge where smoothing is disabled
  preserveEdgeSegments?: boolean // Whether to keep edge segments exactly as-is
  transitionBlending?: boolean // Whether to blend between smoothed and edge segments
  curvatureThreshold?: number // Curvature threshold for preserving segments
  preserveStraightSegments?: boolean // Whether to preserve straight segments
  
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
  scalarFieldMethod: 'gaussian',
  
  // Edge detection parameters
  edgeDetectionThreshold: 0.1,
  edgeDetectionEnabled: true,
  
  // Grid positioning
  offsetX: 0.5, // Center on edges for proper grid alignment
  offsetY: 0.5, // Center on edges for proper grid alignment
  globalOffsetX: 0,
  globalOffsetY: 0,
  bufferSize: 1,
  bufferValue: 0,
  
  // Edge behavior (clamping is now mandatory)
  edgeSnapping: true,
  snapDistance: 0.1,
  extendToBoundary: false,
  // Edge clamping is now mandatory
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
  
  // Selective smoothing options
  edgeBufferDistance: 2.0,
  preserveEdgeSegments: true,
  transitionBlending: true,
  curvatureThreshold: 0.1,
  preserveStraightSegments: true,
  
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
  
  // Detect activated edges for strict clamping
  const activatedEdges = detectActivatedEdges(processGrid, options.edgeDetectionThreshold, options)
  
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
      
      // Always apply strict edge clamping to segments - this is mandatory behavior
      // When buffer is applied, the actual content starts at bufferSize and ends at cols/rows - bufferSize
      const gridBounds = {
        minX: options.bufferSize,
        maxX: cols - 1 - options.bufferSize,
        minY: options.bufferSize,
        maxY: rows - 1 - options.bufferSize
      }
      
      cellSegments.forEach(segment => {
        segment.p1 = applyStrictEdgeClamping(segment.p1, gridBounds, activatedEdges, options)
        segment.p2 = applyStrictEdgeClamping(segment.p2, gridBounds, activatedEdges, options)
      })
      
      segments.push(...cellSegments)
    }
  }
  
  // Connect segments into contours
  const contours = connectSegments(segments)
  
  // Apply post-processing with edge constraints
  return applyPostProcessing(contours, options, { rows, cols }, activatedEdges)
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
    // For diagonal patterns, prefer connecting corners that are both active
    const tlActive = tl >= options.threshold
    const trActive = tr >= options.threshold
    const brActive = br >= options.threshold
    const blActive = bl >= options.threshold
    
    // For case 5 (tl and br active), connect them if they're both strongly active
    // For case 10 (tr and bl active), connect them if they're both strongly active
    if (config === 5) {
      // If both tl and br are active, prefer connecting them
      return tlActive && brActive
    } else { // config === 10
      // If both tr and bl are active, prefer connecting them
      return trActive && blActive
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
 * Detect if edge cells are activated and create strict boundary constraints
 * Uses separate edge detection threshold to prevent contour threshold from overriding edge clamping
 * Only checks exact edge cells (not nearby cells) to ensure proper boundary alignment
 */
function detectActivatedEdges(
  grid: number[][],
  edgeDetectionThreshold: number,
  options: Required<MarchingSquaresOptions>
): { left: boolean, right: boolean, top: boolean, bottom: boolean } {
  const rows = grid.length
  const cols = grid[0].length
  
  let leftEdgeActive = false
  let rightEdgeActive = false
  let topEdgeActive = false
  let bottomEdgeActive = false
  
  // Edge detection: check for activity at exact edge cells only
  const edgeSensitivity = 0.01 // Low threshold for sensitive edge detection
  
  // Check left edge (column 0 only)
  for (let row = 0; row < rows; row++) {
    if (grid[row][0] >= edgeSensitivity) {
      leftEdgeActive = true
      break
    }
  }
  
  // Check right edge (last column only)
  for (let row = 0; row < rows; row++) {
    if (grid[row][cols - 1] >= edgeSensitivity) {
      rightEdgeActive = true
      break
    }
  }
  
  // Check top edge (row 0 only)
  for (let col = 0; col < cols; col++) {
    if (grid[0][col] >= edgeSensitivity) {
      topEdgeActive = true
      break
    }
  }
  
  // Check bottom edge (last row only)
  for (let col = 0; col < cols; col++) {
    if (grid[rows - 1][col] >= edgeSensitivity) {
      bottomEdgeActive = true
      break
    }
  }
  
  // Enhanced fallback: if ANY edge has activity, activate ALL edges
  // This ensures consistent edge clamping regardless of threshold
  let anyEdgeActivity = false
  
  // Check all edge cells for any activity
  for (let row = 0; row < rows; row++) {
    if (grid[row][0] > 0.01 || grid[row][cols - 1] > 0.01) {
      anyEdgeActivity = true
      break
    }
  }
  for (let col = 0; col < cols; col++) {
    if (grid[0][col] > 0.01 || grid[rows - 1][col] > 0.01) {
      anyEdgeActivity = true
      break
    }
  }
  
  // If there's any edge activity at all, activate all edges for consistent clamping
  if (anyEdgeActivity) {
    leftEdgeActive = true
    rightEdgeActive = true
    topEdgeActive = true
    bottomEdgeActive = true
  }
  
  // Additional safety: if the grid has any data at all, ensure edge clamping is enabled
  // This prevents edge clamping from being disabled when threshold changes
  let hasAnyData = false
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] > 0.01) {
        hasAnyData = true
        break
      }
    }
    if (hasAnyData) break
  }
  
  // If there's any data in the grid, ensure edge clamping is enabled
  if (hasAnyData) {
    leftEdgeActive = true
    rightEdgeActive = true
    topEdgeActive = true
    bottomEdgeActive = true
  }
  
  return { left: leftEdgeActive, right: rightEdgeActive, top: topEdgeActive, bottom: bottomEdgeActive }
}

/**
 * Apply strict edge clamping - always snap exactly to boundaries when edge cells are active
 * This is mandatory behavior for proper structural beam section loss visualization
 * Enhanced to work regardless of contour threshold
 */
function applyStrictEdgeClamping(
  point: Point,
  gridBounds: { minX: number, maxX: number, minY: number, maxY: number },
  activatedEdges: { left: boolean, right: boolean, top: boolean, bottom: boolean },
  options: Required<MarchingSquaresOptions>
): Point {
  const { minX, maxX, minY, maxY } = gridBounds
  let { x, y } = point
  
  // Enhanced edge clamping that works regardless of contour threshold
  // Check if point is near any edge and apply clamping based on edge activation
  
  // Left edge clamping
  if (activatedEdges.left && Math.abs(x - minX) < options.edgeClampDistance) {
    x = minX
  }
  
  // Right edge clamping
  if (activatedEdges.right && Math.abs(x - maxX) < options.edgeClampDistance) {
    x = maxX
  }
  
  // Top edge clamping
  if (activatedEdges.top && Math.abs(y - minY) < options.edgeClampDistance) {
    y = minY
  }
  
  // Bottom edge clamping
  if (activatedEdges.bottom && Math.abs(y - maxY) < options.edgeClampDistance) {
    y = maxY
  }
  
  // Additional edge preservation: if point is exactly on an edge boundary,
  // preserve it regardless of threshold
  const edgeTolerance = 0.1
  if (Math.abs(x - minX) < edgeTolerance && activatedEdges.left) {
    x = minX
  }
  if (Math.abs(x - maxX) < edgeTolerance && activatedEdges.right) {
    x = maxX
  }
  if (Math.abs(y - minY) < edgeTolerance && activatedEdges.top) {
    y = minY
  }
  if (Math.abs(y - maxY) < edgeTolerance && activatedEdges.bottom) {
    y = maxY
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
 * Apply post-processing with enhanced edge preservation
 * Ensures edge clamping is maintained regardless of contour threshold
 */
function applyPostProcessing(
  contours: Point[][],
  options: Required<MarchingSquaresOptions>,
  gridInfo: { rows: number, cols: number },
  activatedEdges?: { left: boolean, right: boolean, top: boolean, bottom: boolean }
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
    finalContours = applySmoothingToContours(finalContours, options, gridInfo, activatedEdges)
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
  
  // Enhanced edge preservation: ensure edge points are preserved regardless of threshold
  if (activatedEdges) {
    const gridBounds = {
      minX: 0,
      maxX: gridInfo.cols - 1,
      minY: 0,
      maxY: gridInfo.rows - 1
    }
    
    finalContours = finalContours.map(contour => 
      contour.map(point => {
        // Apply additional edge preservation at contour level
        let x = point.x
        let y = point.y
        
        // Check if point is near an edge and preserve it
        const edgeTolerance = 0.2
        if (activatedEdges.left && Math.abs(x - gridBounds.minX) < edgeTolerance) {
          x = gridBounds.minX
        }
        if (activatedEdges.right && Math.abs(x - gridBounds.maxX) < edgeTolerance) {
          x = gridBounds.maxX
        }
        if (activatedEdges.top && Math.abs(y - gridBounds.minY) < edgeTolerance) {
          y = gridBounds.minY
        }
        if (activatedEdges.bottom && Math.abs(y - gridBounds.maxY) < edgeTolerance) {
          y = gridBounds.maxY
        }
        
        return { x, y }
      })
    )
  }
  
  // Apply global offsets
  // The coordinates are already in the original grid space after clamping
  const adjustX = options.globalOffsetX
  const adjustY = options.globalOffsetY
  
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
 * Apply smoothing to contours with edge constraints
 */
function applySmoothingToContours(
  contours: Point[][],
  options: Required<MarchingSquaresOptions>,
  gridInfo: { rows: number, cols: number },
  activatedEdges?: { left: boolean, right: boolean, top: boolean, bottom: boolean }
): Point[][] {
  const edgeConstraints: EdgeConstraints = {
    leftEdge: 0,
    rightEdge: gridInfo.cols - 1,
    topEdge: 0,
    bottomEdge: gridInfo.rows - 1,
    tolerance: 0.1,
    // Edge clamping is now mandatory
    edgeClampDistance: options.edgeClampDistance,
    cornerTreatment: options.cornerTreatment,
    strictEdges: activatedEdges || { left: false, right: false, top: false, bottom: false }
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
          left: 0,
          right: gridInfo.cols - 1,
          top: 0,
          bottom: gridInfo.rows - 1,
          strictEdges: activatedEdges
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
          left: 0,
          right: gridInfo.cols - 1,
          top: 0,
          bottom: gridInfo.rows - 1,
          strictEdges: activatedEdges
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
      
    case 'selective':
      {
        const gridBounds: GridBounds = {
          left: 0,
          right: gridInfo.cols - 1,
          top: 0,
          bottom: gridInfo.rows - 1,
          strictEdges: activatedEdges
        }
        return contours.map(contour =>
          selectiveEdgeSmoothing(contour, gridBounds, {
            iterations: options.smoothingIterations,
            strength: options.smoothingStrength,
            edgeTransitionZone: options.edgeTransitionZone,
            preserveCorners: options.preserveCorners,
            edgeBufferDistance: options.edgeBufferDistance,
            preserveEdgeSegments: options.preserveEdgeSegments,
            transitionBlending: options.transitionBlending
          })
        )
      }
      
    case 'intelligent-selective':
      {
        const gridBounds: GridBounds = {
          left: 0,
          right: gridInfo.cols - 1,
          top: 0,
          bottom: gridInfo.rows - 1,
          strictEdges: activatedEdges
        }
        return contours.map(contour =>
          intelligentSelectiveSmoothing(contour, gridBounds, {
            iterations: options.smoothingIterations,
            strength: options.smoothingStrength,
            edgeTransitionZone: options.edgeTransitionZone,
            preserveCorners: options.preserveCorners,
            edgeBufferDistance: options.edgeBufferDistance,
            curvatureThreshold: options.curvatureThreshold,
            preserveStraightSegments: options.preserveStraightSegments
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