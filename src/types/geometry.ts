/**
 * Unified geometry types
 * Consolidates duplicate Point2D definitions found across the codebase
 */

/**
 * Standard 2D point interface used throughout the application
 * Replaces duplicate definitions in:
 * - /src/core/BezierRendering.ts (interface Point)
 * - /src/utils/GraphicsHelper.ts (interface Point2D)
 * - /src/core/contours/marchingSquares.ts (interface Point2D)
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * 3D point interface for future extensibility
 */
export interface Point3D extends Point2D {
  z: number
}

/**
 * Bounding box interface
 */
export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * Rectangle interface
 */
export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Circle interface
 */
export interface Circle {
  center: Point2D
  radius: number
}

/**
 * Line segment interface
 */
export interface LineSegment {
  start: Point2D
  end: Point2D
}

/**
 * Polygon interface
 */
export interface Polygon {
  points: Point2D[]
  closed?: boolean
}

/**
 * Vector interface (represents direction and magnitude)
 */
export interface Vector2D {
  x: number
  y: number
}

/**
 * Transform matrix interface
 */
export interface Transform2D {
  translation: Point2D
  rotation: number
  scale: Point2D
}

// Utility functions for working with geometry

/**
 * Calculate distance between two points
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate midpoint between two points
 */
export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

/**
 * Add two points/vectors
 */
export function add(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: p1.x + p2.x,
    y: p1.y + p2.y
  }
}

/**
 * Subtract two points/vectors
 */
export function subtract(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  }
}

/**
 * Scale a point/vector
 */
export function scale(p: Point2D, factor: number): Point2D {
  return {
    x: p.x * factor,
    y: p.y * factor
  }
}

/**
 * Calculate dot product of two vectors
 */
export function dot(v1: Vector2D, v2: Vector2D): number {
  return v1.x * v2.x + v1.y * v2.y
}

/**
 * Calculate magnitude of a vector
 */
export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

/**
 * Normalize a vector to unit length
 */
export function normalize(v: Vector2D): Vector2D {
  const mag = magnitude(v)
  if (mag === 0) return { x: 0, y: 0 }
  return {
    x: v.x / mag,
    y: v.y / mag
  }
}

/**
 * Calculate angle between two vectors in radians
 */
export function angleBetween(v1: Vector2D, v2: Vector2D): number {
  return Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x)
}

/**
 * Rotate a point around origin by angle in radians
 */
export function rotate(p: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos
  }
}

/**
 * Rotate a point around another point by angle in radians
 */
export function rotateAround(p: Point2D, center: Point2D, angle: number): Point2D {
  const translated = subtract(p, center)
  const rotated = rotate(translated, angle)
  return add(rotated, center)
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(p: Point2D, rect: Rectangle): boolean {
  return p.x >= rect.x && 
         p.x <= rect.x + rect.width &&
         p.y >= rect.y && 
         p.y <= rect.y + rect.height
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(p: Point2D, circle: Circle): boolean {
  return distance(p, circle.center) <= circle.radius
}

/**
 * Calculate bounding box for a set of points
 */
export function boundingBox(points: Point2D[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }
  
  let minX = points[0].x, maxX = points[0].x
  let minY = points[0].y, maxY = points[0].y
  
  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  
  return { minX, minY, maxX, maxY }
}

/**
 * Convert bounding box to rectangle
 */
export function boundingBoxToRect(bbox: BoundingBox): Rectangle {
  return {
    x: bbox.minX,
    y: bbox.minY,
    width: bbox.maxX - bbox.minX,
    height: bbox.maxY - bbox.minY
  }
}

/**
 * Convert rectangle to bounding box
 */
export function rectToBoundingBox(rect: Rectangle): BoundingBox {
  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  }
}