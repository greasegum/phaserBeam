/**
 * Refactored Beam Elevation Scene
 * Focused on rendering and interaction, delegating complex logic
 */

import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { ContourConfig } from '../types/contourConfig'
import { marchingSquares } from '../utils/marchingSquares'
import { processContours, transformToScreen } from '../utils/contourProcessing'

export class BeamElevationSceneRefactored extends Phaser.Scene {
  // Core properties
  private beamProfile: BeamProfile | null = null
  private beamLength = 120 // inches
  private gridSize = 30 // pixels per inch
  
  // Grid data
  private selectedCells = new Set<string>()
  private webGrid: number[][] = []
  
  // Configuration
  private contourConfig: ContourConfig = {
    core: { threshold: 0.5, cellSize: 1 },
    smoothing: { enabled: false, strength: 0.5 },  // Disable smoothing for now
    edges: { clampToBeam: false, bufferSize: 0 },  // Edge clamping is handled in marching squares
    separation: { enabled: true, minDistance: 0.5 }
  }
  
  // Graphics objects
  private beamGraphics: Phaser.GameObjects.Graphics | null = null
  private lossGraphics: Phaser.GameObjects.Graphics | null = null
  private gridGraphics: Phaser.GameObjects.Graphics | null = null
  
  // UI state
  private showGrid = true
  private editMode = true
  
  // Callbacks
  private onCellChange?: (cells: GridCell[]) => void

  constructor() {
    super({ key: 'BeamElevationSceneRefactored' })
  }

  init(data: {
    beamProfile: BeamProfile
    beamLength?: number
    gridCells?: GridCell[]
    onCellChange?: (cells: GridCell[]) => void
  }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.onCellChange = data.onCellChange
    
    // Initialize cells
    this.selectedCells.clear()
    if (data.gridCells) {
      data.gridCells.forEach(cell => {
        this.selectedCells.add(this.getCellKey(cell))
      })
    }
  }

  create() {
    if (!this.beamProfile) return
    
    // Initialize graphics
    this.beamGraphics = this.add.graphics()
    this.lossGraphics = this.add.graphics()
    this.gridGraphics = this.add.graphics()
    
    // Set up camera
    const totalWidth = this.beamLength * this.gridSize + 200
    const totalHeight = 600
    this.cameras.main.setBounds(0, 0, totalWidth, totalHeight)
    
    // Initialize grid
    this.initializeGrid()
    
    // Set up interaction if in edit mode
    if (this.editMode) {
      this.setupInteraction()
    }
    
    // Initial render
    this.render()
  }

