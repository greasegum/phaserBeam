/**
 * Specialized renderer for beam dimensions
 * Extracted from the 183-line addDimensions function in BeamElevationScene
 */

import Phaser from 'phaser'
import { GraphicsHelper, Point2D } from './GraphicsHelper'
import { CoordinateTransformer, GridPoint, Transform } from '../services/CoordinateTransformer'
import { Result, success, failure, RenderingError, logger } from './Result'
import { gridToScreen } from './coordinateTransform'

export interface BeamProfile {
  webHeight: number
  flangeThickness: number
}

export interface BeamDimensions {
  top: number
  bottom: number
  webTop: number
  webBottom: number
  flangeTop: number
  flangeBottom: number
  totalHeight: number
}

export interface DimensionConfig {
  startX: number
  centerY: number
  width: number
  beamLength: number
  gridOrigin: 'left' | 'right'
  beamProfile: BeamProfile
  gridTransform: Transform
}

export interface DimensionPositions {
  dim1X: number  // Closest to beam
  dim2X: number  // Middle
  dim3X: number  // Farthest
  beamEdgeX: number
  extDir: number // Extension direction multiplier
}

/**
 * Renders beam dimensions with proper separation of concerns
 */
export class BeamDimensionRenderer {
  private scene: Phaser.Scene
  private graphics: Phaser.GameObjects.Graphics
  private coordinateTransformer: CoordinateTransformer

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.graphics = scene.add.graphics()
    
