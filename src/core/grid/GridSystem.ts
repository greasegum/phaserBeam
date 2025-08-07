import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../../types/beam'
import { DefectType } from '../../types/defects'

export interface GridDimensions {
  startX: number
  centerY: number
  width: number
  gridSize: number
  beamLength: number
}

export interface GridZone {
  key: string
  zone: 'web' | 'flange-top' | 'flange-bottom'
  col: number
  row: number
  x: number
  y: number
  width: number
  height: number
  isLinear: boolean
}

export interface GridSystemConfig {
  showTopFlange: boolean
  editMode: boolean
  appMode: 'edit' | 'annotation' | 'view'
  showGrid: boolean
}

/**
 * GridSystem manages the interactive grid overlay for beam inspection
 * Extracted from BeamElevationScene to improve maintainability and testability
 */
export class GridSystem {
  private scene: Phaser.Scene
  private beamProfile: BeamProfile | null = null
  private gridContainer: Phaser.GameObjects.Container | null = null
  private currentGridSize: number = 30 // Store current grid size
  
  // Grid state
  private selectedCells: Set<string> = new Set()
  private gridCells: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private cellDefectTypes: Map<string, DefectType> = new Map()
  private zones: Map<string, GridZone> = new Map()
  
  // Configuration
  private config: GridSystemConfig = {
    showTopFlange: true,
    editMode: true,
    appMode: 'edit',
    showGrid: true
  }
  
  // Callbacks
  private onCellChangeCallback?: (cells: GridCell[]) => void
  private onCellInteractionCallback?: (key: string, action: 'select' | 'deselect') => void
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Initialize the grid system with a beam profile
   */
  initialize(beamProfile: BeamProfile, config: Partial<GridSystemConfig> = {}): void {
    console.log('[GridSystem] Initializing with config:', config)
    this.beamProfile = beamProfile
    this.config = { ...this.config, ...config }
    
    // Create grid container if it doesn't exist
    if (!this.gridContainer) {
      this.gridContainer = this.scene.add.container()
      this.gridContainer.setDepth(100) // High depth to ensure visibility
      console.log('[GridSystem] Created grid container with depth 100')
    }
    console.log('[GridSystem] Final config:', this.config)
  }

