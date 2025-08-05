/**
 * Enhanced scalar field generation with additional parameters
 * Moved from utils to consolidate all contour generation logic in core
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
 * Coherence-enhancing diffusion for structure preservation
 * @param grid Input grid
 * @param iterations Number of diffusion iterations
 * @param alpha Controls structure tensor integration
 * @param c1 Diffusion along structure
 * @param c2 Diffusion across structure
 * @returns Enhanced grid with preserved structures
 */
export function coherenceEnhancingDiffusion(
  grid: number[][],
  iterations: number = 3,
  alpha: number = 0.5,
  c1: number = 0.1,
  c2: number = 0.01
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  let output = grid.map(row => [...row])
  
  for (let iter = 0; iter < iterations; iter++) {
    const newOutput: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        // Calculate gradient
        const gx = (output[y][x + 1] - output[y][x - 1]) / 2
        const gy = (output[y + 1][x] - output[y - 1][x]) / 2
        
        // Calculate structure tensor
        const J11 = gx * gx
        const J12 = gx * gy
        const J22 = gy * gy
        
        // Gaussian convolution of structure tensor (simplified)
        const sigma = alpha
        const weight = Math.exp(-(sigma * sigma))
        const sJ11 = J11 * weight
        const sJ12 = J12 * weight
        const sJ22 = J22 * weight
        
        // Eigenvalue analysis (simplified)
        const trace = sJ11 + sJ22
        const det = sJ11 * sJ22 - sJ12 * sJ12
        const lambda1 = (trace + Math.sqrt(trace * trace - 4 * det)) / 2
        const lambda2 = (trace - Math.sqrt(trace * trace - 4 * det)) / 2
        
        // Diffusion coefficients
        const d1 = c1
        const d2 = c1 + (c2 - c1) * Math.exp(-1 / (lambda1 - lambda2 + 1e-10))
        
        // Apply diffusion
        const laplacian = (
          output[y - 1][x] + output[y + 1][x] +
          output[y][x - 1] + output[y][x + 1] - 4 * output[y][x]
        )
        
        newOutput[y][x] = output[y][x] + 0.25 * (d1 + d2) * laplacian
      }
    }
    
    // Copy boundaries
    for (let x = 0; x < cols; x++) {
      newOutput[0][x] = output[0][x]
      newOutput[rows - 1][x] = output[rows - 1][x]
    }
    for (let y = 0; y < rows; y++) {
      newOutput[y][0] = output[y][0]
      newOutput[y][cols - 1] = output[y][cols - 1]
    }
    
    output = newOutput
  }
  
  return output
}

/**
 * Multi-scale enhancement using Laplacian pyramid
 * @param grid Input grid
 * @param levels Number of pyramid levels
 * @param enhancement Enhancement factor per level
 * @returns Enhanced grid
 */
export function multiScaleEnhancement(
  grid: number[][],
  levels: number = 3,
  enhancement: number[] = [1.0, 1.2, 0.8]
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  
  // Build Gaussian pyramid
  const gaussianPyramid: number[][][] = [grid]
  
  for (let level = 1; level < levels; level++) {
    const prevLevel = gaussianPyramid[level - 1]
    const nextRows = Math.floor(prevLevel.length / 2)
    const nextCols = Math.floor(prevLevel[0].length / 2)
    const nextLevel: number[][] = Array(nextRows).fill(null).map(() => Array(nextCols).fill(0))
    
    // Downsample with Gaussian blur
    for (let y = 0; y < nextRows; y++) {
      for (let x = 0; x < nextCols; x++) {
        let sum = 0
        let count = 0
        
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const sy = y * 2 + dy
            const sx = x * 2 + dx
            
            if (sy < prevLevel.length && sx < prevLevel[0].length) {
              sum += prevLevel[sy][sx]
              count++
            }
          }
        }
        
        nextLevel[y][x] = count > 0 ? sum / count : 0
      }
    }
    
    gaussianPyramid.push(nextLevel)
  }
  
  // Build Laplacian pyramid
  const laplacianPyramid: number[][][] = []
  
  for (let level = 0; level < levels - 1; level++) {
    const currentLevel = gaussianPyramid[level]
    const nextLevel = gaussianPyramid[level + 1]
    
    // Upsample next level
    const upsampled: number[][] = Array(currentLevel.length).fill(null).map(() => Array(currentLevel[0].length).fill(0))
    
    for (let y = 0; y < currentLevel.length; y++) {
      for (let x = 0; x < currentLevel[0].length; x++) {
        const sourceY = Math.floor(y / 2)
        const sourceX = Math.floor(x / 2)
        
        if (sourceY < nextLevel.length && sourceX < nextLevel[0].length) {
          upsampled[y][x] = nextLevel[sourceY][sourceX]
        }
      }
    }
    
    // Calculate Laplacian
    const laplacian: number[][] = Array(currentLevel.length).fill(null).map(() => Array(currentLevel[0].length).fill(0))
    
    for (let y = 0; y < currentLevel.length; y++) {
      for (let x = 0; x < currentLevel[0].length; x++) {
        laplacian[y][x] = currentLevel[y][x] - upsampled[y][x]
      }
    }
    
    laplacianPyramid.push(laplacian)
  }
  
  // Enhance Laplacian levels
  const enhancedPyramid: number[][][] = []
  
  for (let level = 0; level < laplacianPyramid.length; level++) {
    const enhancementFactor = enhancement[level] || 1.0
    const enhanced: number[][] = laplacianPyramid[level].map(row =>
      row.map(value => value * enhancementFactor)
    )
    enhancedPyramid.push(enhanced)
  }
  
  // Reconstruct from enhanced pyramid
  let result = gaussianPyramid[gaussianPyramid.length - 1]
  
  for (let level = enhancedPyramid.length - 1; level >= 0; level--) {
    const targetRows = enhancedPyramid[level].length
    const targetCols = enhancedPyramid[level][0].length
    
    // Upsample result
    const upsampled: number[][] = Array(targetRows).fill(null).map(() => Array(targetCols).fill(0))
    
    for (let y = 0; y < targetRows; y++) {
      for (let x = 0; x < targetCols; x++) {
        const sourceY = Math.floor(y / 2)
        const sourceX = Math.floor(x / 2)
        
        if (sourceY < result.length && sourceX < result[0].length) {
          upsampled[y][x] = result[sourceY][sourceX]
        }
      }
    }
    
    // Add Laplacian
    result = Array(targetRows).fill(null).map(() => Array(targetCols).fill(0))
    
    for (let y = 0; y < targetRows; y++) {
      for (let x = 0; x < targetCols; x++) {
        result[y][x] = upsampled[y][x] + enhancedPyramid[level][y][x]
      }
    }
  }
  
  return result
}

