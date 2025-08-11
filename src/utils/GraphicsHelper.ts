/**
 * Graphics utility class to reduce code duplication and provide consistent drawing operations
 */

import Phaser from 'phaser'

export interface Point2D {
  x: number
  y: number
}

export interface DimensionLineConfig {
  start: Point2D
  end: Point2D
  extensionLength?: number
  arrowSize?: number
  color?: number
  alpha?: number
  lineWidth?: number
}

export interface ExtensionLineConfig {
  from: Point2D
  to: Point2D
  offset?: number
  color?: number
  alpha?: number
  lineWidth?: number
}

export interface ArrowConfig {
  position: Point2D
  angle: number
  size?: number
  color?: number
  alpha?: number
}

/**
 * Centralized graphics helper to eliminate duplicated drawing patterns
 */
export class GraphicsHelper {
  
  /**
   * Draw a dimension line with arrows and extension lines
   */
  static drawDimensionLine(graphics: Phaser.GameObjects.Graphics, config: DimensionLineConfig): void {
    const {
      start,
      end,
      extensionLength = 5,
      arrowSize = 3,
      color = 0x666666,
      alpha = 0.8,
      lineWidth = 1
    } = config

    graphics.lineStyle(lineWidth, color, alpha)
    
    // Main dimension line
    graphics.beginPath()
    graphics.moveTo(start.x, start.y)
    graphics.lineTo(end.x, end.y)
    graphics.strokePath()
    
    // Draw arrows at both ends
    this.drawArrow(graphics, start, this.calculateArrowAngle(start, end), arrowSize, color, alpha)
    this.drawArrow(graphics, end, this.calculateArrowAngle(end, start), arrowSize, color, alpha)
  }

  /**
   * Draw extension lines for dimensions
   */
  static drawExtensionLine(graphics: Phaser.GameObjects.Graphics, config: ExtensionLineConfig): void {
    const {
      from,
      to,
      offset = 5,
      color = 0x666666,
      alpha = 0.8,
      lineWidth = 1
    } = config

    graphics.lineStyle(lineWidth, color, alpha)
    
    // Calculate offset direction
    const angle = Math.atan2(to.y - from.y, to.x - from.x)
    const offsetX = Math.cos(angle) * offset
    const offsetY = Math.sin(angle) * offset
    
    graphics.beginPath()
    graphics.moveTo(from.x - offsetX, from.y - offsetY)
    graphics.lineTo(to.x + offsetX, to.y + offsetY)
    graphics.strokePath()
  }

  /**
   * Draw an arrow at specified position and angle
   */
  static drawArrow(
    graphics: Phaser.GameObjects.Graphics,
    position: Point2D,
    angle: number,
    size: number = 3,
    color: number = 0x666666,
    alpha: number = 0.8
  ): void {
    graphics.lineStyle(1, color, alpha)
    
    const halfSize = size / 2
    const tipLength = size * 1.2
    
    // Calculate arrow points
    const tip = {
      x: position.x + Math.cos(angle) * tipLength,
      y: position.y + Math.sin(angle) * tipLength
    }
    
    const left = {
      x: position.x + Math.cos(angle + Math.PI * 0.75) * halfSize,
      y: position.y + Math.sin(angle + Math.PI * 0.75) * halfSize
    }
    
    const right = {
      x: position.x + Math.cos(angle - Math.PI * 0.75) * halfSize,
      y: position.y + Math.sin(angle - Math.PI * 0.75) * halfSize
    }
    
    // Draw arrow
    graphics.beginPath()
    graphics.moveTo(left.x, left.y)
    graphics.lineTo(tip.x, tip.y)
    graphics.lineTo(right.x, right.y)
    graphics.strokePath()
  }

  /**
   * Draw a simple line between two points
   */
  static drawLine(
    graphics: Phaser.GameObjects.Graphics,
    start: Point2D,
    end: Point2D,
    color: number = 0x000000,
    alpha: number = 1,
    lineWidth: number = 1
  ): void {
    graphics.lineStyle(lineWidth, color, alpha)
    graphics.beginPath()
    graphics.moveTo(start.x, start.y)
    graphics.lineTo(end.x, end.y)
    graphics.strokePath()
  }

  /**
   * Draw a rectangle with optional stroke and fill
   */
  static drawRectangle(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: number
      fillAlpha?: number
      strokeColor?: number
      strokeAlpha?: number
      strokeWidth?: number
    } = {}
  ): void {
    const {
      fillColor,
      fillAlpha = 1,
      strokeColor,
      strokeAlpha = 1,
      strokeWidth = 1
    } = options

    if (fillColor !== undefined) {
      graphics.fillStyle(fillColor, fillAlpha)
    }
    
    if (strokeColor !== undefined) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha)
    }

    graphics.beginPath()
    graphics.rect(x, y, width, height)
    
    if (fillColor !== undefined) {
      graphics.fillPath()
    }
    
    if (strokeColor !== undefined) {
      graphics.strokePath()
    }
  }

  /**
   * Draw a circle with optional stroke and fill
   */
  static drawCircle(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    options: {
      fillColor?: number
      fillAlpha?: number
      strokeColor?: number
      strokeAlpha?: number
      strokeWidth?: number
    } = {}
  ): void {
    const {
      fillColor,
      fillAlpha = 1,
      strokeColor,
      strokeAlpha = 1,
      strokeWidth = 1
    } = options

    if (fillColor !== undefined) {
      graphics.fillStyle(fillColor, fillAlpha)
    }
    
    if (strokeColor !== undefined) {
      graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha)
    }

    graphics.beginPath()
    graphics.arc(x, y, radius, 0, Math.PI * 2)
    
    if (fillColor !== undefined) {
      graphics.fillPath()
    }
    
    if (strokeColor !== undefined) {
      graphics.strokePath()
    }
  }

  /**
   * Draw a polyline (series of connected line segments)
   */
  static drawPolyline(
    graphics: Phaser.GameObjects.Graphics,
    points: Point2D[],
    color: number = 0x000000,
    alpha: number = 1,
    lineWidth: number = 1,
    closed: boolean = false
  ): void {
    if (points.length < 2) return

    graphics.lineStyle(lineWidth, color, alpha)
    graphics.beginPath()
    
    graphics.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y)
    }
    
    if (closed) {
      graphics.closePath()
    }
    
    graphics.strokePath()
  }

  /**
   * Clear graphics object efficiently
   */
  static clear(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear()
  }

  /**
   * Set up common graphics styles
   */
  static setDefaultStyle(graphics: Phaser.GameObjects.Graphics): void {
    graphics.lineStyle(1, 0x666666, 0.8)
    graphics.fillStyle(0xffffff, 0.1)
  }

  /**
   * Calculate angle between two points for arrow direction
   */
  private static calculateArrowAngle(from: Point2D, to: Point2D): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  /**
   * Calculate distance between two points
   */
  static distance(point1: Point2D, point2: Point2D): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate midpoint between two points
   */
  static midpoint(point1: Point2D, point2: Point2D): Point2D {
    return {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2
    }
  }

  /**
   * Batch multiple drawing operations for better performance
   */
  static batch(graphics: Phaser.GameObjects.Graphics, operations: (() => void)[]): void {
    graphics.clear()
    operations.forEach(operation => operation())
  }
}