  /**
   * Create the grid overlay based on beam dimensions
   */
  createGrid(dimensions: GridDimensions): void {
    console.log('[GridSystem] createGrid called with dimensions:', dimensions)
    if (!this.beamProfile || !this.gridContainer) {
      console.warn('GridSystem: Cannot create grid without beam profile and container')
      return
    }

    // Store current selected cells before clearing
    const previouslySelected = new Set(this.selectedCells)
    const previousDefectTypes = new Map(this.cellDefectTypes)
    
    // Clear existing grid (but not selection state)
    this.clearGrid()

    const { startX, centerY, gridSize, beamLength } = dimensions
    const { webHeight, flangeThickness } = this.beamProfile
    
    console.log('[GridSystem] Creating grid with profile:', { webHeight, flangeThickness })
    
    // Store the grid size for use in cell creation
    this.currentGridSize = gridSize
    
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
    
    // Make grid visible if configured
    const shouldShow = this.shouldShowGrid()
    console.log('[GridSystem] Should show grid:', shouldShow, 'Config:', this.config)
    this.setVisible(shouldShow)
    console.log('[GridSystem] Grid created with', this.gridCells.size, 'cells')
    
    // Restore previously selected cells
    previouslySelected.forEach(key => {
      if (this.gridCells.has(key)) {
        this.selectedCells.add(key)
        const defectType = previousDefectTypes.get(key) || 'section-loss'
        this.cellDefectTypes.set(key, defectType)
        const cell = this.gridCells.get(key)
        if (cell) {
          this.updateCellAppearance(cell, key)
        }
      }
    })
    
    if (previouslySelected.size > 0) {
      console.log('[GridSystem] Restored', this.selectedCells.size, 'selected cells')
    }
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
          // Cell extends above web top - truncate it
          cellHeight = y + gridSize - webTop
          cellY = webTop
          if (cellHeight <= 0) continue // Skip cells completely above the web
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
   * Create an individual grid cell
   */
  private createGridCell(x: number, y: number, col: number, row: number, zone: 'web' | 'flange-top' | 'flange-bottom', isLinear: boolean = false, customHeight?: number): void {
    if (!this.beamProfile || !this.gridContainer) return

    const height = customHeight !== undefined ? customHeight - 1 : 
                  (isLinear ? this.beamProfile.flangeThickness * this.currentGridSize - 1 : this.currentGridSize - 1)
    
    const cell = this.scene.add.rectangle(
      x + this.currentGridSize / 2,
      y + height / 2,
      this.currentGridSize - 1, // 1px gap between cells
      height,
      0xffffff,
      0.05  // Very subtle fill
    )
    
    cell.setStrokeStyle(1, 0x999999, 0.8) // More visible stroke
    cell.setInteractive()
    cell.setDepth(10) // Relative depth within container
    
    // Store cell data
    cell.setData('col', col)
    cell.setData('row', row)
    cell.setData('zone', zone)
    cell.setData('isLinear', isLinear)
    
    // Create zone info
    const key = `${zone}_${col}_${row}`
    const zoneInfo: GridZone = {
      key,
      zone,
      col,
      row,
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height,
      isLinear
    }
    
    this.gridCells.set(key, cell)
    this.zones.set(key, zoneInfo)
    this.gridContainer.add(cell)
    
    // Restore selected state if cell was previously selected
    if (this.selectedCells.has(key)) {
      this.updateCellAppearance(cell, key)
    }
    
    // Set up interaction
    this.setupCellInteraction(cell)
  }

  /**
   * Set up mouse/touch interaction for a grid cell
   */
  private setupCellInteraction(cell: Phaser.GameObjects.Rectangle): void {
    cell.on('pointerdown', () => {
      console.log(`[GridSystem] Cell clicked, editMode: ${this.config.editMode}`)
      if (!this.config.editMode) {
        console.log(`[GridSystem] Not in edit mode, ignoring click`)
        return
      }
      
      const zone = cell.getData('zone') || 'web'
      const col = cell.getData('col')
      const row = cell.getData('row')
      const key = `${zone}_${col}_${row}`
      
      console.log(`[GridSystem] Cell interaction: ${key}, currently selected: ${this.selectedCells.has(key)}`)
      
      // Toggle cell selection
      if (this.selectedCells.has(key)) {
        this.deselectCell(key)
      } else {
        this.selectCell(key)
      }
      
      // Call interaction callback if provided
      this.onCellInteractionCallback?.(key, this.selectedCells.has(key) ? 'select' : 'deselect')
      // Note: notifyCellChange is already called inside selectCell/deselectCell
    })

    cell.on('pointerover', () => {
      if (!this.config.editMode) return
      
      const zone = cell.getData('zone') || 'web'
      const col = cell.getData('col')
      const row = cell.getData('row')
      const key = `${zone}_${col}_${row}`
      
      if (!this.selectedCells.has(key)) {
        cell.setFillStyle(0xeeeeee, 0.15) // Subtle hover effect
      }
    })

    cell.on('pointerout', () => {
      if (!this.config.editMode) return
      
      const zone = cell.getData('zone') || 'web'
      const col = cell.getData('col')
      const row = cell.getData('row')
      const key = `${zone}_${col}_${row}`
      
      if (!this.selectedCells.has(key)) {
        cell.setFillStyle(0xffffff, 0.05) // Reset to default subtle fill
      } else {
        // Restore selected cell appearance
        this.updateCellAppearance(cell, key)
      }
    })
  }

  /**
   * Select a grid cell
   */
  selectCell(key: string, defectType: DefectType = 'section-loss'): void {
    console.log(`[GridSystem] Selecting cell: ${key}, defectType: ${defectType}`)
    this.selectedCells.add(key)
    this.cellDefectTypes.set(key, defectType)
    
    const cell = this.gridCells.get(key)
    if (cell) {
      console.log(`[GridSystem] Updating appearance for cell: ${key}`)
      this.updateCellAppearance(cell, key)
    } else {
      console.warn(`[GridSystem] Cell not found: ${key}`)
    }
    
    console.log(`[GridSystem] Total selected cells: ${this.selectedCells.size}`)
    
    // Notify of change
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
      cell.setFillStyle(0xffffff, 0.05) // Reset to default subtle fill
    }
    
    // Notify of change
    this.notifyCellChange()
  }

  /**
   * Clear all selected cells
   */
  clearSelection(): void {
    this.selectedCells.forEach(key => {
      const cell = this.gridCells.get(key)
      if (cell) {
        cell.setFillStyle(0xffffff, 0.1)
      }
    })
    
    this.selectedCells.clear()
    this.cellDefectTypes.clear()
    this.notifyCellChange()
  }

