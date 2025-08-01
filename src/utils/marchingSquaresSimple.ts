export interface Point {
  x: number
  y: number
}

export function marchingSquaresSimple(grid: number[][], threshold: number = 0.5): Point[][] {
  const rows = grid.length
  const cols = grid[0].length
  const contours: Point[][] = []
  
  // Marching squares lookup table for all 16 cases
  const edgeTable = [
    [],           // 0: 0000
    [[3, 0]],     // 1: 0001
    [[0, 1]],     // 2: 0010
    [[3, 1]],     // 3: 0011
    [[1, 2]],     // 4: 0100
    [[3, 0], [1, 2]], // 5: 0101 (saddle point)
    [[0, 2]],     // 6: 0110
    [[3, 2]],     // 7: 0111
    [[2, 3]],     // 8: 1000
    [[2, 0]],     // 9: 1001
    [[0, 1], [2, 3]], // 10: 1010 (saddle point)
    [[2, 1]],     // 11: 1011
    [[1, 3]],     // 12: 1100
    [[1, 0]],     // 13: 1101
    [[0, 3]],     // 14: 1110
    []            // 15: 1111
  ]
  
  // Edge definitions: [start vertex, end vertex]
  // Vertices: 0=top-left, 1=top-right, 2=bottom-right, 3=bottom-left
  // Edges: 0=top, 1=right, 2=bottom, 3=left
  
  const visited = new Set<string>()
  
  // Process each cell
  for (let y = 0; y < rows - 1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      // Get the 4 corners of the cell
      const tl = grid[y][x] >= threshold ? 1 : 0
      const tr = grid[y][x + 1] >= threshold ? 1 : 0
      const br = grid[y + 1][x + 1] >= threshold ? 1 : 0
      const bl = grid[y + 1][x] >= threshold ? 1 : 0
      
      // Calculate the index for the lookup table
      const index = tl | (tr << 1) | (br << 2) | (bl << 3)
      
      // Skip if no edges or all filled
      if (index === 0 || index === 15) continue
      
      const edges = edgeTable[index]
      
      // Process each edge segment
      edges.forEach(edge => {
        const [startEdge, endEdge] = edge
        
        // Calculate actual coordinates for the edge points
        const startPoint = getEdgePoint(x, y, startEdge)
        const endPoint = getEdgePoint(x, y, endEdge)
        
        // Create a simple line segment
        const segment = [startPoint, endPoint]
        const key = `${x},${y},${index}`
        
        if (!visited.has(key)) {
          visited.add(key)
          
          // Try to connect this segment to existing contours
          let connected = false
          
          for (let i = 0; i < contours.length; i++) {
            const contour = contours[i]
            const first = contour[0]
            const last = contour[contour.length - 1]
            
            // Check if this segment connects to the end of an existing contour
            if (isClose(last, startPoint)) {
              contour.push(endPoint)
              connected = true
              break
            } else if (isClose(last, endPoint)) {
              contour.push(startPoint)
              connected = true
              break
            } else if (isClose(first, startPoint)) {
              contour.unshift(endPoint)
              connected = true
              break
            } else if (isClose(first, endPoint)) {
              contour.unshift(startPoint)
              connected = true
              break
            }
          }
          
          // If not connected to any existing contour, start a new one
          if (!connected) {
            contours.push(segment)
          }
        }
      })
    }
  }
  
  // Try to merge contours that should be connected
  let merged = true
  while (merged) {
    merged = false
    
    for (let i = 0; i < contours.length - 1; i++) {
      for (let j = i + 1; j < contours.length; j++) {
        const contour1 = contours[i]
        const contour2 = contours[j]
        
        if (tryMergeContours(contour1, contour2)) {
          contours.splice(j, 1)
          merged = true
          break
        }
      }
      if (merged) break
    }
  }
  
  return contours
}

function getEdgePoint(cellX: number, cellY: number, edge: number): Point {
  // Returns the midpoint of the specified edge
  // Edges: 0=top, 1=right, 2=bottom, 3=left
  switch (edge) {
    case 0: // top edge
      return { x: cellX + 0.5, y: cellY }
    case 1: // right edge
      return { x: cellX + 1, y: cellY + 0.5 }
    case 2: // bottom edge
      return { x: cellX + 0.5, y: cellY + 1 }
    case 3: // left edge
      return { x: cellX, y: cellY + 0.5 }
    default:
      return { x: cellX, y: cellY }
  }
}

function isClose(p1: Point, p2: Point, epsilon: number = 0.01): boolean {
  return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon
}

function tryMergeContours(contour1: Point[], contour2: Point[]): boolean {
  const first1 = contour1[0]
  const last1 = contour1[contour1.length - 1]
  const first2 = contour2[0]
  const last2 = contour2[contour2.length - 1]
  
  if (isClose(last1, first2)) {
    // Append contour2 to contour1
    contour1.push(...contour2.slice(1))
    return true
  } else if (isClose(last1, last2)) {
    // Append reversed contour2 to contour1
    contour1.push(...contour2.slice(0, -1).reverse())
    return true
  } else if (isClose(first1, first2)) {
    // Prepend reversed contour2 to contour1
    contour1.unshift(...contour2.slice(1).reverse())
    return true
  } else if (isClose(first1, last2)) {
    // Prepend contour2 to contour1
    contour1.unshift(...contour2.slice(0, -1))
    return true
  }
  
  return false
}