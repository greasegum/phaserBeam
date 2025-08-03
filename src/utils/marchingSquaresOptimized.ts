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

export interface Point {
  x: number
  y: number
}

interface Edge {
  p1: Point
  p2: Point
}

interface EdgeCache {
  horizontal: Map<string, number> // key: "row,col" -> interpolated x position
  vertical: Map<string, number>   // key: "row,col" -> interpolated y position
}

export interface MarchingSquaresOptions {
  threshold?: number
  smoothing?: boolean
  edgeSnapping?: boolean
  snapDistance?: number
  // Grid alignment offsets
  offsetX?: number      // Horizontal offset in grid units (0.5 = half cell)
  offsetY?: number      // Vertical offset in grid units (0.5 = half cell)
  // Global position offset
  globalOffsetX?: number // Global X offset applied to all points
  globalOffsetY?: number // Global Y offset applied to all points
  // Buffer configuration
  bufferSize?: number   // Number of cells to pad around the grid (default: 0)
  bufferValue?: number  // Value to use for buffer cells (default: 0)
  // Contour filtering and simplification
  minContourLength?: number // Minimum points required to keep a contour (default: 3)
  minContourArea?: number   // Minimum area to keep a contour (default: 0)
  simplificationTolerance?: number // Douglas-Peucker simplification tolerance (default: 0)
  // Interpolation options
  interpolationMethod?: 'linear' | 'cubic' | 'none' // Interpolation method (default: 'linear')
  // Saddle point resolution
  saddlePointResolution?: 'center' | 'gradient' | 'majority' // How to resolve saddle points (default: 'center')
  // Edge behavior
  edgeMode?: 'clamp' | 'extend' // How to handle contours at edges (default: 'clamp')
  extendToBoundary?: boolean // Extend contours to grid boundary (default: false)
  // Grid alignment mode
  alignmentMode?: 'edges' | 'vertices' | 'center' // Draw through cell edges, vertices or centers (default: 'edges')
  // Advanced smoothing options
  smoothingMethod?: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom'
  smoothingIterations?: number // Number of smoothing iterations (default: 2)
  smoothingStrength?: number // Smoothing strength factor (default: 0.5)
  // Collision avoidance options
  collisionAvoidance?: boolean // Enable collision avoidance between regions (default: false)
  collisionMinDistance?: number // Minimum distance between contours in grid units (default: 0.5)
  collisionMethod?: 'push' | 'shrink' | 'hybrid' // Collision resolution method (default: 'hybrid')
  collisionIterations?: number // Max iterations for collision resolution (default: 10)
  // Validation options
  validateContours?: boolean // Enable contour validation and repair (default: true)
  removeSelfIntersections?: boolean // Remove self-intersections (default: true)
  ensureClockwise?: boolean // Ensure clockwise orientation (default: true)
  mergeClosePoints?: boolean // Merge points that are too close (default: true)
  mergeDistance?: number // Distance threshold for merging points (default: 0.01)
}

// Validate and auto-correct conflicting parameters
function validateAndCorrectOptions(options: MarchingSquaresOptions): MarchingSquaresOptions {
  const corrected = { ...options }
  
  // Auto-corrections for logical conflicts
  if (corrected.alignmentMode === 'vertices' && corrected.interpolationMethod === 'linear') {
    // Interpolation is meaningless in vertex mode
    corrected.interpolationMethod = 'none'
    console.warn('Marching Squares: Setting interpolationMethod to "none" for vertex alignment mode')
  }
  
  // Reduce smoothing intensity for vertex mode
  if (corrected.alignmentMode === 'vertices' && corrected.smoothing) {
    console.warn('Marching Squares: Smoothing may reduce the angular appearance of vertex mode')
  }
  
  // Warn about contradictory combinations
  if (corrected.interpolationMethod === 'none' && corrected.smoothing) {
    console.warn('Marching Squares: Smoothing with no interpolation may produce unexpected results')
  }
  
  // Clamp buffer size to reasonable range
  if (corrected.bufferSize !== undefined) {
    corrected.bufferSize = Math.max(0, Math.min(10, corrected.bufferSize))
    if (options.bufferSize !== corrected.bufferSize) {
      console.warn(`Marching Squares: Buffer size clamped to ${corrected.bufferSize}`)
    }
  }
  
  // Ensure buffer value is valid
  if (corrected.bufferValue !== undefined) {
    corrected.bufferValue = Math.max(0, Math.min(1, corrected.bufferValue))
  }
  
  // Warn about performance issues
  if (corrected.smoothing && corrected.simplificationTolerance === 0) {
    console.warn('Marching Squares: Consider using simplification with smoothing for better performance')
  }
  
  // Ensure minimum contour length is valid
  if (corrected.minContourLength !== undefined) {
    corrected.minContourLength = Math.max(3, corrected.minContourLength)
  }
  
  return corrected
}

