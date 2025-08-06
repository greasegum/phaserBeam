/**
 * Raw binary marching squares algorithm
 * Pure implementation with minimal dependencies - operates directly on binary grids
 */

export interface Point2D {
  x: number
  y: number
}

export interface ContourSegment {
  start: Point2D
  end: Point2D
}

export interface BinaryMarchingConfig {
  /** How to handle grid edges */
  edgePolicy: 'clamp' | 'wrap' | 'none'
  /** Whether to interpolate edge intersections */
  interpolate: boolean
}

/**
 * Extract contour segments from a binary grid using marching squares
 * Returns individual line segments that can be connected into paths
 */
export function extractBinaryContours(
  binaryGrid: boolean[][],
  config: BinaryMarchingConfig = { edgePolicy: 'clamp', interpolate: false }
): ContourSegment[] {
  const rows = binaryGrid.length
  const cols = binaryGrid[0]?.length || 0
  
  if (rows < 2 || cols < 2) {
    return []
  }
  
  const segments: ContourSegment[] = []
  
  // Process each grid cell
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const cellSegments = extractCellSegments(binaryGrid, row, col, config)
      segments.push(...cellSegments)
    }
  }
  
  return segments
}

/**
 * Extract contour segments from a single grid cell
 */
function extractCellSegments(
  binaryGrid: boolean[][],
  row: number,
  col: number,
  config: BinaryMarchingConfig
): ContourSegment[] {
  // Get the four corner values of the cell
  const corners = getCellCorners(binaryGrid, row, col, config.edgePolicy)
  
  // Determine the marching squares case (0-15)
  const caseIndex = getBinaryMarchingCase(corners)
  
  if (caseIndex === 0 || caseIndex === 15) {
    // No contour or fully inside
    return []
  }
  
  // Generate contour segments for this case
  return generateBinarySegments(corners, row, col, caseIndex, config.interpolate)
}

/**
 * Get the four corner values of a grid cell, applying edge policy
 */
function getCellCorners(
  binaryGrid: boolean[][],
  row: number,
  col: number,
  edgePolicy: 'clamp' | 'wrap' | 'none'
): [boolean, boolean, boolean, boolean] {
  const rows = binaryGrid.length
  const cols = binaryGrid[0]?.length || 0
  
  const getValue = (r: number, c: number): boolean => {
    switch (edgePolicy) {
      case 'clamp':
        r = Math.max(0, Math.min(rows - 1, r))
        c = Math.max(0, Math.min(cols - 1, c))
        return binaryGrid[r][c]
      
      case 'wrap':
        r = ((r % rows) + rows) % rows
        c = ((c % cols) + cols) % cols
        return binaryGrid[r][c]
      
      case 'none':
      default:
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
          return false // Default value outside bounds
        }
        return binaryGrid[r][c]
    }
  }
  
  // Return corners in order: top-left, top-right, bottom-right, bottom-left
  return [
    getValue(row, col),         // Top-left
    getValue(row, col + 1),     // Top-right
    getValue(row + 1, col + 1), // Bottom-right
    getValue(row + 1, col)      // Bottom-left
  ]
}

/**
 * Determine marching squares case index from corner values
 */
function getBinaryMarchingCase(corners: [boolean, boolean, boolean, boolean]): number {
  let caseIndex = 0
  
  if (corners[0]) caseIndex |= 1  // Top-left
  if (corners[1]) caseIndex |= 2  // Top-right
  if (corners[2]) caseIndex |= 4  // Bottom-right
  if (corners[3]) caseIndex |= 8  // Bottom-left
  
  return caseIndex
}

/**
 * Generate contour segments for a specific marching squares case
 */
