/**
 * Phaser-specific contour rendering utilities
 */

import * as Phaser from 'phaser'
import type { ContourPath, Point2D } from '../contours/marchingSquares'

export interface ContourStyle {
  /** Line color (hex color code) */
  color: number
  /** Line width in pixels */
  width: number
  /** Line opacity (0-1) */
  alpha: number
  /** Whether to use smooth curves */
  smooth: boolean
  /** Fill style for closed contours */
  fill?: {
    color: number
    alpha: number
  }
  /** Line dash pattern */
  dash?: {
    length: number
    gap: number
  }
}

export interface RenderOptions {
  /** Graphics object to draw on (will create new one if not provided) */
  graphics?: Phaser.GameObjects.Graphics
  /** Whether to clear graphics before drawing */
  clear: boolean
  /** Transform to apply to all coordinates */
  transform?: {
    x: number
    y: number
    scaleX: number
    scaleY: number
    rotation: number
  }
}

/**
 * Draw contour paths using Phaser graphics
 */
export function drawContours(
  scene: Phaser.Scene, 
  contours: ContourPath[], 
  style: ContourStyle,
  options: RenderOptions = { clear: true }
): Phaser.GameObjects.Graphics {
  // Get or create graphics object
  const graphics = options.graphics || scene.add.graphics()
  
  if (options.clear) {
    graphics.clear()
  }
  
  // Apply transform if provided
  if (options.transform) {
    graphics.setPosition(options.transform.x, options.transform.y)
    graphics.setScale(options.transform.scaleX, options.transform.scaleY)
    graphics.setRotation(options.transform.rotation)
  }
  
  // Set line style
  graphics.lineStyle(style.width, style.color, style.alpha)
  
  // Draw each contour
  for (const contour of contours) {
    drawSingleContour(graphics, contour, style)
  }
  
  return graphics
}

/**
 * Draw a single contour path
 */
function drawSingleContour(
  graphics: Phaser.GameObjects.Graphics,
  contour: ContourPath,
  style: ContourStyle
): void {
  const { points, closed } = contour
  
  if (points.length < 2) return
  
  if (style.smooth) {
    drawSmoothContour(graphics, points, closed, style)
  } else {
    drawLinearContour(graphics, points, closed, style)
  }
}

/**
 * Draw contour with linear segments
 */
function drawLinearContour(
  graphics: Phaser.GameObjects.Graphics,
  points: Point2D[],
  closed: boolean,
  style: ContourStyle
): void {
  graphics.beginPath()
  graphics.moveTo(points[0].x, points[0].y)
  
  for (let i = 1; i < points.length; i++) {
    graphics.lineTo(points[i].x, points[i].y)
  }
  
  if (closed) {
    graphics.closePath()
    
    // Fill if style specified
    if (style.fill) {
      graphics.fillStyle(style.fill.color, style.fill.alpha)
      graphics.fillPath()
    }
  }
  
  // Apply dash pattern if specified
  if (style.dash) {
    drawDashedPath(graphics, points, closed, style.dash)
  } else {
    graphics.strokePath()
  }
}

/**
 * Draw contour with smooth curves (using spline interpolation)
 */
function drawSmoothContour(
  graphics: Phaser.GameObjects.Graphics,
  points: Point2D[],
  closed: boolean,
  style: ContourStyle
): void {
  if (points.length < 3) {
    drawLinearContour(graphics, points, closed, style)
    return
  }
  
  graphics.beginPath()
  graphics.moveTo(points[0].x, points[0].y)
  
  // Use quadratic curves for smoothing
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    
    // Control point is the current point
    // End point is midway to next point
    const endX = (current.x + next.x) / 2
    const endY = (current.y + next.y) / 2
    
    graphics.quadraticCurveTo(current.x, current.y, endX, endY)
  }
  
  // Final segment
  const lastPoint = points[points.length - 1]
  if (closed) {
    const firstPoint = points[0]
    const midX = (lastPoint.x + firstPoint.x) / 2
    const midY = (lastPoint.y + firstPoint.y) / 2
    graphics.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY)
    graphics.quadraticCurveTo(firstPoint.x, firstPoint.y, firstPoint.x, firstPoint.y)
    graphics.closePath()
    
    if (style.fill) {
      graphics.fillStyle(style.fill.color, style.fill.alpha)
      graphics.fillPath()
    }
  } else {
    graphics.lineTo(lastPoint.x, lastPoint.y)
  }
  
  graphics.strokePath()
}

/**
 * Draw dashed path
 */
function drawDashedPath(
  graphics: Phaser.GameObjects.Graphics,
  points: Point2D[],
  closed: boolean,
  dash: { length: number; gap: number }
): void {
  let totalLength = 0
  const segments: { start: Point2D; end: Point2D; length: number }[] = []
  
  // Calculate total path length and create segments
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)
    segments.push({ start, end, length })
    totalLength += length
  }
  
  if (closed && points.length > 2) {
    const start = points[points.length - 1]
    const end = points[0]
    const length = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)
    segments.push({ start, end, length })
    totalLength += length
  }
  
  // Draw dashed segments
  const dashCycle = dash.length + dash.gap
  let currentDistance = 0
  let drawing = true
  
  graphics.beginPath()
  
  for (const segment of segments) {
    const { start, end, length } = segment
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    let segmentDistance = 0
    let segmentStart = start
    
    while (segmentDistance < length) {
      const remainingInCycle = dashCycle - (currentDistance % dashCycle)
      const remainingInSegment = length - segmentDistance
      const stepDistance = Math.min(remainingInCycle, remainingInSegment)
      
      const t = stepDistance / length
      const stepEnd = {
        x: segmentStart.x + dx * t,
        y: segmentStart.y + dy * t
      }
      
      if (drawing) {
        if (currentDistance % dashCycle === 0) {
          graphics.moveTo(segmentStart.x, segmentStart.y)
        }
        graphics.lineTo(stepEnd.x, stepEnd.y)
      }
      
      segmentDistance += stepDistance
      currentDistance += stepDistance
      segmentStart = stepEnd
      
      // Check if we need to switch between drawing and gap
      if (currentDistance % dashCycle < dash.length) {
        drawing = true
      } else {
        drawing = false
      }
    }
  }
  
  graphics.strokePath()
}

/**
 * Create default contour style
 */
export function createDefaultContourStyle(): ContourStyle {
  return {
    color: 0x00ff00,
    width: 2,
    alpha: 1,
    smooth: false
  }
}

/**
 * Create contour style for section loss visualization
 */
export function createSectionLossStyle(): ContourStyle {
  return {
    color: 0xff0000,
    width: 3,
    alpha: 0.8,
    smooth: true,
    fill: {
      color: 0xff0000,
      alpha: 0.2
    }
  }
}

/**
 * Create contour style for debug visualization
 */
export function createDebugContourStyle(): ContourStyle {
  return {
    color: 0x00ffff,
    width: 1,
    alpha: 0.6,
    smooth: false,
    dash: {
      length: 5,
      gap: 3
    }
  }
}

/**
 * Batch draw multiple contour sets with different styles
 */
export function drawMultipleContourSets(
  scene: Phaser.Scene,
  contourSets: Array<{ contours: ContourPath[]; style: ContourStyle }>,
  options: RenderOptions = { clear: true }
): Phaser.GameObjects.Graphics {
  const graphics = options.graphics || scene.add.graphics()
  
  if (options.clear) {
    graphics.clear()
  }
  
  for (const { contours, style } of contourSets) {
    drawContours(scene, contours, style, { ...options, graphics, clear: false })
  }
  
  return graphics
}
