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

/**
 * Edge-preserving Gaussian blur that maintains boundary integrity
 * Applies special rules at edge squares to prevent edge deactivation
 * @param grid Binary grid (0 or 1 values)
 * @param radius Blur radius in grid cells
 * @param preserveEdges Whether to preserve edge cell values
 * @param edgeThreshold Threshold for edge detection (default: 0.5)
 * @returns Grid with smooth gradients while preserving edges
 */
export function edgePreservingGaussianBlur(
  grid: number[][], 
  radius: number = 2,
  preserveEdges: boolean = true,
  edgeThreshold: number = 0.5
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // First pass: detect edge cells that should be preserved
  const edgeCells = new Set<string>()
  
  if (preserveEdges) {
    // Detect edge cells (cells at grid boundaries or near boundaries)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isEdgeCell = (
          x === 0 || x === cols - 1 || // Left/right edges
          y === 0 || y === rows - 1 || // Top/bottom edges
          (x <= 1 || x >= cols - 2) || // Near left/right edges
          (y <= 1 || y >= rows - 2)    // Near top/bottom edges
        )
        
        if (isEdgeCell && grid[y][x] >= edgeThreshold) {
          edgeCells.add(`${y},${x}`)
        }
      }
    }
  }
  
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
  
  // Apply convolution with edge preservation
  const halfKernel = Math.floor(kernelSize / 2)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cellKey = `${y},${x}`
      const isPreservedEdge = edgeCells.has(cellKey)
      
      if (isPreservedEdge) {
        // Preserve original edge cell value
        output[y][x] = grid[y][x]
      } else {
        // Apply normal blur for non-edge cells
        let value = 0
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const gridY = y + ky - halfKernel
            const gridX = x + kx - halfKernel
            
            // Handle boundaries with clamping
            const clampedY = Math.max(0, Math.min(rows - 1, gridY))
            const clampedX = Math.max(0, Math.min(cols - 1, gridX))
            
            // Use original value for preserved edge cells in kernel
            const kernelValue = edgeCells.has(`${clampedY},${clampedX}`) 
              ? grid[clampedY][clampedX] 
              : grid[clampedY][clampedX]
            
            value += kernelValue * kernel[ky][kx]
          }
        }
        
        output[y][x] = value
      }
    }
  }
  
  return output
}

/**
 * Advanced edge-preserving blur with adaptive kernel
 * Uses different blur strategies for edge vs interior cells
 * @param grid Binary grid (0 or 1 values)
 * @param radius Blur radius in grid cells
 * @param edgePreservationStrength How strongly to preserve edges (0-1)
 * @returns Grid with smooth gradients and preserved edges
 */
export function adaptiveEdgePreservingBlur(
  grid: number[][],
  radius: number = 2,
  edgePreservationStrength: number = 0.8
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Detect edge regions with distance-based classification
  const edgeDistances: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Calculate distance to nearest edge
      const distToLeft = x
      const distToRight = cols - 1 - x
      const distToTop = y
      const distToBottom = rows - 1 - y
      
      const minEdgeDistance = Math.min(distToLeft, distToRight, distToTop, distToBottom)
      edgeDistances[y][x] = minEdgeDistance
    }
  }
  
  // Create adaptive kernel based on edge distance
  const kernelSize = Math.ceil(radius * 3) * 2 + 1
  const halfKernel = Math.floor(kernelSize / 2)
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const edgeDistance = edgeDistances[y][x]
      const isNearEdge = edgeDistance <= 2
      
      if (isNearEdge && grid[y][x] >= 0.5) {
        // Near edge with active cell - preserve with reduced blur
        const reducedRadius = Math.max(0.5, radius * (1 - edgePreservationStrength))
        const adaptiveKernel = createAdaptiveKernel(reducedRadius, edgeDistance)
        
        let value = 0
        let kernelSum = 0
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const gridY = y + ky - halfKernel
            const gridX = x + kx - halfKernel
            
            if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
              const kernelValue = adaptiveKernel[ky][kx]
              value += grid[gridY][gridX] * kernelValue
              kernelSum += kernelValue
            }
          }
        }
        
        // Blend between original and blurred value based on edge preservation strength
        const blurredValue = kernelSum > 0 ? value / kernelSum : grid[y][x]
        output[y][x] = grid[y][x] * edgePreservationStrength + blurredValue * (1 - edgePreservationStrength)
      } else {
        // Interior cell or inactive edge cell - apply normal blur
        let value = 0
        const sigma = radius
        
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const gridY = y + ky - halfKernel
            const gridX = x + kx - halfKernel
            
            if (gridY >= 0 && gridY < rows && gridX >= 0 && gridX < cols) {
              const dx = kx - halfKernel
              const dy = ky - halfKernel
              const kernelValue = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
              value += grid[gridY][gridX] * kernelValue
            }
          }
        }
        
        // Normalize
        const totalWeight = (2 * halfKernel + 1) * (2 * halfKernel + 1) * Math.exp(0)
        output[y][x] = value / totalWeight
      }
    }
  }
  
  return output
}

