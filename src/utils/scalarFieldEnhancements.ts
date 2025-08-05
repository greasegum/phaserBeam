/**
 * Enhanced scalar field generation with additional parameters
 */

/**
 * Anisotropic diffusion for edge-preserving smoothing
 * @param grid Input grid
 * @param iterations Number of diffusion iterations
 * @param kappa Gradient modulus threshold that controls conduction
 * @param lambda Controls speed of diffusion (0-0.25)
 * @returns Smoothed grid with preserved edges
 */
export function anisotropicDiffusion(
  grid: number[][],
  iterations: number = 5,
  kappa: number = 0.1,
  lambda: number = 0.15
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  let output = grid.map(row => [...row])
  
  for (let iter = 0; iter < iterations; iter++) {
    const newOutput: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const center = output[y][x]
        
        // Calculate gradients in 4 directions
        const north = y > 0 ? output[y - 1][x] - center : 0
        const south = y < rows - 1 ? output[y + 1][x] - center : 0
        const east = x < cols - 1 ? output[y][x + 1] - center : 0
        const west = x > 0 ? output[y][x - 1] - center : 0
        
        // Calculate conduction coefficients
        const cN = Math.exp(-(north * north) / (kappa * kappa))
        const cS = Math.exp(-(south * south) / (kappa * kappa))
        const cE = Math.exp(-(east * east) / (kappa * kappa))
        const cW = Math.exp(-(west * west) / (kappa * kappa))
        
        // Update value
        newOutput[y][x] = center + lambda * (
          cN * north + cS * south + cE * east + cW * west
        )
      }
    }
    
    output = newOutput
  }
  
  return output
}

/**
 * Bilateral filtering for edge-preserving smoothing
 * @param grid Input grid
 * @param spatialRadius Spatial kernel radius
 * @param intensityRadius Intensity difference threshold
 * @returns Filtered grid
 */
export function bilateralFilter(
  grid: number[][],
  spatialRadius: number = 2,
  intensityRadius: number = 0.3
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  const kernelSize = Math.ceil(spatialRadius * 2) + 1
  const halfKernel = Math.floor(kernelSize / 2)
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let weightSum = 0
      let valueSum = 0
      const centerValue = grid[y][x]
      
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const ny = y + ky
          const nx = x + kx
          
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            const spatialDist = Math.sqrt(kx * kx + ky * ky)
            const intensityDist = Math.abs(grid[ny][nx] - centerValue)
            
            // Gaussian weights for both spatial and intensity
            const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialRadius * spatialRadius))
            const intensityWeight = Math.exp(-(intensityDist * intensityDist) / (2 * intensityRadius * intensityRadius))
            
            const weight = spatialWeight * intensityWeight
            weightSum += weight
            valueSum += weight * grid[ny][nx]
          }
        }
      }
      
      output[y][x] = weightSum > 0 ? valueSum / weightSum : centerValue
    }
  }
  
  return output
}

/**
 * Guided filter using a guidance image
 * @param grid Input grid
 * @param guide Guide grid (can be the same as input)
 * @param radius Filter radius
 * @param epsilon Regularization parameter
 * @returns Filtered grid
 */
