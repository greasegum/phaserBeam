/**
 * Marching Squares Engine
 * Coordinates the marching squares algorithm, interpolation, and smoothing
 */

import { MarchingSquaresAlgorithm } from '../algorithms/MarchingSquaresAlgorithm'
import { InterpolationAlgorithm } from '../algorithms/InterpolationAlgorithm'
import { SmoothingAlgorithm, EdgeConstraint } from '../algorithms/SmoothingAlgorithm'
import { Point, Contour } from '../geometry'
import { 
  MarchingSquaresConfig,
  MarchingSquaresAlgorithmConfig,
  InterpolationConfig,
  SmoothingConfig,
  PerformanceConfig
} from '../configuration/MarchingSquaresConfig'
import { ConfigUtils } from '../configuration/ConfigUtils'
import { PerformanceMonitor } from '../PerformanceMonitor'

export interface ProcessingResult {
  contours: Contour[]
  metrics: {
    total: number
    extraction: number
    interpolation: number
    smoothing: number
  }
}

export class MarchingSquaresEngine {
  private algorithmImpl: MarchingSquaresAlgorithm
  private interpolationImpl: InterpolationAlgorithm
  private smoothingImpl: SmoothingAlgorithm
  private config: MarchingSquaresConfig
  private monitor: PerformanceMonitor
  
  // Cache for improved performance
  private scalarFieldCache: Map<string, number[][]> = new Map()
  
  constructor(config: Partial<MarchingSquaresConfig>) {
    // Validate and set default config values
    this.config = ConfigUtils.validateConfig(config)
    
    // Initialize the algorithm implementations
    this.algorithmImpl = new MarchingSquaresAlgorithm(this.config.algorithm)
    this.interpolationImpl = new InterpolationAlgorithm(this.config.interpolation)
    this.smoothingImpl = new SmoothingAlgorithm(this.config.smoothing)
    
    // Initialize performance monitor
    this.monitor = new PerformanceMonitor()
  }
  
  /**
   * Generate contours from a grid of values
   * 
   * @param grid The input grid (2D array of scalar values)
   * @param edgeConstraints Optional edge constraints for preserving features
   * @returns Processing result with contours and performance metrics
   */
  process(grid: number[][], edgeConstraints?: EdgeConstraint[]): ProcessingResult {
    if (!grid || grid.length < 2 || grid[0].length < 2) {
      return { 
        contours: [],
        metrics: { total: 0, extraction: 0, interpolation: 0, smoothing: 0 }
      }
    }
    
    // Ensure monitor is initialized
    if (!this.monitor) {
      this.monitor = new PerformanceMonitor()
    }
    
    this.monitor.start('total')
    
    try {
      // Apply buffer if needed
      const bufferedGrid = this.applyBuffer(grid)
      
      // Apply interpolation to enhance the grid
      this.monitor.start('interpolation')
      const processedGrid = this.applyInterpolation(bufferedGrid)
      this.monitor.end('interpolation')
      
      // Generate contours with the marching squares algorithm
      this.monitor.start('extraction')
      const rawContours = this.algorithmImpl.generateContours(processedGrid)
      this.monitor.end('extraction')
      
      // Apply smoothing and post-processing
      this.monitor.start('smoothing')
      if (edgeConstraints && edgeConstraints.length > 0) {
        this.smoothingImpl.setEdgeConstraints(edgeConstraints)
      }
      const processedContours = this.smoothingImpl.smoothContours(rawContours)
      this.monitor.end('smoothing')
      
      this.monitor.end('total')
      
      return {
        contours: processedContours,
        metrics: {
          total: this.monitor.getTime('total'),
          extraction: this.monitor.getTime('extraction'),
          interpolation: this.monitor.getTime('interpolation'),
          smoothing: this.monitor.getTime('smoothing')
        }
      }
    } catch (error: any) {
      this.monitor.end('total')
      throw new Error(`Marching squares processing failed: ${error.message}`)
    }
  }
  
  /**
   * Apply buffer around grid if configured
   */
  private applyBuffer(grid: number[][]): number[][] {
    const bufferSize = 1 // Default buffer size
    
    if (bufferSize <= 0) {
      return grid // No buffer needed
    }
    
    const rows = grid.length
    const cols = grid[0].length
    const bufferValue = 0 // Default buffer value
    
    // Create buffered grid
    const bufferedGrid: number[][] = []
    const bufferedRows = rows + 2 * bufferSize
    const bufferedCols = cols + 2 * bufferSize
    
    // Initialize buffered grid with buffer value
    for (let r = 0; r < bufferedRows; r++) {
      bufferedGrid[r] = []
      for (let c = 0; c < bufferedCols; c++) {
        bufferedGrid[r][c] = bufferValue
      }
    }
    
    // Copy original grid into center of buffered grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bufferedGrid[r + bufferSize][c + bufferSize] = grid[r][c]
      }
    }
    
    return bufferedGrid
  }
  
  /**
   * Apply interpolation to the grid
   */
  private applyInterpolation(grid: number[][]): number[][] {
    if (!this.config.interpolation.enabled) {
      return grid
    }
    
    // Check cache if enabled
    if (this.config.performance.interpolationCache) {
      const cacheKey = this.generateGridCacheKey(grid)
      const cached = this.scalarFieldCache.get(cacheKey)
      
      if (cached) {
        return cached
      }
      
      // Process grid and store in cache
      const processed = this.interpolationImpl.processScalarField(grid)
      this.scalarFieldCache.set(cacheKey, processed)
      
      return processed
    }
    
    // Process without caching
    return this.interpolationImpl.processScalarField(grid)
  }
  
  /**
   * Update the engine configuration
   * 
   * @param config New configuration (partial)
   */
  updateConfig(config: Partial<MarchingSquaresConfig>): void {
    // Validate and merge with current config
    this.config = ConfigUtils.validateConfig({
      ...this.config,
      ...config
    })
    
    // Update individual algorithm configurations
    this.algorithmImpl = new MarchingSquaresAlgorithm(this.config.algorithm)
    this.interpolationImpl = new InterpolationAlgorithm(this.config.interpolation)
    this.smoothingImpl = new SmoothingAlgorithm(this.config.smoothing)
    
    // Clear cache if interpolation settings changed
    this.scalarFieldCache.clear()
  }
  
  /**
   * Get the current configuration
   */
  getConfig(): MarchingSquaresConfig {
    return { ...this.config }
  }
  
  /**
   * Clear the scalar field cache
   */
  clearCache(): void {
    this.scalarFieldCache.clear()
  }
  
  /**
   * Generate a cache key for a grid
   * Uses a simplified hash of grid values
   */
  private generateGridCacheKey(grid: number[][]): string {
    const rows = grid.length
    const cols = grid[0].length
    
    // Use dimensions and sample values to create a hash
    // (We don't use all values to avoid expensive string conversions)
    let key = `${rows}x${cols}-`
    
    // Sample values from the grid
    const sampleSize = Math.min(10, Math.floor(Math.sqrt(rows * cols)))
    const rowStep = Math.max(1, Math.floor(rows / sampleSize))
    const colStep = Math.max(1, Math.floor(cols / sampleSize))
    
    for (let r = 0; r < rows; r += rowStep) {
      for (let c = 0; c < cols; c += colStep) {
        key += `${grid[r][c].toFixed(2)}_`
      }
    }
    
    // Add a hash of configuration that affects interpolation
    key += `-t${this.config.algorithm.threshold.toFixed(2)}`
    key += `-m${this.config.interpolation.method}`
    key += `-sf${this.config.interpolation.scalarField.method}`
    
    return key
  }
}
