import Phaser from 'phaser'
import { DefectType } from '../../types/defects'

export type PaintMode = 'add' | 'remove' | null
export type AppMode = 'edit' | 'annotation' | 'view'

export interface InteractionState {
  editMode: boolean
  appMode: AppMode
  isPainting: boolean
  isMouseDown: boolean
  selectedDefectType: DefectType
  paintMode: PaintMode
}

export interface PanState {
  isPanning: boolean
  panStartX: number
  panStartY: number
  cameraStartX: number
  cameraStartY: number
}

export interface CellInteractionCallbacks {
  onCellSelect?: (key: string, defectType: DefectType) => void
  onCellDeselect?: (key: string) => void
  onCellHover?: (key: string, cell: Phaser.GameObjects.Rectangle) => void
  onCellOut?: (key: string, cell: Phaser.GameObjects.Rectangle) => void
  onRedrawNeeded?: () => void
}

export interface GlobalInteractionCallbacks {
  onPanStart?: (pointer: Phaser.Input.Pointer) => void
  onPanMove?: (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number) => void
  onPanEnd?: () => void
  onZoomChange?: (newZoom: number) => void
}

/**
 * InteractionController manages all user input and interaction logic
 * Extracted from BeamElevationScene to improve maintainability and testability
 */
export class InteractionController {
  private scene: Phaser.Scene
  
  // Interaction state
  private state: InteractionState = {
    editMode: true,
    appMode: 'edit',
    isPainting: false,
    isMouseDown: false,
    selectedDefectType: 'section-loss',
    paintMode: null
  }
  
  // Pan/zoom state
  private panState: PanState = {
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    cameraStartX: 0,
    cameraStartY: 0
  }
  
  // External state (for integration)
  private selectedCells: Set<string> = new Set()
  private cellDefectTypes: Map<string, DefectType> = new Map()
  private annotationManager?: any // Will be injected
  
  // Callbacks
  private cellCallbacks: CellInteractionCallbacks = {}
  private globalCallbacks: GlobalInteractionCallbacks = {}
  
  // Multi-touch zoom tracking
  private lastPinchDistance = 0
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Initialize the interaction system
   */
  initialize(): void {
    this.setupGlobalEventHandlers()
  }

  /**
   * Update interaction configuration
   */
  updateConfig(config: Partial<InteractionState>): void {
    this.state = { ...this.state, ...config }
    
    // Reconfigure touch controls when mode changes
    if (config.editMode !== undefined || config.appMode !== undefined) {
      this.reconfigureTouchControls()
    }
  }

  /**
   * Set external state references (for grid integration)
   */
  setGridState(selectedCells: Set<string>, cellDefectTypes: Map<string, DefectType>): void {
    this.selectedCells = selectedCells
    this.cellDefectTypes = cellDefectTypes
  }

  /**
   * Set annotation manager reference
   */
  setAnnotationManager(annotationManager: any): void {
    this.annotationManager = annotationManager
  }

  /**
   * Set up cell interaction for a grid cell
   */
  setupCellInteraction(cell: Phaser.GameObjects.Rectangle): void {
    cell.on('pointerdown', () => {
      this.handleCellPointerDown(cell)
    })

    cell.on('pointerover', () => {
      this.handleCellPointerOver(cell)
    })

    cell.on('pointerout', () => {
      this.handleCellPointerOut(cell)
    })
  }

  /**
   * Handle cell pointer down events
   */
  private handleCellPointerDown(cell: Phaser.GameObjects.Rectangle): void {
    if (!this.state.editMode) return
    
    const zone = cell.getData('zone') || 'default'
    const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
    
    // Simple toggle logic
    if (this.selectedCells.has(key)) {
      this.selectedCells.delete(key)
      this.cellDefectTypes.delete(key)
      this.state.paintMode = 'remove'
      this.cellCallbacks.onCellDeselect?.(key)
    } else {
      this.selectedCells.add(key)
      this.cellDefectTypes.set(key, this.state.selectedDefectType)
      this.state.paintMode = 'add'
      this.cellCallbacks.onCellSelect?.(key, this.state.selectedDefectType)
    }
    
    this.state.isMouseDown = true
    this.state.isPainting = true
    
    this.cellCallbacks.onRedrawNeeded?.()
  }

