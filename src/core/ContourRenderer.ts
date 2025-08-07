import { Contour } from './geometry'

/**
 * Transform function to convert grid coordinates to screen coordinates
 */
export interface GridToScreenTransform {
  (gridX: number, gridY: number): { x: number; y: number }
}

/**
 * Creates a grid-to-screen coordinate transform
 */
export function createGridToScreenTransform(
  gridSize: number,
  startX: number,
  startY: number
): GridToScreenTransform {
  return (gridX: number, gridY: number) => ({
    x: startX + gridX * gridSize,
    y: startY + gridY * gridSize
  })
}

/**
 * Contour rendering styles
 */
export const ContourStyles = {
  binary: {
    strokeColor: 0x0066CC,
    strokeWidth: 2,
    strokeAlpha: 0.8
  },
  raw: {
    strokeColor: 0xFF6B6B,
    strokeWidth: 2,
    strokeAlpha: 0.9
  },
  smoothed: {
    strokeColor: 0x20B2AA,
    strokeWidth: 2,
    strokeAlpha: 1.0
  },
  filled: {
    fillColor: 0xFFB3BA,
    fillAlpha: 0.8,
    strokeColor: 0xFF6B6B,
    strokeWidth: 2,
    strokeAlpha: 0.9
  }
}

/**
 * Control point rendering styles
 */
export const ControlPointStyles = {
  default: {
    fillColor: 0xFF0000,
    radius: 3,
    alpha: 0.8
  }
}

/**
 * Contour rendering options
 */
export interface ContourRenderOptions {
  style: typeof ContourStyles[keyof typeof ContourStyles]
  showControlPoints?: boolean
  controlPointStyle?: typeof ControlPointStyles[keyof typeof ControlPointStyles]
  transform: GridToScreenTransform
}

/**
 * Renders contours to a Phaser graphics object
 */
export function renderContours(
  graphics: Phaser.GameObjects.Graphics,
  contours: Contour[],
  options: ContourRenderOptions
): void {
  const { style, showControlPoints = false, controlPointStyle, transform } = options
  
  // Set up graphics style
  if ('fillColor' in style) {
    graphics.fillStyle(style.fillColor, style.fillAlpha)
  }
  
  graphics.lineStyle(style.strokeWidth, style.strokeColor, style.strokeAlpha)
  
  // Render each contour
  contours.forEach(contour => {
    if (contour.points.length < 2) return
    
    graphics.beginPath()
    
    // Transform first point
    const firstPoint = transform(contour.points[0].x, contour.points[0].y)
    graphics.moveTo(firstPoint.x, firstPoint.y)
    
    // Draw path
    for (let i = 1; i < contour.points.length; i++) {
      const point = transform(contour.points[i].x, contour.points[i].y)
      graphics.lineTo(point.x, point.y)
    }
    
    // Close path if it's a closed contour
    if (contour.closed) {
      graphics.closePath()
    }
    
    // Fill if style has fill
    if ('fillColor' in style) {
      graphics.fillPath()
    }
    
    graphics.strokePath()
    
    // Draw control points if requested
    if (showControlPoints && controlPointStyle) {
      contour.points.forEach(point => {
        const screenPoint = transform(point.x, point.y)
        graphics.fillStyle(controlPointStyle.fillColor, controlPointStyle.alpha)
        graphics.fillCircle(screenPoint.x, screenPoint.y, controlPointStyle.radius)
      })
    }
  })
}