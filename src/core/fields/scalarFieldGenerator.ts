/**
 * Scalar field generation and processing utilities
 */

export interface FieldGenConfig {
  /** Value for selected (true) cells */
  selectedValue: number
  /** Value for unselected (false) cells */
  unselectedValue: number
  /** Whether to apply edge padding */
  padEdges: boolean
  /** Smoothing configuration */
  smoothing?: SmoothingConfig
}

export interface SmoothingConfig {
  method: 'laplacian' | 'gaussian' | 'bilateral'
  /** Smoothing radius/strength */
  radius: number
  /** Number of smoothing iterations */
  iterations: number
}

/**
 * Generate a scalar field from a boolean mask
 */
export function generateScalarField(
  mask: boolean[][], 
  config: FieldGenConfig
): number[][] {
  const rows = mask.length
  const cols = mask[0]?.length || 0
  
  if (rows === 0 || cols === 0) {
    return []
  }
  
  // Create initial field from mask
  const field: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      field[row][col] = mask[row][col] ? config.selectedValue : config.unselectedValue
    }
  }
  
  // Apply edge padding if requested
  let processedField = config.padEdges ? applyEdgePadding(field) : field
  
  // Apply smoothing if configured
  if (config.smoothing) {
    processedField = applySmoothing(processedField, config.smoothing)
  }
  
  return processedField
}

/**
 * Apply edge padding to extend the field boundaries
 */
export function applyEdgePadding(field: number[][]): number[][] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  if (rows === 0 || cols === 0) return field
  
  // Create padded field (add 1 cell border on all sides)
  const paddedRows = rows + 2
  const paddedCols = cols + 2
  const paddedField: number[][] = Array(paddedRows).fill(null).map(() => Array(paddedCols).fill(0))
  
  // Copy original field to center
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      paddedField[row + 1][col + 1] = field[row][col]
    }
  }
  
  // Extend edges (repeat edge values)
  // Top and bottom edges
  for (let col = 1; col <= cols; col++) {
    paddedField[0][col] = paddedField[1][col] // Top edge
    paddedField[paddedRows - 1][col] = paddedField[paddedRows - 2][col] // Bottom edge
  }
  
  // Left and right edges
  for (let row = 0; row < paddedRows; row++) {
    paddedField[row][0] = paddedField[row][1] // Left edge
    paddedField[row][paddedCols - 1] = paddedField[row][paddedCols - 2] // Right edge
  }
  
  return paddedField
}

/**
 * Apply smoothing to a scalar field
 */
export function applySmoothing(
  field: number[][], 
  config: SmoothingConfig
): number[][] {
  let smoothedField = field
  
  for (let i = 0; i < config.iterations; i++) {
    switch (config.method) {
      case 'laplacian':
        smoothedField = applyLaplacianSmoothing(smoothedField)
        break
      case 'gaussian':
        smoothedField = applyGaussianSmoothing(smoothedField, config.radius)
        break
      case 'bilateral':
        smoothedField = applyBilateralSmoothing(smoothedField, config.radius)
        break
      default:
        console.warn(`Unknown smoothing method: ${config.method}`)
    }
  }
  
  return smoothedField
}

/**
 * Apply Laplacian smoothing (simple 4-neighbor average)
 */
export function applyLaplacianSmoothing(field: number[][]): number[][] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  if (rows === 0 || cols === 0) return field
  
  const smoothed: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let sum = field[row][col]
      let count = 1
      
      // Add neighbors if they exist
      if (row > 0) { sum += field[row - 1][col]; count++ }
      if (row < rows - 1) { sum += field[row + 1][col]; count++ }
      if (col > 0) { sum += field[row][col - 1]; count++ }
      if (col < cols - 1) { sum += field[row][col + 1]; count++ }
      
      smoothed[row][col] = sum / count
    }
  }
  
  return smoothed
}

/**
 * Apply Gaussian smoothing with specified radius
 */
export function applyGaussianSmoothing(field: number[][], radius: number): number[][] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  if (rows === 0 || cols === 0) return field
  
  const smoothed: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  const kernelSize = Math.ceil(radius * 2) + 1
  const sigma = radius / 3 // Standard deviation
  
  // Generate Gaussian kernel
  const kernel: number[][] = []
  let kernelSum = 0
  
  for (let i = -Math.floor(kernelSize / 2); i <= Math.floor(kernelSize / 2); i++) {
    const row: number[] = []
    for (let j = -Math.floor(kernelSize / 2); j <= Math.floor(kernelSize / 2); j++) {
      const value = Math.exp(-(i * i + j * j) / (2 * sigma * sigma))
      row.push(value)
      kernelSum += value
    }
    kernel.push(row)
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    for (let j = 0; j < kernel[i].length; j++) {
      kernel[i][j] /= kernelSum
    }
  }
  
  // Apply convolution
  const offset = Math.floor(kernelSize / 2)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let sum = 0
      
      for (let ki = 0; ki < kernelSize; ki++) {
        for (let kj = 0; kj < kernelSize; kj++) {
          const fieldRow = row + ki - offset
          const fieldCol = col + kj - offset
          
          if (fieldRow >= 0 && fieldRow < rows && fieldCol >= 0 && fieldCol < cols) {
            sum += field[fieldRow][fieldCol] * kernel[ki][kj]
          }
        }
      }
      
      smoothed[row][col] = sum
    }
  }
  
  return smoothed
}

/**
 * Apply bilateral smoothing (edge-preserving)
 */
export function applyBilateralSmoothing(field: number[][], radius: number): number[][] {
  // For now, fallback to Gaussian smoothing
  // Bilateral filtering is more complex and can be implemented later if needed
  return applyGaussianSmoothing(field, radius)
}

/**
 * Apply threshold to create binary field
 */
export function applyThreshold(field: number[][], threshold: number): boolean[][] {
  return field.map(row => row.map(value => value >= threshold))
}

/**
 * Normalize field values to 0-1 range
 */
export function normalizeField(field: number[][]): number[][] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  if (rows === 0 || cols === 0) return field
  
  // Find min and max values
  let min = Infinity
  let max = -Infinity
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      min = Math.min(min, field[row][col])
      max = Math.max(max, field[row][col])
    }
  }
  
  // Avoid division by zero
  if (max === min) return field
  
  const range = max - min
  return field.map(row => row.map(value => (value - min) / range))
}