  /**
   * Initialize the web grid based on beam dimensions
   */
  private initializeGrid(): void {
    if (!this.beamProfile) return
    
    const cols = Math.ceil(this.beamLength)
    const rows = Math.ceil(this.beamProfile.webHeight)
    
    this.webGrid = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    // Fill grid based on selected cells
    this.selectedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      if (y >= 0 && y < rows && x >= 0 && x < cols) {
        this.webGrid[y][x] = 1
      }
    })
  }

  /**
   * Set up mouse/touch interaction
   */
  private setupInteraction(): void {
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
  }

  /**
   * Main render method
   */
  private render(): void {
    if (!this.beamProfile) return
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    
    // Clear previous graphics
    this.beamGraphics?.clear()
    this.lossGraphics?.clear()
    this.gridGraphics?.clear()
    
    // Draw beam outline
    this.drawBeamOutline(centerX, centerY)
    
    // Draw grid if enabled
    if (this.showGrid) {
      this.drawGrid(centerX, centerY)
    }
    
    // Draw section loss
    this.drawSectionLoss(centerX, centerY)
  }

  /**
   * Draw beam outline
   */
  private drawBeamOutline(centerX: number, centerY: number): void {
    if (!this.beamGraphics || !this.beamProfile) return
    
    const { webHeight, flangeThickness } = this.beamProfile
    const width = this.beamLength * this.gridSize
    const webPixelHeight = webHeight * this.gridSize
    const flangePixelHeight = flangeThickness * this.gridSize
    
    this.beamGraphics.lineStyle(2, 0x333333, 1)
    
    // Web
    const webTop = centerY - webPixelHeight / 2
    const webBottom = centerY + webPixelHeight / 2
    this.beamGraphics.strokeRect(centerX, webTop, width, webPixelHeight)
    
    // Flanges
    this.beamGraphics.fillStyle(0x666666, 0.3)
    this.beamGraphics.fillRect(centerX, webTop - flangePixelHeight, width, flangePixelHeight)
    this.beamGraphics.fillRect(centerX, webBottom, width, flangePixelHeight)
    
    this.beamGraphics.strokeRect(centerX, webTop - flangePixelHeight, width, flangePixelHeight)
    this.beamGraphics.strokeRect(centerX, webBottom, width, flangePixelHeight)
  }

  /**
   * Draw grid overlay
   */
  private drawGrid(centerX: number, centerY: number): void {
    if (!this.gridGraphics || !this.beamProfile) return
    
    const { webHeight } = this.beamProfile
    const webPixelHeight = webHeight * this.gridSize
    const webTop = centerY - webPixelHeight / 2
    
    this.gridGraphics.lineStyle(1, 0xcccccc, 0.3)
    
    // Vertical lines
    for (let i = 0; i <= this.beamLength; i++) {
      const x = centerX + i * this.gridSize
      this.gridGraphics.moveTo(x, webTop)
      this.gridGraphics.lineTo(x, webTop + webPixelHeight)
    }
    
    // Horizontal lines
    for (let j = 0; j <= webHeight; j++) {
      const y = webTop + j * this.gridSize
      this.gridGraphics.moveTo(centerX, y)
      this.gridGraphics.lineTo(centerX + this.beamLength * this.gridSize, y)
    }
    
    this.gridGraphics.strokePath()
  }

  /**
   * Draw section loss using marching squares
   */
  private drawSectionLoss(centerX: number, centerY: number): void {
    if (!this.lossGraphics || !this.beamProfile || this.webGrid.length === 0) return
    
    // Run marching squares with proper options to ensure grid alignment
    const contours = marchingSquares(this.webGrid, {
      // Core settings for perfect grid alignment
      threshold: this.contourConfig.core.threshold,
      interpolationMethod: 'none',
      offsetX: 0,
      offsetY: 0,
      bufferSize: 0,
      bufferValue: 0,
      
      // Edge clamping settings - aggressive for perfect alignment
      clampToGrid: true,
      edgeSnapping: true,
      edgeDetectionEnabled: true,
      edgeDetectionThreshold: 0.01,  // Very sensitive edge detection
      edgeClampDistance: 1.0,  // Clamp points within 1 grid unit of edge
      
      // Disable smoothing for now
      smoothing: false,
      
      // Keep alignment on edges
      alignmentMode: 'edges'
    })
    
    // Process contours with grid bounds
    const bounds = {
      width: this.webGrid[0].length,
      height: this.webGrid.length
    }
    const processed = processContours(
      contours,
      this.contourConfig,
      bounds
    )
    
    // Transform to screen coordinates
    const { webHeight } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const screenContours = transformToScreen(
      processed,
      { x: centerX, y: webTop + webHeight * this.gridSize },
      this.gridSize,
      true // Flip Y for screen coordinates
    )
    
    // Draw contours
    this.lossGraphics.lineStyle(2, 0xff0000, 1)
    this.lossGraphics.fillStyle(0xffb3ba, 0.8)
    
    screenContours.forEach(contour => {
      if (contour.length < 3) return
      
      this.lossGraphics.beginPath()
      this.lossGraphics.moveTo(contour[0].x, contour[0].y)
      
      for (let i = 1; i < contour.length; i++) {
        this.lossGraphics.lineTo(contour[i].x, contour[i].y)
      }
      
      this.lossGraphics.closePath()
      this.lossGraphics.fillPath()
      this.lossGraphics.strokePath()
    })
  }

  /**
   * Handle pointer down
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.editMode || !this.beamProfile) return
    
    const cell = this.screenToGrid(pointer.x, pointer.y)
    if (cell) {
      this.toggleCell(cell)
    }
  }

  /**
   * Handle pointer move
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.editMode || !pointer.isDown || !this.beamProfile) return
    
    const cell = this.screenToGrid(pointer.x, pointer.y)
    if (cell) {
      this.selectCell(cell)
    }
  }

  /**
   * Handle pointer up
   */
  private handlePointerUp(): void {
    // Could trigger save or other actions here
  }

  /**
   * Convert screen coordinates to grid cell
   */
  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } | null {
    if (!this.beamProfile) return null
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    const { webHeight } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    
    const gridX = Math.floor((screenX - centerX) / this.gridSize)
    const gridY = Math.floor((screenY - webTop) / this.gridSize)
    
    if (gridX >= 0 && gridX < this.beamLength && gridY >= 0 && gridY < webHeight) {
      return { x: gridX, y: gridY }
    }
    
    return null
  }

  /**
   * Toggle cell selection
   */
  private toggleCell(cell: { x: number; y: number }): void {
    const key = this.getCellKey(cell)
    
    if (this.selectedCells.has(key)) {
      this.selectedCells.delete(key)
      this.webGrid[cell.y][cell.x] = 0
    } else {
      this.selectedCells.add(key)
      this.webGrid[cell.y][cell.x] = 1
    }
    
    this.render()
    this.notifyCellChange()
  }

  /**
   * Select a cell
   */
  private selectCell(cell: { x: number; y: number }): void {
    const key = this.getCellKey(cell)
    
    if (!this.selectedCells.has(key)) {
      this.selectedCells.add(key)
      this.webGrid[cell.y][cell.x] = 1
      this.render()
      this.notifyCellChange()
    }
  }

  /**
   * Get cell key for Set storage
   */
  private getCellKey(cell: { x: number; y: number }): string {
    return `${cell.x},${cell.y}`
  }

  /**
   * Notify parent of cell changes
   */
  private notifyCellChange(): void {
    if (!this.onCellChange) return
    
    const cells: GridCell[] = []
    this.selectedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      cells.push({ x, y, zone: 'web' })
    })
    
    this.onCellChange(cells)
  }

  // Public API methods

  /**
   * Update contour configuration
   */
  public setContourConfig(config: Partial<ContourConfig>): void {
    this.contourConfig = {
      core: { ...this.contourConfig.core, ...config.core },
      smoothing: { ...this.contourConfig.smoothing, ...config.smoothing },
      edges: { ...this.contourConfig.edges, ...config.edges },
      separation: { ...this.contourConfig.separation, ...config.separation }
    }
    this.render()
  }

  /**
   * Toggle grid visibility
   */
  public setShowGrid(show: boolean): void {
    this.showGrid = show
    this.render()
  }

  /**
   * Toggle edit mode
   */
  public setEditMode(enabled: boolean): void {
    this.editMode = enabled
  }
}