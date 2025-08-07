/**
 * Core scalar field generation and conversion algorithms
 * Moved from utils to consolidate all contour generation logic in core
 */

/**
 * Apply Gaussian blur to a 2D grid
 * @param grid Input grid
 * @param radius Blur radius
 * @returns Blurred grid
 */
export function gaussianBlur(grid: number[][], radius: number): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Create Gaussian kernel
  const kernelSize = Math.ceil(radius * 3) * 2 + 1
  const kernel: number[] = []
  const sigma = radius / 3
  let sum = 0
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - Math.floor(kernelSize / 2)
    const value = Math.exp(-(x * x) / (2 * sigma * sigma))
    kernel[i] = value
    sum += value
  }
  
  // Normalize kernel
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum
  }
  
  // Apply horizontal blur
  const temp: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      for (let k = 0; k < kernelSize; k++) {
        const sx = x + k - Math.floor(kernelSize / 2)
        if (sx >= 0 && sx < cols) {
          sum += grid[y][sx] * kernel[k]
        }
      }
      temp[y][x] = sum
    }
  }
  
  // Apply vertical blur
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      for (let k = 0; k < kernelSize; k++) {
        const sy = y + k - Math.floor(kernelSize / 2)
        if (sy >= 0 && sy < rows) {
          sum += temp[sy][x] * kernel[k]
        }
      }
      output[y][x] = sum
    }
  }
  
  return output
}

/**
 * Apply box blur to a 2D grid
 * @param grid Input grid
 * @param radius Blur radius
 * @returns Blurred grid
 */
export function boxBlur(grid: number[][], radius: number): number[][] {
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
          const nx = x + dx
          const ny = y + dy
          
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            sum += grid[ny][nx]
            count++
          }
        }
      }
      
      output[y][x] = count > 0 ? sum / count : 0
    }
  }
  
  return output
}

/**
 * Generate signed distance field from binary grid
 * @param grid Binary grid
 * @param maxDistance Maximum distance to calculate
 * @returns Distance field grid
 */
export function signedDistanceField(grid: number[][], maxDistance: number): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(maxDistance))
  
  // Initialize distances for cells inside shapes
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] > 0.5) {
        output[y][x] = 0
      }
    }
  }
  
  // Forward pass
  for (let y = 1; y < rows; y++) {
    for (let x = 1; x < cols; x++) {
      if (grid[y][x] <= 0.5) {
        output[y][x] = Math.min(
          output[y][x],
          output[y - 1][x] + 1,
          output[y][x - 1] + 1,
          output[y - 1][x - 1] + Math.SQRT2
        )
      }
    }
  }
  
  // Backward pass
  for (let y = rows - 2; y >= 0; y--) {
    for (let x = cols - 2; x >= 0; x--) {
      if (grid[y][x] <= 0.5) {
        output[y][x] = Math.min(
          output[y][x],
          output[y + 1][x] + 1,
          output[y][x + 1] + 1,
          output[y + 1][x + 1] + Math.SQRT2
        )
      }
    }
  }
  
  // Normalize to [0, 1] range
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      output[y][x] = Math.max(0, 1 - output[y][x] / maxDistance)
    }
  }
  
  return output
}

/**
 * Edge-preserving Gaussian blur
 * @param grid Input grid
 * @param radius Blur radius
 * @param preserveEdges Whether to preserve edges
 * @param edgeThreshold Threshold for edge detection
 * @returns Blurred grid with preserved edges
 */