    // Initialize with default values - will be updated when rendering
    this.coordinateTransformer = new CoordinateTransformer(
      { size: 30, origin: { x: 0, y: 0 } },
      { length: 120, bottom: 0 }
    )
  }

  /**
   * Main entry point - renders all beam dimensions
   */
  renderDimensions(config: DimensionConfig): Result<void, RenderingError> {
    return Result.fromSync(() => {
      this.updateCoordinateTransformer(config)
      
      const beamDimensions = this.calculateBeamDimensions(config)
      const positions = this.calculateDimensionPositions(config)
      
      this.setupGraphicsStyle()
      
      this.drawFlangeDimensions(config, beamDimensions, positions)
      this.drawWebDimension(config, beamDimensions, positions)
      this.drawOverallDimension(config, beamDimensions, positions)
      this.drawLengthMarkers(config, beamDimensions)
    }).mapError(error => 
      new RenderingError(`Failed to render beam dimensions: ${error.message}`, config)
    )
  }

  /**
   * Calculate beam dimensions in screen coordinates
   */
  private calculateBeamDimensions(config: DimensionConfig): BeamDimensions {
    const { beamProfile, gridTransform } = config
    const { webHeight, flangeThickness } = beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    
    // Calculate in grid coordinates
    const beamTopGrid = -totalHeight / 2
    const beamBottomGrid = totalHeight / 2
    const webTopGrid = -webHeight / 2
    const webBottomGrid = webHeight / 2
    
    // Transform to screen coordinates
    const beamTop = gridToScreen({ x: 0, y: beamTopGrid }, gridTransform).y
    const beamBottom = gridToScreen({ x: 0, y: beamBottomGrid }, gridTransform).y
    const webTop = gridToScreen({ x: 0, y: webTopGrid }, gridTransform).y
    const webBottom = gridToScreen({ x: 0, y: webBottomGrid }, gridTransform).y
    
    return {
      top: beamTop,
      bottom: beamBottom,
      webTop,
      webBottom,
      flangeTop: beamTop,
      flangeBottom: beamBottom,
      totalHeight
    }
  }

  /**
   * Calculate positions for dimension lines
   */
  private calculateDimensionPositions(config: DimensionConfig): DimensionPositions {
    const { startX, width, gridOrigin } = config
    const isLeft = gridOrigin === 'left'
    
    return {
      dim1X: isLeft ? startX - 20 : startX + width + 20,
      dim2X: isLeft ? startX - 35 : startX + width + 35,
      dim3X: isLeft ? startX - 55 : startX + width + 55,
      beamEdgeX: isLeft ? startX : startX + width,
      extDir: isLeft ? -1 : 1
    }
  }

  /**
   * Set up consistent graphics styling
   */
  private setupGraphicsStyle(): void {
    GraphicsHelper.setDefaultStyle(this.graphics)
  }

  /**
   * Draw top and bottom flange dimensions
   */
  private drawFlangeDimensions(
    config: DimensionConfig,
    dimensions: BeamDimensions,
    positions: DimensionPositions
  ): void {
    const { beamProfile, gridOrigin } = config
    const { flangeThickness } = beamProfile
    const extOffset = 2

    // Top flange dimension
    this.drawFlangeDimension(
      positions.beamEdgeX,
      positions.dim1X,
      positions.extDir,
      dimensions.flangeTop,
      dimensions.webTop,
      extOffset,
      flangeThickness,
      'top',
      gridOrigin
    )

    // Bottom flange dimension
    this.drawFlangeDimension(
      positions.beamEdgeX,
      positions.dim1X,
      positions.extDir,
      dimensions.webBottom,
      dimensions.flangeBottom,
      extOffset,
      flangeThickness,
      'bottom',
      gridOrigin
    )
  }

  /**
   * Draw individual flange dimension
   */
  private drawFlangeDimension(
    beamEdgeX: number,
    dimX: number,
    extDir: number,
    startY: number,
    endY: number,
    extOffset: number,
    thickness: number,
    position: 'top' | 'bottom',
    gridOrigin: 'left' | 'right'
  ): void {
    // Extension lines
    GraphicsHelper.drawLine(
      this.graphics,
      { x: beamEdgeX - extDir * 5, y: startY },
      { x: dimX + extDir * 5, y: startY }
    )
    
    GraphicsHelper.drawLine(
      this.graphics,
      { x: beamEdgeX - extDir * 5, y: endY },
      { x: dimX + extDir * 5, y: endY }
    )

    // Dimension line with arrows
    GraphicsHelper.drawDimensionLine(this.graphics, {
      start: { x: dimX, y: startY + extOffset },
      end: { x: dimX, y: endY - extOffset },
      arrowSize: 3
    })

    // Text label
    const textX = dimX + (gridOrigin === 'left' ? -5 : 5)
    const textY = startY + (endY - startY) / 2
    
    this.scene.add.text(textX, textY, `${thickness.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    }).setOrigin(gridOrigin === 'left' ? 1 : 0, 0.5)
  }

  /**
   * Draw web height dimension
   */
  private drawWebDimension(
    config: DimensionConfig,
    dimensions: BeamDimensions,
    positions: DimensionPositions
  ): void {
    const { beamProfile, centerY, gridOrigin } = config
    const { webHeight } = beamProfile
    const extOffset = 2

    // Extension lines
    GraphicsHelper.drawLine(
      this.graphics,
      { x: positions.beamEdgeX - positions.extDir * 5, y: dimensions.webTop },
      { x: positions.dim2X + positions.extDir * 5, y: dimensions.webTop }
    )
    
    GraphicsHelper.drawLine(
      this.graphics,
      { x: positions.beamEdgeX - positions.extDir * 5, y: dimensions.webBottom },
      { x: positions.dim2X + positions.extDir * 5, y: dimensions.webBottom }
    )

    // Dimension line with arrows
    GraphicsHelper.drawDimensionLine(this.graphics, {
      start: { x: positions.dim2X, y: dimensions.webTop + extOffset },
      end: { x: positions.dim2X, y: dimensions.webBottom - extOffset },
      arrowSize: 3
    })

    // Rotated text label
    const webText = this.scene.add.text(
      positions.dim2X + (gridOrigin === 'left' ? -5 : 5),
      centerY,
      `${webHeight.toFixed(3)}"`,
      {
        fontSize: '11px',
        color: '#666'
      }
    )
    webText.setOrigin(0.5, gridOrigin === 'left' ? 1 : 0)
    webText.setRotation(gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)
  }

  /**
   * Draw overall height dimension
   */
  private drawOverallDimension(
    config: DimensionConfig,
    dimensions: BeamDimensions,
    positions: DimensionPositions
  ): void {
    const { centerY, gridOrigin } = config
    const extOffset = 2

    // Use darker style for overall dimension
    this.graphics.lineStyle(1, 0x333333, 1)

    // Extension lines
    GraphicsHelper.drawLine(
      this.graphics,
      { x: positions.beamEdgeX - positions.extDir * 5, y: dimensions.top },
      { x: positions.dim3X + positions.extDir * 5, y: dimensions.top }
    )
    
    GraphicsHelper.drawLine(
      this.graphics,
      { x: positions.beamEdgeX - positions.extDir * 5, y: dimensions.bottom },
      { x: positions.dim3X + positions.extDir * 5, y: dimensions.bottom }
    )

    // Dimension line with larger arrows
    GraphicsHelper.drawDimensionLine(this.graphics, {
      start: { x: positions.dim3X, y: dimensions.top + extOffset },
      end: { x: positions.dim3X, y: dimensions.bottom - extOffset },
      arrowSize: 4,
      color: 0x333333
    })

    // Bold rotated text label
    const heightText = this.scene.add.text(
      positions.dim3X + (gridOrigin === 'left' ? -8 : 8),
      centerY,
      `${dimensions.totalHeight.toFixed(3)}"`,
      {
        fontSize: '13px',
        color: '#333',
        fontStyle: 'bold'
      }
    )
    heightText.setOrigin(0.5, gridOrigin === 'left' ? 1 : 0)
    heightText.setRotation(gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)

    // Reset graphics style
    this.setupGraphicsStyle()
  }

  /**
   * Draw length markers at bottom
   */
  private drawLengthMarkers(
    config: DimensionConfig,
    dimensions: BeamDimensions
  ): void {
    const { beamLength, gridOrigin, gridTransform } = config
    const dimY = dimensions.bottom + 40

    // Update coordinate transformer for length marker calculations
    this.coordinateTransformer.updateBeamConfig({ length: beamLength })

    const markers = this.coordinateTransformer.calculateLengthMarkers(beamLength, 12, gridOrigin)

    for (const marker of markers) {
      const screenPoint = gridToScreen({ x: marker.position, y: 0 }, gridTransform)
      
      // Draw tick mark
      GraphicsHelper.drawLine(
        this.graphics,
        { x: screenPoint.x, y: dimY - 5 },
        { x: screenPoint.x, y: dimY + 5 }
      )
      
      // Draw label
      this.scene.add.text(screenPoint.x, dimY + 15, `${marker.label}"`, {
        fontSize: '12px',
        color: '#333'
      }).setOrigin(0.5, 0)
    }
  }

  /**
   * Update coordinate transformer with current config
   */
  private updateCoordinateTransformer(config: DimensionConfig): void {
    const { startX, centerY, beamLength, beamProfile } = config
    
    this.coordinateTransformer.updateGridConfig({
      size: 30, // Default grid size
      origin: { x: startX, y: centerY },
      transform: config.gridTransform
    })
    
    this.coordinateTransformer.updateBeamConfig({
      length: beamLength,
      bottom: 0,
      profile: beamProfile
    })
  }

  /**
   * Clear all rendered dimensions
   */
  clear(): void {
    GraphicsHelper.clear(this.graphics)
  }

  /**
   * Destroy the renderer and clean up resources
   */
  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy()
    }
  }
}

/**
 * Factory function for creating beam dimension renderer
 */
export function createBeamDimensionRenderer(scene: Phaser.Scene): BeamDimensionRenderer {
  return new BeamDimensionRenderer(scene)
}