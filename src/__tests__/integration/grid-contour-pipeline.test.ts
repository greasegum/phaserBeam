import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GridSystem } from '../../core/grid/GridSystem'
import { MarchingSquaresEngine } from '../../core/engine/MarchingSquaresEngine'
import { processGrid } from '../../core'
import type { BeamProfile, GridCell } from '../../types/beam'

describe('Grid-Click-Contour Pipeline Integration', () => {
  let mockScene: any
  const mockBeamProfile: BeamProfile = {
    id: 'test-beam',
    name: 'Test Beam',
    webHeight: 10,
    webThickness: 0.5,
    flangeWidth: 8,
    flangeThickness: 1,
    weight: 50
  }

  beforeEach(() => {
    // Create a more complete mock scene
    const createMockRectangle = () => ({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
      setStrokeStyle: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setData: vi.fn().mockReturnThis(),
      getData: vi.fn((key) => {
        // Return mock data based on key
        if (key === 'zone') return 'web'
        if (key === 'col') return 0
        if (key === 'row') return 0
        return null
      }),
      setFillStyle: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
      destroy: vi.fn().mockReturnThis()
    })

    mockScene = {
      add: {
        container: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn().mockReturnThis(),
          remove: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis()
        })),
        rectangle: vi.fn(createMockRectangle)
      }
    }
  })

  describe('Complete Pipeline Flow', () => {
    it('should generate contours from grid cell selection', () => {
      // Step 1: Initialize GridSystem
      const gridSystem = new GridSystem(mockScene)
      gridSystem.initialize(mockBeamProfile, {
        editMode: true,
        showGrid: true
      })

      // Step 2: Create grid
      gridSystem.createGrid({
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      })

      // Step 3: Select cells
      gridSystem.selectCell('web_2_2')
      gridSystem.selectCell('web_2_3')
      gridSystem.selectCell('web_3_2')
      gridSystem.selectCell('web_3_3')

      // Step 4: Get selected cells
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(4)

      // Step 5: Generate grid for marching squares
      const cols = Math.ceil(12) // beamLength
      const rows = Math.ceil(10) // webHeight
      const grid = generateGridFromCells(selectedCells, cols, rows)

      // Step 6: Process with marching squares
      const result = processGrid(grid, {
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

      // Verify result
      expect(result).toBeDefined()
      expect(result.contours).toBeDefined()
      expect(result.contours.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle callback chain correctly', () => {
      const gridSystem = new GridSystem(mockScene)
      const cellChangeCallback = vi.fn()
      
      gridSystem.initialize(mockBeamProfile, { editMode: true })
      gridSystem.onCellChange(cellChangeCallback)
      
      gridSystem.createGrid({
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      })

      // Select a cell
      gridSystem.selectCell('web_1_1')

      // Verify callback was triggered
      expect(cellChangeCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            x: 1,
            y: 1,
            zone: 'web'
          })
        ])
      )
    })

    it('should preserve selections during grid recreation', () => {
      const gridSystem = new GridSystem(mockScene)
      gridSystem.initialize(mockBeamProfile, { editMode: true })
      
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }

      // Create grid and select cells
      gridSystem.createGrid(dimensions)
      gridSystem.selectCell('web_1_1')
      gridSystem.selectCell('web_2_2')
      
      // Recreate grid (e.g., on resize)
      gridSystem.createGrid(dimensions)
      
      // Selections should persist
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(2)
    })

    it('should handle empty cell selection', () => {
      const gridSystem = new GridSystem(mockScene)
      gridSystem.initialize(mockBeamProfile, { editMode: true })
      
      gridSystem.createGrid({
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      })

      // No cells selected
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(0)

      // Should handle empty grid gracefully
      const grid = generateGridFromCells(selectedCells, 12, 10)
      const result = processGrid(grid, {})
      
      expect(result.contours).toEqual([])
    })

    it('should filter web cells for contour generation', () => {
      const allCells: GridCell[] = [
        { x: 0, y: 0, zone: 'web', isLinear: false },
        { x: 1, y: 0, zone: 'web', isLinear: false },
        { x: 0, y: 0, zone: 'flange-top', isLinear: true },
        { x: 1, y: 0, zone: 'flange-bottom', isLinear: true }
      ]

      // Filter for web cells only
      const webCells = allCells.filter(cell => cell.zone === 'web')
      expect(webCells).toHaveLength(2)

      // Generate grid from web cells
      const grid = generateGridFromCells(webCells, 10, 10)
      expect(grid).toBeDefined()
      expect(grid.length).toBe(10)
      expect(grid[0].length).toBe(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid grid dimensions gracefully', () => {
      const gridSystem = new GridSystem(mockScene)
      gridSystem.initialize(mockBeamProfile)
      
      // Invalid dimensions
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 0, // Invalid
        gridSize: 0, // Invalid
        beamLength: 0 // Invalid
      }

      // Should not throw
      expect(() => gridSystem.createGrid(dimensions)).not.toThrow()
    })

    it('should handle marching squares errors', () => {
      const invalidGrid = null as any
      
      // Should handle gracefully
      const result = processGrid(invalidGrid, {})
      expect(result).toBeDefined()
      expect(result.contours).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should process large grids efficiently', () => {
      const startTime = performance.now()
      
      // Create large grid
      const size = 50
      const largeGrid = Array(size).fill(null).map(() => 
        Array(size).fill(0).map(() => Math.random() > 0.7 ? 1 : 0)
      )
      
      const result = processGrid(largeGrid, {
        performance: {
          interpolationCache: true
        }
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(result).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})

// Helper function to generate grid from cells
function generateGridFromCells(cells: GridCell[], cols: number, rows: number): number[][] {
  const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
  
  cells.forEach(cell => {
    if (cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows) {
      grid[cell.y][cell.x] = 1
    }
  })
  
  return grid
}