  /**
   * Update the visual appearance of a selected cell based on its defect type
   */
  private updateCellAppearance(cell: Phaser.GameObjects.Rectangle, key: string): void {
    const defectType = this.cellDefectTypes.get(key) || 'section-loss'
    
    // TODO: Import DEFECT_STYLES from types/defects and use proper styling
    const defectColors: Record<string, number> = {
      'section-loss': 0xFFB3D9,
      'hole': 0xFFFFFF
    }
    
    const color = defectColors[defectType] || defectColors['section-loss']
    cell.setFillStyle(color, 0.3)
  }

  /**
   * Get all selected cells as GridCell objects
   */
  getSelectedCells(): GridCell[] {
    const cells: GridCell[] = []
    
    this.selectedCells.forEach(key => {
      const zone = this.zones.get(key)
      const defectType = this.cellDefectTypes.get(key)
      
      if (zone) {
        cells.push({
          x: zone.col,
          y: zone.row,
          selected: true,
          zone: zone.zone,
          defectType: defectType || 'section-loss'
        })
      }
    })
    
    return cells
  }

  /**
   * Set selected cells from GridCell array (for restoring state)
   */
  setSelectedCells(cells: GridCell[]): void {
    this.clearSelection()
    
    cells.forEach(cell => {
      const key = `${cell.zone || 'web'}_${cell.x}_${cell.y}`
      this.selectCell(key, cell.defectType || 'section-loss')
    })
    
    this.notifyCellChange()
  }

  /**
   * Get grid dimensions and statistics
   */
  getGridInfo(): { totalCells: number; selectedCells: number; zones: string[] } {
    const zones = new Set<string>()
    this.zones.forEach(zone => zones.add(zone.zone))
    
    return {
      totalCells: this.gridCells.size,
      selectedCells: this.selectedCells.size,
      zones: Array.from(zones)
    }
  }

  /**
   * Update grid configuration
   */
  updateConfig(config: Partial<GridSystemConfig>): void {
    this.config = { ...this.config, ...config }
    this.setVisible(this.shouldShowGrid())
  }

  /**
   * Determine if grid should be visible based on current configuration
   */
  private shouldShowGrid(): boolean {
    return (this.config.editMode || this.config.appMode === 'annotation') && this.config.showGrid
  }

  /**
   * Set grid visibility
   */
  setVisible(visible: boolean): void {
    console.log('[GridSystem] setVisible called with:', visible)
    if (this.gridContainer) {
      this.gridContainer.setVisible(visible)
      console.log('[GridSystem] Grid container visibility set to:', visible)
      // Also ensure container has proper depth
      this.gridContainer.setDepth(100)
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
      cell.destroy()
    })
    
    this.gridCells.clear()
    this.zones.clear()
  }

  /**
   * Update cell visibility based on selection state
   */
  updateCellVisibility(): void {
    this.gridCells.forEach((cell, key) => {
      if (this.selectedCells.has(key)) {
        // Hide stroke for selected cells (section loss areas)
        cell.setStrokeStyle(0, 0xcccccc, 0)
      } else {
        // Show stroke for non-selected cells
        cell.setStrokeStyle(0.5, 0xcccccc, 0.5)
      }
    })
  }

  /**
   * Get snap points for annotation system
   */
  getSnapPoints(): { x: number; y: number; width: number; height: number }[] {
    const snapPoints: { x: number; y: number; width: number; height: number }[] = []
    
    this.gridCells.forEach(cell => {
      snapPoints.push({
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height
      })
    })
    
    return snapPoints
  }

  /**
   * Set callback for cell selection changes
   */
  onCellChange(callback: (cells: GridCell[]) => void): void {
    this.onCellChangeCallback = callback
  }

  /**
   * Set callback for individual cell interactions
   */
  onCellInteraction(callback: (key: string, action: 'select' | 'deselect') => void): void {
    this.onCellInteractionCallback = callback
  }

  /**
   * Notify listeners of cell changes
   */
  private notifyCellChange(): void {
    console.log(`[GridSystem] notifyCellChange called, callback exists: ${!!this.onCellChangeCallback}`)
    if (this.onCellChangeCallback) {
      const cells = this.getSelectedCells()
      console.log(`[GridSystem] Notifying with ${cells.length} cells`)
      this.onCellChangeCallback(cells)
    }
  }

  /**
   * Destroy the grid system and clean up resources
   */
  destroy(): void {
    this.clearGrid()
    
    if (this.gridContainer) {
      this.gridContainer.destroy()
      this.gridContainer = null
    }
    
    this.selectedCells.clear()
    this.cellDefectTypes.clear()
    this.zones.clear()
  }
}
