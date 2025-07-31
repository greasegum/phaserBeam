import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'

export class BeamElevationScene extends Phaser.Scene {
  private beamProfile: BeamProfile | null = null
  private gridSize = 30 // pixels per inch (smaller for better fit)
  private beamLength = 120 // inches (10 feet default)
  private selectedCells: Set<string> = new Set()
  private gridCells: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private onCellChange?: (cells: GridCell[]) => void
  private beamGraphics?: Phaser.GameObjects.Graphics
  private dimensionText: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'BeamElevationScene' })
  }

  init(data: { beamProfile: BeamProfile; beamLength?: number; onCellChange?: (cells: GridCell[]) => void }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.onCellChange = data.onCellChange
  }

  create() {
    if (!this.beamProfile) return

    const { webHeight, flangeWidth, flangeThickness } = this.beamProfile
    
    // Calculate scene dimensions
    const sceneWidth = this.cameras.main.width
    const sceneHeight = this.cameras.main.height
    const startX = 80 // Leave space for labels
    const endX = sceneWidth - 80
    const centerY = sceneHeight / 2

    // Calculate scale to fit beam length in available space
    const availableWidth = endX - startX
    this.gridSize = availableWidth / this.beamLength

    // Draw beam profile background
    this.beamGraphics = this.add.graphics()
    this.drawBeamProfile(startX, centerY, availableWidth)

    // Create grid overlay
    this.createGrid(startX, centerY, availableWidth)

    // Add dimension lines and labels
    this.addDimensions(startX, centerY, availableWidth)

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

    this.add.text(endX + 40, centerY, 'North\n' + this.beamLength + '"', {
      fontSize: '14px', 
      color: '#333',
      align: 'center'
    }).setOrigin(0.5)
  }

  private drawBeamProfile(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.beamGraphics) return

    const { webHeight, flangeWidth, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.gridSize
    const flangeBottom = webBottom + flangeThickness * this.gridSize

    // Set beam color (light gray)
    this.beamGraphics.fillStyle(0xE8E8E8)
    this.beamGraphics.lineStyle(2, 0x333333)

    // Draw top flange
    this.beamGraphics.fillRect(startX, flangeTop, width, flangeThickness * this.gridSize)
    this.beamGraphics.strokeRect(startX, flangeTop, width, flangeThickness * this.gridSize)

    // Draw web (center line for elevation view)
    const webThicknessPixels = Math.max(2, this.gridSize * 0.5) // Visible web thickness
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

  private createGrid(startX: number, centerY: number, width: number) {
    if (!this.beamProfile) return

    const { webHeight, flangeWidth, flangeThickness } = this.beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    const gridTop = centerY - (totalHeight * this.gridSize) / 2
    
    // Calculate grid dimensions
    const cols = Math.ceil(this.beamLength)
    const rows = Math.ceil(totalHeight)

    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * this.gridSize
        const y = gridTop + row * this.gridSize
        
        // Create cell
        const cell = this.add.rectangle(
          x + this.gridSize / 2,
          y + this.gridSize / 2,
          this.gridSize - 1,
          this.gridSize - 1,
          0xffffff,
          0
        )
        
        cell.setStrokeStyle(1, 0xcccccc, 0.5)
        cell.setInteractive()
        cell.setData('col', col)
        cell.setData('row', row)
        
        const key = `${col}_${row}`
        this.gridCells.set(key, cell)
        
        this.setupCellInteraction(cell)
      }
    }
  }

  private setupCellInteraction(cell: Phaser.GameObjects.Rectangle) {
    cell.on('pointerdown', () => {
      const key = `${cell.getData('col')}_${cell.getData('row')}`
      
      if (this.selectedCells.has(key)) {
        this.selectedCells.delete(key)
        cell.setFillStyle(0xffffff, 0)
      } else {
        this.selectedCells.add(key)
        cell.setFillStyle(0xff6b6b, 0.6)
      }
      
      this.notifyCellChange()
    })

    cell.on('pointerover', () => {
      if (!this.selectedCells.has(`${cell.getData('col')}_${cell.getData('row')}`)) {
        cell.setFillStyle(0xeeeeee, 0.3)
      }
    })

    cell.on('pointerout', () => {
      const key = `${cell.getData('col')}_${cell.getData('row')}`
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
      const [x, y] = key.split('_').map(Number)
      cells.push({
        x,
        y,
        selected: true,
        severity: 1
      })
    })
    
    this.onCellChange(cells)
  }

  updateBeamProfile(profile: BeamProfile, length?: number) {
    this.beamProfile = profile
    this.beamLength = length || this.beamLength
    this.scene.restart({ 
      beamProfile: profile, 
      beamLength: this.beamLength,
      onCellChange: this.onCellChange 
    })
  }
}