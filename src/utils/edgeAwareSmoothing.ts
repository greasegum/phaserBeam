import { Point } from './marchingSquares'

export interface EdgeAwareSmoothingOptions {
  iterations?: number
  strength?: number
  edgeTransitionZone?: number // Distance from edge where curve transitions to straight
  cornerRadius?: number // Radius for corner rounding
  preserveCorners?: boolean // Keep sharp corners at edges
}

export interface GridBounds {
  left: number
  right: number
  top: number
  bottom: number
}

interface PointClassification {
  isCorner: boolean
  isEdge: boolean
  edgeType?: 'left' | 'right' | 'top' | 'bottom'
  cornerType?: 'tl' | 'tr' | 'bl' | 'br'
  distanceToEdge: number
}

/**
 * Classify a point based on its position relative to grid bounds
 */
function classifyPoint(point: Point, bounds: GridBounds, tolerance: number = 0.1): PointClassification {
  const nearLeft = Math.abs(point.x - bounds.left) < tolerance
  const nearRight = Math.abs(point.x - bounds.right) < tolerance
  const nearTop = Math.abs(point.y - bounds.top) < tolerance
  const nearBottom = Math.abs(point.y - bounds.bottom) < tolerance
  
  // Check corners first
  if (nearLeft && nearTop) {
    return {
      isCorner: true,
      isEdge: true,
      cornerType: 'tl',
      distanceToEdge: 0
    }
  }
  if (nearRight && nearTop) {
    return {
      isCorner: true,
      isEdge: true,
      cornerType: 'tr',
      distanceToEdge: 0
    }
  }
  if (nearLeft && nearBottom) {
    return {
      isCorner: true,
      isEdge: true,
      cornerType: 'bl',
      distanceToEdge: 0
    }
  }
  if (nearRight && nearBottom) {
    return {
      isCorner: true,
      isEdge: true,
      cornerType: 'br',
      distanceToEdge: 0
    }
  }
  
  // Check edges
  if (nearLeft) {
    return {
      isCorner: false,
      isEdge: true,
      edgeType: 'left',
      distanceToEdge: Math.abs(point.x - bounds.left)
    }
  }
  if (nearRight) {
    return {
      isCorner: false,
      isEdge: true,
      edgeType: 'right',
      distanceToEdge: Math.abs(point.x - bounds.right)
    }
  }
  if (nearTop) {
    return {
      isCorner: false,
      isEdge: true,
      edgeType: 'top',
      distanceToEdge: Math.abs(point.y - bounds.top)
    }
  }
  if (nearBottom) {
    return {
      isCorner: false,
      isEdge: true,
      edgeType: 'bottom',
      distanceToEdge: Math.abs(point.y - bounds.bottom)
    }
  }
  
  // Interior point - calculate distance to nearest edge
  const distances = [
    Math.abs(point.x - bounds.left),
    Math.abs(point.x - bounds.right),
    Math.abs(point.y - bounds.top),
    Math.abs(point.y - bounds.bottom)
  ]
  
  return {
    isCorner: false,
    isEdge: false,
    distanceToEdge: Math.min(...distances)
  }
}

/**
 * Calculate tangent vector at a point on the contour
 */
function calculateTangent(contour: Point[], index: number): { x: number, y: number } {
  const n = contour.length
  const prev = contour[(index - 1 + n) % n]
  const next = contour[(index + 1) % n]
  
  const dx = next.x - prev.x
  const dy = next.y - prev.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) {
    return { x: 1, y: 0 }
  }
  
  return { x: dx / length, y: dy / length }
}

/**
 * Calculate curvature at a point
 */
function calculateCurvature(contour: Point[], index: number): number {
  const n = contour.length
  const prev = contour[(index - 1 + n) % n]
  const curr = contour[index]
  const next = contour[(index + 1) % n]
  
  // Calculate vectors
  const v1x = curr.x - prev.x
  const v1y = curr.y - prev.y
  const v2x = next.x - curr.x
  const v2y = next.y - curr.y
  
  // Calculate angle between vectors
  const cross = v1x * v2y - v1y * v2x
  const dot = v1x * v2x + v1y * v2y
  const angle = Math.atan2(cross, dot)
  
  return angle
}

/**
 * Apply corner treatment based on type
 */
function applyCornerTreatment(
  point: Point,
  cornerType: string,
  bounds: GridBounds,
  cornerRadius: number
): Point {
  // For now, clamp to exact corner
  // TODO: Implement corner rounding with specified radius
  switch (cornerType) {
    case 'tl':
      return { x: bounds.left, y: bounds.top }
    case 'tr':
      return { x: bounds.right, y: bounds.top }
    case 'bl':
      return { x: bounds.left, y: bounds.bottom }
    case 'br':
      return { x: bounds.right, y: bounds.bottom }
    default:
      return point
  }
}

/**
 * Apply edge treatment with curve-to-straight transition
 */
