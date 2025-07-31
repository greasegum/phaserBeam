import { GridCell } from '../types/beam'

interface Point {
  x: number
  y: number
}

export function marchingSquares(cells: GridCell[], cellSize: number, threshold: number = 0.5): Point[][] {
  if (cells.length === 0) return []

  // Create a grid from cells
  const minX = Math.min(...cells.map(c => c.x))
  const maxX = Math.max(...cells.map(c => c.x))
  const minY = Math.min(...cells.map(c => c.y))
  const maxY = Math.max(...cells.map(c => c.y))
  
  const width = maxX - minX + 2
  const height = maxY - minY + 2
  
  // Initialize grid with padding
  const grid: number[][] = Array(height + 1).fill(null).map(() => Array(width + 1).fill(0))
  
  // Fill grid with cell values
  cells.forEach(cell => {
    const x = cell.x - minX + 1
    const y = cell.y - minY + 1
    grid[y][x] = cell.selected ? 1 : 0
  })
  
  const contours: Point[][] = []
  const visited = new Set<string>()
  
  // Marching squares lookup table
  const edgeTable: Record<number, number[][]> = {
    0: [],
    1: [[0, 0.5], [0.5, 0]],
    2: [[0.5, 0], [1, 0.5]],
    3: [[0, 0.5], [1, 0.5]],
    4: [[1, 0.5], [0.5, 1]],
    5: [[0, 0.5], [0.5, 0], [1, 0.5], [0.5, 1]],
    6: [[0.5, 0], [0.5, 1]],
    7: [[0, 0.5], [0.5, 1]],
    8: [[0.5, 1], [0, 0.5]],
    9: [[0.5, 0], [0.5, 1]],
    10: [[0, 0.5], [0.5, 0], [1, 0.5], [0.5, 1]],
    11: [[1, 0.5], [0.5, 1]],
    12: [[0, 0.5], [1, 0.5]],
    13: [[0.5, 0], [1, 0.5]],
    14: [[0, 0.5], [0.5, 0]],
    15: []
  }
  
  // Process each cell
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      if (visited.has(key)) continue
      
      // Get cell configuration
      const config = 
        (grid[y][x] >= threshold ? 1 : 0) |
        (grid[y][x + 1] >= threshold ? 2 : 0) |
        (grid[y + 1][x + 1] >= threshold ? 4 : 0) |
        (grid[y + 1][x] >= threshold ? 8 : 0)
      
      const edges = edgeTable[config]
      if (edges.length === 0) continue
      
      // Convert to world coordinates
      const contour: Point[] = []
      for (let i = 0; i < edges.length; i += 2) {
        const edge1 = edges[i]
        const edge2 = edges[i + 1] || edges[0]
        
        contour.push({
          x: (x + edge1[0] - 1) * cellSize,
          y: (y + edge1[1] - 1) * cellSize
        })
        contour.push({
          x: (x + edge2[0] - 1) * cellSize,
          y: (y + edge2[1] - 1) * cellSize
        })
      }
      
      if (contour.length > 0) {
        contours.push(contour)
      }
      
      visited.add(key)
    }
  }
  
  return contours
}