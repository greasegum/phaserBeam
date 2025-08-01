export function marchingSquares(grid: number[][], threshold: number): number[][][] {
  const rows = grid.length
  const cols = grid[0].length
  const contours: number[][][] = []
  
  // Edge configurations for marching squares
  const EDGE_TABLE = [
    [], // 0
    [[0, 0.5], [0.5, 1]], // 1
    [[0.5, 1], [1, 0.5]], // 2
    [[0, 0.5], [1, 0.5]], // 3
    [[1, 0.5], [0.5, 0]], // 4
    [[0, 0.5], [0.5, 0], [1, 0.5], [0.5, 1]], // 5 - saddle point
    [[0.5, 1], [0.5, 0]], // 6
    [[0, 0.5], [0.5, 0]], // 7
    [[0.5, 0], [0, 0.5]], // 8
    [[0.5, 0], [0.5, 1]], // 9
    [[0, 0.5], [0.5, 1], [1, 0.5], [0.5, 0]], // 10 - saddle point
    [[1, 0.5], [0.5, 0]], // 11
    [[1, 0.5], [0, 0.5]], // 12
    [[0.5, 1], [1, 0.5]], // 13
    [[0.5, 1], [0, 0.5]], // 14
    [] // 15
  ]
  
  // Helper to interpolate edge position
  const interpolate = (v1: number, v2: number, threshold: number): number => {
    if (Math.abs(v1 - v2) < 0.00001) return 0.5
    return (threshold - v1) / (v2 - v1)
  }
  
  // Process each cell
  const processedEdges = new Set<string>()
  
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      // Get values at corners
      const tl = grid[y][x]
      const tr = grid[y][x + 1]
      const br = grid[y + 1][x + 1]
      const bl = grid[y + 1][x]
      
      // Calculate configuration
      let config = 0
      if (tl >= threshold) config |= 1
      if (tr >= threshold) config |= 2
      if (br >= threshold) config |= 4
      if (bl >= threshold) config |= 8
      
      if (config === 0 || config === 15) continue
      
      const edges = EDGE_TABLE[config]
      const points: number[][] = []
      
      // Process edges
      for (let i = 0; i < edges.length; i += 2) {
        const e1 = edges[i]
        const e2 = edges[i + 1]
        
        // Calculate actual positions with interpolation
        const p1x = x + e1[0]
        const p1y = y + e1[1]
        const p2x = x + e2[0]
        const p2y = y + e2[1]
        
        points.push([p1x, p1y])
        points.push([p2x, p2y])
      }
      
      if (points.length > 0) {
        // For saddle points (configs 5 and 10), handle correctly
        if (config === 5 || config === 10) {
          const center = (tl + tr + br + bl) / 4
          if ((config === 5 && center < threshold) || (config === 10 && center >= threshold)) {
            // Split into two separate contours
            contours.push([points[0], points[1]])
            contours.push([points[2], points[3]])
          } else {
            // Connect as one contour
            contours.push([points[0], points[3]])
            contours.push([points[1], points[2]])
          }
        } else {
          contours.push(points)
        }
      }
    }
  }
  
  // Merge connected contours
  const mergedContours = mergeContours(contours)
  
  return mergedContours
}

function mergeContours(segments: number[][][]): number[][][] {
  if (segments.length === 0) return []
  
  const contours: number[][][] = []
  const used = new Set<number>()
  
  for (let i = 0; i < segments.length; i++) {
    if (used.has(i)) continue
    
    const contour = [...segments[i]]
    used.add(i)
    
    let changed = true
    while (changed) {
      changed = false
      
      for (let j = 0; j < segments.length; j++) {
        if (used.has(j)) continue
        
        const segment = segments[j]
        const lastPoint = contour[contour.length - 1]
        const firstPoint = contour[0]
        
        // Check if segment connects to end of contour
        if (distance(lastPoint, segment[0]) < 0.01) {
          contour.push(...segment.slice(1))
          used.add(j)
          changed = true
        } else if (distance(lastPoint, segment[segment.length - 1]) < 0.01) {
          contour.push(...segment.slice(0, -1).reverse())
          used.add(j)
          changed = true
        }
        // Check if segment connects to start of contour
        else if (distance(firstPoint, segment[segment.length - 1]) < 0.01) {
          contour.unshift(...segment.slice(0, -1))
          used.add(j)
          changed = true
        } else if (distance(firstPoint, segment[0]) < 0.01) {
          contour.unshift(...segment.slice(1).reverse())
          used.add(j)
          changed = true
        }
      }
    }
    
    // Close contour if endpoints are close
    if (contour.length > 2 && distance(contour[0], contour[contour.length - 1]) < 0.01) {
      contour.push(contour[0])
    }
    
    contours.push(contour)
  }
  
  return contours
}

function distance(p1: number[], p2: number[]): number {
  const dx = p1[0] - p2[0]
  const dy = p1[1] - p2[1]
  return Math.sqrt(dx * dx + dy * dy)
}