import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'

export class GridScene extends Phaser.Scene {
  private selectedCells: Set<string> = new Set()
  private beamProfile: BeamProfile | null = null
  private gridScale = 50 // pixels per inch
  private webGrid: Phaser.GameObjects.Rectangle[][] = []
  private flangeGrid: Phaser.GameObjects.Rectangle[][] = []
  private onCellChange?: (cells: GridCell[]) => void

  constructor() {
    super({ key: 'GridScene' })
  }

  init(data: { beamProfile: BeamProfile; onCellChange?: (cells: GridCell[]) => void }) {
    this.beamProfile = data.beamProfile
    this.onCellChange = data.onCellChange
  }

  create() {
    if (!this.beamProfile) return

    const { webHeight, webThickness, flangeThickness } = this.beamProfile
    
    // Center the beam in the scene
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // Create web grid
    const webGridWidth = Math.ceil(webThickness)
    const webGridHeight = Math.ceil(webHeight - 2 * flangeThickness)
    
    for (let y = 0; y < webGridHeight; y++) {
      this.webGrid[y] = []
      for (let x = 0; x < webGridWidth; x++) {
        const cellX = centerX - (webGridWidth * this.gridScale) / 2 + x * this.gridScale + this.gridScale / 2
        const cellY = centerY - (webGridHeight * this.gridScale) / 2 + y * this.gridScale + this.gridScale / 2
        
        const cell = this.add.rectangle(cellX, cellY, this.gridScale - 2, this.gridScale - 2, 0xffffff)
        cell.setStrokeStyle(1, 0x666666)
        cell.setInteractive()
        cell.setData('type', 'web')
        cell.setData('gridX', x)
        cell.setData('gridY', y)
        
        this.setupCellInteraction(cell)
        this.webGrid[y][x] = cell
      }
    }

    // Create flange grid (single row for length)
    const flangeGridLength = 20 // 20 inches for demo
    this.flangeGrid[0] = []
    
    for (let x = 0; x < flangeGridLength; x++) {
      const cellX = centerX - (flangeGridLength * this.gridScale) / 2 + x * this.gridScale + this.gridScale / 2
      const cellY = centerY + (webGridHeight * this.gridScale) / 2 + this.gridScale
      
      const cell = this.add.rectangle(cellX, cellY, this.gridScale - 2, this.gridScale - 2, 0xffffff)
      cell.setStrokeStyle(1, 0x666666)
      cell.setInteractive()
      cell.setData('type', 'flange')
      cell.setData('gridX', x)
      cell.setData('gridY', 0)
      
      this.setupCellInteraction(cell)
      this.flangeGrid[0][x] = cell
    }

    // Add labels
    this.add.text(centerX, centerY - (webGridHeight * this.gridScale) / 2 - 30, 'Web Section', {
      fontSize: '16px',
      color: '#333'
    }).setOrigin(0.5)

    this.add.text(centerX, centerY + (webGridHeight * this.gridScale) / 2 + this.gridScale + 40, 'Lower Flange (Length)', {
      fontSize: '16px',
      color: '#333'
    }).setOrigin(0.5)
  }

  private setupCellInteraction(cell: Phaser.GameObjects.Rectangle) {
    cell.on('pointerdown', () => {
      const key = `${cell.getData('type')}_${cell.getData('gridX')}_${cell.getData('gridY')}`
      
      if (this.selectedCells.has(key)) {
        this.selectedCells.delete(key)
        cell.setFillStyle(0xffffff)
      } else {
        this.selectedCells.add(key)
        cell.setFillStyle(0xff6b6b)
      }
      
      this.notifyCellChange()
    })

    cell.on('pointerover', () => {
      if (!this.selectedCells.has(`${cell.getData('type')}_${cell.getData('gridX')}_${cell.getData('gridY')}`)) {
        cell.setFillStyle(0xeeeeee)
      }
    })

    cell.on('pointerout', () => {
      const key = `${cell.getData('type')}_${cell.getData('gridX')}_${cell.getData('gridY')}`
      if (!this.selectedCells.has(key)) {
        cell.setFillStyle(0xffffff)
      }
    })
  }

  private notifyCellChange() {
    if (!this.onCellChange) return
    
    const cells: GridCell[] = []
    this.selectedCells.forEach(key => {
      const [, x, y] = key.split('_')
      cells.push({
        x: parseInt(x),
        y: parseInt(y),
        selected: true,
        severity: 1
      })
    })
    
    this.onCellChange(cells)
  }

  updateBeamProfile(profile: BeamProfile) {
    this.beamProfile = profile
    this.scene.restart({ beamProfile: profile, onCellChange: this.onCellChange })
  }
}