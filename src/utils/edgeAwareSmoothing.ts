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
  strictEdges?: { left: boolean, right: boolean, top: boolean, bottom: boolean }
}

interface PointClassification {
  isCorner: boolean
  isEdge: boolean
  edgeType?: 'left' | 'right' | 'top' | 'bottom'
  cornerType?: 'tl' | 'tr' | 'bl' | 'br'
  distanceToEdge: number
}

/**
 * Enhanced point classification for interpolated coordinates
 * Handles the fact that interpolation can move points slightly away from exact grid boundaries
 */
function classifyInterpolatedPoint(point: Point, bounds: GridBounds, tolerance: number = 0.3): PointClassification {
  // For interpolated coordinates, we need to be more lenient with edge detection
  // since interpolation can move points slightly away from exact boundaries
  
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
  
  // Check edges with more lenient detection
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
 * Classify a point based on its position relative to grid bounds
 * Uses stricter tolerance for activated edges
 */
function classifyPoint(point: Point, bounds: GridBounds, tolerance: number = 0.1): PointClassification {
  // Use stricter tolerance for activated edges
  const strictTolerance = bounds.strictEdges ? 0.5 : tolerance
  
  const nearLeft = Math.abs(point.x - bounds.left) < (bounds.strictEdges?.left ? strictTolerance : tolerance)
  const nearRight = Math.abs(point.x - bounds.right) < (bounds.strictEdges?.right ? strictTolerance : tolerance)
  const nearTop = Math.abs(point.y - bounds.top) < (bounds.strictEdges?.top ? strictTolerance : tolerance)
  const nearBottom = Math.abs(point.y - bounds.bottom) < (bounds.strictEdges?.bottom ? strictTolerance : tolerance)
  
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
  // Corner rounding with specified radius
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
 * Enforces mandatory strict clamping for activated edges
 */
function applyEdgeTransition(
  point: Point,
  smoothedPoint: Point,
  classification: PointClassification,
  transitionZone: number,
  bounds: GridBounds
): Point {
  // Check if this edge is strictly activated
  const isStrictEdge = bounds.strictEdges && (
    (classification.edgeType === 'left' && bounds.strictEdges.left) ||
    (classification.edgeType === 'right' && bounds.strictEdges.right) ||
    (classification.edgeType === 'top' && bounds.strictEdges.top) ||
    (classification.edgeType === 'bottom' && bounds.strictEdges.bottom)
  )
  
  if (classification.isEdge || isStrictEdge) {
    // On edge or strict edge - constrain exactly to boundary (mandatory)
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
  
  if (!classification.isEdge && classification.distanceToEdge > transitionZone) {
    // Far from edge - use full smoothing
    return smoothedPoint
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
      
      // Mandatory edge constraint for all edge points
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
      
      // Also check for strict edge enforcement
      if (bounds.strictEdges) {
        if (bounds.strictEdges.left && Math.abs(smoothedPoint.x - bounds.left) < 0.5) {
          smoothedPoint.x = bounds.left
        }
        if (bounds.strictEdges.right && Math.abs(smoothedPoint.x - bounds.right) < 0.5) {
          smoothedPoint.x = bounds.right
        }
        if (bounds.strictEdges.top && Math.abs(smoothedPoint.y - bounds.top) < 0.5) {
          smoothedPoint.y = bounds.top
        }
        if (bounds.strictEdges.bottom && Math.abs(smoothedPoint.y - bounds.bottom) < 0.5) {
          smoothedPoint.y = bounds.bottom
        }
      }
      
      newContour.push(smoothedPoint)
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

/**
 * Selective smoothing that only processes segments away from edges
 * This provides predictable edge clamping while allowing interior smoothing
 * Updated to work with interpolated coordinates
 */
export function selectiveEdgeSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions & {
    edgeBufferDistance?: number // Distance from edge where smoothing is disabled
    preserveEdgeSegments?: boolean // Whether to keep edge segments exactly as-is
    transitionBlending?: boolean // Whether to blend between smoothed and edge segments
  } = {}
): Point[] {
  const {
    iterations = 2,
    strength = 0.5,
    edgeTransitionZone = 1.0,
    cornerRadius = 0.1,
    preserveCorners = true,
    edgeBufferDistance = 2.0, // Default 2 grid cells from edge
    preserveEdgeSegments = true,
    transitionBlending = true
  } = options
  
  if (contour.length < 3) return contour
  
  // Classify each point based on distance to edges
  // Use specialized classification for interpolated coordinates
  const pointClassifications = contour.map(point => {
    const classification = classifyInterpolatedPoint(point, bounds, 0.3)
    const distanceToEdge = classification.distanceToEdge
    
    return {
      point,
      classification,
      segmentType: distanceToEdge <= edgeBufferDistance ? 'EDGE_SEGMENT' : 'INTERIOR_SEGMENT',
      distanceToEdge
    }
  })
  
  let smoothed = [...contour]
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const curr = smoothed[i]
      const pointInfo = pointClassifications[i]
      
      // Handle edge segments - preserve exact positioning
      if (pointInfo.segmentType === 'EDGE_SEGMENT' && preserveEdgeSegments) {
        // For edge segments, maintain exact edge alignment
        if (pointInfo.classification.isEdge) {
          // On exact edge - constrain to boundary
          let x = curr.x
          let y = curr.y
          
          switch (pointInfo.classification.edgeType) {
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
          
          newContour.push({ x, y })
          continue
        }
        
        // Near edge but not exactly on it - apply edge transition
        const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
        const next = smoothed[(i + 1) % smoothed.length]
        
        const smoothedPoint = {
          x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
          y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
        }
        
        const finalPoint = applyEdgeTransition(
          curr,
          smoothedPoint,
          pointInfo.classification,
          edgeTransitionZone,
          bounds
        )
        
        newContour.push(finalPoint)
        continue
      }
      
      // Handle interior segments - apply full smoothing
      if (pointInfo.segmentType === 'INTERIOR_SEGMENT') {
        const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
        const next = smoothed[(i + 1) % smoothed.length]
        
        const smoothedPoint = {
          x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
          y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
        }
        
        newContour.push(smoothedPoint)
        continue
      }
      
      // Handle transition zones - blend between edge and interior behavior
      if (transitionBlending) {
        const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
        const next = smoothed[(i + 1) % smoothed.length]
        
        const smoothedPoint = {
          x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
          y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
        }
        
        // Blend factor based on distance from edge
        const blendFactor = Math.max(0, Math.min(1, pointInfo.distanceToEdge / edgeBufferDistance))
        
        const finalPoint = {
          x: curr.x * (1 - blendFactor) + smoothedPoint.x * blendFactor,
          y: curr.y * (1 - blendFactor) + smoothedPoint.y * blendFactor
        }
        
        newContour.push(finalPoint)
      } else {
        // No blending - keep original
        newContour.push(curr)
      }
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

/**
 * Advanced selective smoothing with intelligent segment detection
 * Automatically detects which segments should be preserved vs smoothed
 * Updated to work with interpolated coordinates
 */
export function intelligentSelectiveSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions & {
    edgeBufferDistance?: number
    curvatureThreshold?: number // Curvature threshold for preserving segments
    preserveStraightSegments?: boolean // Whether to preserve straight segments
  } = {}
): Point[] {
  const {
    iterations = 2,
    strength = 0.5,
    edgeBufferDistance = 2.0,
    curvatureThreshold = 0.1,
    preserveStraightSegments = true
  } = options
  
  if (contour.length < 3) return contour
  
  // Detect straight segments that should be preserved
  const straightSegments = detectStraightSegments(contour, curvatureThreshold)
  
  // Classify points with multiple criteria
  // Use specialized classification for interpolated coordinates
  const pointClassifications = contour.map((point, index) => {
    const classification = classifyInterpolatedPoint(point, bounds, 0.3)
    const distanceToEdge = classification.distanceToEdge
    const isStraight = straightSegments[index]
    
    let segmentType: 'EDGE_SEGMENT' | 'INTERIOR_SEGMENT' | 'STRAIGHT_SEGMENT' = 'INTERIOR_SEGMENT'
    
    if (distanceToEdge <= edgeBufferDistance) {
      segmentType = 'EDGE_SEGMENT'
    } else if (isStraight && preserveStraightSegments) {
      segmentType = 'STRAIGHT_SEGMENT'
    }
    
    return {
      point,
      classification,
      segmentType,
      distanceToEdge,
      isStraight
    }
  })
  
  let smoothed = [...contour]
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const curr = smoothed[i]
      const pointInfo = pointClassifications[i]
      
      // Preserve edge segments exactly
      if (pointInfo.segmentType === 'EDGE_SEGMENT') {
        if (pointInfo.classification.isEdge) {
          // Exact edge constraint
          let x = curr.x
          let y = curr.y
          
          switch (pointInfo.classification.edgeType) {
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
          
          newContour.push({ x, y })
        } else {
          // Near edge - apply edge transition
          const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
          const next = smoothed[(i + 1) % smoothed.length]
          
          const smoothedPoint = {
            x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
            y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
          }
          
          const finalPoint = applyEdgeTransition(
            curr,
            smoothedPoint,
            pointInfo.classification,
            edgeBufferDistance,
            bounds
          )
          
          newContour.push(finalPoint)
        }
        continue
      }
      
      // Preserve straight segments
      if (pointInfo.segmentType === 'STRAIGHT_SEGMENT') {
        newContour.push(curr)
        continue
      }
      
      // Apply full smoothing to interior segments
      const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
      const next = smoothed[(i + 1) % smoothed.length]
      
      const smoothedPoint = {
        x: curr.x + strength * (prev.x + next.x - 2 * curr.x) / 2,
        y: curr.y + strength * (prev.y + next.y - 2 * curr.y) / 2
      }
      
      newContour.push(smoothedPoint)
    }
    
    smoothed = newContour
  }
  
  return smoothed
}