export function edgePreservingGaussianBlur(
  grid: number[][],
  radius: number,
  preserveEdges: boolean = true,
  edgeThreshold: number = 0.5
): number[][] {
  if (!preserveEdges) {
    return gaussianBlur(grid, radius)
  }
  
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  const kernelSize = Math.ceil(radius * 3) * 2 + 1
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      let weightSum = 0
      const centerValue = grid[y][x]
      
      for (let dy = -Math.floor(kernelSize / 2); dy <= Math.floor(kernelSize / 2); dy++) {
        for (let dx = -Math.floor(kernelSize / 2); dx <= Math.floor(kernelSize / 2); dx++) {
          const nx = x + dx
          const ny = y + dy
          
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const distance = Math.sqrt(dx * dx + dy * dy)
            const spatialWeight = Math.exp(-(distance * distance) / (2 * radius * radius))
            const valueDiff = Math.abs(grid[ny][nx] - centerValue)
            const rangeWeight = Math.exp(-(valueDiff * valueDiff) / (2 * edgeThreshold * edgeThreshold))
            const weight = spatialWeight * rangeWeight
            
            sum += grid[ny][nx] * weight
            weightSum += weight
          }
        }
      }
      
      output[y][x] = weightSum > 0 ? sum / weightSum : centerValue
    }
  }
  
  return output
}

/**
 * Adaptive edge-preserving blur with dynamic threshold
 * @param grid Input grid
 * @param radius Blur radius
 * @param adaptiveness Adaptiveness factor (0-1)
 * @returns Adaptively blurred grid
 */
export function adaptiveEdgePreservingBlur(
  grid: number[][],
  radius: number,
  adaptiveness: number = 0.8
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Calculate local variance for adaptive thresholding
  const localVariance: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      let sumSquared = 0
      let count = 0
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          const ny = y + dy
          
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
            const value = grid[ny][nx]
            sum += value
            sumSquared += value * value
            count++
          }
        }
      }
      
      const mean = sum / count
      localVariance[y][x] = (sumSquared / count) - (mean * mean)
    }
  }
  
  // Apply adaptive blur
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const adaptiveThreshold = localVariance[y][x] * adaptiveness
      output[y][x] = edgePreservingGaussianBlur(
        grid.map(row => row.slice(y, y + 1)).slice(0, 1),
        radius,
        true,
        adaptiveThreshold
      )[0][0]
    }
  }
  
  return output
}

/**
 * Edge clamping blur with strength control
 * @param grid Input grid
 * @param radius Blur radius
 * @param clampStrength Clamping strength (0-1)
 * @returns Blurred grid with edge clamping
 */
export function edgeClampingBlur(
  grid: number[][],
  radius: number,
  clampStrength: number = 0.95
): number[][] {
  const blurred = gaussianBlur(grid, radius)
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Detect if we're near an edge
      let nearEdge = false
      
      if (y === 0 || y === rows - 1 || x === 0 || x === cols - 1) {
        nearEdge = true
      } else {
        // Check for significant gradient (edge detection)
        const gx = Math.abs(grid[y][x + 1] - grid[y][x - 1])
        const gy = Math.abs(grid[y + 1][x] - grid[y - 1][x])
        const gradient = Math.sqrt(gx * gx + gy * gy)
        
        if (gradient > 0.5) {
          nearEdge = true
        }
      }
      
      if (nearEdge) {
        // Blend between original and blurred based on clamp strength
        output[y][x] = grid[y][x] * clampStrength + blurred[y][x] * (1 - clampStrength)
      } else {
        output[y][x] = blurred[y][x]
      }
    }
  }
  
  return output
}

export type ScalarFieldMethod = 'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'

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
  radius: number = 2,
  edgeClampStrength: number = 0.95
): number[][] {
  switch (method) {
    case 'gaussian':
      return gaussianBlur(grid, radius)
    case 'distance':
      return signedDistanceField(grid, radius)
    case 'box':
      return boxBlur(grid, radius)
    case 'edge-preserving':
      return edgePreservingGaussianBlur(grid, radius, true, 0.5)
    case 'adaptive-edge-preserving':
      return adaptiveEdgePreservingBlur(grid, radius, 0.8)
    case 'edge-clamping':
      return edgeClampingBlur(grid, radius, edgeClampStrength)
    case 'none':
    default:
      return grid
  }
}