export function guidedFilter(
  grid: number[][],
  guide: number[][],
  radius: number = 2,
  epsilon: number = 0.01
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  // Box filter helper
  const boxFilter = (data: number[][]): number[][] => {
    const result: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    const size = radius * 2 + 1
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let sum = 0
        let count = 0
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
              sum += data[ny][nx]
              count++
            }
          }
        }
        
        result[y][x] = sum / count
      }
    }
    
    return result
  }
  
  // Compute mean and covariance
  const meanI = boxFilter(guide)
  const meanP = boxFilter(grid)
  
  // Compute correlation and variance
  const corrIP: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  const varI: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      corrIP[y][x] = guide[y][x] * grid[y][x]
      varI[y][x] = guide[y][x] * guide[y][x]
    }
  }
  
  const meanCorrIP = boxFilter(corrIP)
  const meanVarI = boxFilter(varI)
  
  // Compute coefficients
  const a: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  const b: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cov = meanCorrIP[y][x] - meanI[y][x] * meanP[y][x]
      const var = meanVarI[y][x] - meanI[y][x] * meanI[y][x]
      
      a[y][x] = cov / (var + epsilon)
      b[y][x] = meanP[y][x] - a[y][x] * meanI[y][x]
    }
  }
  
  // Compute output
  const meanA = boxFilter(a)
  const meanB = boxFilter(b)
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      output[y][x] = meanA[y][x] * guide[y][x] + meanB[y][x]
    }
  }
  
  return output
}

/**
 * Morphological operations for shape processing
 */
export const MorphologicalOps = {
  /**
   * Dilation operation
   */
  dilate: (grid: number[][], radius: number = 1): number[][] => {
    const rows = grid.length
    const cols = grid[0].length
    const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let maxVal = grid[y][x]
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
              maxVal = Math.max(maxVal, grid[ny][nx])
            }
          }
        }
        
        output[y][x] = maxVal
      }
    }
    
    return output
  },
  
  /**
   * Erosion operation
   */
  erode: (grid: number[][], radius: number = 1): number[][] => {
    const rows = grid.length
    const cols = grid[0].length
    const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let minVal = grid[y][x]
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
              minVal = Math.min(minVal, grid[ny][nx])
            }
          }
        }
        
        output[y][x] = minVal
      }
    }
    
    return output
  },
  
  /**
   * Opening operation (erosion followed by dilation)
   */
  open: (grid: number[][], radius: number = 1): number[][] => {
    return MorphologicalOps.dilate(MorphologicalOps.erode(grid, radius), radius)
  },
  
  /**
   * Closing operation (dilation followed by erosion)
   */
  close: (grid: number[][], radius: number = 1): number[][] => {
    return MorphologicalOps.erode(MorphologicalOps.dilate(grid, radius), radius)
  }
}

/**
 * Multi-scale processing for different detail levels
 */
export function multiScaleSmoothing(
  grid: number[][],
  scales: number[] = [1, 2, 4],
  blendWeights: number[] = [0.5, 0.3, 0.2]
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  let totalWeight = 0
  
  for (let i = 0; i < scales.length && i < blendWeights.length; i++) {
    const scale = scales[i]
    const weight = blendWeights[i]
    
    // Apply Gaussian blur at this scale
    const blurred = gaussianBlur(grid, scale)
    
    // Accumulate weighted result
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        output[y][x] += blurred[y][x] * weight
      }
    }
    
    totalWeight += weight
  }
  
  // Normalize
  if (totalWeight > 0) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        output[y][x] /= totalWeight
      }
    }
  }
  
  return output
}

// Import gaussianBlur from the main file
function gaussianBlur(grid: number[][], radius: number): number[][] {
  // This would be imported from the main scalarField.ts file
  // For now, using a simple implementation
  const rows = grid.length
  const cols = grid[0].length
  const output: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  const kernelSize = Math.ceil(radius * 3) * 2 + 1
  const sigma = radius
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      let weightSum = 0
      
      for (let ky = -(kernelSize - 1) / 2; ky <= (kernelSize - 1) / 2; ky++) {
        for (let kx = -(kernelSize - 1) / 2; kx <= (kernelSize - 1) / 2; kx++) {
          const ny = y + ky
          const nx = x + kx
          
          if (ny >= 0 && ny < rows && nx >= 0 && nx < cols) {
            const weight = Math.exp(-(kx * kx + ky * ky) / (2 * sigma * sigma))
            sum += grid[ny][nx] * weight
            weightSum += weight
          }
        }
      }
      
      output[y][x] = weightSum > 0 ? sum / weightSum : 0
    }
  }
  
  return output
}