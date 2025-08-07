import Phaser from 'phaser'
import { BeamProfile } from '../../types/beam'
import { ContourStyles, ControlPointStyles, createGridToScreenTransform, renderContours } from '../ContourRenderer'

export interface BeamDimensions {
  startX: number
  centerY: number
  width: number
  gridSize: number
}

export interface RenderLayers {
  beam: boolean
  topFlange: boolean
  sectionLoss: boolean
  contours: boolean
  controlPoints: boolean
  pixelOutline: boolean
  blurredField: boolean
  rawContour: boolean
  smoothedContour: boolean
  binaryContour: boolean
}

export interface BeamRenderConfig {
  showTopFlange: boolean
  gridSize: number
  selectedCells: Set<string>
  contourOffsetX: number
  contourOffsetY: number
  showContours: boolean
  showControlPoints: boolean
  showPixelOutline: boolean
  showBlurredField: boolean
  showRawContour: boolean
  showSmoothedContour: boolean
  showBinaryContour: boolean
}

export interface ContourData {
  binaryContours?: Array<Array<{x: number, y: number}>>
  rawContours?: Array<Array<{x: number, y: number}>>
  smoothedContours?: Array<Array<{x: number, y: number}>>
  controlPoints?: Array<{x: number, y: number}>
  pixelOutline?: Array<{x: number, y: number}>
  blurredField?: number[][]
}

/**
 * BeamRenderer manages all Phaser graphics rendering for beam visualization
 * Extracted from BeamElevationScene to improve maintainability and testability
 */
export class BeamRenderer {
  private scene: Phaser.Scene
  private beamProfile: BeamProfile | null = null
  
  // Graphics objects for different layers
  private beamGraphics: Phaser.GameObjects.Graphics | null = null
  private topFlangeGraphics: Phaser.GameObjects.Graphics | null = null
  private lossGraphics: Phaser.GameObjects.Graphics | null = null
  private controlPointGraphics: Phaser.GameObjects.Graphics | null = null
  private pixelOutlineGraphics: Phaser.GameObjects.Graphics | null = null
  private blurredFieldGraphics: Phaser.GameObjects.Graphics | null = null
  private rawContourGraphics: Phaser.GameObjects.Graphics | null = null
  private smoothedContourGraphics: Phaser.GameObjects.Graphics | null = null
  private binaryContourGraphics: Phaser.GameObjects.Graphics | null = null
  
