import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../../types/beam'
import { DefectType, DEFECT_STYLES } from '../../types/defects'

export interface GridDimensions {
  startX: number
  centerY: number
  width: number
  gridSize: number
  beamLength: number
}

export interface GridSystemConfig {
  showTopFlange: boolean
  editMode: boolean
  appMode: 'edit' | 'annotation' | 'view'
  showGrid: boolean
}

/**
 * Simplified GridSystem focused on core functionality
 */
export class GridSystem {
  private scene: Phaser.Scene
  private beamProfile: BeamProfile | null = null
  private gridContainer: Phaser.GameObjects.Container | null = null
  
  // Core state
  private selectedCells: Set<string> = new Set()
  private gridCells: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private cellDefectTypes: Map<string, DefectType> = new Map()
  
  // Drag painting state
  private isDragging: boolean = false
  private dragStartCell: string | null = null
  private dragAction: 'select' | 'deselect' | null = null
  private lastDraggedCell: string | null = null
  
  // Configuration
  private config: GridSystemConfig = {
    showTopFlange: true,
    editMode: true,
    appMode: 'edit',
    showGrid: true
  }
  
  // Callbacks
  private onCellChangeCallback?: (cells: GridCell[]) => void
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Initialize the grid system
   */
  initialize(beamProfile: BeamProfile, config: Partial<GridSystemConfig> = {}): void {
    console.log('[GridSystem] Initializing with config:', config)
    this.beamProfile = beamProfile
    this.config = { ...this.config, ...config }
    
    // Create grid container
    if (!this.gridContainer) {
      this.gridContainer = this.scene.add.container()
      this.gridContainer.setDepth(100)
    }
    
    // Set up global mouse events for drag painting
    this.setupGlobalMouseEvents()
  }

  /**
   * Set up global mouse events for drag painting
   */
  private setupGlobalMouseEvents(): void {
    // Listen for mouse up on the scene to end drag painting
    this.scene.input.on('pointerup', () => {
      this.endDragPainting()
    })
    
    // Listen for mouse up outside the scene to end drag painting
    this.scene.input.on('pointerupoutside', () => {
      this.endDragPainting()
    })
  }

  /**
   * End drag painting and reset state
   */
  private endDragPainting(): void {
    if (this.isDragging) {
      console.log('[GridSystem] Ending drag painting')
      this.isDragging = false
      this.dragStartCell = null
      this.dragAction = null
      this.lastDraggedCell = null
      
      // Notify cell change after drag ends to trigger contour redraw
      this.notifyCellChange()
    }
  }

  /**
   * Check if currently dragging
   */
  getIsDragging(): boolean {
    return this.isDragging
  }

  /**
   * Create the grid overlay
   */
  createGrid(dimensions: GridDimensions): void {
    console.log('[GridSystem] Creating grid with dimensions:', dimensions)
    if (!this.beamProfile || !this.gridContainer) {
      console.warn('GridSystem: Cannot create grid without beam profile and container')
      return
    }

    // Clear existing grid
    this.clearGrid()

    const { startX, centerY, gridSize, beamLength } = dimensions
    const { webHeight, flangeThickness } = this.beamProfile
    
    // Calculate beam section boundaries
    const webTop = centerY - (webHeight * gridSize) / 2
    const webBottom = centerY + (webHeight * gridSize) / 2
    const flangeTop = webTop - flangeThickness * gridSize
    
    // Calculate grid dimensions
    const cols = Math.ceil(beamLength)
    const webRows = Math.ceil(webHeight)
    
    // Create web grid (2D)
    this.createWebGrid(startX, webTop, webBottom, gridSize, cols, webRows)
    
    // Create flange grids (1D linear)
    if (this.config.showTopFlange) {
      this.createFlangeGrid(startX, flangeTop, gridSize, cols, 'flange-top')
    }
    this.createFlangeGrid(startX, webBottom, gridSize, cols, 'flange-bottom')
    
    // Make grid visible
    this.setVisible(this.config.showGrid)
    console.log('[GridSystem] Grid created with', this.gridCells.size, 'cells')
  }

