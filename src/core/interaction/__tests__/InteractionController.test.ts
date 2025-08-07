import { describe, it, expect, beforeEach, vi } from 'vitest'
import Phaser from 'phaser'
import { 
  InteractionController, 
  InteractionState, 
  PanState, 
  CellInteractionCallbacks,
  GlobalInteractionCallbacks,
  AppMode,
  PaintMode
} from '../InteractionController'
import { DefectType } from '../../../types/defects'

// Mock Phaser classes
const mockPointer = {
  x: 100,
  y: 100,
  isDown: true
}

const mockCameraMain = {
  scrollX: 0,
  scrollY: 0,
  zoom: 1,
  setZoom: vi.fn()
}

const mockInput = {
  on: vi.fn(),
  removeAllListeners: vi.fn(),
  addPointer: vi.fn(),
  pointer1: { ...mockPointer, isDown: false },
  pointer2: { ...mockPointer, isDown: false }
}

const mockScene = {
  input: mockInput,
  cameras: {
    main: mockCameraMain
  }
}

const mockCell = {
  getData: vi.fn(),
  setFillStyle: vi.fn(),
  on: vi.fn()
}

describe('InteractionController', () => {
  let controller: InteractionController
  let selectedCells: Set<string>
  let cellDefectTypes: Map<string, DefectType>

  beforeEach(() => {
    vi.clearAllMocks()
    
    controller = new InteractionController(mockScene as any)
    selectedCells = new Set<string>()
    cellDefectTypes = new Map<string, DefectType>()
    
    controller.setGridState(selectedCells, cellDefectTypes)
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const state = controller.getState()
      
      expect(state.editMode).toBe(true)
      expect(state.appMode).toBe('edit')
      expect(state.isPainting).toBe(false)
      expect(state.isMouseDown).toBe(false)
      expect(state.selectedDefectType).toBe('section-loss')
      expect(state.paintMode).toBe(null)
    })

    it('should set up global event handlers on initialize', () => {
      controller.initialize()
      
      expect(mockInput.on).toHaveBeenCalled()
    })
  })

  describe('configuration updates', () => {
    beforeEach(() => {
      controller.initialize()
    })

    it('should update interaction state', () => {
      const newConfig: Partial<InteractionState> = {
        editMode: false,
        appMode: 'view',
        selectedDefectType: 'hole'
      }
      
      controller.updateConfig(newConfig)
      
      const state = controller.getState()
      expect(state.editMode).toBe(false)
      expect(state.appMode).toBe('view')
      expect(state.selectedDefectType).toBe('hole')
    })

    it('should reconfigure touch controls when mode changes', () => {
      const removeListenersSpy = vi.spyOn(mockInput, 'removeAllListeners')
      
      controller.updateConfig({ editMode: false })
      
      expect(removeListenersSpy).toHaveBeenCalled()
    })
  })

  describe('cell interaction setup', () => {
    beforeEach(() => {
      controller.initialize()
    })

    it('should set up event handlers for cell', () => {
      controller.setupCellInteraction(mockCell as any)
      
      expect(mockCell.on).toHaveBeenCalledWith('pointerdown', expect.any(Function))
      expect(mockCell.on).toHaveBeenCalledWith('pointerover', expect.any(Function))
      expect(mockCell.on).toHaveBeenCalledWith('pointerout', expect.any(Function))
    })
  })

  describe('cell selection logic', () => {
    let cellSelectCallback: vi.Mock
    let cellDeselectCallback: vi.Mock
    let redrawCallback: vi.Mock

    beforeEach(() => {
      controller.initialize()
      
      cellSelectCallback = vi.fn()
      cellDeselectCallback = vi.fn()
      redrawCallback = vi.fn()
      
      controller.setCellCallbacks({
        onCellSelect: cellSelectCallback,
        onCellDeselect: cellDeselectCallback,
        onRedrawNeeded: redrawCallback
      })

      mockCell.getData.mockImplementation((key: string) => {
        if (key === 'zone') return 'web'
        if (key === 'col') return 5
        if (key === 'row') return 3
        return null
      })
    })

    it('should select cell when not already selected', () => {
      // Simulate cell pointer down
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback()
      
      expect(selectedCells.has('web_5_3')).toBe(true)
      expect(cellDefectTypes.get('web_5_3')).toBe('section-loss')
      expect(cellSelectCallback).toHaveBeenCalledWith('web_5_3', 'section-loss')
      expect(redrawCallback).toHaveBeenCalled()
      expect(controller.getPaintMode()).toBe('add')
    })

    it('should deselect cell when already selected', () => {
      selectedCells.add('web_5_3')
      cellDefectTypes.set('web_5_3', 'section-loss')
      
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback()
      
      expect(selectedCells.has('web_5_3')).toBe(false)
      expect(cellDefectTypes.has('web_5_3')).toBe(false)
      expect(cellDeselectCallback).toHaveBeenCalledWith('web_5_3')
      expect(redrawCallback).toHaveBeenCalled()
      expect(controller.getPaintMode()).toBe('remove')
    })

    it('should not interact with cells when edit mode is disabled', () => {
      controller.updateConfig({ editMode: false })
      
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback()
      
      expect(selectedCells.size).toBe(0)
      expect(cellSelectCallback).not.toHaveBeenCalled()
      expect(redrawCallback).not.toHaveBeenCalled()
    })

    it('should handle different defect types', () => {
      controller.setSelectedDefectType('hole')
      
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback()
      
      expect(cellDefectTypes.get('web_5_3')).toBe('hole')
      expect(cellSelectCallback).toHaveBeenCalledWith('web_5_3', 'hole')
    })
  })

  describe('paint mode functionality', () => {
    let redrawCallback: vi.Mock

    beforeEach(() => {
      controller.initialize()
      
      redrawCallback = vi.fn()
      controller.setCellCallbacks({
        onRedrawNeeded: redrawCallback
      })

      mockCell.getData.mockImplementation((key: string) => {
        if (key === 'zone') return 'web'
        if (key === 'col') return 5
        if (key === 'row') return 3
        return null
      })
    })

    it('should paint cells when in add mode and mouse is down', () => {
      // Start painting mode
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      pointerDownCallback()
      
      expect(controller.isPainting()).toBe(true)
      expect(controller.getPaintMode()).toBe('add')
      
      // Simulate pointer over on another cell
      const mockCell2 = {
        ...mockCell,
        getData: vi.fn().mockImplementation((key: string) => {
          if (key === 'zone') return 'web'
          if (key === 'col') return 6
          if (key === 'row') return 3
          return null
        })
      }
      
      controller.setupCellInteraction(mockCell2 as any)
      const pointerOverCallback = mockCell2.on.mock.calls.find(call => call[0] === 'pointerover')[1]
      pointerOverCallback()
      
      expect(selectedCells.has('web_6_3')).toBe(true)
    })

    it('should stop painting when mouse is released', () => {
      // Start painting
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      pointerDownCallback()
      
      expect(controller.isPainting()).toBe(true)
      
      // Simulate global pointer up
      const globalPointerUpCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerup')[1]
      globalPointerUpCallback()
      
      expect(controller.isPainting()).toBe(false)
      expect(controller.getPaintMode()).toBe(null)
    })
  })

  describe('cell hover effects', () => {
    beforeEach(() => {
      controller.initialize()
      
      mockCell.getData.mockImplementation((key: string) => {
        if (key === 'zone') return 'web'
        if (key === 'col') return 5
        if (key === 'row') return 3
        return null
      })
    })

    it('should apply hover effect on unselected cells', () => {
      controller.setupCellInteraction(mockCell as any)
      const pointerOverCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerover')[1]
      
      pointerOverCallback()
      
      expect(mockCell.setFillStyle).toHaveBeenCalledWith(0xeeeeee, 0.3)
    })

    it('should remove hover effect on pointer out', () => {
      controller.setupCellInteraction(mockCell as any)
      const pointerOutCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerout')[1]
      
      pointerOutCallback()
      
      expect(mockCell.setFillStyle).toHaveBeenCalledWith(0xffffff, 0)
    })

    it('should not apply hover effect when edit mode is disabled', () => {
      controller.updateConfig({ editMode: false })
      
      controller.setupCellInteraction(mockCell as any)
      const pointerOverCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerover')[1]
      
      pointerOverCallback()
      
      expect(mockCell.setFillStyle).not.toHaveBeenCalled()
    })
  })

  describe('pan and zoom functionality', () => {
    let panStartCallback: vi.Mock
    let panMoveCallback: vi.Mock
    let panEndCallback: vi.Mock
    let zoomChangeCallback: vi.Mock

    beforeEach(() => {
      controller.initialize()
      controller.updateConfig({ editMode: false, appMode: 'view' })
      
      panStartCallback = vi.fn()
      panMoveCallback = vi.fn()
      panEndCallback = vi.fn()
      zoomChangeCallback = vi.fn()
      
      controller.setGlobalCallbacks({
        onPanStart: panStartCallback,
        onPanMove: panMoveCallback,
        onPanEnd: panEndCallback,
        onZoomChange: zoomChangeCallback
      })
    })

    it('should handle pan start in view mode', () => {
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback(mockPointer)
      
      expect(controller.isPanning()).toBe(true)
      expect(panStartCallback).toHaveBeenCalledWith(mockPointer)
    })

    it('should not pan in edit mode', () => {
      controller.updateConfig({ editMode: true })
      
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback(mockPointer)
      
      expect(controller.isPanning()).toBe(false)
      expect(panStartCallback).not.toHaveBeenCalled()
    })

    it('should handle pan movement', () => {
      // Start panning
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      pointerDownCallback(mockPointer)
      
      // Move pointer
      const movePointer = { ...mockPointer, x: 150, y: 150, isDown: true }
      const pointerMoveCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointermove')[1]
      
      pointerMoveCallback(movePointer)
      
      expect(mockCameraMain.scrollX).toBe(-50) // 100 - 150
      expect(mockCameraMain.scrollY).toBe(-50)
      expect(panMoveCallback).toHaveBeenCalledWith(movePointer, -50, -50)
    })

    it('should stop panning on pointer up', () => {
      // Start panning
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      pointerDownCallback(mockPointer)
      
      expect(controller.isPanning()).toBe(true)
      
      // Release pointer
      const pointerUpCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerup')[1]
      pointerUpCallback()
      
      expect(controller.isPanning()).toBe(false)
      expect(panEndCallback).toHaveBeenCalled()
    })
  })

  describe('pinch to zoom', () => {
    beforeEach(() => {
      controller.initialize()
      controller.updateConfig({ editMode: false, appMode: 'view' })
    })

    it('should handle pinch zoom when two pointers are down', () => {
      mockInput.pointer1.isDown = true
      mockInput.pointer2.isDown = true
      mockInput.pointer1.x = 100
      mockInput.pointer1.y = 100
      mockInput.pointer2.x = 200
      mockInput.pointer2.y = 100
      
      const pointerMoveCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointermove')[1]
      
      // First move to establish baseline
      pointerMoveCallback({})
      
      // Second move with increased distance
      mockInput.pointer2.x = 250
      pointerMoveCallback({})
      
      expect(mockCameraMain.setZoom).toHaveBeenCalled()
    })
  })

  describe('state management', () => {
    it('should get current interaction state', () => {
      const state = controller.getState()
      
      expect(state).toHaveProperty('editMode')
      expect(state).toHaveProperty('appMode')
      expect(state).toHaveProperty('isPainting')
      expect(state).toHaveProperty('isMouseDown')
      expect(state).toHaveProperty('selectedDefectType')
      expect(state).toHaveProperty('paintMode')
    })

    it('should get current pan state', () => {
      const panState = controller.getPanState()
      
      expect(panState).toHaveProperty('isPanning')
      expect(panState).toHaveProperty('panStartX')
      expect(panState).toHaveProperty('panStartY')
      expect(panState).toHaveProperty('cameraStartX')
      expect(panState).toHaveProperty('cameraStartY')
    })

    it('should force stop painting mode', () => {
      // Start painting
      controller.initialize()
      mockCell.getData.mockReturnValue('web')
      controller.setupCellInteraction(mockCell as any)
      const pointerDownCallback = mockCell.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      pointerDownCallback()
      
      expect(controller.isPainting()).toBe(true)
      
      controller.stopPainting()
      
      expect(controller.isPainting()).toBe(false)
      expect(controller.getPaintMode()).toBe(null)
    })

    it('should set and get selected defect type', () => {
      controller.setSelectedDefectType('hole')
      expect(controller.getSelectedDefectType()).toBe('hole')
    })

    it('should set edit mode', () => {
      controller.setEditMode(false)
      expect(controller.getState().editMode).toBe(false)
    })

    it('should set app mode', () => {
      controller.setAppMode('annotation')
      expect(controller.getState().appMode).toBe('annotation')
    })
  })

  describe('annotation manager integration', () => {
    let mockAnnotationManager: any

    beforeEach(() => {
      mockAnnotationManager = {
        isCreatingAnnotation: false,
        isDragging: vi.fn().mockReturnValue(false)
      }
      
      controller.setAnnotationManager(mockAnnotationManager)
      controller.initialize()
    })

    it('should respect annotation manager state for panning', () => {
      controller.updateConfig({ editMode: false, appMode: 'annotation' })
      mockAnnotationManager.isCreatingAnnotation = true
      
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback(mockPointer)
      
      expect(controller.isPanning()).toBe(false)
    })

    it('should allow panning when not creating annotations', () => {
      controller.updateConfig({ editMode: false, appMode: 'annotation' })
      mockAnnotationManager.isCreatingAnnotation = false
      mockAnnotationManager.isDragging.mockReturnValue(false)
      
      const pointerDownCallback = mockInput.on.mock.calls.find(call => call[0] === 'pointerdown')[1]
      
      pointerDownCallback(mockPointer)
      
      expect(controller.isPanning()).toBe(true)
    })
  })

  describe('cleanup', () => {
    beforeEach(() => {
      controller.initialize()
      controller.setGridState(selectedCells, cellDefectTypes)
    })

    it('should clean up resources on destroy', () => {
      controller.destroy()
      
      expect(mockInput.removeAllListeners).toHaveBeenCalled()
      expect(controller.getState().selectedDefectType).toBe('section-loss') // State should still be accessible
    })

    it('should clear grid state references', () => {
      selectedCells.add('test_cell')
      cellDefectTypes.set('test_cell', 'hole')
      
      controller.destroy()
      
      // Grid state should be cleared from controller's perspective
      // but original references should still exist
      expect(selectedCells.size).toBe(1) // Original sets not affected
      expect(cellDefectTypes.size).toBe(1)
    })
  })
})
