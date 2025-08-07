import Phaser from 'phaser'

export interface Point {
  x: number
  y: number
}

export interface EdgeConstraints {
  leftEdge?: number
  rightEdge?: number
  topEdge?: number
  bottomEdge?: number
  strictEdges?: { left: boolean, right: boolean, top: boolean, bottom: boolean }
}

/**
 * Apply strict edge clamping to interpolated curve points
 */
function applyStrictEdgeClampingToPoint(point: Point, constraints?: EdgeConstraints): Point {
  if (!constraints || !constraints.strictEdges) return point
  
  let { x, y } = point
  const tolerance = 0.5 // Snap threshold for activated edges
  
  // Apply strict snapping for activated edges
  if (constraints.strictEdges.left && constraints.leftEdge !== undefined &&
      Math.abs(x - constraints.leftEdge) < tolerance) {
    x = constraints.leftEdge
  }
  
  if (constraints.strictEdges.right && constraints.rightEdge !== undefined &&
      Math.abs(x - constraints.rightEdge) < tolerance) {
    x = constraints.rightEdge
  }
  
  if (constraints.strictEdges.top && constraints.topEdge !== undefined &&
      Math.abs(y - constraints.topEdge) < tolerance) {
    y = constraints.topEdge
  }
  
  if (constraints.strictEdges.bottom && constraints.bottomEdge !== undefined &&
      Math.abs(y - constraints.bottomEdge) < tolerance) {
    y = constraints.bottomEdge
  }
  
  return { x, y }
}

export function drawBezierContour(
  graphics: Phaser.GameObjects.Graphics,
  contour: Point[],
  closed: boolean = true,
  edgeConstraints?: EdgeConstraints
): void {
  if (contour.length < 2) return
  
  graphics.beginPath()
  
  // Apply edge constraints to all points
  const constrainedContour = contour.map(point => 
    applyStrictEdgeClampingToPoint(point, edgeConstraints)
  )
  
  // Start at first point
  const firstPoint = constrainedContour[0]
  graphics.moveTo(firstPoint.x, firstPoint.y)
  
  // For small contours, use simple lines
  if (constrainedContour.length < 4) {
    for (let i = 1; i < constrainedContour.length; i++) {
      graphics.lineTo(constrainedContour[i].x, constrainedContour[i].y)
    }
    if (closed) {
      graphics.closePath()
    }
    return
  }
  
  // Use quadratic Bezier curves for smooth contours
  for (let i = 0; i < constrainedContour.length - 1; i++) {
    const current = constrainedContour[i]
    const next = constrainedContour[i + 1]
    const nextNext = constrainedContour[(i + 2) % constrainedContour.length]
    
    // Calculate control point
    const controlX = next.x + (nextNext.x - current.x) * 0.2
    const controlY = next.y + (nextNext.y - current.y) * 0.2
    
    // Use lineTo for now since Phaser doesn't have quadraticCurveTo
    graphics.lineTo(next.x, next.y)
  }
  
  // Close the path if needed
  if (closed && constrainedContour.length > 2) {
    const lastPoint = constrainedContour[constrainedContour.length - 1]
    const firstControlX = firstPoint.x + (constrainedContour[1].x - lastPoint.x) * 0.2
    const firstControlY = firstPoint.y + (constrainedContour[1].y - lastPoint.y) * 0.2
    
    // Use lineTo for now since Phaser doesn't have quadraticCurveTo
    graphics.lineTo(firstPoint.x, firstPoint.y)
    graphics.closePath()
  }
}

/**
 * Create a smooth Bezier path from contour points with advanced interpolation
 */
export function createSmoothBezierPath(
  contour: Point[],
  smoothness: number = 0.3,
  edgeConstraints?: EdgeConstraints
): Point[] {
  if (contour.length < 3) return contour
  
  const smoothedPoints: Point[] = []
  const constrainedContour = contour.map(point => 
    applyStrictEdgeClampingToPoint(point, edgeConstraints)
  )
  
  for (let i = 0; i < constrainedContour.length; i++) {
    const prev = constrainedContour[(i - 1 + constrainedContour.length) % constrainedContour.length]
    const current = constrainedContour[i]
    const next = constrainedContour[(i + 1) % constrainedContour.length]
    
    // Calculate tangent vectors
    const tangentX = (next.x - prev.x) * smoothness
    const tangentY = (next.y - prev.y) * smoothness
    
    // Add control points for cubic Bezier
    if (i > 0) {
      smoothedPoints.push({
        x: current.x - tangentX,
        y: current.y - tangentY
      })
    }
    
    smoothedPoints.push(current)
    
    smoothedPoints.push({
      x: current.x + tangentX,
      y: current.y + tangentY
    })
  }
  
  return smoothedPoints
}

/**
 * Draw a cubic Bezier curve path
 */
export function drawCubicBezierContour(
  graphics: Phaser.GameObjects.Graphics,
  points: Point[],
  closed: boolean = true
): void {
  if (points.length < 4) return
  
  graphics.beginPath()
  graphics.moveTo(points[0].x, points[0].y)
  
  // Draw cubic Bezier curves
  for (let i = 1; i < points.length - 2; i += 3) {
    if (i + 2 < points.length) {
      // Use lineTo for now since Phaser doesn't have bezierCurveTo
      graphics.lineTo(points[i + 2].x, points[i + 2].y)
    }
  }
  
  if (closed) {
    graphics.closePath()
  }
}

/**
 * Apply tension-based smoothing to contour points
 */
export function applyTensionSmoothing(
  contour: Point[],
  tension: number = 0.5,
  iterations: number = 1
): Point[] {
  let smoothed = [...contour]
  
  for (let iter = 0; iter < iterations; iter++) {
    const newSmoothed: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
      const current = smoothed[i]
      const next = smoothed[(i + 1) % smoothed.length]
      
      // Apply tension-based interpolation
      const newX = current.x + tension * ((prev.x + next.x) / 2 - current.x)
      const newY = current.y + tension * ((prev.y + next.y) / 2 - current.y)
      
      newSmoothed.push({ x: newX, y: newY })
    }
    
    smoothed = newSmoothed
  }
  
  return smoothed
}

/**
 * Generate interpolated points between contour vertices
 */
export function interpolateContourPoints(
  contour: Point[],
  segmentLength: number = 5
): Point[] {
  if (contour.length < 2) return contour
  
  const interpolated: Point[] = []
  
  for (let i = 0; i < contour.length; i++) {
    const current = contour[i]
    const next = contour[(i + 1) % contour.length]
    
    interpolated.push(current)
    
    // Calculate distance
    const dx = next.x - current.x
    const dy = next.y - current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Add interpolated points if segment is long enough
    if (distance > segmentLength) {
      const steps = Math.floor(distance / segmentLength)
      
      for (let step = 1; step < steps; step++) {
        const t = step / steps
        interpolated.push({
          x: current.x + dx * t,
          y: current.y + dy * t
        })
      }
    }
  }
  
  return interpolated
}
