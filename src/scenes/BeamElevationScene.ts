import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { marchingSquaresOptimized, MarchingSquaresOptions } from '../utils/marchingSquaresOptimized'
import { binaryToScalarField, ScalarFieldMethod } from '../utils/scalarField'
import { drawBezierContour } from '../utils/phaserBezierPath'

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
  private controlPointGraphics?: Phaser.GameObjects.Graphics
  // New visualization layers
  private pixelOutlineGraphics?: Phaser.GameObjects.Graphics
  private blurredFieldGraphics?: Phaser.GameObjects.Graphics
  private rawContourGraphics?: Phaser.GameObjects.Graphics
  private smoothedContourGraphics?: Phaser.GameObjects.Graphics
  private dimensionText: Phaser.GameObjects.Text[] = []
  private isMouseDown = false
  private isPainting = false
  private paintMode: 'add' | 'remove' | null = null
  private useSmoothCurves = true // Enable smooth organic curves
  // Marching squares alignment offsets
  private contourOffsetX = 0 // Cell offset removed - use global offset
  private contourOffsetY = 0 // Cell offset removed - use global offset
  private contourGlobalOffsetX = -0.5 // Default -0.5 to center contours on cells
  private contourGlobalOffsetY = -0.5 // Default -0.5 to center contours on cells
  // Marching squares buffer configuration
  private contourBufferSize = 1 // Default buffer of 1 for proper edge handling
  private contourBufferValue = 0 // Default buffer value
  // Smoothing options
  private smoothingMethod: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent' = 'edge-aware'
  private smoothingIterations = 1
  private smoothingStrength = 0.3
  // Collision avoidance options
  private collisionAvoidance = false // Default to disabled for simpler behavior
  private collisionMinDistance = 0.5
  private collisionMethod: 'push' | 'shrink' | 'hybrid' = 'hybrid'
  private collisionIterations = 10
  // View mode options
  private showRawMarchingSquares = false // Show raw marching squares without smoothing
  private showControlPoints = false // Show marching squares control points in edit mode
  private showBlurredField = false // Show blurred field visualization
  // Marching Squares Algorithm Properties
  private interpolationMethod: 'linear' | 'cubic' | 'none' = 'linear'
  private scalarFieldMethod: ScalarFieldMethod = 'gaussian'
  private scalarFieldRadius = 2
  private saddlePointResolution: 'center' | 'gradient' | 'majority' = 'center'
  private threshold = 0.5
  private alignmentMode: 'edges' | 'vertices' | 'center' = 'edges'
  private clampToGrid = true
  private extendToBoundary = false
  private snapDistance = 0.1

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
    
    // Set up global mouse up handler for paint mode
    this.input.on('pointerup', () => {
      this.isMouseDown = false
      this.isPainting = false
      this.paintMode = null
    })
    
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

    // Create visualization layers in proper order (bottom to top)
    this.blurredFieldGraphics = this.add.graphics() // Blurred field (bottom)
    this.pixelOutlineGraphics = this.add.graphics() // Pixel outline
    this.lossGraphics = this.add.graphics() // Filled regions (for non-edit mode)
    this.rawContourGraphics = this.add.graphics() // Raw marching squares contours
    this.smoothedContourGraphics = this.add.graphics() // Smoothed contours (top)
    this.controlPointGraphics = this.add.graphics() // Control points (topmost)
    
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
    // When looking at an elevation, the ends are perpendicular to the view direction
    let leftLabel: string, rightLabel: string
    switch (this.elevationView) {
      case 'N': // Looking at North elevation
        leftLabel = 'East End'
        rightLabel = 'West End'
        break
      case 'S': // Looking at South elevation
        leftLabel = 'West End'
        rightLabel = 'East End'
        break
      case 'E': // Looking at East elevation
        leftLabel = 'South End'
        rightLabel = 'North End'
        break
      case 'W': // Looking at West elevation
        leftLabel = 'North End'
        rightLabel = 'South End'
        break
      default:
        leftLabel = 'Left End'
        rightLabel = 'Right End'
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
    if (!this.beamProfile) return
    
    const { webHeight } = this.beamProfile
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const cols = Math.ceil(this.beamLength)
    const rows = Math.ceil(webHeight)
    
    // Create binary grid
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    // Fill the grid based on web cells
    webCells.forEach(cell => {
      const gridX = cell.x
      const gridY = rows - 1 - cell.y // Invert because web cells have row=0 at bottom
      
      if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
        grid[gridY][gridX] = 1
      }
    })
    
    // In edit mode, show all visualization layers
    if (this.editMode) {
      // 1. Draw blurred field if enabled
      if (this.showBlurredField && this.blurredFieldGraphics) {
        this.drawBlurredField(grid, startX, webTop, webBottom, cols, rows)
      }
      
      // 2. Draw pixelated outline
      if (this.pixelOutlineGraphics) {
        this.drawPixelatedOutline(webCells, startX, webBottom)
      }
      
      // 3. Draw marching squares contours
      this.drawMarchingSquaresLayers(grid, startX, webTop, webBottom, cols, rows)
      
    } else {
      // View mode - show filled regions with marching squares
      // Convert binary grid to scalar field for interpolation
      const scalarGrid = binaryToScalarField(grid, this.scalarFieldMethod, this.scalarFieldRadius)
      
      // Apply marching squares
      const marchingOptions: MarchingSquaresOptions = {
        threshold: this.threshold,
        interpolationMethod: this.interpolationMethod,
        saddlePointResolution: this.saddlePointResolution,
        smoothing: !this.showRawMarchingSquares,
        edgeSnapping: true,
        snapDistance: this.snapDistance,
        offsetX: this.contourOffsetX,
        offsetY: this.contourOffsetY,
        globalOffsetX: this.contourGlobalOffsetX,
        globalOffsetY: this.contourGlobalOffsetY,
        bufferSize: this.contourBufferSize,
        bufferValue: this.contourBufferValue,
        smoothingMethod: this.smoothingMethod,
        smoothingIterations: this.smoothingIterations,
        smoothingStrength: this.smoothingStrength,
        collisionAvoidance: this.collisionAvoidance,
        collisionMinDistance: this.collisionMinDistance,
        collisionMethod: this.collisionMethod,
        collisionIterations: this.collisionIterations,
        alignmentMode: this.alignmentMode,
        clampToGrid: this.clampToGrid,
        extendToBoundary: this.extendToBoundary
      }
      const contours = marchingSquaresOptimized(scalarGrid, marchingOptions)
      
      // Draw filled contours
      if (this.lossGraphics) {
        this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
        this.lossGraphics.lineStyle(2, 0xFF6B6B)
        
        contours.forEach(contour => {
          const screenContour = contour.map(pt => ({
            x: startX + pt.x * this.gridSize,
            y: webTop + pt.y * this.gridSize
          }))
          
          if (this.useSmoothCurves && !this.showRawMarchingSquares && screenContour.length > 4) {
            drawBezierContour(this.lossGraphics, screenContour, true)
          } else {
            this.lossGraphics.beginPath()
            screenContour.forEach((point, index) => {
              if (index === 0) {
                this.lossGraphics.moveTo(point.x, point.y)
              } else {
                this.lossGraphics.lineTo(point.x, point.y)
              }
            })
            this.lossGraphics.closePath()
            this.lossGraphics.fillPath()
            this.lossGraphics.strokePath()
          }
        })
      }
    }
  }
  
  private drawBlurredField(grid: number[][], startX: number, webTop: number, webBottom: number, cols: number, rows: number) {
    if (!this.blurredFieldGraphics) return
    
    // Convert binary grid to scalar field
    const scalarGrid = binaryToScalarField(grid, this.scalarFieldMethod, this.scalarFieldRadius)
    
    // Draw each cell with gradient based on scalar value
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const value = scalarGrid[y][x]
        if (value > 0.01) { // Only draw if there's some value
          const alpha = value * 0.5 // Max 50% opacity
          const screenX = startX + x * this.gridSize
          const screenY = webTop + y * this.gridSize
          
          // Use a red gradient
          this.blurredFieldGraphics.fillStyle(0xFFB3BA, alpha)
          this.blurredFieldGraphics.fillRect(screenX, screenY, this.gridSize, this.gridSize)
        }
      }
    }
  }
  
  private drawPixelatedOutline(webCells: {x: number, y: number}[], startX: number, webBottom: number) {
    if (!this.pixelOutlineGraphics) return
    
    // Create a set for quick lookup
    const cellSet = new Set(webCells.map(cell => `${cell.x},${cell.y}`))
    const maxCol = Math.ceil(this.beamLength) - 1
    
    // Set line style for outlines
    this.pixelOutlineGraphics.lineStyle(2, 0xFF9999, 0.8)
    
    webCells.forEach(cell => {
      const x = startX + cell.x * this.gridSize
      const y = webBottom - (cell.y + 1) * this.gridSize
      
      // Check each edge - draw if no neighbor
      // Top edge
      if (!cellSet.has(`${cell.x},${cell.y + 1}`)) {
        this.pixelOutlineGraphics.beginPath()
        this.pixelOutlineGraphics.moveTo(x, y)
        this.pixelOutlineGraphics.lineTo(x + this.gridSize, y)
        this.pixelOutlineGraphics.strokePath()
      }
      
      // Bottom edge
      if (!cellSet.has(`${cell.x},${cell.y - 1}`)) {
        this.pixelOutlineGraphics.beginPath()
        this.pixelOutlineGraphics.moveTo(x, y + this.gridSize)
        this.pixelOutlineGraphics.lineTo(x + this.gridSize, y + this.gridSize)
        this.pixelOutlineGraphics.strokePath()
      }
      
      // Left edge
      if (!cellSet.has(`${cell.x - 1},${cell.y}`)) {
        this.pixelOutlineGraphics.beginPath()
        this.pixelOutlineGraphics.moveTo(x, y)
        this.pixelOutlineGraphics.lineTo(x, y + this.gridSize)
        this.pixelOutlineGraphics.strokePath()
      }
      
      // Right edge
      if (!cellSet.has(`${cell.x + 1},${cell.y}`)) {
        this.pixelOutlineGraphics.beginPath()
        this.pixelOutlineGraphics.moveTo(x + this.gridSize, y)
        this.pixelOutlineGraphics.lineTo(x + this.gridSize, y + this.gridSize)
        this.pixelOutlineGraphics.strokePath()
      }
    })
  }
  
  private drawMarchingSquaresLayers(grid: number[][], startX: number, webTop: number, webBottom: number, cols: number, rows: number) {
    // Convert binary grid to scalar field
    const scalarGrid = binaryToScalarField(grid, this.scalarFieldMethod, this.scalarFieldRadius)
    
    // Apply marching squares without smoothing first
    const rawOptions: MarchingSquaresOptions = {
      threshold: this.threshold,
      interpolationMethod: this.interpolationMethod,
      saddlePointResolution: this.saddlePointResolution,
      smoothing: false, // Always get raw contours first
      edgeSnapping: true,
      snapDistance: this.snapDistance,
      offsetX: this.contourOffsetX,
      offsetY: this.contourOffsetY,
      globalOffsetX: this.contourGlobalOffsetX,
      globalOffsetY: this.contourGlobalOffsetY,
      bufferSize: this.contourBufferSize,
      bufferValue: this.contourBufferValue,
      alignmentMode: this.alignmentMode,
      clampToGrid: this.clampToGrid,
      extendToBoundary: this.extendToBoundary
    }
    const rawContours = marchingSquaresOptimized(scalarGrid, rawOptions)
    
    // Draw raw contours
    if (this.rawContourGraphics) {
      this.rawContourGraphics.lineStyle(3, 0xFF6B6B, 0.8) // Red, thicker line
      
      rawContours.forEach(contour => {
        const screenContour = contour.map(pt => ({
          x: startX + pt.x * this.gridSize,
          y: webTop + pt.y * this.gridSize
        }))
        
        this.rawContourGraphics.beginPath()
        screenContour.forEach((point, index) => {
          if (index === 0) {
            this.rawContourGraphics.moveTo(point.x, point.y)
          } else {
            this.rawContourGraphics.lineTo(point.x, point.y)
          }
        })
        this.rawContourGraphics.closePath()
        this.rawContourGraphics.strokePath()
        
        // Draw control points if enabled
        if (this.showControlPoints && this.controlPointGraphics) {
          this.controlPointGraphics.fillStyle(0xFFFF00, 0.8) // Yellow
          screenContour.forEach(point => {
            this.controlPointGraphics.fillCircle(point.x, point.y, 3)
          })
        }
      })
    }
    
    // Draw smoothed contours if smoothing is enabled
    if (!this.showRawMarchingSquares && this.smoothedContourGraphics) {
      // Apply marching squares with smoothing
      const smoothOptions: MarchingSquaresOptions = {
        ...rawOptions,
        smoothing: true,
        smoothingMethod: this.smoothingMethod,
        smoothingIterations: this.smoothingIterations,
        smoothingStrength: this.smoothingStrength,
        collisionAvoidance: this.collisionAvoidance,
        collisionMinDistance: this.collisionMinDistance,
        collisionMethod: this.collisionMethod,
        collisionIterations: this.collisionIterations
      }
      const smoothContours = marchingSquaresOptimized(scalarGrid, smoothOptions)
      
      this.smoothedContourGraphics.lineStyle(3, 0x00FF00, 0.8) // Green, thicker line
      
      smoothContours.forEach(contour => {
        const screenContour = contour.map(pt => ({
          x: startX + pt.x * this.gridSize,
          y: webTop + pt.y * this.gridSize
        }))
        
        this.smoothedContourGraphics.beginPath()
        screenContour.forEach((point, index) => {
          if (index === 0) {
            this.smoothedContourGraphics.moveTo(point.x, point.y)
          } else {
            this.smoothedContourGraphics.lineTo(point.x, point.y)
          }
        })
        this.smoothedContourGraphics.closePath()
        this.smoothedContourGraphics.strokePath()
      })
    }
  }
    
  private drawMarchingSquaresContours(
    webCells: {x: number, y: number}[], 
    startX: number, 
    webTop: number, 
    webBottom: number,
    cols: number,
    rows: number,
    showControlPoints: boolean = false
  ) {
    if (!this.lossGraphics || !this.controlPointGraphics) return
    
    // Create grid
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    // Fill the grid based on web cells
    webCells.forEach(cell => {
      const gridX = cell.x
      const gridY = rows - 1 - cell.y
      if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
        grid[gridY][gridX] = 1
      }
    })
    
    // Convert binary grid to scalar field for interpolation
    const scalarGrid = binaryToScalarField(grid, this.scalarFieldMethod, this.scalarFieldRadius)
    
    // Apply marching squares
    const marchingOptions: MarchingSquaresOptions = {
      threshold: this.threshold,
      interpolationMethod: this.interpolationMethod,
      saddlePointResolution: this.saddlePointResolution,
      alignmentMode: this.alignmentMode,
      smoothing: !this.showRawMarchingSquares && !this.editMode,
      edgeSnapping: this.clampToGrid,
      extendToBoundary: this.extendToBoundary,
      snapDistance: this.snapDistance,
      offsetX: this.contourOffsetX,
      offsetY: this.contourOffsetY,
      globalOffsetX: this.contourGlobalOffsetX,
      globalOffsetY: this.contourGlobalOffsetY,
      bufferSize: this.contourBufferSize,
      bufferValue: this.contourBufferValue,
      smoothingMethod: this.smoothingMethod,
      smoothingIterations: this.smoothingIterations,
      smoothingStrength: this.smoothingStrength,
      collisionAvoidance: this.collisionAvoidance,
      collisionMinDistance: this.collisionMinDistance,
      collisionMethod: this.collisionMethod,
      collisionIterations: this.collisionIterations
    }
    
    const contours = marchingSquaresOptimized(scalarGrid, marchingOptions)
    
    // Clear control points
    this.controlPointGraphics.clear()
    
    // Draw contours
    this.lossGraphics.lineStyle(2, 0xFF6B6B)
    
    contours.forEach(contour => {
      if (contour.length < 3) return
      
      // Transform contour points to screen coordinates with edge clamping
      const screenContour = contour.map(point => {
        let x = startX + point.x * this.gridSize
        let y = webTop + point.y * this.gridSize
        
        // Clamp exactly to web edges
        x = Math.max(startX, x)
        x = Math.min(startX + this.beamLength * this.gridSize, x)
        y = Math.max(webTop, y)
        y = Math.min(webBottom, y)
        
        return { x, y }
      })
      
      // Draw the contour
      if (this.editMode || this.showRawMarchingSquares) {
        // In edit mode or raw mode, always use linear segments
        this.lossGraphics.beginPath()
        screenContour.forEach((point, index) => {
          if (index === 0) {
            this.lossGraphics.moveTo(point.x, point.y)
          } else {
            this.lossGraphics.lineTo(point.x, point.y)
          }
        })
        this.lossGraphics.closePath()
        this.lossGraphics.strokePath()
        
        // Draw control points if requested
        if (showControlPoints && this.showControlPoints && this.editMode) {
          this.controlPointGraphics.fillStyle(0x00FF00, 0.8) // Green control points
          screenContour.forEach(point => {
            this.controlPointGraphics.fillCircle(point.x, point.y, 3)
          })
        }
      } else {
        // View mode with smoothing
        if (this.useSmoothCurves && screenContour.length > 4) {
          drawBezierContour(this.lossGraphics, screenContour, true)
        } else {
          this.lossGraphics.beginPath()
          screenContour.forEach((point, index) => {
            if (index === 0) {
              this.lossGraphics.moveTo(point.x, point.y)
            } else {
              this.lossGraphics.lineTo(point.x, point.y)
            }
          })
          this.lossGraphics.closePath()
          this.lossGraphics.fillPath()
          this.lossGraphics.strokePath()
        }
      }
    })
  }
  
  private drawRectangularOutlines(webCells: {x: number, y: number}[], startX: number, webBottom: number) {
    // Create a set for quick lookup
    const cellSet = new Set(webCells.map(c => `${c.x},${c.y}`))
    const visited = new Set<string>()
    
    // Find connected regions and draw their outlines
    webCells.forEach(cell => {
      const key = `${cell.x},${cell.y}`
      if (visited.has(key)) return
      
      // Find all cells in this connected region
      const region: {x: number, y: number}[] = []
      const queue = [cell]
      
      while (queue.length > 0) {
        const current = queue.pop()!
        const currentKey = `${current.x},${current.y}`
        
        if (visited.has(currentKey)) continue
        visited.add(currentKey)
        region.push(current)
        
        // Check all 4 neighbors
        const neighbors = [
          {x: current.x + 1, y: current.y},
          {x: current.x - 1, y: current.y},
          {x: current.x, y: current.y + 1},
          {x: current.x, y: current.y - 1}
        ]
        
        neighbors.forEach(neighbor => {
          const neighborKey = `${neighbor.x},${neighbor.y}`
          if (cellSet.has(neighborKey) && !visited.has(neighborKey)) {
            queue.push(neighbor)
          }
        })
      }
      
      // Draw outline for this region
      this.drawRegionOutline(region, startX, webBottom)
    })
  }
  
  private drawRegionOutline(region: {x: number, y: number}[], startX: number, webBottom: number) {
    if (!this.lossGraphics || region.length === 0) return
    
    // Create a set for quick lookup
    const regionSet = new Set(region.map(c => `${c.x},${c.y}`))
    const maxCol = Math.ceil(this.beamLength) - 1
    
    // For each cell in the region, draw edges that border empty cells
    region.forEach(cell => {
      let x = startX + cell.x * this.gridSize
      const y = webBottom - (cell.y + 1) * this.gridSize
      let cellWidth = this.gridSize
      
      // Extend to beam edges if at boundaries
      const beamLeft = startX
      const beamRight = startX + this.beamLength * this.gridSize
      
      if (cell.x === 0) {
        x = beamLeft
        cellWidth = startX + this.gridSize - beamLeft
      } else if (cell.x === maxCol) {
        cellWidth = beamRight - x
      }
      
      // Check each edge
      // Top edge
      if (!regionSet.has(`${cell.x},${cell.y + 1}`)) {
        this.lossGraphics.beginPath()
        this.lossGraphics.moveTo(x, y)
        this.lossGraphics.lineTo(x + cellWidth, y)
        this.lossGraphics.strokePath()
      }
      
      // Bottom edge
      if (!regionSet.has(`${cell.x},${cell.y - 1}`)) {
        this.lossGraphics.beginPath()
        this.lossGraphics.moveTo(x, y + this.gridSize)
        this.lossGraphics.lineTo(x + cellWidth, y + this.gridSize)
        this.lossGraphics.strokePath()
      }
      
      // Left edge - only draw if not at beam edge or if neighbor exists
      if (!regionSet.has(`${cell.x - 1},${cell.y}`)) {
        if (cell.x !== 0) {
          this.lossGraphics.beginPath()
          this.lossGraphics.moveTo(x, y)
          this.lossGraphics.lineTo(x, y + this.gridSize)
          this.lossGraphics.strokePath()
        }
      }
      
      // Right edge - only draw if not at beam edge or if neighbor exists
      if (!regionSet.has(`${cell.x + 1},${cell.y}`)) {
        if (cell.x !== maxCol) {
          this.lossGraphics.beginPath()
          this.lossGraphics.moveTo(x + cellWidth, y)
          this.lossGraphics.lineTo(x + cellWidth, y + this.gridSize)
          this.lossGraphics.strokePath()
        }
      }
    })
  }

  private drawSectionLoss(startX: number, centerY: number, width: number) {
    if (!this.beamProfile) return
    
    // Clear all visualization layers
    this.lossGraphics?.clear()
    this.pixelOutlineGraphics?.clear()
    this.blurredFieldGraphics?.clear()
    this.rawContourGraphics?.clear()
    this.smoothedContourGraphics?.clear()
    this.controlPointGraphics?.clear()
    
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
    
    // Draw flange section loss
    const topFlangeCells = allFlangeCells.filter(c => c.zone === 'flange-top' && this.showTopFlange)
    const bottomFlangeCells = allFlangeCells.filter(c => c.zone === 'flange-bottom')
    
    if (topFlangeCells.length > 0) {
      this.drawFlangeSectionLoss(topFlangeCells, startX, flangeTop, flangeThickness)
    }
    
    if (bottomFlangeCells.length > 0) {
      this.drawFlangeSectionLoss(bottomFlangeCells, startX, webBottom, flangeThickness)
    }
  }
  
  private drawFlangeSectionLoss(flangeCells: {zone: string, x: number, y: number}[], startX: number, flangeY: number, flangeThickness: number) {
    if (!this.lossGraphics) return
    
    // Set fill style
    this.lossGraphics.fillStyle(0xFFB3BA, 0.8)
    
    // Fill individual cells with proper edge extension
    flangeCells.forEach(cell => {
      let x = startX + cell.x * this.gridSize
      let cellWidth = this.gridSize
      
      // Extend to beam edges if at boundaries
      const beamLeft = startX
      const beamRight = startX + this.beamLength * this.gridSize
      const maxCol = Math.ceil(this.beamLength) - 1
      
      if (cell.x === 0) {
        x = beamLeft
        cellWidth = startX + this.gridSize - beamLeft
      } else if (cell.x === maxCol) {
        cellWidth = beamRight - x
      }
      
      this.lossGraphics.fillRect(x, flangeY, cellWidth, flangeThickness * this.gridSize)
    })
    
    // Draw outlines - darker red for flanges
    this.lossGraphics.lineStyle(2, 0xCC5555)
    
    // Create a set for quick lookup
    const cellSet = new Set(flangeCells.map(c => c.x))
    const visited = new Set<number>()
    
    // Find continuous segments and draw their outlines
    flangeCells.forEach(cell => {
      if (visited.has(cell.x)) return
      
      // Find all cells in this continuous segment
      const segment: number[] = [cell.x]
      visited.add(cell.x)
      
      // Extend left
      let current = cell.x - 1
      while (cellSet.has(current) && !visited.has(current)) {
        segment.unshift(current)
        visited.add(current)
        current--
      }
      
      // Extend right
      current = cell.x + 1
      while (cellSet.has(current) && !visited.has(current)) {
        segment.push(current)
        visited.add(current)
        current++
      }
      
      // Draw outline for this segment
      let leftX = startX + segment[0] * this.gridSize
      let rightX = startX + (segment[segment.length - 1] + 1) * this.gridSize
      const height = flangeThickness * this.gridSize
      
      // Check if segment touches beam edges and extend to actual edge
      const beamLeft = startX
      const beamRight = startX + this.beamLength * this.gridSize
      
      // If first cell is at column 0, extend to beam edge
      if (segment[0] === 0) {
        leftX = beamLeft
      }
      
      // If last cell is at the end, extend to beam edge
      if (segment[segment.length - 1] === Math.ceil(this.beamLength) - 1) {
        rightX = beamRight
      }
      
      // Top edge
      this.lossGraphics.beginPath()
      this.lossGraphics.moveTo(leftX, flangeY)
      this.lossGraphics.lineTo(rightX, flangeY)
      this.lossGraphics.strokePath()
      
      // Bottom edge
      this.lossGraphics.beginPath()
      this.lossGraphics.moveTo(leftX, flangeY + height)
      this.lossGraphics.lineTo(rightX, flangeY + height)
      this.lossGraphics.strokePath()
      
      // Left edge - only draw if not at beam edge
      if (segment[0] !== 0) {
        this.lossGraphics.beginPath()
        this.lossGraphics.moveTo(leftX, flangeY)
        this.lossGraphics.lineTo(leftX, flangeY + height)
        this.lossGraphics.strokePath()
      }
      
      // Right edge - only draw if not at beam edge
      if (segment[segment.length - 1] !== Math.ceil(this.beamLength) - 1) {
        this.lossGraphics.beginPath()
        this.lossGraphics.moveTo(rightX, flangeY)
        this.lossGraphics.lineTo(rightX, flangeY + height)
        this.lossGraphics.strokePath()
      }
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
        const y = flangeTop
        this.createGridCell(x, y, col, 0, 'flange-top', true)
      }
    }
    
    // Bottom flange - 1D linear grid
    for (let col = 0; col < cols; col++) {
      const x = startX + col * this.gridSize
      const y = webBottom
      this.createGridCell(x, y, col, 0, 'flange-bottom', true)
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
      
      // Set paint mode based on current cell state
      if (this.selectedCells.has(key)) {
        this.paintMode = 'remove'
        this.selectedCells.delete(key)
        cell.setFillStyle(0xffffff, 0)
      } else {
        this.paintMode = 'add'
        this.selectedCells.add(key)
        cell.setFillStyle(0x888888, 0.3) // Light gray to indicate selection
      }
      
      this.isMouseDown = true
      this.isPainting = true
      
      // Redraw loss graphics
      const sceneWidth = this.cameras.main.width
      const padding = 100
      const startX = padding
      const beamWidth = this.beamLength * this.gridSize
      this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
      
      // Update grid cell visibility based on selection
      this.updateGridCellVisibility()
      
      this.notifyCellChange()
    })

    cell.on('pointerover', () => {
      if (!this.editMode) return
      
      const zone = cell.getData('zone') || 'default'
      const key = `${zone}_${cell.getData('col')}_${cell.getData('row')}`
      
      // If mouse is down and we're painting, apply the paint mode
      if (this.isMouseDown && this.isPainting && this.paintMode) {
        if (this.paintMode === 'add' && !this.selectedCells.has(key)) {
          this.selectedCells.add(key)
          cell.setFillStyle(0x888888, 0.3)
          
          // Redraw section loss and notify
          const sceneWidth = this.cameras.main.width
          const padding = 100
          const startX = padding
          const beamWidth = this.beamLength * this.gridSize
          this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
          this.updateGridCellVisibility()
          this.notifyCellChange()
        } else if (this.paintMode === 'remove' && this.selectedCells.has(key)) {
          this.selectedCells.delete(key)
          cell.setFillStyle(0xffffff, 0)
          
          // Redraw section loss and notify
          const sceneWidth = this.cameras.main.width
          const padding = 100
          const startX = padding
          const beamWidth = this.beamLength * this.gridSize
          this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
          this.updateGridCellVisibility()
          this.notifyCellChange()
        }
      } else if (!this.selectedCells.has(key)) {
        // Just hover effect
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

    // Height dimension lines - position based on grid origin
    const graphics = this.add.graphics()
    
    // Dimension positions
    const dim1X = this.gridOrigin === 'left' ? startX - 20 : startX + width + 20  // Closest to beam
    const dim2X = this.gridOrigin === 'left' ? startX - 35 : startX + width + 35  // Middle
    const dim3X = this.gridOrigin === 'left' ? startX - 55 : startX + width + 55  // Farthest
    
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = topY
    
    // Draw all dimension lines with consistent style
    graphics.lineStyle(1, 0x666666, 0.8)
    
    // Extension line offset from actual points
    const extOffset = 2 // pixels to stop short of vertices
    const beamEdgeX = this.gridOrigin === 'left' ? startX : startX + width
    const extDir = this.gridOrigin === 'left' ? -1 : 1
    
    // Top flange dimension (closest to beam)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, flangeTop)
    graphics.lineTo(dim1X + extDir * 5, flangeTop)
    graphics.moveTo(beamEdgeX - extDir * 5, webTop)
    graphics.lineTo(dim1X + extDir * 5, webTop)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim1X, flangeTop + extOffset)
    graphics.lineTo(dim1X, webTop - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim1X - 2, flangeTop + extOffset + 3)
    graphics.lineTo(dim1X, flangeTop + extOffset)
    graphics.lineTo(dim1X + 2, flangeTop + extOffset + 3)
    graphics.moveTo(dim1X - 2, webTop - extOffset - 3)
    graphics.lineTo(dim1X, webTop - extOffset)
    graphics.lineTo(dim1X + 2, webTop - extOffset - 3)
    graphics.strokePath()
    
    this.add.text(dim1X + (this.gridOrigin === 'left' ? -5 : 5), flangeTop + (webTop - flangeTop) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Web height dimension (middle)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, webTop)
    graphics.lineTo(dim2X + extDir * 5, webTop)
    graphics.moveTo(beamEdgeX - extDir * 5, webBottom)
    graphics.lineTo(dim2X + extDir * 5, webBottom)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim2X, webTop + extOffset)
    graphics.lineTo(dim2X, webBottom - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim2X - 2, webTop + extOffset + 3)
    graphics.lineTo(dim2X, webTop + extOffset)
    graphics.lineTo(dim2X + 2, webTop + extOffset + 3)
    graphics.moveTo(dim2X - 2, webBottom - extOffset - 3)
    graphics.lineTo(dim2X, webBottom - extOffset)
    graphics.lineTo(dim2X + 2, webBottom - extOffset - 3)
    graphics.strokePath()
    
    // Web height label - rotated vertically
    const webText = this.add.text(dim2X + (this.gridOrigin === 'left' ? -5 : 5), centerY, `${webHeight.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    })
    webText.setOrigin(0.5, this.gridOrigin === 'left' ? 1 : 0)
    webText.setRotation(this.gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)
    
    // Bottom flange dimension (closest to beam)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, webBottom)
    graphics.lineTo(dim1X + extDir * 5, webBottom)
    graphics.moveTo(beamEdgeX - extDir * 5, bottomY)
    graphics.lineTo(dim1X + extDir * 5, bottomY)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim1X, webBottom + extOffset)
    graphics.lineTo(dim1X, bottomY - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim1X - 2, webBottom + extOffset + 3)
    graphics.lineTo(dim1X, webBottom + extOffset)
    graphics.lineTo(dim1X + 2, webBottom + extOffset + 3)
    graphics.moveTo(dim1X - 2, bottomY - extOffset - 3)
    graphics.lineTo(dim1X, bottomY - extOffset)
    graphics.lineTo(dim1X + 2, bottomY - extOffset - 3)
    graphics.strokePath()
    
    this.add.text(dim1X + (this.gridOrigin === 'left' ? -5 : 5), webBottom + (bottomY - webBottom) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Overall height dimension (farthest)
    graphics.lineStyle(1, 0x333333)
    
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, topY)
    graphics.lineTo(dim3X + extDir * 5, topY)
    graphics.moveTo(beamEdgeX - extDir * 5, bottomY)
    graphics.lineTo(dim3X + extDir * 5, bottomY)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim3X, topY + extOffset)
    graphics.lineTo(dim3X, bottomY - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim3X - 3, topY + extOffset + 4)
    graphics.lineTo(dim3X, topY + extOffset)
    graphics.lineTo(dim3X + 3, topY + extOffset + 4)
    graphics.moveTo(dim3X - 3, bottomY - extOffset - 4)
    graphics.lineTo(dim3X, bottomY - extOffset)
    graphics.lineTo(dim3X + 3, bottomY - extOffset - 4)
    graphics.strokePath()
    
    // Overall height label - rotated vertically
    const heightText = this.add.text(dim3X + (this.gridOrigin === 'left' ? -8 : 8), centerY, `${totalHeight.toFixed(3)}"`, {
      fontSize: '13px',
      color: '#333',
      fontWeight: 'bold'
    })
    heightText.setOrigin(0.5, this.gridOrigin === 'left' ? 1 : 0)
    heightText.setRotation(this.gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)

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
      
      // Redraw section loss with appropriate style
      const sceneWidth = this.cameras.main.width
      const padding = 100
      const startX = padding
      const beamWidth = this.beamLength * this.gridSize
      this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
      
      // Update grid cell visibility
      this.updateGridCellVisibility()
      
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
      
      // Redraw section loss with appropriate style
      const sceneWidth = this.cameras.main.width
      const padding = 100
      const startX = padding
      const beamWidth = this.beamLength * this.gridSize
      this.drawSectionLoss(startX, this.cameras.main.height / 2, beamWidth)
      
      // Update grid cell visibility
      this.updateGridCellVisibility()
      
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
  
  // Public methods to adjust contour alignment
  public setContourOffsets(offsetX: number, offsetY: number): void {
    this.contourOffsetX = offsetX
    this.contourOffsetY = offsetY
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setContourGlobalOffsets(globalOffsetX: number, globalOffsetY: number): void {
    this.contourGlobalOffsetX = globalOffsetX
    this.contourGlobalOffsetY = globalOffsetY
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getContourOffsets(): { cellX: number; cellY: number; globalX: number; globalY: number } {
    return {
      cellX: this.contourOffsetX,
      cellY: this.contourOffsetY,
      globalX: this.contourGlobalOffsetX,
      globalY: this.contourGlobalOffsetY
    }
  }
  
  public setContourBuffer(bufferSize: number, bufferValue: number): void {
    this.contourBufferSize = bufferSize
    this.contourBufferValue = bufferValue
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getContourBuffer(): { size: number; value: number } {
    return {
      size: this.contourBufferSize,
      value: this.contourBufferValue
    }
  }
  
  public setSmoothingOptions(method: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent', iterations: number, strength: number): void {
    this.smoothingMethod = method
    this.smoothingIterations = iterations
    this.smoothingStrength = strength
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getSmoothingOptions(): { smoothingMethod: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent'; smoothingIterations: number; smoothingStrength: number } {
    return {
      smoothingMethod: this.smoothingMethod,
      smoothingIterations: this.smoothingIterations,
      smoothingStrength: this.smoothingStrength
    }
  }
  
  public setCollisionAvoidance(enabled: boolean, minDistance: number, method: 'push' | 'shrink' | 'hybrid', iterations: number): void {
    this.collisionAvoidance = enabled
    this.collisionMinDistance = minDistance
    this.collisionMethod = method
    this.collisionIterations = iterations
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getCollisionAvoidance(): { collisionAvoidance: boolean; collisionMinDistance: number; collisionMethod: 'push' | 'shrink' | 'hybrid'; collisionIterations: number } {
    return {
      collisionAvoidance: this.collisionAvoidance,
      collisionMinDistance: this.collisionMinDistance,
      collisionMethod: this.collisionMethod,
      collisionIterations: this.collisionIterations
    }
  }
  
  public setShowRawMarchingSquares(show: boolean): void {
    this.showRawMarchingSquares = show
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getShowRawMarchingSquares(): boolean {
    return this.showRawMarchingSquares
  }
  
  public setShowControlPoints(show: boolean): void {
    this.showControlPoints = show
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getShowControlPoints(): boolean {
    return this.showControlPoints
  }
  
  public setShowBlurredField(show: boolean): void {
    this.showBlurredField = show
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getShowBlurredField(): boolean {
    return this.showBlurredField
  }
  
  // Getters for algorithm controls
  public getInterpolationMethod(): 'linear' | 'cubic' | 'none' {
    return this.interpolationMethod
  }
  
  public getSaddlePointResolution(): 'center' | 'gradient' | 'majority' {
    return this.saddlePointResolution
  }
  
  public getThreshold(): number {
    return this.threshold
  }
  
  public getAlignmentMode(): 'edges' | 'vertices' | 'center' {
    return this.alignmentMode
  }
  
  public getClampToGrid(): boolean {
    return this.clampToGrid
  }
  
  public getExtendToBoundary(): boolean {
    return this.extendToBoundary
  }
  
  public getSnapDistance(): number {
    return this.snapDistance
  }
  
  // Marching Squares Algorithm Controls
  public setInterpolationMethod(method: 'linear' | 'cubic' | 'none'): void {
    this.interpolationMethod = method
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setSaddlePointResolution(resolution: 'center' | 'gradient' | 'majority'): void {
    this.saddlePointResolution = resolution
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setThreshold(threshold: number): void {
    this.threshold = threshold
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setAlignmentMode(mode: 'edges' | 'vertices' | 'center'): void {
    this.alignmentMode = mode
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setClampToGrid(clamp: boolean): void {
    this.clampToGrid = clamp
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setExtendToBoundary(extend: boolean): void {
    this.extendToBoundary = extend
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public setSnapDistance(distance: number): void {
    this.snapDistance = distance
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  // Scalar Field Controls
  public getScalarFieldMethod(): ScalarFieldMethod {
    return this.scalarFieldMethod
  }
  
  public setScalarFieldMethod(method: ScalarFieldMethod): void {
    this.scalarFieldMethod = method
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
  
  public getScalarFieldRadius(): number {
    return this.scalarFieldRadius
  }
  
  public setScalarFieldRadius(radius: number): void {
    this.scalarFieldRadius = radius
    this.drawSectionLoss(
      100,
      this.cameras.main.centerY,
      this.beamLength * this.gridSize
    )
  }
}