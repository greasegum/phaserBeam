/**
 * Utility functions to create scalar fields from binary data
 * This enables interpolation methods to produce meaningful differences
 */

/**
 * Apply Gaussian blur to a binary grid to create smooth gradients
 * @param grid Binary grid (0 or 1 values)
 * @param radius Blur radius in grid cells
 * @returns Grid with smooth gradients
 */
export function gaussianBlur(grid: number[][], radius: number = 2): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Create Gaussian kernel
  const kernelSize = Math.ceil(radius * 3) * 2 + 1 // 3 sigma coverage, make odd
  const kernel: number[][] = []
  const sigma = radius
  let sum = 0
  
  // Generate kernel
  for (let y = 0; y < kernelSize; y++) {
    kernel[y] = []
    for (let x = 0; x < kernelSize; x++) {
      const dx = x - Math.floor(kernelSize / 2)
      const dy = y - Math.floor(kernelSize / 2)
      const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
      kernel[y][x] = value
      sum += value
    }
  }
  
  // Normalize kernel
  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= sum
    }
  }
  
  // Apply convolution
  const halfKernel = Math.floor(kernelSize / 2)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let value = 0
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const gridY = y + ky - halfKernel
          const gridX = x + kx - halfKernel
          
          // Handle boundaries with clamping
          const clampedY = Math.max(0, Math.min(rows - 1, gridY))
          const clampedX = Math.max(0, Math.min(cols - 1, gridX))
          
          value += grid[clampedY][clampedX] * kernel[ky][kx]
        }
      }
      
      output[y][x] = value
    }
  }
  
  return output
}

/**
 * Create a signed distance field from binary data
 * Positive values inside, negative outside
 * @param grid Binary grid (0 or 1 values)
 * @param maxDistance Maximum distance to calculate
 * @returns Grid with distance values
 */
export function signedDistanceField(grid: number[][], maxDistance: number = 5): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Calculate distance for each cell
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isInside = grid[y][x] === 1
      let minDistance = maxDistance
      
      // Find minimum distance to opposite state
      for (let dy = -maxDistance; dy <= maxDistance; dy++) {
        for (let dx = -maxDistance; dx <= maxDistance; dx++) {
          const ny = y + dy
          const nx = x + dx
          
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            const neighborInside = grid[ny][nx] === 1
            
            // If this cell is different from current cell
            if (neighborInside !== isInside) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              minDistance = Math.min(minDistance, distance)
            }
          }
        }
      }
      
      // Set signed distance (positive inside, negative outside)
      output[y][x] = isInside ? minDistance : -minDistance
    }
  }
  
  // Normalize to 0-1 range
  const maxAbsDistance = maxDistance
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Map from [-maxDistance, maxDistance] to [0, 1]
      output[y][x] = (output[y][x] + maxAbsDistance) / (2 * maxAbsDistance)
    }
  }
  
  return output
}

/**
 * Apply a simple box blur (faster than Gaussian)
 * @param grid Binary grid
 * @param radius Blur radius
 * @returns Blurred grid
 */
export function boxBlur(grid: number[][], radius: number = 2): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  const kernelSize = radius * 2 + 1
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      let count = 0
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy
          const nx = x + dx
          
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            sum += grid[ny][nx]
            count++
          }
        }
      }
      
      output[y][x] = sum / count
    }
  }
  
  return output
}

/**
 * Create a morphological gradient (edge detection)
 * @param grid Binary grid
 * @returns Grid with edges highlighted
 */
export function morphologicalGradient(grid: number[][]): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let min = 1
      let max = 0
      
      // Check 3x3 neighborhood
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy
          const nx = x + dx
          
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            min = Math.min(min, grid[ny][nx])
            max = Math.max(max, grid[ny][nx])
          }
        }
      }
      
      output[y][x] = max - min
    }
  }
  
  return output
}

export type ScalarFieldMethod = 'gaussian' | 'distance' | 'box' | 'none'

/**
 * Convert binary grid to scalar field using specified method
 * @param grid Binary grid
 * @param method Conversion method
 * @param radius Blur/distance radius
 * @returns Scalar field grid
 */
export function binaryToScalarField(
  grid: number[][], 
  method: ScalarFieldMethod = 'gaussian',
  radius: number = 2
): number[][] {
  switch (method) {
    case 'gaussian':
      return gaussianBlur(grid, radius)
    case 'distance':
      return signedDistanceField(grid, radius)
    case 'box':
      return boxBlur(grid, radius)
    case 'none':
    default:
      return grid
  }
}