/**
 * Create adaptive kernel that reduces blur strength near edges
 */
function createAdaptiveKernel(radius: number, edgeDistance: number): number[][] {
  const kernelSize = Math.ceil(radius * 3) * 2 + 1
  const kernel: number[][] = []
  const sigma = radius * (1 + edgeDistance * 0.1) // Increase sigma near edges
  let sum = 0
  
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
  
  // Normalize
  for (let y = 0; y < kernelSize; y++) {
    for (let x = 0; x < kernelSize; x++) {
      kernel[y][x] /= sum
    }
  }
  
  return kernel
}

/**
 * Edge-clamping blur that enforces hard boundaries at grid edges
 * This ensures contours always clamp to the exact grid boundaries
 * @param grid Binary grid (0 or 1 values)
 * @param radius Blur radius in grid cells
 * @param edgeClampStrength How strongly to enforce edge clamping (0-1)
 * @returns Grid with smooth gradients and hard-clamped edges
 */
export function edgeClampingBlur(
  grid: number[][],
  radius: number = 2,
  edgeClampStrength: number = 0.95
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // First pass: standard Gaussian blur
  const gaussianBlurred = gaussianBlur(grid, radius)
  
  // Second pass: apply edge clamping
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Calculate distance to nearest edge
      const distToLeft = x
      const distToRight = cols - 1 - x
      const distToTop = y
      const distToBottom = rows - 1 - y
      const minEdgeDistance = Math.min(distToLeft, distToRight, distToTop, distToBottom)
      
      // Determine if this is an edge cell
      const isEdgeCell = minEdgeDistance === 0
      const isNearEdge = minEdgeDistance <= 1
      
      if (isEdgeCell) {
        // Hard clamp edge cells to binary values
        if (grid[y][x] >= 0.5) {
          // Active edge cell - ensure it stays above threshold
          output[y][x] = Math.max(0.5 + edgeClampStrength * 0.5, gaussianBlurred[y][x])
        } else {
          // Inactive edge cell - ensure it stays below threshold
          output[y][x] = Math.min(0.5 - edgeClampStrength * 0.5, gaussianBlurred[y][x])
        }
      } else if (isNearEdge) {
        // Near-edge cells: blend between clamped and blurred values
        const edgeFactor = 1 - (minEdgeDistance / 2)
        const clampedValue = grid[y][x] >= 0.5 ? 1 : 0
        output[y][x] = gaussianBlurred[y][x] * (1 - edgeFactor * edgeClampStrength) + 
                       clampedValue * edgeFactor * edgeClampStrength
      } else {
        // Interior cells: use normal blurred value
        output[y][x] = gaussianBlurred[y][x]
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
  radius: number = 2
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
      return edgeClampingBlur(grid, radius, 0.95)
    case 'none':
    default:
      return grid
  }
}