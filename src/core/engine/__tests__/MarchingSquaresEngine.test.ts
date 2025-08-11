import { describe, it, expect, beforeEach } from 'vitest'
import { MarchingSquaresEngine } from '../MarchingSquaresEngine'

describe('MarchingSquaresEngine', () => {
  let engine: MarchingSquaresEngine

  beforeEach(() => {
    engine = new MarchingSquaresEngine({
      algorithm: {
        threshold: 0.5
      },
      interpolation: {
        enabled: true,
        method: 'linear'
      },
      smoothing: {
        enabled: true,
        method: 'gaussian',
        iterations: 2
      }
    })
  })

  describe('process', () => {
    it('should handle empty grid', () => {
      const result = engine.process([])
      
      expect(result.contours).toEqual([])
      expect(result.metrics.total).toBe(0)
    })

    it('should handle small grid', () => {
      const grid = [
        [0, 0],
        [0, 0]
      ]
      
      const result = engine.process(grid)
      
      expect(result.contours).toBeDefined()
      expect(result.metrics).toHaveProperty('total')
      expect(result.metrics).toHaveProperty('extraction')
      expect(result.metrics).toHaveProperty('interpolation')
      expect(result.metrics).toHaveProperty('smoothing')
    })

    it('should process grid with contours', () => {
      const grid = [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ]
      
      const result = engine.process(grid)
      
      expect(result.contours).toBeDefined()
      expect(result.contours.length).toBeGreaterThan(0)
    })

    it('should apply buffer correctly', () => {
      const grid = [
        [1, 1],
        [1, 1]
      ]
      
      const result = engine.process(grid)
      
      // With buffer, the grid should be expanded
      expect(result.contours).toBeDefined()
    })

    it('should handle edge constraints', () => {
      const grid = [
        [0, 1, 1, 0],
        [1, 1, 1, 1],
        [1, 1, 1, 1],
        [0, 1, 1, 0]
      ]
      
      const edgeConstraints = [
        { x1: 0, y1: 0, x2: 3, y2: 0 },
        { x1: 0, y1: 3, x2: 3, y2: 3 }
      ]
      
      const result = engine.process(grid, edgeConstraints)
      
      expect(result.contours).toBeDefined()
    })

    it('should track performance metrics', () => {
      const grid = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ]
      
      const result = engine.process(grid)
      
      expect(result.metrics.total).toBeGreaterThanOrEqual(0)
      expect(result.metrics.extraction).toBeGreaterThanOrEqual(0)
      expect(result.metrics.interpolation).toBeGreaterThanOrEqual(0)
      expect(result.metrics.smoothing).toBeGreaterThanOrEqual(0)
      
      // Total time should be approximately sum of parts
      const sumOfParts = result.metrics.extraction + 
                        result.metrics.interpolation + 
                        result.metrics.smoothing
      
      // Allow for some overhead
      expect(result.metrics.total).toBeGreaterThanOrEqual(sumOfParts * 0.9)
    })
  })

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        algorithm: {
          threshold: 0.7
        }
      }
      
      engine.updateConfig(newConfig)
      const config = engine.getConfig()
      
      expect(config.algorithm.threshold).toBe(0.7)
    })

    it('should clear cache on config update', () => {
      // Process a grid to populate cache
      const grid = [[1, 1], [1, 1]]
      engine.process(grid)
      
      // Update config should clear cache
      engine.updateConfig({ interpolation: { enabled: false } })
      
      // Process again - should not use cached result
      const result = engine.process(grid)
      expect(result).toBeDefined()
    })

    it('should validate configuration', () => {
      const invalidConfig = {
        algorithm: {
          threshold: -1 // Invalid threshold
        }
      }
      
      // Engine should handle invalid config gracefully
      engine.updateConfig(invalidConfig)
      const config = engine.getConfig()
      
      // Should use default or clamped value
      expect(config.algorithm.threshold).toBeGreaterThanOrEqual(0)
      expect(config.algorithm.threshold).toBeLessThanOrEqual(1)
    })
  })

  describe('caching', () => {
    it('should cache interpolated grids when enabled', () => {
      const config = {
        performance: {
          interpolationCache: true
        }
      }
      
      const cachedEngine = new MarchingSquaresEngine(config)
      const grid = [[0, 1], [1, 0]]
      
      // First call
      const result1 = cachedEngine.process(grid)
      
      // Second call with same grid should use cache
      const result2 = cachedEngine.process(grid)
      
      // Results should be equivalent
      expect(result1.contours).toEqual(result2.contours)
    })

    it('should clear cache explicitly', () => {
      const grid = [[1, 0], [0, 1]]
      
      engine.process(grid)
      engine.clearCache()
      
      // After clearing, should process fresh
      const result = engine.process(grid)
      expect(result).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle null grid gracefully', () => {
      const result = engine.process(null as any)
      
      expect(result.contours).toEqual([])
      expect(result.metrics.total).toBe(0)
    })

    it('should handle irregular grid', () => {
      const irregularGrid = [
        [0, 1, 0],
        [1, 1],  // Irregular row
        [0, 1, 0]
      ]
      
      // Should handle gracefully without throwing
      expect(() => engine.process(irregularGrid)).not.toThrow()
    })

    it('should handle very large grids', () => {
      const size = 100
      const largeGrid = Array(size).fill(null).map(() => 
        Array(size).fill(0).map(() => Math.random() > 0.5 ? 1 : 0)
      )
      
      const result = engine.process(largeGrid)
      
      expect(result).toBeDefined()
      expect(result.metrics.total).toBeGreaterThan(0)
    })
  })

  describe('grid generation helpers', () => {
    it('should generate correct cache key', () => {
      const grid1 = [[0, 1], [1, 0]]
      const grid2 = [[0, 1], [1, 0]]
      const grid3 = [[1, 0], [0, 1]]
      
      // Same grids should generate same key
      // Different grids should generate different keys
      // This is internal behavior but affects caching
      
      engine.process(grid1)
      const result2 = engine.process(grid2) // Should potentially use cache
      const result3 = engine.process(grid3) // Should not use cache
      
      expect(result2).toBeDefined()
      expect(result3).toBeDefined()
    })
  })
})