export function marchingSquaresOptimized(
  grid: number[][], 
  options: MarchingSquaresOptions = {}
): Point[][] {
  // Validate and correct parameters
  const validatedOptions = validateAndCorrectOptions(options)
  
  const {
    threshold = 0.5,
    smoothing = false,
    edgeSnapping = true,
    snapDistance = 0.01,
    offsetX = 0,
    offsetY = 0,
    globalOffsetX = 0,
    globalOffsetY = 0,
    bufferSize = 0,
    bufferValue = 0,
    minContourLength = 3,
    minContourArea = 0,
    simplificationTolerance = 0,
    interpolationMethod = 'linear',
    saddlePointResolution = 'center',
    edgeMode = 'clamp',
    extendToBoundary = false,
    alignmentMode = 'edges',
    smoothingMethod = 'basic',
    smoothingIterations = 2,
    smoothingStrength = 0.5,
    collisionAvoidance = false,
    collisionMinDistance = 0.5,
    collisionMethod = 'hybrid',
    collisionIterations = 10,
    validateContours = true,
    removeSelfIntersections = true,
    ensureClockwise = true,
    mergeClosePoints = true,
    mergeDistance = 0.01
  } = validatedOptions

  let processGrid = grid
  let rows = grid.length
  let cols = grid[0].length
  
  if (rows < 2 || cols < 2) return []
  
  // Apply buffer if specified
  if (bufferSize > 0) {
    const bufferedRows = rows + 2 * bufferSize
    const bufferedCols = cols + 2 * bufferSize
    processGrid = Array(bufferedRows).fill(null).map(() => Array(bufferedCols).fill(bufferValue))
    
    // Copy original grid into center of buffered grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        processGrid[r + bufferSize][c + bufferSize] = grid[r][c]
      }
    }
    
    rows = bufferedRows
    cols = bufferedCols
    
    // Ensure grid is still processable after buffering
    if (rows < 2 || cols < 2) {
      console.warn('Marching Squares: Grid too small after buffering')
      return []
    }
  }
  
  // Edge lookup table - same as before but with clearer organization
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
  
  // Initialize edge cache for consistent interpolation
  const edgeCache: EdgeCache = {
    horizontal: new Map(),
    vertical: new Map()
  }
  
  const segments: Edge[] = []
  
  // Process each cell
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const cellSegments = processCellOptimized(
        row, col, processGrid, threshold, EDGE_TABLE, edgeCache, offsetX, offsetY, interpolationMethod, saddlePointResolution, alignmentMode
      )
      segments.push(...cellSegments)
    }
  }
  
  // Connect segments into contours
  const contours = connectSegmentsOptimized(segments)
  
  // Apply smoothing if requested
  let finalContours = contours
  
  if (smoothing) {
    // Define edge constraints based on grid dimensions and buffer
    const gridLeft = 0 - bufferSize
    const gridRight = cols - bufferSize
    const gridTop = 0 - bufferSize
    const gridBottom = rows - bufferSize
    
    const edgeConstraints: EdgeConstraints = {
      leftEdge: edgeMode === 'clamp' ? gridLeft : undefined,
      rightEdge: edgeMode === 'clamp' ? gridRight : undefined,
      topEdge: edgeMode === 'clamp' ? gridTop : undefined,
      bottomEdge: edgeMode === 'clamp' ? gridBottom : undefined,
      tolerance: 0.1
    }
    
    // Apply the selected smoothing method
    switch (smoothingMethod) {
      case 'laplacian':
        finalContours = contours.map(contour => 
          laplacianSmoothing(contour, edgeConstraints, {
            iterations: smoothingIterations,
            strength: smoothingStrength,
            preserveEdges: true
          })
        )
        break
        
      case 'chaikin':
        finalContours = contours.map(contour => 
          chaikinSmoothing(contour, edgeConstraints, {
            iterations: smoothingIterations,
            preserveEdges: true
          })
        )
        break
        
      case 'bilateral':
        finalContours = contours.map(contour => 
          bilateralSmoothing(contour, edgeConstraints, {
            iterations: smoothingIterations,
            strength: smoothingStrength,
            preserveEdges: true
          })
        )
        break
        
      case 'savitzky-golay':
        finalContours = contours.map(contour => 
          savitzkyGolaySmoothing(contour, edgeConstraints, {
            preserveEdges: true
          })
        )
        break
        
      case 'catmull-rom':
        finalContours = contours.map(contour => 
          constrainedCatmullRomSmoothing(contour, edgeConstraints, {
            strength: smoothingStrength,
            preserveEdges: true
          })
        )
        break
        
      case 'basic':
      default:
        finalContours = contours.map(contour => smoothContour(contour))
        break
    }
  }
  
  // Filter contours by minimum length
  if (minContourLength > 3) {
    finalContours = finalContours.filter(contour => contour.length >= minContourLength)
  }
  
  // Filter contours by minimum area
  if (minContourArea > 0) {
    finalContours = finalContours.filter(contour => calculateContourArea(contour) >= minContourArea)
  }
  
  // Apply simplification if requested
  if (simplificationTolerance > 0) {
    finalContours = finalContours
      .map(contour => simplifyContour(contour, simplificationTolerance))
      .filter(contour => contour.length >= 3) // Ensure valid contours after simplification
  }
  
  // Re-apply filters after simplification to ensure constraints are met
  if (simplificationTolerance > 0 && minContourLength > 3) {
    finalContours = finalContours.filter(contour => contour.length >= minContourLength)
  }
  
  if (simplificationTolerance > 0 && minContourArea > 0) {
    finalContours = finalContours.filter(contour => calculateContourArea(contour) >= minContourArea)
  }
  
  // Apply collision avoidance if requested
  if (collisionAvoidance && finalContours.length > 1) {
    const gridLeft = 0 - bufferSize
    const gridRight = cols - bufferSize
    const gridTop = 0 - bufferSize
    const gridBottom = rows - bufferSize
    
    const edgeConstraints = {
      leftEdge: edgeMode === 'clamp' ? gridLeft : undefined,
      rightEdge: edgeMode === 'clamp' ? gridRight : undefined,
      topEdge: edgeMode === 'clamp' ? gridTop : undefined,
      bottomEdge: edgeMode === 'clamp' ? gridBottom : undefined
    }
    
    const collisionOptions: CollisionAvoidanceOptions = {
      minDistance: collisionMinDistance,
      method: collisionMethod,
      iterations: collisionIterations
    }
    
    finalContours = applyCollisionAvoidanceWithConstraints(
      finalContours,
      edgeConstraints,
      collisionOptions
    )
  }
  
  // Apply buffer offset adjustment and global offsets
  const adjustX = globalOffsetX - (bufferSize > 0 ? bufferSize : 0)
  const adjustY = globalOffsetY - (bufferSize > 0 ? bufferSize : 0)
  
  if (adjustX !== 0 || adjustY !== 0) {
    finalContours = finalContours.map(contour => 
      contour.map(point => ({
        x: point.x + adjustX,
        y: point.y + adjustY
      }))
    )
  }
  
  // Validate and repair contours if requested
  if (validateContours) {
    const validationOptions: ValidationOptions = {
      removeSelfIntersections,
      ensureClockwise,
      minSegmentLength: mergeDistance,
      mergeClosePoints,
      mergeDistance
    }
    
    finalContours = validateAndRepairContours(finalContours, validationOptions)
  }
  
  return finalContours
}

