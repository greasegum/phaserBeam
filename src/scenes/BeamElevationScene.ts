import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { marchingSquares } from '../utils/marchingSquaresNew'

export class BeamElevationScene extends Phaser.Scene {
  private beamProfile: BeamProfile | null = null
  private gridSize = 30 // pixels per inch
  private beamLength = 120 // inches (10 feet default)
  private editMode = true
  private showGrid = true
  private gridOrigin: 'left' | 'right' = 'left'
  private showTopFlange = true
  private elevationView: 'N' | 'S' | 'E' | 'W' = 'N'
  private storedCells: GridCell[] = []
  private selectedCells: Set<string> = new Set()
  private gridCells: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private onCellChange?: (cells: GridCell[]) => void
  private beamGraphics?: Phaser.GameObjects.Graphics
  private topFlangeGraphics?: Phaser.GameObjects.Graphics
  private lossGraphics?: Phaser.GameObjects.Graphics
  private gridContainer?: Phaser.GameObjects.Container
  private dimensionText: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'BeamElevationScene' })
  }

  init(data: { 
    beamProfile: BeamProfile; 
    beamLength?: number; 
    editMode?: boolean; 
    showGrid?: boolean; 
    gridOrigin?: 'left' | 'right'; 
    showTopFlange?: boolean;
    gridCells?: GridCell[];
    elevationView?: 'N' | 'S' | 'E' | 'W';
    onCellChange?: (cells: GridCell[]) => void 
  }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.editMode = data.editMode !== undefined ? data.editMode : true
    this.showGrid = data.showGrid !== undefined ? data.showGrid : true
    this.gridOrigin = data.gridOrigin || 'left'
    this.showTopFlange = data.showTopFlange !== undefined ? data.showTopFlange : true
    this.elevationView = data.elevationView || 'N'
    this.storedCells = data.gridCells || []
    this.onCellChange = data.onCellChange
    
    // Initialize selected cells from grid cells
    this.selectedCells.clear()
    this.storedCells.forEach(cell => {
      const key = `${cell.zone || 'web'}_${cell.x}_${cell.y}`
      this.selectedCells.add(key)
    })
  }
  
  private getZoneFromCell(cell: GridCell): string {
    // Determine zone based on cell properties
    // This is a placeholder - we'll need to store zone info in GridCell
    return 'web'
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
    this.topFlangeGraphics = this.add.graphics()
    this.drawBeamProfile(startX, centerY, beamWidth)

    // Create loss graphics layer
    this.lossGraphics = this.add.graphics()
    this.drawSectionLoss(startX, centerY, beamWidth)

    // Create grid overlay container
    this.gridContainer = this.add.container()
    if (this.editMode && this.showGrid) {
      this.createGrid(startX, centerY, beamWidth)
      // Update grid cell visibility after creating grid
      this.updateGridCellVisibility()
    }

    // Add dimension lines and labels
    this.addDimensions(startX, centerY, beamWidth)

    // Add title centered over the beam
    const elevationNames = {
      'N': 'North',
      'S': 'South',
      'E': 'East',
      'W': 'West'
    }
    const titleX = startX + beamWidth / 2
    this.add.text(titleX, 30, `${elevationNames[this.elevationView]} Beam Elevation`, {
      fontSize: '20px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Add end labels based on elevation view
    // North/South elevations show East-West ends
    // East/West elevations show North-South ends
    let leftLabel: string, rightLabel: string
    if (this.elevationView === 'N' || this.elevationView === 'S') {
      leftLabel = 'East End'
      rightLabel = 'West End'
    } else {
      leftLabel = 'North End'
      rightLabel = 'South End'
    }
    
    // Position labels above the beam ends
    const labelY = centerY - ((this.beamProfile!.webHeight + 2 * this.beamProfile!.flangeThickness) * this.gridSize) / 2 - 30
    
    this.add.text(startX, labelY, leftLabel, {
      fontSize: '14px',
      color: '#333',
      fontWeight: 'bold'
    }).setOrigin(0.5)

    this.add.text(startX + beamWidth, labelY, rightLabel, {
      fontSize: '14px', 
      color: '#333',
      fontWeight: 'bold'
    }).setOrigin(0.5)
  }

  private drawBeamProfile(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.beamGraphics || !this.topFlangeGraphics) return

    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.gridSize
    const flangeBottom = webBottom + flangeThickness * this.gridSize

    // Set beam color (pastel green)
    this.beamGraphics.fillStyle(0xB8E6B8)
    this.beamGraphics.lineStyle(2, 0x4A7C4A)

    // Draw top flange separately
    if (this.showTopFlange) {
      this.topFlangeGraphics.fillStyle(0xB8E6B8)
      this.topFlangeGraphics.lineStyle(2, 0x4A7C4A)
    } else {
      // Grey out top flange
      this.topFlangeGraphics.fillStyle(0xCCCCCC)
      this.topFlangeGraphics.lineStyle(2, 0x888888)
    }
    this.topFlangeGraphics.fillRect(startX, flangeTop, width, flangeThickness * this.gridSize)
    this.topFlangeGraphics.strokeRect(startX, flangeTop, width, flangeThickness * this.gridSize)

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

  private drawWebSectionLoss(webCells: {x: number, y: number}[], startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.lossGraphics) return
    
    const { webHeight } = this.beamProfile
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    
    // First fill the section loss areas
    this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
    
    webCells.forEach(cell => {
      // cell.x and cell.y are grid coordinates (col, row)
      const x = startX + cell.x * this.gridSize
      const y = webBottom - (cell.y + 1) * this.gridSize
      
      this.lossGraphics.fillRect(x, y, this.gridSize, this.gridSize)
      // Don't draw individual cell strokes - we'll use marching squares for the outline
    })
    
    // Create a grid for marching squares
    const cols = Math.ceil(this.beamLength)
    const rows = Math.ceil(webHeight)
    
    // Initialize grid with 0s
    const grid: number[][] = Array(rows + 2).fill(null).map(() => Array(cols + 2).fill(0))
    
    // Fill grid based on web cells with gradient falloff
    // Note: webCells are already in grid coordinates, not absolute positions
    webCells.forEach(cell => {
      // Convert cell coordinates to absolute grid position
      const gridX = cell.x
      const gridY = cell.y
      
      if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
        // Set the main cell
        grid[gridY + 1][gridX + 1] = 1
        
        // Add gradient falloff for smoother edges
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = gridY + dy + 1
            const nx = gridX + dx + 1
            if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              const value = Math.max(0, 1 - distance / 3)
              grid[ny][nx] = Math.max(grid[ny][nx], value)
            }
          }
        }
      }
    })
    
    // Apply smoothing
    for (let i = 0; i < 2; i++) {
      const smoothed = grid.map(row => [...row])
      for (let y = 1; y < grid.length - 1; y++) {
        for (let x = 1; x < grid[0].length - 1; x++) {
          let sum = 0
          let count = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += grid[y + dy][x + dx]
              count++
            }
          }
          smoothed[y][x] = sum / count
        }
      }
      grid.forEach((row, y) => row.forEach((_, x) => grid[y][x] = smoothed[y][x]))
    }
    
    // Generate contours
    const threshold = 0.5
    const contours = marchingSquares(grid, threshold)
    
    // Draw the contours
    this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
    this.lossGraphics.lineStyle(2, 0xFF6B6B)
    
    contours.forEach(contour => {
      if (contour.length < 3) return
      
      this.lossGraphics.beginPath()
      
      contour.forEach((point, index) => {
        // Convert grid coordinates to screen coordinates
        // point[0] is the x position in the grid (0 to cols)
        // point[1] is the y position in the grid (0 to rows)
        // The -1 offset is because marching squares adds padding
        const x = startX + (point[0] - 1) * this.gridSize
        // Y coordinate: row 0 is at the bottom of the web, so we need to invert
        const y = webBottom - (point[1] - 1) * this.gridSize
        
        if (index === 0) {
          this.lossGraphics.moveTo(x, y)
        } else {
          this.lossGraphics.lineTo(x, y)
        }
      })
      
      this.lossGraphics.closePath()
      this.lossGraphics.fillPath()
      this.lossGraphics.strokePath()
    })
  }

  private drawSectionLoss(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.lossGraphics) return
    
    this.lossGraphics.clear()
    
    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.gridSize
    
    // Process all cells - they're already in absolute positions
    const allWebCells: {x: number, y: number}[] = []
    const allFlangeCells: {zone: string, x: number, y: number}[] = []
    
    // Get cells from the selectedCells set
    this.selectedCells.forEach(key => {
      const parts = key.split('_')
      if (parts.length >= 3) {
        const zone = parts[0]
        const col = parseInt(parts[1])
        const row = parseInt(parts[2])
        
        if (zone === 'web') {
          allWebCells.push({ x: col, y: row })
        } else if (zone === 'flange-top' || zone === 'flange-bottom') {
          allFlangeCells.push({ zone, x: col, y: row })
        }
      }
    })
    
    // Draw web section loss using marching squares
    if (allWebCells.length > 0) {
      this.drawWebSectionLoss(allWebCells, startX, centerY, width)
    }
    
    // Draw flange section loss as rectangles
    allFlangeCells.forEach(cell => {
      // Skip top flange cells if top flange is disabled
      if (cell.zone === 'flange-top' && !this.showTopFlange) {
        return
      }
      
      // Cells are stored with their absolute positions now
      const x = startX + cell.x * this.gridSize
      const y = cell.zone === 'flange-top' ? flangeTop : webBottom
        
      this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
      this.lossGraphics.lineStyle(1, 0xFF6B6B)
      this.lossGraphics.fillRect(x, y, this.gridSize, flangeThickness * this.gridSize)
      this.lossGraphics.strokeRect(x, y, this.gridSize, flangeThickness * this.gridSize)
    })
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
    
    // Always create grid from left to right (absolute positions)
    // The gridOrigin only affects the dimension labels, not the grid itself
    
    // Web grid - 2D with origin at web/flange corner (top of bottom flange)
    for (let row = 0; row < webRows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * this.gridSize
        const y = webBottom - (row + 1) * this.gridSize
        
        // Calculate cell height - truncate if it extends above web top
        let cellHeight = this.gridSize
        let cellY = y
        
        if (y < webTop) {
          // Cell extends above web top - truncate it
          cellHeight = y + this.gridSize - webTop
          cellY = webTop
          if (cellHeight <= 0) continue // Skip cells completely above the web
        }
        
        this.createGridCell(x, cellY, col, row, 'web', false, cellHeight)
      }
    }
    
    // Top flange - 1D linear grid (only if enabled)
    if (this.showTopFlange) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * this.gridSize
        const y = flangeTop + flangeThickness * this.gridSize / 2
        this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-top', true)
      }
    }
    
    // Bottom flange - 1D linear grid
    for (let col = 0; col < cols; col++) {
      const x = startX + col * this.gridSize
      const y = webBottom + flangeThickness * this.gridSize / 2
      this.createGridCell(x, y - this.gridSize / 2, col, 0, 'flange-bottom', true)
    }
  }
  
  private createGridCell(x: number, y: number, col: number, row: number, zone: string, isLinear: boolean = false, customHeight?: number) {
    const height = customHeight !== undefined ? customHeight - 1 : 
                  (isLinear && this.beamProfile ? this.beamProfile.flangeThickness * this.gridSize - 1 : this.gridSize - 1)
    const cell = this.add.rectangle(
      x + this.gridSize / 2,
      y + height / 2,
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

    // Height dimension line - position based on grid origin
    const dimX = this.gridOrigin === 'left' ? startX - 30 : startX + width + 30
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
    const labelOffset = this.gridOrigin === 'left' ? -10 : 10
    this.add.text(dimX + labelOffset, centerY, `${totalHeight.toFixed(3)}"`, {
      fontSize: '14px',
      color: '#333',
      fontWeight: 'bold'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Add detailed dimensions
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = topY
    
    // Top flange thickness
    const detailOffset = this.gridOrigin === 'left' ? -50 : 50
    graphics.lineStyle(1, 0x666666, 0.5)
    
    // Top flange dimension
    graphics.beginPath()
    graphics.moveTo(dimX + detailOffset, flangeTop)
    graphics.lineTo(dimX + detailOffset, webTop)
    graphics.strokePath()
    
    this.add.text(dimX + detailOffset + labelOffset/2, flangeTop + (webTop - flangeTop) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '12px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Web height dimension
    graphics.beginPath()
    graphics.moveTo(dimX + detailOffset, webTop)
    graphics.lineTo(dimX + detailOffset, webBottom)
    graphics.strokePath()
    
    this.add.text(dimX + detailOffset + labelOffset/2, centerY, `${webHeight.toFixed(3)}"`, {
      fontSize: '12px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Bottom flange dimension
    graphics.beginPath()
    graphics.moveTo(dimX + detailOffset, webBottom)
    graphics.lineTo(dimX + detailOffset, bottomY)
    graphics.strokePath()
    
    this.add.text(dimX + detailOffset + labelOffset/2, webBottom + (bottomY - webBottom) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '12px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)

    // Length dimension markers at bottom
    const dimY = bottomY + 40
    
    // Draw inch markers every 12 inches based on grid origin
    for (let i = 0; i <= this.beamLength; i += 12) {
      const x = startX + i * this.gridSize
      
      graphics.beginPath()
      graphics.moveTo(x, dimY - 5)
      graphics.lineTo(x, dimY + 5)
      graphics.strokePath()
      
      const label = this.gridOrigin === 'left' ? i : this.beamLength - i
      this.add.text(x, dimY + 15, `${label}"`, {
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
          severity: 1,
          zone: zone as 'web' | 'flange-top' | 'flange-bottom'
        })
      }
    })
    
    this.onCellChange(cells)
  }
  
  private updateGridCellVisibility() {
    // Update stroke visibility for all grid cells based on whether they're selected
    this.gridCells.forEach((cell, key) => {
      if (this.selectedCells.has(key)) {
        // Hide stroke for selected cells (section loss areas)
        cell.setStrokeStyle(0, 0x999999, 0)
      } else {
        // Show stroke for non-selected cells
        cell.setStrokeStyle(1, 0x999999, 0.8)
      }
    })
  }

  updateBeamProfile(profile: BeamProfile, length?: number, editMode?: boolean, showGrid?: boolean, gridOrigin?: 'left' | 'right', showTopFlange?: boolean, gridCells?: GridCell[], elevationView?: 'N' | 'S' | 'E' | 'W') {
    // Check if we just need to toggle grid origin
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid === this.showGrid &&
        gridOrigin !== undefined && 
        gridOrigin !== this.gridOrigin) {
      
      this.gridOrigin = gridOrigin
      
      // Just need to update dimensions, not recreate the whole scene
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength,
        editMode: this.editMode,
        showGrid: this.showGrid,
        gridOrigin: this.gridOrigin,
        showTopFlange: this.showTopFlange,
        gridCells: gridCells || this.storedCells,
        elevationView: elevationView || this.elevationView,
        onCellChange: this.onCellChange 
      })
      
      return
    }
    
    // Check if we just need to toggle top flange
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid === this.showGrid &&
        showTopFlange !== undefined && 
        showTopFlange !== this.showTopFlange) {
      
      this.showTopFlange = showTopFlange
      
      // Need to recreate scene to update top flange visibility
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength,
        editMode: this.editMode,
        showGrid: this.showGrid,
        gridOrigin: this.gridOrigin,
        showTopFlange: this.showTopFlange,
        gridCells: gridCells || this.storedCells,
        elevationView: elevationView || this.elevationView,
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
    this.showTopFlange = showTopFlange !== undefined ? showTopFlange : this.showTopFlange
    this.storedCells = gridCells || this.storedCells
    this.elevationView = elevationView || this.elevationView
    this.scene.restart({ 
      beamProfile: profile, 
      beamLength: this.beamLength,
      editMode: this.editMode,
      showGrid: this.showGrid,
      gridOrigin: this.gridOrigin,
      showTopFlange: this.showTopFlange,
      gridCells: this.storedCells,
      elevationView: this.elevationView,
      onCellChange: this.onCellChange 
    })
  }
}