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
  interpolationMethod?: 'linear' | 'none' // Interpolation method (default: 'linear')
  // Edge behavior
  edgeMode?: 'clamp' | 'extend' // How to handle contours at edges (default: 'clamp')
  // Grid alignment mode
  alignmentMode?: 'edges' | 'vertices' // Draw through cell edges or vertices (default: 'edges')
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
    edgeMode = 'clamp',
    alignmentMode = 'edges'
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
        row, col, processGrid, threshold, EDGE_TABLE, edgeCache, offsetX, offsetY, interpolationMethod, alignmentMode
      )
      segments.push(...cellSegments)
    }
  }
  
  // Connect segments into contours
  const contours = connectSegmentsOptimized(segments)
  
  // Apply smoothing if requested
  let finalContours = smoothing 
    ? contours.map(contour => smoothContour(contour))
    : contours
  
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
  interpolationMethod: 'linear' | 'none',
  alignmentMode: 'edges' | 'vertices'
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
  
  // Handle ambiguous cases
  if (config === 5 || config === 10) {
    const center = (tl + tr + br + bl) / 4
    const centerAbove = center >= threshold
    
    if ((config === 5 && centerAbove) || (config === 10 && !centerAbove)) {
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
  interpolationMethod: 'linear' | 'none',
  alignmentMode: 'edges' | 'vertices'
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
          const t = interpolationMethod === 'none' ? 0.5 : interpolate(tl, tr, threshold)
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
          const t = interpolationMethod === 'none' ? 0.5 : interpolate(tr, br, threshold)
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
          const t = interpolationMethod === 'none' ? 0.5 : interpolate(bl, br, threshold)
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
          const t = interpolationMethod === 'none' ? 0.5 : interpolate(tl, bl, threshold)
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
  
  // Apply offsets
  return { x: x + offsetX, y: y + offsetY }
}

function interpolate(v1: number, v2: number, threshold: number): number {
  // Avoid division by zero
  if (Math.abs(v1 - v2) < 1e-10) return 0.5
  
  // Linear interpolation
  const t = (threshold - v1) / (v2 - v1)
  
  // Clamp to [0, 1] to handle numerical errors
  return Math.max(0, Math.min(1, t))
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