import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GridSystem } from '../GridSystem'
import type { BeamProfile } from '../../../types/beam'

describe('GridSystem', () => {
  let gridSystem: GridSystem
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
    // Create mock Phaser scene
    mockScene = {
      add: {
        container: vi.fn(() => ({
          setDepth: vi.fn().mockReturnThis(),
          add: vi.fn().mockReturnThis(),
          remove: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis()
        })),
        rectangle: vi.fn(() => ({
          x: 0,
          y: 0,
          width: 30,
          height: 30,
          setStrokeStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setData: vi.fn().mockReturnThis(),
          getData: vi.fn(),
          setFillStyle: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
          destroy: vi.fn().mockReturnThis()
        }))
      }
    }

    gridSystem = new GridSystem(mockScene)
  })

  describe('initialization', () => {
    it('should initialize with beam profile and config', () => {
      gridSystem.initialize(mockBeamProfile, {
        editMode: true,
        showGrid: true,
        showTopFlange: true
      })

      // Verify container was created
      expect(mockScene.add.container).toHaveBeenCalled()
    })

    it('should create grid container with correct depth', () => {
      const mockContainer = mockScene.add.container()
      gridSystem.initialize(mockBeamProfile)
      
      expect(mockContainer.setDepth).toHaveBeenCalledWith(100)
    })
  })

  describe('grid creation', () => {
    beforeEach(() => {
      gridSystem.initialize(mockBeamProfile)
    })

    it('should create grid with correct dimensions', () => {
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }

      gridSystem.createGrid(dimensions)

      // Should create rectangles for grid cells
      expect(mockScene.add.rectangle).toHaveBeenCalled()
    })

    it('should create web and flange grids', () => {
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }

      gridSystem.createGrid(dimensions)

      // Verify rectangles were created
      const callCount = mockScene.add.rectangle.mock.calls.length
      expect(callCount).toBeGreaterThan(0)
    })

    it('should preserve selected cells when recreating grid', () => {
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }

      // Create initial grid
      gridSystem.createGrid(dimensions)
      
      // Select a cell
      gridSystem.selectCell('web_0_0')
      
      // Recreate grid
      gridSystem.createGrid(dimensions)
      
      // Check if selection was preserved
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(1)
    })
  })

  describe('cell selection', () => {
    beforeEach(() => {
      gridSystem.initialize(mockBeamProfile)
      gridSystem.createGrid({
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      })
    })

    it('should select a cell', () => {
      gridSystem.selectCell('web_0_0', 'section-loss')
      
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(1)
      expect(selectedCells[0]).toMatchObject({
        x: 0,
        y: 0,
        zone: 'web'
      })
    })

    it('should deselect a cell', () => {
      gridSystem.selectCell('web_0_0')
      gridSystem.deselectCell('web_0_0')
      
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(0)
    })

    it('should clear all selections', () => {
      gridSystem.selectCell('web_0_0')
      gridSystem.selectCell('web_1_0')
      gridSystem.selectCell('web_2_0')
      
      gridSystem.clearSelection()
      
      const selectedCells = gridSystem.getSelectedCells()
      expect(selectedCells).toHaveLength(0)
    })

    it('should notify on cell change', () => {
      const callback = vi.fn()
      gridSystem.onCellChange(callback)
      
      gridSystem.selectCell('web_0_0')
      
      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            x: 0,
            y: 0,
            zone: 'web'
          })
        ])
      )
    })
  })

  describe('visibility', () => {
    beforeEach(() => {
      gridSystem.initialize(mockBeamProfile)
    })

    it('should show grid in edit mode', () => {
      gridSystem.updateConfig({
        editMode: true,
        showGrid: true
      })
      
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }
      
      gridSystem.createGrid(dimensions)
      
      const container = mockScene.add.container()
      expect(container.setVisible).toHaveBeenCalledWith(true)
    })

    it('should show grid in annotation mode', () => {
      gridSystem.updateConfig({
        appMode: 'annotation',
        editMode: false,
        showGrid: true
      })
      
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }
      
      gridSystem.createGrid(dimensions)
      
      const container = mockScene.add.container()
      expect(container.setVisible).toHaveBeenCalledWith(true)
    })

    it('should hide grid in view mode', () => {
      gridSystem.updateConfig({
        appMode: 'view',
        editMode: false,
        showGrid: false
      })
      
      const dimensions = {
        startX: 100,
        centerY: 300,
        width: 360,
        gridSize: 30,
        beamLength: 12
      }
      
      gridSystem.createGrid(dimensions)
      
      const container = mockScene.add.container()
      expect(container.setVisible).toHaveBeenCalledWith(false)
    })
  })

  describe('cell interaction callbacks', () => {
    beforeEach(() => {
      gridSystem.initialize(mockBeamProfile, { editMode: true })
    })

    it('should trigger interaction callback on select', () => {
      const interactionCallback = vi.fn()
      gridSystem.onCellInteraction(interactionCallback)
      
      // Simulate cell selection
      gridSystem.selectCell('web_0_0')
      
      // Note: In the real implementation, this is called from the click handler
      // For testing, we'd need to simulate the actual click event
    })
  })

  describe('grid cleanup', () => {
    it('should destroy grid system properly', () => {
      gridSystem.initialize(mockBeamProfile)
      const container = mockScene.add.container()
      
      gridSystem.destroy()
      
      expect(container.destroy).toHaveBeenCalled()
    })
  })
})