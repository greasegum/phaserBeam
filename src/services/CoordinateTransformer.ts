/**
 * Centralized coordinate transformation service
 * Eliminates scattered coordinate transformation logic across the codebase
 */

export interface Point2D {
  x: number
  y: number
}

export interface GridPoint extends Point2D {
  gridX?: number
  gridY?: number
}

export interface ScreenPoint extends Point2D {}

export interface BeamPoint extends Point2D {}

export interface Transform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface GridConfig {
  size: number
  origin: Point2D
  transform?: Transform
}

export interface BeamConfig {
  length: number
  bottom: number
  profile?: {
    webHeight: number
    flangeThickness: number
  }
}

/**
 * Centralized coordinate transformation service
 * Handles all coordinate conversions between different coordinate systems
 */
export class CoordinateTransformer {
  private gridConfig: GridConfig
  private beamConfig: BeamConfig
  private defaultTransform: Transform

  constructor(gridConfig: GridConfig, beamConfig: BeamConfig) {
    this.gridConfig = gridConfig
    this.beamConfig = beamConfig
    this.defaultTransform = gridConfig.transform || { scale: 1, offsetX: 0, offsetY: 0 }
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  gridToScreen(point: GridPoint, transform?: Transform): ScreenPoint {
    const t = transform || this.defaultTransform
    
    return {
      x: this.gridConfig.origin.x + (point.x * t.scale) + t.offsetX,
      y: this.gridConfig.origin.y + (point.y * t.scale) + t.offsetY
    }
  }

  /**
   * Convert screen coordinates to grid coordinates
   */
  screenToGrid(point: ScreenPoint, transform?: Transform): GridPoint {
    const t = transform || this.defaultTransform
    
    return {
      x: (point.x - this.gridConfig.origin.x - t.offsetX) / t.scale,
      y: (point.y - this.gridConfig.origin.y - t.offsetY) / t.scale
    }
  }

  /**
   * Convert beam coordinates to grid coordinates
   */
  beamToGrid(point: BeamPoint): GridPoint {
    // Beam coordinates are typically in inches, convert to grid units
    return {
      x: point.x,
      y: point.y - this.beamConfig.bottom
    }
  }

  /**
   * Convert grid coordinates to beam coordinates
   */
  gridToBeam(point: GridPoint): BeamPoint {
    return {
      x: point.x,
      y: point.y + this.beamConfig.bottom
    }
  }

  /**
   * Create a complete transformation from beam to screen coordinates
   */
  beamToScreen(point: BeamPoint, transform?: Transform): ScreenPoint {
    const gridPoint = this.beamToGrid(point)
    return this.gridToScreen(gridPoint, transform)
  }

  /**
   * Create a complete transformation from screen to beam coordinates
   */
  screenToBeam(point: ScreenPoint, transform?: Transform): BeamPoint {
    const gridPoint = this.screenToGrid(point, transform)
    return this.gridToBeam(gridPoint)
  }

  /**
   * Transform an array of points
   */
  transformPoints<T extends Point2D>(
    points: T[],
    transformer: (point: T) => Point2D
  ): Point2D[] {
    return points.map(transformer)
  }

  /**
   * Calculate beam dimensions in grid coordinates
   */
  getBeamDimensionsInGrid(): {
    top: number
    bottom: number
    webTop: number
    webBottom: number
    totalHeight: number
  } {
    if (!this.beamConfig.profile) {
      throw new Error('Beam profile not configured')
    }

    const { webHeight, flangeThickness } = this.beamConfig.profile
    const totalHeight = webHeight + 2 * flangeThickness
    
    return {
      top: -totalHeight / 2,
      bottom: totalHeight / 2,
      webTop: -webHeight / 2,
      webBottom: webHeight / 2,
      totalHeight
    }
  }

  /**
   * Calculate dimension line positions based on grid origin and beam width
   */
  calculateDimensionPositions(
    startX: number,
    width: number,
    gridOrigin: 'left' | 'right' = 'left'
  ): {
    dim1X: number  // Closest to beam
    dim2X: number  // Middle
    dim3X: number  // Farthest
    beamEdgeX: number
    extDir: number // Extension direction multiplier
  } {
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
   * Calculate length markers positions along beam
   */
  calculateLengthMarkers(
    beamLength: number,
    interval: number = 12,
    gridOrigin: 'left' | 'right' = 'left'
  ): Array<{ position: number; label: number }> {
    const markers: Array<{ position: number; label: number }> = []
    
    for (let i = 0; i <= beamLength; i += interval) {
      const gridX = gridOrigin === 'left' ? i : beamLength - i
      const label = gridOrigin === 'left' ? i : beamLength - i
      
      markers.push({ position: gridX, label })
    }
    
    return markers
  }

  /**
   * Snap point to grid
   */
  snapToGrid(point: Point2D, snapThreshold: number = 5): Point2D {
    const gridSize = this.gridConfig.size
    const snappedX = Math.round(point.x / gridSize) * gridSize
    const snappedY = Math.round(point.y / gridSize) * gridSize
    
    const distanceToSnap = Math.sqrt(
      Math.pow(snappedX - point.x, 2) + Math.pow(snappedY - point.y, 2)
    )
    
    if (distanceToSnap <= snapThreshold) {
      return { x: snappedX, y: snappedY }
    }
    
    return point
  }

  /**
   * Calculate bounds for a set of points
   */
  calculateBounds(points: Point2D[]): {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
    center: Point2D
  } {
    if (points.length === 0) {
      throw new Error('Cannot calculate bounds for empty point array')
    }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2
      }
    }
  }

  /**
   * Update grid configuration
   */
  updateGridConfig(updates: Partial<GridConfig>): void {
    this.gridConfig = { ...this.gridConfig, ...updates }
    
    if (updates.transform) {
      this.defaultTransform = updates.transform
    }
  }

  /**
   * Update beam configuration
   */
  updateBeamConfig(updates: Partial<BeamConfig>): void {
    this.beamConfig = { ...this.beamConfig, ...updates }
  }

  /**
   * Get current transform
   */
  getTransform(): Transform {
    return { ...this.defaultTransform }
  }

  /**
   * Create a new transform
   */
  createTransform(scale: number, offsetX: number = 0, offsetY: number = 0): Transform {
    return { scale, offsetX, offsetY }
  }

  /**
   * Combine transforms
   */
  combineTransforms(transform1: Transform, transform2: Transform): Transform {
    return {
      scale: transform1.scale * transform2.scale,
      offsetX: transform1.offsetX + transform2.offsetX,
      offsetY: transform1.offsetY + transform2.offsetY
    }
  }

  /**
   * Calculate angle between two points in radians
   */
  calculateAngle(from: Point2D, to: Point2D): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(point1: Point2D, point2: Point2D): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Rotate a point around another point
   */
  rotatePoint(point: Point2D, center: Point2D, angle: number): Point2D {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    
    const dx = point.x - center.x
    const dy = point.y - center.y
    
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    }
  }
}