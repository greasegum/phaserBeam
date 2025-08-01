export interface Point {
  x: number
  y: number
}

interface Edge {
  p1: Point
  p2: Point
}

export function marchingSquaresInterpolated(grid: number[][], threshold: number = 0.5): Point[][] {
  const rows = grid.length
  const cols = grid[0].length
  const contours: Point[][] = []
  
  if (rows < 2 || cols < 2) return contours
  
  // Marching squares lookup table for all 16 cases
  // Each case defines which edges should have line segments
  // Edge indices: 0=top, 1=right, 2=bottom, 3=left
  const edgeTable: number[][] = [
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
  
  const segments: Edge[] = []
  
  // Process each cell in the grid
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const tl = grid[row][col] >= threshold ? 1 : 0     // top-left
      const tr = grid[row][col + 1] >= threshold ? 1 : 0 // top-right
      const br = grid[row + 1][col + 1] >= threshold ? 1 : 0 // bottom-right
      const bl = grid[row + 1][col] >= threshold ? 1 : 0 // bottom-left
      
      // Calculate the index for the lookup table
      // Order: bottom-left, bottom-right, top-right, top-left
      const index = bl | (br << 1) | (tr << 2) | (tl << 3)
      
      const edges = edgeTable[index]
      if (!edges || edges.length === 0) continue
      
      // Process edges in pairs
      for (let i = 0; i < edges.length; i += 2) {
        if (i + 1 >= edges.length) break
        
        const edge1 = edges[i]
        const edge2 = edges[i + 1]
        
        // For ambiguous cases, check the center value to determine connectivity
        if (index === 5 || index === 10) {
          const center = (grid[row][col] + grid[row][col + 1] + 
                         grid[row + 1][col + 1] + grid[row + 1][col]) / 4
          const centerAbove = center >= threshold
          
          // For case 5: if center is above threshold, connect 3-0 and 2-1
          // For case 10: if center is below threshold, connect 0-1 and 3-2
          if ((index === 5 && centerAbove) || (index === 10 && !centerAbove)) {
            // Connect differently
            const p1 = getInterpolatedEdgePoint(col, row, edges[0], grid, threshold)
            const p2 = getInterpolatedEdgePoint(col, row, edges[3], grid, threshold)
            const p3 = getInterpolatedEdgePoint(col, row, edges[1], grid, threshold)
            const p4 = getInterpolatedEdgePoint(col, row, edges[2], grid, threshold)
            segments.push({ p1, p2 })
            segments.push({ p1: p3, p2: p4 })
            break
          }
        }
        
        const p1 = getInterpolatedEdgePoint(col, row, edge1, grid, threshold)
        const p2 = getInterpolatedEdgePoint(col, row, edge2, grid, threshold)
        
        segments.push({ p1, p2 })
      }
    }
  }
  
  // Connect segments into contours
  return connectSegments(segments)
}

function getInterpolatedEdgePoint(cellX: number, cellY: number, edge: number, grid: number[][], threshold: number): Point {
  // Get the four corner values
  const tl = grid[cellY][cellX]
  const tr = grid[cellY][cellX + 1]
  const br = grid[cellY + 1][cellX + 1]
  const bl = grid[cellY + 1][cellX]
  
  let x: number, y: number
  
  switch (edge) {
    case 0: // top edge
      {
        const t = interpolate(tl, tr, threshold)
        x = cellX + t
        y = cellY
      }
      break
    case 1: // right edge
      {
        const t = interpolate(tr, br, threshold)
        x = cellX + 1
        y = cellY + t
      }
      break
    case 2: // bottom edge
      {
        const t = interpolate(bl, br, threshold)
        x = cellX + t
        y = cellY + 1
      }
      break
    case 3: // left edge
      {
        const t = interpolate(tl, bl, threshold)
        x = cellX
        y = cellY + t
      }
      break
    default:
      x = cellX + 0.5
      y = cellY + 0.5
  }
  
  return { x, y }
}

function interpolate(v1: number, v2: number, threshold: number): number {
  if (Math.abs(v1 - v2) < 1e-10) return 0.5
  return (threshold - v1) / (v2 - v1)
}

function connectSegments(segments: Edge[]): Point[][] {
  if (segments.length === 0) return []
  
  const contours: Point[][] = []
  const used = new Set<number>()
  
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue
    
    const contour: Point[] = []
    let currentSegment = segments[i]
    used.add(i)
    
    contour.push(currentSegment.p1)
    contour.push(currentSegment.p2)
    
    // Try to extend the contour in both directions
    let extended = true
    while (extended) {
      extended = false
      
      const lastPoint = contour[contour.length - 1]
      const firstPoint = contour[0]
      
      // Try to extend at the end
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue
        
        const seg = segments[j]
        if (pointsClose(lastPoint, seg.p1)) {
          contour.push(seg.p2)
          used.add(j)
          extended = true
          break
        } else if (pointsClose(lastPoint, seg.p2)) {
          contour.push(seg.p1)
          used.add(j)
          extended = true
          break
        }
      }
      
      // Try to extend at the beginning
      if (!extended) {
        for (let j = 0; j < segments.length; j++) {
          if (used.has(j)) continue
          
          const seg = segments[j]
          if (pointsClose(firstPoint, seg.p1)) {
            contour.unshift(seg.p2)
            used.add(j)
            extended = true
            break
          } else if (pointsClose(firstPoint, seg.p2)) {
            contour.unshift(seg.p1)
            used.add(j)
            extended = true
            break
          }
        }
      }
    }
    
    if (contour.length > 2) {
      contours.push(contour)
    }
  }
  
  return contours
}

function pointsClose(p1: Point, p2: Point, epsilon: number = 0.01): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}