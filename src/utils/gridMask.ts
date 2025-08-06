import { GridCell } from '../types/beam'

/**
 * Creates a binary mask from selected grid cells
 */
export function maskFromSelectedCells(
  selectedCells: Set<string>,
  zone: string,
  cols: number,
  rows: number
): number[][] {
  // Create binary grid
  const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Fill the grid based on selected cells
  selectedCells.forEach(key => {
    const parts = key.split('_')
    if (parts.length >= 3 && parts[0] === zone) {
      const col = parseInt(parts[1])
      const row = parseInt(parts[2])
      
      // For web cells, invert row coordinate (web cells have row=0 at bottom)
      const gridY = zone === 'web' ? rows - 1 - row : row
      
      if (col >= 0 && col < cols && gridY >= 0 && gridY < rows) {
        grid[gridY][col] = 1
      }
    }
  })
  
  return grid
}