  /**
   * Create the web section grid (2D rectangular grid)
   */
  private createWebGrid(startX: number, webTop: number, webBottom: number, gridSize: number, cols: number, webRows: number): void {
    for (let row = 0; row < webRows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gridSize
        const y = webBottom - (row + 1) * gridSize
        
        // Calculate cell height - truncate if it extends above web top
        let cellHeight = gridSize
        let cellY = y
        
        if (y < webTop) {
          cellHeight = y + gridSize - webTop
          cellY = webTop
          if (cellHeight <= 0) continue
        }
        
        this.createGridCell(x, cellY, col, row, 'web', false, cellHeight)
      }
    }
  }

  /**
   * Create a flange grid (1D linear grid)
   */
  private createFlangeGrid(startX: number, flangeY: number, gridSize: number, cols: number, zone: 'flange-top' | 'flange-bottom'): void {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * gridSize
      this.createGridCell(x, flangeY, col, 0, zone, true)
    }
  }

  /**
   * Create a single grid cell
   */
  private createGridCell(x: number, y: number, col: number, row: number, zone: 'web' | 'flange-top' | 'flange-bottom', isLinear: boolean = false, customHeight?: number): void {
    if (!this.beamProfile || !this.gridContainer) return

    const height = customHeight !== undefined ? customHeight - 1 : 
                  (isLinear ? this.beamProfile.flangeThickness * 30 - 1 : 30 - 1)
    
    const cell = this.scene.add.rectangle(
      x + 30 / 2,
      y + height / 2,
      30 - 1,
      height,
      0xB8E6B8, // Pastel green
      0.3
    )
    
    cell.setStrokeStyle(1, 0x4A7C4A, 0.8) // Darker green border
    cell.setInteractive()
    cell.setDepth(10)
    
    // Store cell data
    cell.setData('col', col)
    cell.setData('row', row)
    cell.setData('zone', zone)
    cell.setData('isLinear', isLinear)
    
    // Create zone info
    const key = `${zone}_${col}_${row}`
    
    this.gridCells.set(key, cell)
    this.gridContainer.add(cell)
    
    // Set up interaction
    this.setupCellInteraction(cell)
  }

  /**
   * Set up mouse/touch interaction for a grid cell
   */
  private setupCellInteraction(cell: Phaser.GameObjects.Rectangle): void {
    cell.on('pointerdown', () => {
      if (!this.config.editMode) return
      
      const zone = cell.getData('zone') || 'web'
      const col = cell.getData('col')
      const row = cell.getData('row')
      const key = `${zone}_${col}_${row}`
      
      // Start drag painting
      this.isDragging = true
      this.dragStartCell = key
      this.lastDraggedCell = key
      
      // Determine drag action based on current cell state
      if (this.selectedCells.has(key)) {
        this.dragAction = 'deselect'
      } else {
        this.dragAction = 'select'
      }
      
      // Apply the action to the initial cell
      if (this.dragAction === 'select') {
        this.selectCell(key)
      } else {
        this.deselectCell(key)
      }
    })

    cell.on('pointerover', () => {
      if (!this.config.editMode) return
      
      const zone = cell.getData('zone') || 'web'
      const col = cell.getData('col')
      const row = cell.getData('row')
      const key = `${zone}_${col}_${row}`
      
      // Handle drag painting
      if (this.isDragging && this.dragAction && key !== this.lastDraggedCell) {
        this.lastDraggedCell = key
        
        if (this.dragAction === 'select' && !this.selectedCells.has(key)) {
          this.selectCell(key)
        } else if (this.dragAction === 'deselect' && this.selectedCells.has(key)) {
          this.deselectCell(key)
        }
      }
    })
  }

  /**
   * Select a grid cell
   */
  selectCell(key: string, defectType: DefectType = 'section-loss'): void {
    console.log(`[GridSystem] Selecting cell: ${key} with defect type: ${defectType}`)
    this.selectedCells.add(key)
    this.cellDefectTypes.set(key, defectType)
    
    const cell = this.gridCells.get(key)
    if (cell) {
      console.log(`[GridSystem] Updating cell appearance for: ${key}`)
      this.updateCellAppearance(cell, key)
    } else {
      console.warn(`[GridSystem] Cell not found for key: ${key}`)
    }
    
    this.notifyCellChange()
  }

  /**
   * Deselect a grid cell
   */
  deselectCell(key: string): void {
    console.log(`[GridSystem] Deselecting cell: ${key}`)
    this.selectedCells.delete(key)
    this.cellDefectTypes.delete(key)
    
    const cell = this.gridCells.get(key)
    if (cell) {
      console.log(`[GridSystem] Resetting cell appearance for: ${key} to pastel green`)
      cell.setFillStyle(0xB8E6B8, 0.3) // Pastel green
      cell.setStrokeStyle(1, 0x4A7C4A, 0.8) // Darker green border
    } else {
      console.warn(`[GridSystem] Cell not found for key: ${key}`)
    }
    
    this.notifyCellChange()
  }

  /**
   * Update cell appearance based on selection state
   */
  private updateCellAppearance(cell: Phaser.GameObjects.Rectangle, key: string): void {
    const defectType = this.cellDefectTypes.get(key) || 'section-loss'
    const style = DEFECT_STYLES[defectType] || DEFECT_STYLES['section-loss']
    console.log(`[GridSystem] Setting cell ${key} to ${defectType} style:`, style)
    cell.setFillStyle(style.fillColor, style.fillAlpha)
    cell.setStrokeStyle(style.strokeWidth, style.strokeColor, style.strokeAlpha)
  }

  /**
   * Get all selected cells as GridCell objects
   */
  getSelectedCells(): GridCell[] {
    const cells: GridCell[] = []
    
    this.selectedCells.forEach(key => {
      const parts = key.split('_')
      if (parts.length === 3) {
        const [zone, col, row] = parts
        const defectType = this.cellDefectTypes.get(key)
        
        cells.push({
          x: parseInt(col),
          y: parseInt(row),
          selected: true,
          zone: zone as 'web' | 'flange-top' | 'flange-bottom',
          defectType: defectType || 'section-loss'
        })
      }
    })
    
    return cells
  }

  /**
   * Set selected cells from GridCell array
   */
  setSelectedCells(cells: GridCell[]): void {
    this.selectedCells.clear()
    this.cellDefectTypes.clear()
    
    cells.forEach(cell => {
      const key = `${cell.zone}_${cell.x}_${cell.y}`
      this.selectCell(key, cell.defectType || 'section-loss')
    })
  }

  /**
   * Update grid configuration
   */
  updateConfig(config: Partial<GridSystemConfig>): void {
    this.config = { ...this.config, ...config }
    this.setVisible(this.config.showGrid)
  }

  /**
   * Set grid visibility
   */
  setVisible(visible: boolean): void {
    if (this.gridContainer) {
      this.gridContainer.setVisible(visible)
    }
  }

  /**
   * Clear all grid cells
   */
  clearGrid(): void {
    this.gridCells.forEach(cell => {
      if (this.gridContainer) {
        this.gridContainer.remove(cell)
      }
    })
    this.gridCells.clear()
  }

  /**
   * Set up cell change callback
   */
  onCellChange(callback: (cells: GridCell[]) => void): void {
    this.onCellChangeCallback = callback
  }

  /**
   * Notify of cell changes
   */
  private notifyCellChange(): void {
    if (this.onCellChangeCallback) {
      const cells = this.getSelectedCells()
      this.onCellChangeCallback(cells)
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    console.log('[GridSystem] Destroying grid system')
    
    // Remove global mouse event listeners
    this.scene.input.off('pointerup')
    this.scene.input.off('pointerupoutside')
    
    // Clear all cells
    this.clearGrid()
    
    // Destroy container
    if (this.gridContainer) {
      this.gridContainer.destroy()
      this.gridContainer = null
    }
    
    // Clear state
    this.selectedCells.clear()
    this.cellDefectTypes.clear()
    this.isDragging = false
    this.dragStartCell = null
    this.dragAction = null
    this.lastDraggedCell = null
    this.beamProfile = null
  }
}
