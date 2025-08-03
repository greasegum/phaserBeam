/**
 * Professional beam elevation scene
 * Clean separation of concerns with the marching squares engine
 */

import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { MarchingSquaresEngine } from '../core/engine/MarchingSquaresEngine'
import { MarchingSquaresConfig, CONFIG_PRESETS } from '../core/configuration/MarchingSquaresConfig'
import { GridData, ProcessingResult } from '../core/types/geometry'

export interface SceneConfig {
  beamProfile: BeamProfile
  beamLength?: number
  gridCells?: GridCell[]
  editMode?: boolean
  showGrid?: boolean
  marchingSquaresConfig?: MarchingSquaresConfig
  onCellChange?: (cells: GridCell[]) => void
  onConfigChange?: (config: MarchingSquaresConfig) => void
}

export class ProfessionalBeamScene extends Phaser.Scene {
  // Configuration
  private config: SceneConfig
  private msEngine: MarchingSquaresEngine
  private msConfig: MarchingSquaresConfig
  
  // Grid data
  private gridData: GridData | null = null
  private selectedCells = new Set<string>()
  
  // Graphics layers
  private layers = {
    beam: null as Phaser.GameObjects.Graphics | null,
    grid: null as Phaser.GameObjects.Graphics | null,
    contours: null as Phaser.GameObjects.Graphics | null,
    selection: null as Phaser.GameObjects.Graphics | null
  }
  
  // Interaction state
  private isDrawing = false
  private lastProcessingResult: ProcessingResult | null = null
  
  // Constants
  private readonly GRID_SIZE = 30 // pixels per inch
  private readonly COLORS = {
    beam: 0x333333,
    flange: 0x666666,
    grid: 0xcccccc,
    contour: 0xff0000,
    contourFill: 0xffb3ba,
    selection: 0x0080ff
  }
  
  constructor() {
    super({ key: 'ProfessionalBeamScene' })
  }
  
  init(config: SceneConfig) {
    this.config = config
    this.msConfig = config.marchingSquaresConfig || CONFIG_PRESETS.default
    this.msEngine = new MarchingSquaresEngine(this.msConfig)
    
    // Initialize selected cells
    this.selectedCells.clear()
    if (config.gridCells) {
      config.gridCells.forEach(cell => {
        this.selectedCells.add(`${cell.x},${cell.y}`)
      })
    }
  }
  
  create() {
    // Create graphics layers
    this.layers.beam = this.add.graphics()
    this.layers.grid = this.add.graphics()
    this.layers.contours = this.add.graphics()
    this.layers.selection = this.add.graphics()
    
    // Set up camera
    this.setupCamera()
    
    // Initialize grid data
    this.initializeGridData()
    
    // Set up interaction
    if (this.config.editMode) {
      this.setupInteraction()
    }
    
    // Initial render
    this.render()
  }
  
