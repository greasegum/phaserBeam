/**
 * Contour post-processing utilities
 * Separated from core algorithm for maintainability
 */

import { Point } from './marchingSquares'
import { ContourConfig } from '../types/contourConfig'

/**
 * Apply all post-processing based on configuration
 */
export function processContours(
  contours: Point[][],
  config: ContourConfig,
  bounds: { width: number; height: number }
): Point[][] {
  let processed = contours
  
  // Apply smoothing if enabled
  if (config.smoothing.enabled && config.smoothing.strength > 0) {
    processed = processed.map(contour => 
      smoothContour(contour, config.smoothing.strength)
    )
  }
  
  // Apply edge clamping if enabled
  if (config.edges.clampToBeam) {
    processed = processed.map(contour => 
      clampContourToEdges(contour, bounds, config.edges.bufferSize)
    )
  }
  
  // Apply separation if enabled and multiple contours exist
  if (config.separation.enabled && processed.length > 1) {
    processed = separateContours(processed, config.separation.minDistance)
  }
  
  return processed
}

/**
 * Simple, effective smoothing using weighted averaging
 */
function smoothContour(contour: Point[], strength: number): Point[] {
  if (contour.length < 3 || strength <= 0) return contour
  
  const weight = Math.min(1, Math.max(0, strength))
  const smoothed: Point[] = []
  
  for (let i = 0; i < contour.length; i++) {
    const prev = contour[(i - 1 + contour.length) % contour.length]
    const curr = contour[i]
    const next = contour[(i + 1) % contour.length]
    
    // Weighted average with neighbors
    smoothed.push({
      x: curr.x * (1 - weight) + (prev.x + next.x) * 0.5 * weight,
      y: curr.y * (1 - weight) + (prev.y + next.y) * 0.5 * weight
    })
  }
  
  return smoothed
}

/**
 * Clamp contour points to grid edges
 */
function clampContourToEdges(
  contour: Point[],
  bounds: { width: number; height: number },
  bufferSize: number
): Point[] {
  const minX = -bufferSize
  const maxX = bounds.width + bufferSize
  const minY = -bufferSize
  const maxY = bounds.height + bufferSize
  
  return contour.map(point => ({
    x: Math.max(minX, Math.min(maxX, point.x)),
    y: Math.max(minY, Math.min(maxY, point.y))
  }))
}

/**
 * Simple contour separation to prevent overlaps
 */
function separateContours(contours: Point[][], minDistance: number): Point[][] {
  if (contours.length < 2 || minDistance <= 0) return contours
  
  const result = contours.map(c => [...c])
  const maxIterations = 5 // Reasonable limit for performance
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let hasCollisions = false
    
    // Check pairs of contours
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const separation = applySeparation(result[i], result[j], minDistance)
        if (separation) {
          result[i] = separation.contour1
          result[j] = separation.contour2
          hasCollisions = true
        }
      }
    }
    
    if (!hasCollisions) break
  }
  
  return result
}

/**
 * Apply separation between two contours if needed
 */
function applySeparation(
  contour1: Point[],
  contour2: Point[],
  minDistance: number
): { contour1: Point[]; contour2: Point[] } | null {
  // Find closest points between contours
  let minDist = Infinity
  let closest1: Point | null = null
  let closest2: Point | null = null
  
  for (const p1 of contour1) {
    for (const p2 of contour2) {
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
      if (dist < minDist) {
        minDist = dist
        closest1 = p1
        closest2 = p2
      }
    }
  }
  
  // No collision
  if (minDist >= minDistance || !closest1 || !closest2) {
    return null
  }
  
  // Calculate push vector
  const pushDist = (minDistance - minDist) / 2
  const dx = closest2.x - closest1.x
  const dy = closest2.y - closest1.y
  const length = Math.hypot(dx, dy)
  
  if (length === 0) return null
  
  const pushX = (dx / length) * pushDist
  const pushY = (dy / length) * pushDist
  
  // Apply push to both contours
  return {
    contour1: contour1.map(p => ({ x: p.x - pushX, y: p.y - pushY })),
    contour2: contour2.map(p => ({ x: p.x + pushX, y: p.y + pushY }))
  }
}

/**
 * Transform contours from grid space to screen space
 */
export function transformToScreen(
  contours: Point[][],
  origin: { x: number; y: number },
  scale: number,
  flipY = false
): Point[][] {
  return contours.map(contour =>
    contour.map(point => ({
      x: origin.x + point.x * scale,
      y: flipY 
        ? origin.y - point.y * scale  // Flip Y for screen coordinates
        : origin.y + point.y * scale
    }))
  )
}