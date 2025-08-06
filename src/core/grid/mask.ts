/**
 * Grid mask utilities for converting between cell selections and grid representations
 */

export interface GridDimensions {
  cols: number
  rows: number
}

export interface CellKey {
  zone: string
  col: number
  row: number
}

/**
 * Parse a cell key string into its components
 * Format: "zone_col_row" (e.g., "web_5_2")
 */
export function parseCellKey(key: string): CellKey {
  const parts = key.split('_')
  if (parts.length !== 3) {
    throw new Error(`Invalid cell key format: ${key}. Expected "zone_col_row"`)
  }
  
  return {
    zone: parts[0],
    col: parseInt(parts[1], 10),
    row: parseInt(parts[2], 10)
  }
}

/**
 * Create a cell key string from components
 */
export function createCellKey(zone: string, col: number, row: number): string {
  return `${zone}_${col}_${row}`
}

/**
 * Convert a set of selected cell IDs into a boolean grid mask
 * Returns a 2D array where true indicates a selected cell
 */
export function cellSetToGridMask(
  selectedCells: Set<string>, 
  dimensions: GridDimensions
): boolean[][] {
  const { cols, rows } = dimensions
  
  // Initialize empty grid
  const mask: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false))
  
  // Mark selected cells
  for (const cellKey of selectedCells) {
    try {
      const { col, row } = parseCellKey(cellKey)
      
      // Validate bounds
      if (col >= 0 && col < cols && row >= 0 && row < rows) {
        mask[row][col] = true
      } else {
        console.warn(`Cell key ${cellKey} is out of bounds for ${cols}x${rows} grid`)
      }
    } catch (error) {
      console.warn(`Failed to parse cell key: ${cellKey}`, error)
    }
  }
  
  return mask
}

/**
 * Convert a boolean grid mask back to a set of cell keys
 * Useful for testing or state management
 */
export function gridMaskToCellSet(
  mask: boolean[][], 
  zone: string = 'default'
): Set<string> {
  const cellSet = new Set<string>()
  
  for (let row = 0; row < mask.length; row++) {
    for (let col = 0; col < mask[row].length; col++) {
      if (mask[row][col]) {
        cellSet.add(createCellKey(zone, col, row))
      }
    }
  }
  
  return cellSet
}

/**
 * Get grid dimensions from a cell selection
 * Useful for auto-sizing grids based on selection bounds
 */
export function getGridDimensionsFromCells(selectedCells: Set<string>): GridDimensions {
  let maxCol = 0
  let maxRow = 0
  
  for (const cellKey of selectedCells) {
    try {
      const { col, row } = parseCellKey(cellKey)
      maxCol = Math.max(maxCol, col)
      maxRow = Math.max(maxRow, row)
    } catch (error) {
      console.warn(`Failed to parse cell key: ${cellKey}`, error)
    }
  }
  
  return {
    cols: maxCol + 1,
    rows: maxRow + 1
  }
}