function generateBinarySegments(
  corners: [boolean, boolean, boolean, boolean],
  row: number,
  col: number,
  caseIndex: number,
  interpolate: boolean
): ContourSegment[] {
  // Edge intersection points
  const getEdgePoint = (edge: number): Point2D => {
    if (interpolate) {
      // For binary grids, interpolation just means edge midpoints
      switch (edge) {
        case 0: return { x: col + 0.5, y: row }       // Top edge
        case 1: return { x: col + 1, y: row + 0.5 }   // Right edge
        case 2: return { x: col + 0.5, y: row + 1 }   // Bottom edge
        case 3: return { x: col, y: row + 0.5 }       // Left edge
        default: return { x: col, y: row }
      }
    } else {
      // Non-interpolated: snap to grid corners
      switch (edge) {
        case 0: return corners[0] ? { x: col, y: row } : { x: col + 1, y: row }
        case 1: return corners[1] ? { x: col + 1, y: row } : { x: col + 1, y: row + 1 }
        case 2: return corners[2] ? { x: col + 1, y: row + 1 } : { x: col, y: row + 1 }
        case 3: return corners[3] ? { x: col, y: row + 1 } : { x: col, y: row }
        default: return { x: col, y: row }
      }
    }
  }
  
  // Marching squares lookup table - maps case to edge pairs
  const edgeTable: number[][] = [
    [],           // Case 0
    [3, 0],       // Case 1
    [0, 1],       // Case 2
    [3, 1],       // Case 3
    [1, 2],       // Case 4
    [3, 0, 1, 2], // Case 5 (saddle - split into two segments)
    [0, 2],       // Case 6
    [3, 2],       // Case 7
    [2, 3],       // Case 8
    [2, 0],       // Case 9
    [0, 1, 2, 3], // Case 10 (saddle - split into two segments)
    [2, 1],       // Case 11
    [1, 3],       // Case 12
    [0, 3],       // Case 13
    [1, 0],       // Case 14
    []            // Case 15
  ]
  
  const edges = edgeTable[caseIndex]
  const segments: ContourSegment[] = []
  
  if (edges.length === 2) {
    // Simple case: one contour segment
    segments.push({
      start: getEdgePoint(edges[0]),
      end: getEdgePoint(edges[1])
    })
  } else if (edges.length === 4) {
    // Saddle case: two separate contour segments
    segments.push({
      start: getEdgePoint(edges[0]),
      end: getEdgePoint(edges[1])
    })
    segments.push({
      start: getEdgePoint(edges[2]),
      end: getEdgePoint(edges[3])
    })
  }
  
  return segments
}

/**
 * Connect contour segments into continuous paths
 * Returns arrays of connected points forming contour lines
 */
export function connectContourSegments(segments: ContourSegment[], tolerance: number = 0.001): Point2D[][] {
  if (segments.length === 0) return []
  
  const paths: Point2D[][] = []
  const usedSegments = new Set<number>()
  
  for (let i = 0; i < segments.length; i++) {
    if (usedSegments.has(i)) continue
    
    const path = [segments[i].start, segments[i].end]
    usedSegments.add(i)
    
    // Try to extend the path by connecting more segments
    let extended = true
    while (extended) {
      extended = false
      
      for (let j = 0; j < segments.length; j++) {
        if (usedSegments.has(j)) continue
        
        const segment = segments[j]
        const pathEnd = path[path.length - 1]
        const pathStart = path[0]
        
        // Check if segment connects to end of path
        if (pointsEqual(pathEnd, segment.start, tolerance)) {
          path.push(segment.end)
          usedSegments.add(j)
          extended = true
          break
        } else if (pointsEqual(pathEnd, segment.end, tolerance)) {
          path.push(segment.start)
          usedSegments.add(j)
          extended = true
          break
        }
        // Check if segment connects to start of path
        else if (pointsEqual(pathStart, segment.end, tolerance)) {
          path.unshift(segment.start)
          usedSegments.add(j)
          extended = true
          break
        } else if (pointsEqual(pathStart, segment.start, tolerance)) {
          path.unshift(segment.end)
          usedSegments.add(j)
          extended = true
          break
        }
      }
    }
    
    if (path.length >= 2) {
      paths.push(path)
    }
  }
  
  return paths
}

/**
 * Check if two points are equal within tolerance
 */
function pointsEqual(p1: Point2D, p2: Point2D, tolerance: number): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance
}

/**
 * Convert a numeric grid to binary using a threshold
 */
export function thresholdToBinary(grid: number[][], threshold: number = 0.5): boolean[][] {
  return grid.map(row => row.map(value => value >= threshold))
}

/**
 * Simple helper to extract connected contour paths from binary grid
 */
export function extractBinaryContourPaths(
  binaryGrid: boolean[][],
  config: BinaryMarchingConfig = { edgePolicy: 'clamp', interpolate: true }
): Point2D[][] {
  const segments = extractBinaryContours(binaryGrid, config)
  return connectContourSegments(segments)
}
