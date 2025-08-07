/**
 * Coordinate transformation utilities for beam inspection system
 * Handles conversions between grid, screen, and world coordinates
 */

export interface Point2D {
  x: number
  y: number
}

export interface Transform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface GridBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
}

/**
 * Create a transformation matrix for grid to screen coordinates
 */
export function createGridToScreenTransform(
  gridSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): Transform {
  return {
    scale: gridSize,
    offsetX,
    offsetY
  }
}

/**
 * Transform grid coordinates to screen coordinates
 */
export function gridToScreen(point: Point2D, transform: Transform): Point2D {
  return {
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY
  }
}

/**
 * Transform screen coordinates to grid coordinates
 */
export function screenToGrid(point: Point2D, transform: Transform): Point2D {
  return {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale
  }
}

/**
 * Transform an array of grid points to screen coordinates
 */
export function gridPointsToScreen(points: Point2D[], transform: Transform): Point2D[] {
  return points.map(point => gridToScreen(point, transform))
}

/**
 * Transform an array of screen points to grid coordinates
 */
export function screenPointsToGrid(points: Point2D[], transform: Transform): Point2D[] {
  return points.map(point => screenToGrid(point, transform))
}

/**
 * Calculate grid bounds from a set of points
 */
export function calculateGridBounds(points: Point2D[]): GridBounds {
  if (points.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0
    }
  }
  
  let minX = points[0].x
  let maxX = points[0].x
  let minY = points[0].y
  let maxY = points[0].y
  
  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * Snap a point to the nearest grid position
 */
export function snapToGrid(point: Point2D, gridSize: number = 1): Point2D {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }
}

/**
 * Calculate the distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate the midpoint between two points
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

/**
 * Rotate a point around an origin
 */
export function rotatePoint(
  point: Point2D,
  origin: Point2D,
  angleRadians: number
): Point2D {
  const cos = Math.cos(angleRadians)
  const sin = Math.sin(angleRadians)
  
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  
  return {
    x: cos * dx - sin * dy + origin.x,
    y: sin * dx + cos * dy + origin.y
  }
}

/**
 * Scale a point relative to an origin
 */
export function scalePoint(
  point: Point2D,
  origin: Point2D,
  scaleX: number,
  scaleY: number = scaleX
): Point2D {
  return {
    x: (point.x - origin.x) * scaleX + origin.x,
    y: (point.y - origin.y) * scaleY + origin.y
  }
}

/**
 * Convert beam coordinates to grid coordinates
 */
export function beamToGrid(
  beamX: number, // inches from beam origin
  beamY: number, // inches from beam centerline
  beamLength: number,
  webHeight: number,
  gridOrigin: 'left' | 'right' = 'left'
): Point2D {
  // Convert beam coordinates to grid indices
  const gridX = gridOrigin === 'left' ? beamX : beamLength - beamX
  const gridY = beamY + webHeight / 2 // Offset from centerline to top of web
  
  return {
    x: Math.floor(gridX),
    y: Math.floor(gridY)
  }
}

/**
 * Convert grid coordinates to beam coordinates
 */
export function gridToBeam(
  gridX: number,
  gridY: number,
  beamLength: number,
  webHeight: number,
  gridOrigin: 'left' | 'right' = 'left'
): Point2D {
  // Convert grid indices to beam coordinates
  const beamX = gridOrigin === 'left' ? gridX : beamLength - gridX
  const beamY = gridY - webHeight / 2 // Offset from top of web to centerline
  
  return {
    x: beamX,
    y: beamY
  }
}

/**
 * Get cell key from grid coordinates
 */
export function getCellKey(x: number, y: number, zone: string = 'web'): string {
  return `${zone}_${x}_${y}`
}

/**
 * Parse cell key to get coordinates
 */
export function parseCellKey(key: string): { zone: string; x: number; y: number } | null {
  const parts = key.split('_')
  if (parts.length < 3) return null
  
  return {
    zone: parts[0],
    x: parseInt(parts[1]),
    y: parseInt(parts[2])
  }
}

/**
 * Check if a point is within bounds
 */
export function isInBounds(point: Point2D, bounds: GridBounds): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  )
}

/**
 * Clamp a point to bounds
 */
export function clampToBounds(point: Point2D, bounds: GridBounds): Point2D {
  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y))
  }
}

/**
 * Calculate viewport bounds for camera
 */
export function calculateViewportBounds(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  zoom: number = 1
): GridBounds {
  const halfWidth = width / (2 * zoom)
  const halfHeight = height / (2 * zoom)
  
  return {
    minX: centerX - halfWidth,
    maxX: centerX + halfWidth,
    minY: centerY - halfHeight,
    maxY: centerY + halfHeight,
    width: width / zoom,
    height: height / zoom
  }
}

/**
 * Convert elevation view coordinates
 */
export function convertElevationView(
  point: Point2D,
  fromView: 'N' | 'S' | 'E' | 'W',
  toView: 'N' | 'S' | 'E' | 'W',
  beamLength: number,
  webHeight: number
): Point2D {
  // Handle view transformations
  // This is simplified - actual implementation would depend on beam orientation
  if (fromView === toView) return point
  
  // Example transformation logic
  let transformed = { ...point }
  
  // North to South: flip Y
  if ((fromView === 'N' && toView === 'S') || (fromView === 'S' && toView === 'N')) {
    transformed.y = webHeight - transformed.y
  }
  
  // East to West: flip X
  if ((fromView === 'E' && toView === 'W') || (fromView === 'W' && toView === 'E')) {
    transformed.x = beamLength - transformed.x
  }
  
  // Handle 90-degree rotations
  if ((fromView === 'N' || fromView === 'S') && (toView === 'E' || toView === 'W')) {
    const temp = transformed.x
    transformed.x = transformed.y
    transformed.y = temp
  }
  
  return transformed
}