  /**
   * Handle cell pointer over events (for paint mode)
   */
  private handleCellPointerOver(cell: Phaser.GameObjects.Rectangle): void {
    if (!this.state.editMode) return
    
    const zone = cell.getData('zone') || 'default'
    const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
    
    // Apply paint mode during drag
    if (this.state.isMouseDown && this.state.isPainting && this.state.paintMode) {
      if (this.state.paintMode === 'add' && !this.selectedCells.has(key)) {
        this.selectedCells.add(key)
        this.cellDefectTypes.set(key, this.state.selectedDefectType)
        this.cellCallbacks.onCellSelect?.(key, this.state.selectedDefectType)
        this.cellCallbacks.onRedrawNeeded?.()
      } else if (this.state.paintMode === 'remove' && this.selectedCells.has(key)) {
        this.selectedCells.delete(key)
        this.cellDefectTypes.delete(key)
        this.cellCallbacks.onCellDeselect?.(key)
        this.cellCallbacks.onRedrawNeeded?.()
      }
    } else if (!this.selectedCells.has(key)) {
      // Hover effect
      cell.setFillStyle(0xeeeeee, 0.3)
      this.cellCallbacks.onCellHover?.(key, cell)
    }
  }

  /**
   * Handle cell pointer out events
   */
  private handleCellPointerOut(cell: Phaser.GameObjects.Rectangle): void {
    if (!this.state.editMode) return
    
    const zone = cell.getData('zone') || 'default'
    const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
    
    if (!this.selectedCells.has(key)) {
      cell.setFillStyle(0xffffff, 0)
      this.cellCallbacks.onCellOut?.(key, cell)
    }
  }

  /**
   * Set up global event handlers
   */
  private setupGlobalEventHandlers(): void {
    // Global mouse up handler for paint mode
    this.scene.input.on('pointerup', () => {
      if (this.state.isMouseDown) {
        this.state.isMouseDown = false
        this.state.isPainting = false
        this.state.paintMode = null
      }
    })

    this.setupTouchControls()
  }