function applyEdgeTransition(
  point: Point,
  smoothedPoint: Point,
  classification: PointClassification,
  transitionZone: number,
  bounds: GridBounds
): Point {
  if (!classification.isEdge && classification.distanceToEdge > transitionZone) {
    // Far from edge - use full smoothing
    return smoothedPoint
  }
  
  if (classification.isEdge) {
    // On edge - constrain to edge
    let x = smoothedPoint.x
    let y = smoothedPoint.y
    
    switch (classification.edgeType) {
      case 'left':
        x = bounds.left
        break
      case 'right':
        x = bounds.right
        break
      case 'top':
        y = bounds.top
        break
      case 'bottom':
        y = bounds.bottom
        break
    }
    
    return { x, y }
  }
  
  // In transition zone - blend between smoothed and straight
  const t = classification.distanceToEdge / transitionZone
  const edgePoint = { ...point }
  
  // Find nearest edge and project
  const distLeft = Math.abs(point.x - bounds.left)
  const distRight = Math.abs(point.x - bounds.right)
  const distTop = Math.abs(point.y - bounds.top)
  const distBottom = Math.abs(point.y - bounds.bottom)
  
  const minDist = Math.min(distLeft, distRight, distTop, distBottom)
  
  if (minDist === distLeft) {
    edgePoint.x = bounds.left
  } else if (minDist === distRight) {
    edgePoint.x = bounds.right
  } else if (minDist === distTop) {
    edgePoint.y = bounds.top
  } else {
    edgePoint.y = bounds.bottom
  }
  
  // Blend between smoothed and edge-projected point
  return {
    x: smoothedPoint.x * t + edgePoint.x * (1 - t),
    y: smoothedPoint.y * t + edgePoint.y * (1 - t)
  }
}

/**
 * Edge-aware smoothing that properly handles corners and transitions
 */
export function edgeAwareSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions = {}
): Point[] {
  const {
    iterations = 2,
    strength = 0.5,
    edgeTransitionZone = 1.0,
    cornerRadius = 0.1,
    preserveCorners = true
  } = options
  
  if (contour.length < 3) return contour
  
  let smoothed = [...contour]
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const curr = smoothed[i]
      const classification = classifyPoint(curr, bounds, 0.1)
      
      // Handle corners specially
      if (classification.isCorner && preserveCorners) {
        newContour.push(applyCornerTreatment(
          curr,
          classification.cornerType!,
          bounds,
          cornerRadius
        ))
        continue
      }
      
      // Calculate smoothed position
      const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
      const next = smoothed[(i + 1) % smoothed.length]
      
      const smoothedPoint = {
        x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
        y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
      }
      
      // Apply edge transition
      const finalPoint = applyEdgeTransition(
        curr,
        smoothedPoint,
        classification,
        edgeTransitionZone,
        bounds
      )
      
      newContour.push(finalPoint)
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

/**
 * Detect straight segments that should be preserved
 */
function detectStraightSegments(
  contour: Point[],
  angleThreshold: number = 0.1
): boolean[] {
  const n = contour.length
  const isStraight: boolean[] = new Array(n).fill(false)
  
  for (let i = 0; i < n; i++) {
    const curvature = Math.abs(calculateCurvature(contour, i))
    isStraight[i] = curvature < angleThreshold
  }
  
  return isStraight
}

/**
 * Advanced smoothing with intelligent edge hinting
 */
export function intelligentEdgeSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions = {}
): Point[] {
  const {
    iterations = 2,
    strength = 0.5,
    edgeTransitionZone = 1.0,
    preserveCorners = true
  } = options
  
  if (contour.length < 3) return contour
  
  // First pass: detect features
  const straightSegments = detectStraightSegments(contour)
  const classifications = contour.map(p => classifyPoint(p, bounds))
  
  let smoothed = [...contour]
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const curr = smoothed[i]
      const classification = classifications[i]
      
      // Skip corners if preserving
      if (classification.isCorner && preserveCorners) {
        newContour.push(curr)
        continue
      }
      
      // Skip if part of a straight segment near an edge
      if (straightSegments[i] && classification.distanceToEdge < edgeTransitionZone) {
        newContour.push(curr)
        continue
      }
      
      // Apply weighted smoothing based on distance to edge
      const weight = classification.isEdge ? 0 : 
        Math.min(1, classification.distanceToEdge / edgeTransitionZone) * strength
      
      const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
      const next = smoothed[(i + 1) % smoothed.length]
      
      const smoothedPoint = {
        x: curr.x + weight * (prev.x + next.x - 2 * curr.x) / 2,
        y: curr.y + weight * (prev.y + next.y - 2 * curr.y) / 2
      }
      
      // Constrain to edges if needed
      if (classification.isEdge) {
        switch (classification.edgeType) {
          case 'left':
            smoothedPoint.x = bounds.left
            break
          case 'right':
            smoothedPoint.x = bounds.right
            break
          case 'top':
            smoothedPoint.y = bounds.top
            break
          case 'bottom':
            smoothedPoint.y = bounds.bottom
            break
        }
      }
      
      newContour.push(smoothedPoint)
    }
    
    smoothed = newContour
  }
  
  return smoothed
}