function processCellOptimized(
  row: number,
  col: number,
  grid: number[][],
  threshold: number,
  edgeTable: number[][],
  edgeCache: EdgeCache,
  offsetX: number,
  offsetY: number,
  interpolationMethod: 'linear' | 'cubic' | 'none',
  saddlePointResolution: 'center' | 'gradient' | 'majority',
  alignmentMode: 'edges' | 'vertices' | 'center'
): Edge[] {
  // Get corner values
  const tl = grid[row][col]
  const tr = grid[row][col + 1]
  const br = grid[row + 1][col + 1]
  const bl = grid[row + 1][col]
  
  // Calculate configuration
  const config = 
    (bl >= threshold ? 1 : 0) |
    (br >= threshold ? 2 : 0) |
    (tr >= threshold ? 4 : 0) |
    (tl >= threshold ? 8 : 0)
  
  const edges = edgeTable[config]
  if (!edges || edges.length === 0) return []
  
  const segments: Edge[] = []
  
  // In vertices mode, use a different approach
  if (alignmentMode === 'vertices') {
    // Vertex-based contours connect grid vertices directly
    const points: Point[] = []
    
    // Define vertex positions relative to cell
    const vertices: Point[] = [
      { x: col, y: row },         // top-left
      { x: col + 1, y: row },     // top-right
      { x: col + 1, y: row + 1 }, // bottom-right
      { x: col, y: row + 1 }      // bottom-left
    ]
    
    // For each configuration, determine which vertices to connect
    // This creates contours that pass through grid intersections
    switch (config) {
      case 1: // bottom-left inside
        points.push(vertices[3], vertices[0])
        break
      case 2: // bottom-right inside
        points.push(vertices[2], vertices[3])
        break
      case 3: // bottom inside
        points.push(vertices[2], vertices[0])
        break
      case 4: // top-right inside
        points.push(vertices[1], vertices[2])
        break
      case 5: // diagonal - connect based on center
        {
          const center = (tl + tr + br + bl) / 4
          if (center >= threshold) {
            points.push(vertices[0], vertices[2]) // connect tl to br
          } else {
            points.push(vertices[1], vertices[3]) // connect tr to bl
          }
        }
        break
      case 6: // right inside
        points.push(vertices[1], vertices[3])
        break
      case 7: // all except top-left
        points.push(vertices[1], vertices[0])
        break
      case 8: // top-left inside
        points.push(vertices[0], vertices[1])
        break
      case 9: // left inside
        points.push(vertices[3], vertices[1])
        break
      case 10: // diagonal - opposite of case 5
        {
          const center = (tl + tr + br + bl) / 4
          if (center >= threshold) {
            points.push(vertices[1], vertices[3]) // connect tr to bl
          } else {
            points.push(vertices[0], vertices[2]) // connect tl to br
          }
        }
        break
      case 11: // all except top-right
        points.push(vertices[0], vertices[2])
        break
      case 12: // top inside
        points.push(vertices[0], vertices[3])
        break
      case 13: // all except bottom-right
        points.push(vertices[3], vertices[1])
        break
      case 14: // all except bottom-left
        points.push(vertices[2], vertices[0])
        break
    }
    
    // Apply offsets to vertex positions
    if (points.length === 2) {
      segments.push({
        p1: { x: points[0].x + offsetX, y: points[0].y + offsetY },
        p2: { x: points[1].x + offsetX, y: points[1].y + offsetY }
      })
    }
    
    return segments
  }
  
  // Handle ambiguous cases (saddle points)
  if (config === 5 || config === 10) {
    let connectDiagonally = false
    
    if (saddlePointResolution === 'center') {
      // Use center value to decide
      const center = (tl + tr + br + bl) / 4
      const centerAbove = center >= threshold
      connectDiagonally = (config === 5 && centerAbove) || (config === 10 && !centerAbove)
    } else if (saddlePointResolution === 'gradient') {
      // Use gradient to decide - connect along the steepest gradient
      const gradX = (tr + br) - (tl + bl)
      const gradY = (bl + br) - (tl + tr)
      const gradMagnitude = Math.sqrt(gradX * gradX + gradY * gradY)
      
      if (gradMagnitude > 0.001) {
        // Connect perpendicular to gradient for smoother results
        connectDiagonally = Math.abs(gradX) > Math.abs(gradY)
      } else {
        // Fallback to center method if gradient is too small
        const center = (tl + tr + br + bl) / 4
        connectDiagonally = (config === 5 && center >= threshold) || (config === 10 && center < threshold)
      }
    } else if (saddlePointResolution === 'majority') {
      // Use majority vote - connect based on which diagonal has more similar values
      const diag1Diff = Math.abs(tl - br) // Top-left to bottom-right
      const diag2Diff = Math.abs(tr - bl) // Top-right to bottom-left
      // For case 5: smaller diff means connect tl-br
      // For case 10: smaller diff means connect tr-bl
      if (config === 5) {
        connectDiagonally = diag1Diff < diag2Diff
      } else {
        connectDiagonally = diag2Diff < diag1Diff
      }
    }
    
    if (connectDiagonally) {
      // Connect differently for ambiguous cases
      const p1 = getInterpolatedEdgePointCached(col, row, edges[0], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
      const p2 = getInterpolatedEdgePointCached(col, row, edges[3], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
      const p3 = getInterpolatedEdgePointCached(col, row, edges[1], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
      const p4 = getInterpolatedEdgePointCached(col, row, edges[2], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
      
      segments.push({ p1, p2 })
      segments.push({ p1: p3, p2: p4 })
      return segments
    }
  }
  
  // Process edges in pairs
  for (let i = 0; i < edges.length; i += 2) {
    if (i + 1 >= edges.length) break
    
    const p1 = getInterpolatedEdgePointCached(col, row, edges[i], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
    const p2 = getInterpolatedEdgePointCached(col, row, edges[i + 1], grid, threshold, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode)
    
    segments.push({ p1, p2 })
  }
  
  return segments
}

function getInterpolatedEdgePointCached(
  cellX: number,
  cellY: number,
  edge: number,
  grid: number[][],
  threshold: number,
  edgeCache: EdgeCache,
  offsetX: number,
  offsetY: number,
  interpolationMethod: 'linear' | 'cubic' | 'none',
  alignmentMode: 'edges' | 'vertices' | 'center'
): Point {
  let x: number, y: number
  
  switch (edge) {
    case 0: // top edge
      {
        const cacheKey = `${cellY},${cellX}`
        if (edgeCache.horizontal.has(cacheKey)) {
          x = edgeCache.horizontal.get(cacheKey)!
          y = cellY
        } else {
          const tl = grid[cellY][cellX]
          const tr = grid[cellY][cellX + 1]
          const t = interpolate(tl, tr, threshold, interpolationMethod)
          x = cellX + t
          y = cellY
          edgeCache.horizontal.set(cacheKey, x)
        }
      }
      break
      
    case 1: // right edge
      {
        const cacheKey = `${cellY},${cellX + 1}`
        if (edgeCache.vertical.has(cacheKey)) {
          x = cellX + 1
          y = edgeCache.vertical.get(cacheKey)!
        } else {
          const tr = grid[cellY][cellX + 1]
          const br = grid[cellY + 1][cellX + 1]
          const t = interpolate(tr, br, threshold, interpolationMethod)
          x = cellX + 1
          y = cellY + t
          edgeCache.vertical.set(cacheKey, y)
        }
      }
      break
      
    case 2: // bottom edge
      {
        const cacheKey = `${cellY + 1},${cellX}`
        if (edgeCache.horizontal.has(cacheKey)) {
          x = edgeCache.horizontal.get(cacheKey)!
          y = cellY + 1
        } else {
          const bl = grid[cellY + 1][cellX]
          const br = grid[cellY + 1][cellX + 1]
          const t = interpolate(bl, br, threshold, interpolationMethod)
          x = cellX + t
          y = cellY + 1
          edgeCache.horizontal.set(cacheKey, x)
        }
      }
      break
      
    case 3: // left edge
      {
        const cacheKey = `${cellY},${cellX}`
        if (edgeCache.vertical.has(cacheKey)) {
          x = cellX
          y = edgeCache.vertical.get(cacheKey)!
        } else {
          const tl = grid[cellY][cellX]
          const bl = grid[cellY + 1][cellX]
          const t = interpolate(tl, bl, threshold, interpolationMethod)
          x = cellX
          y = cellY + t
          edgeCache.vertical.set(cacheKey, y)
        }
      }
      break
      
    default:
      x = cellX + 0.5
      y = cellY + 0.5
  }
  
  // Apply alignment mode adjustments
  if (alignmentMode === 'center') {
    // In center mode, shift all points to cell centers
    const centerOffsetX = 0.5
    const centerOffsetY = 0.5
    
    // Find which cell this edge belongs to and adjust to its center
    switch (edge) {
      case 0: // top edge - shift down to center
        y += centerOffsetY
        break
      case 1: // right edge - shift left to center
        x -= centerOffsetX
        break
      case 2: // bottom edge - shift up to center
        y -= centerOffsetY
        break
      case 3: // left edge - shift right to center
        x += centerOffsetX
        break
    }
  }
  
  // Apply offsets
  return { x: x + offsetX, y: y + offsetY }
}

function interpolate(v1: number, v2: number, threshold: number, method: 'linear' | 'cubic' | 'none' = 'linear'): number {
  // Avoid division by zero
  if (Math.abs(v1 - v2) < 1e-10) return 0.5
  
  if (method === 'none') return 0.5
  
  // Linear interpolation
  const t = (threshold - v1) / (v2 - v1)
  const tClamped = Math.max(0, Math.min(1, t))
  
  if (method === 'linear') {
    return tClamped
  } else if (method === 'cubic') {
    // Cubic hermite interpolation for smoother curves
    const t2 = tClamped * tClamped
    const t3 = t2 * tClamped
    return 3 * t2 - 2 * t3
  }
  
  return tClamped
}

function connectSegmentsOptimized(segments: Edge[]): Point[][] {
  if (segments.length === 0) return []
  
  // Build adjacency information for faster lookup
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
      
      if (pointsEqual(seg.p1, currentPoint)) {
        nextPoint = seg.p2
      } else if (pointsEqual(seg.p2, currentPoint)) {
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
    contour[contour.length - 1] = contour[0] // Ensure exact closure
  }
  
  return contour
}

function smoothContour(contour: Point[]): Point[] {
  if (contour.length < 3) return contour
  
  const smoothed: Point[] = []
  const isClosed = pointsEqual(contour[0], contour[contour.length - 1])
  
  for (let i = 0; i < contour.length; i++) {
    const p0 = contour[(i - 1 + contour.length) % contour.length]
    const p1 = contour[i]
    const p2 = contour[(i + 1) % contour.length]
    
    // Skip smoothing for endpoints of open contours
    if (!isClosed && (i === 0 || i === contour.length - 1)) {
      smoothed.push(p1)
      continue
    }
    
    // Simple averaging for smoothing
    smoothed.push({
      x: (p0.x + 2 * p1.x + p2.x) / 4,
      y: (p0.y + 2 * p1.y + p2.y) / 4
    })
  }
  
  return smoothed
}

// Douglas-Peucker simplification algorithm
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

// Calculate contour area using shoelace formula
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

// Utility functions
function pointKey(p: Point): string {
  // Round to avoid floating point comparison issues
  return `${Math.round(p.x * 10000)},${Math.round(p.y * 10000)}`
}

function pointsEqual(p1: Point, p2: Point, epsilon: number = 1e-10): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}

function pointsClose(p1: Point, p2: Point, epsilon: number = 0.01): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}

// Additional utility for Bézier curve generation
export function generateBezierPath(contour: Point[]): string {
  if (contour.length < 3) {
    return contour.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }
  
  const path: string[] = [`M ${contour[0].x} ${contour[0].y}`]
  const isClosed = pointsEqual(contour[0], contour[contour.length - 1])
  
  for (let i = 0; i < contour.length - 1; i++) {
    const p0 = contour[i]
    const p1 = contour[i + 1]
    const p2 = contour[(i + 2) % contour.length]
    
    // Calculate control points for smooth curves
    const cp1x = p0.x + (p1.x - p0.x) * 0.3
    const cp1y = p0.y + (p1.y - p0.y) * 0.3
    const cp2x = p1.x - (p2.x - p1.x) * 0.3
    const cp2y = p1.y - (p2.y - p1.y) * 0.3
    
    path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`)
  }
  
  if (isClosed) {
    path.push('Z')
  }
  
  return path.join(' ')
}