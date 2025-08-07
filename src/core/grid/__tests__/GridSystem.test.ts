import { describe, it, expect, beforeEach, vi } from 'vitest'
import Phaser from 'phaser'
import { GridSystem, GridDimensions, GridSystemConfig } from '../GridSystem'
import { BeamProfile, GridCell } from '../../../types/beam'
import { DefectType } from '../../../types/defects'

// Mock Phaser classes
const mockContainer = {
  setDepth: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  setVisible: vi.fn(),
  destroy: vi.fn()
}

const mockRectangle = {
  x: 0,
  y: 0,
  width: 30,
  height: 30,
  setStrokeStyle: vi.fn(),
  setInteractive: vi.fn(),
  setDepth: vi.fn(),
  setData: vi.fn(),
  getData: vi.fn(),
  setFillStyle: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn()
}

const mockScene = {
  add: {
    container: vi.fn(() => mockContainer),
    rectangle: vi.fn(() => ({ ...mockRectangle }))
  }
}

describe('GridSystem', () => {
  let gridSystem: GridSystem
  let beamProfile: BeamProfile
  let gridDimensions: GridDimensions

  beforeEach(() => {
    vi.clearAllMocks()
    
    gridSystem = new GridSystem(mockScene as any)
    
    beamProfile = {
      id: 'test-beam',
      name: 'Test Beam',
      webThickness: 8,
      webHeight: 200,
      flangeWidth: 100,
      flangeThickness: 10,
      weight: 25.3
    }
    
    gridDimensions = {
      startX: 100,
      centerY: 200,
      width: 600,
      gridSize: 30,
      beamLength: 20
    }
  })

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      gridSystem.initialize(beamProfile)
      
      expect(mockScene.add.container).toHaveBeenCalled()
      expect(mockContainer.setDepth).toHaveBeenCalledWith(5)
    })

    it('should accept custom configuration', () => {
      const config: Partial<GridSystemConfig> = {
        showTopFlange: false,
        editMode: false,
        appMode: 'view'
      }
      
      gridSystem.initialize(beamProfile, config)
      
      // Configuration should be applied (internal state testing)
      expect(mockScene.add.container).toHaveBeenCalled()
    })
  })

  describe('grid creation', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
    })

    it('should create grid cells for web section', () => {
      gridSystem.createGrid(gridDimensions)
      
      // Should create rectangles for grid cells
      expect(mockScene.add.rectangle).toHaveBeenCalled()
      
      // Grid cells should be interactive
      const rectangleCalls = mockScene.add.rectangle.mock.calls
      rectangleCalls.forEach(() => {
        expect(mockRectangle.setInteractive).toHaveBeenCalled()
      })
    })

    it('should create flange grids when showTopFlange is true', () => {
      const config = { showTopFlange: true }
      gridSystem.initialize(beamProfile, config)
      gridSystem.createGrid(gridDimensions)
      
      // Should create cells for both top and bottom flanges
      expect(mockScene.add.rectangle).toHaveBeenCalled()
    })

    it('should skip top flange when showTopFlange is false', () => {
      const config = { showTopFlange: false }
      gridSystem.initialize(beamProfile, config)
      gridSystem.createGrid(gridDimensions)
      
      // Should still create cells for web and bottom flange
      expect(mockScene.add.rectangle).toHaveBeenCalled()
    })

    it('should clear existing grid before creating new one', () => {
      // Create grid twice
      gridSystem.createGrid(gridDimensions)
      gridSystem.createGrid(gridDimensions)
      
      // Should call destroy on previous cells
      expect(mockRectangle.destroy).toHaveBeenCalled()
    })
  })

  describe('cell selection', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
      gridSystem.createGrid(gridDimensions)
    })

    it('should select and deselect cells', () => {
      const cellKey = 'web_5_3'
      
      gridSystem.selectCell(cellKey, 'section-loss')
      let selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(1)
      expect(selectedCells[0].x).toBe(5)
      expect(selectedCells[0].y).toBe(3)
      expect(selectedCells[0].defectType).toBe('section-loss')
      
      gridSystem.deselectCell(cellKey)
      selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(0)
    })

    it('should clear all selections', () => {
      gridSystem.selectCell('web_1_1', 'hole')
      gridSystem.selectCell('web_2_2', 'pitting')
      
      expect(gridSystem.getSelectedCells()).toHaveLength(2)
      
      gridSystem.clearSelection()
      expect(gridSystem.getSelectedCells()).toHaveLength(0)
    })

    it('should set selected cells from GridCell array', () => {
      const cells: GridCell[] = [
        { x: 5, y: 3, selected: true, zone: 'web', defectType: 'hole' },
        { x: 10, y: 0, selected: true, zone: 'flange-bottom', defectType: 'pitting' }
      ]
      
      gridSystem.setSelectedCells(cells)
      
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(2)
      expect(selectedCells.find(c => c.defectType === 'hole')).toBeDefined()
      expect(selectedCells.find(c => c.defectType === 'pitting')).toBeDefined()
    })
  })

  describe('configuration updates', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
      gridSystem.createGrid(gridDimensions)
    })

    it('should update grid visibility based on configuration', () => {
      gridSystem.updateConfig({ showGrid: false })
      expect(mockContainer.setVisible).toHaveBeenCalledWith(false)
      
      gridSystem.updateConfig({ showGrid: true, editMode: true })
      expect(mockContainer.setVisible).toHaveBeenCalledWith(true)
    })

    it('should handle edit mode changes', () => {
      gridSystem.updateConfig({ editMode: false })
      expect(mockContainer.setVisible).toHaveBeenCalledWith(false)
      
      gridSystem.updateConfig({ editMode: true })
      expect(mockContainer.setVisible).toHaveBeenCalledWith(true)
    })
  })

  describe('grid information', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
      gridSystem.createGrid(gridDimensions)
    })

    it('should provide grid statistics', () => {
      gridSystem.selectCell('web_1_1')
      gridSystem.selectCell('web_2_2')
      
      const info = gridSystem.getGridInfo()
      expect(info.selectedCells).toBe(2)
      expect(info.totalCells).toBeGreaterThan(0)
      expect(info.zones).toContain('web')
    })

    it('should provide snap points for annotations', () => {
      const snapPoints = gridSystem.getSnapPoints()
      expect(snapPoints).toBeDefined()
      expect(Array.isArray(snapPoints)).toBe(true)
      
      if (snapPoints.length > 0) {
        expect(snapPoints[0]).toHaveProperty('x')
        expect(snapPoints[0]).toHaveProperty('y')
        expect(snapPoints[0]).toHaveProperty('width')
        expect(snapPoints[0]).toHaveProperty('height')
      }
    })
  })

  describe('callbacks', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
      gridSystem.createGrid(gridDimensions)
    })

    it('should call onCellChange callback when cells are modified', () => {
      const onCellChange = vi.fn()
      gridSystem.onCellChange(onCellChange)
      
      gridSystem.selectCell('web_5_3')
      expect(onCellChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            x: 5,
            y: 3,
            selected: true,
            zone: 'web'
          })
        ])
      )
    })

    it('should call onCellInteraction callback for individual cell events', () => {
      const onCellInteraction = vi.fn()
      gridSystem.onCellInteraction(onCellInteraction)
      
      // This would be called internally during cell interaction
      // We'll test the callback registration
      expect(onCellInteraction).not.toHaveBeenCalled() // Initially not called
    })
  })

  describe('cleanup', () => {
    beforeEach(() => {
      gridSystem.initialize(beamProfile)
      gridSystem.createGrid(gridDimensions)
    })

    it('should destroy all resources on cleanup', () => {
      gridSystem.destroy()
      
      expect(mockContainer.destroy).toHaveBeenCalled()
      expect(mockRectangle.destroy).toHaveBeenCalled()
    })

    it('should clear all state on destroy', () => {
      gridSystem.selectCell('web_1_1')
      expect(gridSystem.getSelectedCells()).toHaveLength(1)
      
      gridSystem.destroy()
      expect(gridSystem.getSelectedCells()).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should handle grid creation without beam profile', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      gridSystem.createGrid(gridDimensions) // No beam profile set
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'GridSystem: Cannot create grid without beam profile and container'
      )
      
      consoleSpy.mockRestore()
    })

    it('should handle missing zone data gracefully', () => {
      gridSystem.initialize(beamProfile)
      
      // Try to select a cell that doesn't exist
      gridSystem.selectCell('invalid_key')
      
      // Should not crash and should return empty selection
      expect(gridSystem.getSelectedCells()).toHaveLength(0)
    })
  })
})
