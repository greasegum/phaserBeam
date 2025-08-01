import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'

export class BeamElevationScene extends Phaser.Scene {
  private beamProfile: BeamProfile | null = null
  private gridSize = 30 // pixels per inch
  private beamLength = 120 // inches (10 feet default)
  private editMode = true
  private showGrid = true
  private gridOrigin: 'left' | 'right' = 'left'
  private selectedCells: Set<string> = new Set()
  private gridCells: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private onCellChange?: (cells: GridCell[]) => void
  private beamGraphics?: Phaser.GameObjects.Graphics
  private lossGraphics?: Phaser.GameObjects.Graphics
  private gridContainer?: Phaser.GameObjects.Container
  private dimensionText: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'BeamElevationScene' })
  }

  init(data: { beamProfile: BeamProfile; beamLength?: number; editMode?: boolean; showGrid?: boolean; gridOrigin?: 'left' | 'right'; onCellChange?: (cells: GridCell[]) => void }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.editMode = data.editMode !== undefined ? data.editMode : true
    this.showGrid = data.showGrid !== undefined ? data.showGrid : true
    this.gridOrigin = data.gridOrigin || 'left'
    this.onCellChange = data.onCellChange
  }

  create() {
    if (!this.beamProfile) return

    const { webHeight, flangeThickness } = this.beamProfile
    
    // Calculate scene dimensions
    const sceneWidth = this.cameras.main.width
    const sceneHeight = this.cameras.main.height
    const padding = 100 // Increased padding for labels and dimensions
    const startX = padding
    const endX = sceneWidth - padding
    const centerY = sceneHeight / 2

    // Calculate scale to fit beam height comfortably in available space
    const availableWidth = endX - startX
    const availableHeight = sceneHeight - 200 // Leave room for annotations (100px top, 100px bottom)
    
    // Calculate beam total height
    const beamTotalHeight = webHeight + 2 * flangeThickness
    
    // Calculate scale based on height to ensure comfortable fit
    const heightScale = availableHeight / beamTotalHeight
    
    // Use a reasonable scale that fits height-wise, cap at 40 pixels per inch
    this.gridSize = Math.min(heightScale, 40) // Fixed scale for consistent viewing
    
    // If beam is too long for viewport, allow horizontal scrolling
    const requiredWidth = this.beamLength * this.gridSize + padding * 2
    if (requiredWidth > sceneWidth) {
      // Canvas will be wider than viewport, enabling horizontal scroll
      this.cameras.main.setBounds(0, 0, requiredWidth, sceneHeight)
    }

    // Calculate actual beam width based on gridSize
    const beamWidth = this.beamLength * this.gridSize

    // Draw beam profile background
    this.beamGraphics = this.add.graphics()
    this.drawBeamProfile(startX, centerY, beamWidth)

    // Create loss graphics layer
    this.lossGraphics = this.add.graphics()
    this.drawSectionLoss(startX, centerY, beamWidth)

    // Create grid overlay container
    this.gridContainer = this.add.container()
    if (this.editMode && this.showGrid) {
      this.createGrid(startX, centerY, beamWidth)
    }

    // Add dimension lines and labels
    this.addDimensions(startX, centerY, beamWidth)

    // Add title
    this.add.text(sceneWidth / 2, 30, 'Beam Elevation View', {
      fontSize: '20px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Add end labels
    this.add.text(startX - 40, centerY, 'South\n0"', {
      fontSize: '14px',
      color: '#333',
      align: 'center'
    }).setOrigin(0.5)

    this.add.text(startX + beamWidth + 40, centerY, 'North\n' + this.beamLength + '"', {
      fontSize: '14px', 
      color: '#333',
      align: 'center'
    }).setOrigin(0.5)
  }

  private drawBeamProfile(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.beamGraphics) return

    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.gridSize
    const flangeBottom = webBottom + flangeThickness * this.gridSize

    // Set beam color (pastel green)
    this.beamGraphics.fillStyle(0xB8E6B8)
    this.beamGraphics.lineStyle(2, 0x4A7C4A)

    // Draw top flange
    this.beamGraphics.fillRect(startX, flangeTop, width, flangeThickness * this.gridSize)
    this.beamGraphics.strokeRect(startX, flangeTop, width, flangeThickness * this.gridSize)

    // Draw web
    this.beamGraphics.fillRect(
      startX, 
      webTop, 
      width, 
      webBottom - webTop
    )
    this.beamGraphics.strokeRect(
      startX,
      webTop,
      width,
      webBottom - webTop
    )

    // Draw bottom flange
    this.beamGraphics.fillRect(startX, webBottom, width, flangeThickness * this.gridSize)
    this.beamGraphics.strokeRect(startX, webBottom, width, flangeThickness * this.gridSize)

    // Draw center line
    this.beamGraphics.lineStyle(1, 0x666666, 0.5)
    this.beamGraphics.beginPath()
    this.beamGraphics.moveTo(startX, centerY)
    this.beamGraphics.lineTo(startX + width, centerY)
    this.beamGraphics.strokePath()
  }

  private drawSectionLoss(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.lossGraphics) return
    
    this.lossGraphics.clear()
    
    const { webHeight, flangeThickness } = this.beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    const gridTop = centerY - (totalHeight * this.gridSize) / 2
    
    // Don't draw individual cells anymore - the Paper.js overlay will handle organic shapes
    // this.selectedCells.forEach(key => {
    //   const [col, row] = key.split('_').map(Number)
    //   const x = startX + col * this.gridSize
    //   const y = gridTop + row * this.gridSize
    //   
    //   this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
    //   this.lossGraphics.fillRect(x, y, this.gridSize, this.gridSize)
    // })
  }

  private createGrid(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.gridContainer) return

    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.gridSize
    const flangeBottom = webBottom + flangeThickness * this.gridSize
    
    // Calculate grid dimensions
    const cols = Math.ceil(this.beamLength)
    const webRows = Math.ceil(webHeight)
    const flangeRows = Math.ceil(flangeThickness)
    
    // Create grid based on origin selection
    if (this.gridOrigin === 'left') {
      // Origin at left end
      // Web grid - 2D with origin at web/flange corner (top of bottom flange)
      for (let row = 0; row < webRows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * this.gridSize
          const y = webBottom - (row + 1) * this.gridSize
          this.createGridCell(x, y, col, row, 'web')
        }
      }
      
      // Top flange - 1D linear grid
      for (let col = 0; col < cols; col++) {
        const x = startX + col * this.gridSize
        const y = flangeTop + flangeThickness * this.gridSize / 2
        this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-top', true)
      }
      
      // Bottom flange - 1D linear grid
      for (let col = 0; col < cols; col++) {
        const x = startX + col * this.gridSize
        const y = webBottom + flangeThickness * this.gridSize / 2
        this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-bottom', true)
      }
    } else {
      // Origin at right end
      // Web grid - 2D with origin at web/flange corner (top of bottom flange)
      for (let row = 0; row < webRows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + width - (col + 1) * this.gridSize
          const y = webBottom - (row + 1) * this.gridSize
          this.createGridCell(x, y, col, row, 'web')
        }
      }
      
      // Top flange - 1D linear grid
      for (let col = 0; col < cols; col++) {
        const x = startX + width - (col + 1) * this.gridSize
        const y = flangeTop + flangeThickness * this.gridSize / 2
        this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-top', true)
      }
      
      // Bottom flange - 1D linear grid
      for (let col = 0; col < cols; col++) {
        const x = startX + width - (col + 1) * this.gridSize
        const y = webBottom + flangeThickness * this.gridSize / 2
        this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-bottom', true)
      }
    }
  }
  
  private createGridCell(x: number, y: number, col: number, row: number, zone: string, isLinear: boolean = false) {
    const height = isLinear && this.beamProfile ? this.beamProfile.flangeThickness * this.gridSize - 1 : this.gridSize - 1
    const cell = this.add.rectangle(
      x + this.gridSize / 2,
      y + this.gridSize / 2,
      this.gridSize - 1,
      height,
      0xffffff,
      0
    )
    
    cell.setStrokeStyle(1, 0x999999, 0.8)
    cell.setInteractive()
    cell.setData('col', col)
    cell.setData('row', row)
    cell.setData('zone', zone)
    cell.setData('isLinear', isLinear)
    
    const key = `${zone}_${col}_${row}`
    this.gridCells.set(key, cell)
    this.gridContainer!.add(cell)
    
    // Restore selected state if cell was previously selected
    if (this.selectedCells.has(key)) {
      cell.setFillStyle(0x888888, 0.3)
    }
    
    this.setupCellInteraction(cell)
  }

  private setupCellInteraction(cell: Phaser.GameObjects.Rectangle) {
    cell.on('pointerdown', () => {
      if (!this.editMode) return
      
      const zone = cell.getData('zone') || 'default'
      const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
      
      if (this.selectedCells.has(key)) {
        this.selectedCells.delete(key)
        cell.setFillStyle(0xffffff, 0)
      } else {
        this.selectedCells.add(key)
        cell.setFillStyle(0x888888, 0.3) // Light gray to indicate selection
      }
      
      // Redraw loss graphics
      const sceneWidth = this.cameras.main.width
      const padding = 100
      const startX = padding
      const beamWidth = this.beamLength * this.gridSize
      this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
      
      this.notifyCellChange()
    })

    cell.on('pointerover', () => {
      if (!this.editMode) return
      if (!this.selectedCells.has(`${cell.getData('col')}_${cell.getData('row')}`)) {
        cell.setFillStyle(0xeeeeee, 0.3)
      }
    })

    cell.on('pointerout', () => {
      if (!this.editMode) return
      const zone = cell.getData('zone') || 'default'
      const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
      if (!this.selectedCells.has(key)) {
        cell.setFillStyle(0xffffff, 0)
      }
    })
  }

  private addDimensions(startX: number, centerY: number, width: number) {
    if (!this.beamProfile) return

    const { webHeight, flangeThickness } = this.beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    const topY = centerY - (totalHeight * this.gridSize) / 2
    const bottomY = centerY + (totalHeight * this.gridSize) / 2

    // Height dimension line on the right
    const dimX = startX + width + 30
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x333333)
    
    // Vertical line
    graphics.beginPath()
    graphics.moveTo(dimX, topY)
    graphics.lineTo(dimX, bottomY)
    graphics.strokePath()

    // End caps
    graphics.beginPath()
    graphics.moveTo(dimX - 5, topY)
    graphics.lineTo(dimX + 5, topY)
    graphics.moveTo(dimX - 5, bottomY)
    graphics.lineTo(dimX + 5, bottomY)
    graphics.strokePath()

    // Height label
    this.add.text(dimX + 10, centerY, `${totalHeight}"`, {
      fontSize: '14px',
      color: '#333'
    }).setOrigin(0, 0.5)

    // Length dimension markers at bottom
    const dimY = bottomY + 40
    
    // Draw inch markers every 12 inches
    for (let i = 0; i <= this.beamLength; i += 12) {
      const x = startX + i * this.gridSize
      
      graphics.beginPath()
      graphics.moveTo(x, dimY - 5)
      graphics.lineTo(x, dimY + 5)
      graphics.strokePath()
      
      this.add.text(x, dimY + 15, `${i}"`, {
        fontSize: '12px',
        color: '#333'
      }).setOrigin(0.5, 0)
    }
  }

  private notifyCellChange() {
    if (!this.onCellChange) return
    
    const cells: GridCell[] = []
    this.selectedCells.forEach(key => {
      const parts = key.split('_')
      if (parts.length >= 3) {
        const zone = parts[0]
        const x = parseInt(parts[1])
        const y = parseInt(parts[2])
        
        // Convert grid coordinates to absolute position for the overlay
        // For now, we'll use the col/row directly, but this could be enhanced
        // to account for the dual origin system
        cells.push({
          x,
          y,
          selected: true,
          severity: 1
        })
      }
    })
    
    this.onCellChange(cells)
  }

  updateBeamProfile(profile: BeamProfile, length?: number, editMode?: boolean, showGrid?: boolean, gridOrigin?: 'left' | 'right') {
    // Check if we just need to toggle grid origin
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid === this.showGrid &&
        gridOrigin !== undefined && 
        gridOrigin !== this.gridOrigin) {
      
      this.gridOrigin = gridOrigin
      
      // Need to recreate grid with new origin
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength,
        editMode: this.editMode,
        showGrid: this.showGrid,
        gridOrigin: this.gridOrigin,
        onCellChange: this.onCellChange 
      })
      
      return
    }
    
    // Check if we just need to toggle grid visibility
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid !== undefined && 
        showGrid !== this.showGrid) {
      
      this.showGrid = showGrid
      
      // Toggle grid visibility
      if (this.gridContainer) {
        this.gridContainer.setVisible(this.editMode && this.showGrid)
      }
      
      return
    }
    
    // Check if we just need to toggle edit mode
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode !== undefined && 
        editMode !== this.editMode) {
      
      this.editMode = editMode
      
      // Toggle grid visibility
      if (this.gridContainer) {
        this.gridContainer.setVisible(this.editMode && this.showGrid)
      }
      
      return
    }
    
    // Otherwise restart the scene
    this.beamProfile = profile
    this.beamLength = length || this.beamLength
    this.editMode = editMode !== undefined ? editMode : this.editMode
    this.showGrid = showGrid !== undefined ? showGrid : this.showGrid
    this.gridOrigin = gridOrigin !== undefined ? gridOrigin : this.gridOrigin
    this.scene.restart({ 
      beamProfile: profile, 
      beamLength: this.beamLength,
      editMode: this.editMode,
      showGrid: this.showGrid,
      gridOrigin: this.gridOrigin,
      onCellChange: this.onCellChange 
    })
  }
}