  // Render configuration
  private config: BeamRenderConfig = {
    showTopFlange: true,
    gridSize: 30,
    selectedCells: new Set(),
    contourOffsetX: 0,
    contourOffsetY: 0,
    showContours: true,
    showControlPoints: false,
    showPixelOutline: false,
    showBlurredField: false,
    showRawContour: false,
    showSmoothedContour: true,
    showBinaryContour: false
  }
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.initializeGraphicsLayers()
  }

  /**
   * Initialize all graphics layers
   */
  private initializeGraphicsLayers(): void {
    this.beamGraphics = this.scene.add.graphics()
    this.topFlangeGraphics = this.scene.add.graphics()
    this.lossGraphics = this.scene.add.graphics()
    this.controlPointGraphics = this.scene.add.graphics()
    this.pixelOutlineGraphics = this.scene.add.graphics()
    this.blurredFieldGraphics = this.scene.add.graphics()
    this.rawContourGraphics = this.scene.add.graphics()
    this.smoothedContourGraphics = this.scene.add.graphics()
    this.binaryContourGraphics = this.scene.add.graphics()
    
    // Set layer depths
    this.beamGraphics.setDepth(1)
    this.topFlangeGraphics.setDepth(1)
    this.lossGraphics.setDepth(2)
    this.pixelOutlineGraphics.setDepth(3)
    this.blurredFieldGraphics.setDepth(3)
    this.binaryContourGraphics.setDepth(4)
    this.rawContourGraphics.setDepth(4)
    this.smoothedContourGraphics.setDepth(4)
    this.controlPointGraphics.setDepth(5)
  }

  /**
   * Set the beam profile for rendering
   */
  setBeamProfile(beamProfile: BeamProfile): void {
    this.beamProfile = beamProfile
  }

  /**
   * Update rendering configuration
   */
  updateConfig(config: Partial<BeamRenderConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Draw the beam profile (web and flanges)
   */
  drawBeamProfile(dimensions: BeamDimensions): void {
    if (!this.beamProfile || !this.beamGraphics || !this.topFlangeGraphics) {
      console.warn('BeamRenderer: Cannot draw beam profile without beam profile and graphics')
      return
    }

    const { startX, centerY, width } = dimensions
    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.config.gridSize) / 2
    const webBottom = centerY + (webHeight * this.config.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.config.gridSize
    const flangeBottom = webBottom + flangeThickness * this.config.gridSize

    // Clear previous drawings
    this.beamGraphics.clear()
    this.topFlangeGraphics.clear()

    // Set beam color (pastel green)
    this.beamGraphics.fillStyle(0xB8E6B8)
    this.beamGraphics.lineStyle(2, 0x4A7C4A)

    // Draw top flange separately
    if (this.config.showTopFlange) {
      this.topFlangeGraphics.fillStyle(0xB8E6B8)
      this.topFlangeGraphics.lineStyle(2, 0x4A7C4A)
    } else {
      // Grey out top flange
      this.topFlangeGraphics.fillStyle(0xCCCCCC)
      this.topFlangeGraphics.lineStyle(2, 0x888888)
    }
    this.topFlangeGraphics.fillRect(startX, flangeTop, width, flangeThickness * this.config.gridSize)
    this.topFlangeGraphics.strokeRect(startX, flangeTop, width, flangeThickness * this.config.gridSize)

    // Draw web
    this.beamGraphics.fillRect(startX, webTop, width, webBottom - webTop)
    this.beamGraphics.strokeRect(startX, webTop, width, webBottom - webTop)

    // Draw bottom flange
    this.beamGraphics.fillRect(startX, webBottom, width, flangeThickness * this.config.gridSize)
    this.beamGraphics.strokeRect(startX, webBottom, width, flangeThickness * this.config.gridSize)
  }

  /**
   * Draw section loss visualization for selected cells
   */
  drawSectionLoss(dimensions: BeamDimensions): void {
    if (!this.beamProfile) {
      console.warn('BeamRenderer: Cannot draw section loss without beam profile')
      return
    }
    
    // Clear all visualization layers
    this.clearVisualizationLayers()
    
    const { startX, centerY, width } = dimensions
    const { webHeight, flangeThickness } = this.beamProfile
    const webTop = centerY - (webHeight * this.config.gridSize) / 2
    const webBottom = centerY + (webHeight * this.config.gridSize) / 2
    const flangeTop = webTop - flangeThickness * this.config.gridSize
    
    // Process all cells - they're already in absolute positions
    const allWebCells: {x: number, y: number}[] = []
    const allFlangeCells: {zone: string, x: number, y: number}[] = []
    
    // Get cells from the selectedCells set
    this.config.selectedCells.forEach(key => {
      const parts = key.split('_')
      if (parts.length >= 3) {
        const zone = parts[0]
        const col = parseInt(parts[1])
        const row = parseInt(parts[2])
        
        if (zone === 'web') {
          // For web cells, calculate actual position based on grid layout
          const cellX = startX + col * this.config.gridSize
          const cellY = webBottom - (row + 1) * this.config.gridSize
          
          // Only include if within visible web area
          if (cellY >= webTop) {
            allWebCells.push({ x: cellX, y: cellY })
          }
        } else if (zone === 'flange-top' || zone === 'flange-bottom') {
          // For flange cells, they're linear (1D)
          const cellX = startX + col * this.config.gridSize
          let cellY: number
          
          if (zone === 'flange-top') {
            cellY = flangeTop
          } else {
            cellY = webBottom
          }
          
          allFlangeCells.push({ zone, x: cellX, y: cellY })
        }
      }
    })

    // Draw selected cells if any exist
    if (allWebCells.length > 0 || allFlangeCells.length > 0) {
      this.renderSectionLossCells(allWebCells, allFlangeCells, dimensions)
    }
  }

  /**
   * Render section loss cells on the loss graphics layer
   */
  private renderSectionLossCells(
    webCells: {x: number, y: number}[], 
    flangeCells: {zone: string, x: number, y: number}[], 
    dimensions: BeamDimensions
  ): void {
    if (!this.lossGraphics) return

    // Set section loss style (red with transparency)
    this.lossGraphics.fillStyle(0xFF6B6B, 0.7)
    this.lossGraphics.lineStyle(1, 0xFF0000, 0.8)

    // Draw web cells
    webCells.forEach(cell => {
      this.lossGraphics!.fillRect(cell.x, cell.y, this.config.gridSize, this.config.gridSize)
      this.lossGraphics!.strokeRect(cell.x, cell.y, this.config.gridSize, this.config.gridSize)
    })

    // Draw flange cells
    flangeCells.forEach(cell => {
      const height = this.beamProfile!.flangeThickness * this.config.gridSize
      this.lossGraphics!.fillRect(cell.x, cell.y, this.config.gridSize, height)
      this.lossGraphics!.strokeRect(cell.x, cell.y, this.config.gridSize, height)
    })
  }

  /**
   * Draw contour visualization layers
   */
  drawContours(contourData: ContourData, dimensions: BeamDimensions): void {
    const { startX, centerY, webHeight } = dimensions
    // Calculate the top of the web (center minus half the web height)
    const webTop = centerY - webHeight / 2
    const transform = createGridToScreenTransform(
      this.config.gridSize,
      startX + this.config.contourGlobalOffsetX * this.config.gridSize,
      webTop + this.config.contourGlobalOffsetY * this.config.gridSize
    )

    // Draw binary contours
    if (this.config.showBinaryContour && contourData.binaryContours && this.binaryContourGraphics) {
      this.binaryContourGraphics.clear()
      this.renderContourPaths(this.binaryContourGraphics, contourData.binaryContours, transform, {
        strokeColor: 0xFF6B6B,
        strokeWidth: 2,
        strokeAlpha: 0.8
      })
    }

    // Draw raw contours
    if (this.config.showRawContour && contourData.rawContours && this.rawContourGraphics) {
      this.rawContourGraphics.clear()
      this.renderContourPaths(this.rawContourGraphics, contourData.rawContours, transform, {
        strokeColor: 0xFFA500,
        strokeWidth: 1,
        strokeAlpha: 0.7
      })
    }

    // Draw smoothed contours
    if (this.config.showSmoothedContour && contourData.smoothedContours && this.smoothedContourGraphics) {
      this.smoothedContourGraphics.clear()
      this.renderContourPaths(this.smoothedContourGraphics, contourData.smoothedContours, transform, {
        strokeColor: 0x4A90E2,
        strokeWidth: 3,
        strokeAlpha: 1.0
      })
    }

    // Draw control points
    if (this.config.showControlPoints && contourData.controlPoints && this.controlPointGraphics) {
      this.controlPointGraphics.clear()
      this.renderControlPoints(this.controlPointGraphics, contourData.controlPoints, transform)
    }

    // Draw pixel outline
    if (this.config.showPixelOutline && contourData.pixelOutline && this.pixelOutlineGraphics) {
      this.pixelOutlineGraphics.clear()
      this.renderPixelOutline(this.pixelOutlineGraphics, contourData.pixelOutline, transform)
    }

    // Draw blurred field
    if (this.config.showBlurredField && contourData.blurredField && this.blurredFieldGraphics) {
      this.blurredFieldGraphics.clear()
      this.renderBlurredField(this.blurredFieldGraphics, contourData.blurredField, dimensions)
    }
  }

  /**
   * Render contour paths on a graphics object
   */
  private renderContourPaths(
    graphics: Phaser.GameObjects.Graphics, 
    contours: Array<Array<{x: number, y: number}>>, 
    transform: (gridX: number, gridY: number) => {x: number, y: number},
    style: { strokeColor: number, strokeWidth: number, strokeAlpha: number }
  ): void {
    if (!Array.isArray(contours)) {
      console.warn('BeamRenderer: Invalid contours data, expected array')
      return
    }
    
    graphics.lineStyle(style.strokeWidth, style.strokeColor, style.strokeAlpha)
    
    contours.forEach(contour => {
      if (contour && Array.isArray(contour) && contour.length > 1) {
        const startPoint = transform(contour[0].x, contour[0].y)
        graphics.beginPath()
        graphics.moveTo(startPoint.x, startPoint.y)
        
        for (let i = 1; i < contour.length; i++) {
          const point = transform(contour[i].x, contour[i].y)
          graphics.lineTo(point.x, point.y)
        }
        
        graphics.closePath()
        graphics.strokePath()
      }
    })
  }

  /**
   * Render control points for debugging
   */
  private renderControlPoints(
    graphics: Phaser.GameObjects.Graphics, 
    controlPoints: Array<{x: number, y: number}>, 
    transform: (gridX: number, gridY: number) => {x: number, y: number}
  ): void {
    graphics.fillStyle(0xFF0000, 0.8)
    
    controlPoints.forEach(point => {
      const screenPoint = transform(point.x, point.y)
      graphics.fillCircle(screenPoint.x, screenPoint.y, 3)
    })
  }

  /**
   * Render pixel outline for debugging
   */
  private renderPixelOutline(
    graphics: Phaser.GameObjects.Graphics, 
    pixelOutline: Array<{x: number, y: number}>, 
    transform: (gridX: number, gridY: number) => {x: number, y: number}
  ): void {
    graphics.lineStyle(1, 0x00FF00, 0.6)
    
    if (pixelOutline.length > 1) {
      const startPoint = transform(pixelOutline[0].x, pixelOutline[0].y)
      graphics.beginPath()
      graphics.moveTo(startPoint.x, startPoint.y)
      
      for (let i = 1; i < pixelOutline.length; i++) {
        const point = transform(pixelOutline[i].x, pixelOutline[i].y)
        graphics.lineTo(point.x, point.y)
      }
      
      graphics.strokePath()
    }
  }

  /**
   * Render blurred field visualization
   */
  private renderBlurredField(
    graphics: Phaser.GameObjects.Graphics, 
    blurredField: number[][], 
    dimensions: BeamDimensions
  ): void {
    const { startX, centerY } = dimensions
    
    for (let row = 0; row < blurredField.length; row++) {
      for (let col = 0; col < blurredField[row].length; col++) {
        const value = blurredField[row][col]
        const alpha = Math.min(value / 1.0, 1.0) // Normalize to 0-1
        
        if (alpha > 0.1) { // Only draw visible pixels
          const x = startX + col * this.config.gridSize + this.config.contourOffsetX
          const y = centerY + row * this.config.gridSize + this.config.contourOffsetY
          
          graphics.fillStyle(0x0080FF, alpha * 0.6)
          graphics.fillRect(x, y, this.config.gridSize, this.config.gridSize)
        }
      }
    }
  }

  /**
   * Clear all visualization layers
   */
  clearVisualizationLayers(): void {
    this.lossGraphics?.clear()
    this.pixelOutlineGraphics?.clear()
    this.blurredFieldGraphics?.clear()
    this.binaryContourGraphics?.clear()
    this.rawContourGraphics?.clear()
    this.smoothedContourGraphics?.clear()
    this.controlPointGraphics?.clear()
  }

  /**
   * Clear specific layers
   */
  clearLayers(layers: (keyof RenderLayers)[]): void {
    layers.forEach(layer => {
      switch (layer) {
        case 'beam':
          this.beamGraphics?.clear()
          break
        case 'topFlange':
          this.topFlangeGraphics?.clear()
          break
        case 'sectionLoss':
          this.lossGraphics?.clear()
          break
        case 'contours':
          this.rawContourGraphics?.clear()
          this.smoothedContourGraphics?.clear()
          this.binaryContourGraphics?.clear()
          break
        case 'controlPoints':
          this.controlPointGraphics?.clear()
          break
        case 'pixelOutline':
          this.pixelOutlineGraphics?.clear()
          break
        case 'blurredField':
          this.blurredFieldGraphics?.clear()
          break
        case 'rawContour':
          this.rawContourGraphics?.clear()
          break
        case 'smoothedContour':
          this.smoothedContourGraphics?.clear()
          break
        case 'binaryContour':
          this.binaryContourGraphics?.clear()
          break
      }
    })
  }

  /**
   * Set layer visibility
   */
  setLayerVisibility(layer: keyof RenderLayers, visible: boolean): void {
    switch (layer) {
      case 'beam':
        this.beamGraphics?.setVisible(visible)
        break
      case 'topFlange':
        this.topFlangeGraphics?.setVisible(visible)
        break
      case 'sectionLoss':
        this.lossGraphics?.setVisible(visible)
        break
      case 'controlPoints':
        this.controlPointGraphics?.setVisible(visible)
        break
      case 'pixelOutline':
        this.pixelOutlineGraphics?.setVisible(visible)
        break
      case 'blurredField':
        this.blurredFieldGraphics?.setVisible(visible)
        break
      case 'rawContour':
        this.rawContourGraphics?.setVisible(visible)
        break
      case 'smoothedContour':
        this.smoothedContourGraphics?.setVisible(visible)
        break
      case 'binaryContour':
        this.binaryContourGraphics?.setVisible(visible)
        break
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): BeamRenderConfig {
    return { ...this.config }
  }

  /**
   * Destroy all graphics objects and clean up resources
   */
  destroy(): void {
    this.beamGraphics?.destroy()
    this.topFlangeGraphics?.destroy()
    this.lossGraphics?.destroy()
    this.controlPointGraphics?.destroy()
    this.pixelOutlineGraphics?.destroy()
    this.blurredFieldGraphics?.destroy()
    this.rawContourGraphics?.destroy()
    this.smoothedContourGraphics?.destroy()
    this.binaryContourGraphics?.destroy()
    
    this.beamGraphics = null
    this.topFlangeGraphics = null
    this.lossGraphics = null
    this.controlPointGraphics = null
    this.pixelOutlineGraphics = null
    this.blurredFieldGraphics = null
    this.rawContourGraphics = null
    this.smoothedContourGraphics = null
    this.binaryContourGraphics = null
    
    this.beamProfile = null
  }
}
