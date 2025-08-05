/**
 * Interpolation Algorithm for Scalar Field Processing
 * Handles various interpolation methods to enhance contour quality
 */

import { InterpolationConfig } from '../../configuration/InterpolationConfig'
import { Point } from '../../types/geometry'

export class InterpolationAlgorithm {
  private config: InterpolationConfig
  
  constructor(config: InterpolationConfig) {
    this.config = config
  }
  
  /**
   * Process a grid with the configured interpolation method
   * 
   * @param grid The original grid to process
   * @returns Processed grid with interpolation applied
   */
  processGrid(grid: number[][]): number[][] {
    if (!this.config.enabled) {
      return grid // Return original grid if interpolation is disabled
    }
    
    // Apply scalar field methods first
    const enhancedGrid = this.applyScalarFieldMethod(grid)
    
    // Apply global transformations
    return this.applyGlobalTransformations(enhancedGrid)
  }
  
  /**
   * Apply scalar field enhancement method
   */
  private applyScalarFieldMethod(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    
    // Create a new grid to avoid modifying the original
    let enhancedGrid = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    switch (this.config.scalarField.method) {
      case 'gaussian':
        enhancedGrid = this.applyGaussianFilter(grid)
        break
        
      case 'distance':
        enhancedGrid = this.applyDistanceField(grid)
        break
        
      case 'edge-preserving':
        enhancedGrid = this.applyEdgePreservingFilter(grid)
        break
        
      case 'adaptive-edge-preserving':
        enhancedGrid = this.applyAdaptiveEdgePreservingFilter(grid)
        break
        
      case 'edge-clamping':
        enhancedGrid = this.applyEdgeClampingFilter(grid)
        break
        
      case 'box':
        enhancedGrid = this.applyBoxFilter(grid)
        break
        
      case 'none':
      default:
        // Deep copy the original grid
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            enhancedGrid[r][c] = grid[r][c]
          }
        }
        break
    }
    
    return enhancedGrid
  }
  
  /**
   * Apply a Gaussian filter to the grid
   */
  private applyGaussianFilter(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    const radius = this.config.scalarField.radius
    const sigma = radius / 2 // Standard deviation
    
    // Create kernel
    const kernelSize = Math.max(3, Math.ceil(radius * 2) | 1) // Ensure odd size
    const kernel: number[][] = []
    const center = Math.floor(kernelSize / 2)
    
    // Calculate 2D Gaussian kernel
    let sum = 0
    for (let y = 0; y < kernelSize; y++) {
      kernel[y] = []
      for (let x = 0; x < kernelSize; x++) {
        const dx = x - center
        const dy = y - center
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
        kernel[y][x] = g
        sum += g
      }
    }
    
    // Normalize kernel
    for (let y = 0; y < kernelSize; y++) {
      for (let x = 0; x < kernelSize; x++) {
        kernel[y][x] /= sum
      }
    }
    
    // Apply convolution
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let val = 0
        let weightSum = 0
        
        for (let ky = 0; ky < kernelSize; ky++) {
          const y = r - center + ky
          if (y < 0 || y >= rows) continue
          
          for (let kx = 0; kx < kernelSize; kx++) {
            const x = c - center + kx
            if (x < 0 || x >= cols) continue
            
            val += grid[y][x] * kernel[ky][kx]
            weightSum += kernel[ky][kx]
          }
        }
        
        result[r][c] = weightSum > 0 ? val / weightSum : grid[r][c]
      }
    }
    
    return result
  }
  
  /**
   * Apply a box filter (simple mean) to the grid
   */
  private applyBoxFilter(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    const radius = Math.max(1, Math.round(this.config.scalarField.radius))
    
    // Apply convolution
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0
        let count = 0
        
        for (let y = Math.max(0, r - radius); y <= Math.min(rows - 1, r + radius); y++) {
          for (let x = Math.max(0, c - radius); x <= Math.min(cols - 1, c + radius); x++) {
            sum += grid[y][x]
            count++
          }
        }
        
        result[r][c] = count > 0 ? sum / count : grid[r][c]
      }
    }
    
    return result
  }
  
  /**
   * Apply a distance-based scalar field
   */
  private applyDistanceField(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    const threshold = 0.5 // Default threshold for binary field
    const radius = this.config.scalarField.radius
    
    // Create binary field
    const binaryField: boolean[][] = Array(rows).fill(false).map((_, r) => 
      Array(cols).fill(false).map((_, c) => grid[r][c] >= threshold)
    )
    
    // Compute distance field
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Skip if already on the correct side of the threshold
        if ((binaryField[r][c] && grid[r][c] >= threshold) || 
            (!binaryField[r][c] && grid[r][c] < threshold)) {
          result[r][c] = grid[r][c]
          continue
        }
        
        // Find minimum distance to a cell with opposite binary value
        let minDistance = Infinity
        
        for (let y = Math.max(0, r - radius); y < Math.min(rows, r + radius); y++) {
          for (let x = Math.max(0, c - radius); x < Math.min(cols, c + radius); x++) {
            if (binaryField[y][x] !== binaryField[r][c]) {
              const distance = Math.sqrt((x - c) * (x - c) + (y - r) * (y - r))
              if (distance < minDistance) {
                minDistance = distance
              }
            }
          }
        }
        
        // Normalize distance to influence value
        const normalizedDistance = Math.min(minDistance / radius, 1)
        
        // Adjust value based on distance
        if (binaryField[r][c]) {
          // Inside, but value < threshold
          result[r][c] = threshold + (1 - threshold) * (1 - normalizedDistance)
        } else {
          // Outside, but value >= threshold
          result[r][c] = threshold * normalizedDistance
        }
      }
    }
    
    return result
  }
  
  /**
   * Apply edge-preserving filter (bilateral filter)
   */
  private applyEdgePreservingFilter(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    const radius = this.config.scalarField.radius
    const sigmaSpace = radius / 2
    const sigmaValue = 0.2 // Intensity difference sensitivity
    
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0
        let weightSum = 0
        const centerValue = grid[r][c]
        
        for (let y = Math.max(0, r - radius); y <= Math.min(rows - 1, r + radius); y++) {
          for (let x = Math.max(0, c - radius); x <= Math.min(cols - 1, c + radius); x++) {
            const spatialDist = ((x - c) * (x - c) + (y - r) * (y - r)) / (2 * sigmaSpace * sigmaSpace)
            const valueDist = Math.pow(grid[y][x] - centerValue, 2) / (2 * sigmaValue * sigmaValue)
            
            const weight = Math.exp(-(spatialDist + valueDist))
            
            sum += grid[y][x] * weight
            weightSum += weight
          }
        }
        
        result[r][c] = weightSum > 0 ? sum / weightSum : grid[r][c]
      }
    }
    
    return result
  }
  
  /**
   * Apply adaptive edge-preserving filter with local sensitivity
   */
  private applyAdaptiveEdgePreservingFilter(grid: number[][]): number[][] {
    const rows = grid.length
    const cols = grid[0].length
    const radius = this.config.scalarField.radius
    const sigmaSpace = radius / 2
    
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    // First pass: compute local variance
    const localVariance = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0
        let squaredSum = 0
        let count = 0
        
        for (let y = Math.max(0, r - 1); y <= Math.min(rows - 1, r + 1); y++) {
          for (let x = Math.max(0, c - 1); x <= Math.min(cols - 1, c + 1); x++) {
            sum += grid[y][x]
            squaredSum += grid[y][x] * grid[y][x]
            count++
          }
        }
        
        const mean = sum / count
        const variance = squaredSum / count - mean * mean
        localVariance[r][c] = Math.max(0.01, variance) // Avoid zero variance
      }
    }
    
    // Second pass: apply adaptive bilateral filter
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0
        let weightSum = 0
        const centerValue = grid[r][c]
        const sigmaValue = 0.2 + 0.8 * localVariance[r][c] // Adaptive parameter
        
        for (let y = Math.max(0, r - radius); y <= Math.min(rows - 1, r + radius); y++) {
          for (let x = Math.max(0, c - radius); x <= Math.min(cols - 1, c + radius); x++) {
            const spatialDist = ((x - c) * (x - c) + (y - r) * (y - r)) / (2 * sigmaSpace * sigmaSpace)
            const valueDist = Math.pow(grid[y][x] - centerValue, 2) / (2 * sigmaValue * sigmaValue)
            
            const weight = Math.exp(-(spatialDist + valueDist))
            
            sum += grid[y][x] * weight
            weightSum += weight
          }
        }
        
        result[r][c] = weightSum > 0 ? sum / weightSum : grid[r][c]
      }
    }
    
    return result
  }
  
  /**
   * Apply edge clamping filter to preserve edge features
   */
  private applyEdgeClampingFilter(grid: number[][]): number[][] {
    if (!this.config.scalarField.edgeClamping.enabled) {
      // If edge clamping disabled, just return the original grid
      return [...grid.map(row => [...row])]
    }
    
    const rows = grid.length
    const cols = grid[0].length
    const { strength, distance } = this.config.scalarField.edgeClamping
    const radius = this.config.scalarField.radius
    
    // First detect edges - looking for significant changes in value
    const edgeMap = Array(rows).fill(false).map(() => Array(cols).fill(false))
    const edgeStrength = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    // Simple edge detection - look for large gradients
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        const center = grid[r][c]
        const top = grid[r - 1][c]
        const right = grid[r][c + 1]
        const bottom = grid[r + 1][c]
        const left = grid[r][c - 1]
        
        // Compute gradient magnitude
        const gradientX = (right - left) / 2
        const gradientY = (bottom - top) / 2
        const gradientMagnitude = Math.sqrt(gradientX * gradientX + gradientY * gradientY)
        
        // Determine if this is an edge
        if (gradientMagnitude > 0.1) {
          edgeMap[r][c] = true
          edgeStrength[r][c] = Math.min(1, gradientMagnitude)
        }
      }
    }
    
    // Now apply edge-sensitive filtering
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // If we're exactly on an edge, preserve the original value
        if (edgeMap[r][c]) {
          result[r][c] = grid[r][c]
          continue
        }
        
        // Otherwise, check distance to nearest edge
        let nearestEdgeDistance = Infinity
        let nearestEdgeStrength = 0
        
        // Search in a neighborhood
        const searchRadius = Math.ceil(distance * radius)
        for (let y = Math.max(0, r - searchRadius); y <= Math.min(rows - 1, r + searchRadius); y++) {
          for (let x = Math.max(0, c - searchRadius); x <= Math.min(cols - 1, c + searchRadius); x++) {
            if (edgeMap[y][x]) {
              const dist = Math.sqrt((x - c) * (x - c) + (y - r) * (y - r))
              if (dist < nearestEdgeDistance) {
                nearestEdgeDistance = dist
                nearestEdgeStrength = edgeStrength[y][x]
              }
            }
          }
        }
        
        // If within distance threshold of an edge
        if (nearestEdgeDistance < distance * radius) {
          // Calculate influence based on distance and configured strength
          const edgeInfluence = strength * nearestEdgeStrength * 
                               (1 - nearestEdgeDistance / (distance * radius))
          
          // Apply Gaussian filtering with reduced effect
          let sum = grid[r][c] // Start with more weight on original
          let weightSum = 1
          
          for (let y = Math.max(0, r - radius); y <= Math.min(rows - 1, r + radius); y++) {
            for (let x = Math.max(0, c - radius); x <= Math.min(cols - 1, c + radius); x++) {
              if (x === c && y === r) continue
              
              const dist = Math.sqrt((x - c) * (x - c) + (y - r) * (y - r))
              if (dist > radius) continue
              
              const weight = (1 - edgeInfluence) * Math.exp(-(dist * dist) / (2 * (radius/2) * (radius/2)))
              sum += grid[y][x] * weight
              weightSum += weight
            }
          }
          
          result[r][c] = sum / weightSum
        } else {
          // Apply standard Gaussian filter for points far from edges
          let sum = 0
          let weightSum = 0
          
          for (let y = Math.max(0, r - radius); y <= Math.min(rows - 1, r + radius); y++) {
            for (let x = Math.max(0, c - radius); x <= Math.min(cols - 1, c + radius); x++) {
              const dist = Math.sqrt((x - c) * (x - c) + (y - r) * (y - r))
              if (dist > radius) continue
              
              const weight = Math.exp(-(dist * dist) / (2 * (radius/2) * (radius/2)))
              sum += grid[y][x] * weight
              weightSum += weight
            }
          }
          
          result[r][c] = weightSum > 0 ? sum / weightSum : grid[r][c]
        }
      }
    }
    
    return result
  }
  
  /**
   * Interpolate value at a specific point in the grid
   */
  interpolateAt(grid: number[][], x: number, y: number): number {
    if (!this.config.enabled || this.config.method === 'none') {
      // No interpolation - use nearest cell value
      const row = Math.floor(y)
      const col = Math.floor(x)
      
      // Check bounds
      if (row < 0 || row >= grid.length - 1 || col < 0 || col >= grid[0].length - 1) {
        return 0
      }
      
      return grid[row][col]
    }
    
    // Check bounds for interpolation (need at least one cell on each side)
    if (x < 0 || y < 0 || x >= grid[0].length - 1 || y >= grid.length - 1) {
      return 0
    }
    
    // Get cell coordinates
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = x0 + 1
    const y1 = y0 + 1
    
    // Get normalized coordinates (0-1) within cell
    const sx = x - x0
    const sy = y - y0
    
    // Get the four corner values
    const v00 = grid[y0][x0]
    const v10 = grid[y0][x1]
    const v01 = grid[y1][x0]
    const v11 = grid[y1][x1]
    
    if (this.config.method === 'linear') {
      // Bilinear interpolation
      const top = v00 * (1 - sx) + v10 * sx
      const bottom = v01 * (1 - sx) + v11 * sx
      return top * (1 - sy) + bottom * sy
    } 
    else if (this.config.method === 'cubic') {
      // Bicubic interpolation requires 16 points (4x4 grid)
      // Simplified implementation - we'll use cubic on each axis
      
      // Get additional points if possible
      const x_1 = Math.max(0, x0 - 1)
      const y_1 = Math.max(0, y0 - 1)
      const x2 = Math.min(grid[0].length - 1, x1 + 1)
      const y2 = Math.min(grid.length - 1, y1 + 1)
      
      // Get additional corner values
      const v_10 = grid[y0][x_1]
      const v_11 = grid[y1][x_1]
      const v20 = grid[y0][x2]
      const v21 = grid[y1][x2]
      
      const v0_1 = grid[y_1][x0]
      const v1_1 = grid[y_1][x1]
      const v02 = grid[y2][x0]
      const v12 = grid[y2][x1]
      
      // Cubic interpolation in x direction
      const cubicX0 = this.cubicInterpolate(v_10, v00, v10, v20, sx)
      const cubicX1 = this.cubicInterpolate(v_11, v01, v11, v21, sx)
      const cubicX_1 = this.cubicInterpolate(v_10, v0_1, v1_1, v20, sx)
      const cubicX2 = this.cubicInterpolate(v_11, v02, v12, v21, sx)
      
      // Cubic interpolation in y direction
      return this.cubicInterpolate(cubicX_1, cubicX0, cubicX1, cubicX2, sy)
    }
    
    // Fallback to nearest neighbor
    return grid[Math.round(y)][Math.round(x)]
  }
  
  /**
   * Cubic interpolation helper function
   */
  private cubicInterpolate(v0: number, v1: number, v2: number, v3: number, t: number): number {
    const a0 = v3 - v2 - v0 + v1
    const a1 = v0 - v1 - a0
    const a2 = v2 - v0
    const a3 = v1
    
    return a0 * t * t * t + a1 * t * t + a2 * t + a3
  }
  
  /**
   * Apply global transformations to the grid
   */
  private applyGlobalTransformations(grid: number[][]): number[][] {
    const { globalOffsetX, globalOffsetY, scale } = this.config.transform
    
    if (globalOffsetX === 0 && globalOffsetY === 0 && scale === 1) {
      return grid // No transformation needed
    }
    
    const rows = grid.length
    const cols = grid[0].length
    const result = Array(rows).fill(0).map(() => Array(cols).fill(0))
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Apply inverse transformation to get source coordinates
        const sourceX = (c - globalOffsetX) / scale
        const sourceY = (r - globalOffsetY) / scale
        
        // Use interpolation to get value at transformed position
        result[r][c] = this.interpolateAt(grid, sourceX, sourceY)
      }
    }
    
    return result
  }
}