  /**
   * Set up touch controls for pan and zoom
   */
  private setupTouchControls(): void {
    // Don't set up global touch controls in edit mode - they interfere with grid interaction
    if (this.state.editMode) {
      return
    }
    
    // Enable multi-touch
    this.scene.input.addPointer(2)
    
    // Pan support
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleGlobalPointerDown(pointer)
    })
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handleGlobalPointerMove(pointer)
    })
    
    this.scene.input.on('pointerup', () => {
      this.handleGlobalPointerUp()
    })
    
    // Set up pinch-to-zoom
    this.setupPinchToZoom()
  }

  /**
   * Handle global pointer down for panning
   */
  private handleGlobalPointerDown(pointer: Phaser.Input.Pointer): void {
    // Don't handle ANY pointer events in edit mode - let grid cells handle them
    if (this.state.editMode) {
      return
    }
    
    // Only allow panning in view mode, or annotation mode when not interacting with annotations
    const allowPanning = this.state.appMode === 'view' || 
      (this.state.appMode === 'annotation' && 
       !this.annotationManager?.isCreatingAnnotation && 
       !this.annotationManager?.isDragging())
    
    if (allowPanning) {
      this.panState.isPanning = true
      this.panState.panStartX = pointer.x
      this.panState.panStartY = pointer.y
      this.panState.cameraStartX = this.scene.cameras.main.scrollX
      this.panState.cameraStartY = this.scene.cameras.main.scrollY
      
      this.globalCallbacks.onPanStart?.(pointer)
    }
  }

  /**
   * Handle global pointer move for panning
   */
  private handleGlobalPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.panState.isPanning && pointer.isDown) {
      const deltaX = this.panState.panStartX - pointer.x
      const deltaY = this.panState.panStartY - pointer.y
      
      this.scene.cameras.main.scrollX = this.panState.cameraStartX + deltaX
      this.scene.cameras.main.scrollY = this.panState.cameraStartY + deltaY
      
      this.globalCallbacks.onPanMove?.(pointer, deltaX, deltaY)
    }
  }

  /**
   * Handle global pointer up
   */
  private handleGlobalPointerUp(): void {
    if (this.panState.isPanning) {
      this.panState.isPanning = false
      this.globalCallbacks.onPanEnd?.()
    }
  }

  /**
   * Set up pinch-to-zoom functionality
   */
  private setupPinchToZoom(): void {
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.scene.input.pointer1.isDown && this.scene.input.pointer2.isDown) {
        const distance = Phaser.Math.Distance.Between(
          this.scene.input.pointer1.x,
          this.scene.input.pointer1.y,
          this.scene.input.pointer2.x,
          this.scene.input.pointer2.y
        )
        
        if (this.lastPinchDistance > 0) {
          const delta = distance - this.lastPinchDistance
          const zoomFactor = 1 + (delta * 0.01)
          const currentZoom = this.scene.cameras.main.zoom
          const newZoom = Phaser.Math.Clamp(currentZoom * zoomFactor, 0.5, 2)
          
          this.scene.cameras.main.setZoom(newZoom)
          this.globalCallbacks.onZoomChange?.(newZoom)
        }
        
        this.lastPinchDistance = distance
      } else {
        this.lastPinchDistance = 0
      }
    })
  }

  /**
   * Reconfigure touch controls when interaction mode changes
   */
  private reconfigureTouchControls(): void {
    // Remove existing event listeners
    this.scene.input.removeAllListeners()
    
    // Re-setup with current configuration
    this.setupGlobalEventHandlers()
  }

  /**
   * Set cell interaction callbacks
   */
  setCellCallbacks(callbacks: CellInteractionCallbacks): void {
    this.cellCallbacks = { ...this.cellCallbacks, ...callbacks }
  }

  /**
   * Set global interaction callbacks
   */
  setGlobalCallbacks(callbacks: GlobalInteractionCallbacks): void {
    this.globalCallbacks = { ...this.globalCallbacks, ...callbacks }
  }

  /**
   * Get current interaction state
   */
  getState(): InteractionState {
    return { ...this.state }
  }

  /**
   * Get current pan state
   */
  getPanState(): PanState {
    return { ...this.panState }
  }

  /**
   * Check if currently panning
   */
  isPanning(): boolean {
    return this.panState.isPanning
  }

  /**
   * Check if currently painting
   */
  isPainting(): boolean {
    return this.state.isPainting
  }

  /**
   * Get current paint mode
   */
  getPaintMode(): PaintMode {
    return this.state.paintMode
  }

  /**
   * Force stop painting mode
   */
  stopPainting(): void {
    this.state.isMouseDown = false
    this.state.isPainting = false
    this.state.paintMode = null
  }

  /**
   * Set selected defect type
   */
  setSelectedDefectType(defectType: DefectType): void {
    this.state.selectedDefectType = defectType
  }

  /**
   * Get selected defect type
   */
  getSelectedDefectType(): DefectType {
    return this.state.selectedDefectType
  }

  /**
   * Enable/disable edit mode
   */
  setEditMode(enabled: boolean): void {
    this.state.editMode = enabled
    this.reconfigureTouchControls()
  }

  /**
   * Set application mode
   */
  setAppMode(mode: AppMode): void {
    this.state.appMode = mode
    this.reconfigureTouchControls()
  }

  /**
   * Clean up event listeners and resources
   */
  destroy(): void {
    this.scene.input.removeAllListeners()
    this.selectedCells.clear()
    this.cellDefectTypes.clear()
    this.cellCallbacks = {}
    this.globalCallbacks = {}
    this.annotationManager = undefined
  }
}
