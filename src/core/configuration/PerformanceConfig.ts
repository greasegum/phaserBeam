/**
 * Performance configuration
 * Controls computation optimizations and quality settings
 */
export interface PerformanceConfig {
  // Optimization settings
  enableCaching: boolean
  interpolationCache: boolean
  
  // Quality vs performance
  quality: 'draft' | 'balanced' | 'high'
  
  // Limits
  maxGridSize: number
  maxContourPoints: number
}

/**
 * Default configuration for performance
 */
export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableCaching: true,
  interpolationCache: true,
  quality: 'balanced',
  maxGridSize: 1000,
  maxContourPoints: 10000
}