  /**
   * Set up camera and world bounds
   */
  private setupCamera(): void {
    const { beamProfile, beamLength = 120 } = this.config
    if (!beamProfile) return
    
    const worldWidth = beamLength * this.GRID_SIZE + 200
    const worldHeight = beamProfile.webHeight * this.GRID_SIZE + 400
    
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2)
  }
  
  /**
   * Initialize grid data structure
   */
  private initializeGridData(): void {
    const { beamProfile, beamLength = 120 } = this.config
    if (!beamProfile) return
    
    const width = Math.ceil(beamLength)
    const height = Math.ceil(beamProfile.webHeight)
    const data = new Float32Array(width * height)
    
    // Fill grid based on selected cells
    this.selectedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      if (x >= 0 && x < width && y >= 0 && y < height) {
        data[y * width + x] = 1
      }
    })
    
    this.gridData = { data, width, height }
  }
  
  /**
   * Set up mouse/touch interaction
   */
  private setupInteraction(): void {
    this.input.on('pointerdown', this.handlePointerDown, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', this.handlePointerUp, this)
    
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-G', () => {
      this.config.showGrid = !this.config.showGrid
      this.render()
    })
  }
  
  /**
   * Main render method
   */
  private render(): void {
    // Clear all layers
    Object.values(this.layers).forEach(layer => layer?.clear())
    
    // Render in order
    this.renderBeam()
    
    if (this.config.showGrid) {
      this.renderGrid()
    }
    
    this.renderContours()
    
    if (this.config.editMode) {
      this.renderSelection()
    }
  }
  
  /**
   * Render beam structure
   */
  private renderBeam(): void {
    const { beamProfile, beamLength = 120 } = this.config
    if (!beamProfile || !this.layers.beam) return
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    const width = beamLength * this.GRID_SIZE
    const webHeight = beamProfile.webHeight * this.GRID_SIZE
    const flangeHeight = beamProfile.flangeThickness * this.GRID_SIZE
    
    const webTop = centerY - webHeight / 2
    const webBottom = centerY + webHeight / 2
    
    this.layers.beam.lineStyle(2, this.COLORS.beam, 1)
    
    // Web
    this.layers.beam.strokeRect(centerX, webTop, width, webHeight)
    
    // Flanges
    this.layers.beam.fillStyle(this.COLORS.flange, 0.3)
    this.layers.beam.fillRect(centerX, webTop - flangeHeight, width, flangeHeight)
    this.layers.beam.fillRect(centerX, webBottom, width, flangeHeight)
    
    this.layers.beam.strokeRect(centerX, webTop - flangeHeight, width, flangeHeight)
    this.layers.beam.strokeRect(centerX, webBottom, width, flangeHeight)
  }
  
  /**
   * Render grid overlay
   */
  private renderGrid(): void {
    const { beamProfile, beamLength = 120 } = this.config
    if (!beamProfile || !this.layers.grid) return
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    const webHeight = beamProfile.webHeight * this.GRID_SIZE
    const webTop = centerY - webHeight / 2
    
    this.layers.grid.lineStyle(1, this.COLORS.grid, 0.3)
    
    // Vertical lines
    for (let i = 0; i <= beamLength; i++) {
      const x = centerX + i * this.GRID_SIZE
      this.layers.grid.moveTo(x, webTop)
      this.layers.grid.lineTo(x, webTop + webHeight)
    }
    
    // Horizontal lines
    for (let j = 0; j <= beamProfile.webHeight; j++) {
      const y = webTop + j * this.GRID_SIZE
      this.layers.grid.moveTo(centerX, y)
      this.layers.grid.lineTo(centerX + beamLength * this.GRID_SIZE, y)
    }
    
    this.layers.grid.strokePath()
  }
  
  /**
   * Render marching squares contours
   */
  private renderContours(): void {
    if (!this.gridData || !this.layers.contours) return
    
    // Process with marching squares engine
    try {
      this.lastProcessingResult = this.msEngine.process(this.gridData)
      const { contours, metadata } = this.lastProcessingResult
      
      // Report performance if callback provided
      if (this.config.onConfigChange) {
        // This could trigger UI updates with performance metrics
      }
      
      // Transform to screen coordinates
      const centerX = 100
      const centerY = this.cameras.main.centerY
      const { beamProfile } = this.config
      if (!beamProfile) return
      
      const webTop = centerY - (beamProfile.webHeight * this.GRID_SIZE) / 2
      
      // Set up graphics
      this.layers.contours.lineStyle(2, this.COLORS.contour, 1)
      this.layers.contours.fillStyle(this.COLORS.contourFill, 0.8)
      
      // Draw each contour
      contours.forEach(contour => {
        if (contour.points.length < 3) return
        
        this.layers.contours.beginPath()
        
        // Transform points to screen space
        contour.points.forEach((point, index) => {
          const screenX = centerX + point.x * this.GRID_SIZE
          const screenY = webTop + point.y * this.GRID_SIZE
          
          if (index === 0) {
            this.layers.contours.moveTo(screenX, screenY)
          } else {
            this.layers.contours.lineTo(screenX, screenY)
          }
        })
        
        if (contour.closed) {
          this.layers.contours.closePath()
        }
        
        this.layers.contours.fillPath()
        this.layers.contours.strokePath()
      })
    } catch (error) {
      console.error('Contour processing error:', error)
    }
  }
  
  /**
   * Render selection overlay
   */
  private renderSelection(): void {
    if (!this.layers.selection) return
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    const { beamProfile } = this.config
    if (!beamProfile) return
    
    const webTop = centerY - (beamProfile.webHeight * this.GRID_SIZE) / 2
    
    this.layers.selection.fillStyle(this.COLORS.selection, 0.3)
    
    this.selectedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      const screenX = centerX + x * this.GRID_SIZE
      const screenY = webTop + y * this.GRID_SIZE
      
      this.layers.selection.fillRect(screenX, screenY, this.GRID_SIZE, this.GRID_SIZE)
    })
  }
  
  /**
   * Handle pointer down
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.config.editMode) return
    
    const cell = this.screenToGrid(pointer.x, pointer.y)
    if (cell) {
      this.isDrawing = true
      this.toggleCell(cell.x, cell.y, !pointer.rightButtonDown())
    }
  }
  
  /**
   * Handle pointer move
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.config.editMode || !this.isDrawing) return
    
    const cell = this.screenToGrid(pointer.x, pointer.y)
    if (cell) {
      this.setCell(cell.x, cell.y, !pointer.rightButtonDown())
    }
  }
  
  /**
   * Handle pointer up
   */
  private handlePointerUp(): void {
    this.isDrawing = false
  }
  
  /**
   * Convert screen coordinates to grid cell
   */
  private screenToGrid(screenX: number, screenY: number): { x: number; y: number } | null {
    const { beamProfile, beamLength = 120 } = this.config
    if (!beamProfile) return null
    
    const centerX = 100
    const centerY = this.cameras.main.centerY
    const webTop = centerY - (beamProfile.webHeight * this.GRID_SIZE) / 2
    
    const gridX = Math.floor((screenX - centerX) / this.GRID_SIZE)
    const gridY = Math.floor((screenY - webTop) / this.GRID_SIZE)
    
    if (gridX >= 0 && gridX < beamLength && gridY >= 0 && gridY < beamProfile.webHeight) {
      return { x: gridX, y: gridY }
    }
    
    return null
  }
  
  /**
   * Toggle cell state
   */
  private toggleCell(x: number, y: number, value: boolean): void {
    const key = `${x},${y}`
    
    if (value && !this.selectedCells.has(key)) {
      this.selectedCells.add(key)
      this.updateGridData(x, y, 1)
      this.notifyChange()
    } else if (!value && this.selectedCells.has(key)) {
      this.selectedCells.delete(key)
      this.updateGridData(x, y, 0)
      this.notifyChange()
    }
  }
  
  /**
   * Set cell state
   */
  private setCell(x: number, y: number, value: boolean): void {
    const key = `${x},${y}`
    const hasCell = this.selectedCells.has(key)
    
    if (value && !hasCell) {
      this.selectedCells.add(key)
      this.updateGridData(x, y, 1)
      this.notifyChange()
    } else if (!value && hasCell) {
      this.selectedCells.delete(key)
      this.updateGridData(x, y, 0)
      this.notifyChange()
    }
  }
  
  /**
   * Update grid data
   */
  private updateGridData(x: number, y: number, value: number): void {
    if (!this.gridData) return
    
    const { width, height, data } = this.gridData
    if (x >= 0 && x < width && y >= 0 && y < height) {
      data[y * width + x] = value
    }
    
    this.render()
  }
  
  /**
   * Notify parent of changes
   */
  private notifyChange(): void {
    if (!this.config.onCellChange) return
    
    const cells: GridCell[] = []
    this.selectedCells.forEach(key => {
      const [x, y] = key.split(',').map(Number)
      cells.push({ x, y, zone: 'web' })
    })
    
    this.config.onCellChange(cells)
  }
  
  // Public API
  
  /**
   * Update marching squares configuration
   */
  updateConfig(config: MarchingSquaresConfig): void {
    this.msConfig = config
    this.msEngine.updateConfig(config)
    this.render()
  }
  
  /**
   * Set preset configuration
   */
  setPreset(preset: keyof typeof CONFIG_PRESETS): void {
    const config = CONFIG_PRESETS[preset]
    if (config) {
      this.updateConfig(config as MarchingSquaresConfig)
    }
  }
  
  /**
   * Get last processing metrics
   */
  getPerformanceMetrics(): Record<string, number> {
    return this.lastProcessingResult?.metadata.performance || {}
  }
  
  /**
   * Export contour data
   */
  exportContours(): ProcessingResult | null {
    return this.lastProcessingResult
  }
}