/**
 * Shock filter for feature enhancement
 * @param grid Input grid
 * @param iterations Number of iterations
 * @param dt Time step
 * @returns Enhanced grid with sharpened features
 */
export function shockFilter(
  grid: number[][],
  iterations: number = 5,
  dt: number = 0.1
): number[][] {
  const rows = grid.length
  const cols = grid[0].length
  let output = grid.map(row => [...row])
  
  for (let iter = 0; iter < iterations; iter++) {
    const newOutput: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        // Calculate gradients
        const gx = (output[y][x + 1] - output[y][x - 1]) / 2
        const gy = (output[y + 1][x] - output[y - 1][x]) / 2
        const gradMag = Math.sqrt(gx * gx + gy * gy)
        
        // Calculate Laplacian
        const laplacian = (
          output[y - 1][x] + output[y + 1][x] +
          output[y][x - 1] + output[y][x + 1] - 4 * output[y][x]
        )
        
        // Apply shock filter
        if (gradMag > 1e-6) {
          const shock = -Math.sign(laplacian) * gradMag
          newOutput[y][x] = output[y][x] + dt * shock
        } else {
          newOutput[y][x] = output[y][x]
        }
      }
    }
    
    // Copy boundaries
    for (let x = 0; x < cols; x++) {
      newOutput[0][x] = output[0][x]
      newOutput[rows - 1][x] = output[rows - 1][x]
    }
    for (let y = 0; y < rows; y++) {
      newOutput[y][0] = output[y][0]
      newOutput[y][cols - 1] = output[y][cols - 1]
    }
    
    output = newOutput
  }
  
  return output
}

/**
 * Enhanced scalar field generation with comprehensive parameters
 * @param grid Input binary grid
 * @param method Enhancement method
 * @param params Enhancement parameters
 * @returns Enhanced scalar field
 */
export function enhanceScalarField(
  grid: number[][],
  method: 'anisotropic' | 'coherence' | 'multiscale' | 'shock' = 'anisotropic',
  params: {
    iterations?: number
    kappa?: number
    lambda?: number
    alpha?: number
    c1?: number
    c2?: number
    levels?: number
    enhancement?: number[]
    dt?: number
  } = {}
): number[][] {
  switch (method) {
    case 'anisotropic':
      return anisotropicDiffusion(
        grid,
        params.iterations ?? 5,
        params.kappa ?? 0.1,
        params.lambda ?? 0.15
      )
    case 'coherence':
      return coherenceEnhancingDiffusion(
        grid,
        params.iterations ?? 3,
        params.alpha ?? 0.5,
        params.c1 ?? 0.1,
        params.c2 ?? 0.01
      )
    case 'multiscale':
      return multiScaleEnhancement(
        grid,
        params.levels ?? 3,
        params.enhancement ?? [1.0, 1.2, 0.8]
      )
    case 'shock':
      return shockFilter(
        grid,
        params.iterations ?? 5,
        params.dt ?? 0.1
      )
    default:
      return grid
  }
}
