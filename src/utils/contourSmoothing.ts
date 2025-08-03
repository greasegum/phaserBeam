import { Point } from './marchingSquaresOptimized'

export interface SmoothingOptions {
  iterations?: number
  strength?: number
  preserveEdges?: boolean
  edgeThreshold?: number
}

export interface EdgeConstraints {
  leftEdge?: number
  rightEdge?: number
  topEdge?: number
  bottomEdge?: number
  tolerance?: number
  edgeClamping?: boolean
  edgeClampDistance?: number
  cornerTreatment?: 'trimmed' | 'flared' | 'square'
}

function isEdgePoint(point: Point, constraints: EdgeConstraints, tolerance: number = 0.1): boolean {
  if (constraints.leftEdge !== undefined && Math.abs(point.x - constraints.leftEdge) < tolerance) return true
  if (constraints.rightEdge !== undefined && Math.abs(point.x - constraints.rightEdge) < tolerance) return true
  if (constraints.topEdge !== undefined && Math.abs(point.y - constraints.topEdge) < tolerance) return true
  if (constraints.bottomEdge !== undefined && Math.abs(point.y - constraints.bottomEdge) < tolerance) return true
  return false
}

function clampToEdges(point: Point, constraints: EdgeConstraints, tolerance: number = 0.1): Point {
  let x = point.x
  let y = point.y
  
  // Apply strong edge clamping if enabled
  if (constraints.edgeClamping && constraints.edgeClampDistance !== undefined) {
    const gridBounds = {
      minX: constraints.leftEdge || 0,
      maxX: constraints.rightEdge || 0,
      minY: constraints.topEdge || 0,
      maxY: constraints.bottomEdge || 0
    }
    
    const clampDistance = constraints.edgeClampDistance
    const cornerTreatment = constraints.cornerTreatment || 'flared'
    
    // Calculate distances to edges
    const distToLeft = x - gridBounds.minX
    const distToRight = gridBounds.maxX - x
    const distToTop = y - gridBounds.minY
    const distToBottom = gridBounds.maxY - y
    
    // Check if we're near edges
    const nearLeft = distToLeft < clampDistance
    const nearRight = distToRight < clampDistance
    const nearTop = distToTop < clampDistance
    const nearBottom = distToBottom < clampDistance
    
    // Handle corner regions differently based on treatment
    const inCorner = (nearLeft || nearRight) && (nearTop || nearBottom)
    
    if (inCorner) {
      switch (cornerTreatment) {
        case 'trimmed':
          // Trimmed corners: cut the corner at 45 degrees
          if (nearLeft && nearTop) {
            const minDist = Math.min(distToLeft, distToTop)
            if (minDist < clampDistance * 0.5) {
              x = gridBounds.minX + clampDistance * 0.5
              y = gridBounds.minY + clampDistance * 0.5
            }
          } else if (nearRight && nearTop) {
            const minDist = Math.min(distToRight, distToTop)
            if (minDist < clampDistance * 0.5) {
              x = gridBounds.maxX - clampDistance * 0.5
              y = gridBounds.minY + clampDistance * 0.5
            }
          } else if (nearLeft && nearBottom) {
            const minDist = Math.min(distToLeft, distToBottom)
            if (minDist < clampDistance * 0.5) {
              x = gridBounds.minX + clampDistance * 0.5
              y = gridBounds.maxY - clampDistance * 0.5
            }
          } else if (nearRight && nearBottom) {
            const minDist = Math.min(distToRight, distToBottom)
            if (minDist < clampDistance * 0.5) {
              x = gridBounds.maxX - clampDistance * 0.5
              y = gridBounds.maxY - clampDistance * 0.5
            }
          }
          break
          
        case 'flared':
          // Flared corners: contours hug the edges more closely (default behavior)
          // Apply aggressive clamping that pulls contours strongly to edges during smoothing
          if (nearLeft) {
            const pullStrength = Math.min(1.0, clampDistance / Math.max(0.1, distToLeft))
            x = gridBounds.minX + distToLeft * (1.0 - pullStrength * 0.9)
          }
          if (nearRight) {
            const pullStrength = Math.min(1.0, clampDistance / Math.max(0.1, distToRight))
            x = gridBounds.maxX - distToRight * (1.0 - pullStrength * 0.9)
          }
          if (nearTop) {
            const pullStrength = Math.min(1.0, clampDistance / Math.max(0.1, distToTop))
            y = gridBounds.minY + distToTop * (1.0 - pullStrength * 0.9)
          }
          if (nearBottom) {
            const pullStrength = Math.min(1.0, clampDistance / Math.max(0.1, distToBottom))
            y = gridBounds.maxY - distToBottom * (1.0 - pullStrength * 0.9)
          }
          break
          
        case 'square':
          // Square corners: maintain rectangular shape at corners
          if (nearLeft && distToLeft < clampDistance * 0.3) x = gridBounds.minX
          if (nearRight && distToRight < clampDistance * 0.3) x = gridBounds.maxX
          if (nearTop && distToTop < clampDistance * 0.3) y = gridBounds.minY
          if (nearBottom && distToBottom < clampDistance * 0.3) y = gridBounds.maxY
          break
      }
    } else {
      // Not in corner, apply stronger edge clamping during smoothing
      if (nearLeft && distToLeft < clampDistance * 0.7) {
        const pullStrength = Math.min(1.0, (clampDistance * 0.7) / Math.max(0.05, distToLeft))
        x = gridBounds.minX + distToLeft * (1.0 - pullStrength * 0.8)
      }
      if (nearRight && distToRight < clampDistance * 0.7) {
        const pullStrength = Math.min(1.0, (clampDistance * 0.7) / Math.max(0.05, distToRight))
        x = gridBounds.maxX - distToRight * (1.0 - pullStrength * 0.8)
      }
      
      if (nearTop && distToTop < clampDistance * 0.7) {
        const pullStrength = Math.min(1.0, (clampDistance * 0.7) / Math.max(0.05, distToTop))
        y = gridBounds.minY + distToTop * (1.0 - pullStrength * 0.8)
      }
      if (nearBottom && distToBottom < clampDistance * 0.7) {
        const pullStrength = Math.min(1.0, (clampDistance * 0.7) / Math.max(0.05, distToBottom))
        y = gridBounds.maxY - distToBottom * (1.0 - pullStrength * 0.8)
      }
    }
  } else {
    // Original simple clamping logic
    if (constraints.leftEdge !== undefined && Math.abs(x - constraints.leftEdge) < tolerance) {
      x = constraints.leftEdge
    }
    if (constraints.rightEdge !== undefined && Math.abs(x - constraints.rightEdge) < tolerance) {
      x = constraints.rightEdge
    }
    if (constraints.topEdge !== undefined && Math.abs(y - constraints.topEdge) < tolerance) {
      y = constraints.topEdge
    }
    if (constraints.bottomEdge !== undefined && Math.abs(y - constraints.bottomEdge) < tolerance) {
      y = constraints.bottomEdge
    }
  }
  
  return { x, y }
}

export function laplacianSmoothing(
  contour: Point[], 
  constraints: EdgeConstraints,
  options: SmoothingOptions = {}
): Point[] {
  const {
    iterations = 2,
    strength = 0.5,
    preserveEdges = true
  } = options
  
  if (contour.length < 3) return contour
  
  let smoothed = [...contour]
  const isClosed = Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 && 
                   Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const current = smoothed[i]
      
      // Skip edge points if preserving edges
      if (preserveEdges && isEdgePoint(current, constraints)) {
        newContour.push(current)
        continue
      }
      
      // Get neighbors
      let prev: Point
      let next: Point
      
      if (isClosed) {
        prev = smoothed[(i - 1 + smoothed.length) % smoothed.length]
        next = smoothed[(i + 1) % smoothed.length]
      } else {
        if (i === 0 || i === smoothed.length - 1) {
          newContour.push(current)
          continue
        }
        prev = smoothed[i - 1]
        next = smoothed[i + 1]
      }
      
      // Laplacian smoothing: move toward average of neighbors
      const avgX = (prev.x + next.x) / 2
      const avgY = (prev.y + next.y) / 2
      
      const newX = current.x + strength * (avgX - current.x)
      const newY = current.y + strength * (avgY - current.y)
      
      newContour.push(clampToEdges({ x: newX, y: newY }, constraints))
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

export function chaikinSmoothing(
  contour: Point[], 
  constraints: EdgeConstraints,
  options: SmoothingOptions = {}
): Point[] {
  const {
    iterations = 2,
    preserveEdges = true
  } = options
  
  if (contour.length < 3) return contour
  
  let smoothed = [...contour]
  const isClosed = Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 && 
                   Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length - 1; i++) {
      const p0 = smoothed[i]
      const p1 = smoothed[i + 1]
      
      // Check if either endpoint is on an edge
      const p0OnEdge = preserveEdges && isEdgePoint(p0, constraints)
      const p1OnEdge = preserveEdges && isEdgePoint(p1, constraints)
      
      if (p0OnEdge && p1OnEdge) {
        // Both on edges, keep the segment as is
        if (i === 0) newContour.push(p0)
        newContour.push(p1)
      } else if (p0OnEdge) {
        // p0 on edge, only cut from p1 side
        if (i === 0) newContour.push(p0)
        const q = {
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y
        }
        newContour.push(clampToEdges(q, constraints))
        if (i === smoothed.length - 2) newContour.push(p1)
      } else if (p1OnEdge) {
        // p1 on edge, only cut from p0 side
        if (i === 0) newContour.push(p0)
        const q = {
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y
        }
        newContour.push(clampToEdges(q, constraints))
        newContour.push(p1)
      } else {
        // Neither on edge, apply standard Chaikin
        if (i === 0) {
          const q0 = {
            x: 0.75 * p0.x + 0.25 * p1.x,
            y: 0.75 * p0.y + 0.25 * p1.y
          }
          newContour.push(clampToEdges(q0, constraints))
        }
        
        const q1 = {
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y
        }
        newContour.push(clampToEdges(q1, constraints))
        
        if (i === smoothed.length - 2) {
          const q2 = {
            x: 0.25 * p0.x + 0.75 * p1.x,
            y: 0.25 * p0.y + 0.75 * p1.y
          }
          newContour.push(clampToEdges(q2, constraints))
        }
      }
    }
    
    // Handle closed contours
    if (isClosed && newContour.length > 0) {
      newContour[newContour.length - 1] = newContour[0]
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

export function bilateralSmoothing(
  contour: Point[], 
  constraints: EdgeConstraints,
  options: SmoothingOptions = {}
): Point[] {
  const {
    iterations = 1,
    strength = 0.5,
    preserveEdges = true,
    edgeThreshold = 0.1
  } = options
  
  if (contour.length < 3) return contour
  
  let smoothed = [...contour]
  const isClosed = Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 && 
                   Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001
  
  // Spatial and range kernels
  const spatialSigma = 2.0
  const rangeSigma = 0.5
  
  for (let iter = 0; iter < iterations; iter++) {
    const newContour: Point[] = []
    
    for (let i = 0; i < smoothed.length; i++) {
      const current = smoothed[i]
      
      // Skip edge points if preserving edges
      if (preserveEdges && isEdgePoint(current, constraints, edgeThreshold)) {
        newContour.push(current)
        continue
      }
      
      // Skip endpoints of open contours
      if (!isClosed && (i === 0 || i === smoothed.length - 1)) {
        newContour.push(current)
        continue
      }
      
      // Bilateral filter
      let weightedSumX = 0
      let weightedSumY = 0
      let totalWeight = 0
      
      // Consider neighbors within window
      const windowSize = 5
      for (let j = -windowSize; j <= windowSize; j++) {
        let neighborIdx: number
        if (isClosed) {
          neighborIdx = (i + j + smoothed.length) % smoothed.length
        } else {
          neighborIdx = Math.max(0, Math.min(smoothed.length - 1, i + j))
        }
        
        const neighbor = smoothed[neighborIdx]
        
        // Spatial weight (Gaussian based on index distance)
        const spatialDist = Math.abs(j)
        const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * spatialSigma * spatialSigma))
        
        // Range weight (based on geometric distance)
        const dx = neighbor.x - current.x
        const dy = neighbor.y - current.y
        const rangeDist = Math.sqrt(dx * dx + dy * dy)
        const rangeWeight = Math.exp(-(rangeDist * rangeDist) / (2 * rangeSigma * rangeSigma))
        
        const weight = spatialWeight * rangeWeight
        weightedSumX += weight * neighbor.x
        weightedSumY += weight * neighbor.y
        totalWeight += weight
      }
      
      if (totalWeight > 0) {
        const smoothX = current.x + strength * (weightedSumX / totalWeight - current.x)
        const smoothY = current.y + strength * (weightedSumY / totalWeight - current.y)
        newContour.push(clampToEdges({ x: smoothX, y: smoothY }, constraints))
      } else {
        newContour.push(current)
      }
    }
    
    smoothed = newContour
  }
  
  return smoothed
}

export function savitzkyGolaySmoothing(
  contour: Point[], 
  constraints: EdgeConstraints,
  options: SmoothingOptions = {}
): Point[] {
  const {
    preserveEdges = true
  } = options
  
  if (contour.length < 5) return contour
  
  const smoothed: Point[] = []
  const isClosed = Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 && 
                   Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001
  
  // Savitzky-Golay coefficients for 5-point quadratic smoothing
  const coefficients = [-3, 12, 17, 12, -3]
  const normFactor = 35
  
  for (let i = 0; i < contour.length; i++) {
    const current = contour[i]
    
    // Skip edge points if preserving edges
    if (preserveEdges && isEdgePoint(current, constraints)) {
      smoothed.push(current)
      continue
    }
    
    // Skip near endpoints for open contours
    if (!isClosed && (i < 2 || i >= contour.length - 2)) {
      smoothed.push(current)
      continue
    }
    
    let smoothX = 0
    let smoothY = 0
    
    for (let j = -2; j <= 2; j++) {
      let idx: number
      if (isClosed) {
        idx = (i + j + contour.length) % contour.length
      } else {
        idx = Math.max(0, Math.min(contour.length - 1, i + j))
      }
      
      smoothX += coefficients[j + 2] * contour[idx].x
      smoothY += coefficients[j + 2] * contour[idx].y
    }
    
    smoothed.push(clampToEdges({
      x: smoothX / normFactor,
      y: smoothY / normFactor
    }, constraints))
  }
  
  return smoothed
}

export function constrainedCatmullRomSmoothing(
  contour: Point[], 
  constraints: EdgeConstraints,
  options: SmoothingOptions = {}
): Point[] {
  const {
    strength = 0.5,
    preserveEdges = true
  } = options
  
  if (contour.length < 4) return contour
  
  const interpolated: Point[] = []
  const isClosed = Math.abs(contour[0].x - contour[contour.length - 1].x) < 0.001 && 
                   Math.abs(contour[0].y - contour[contour.length - 1].y) < 0.001
  
  // Helper to get point with wrapping for closed contours
  const getPoint = (idx: number): Point => {
    if (isClosed) {
      return contour[(idx + contour.length) % contour.length]
    }
    return contour[Math.max(0, Math.min(contour.length - 1, idx))]
  }
  
  // Catmull-Rom interpolation
  const catmullRom = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const t2 = t * t
    const t3 = t2 * t
    
    const v0x = (p2.x - p0.x) * strength
    const v0y = (p2.y - p0.y) * strength
    const v1x = (p3.x - p1.x) * strength
    const v1y = (p3.y - p1.y) * strength
    
    const x = p1.x + v0x * t + (3 * (p2.x - p1.x) - 2 * v0x - v1x) * t2 + 
              (2 * (p1.x - p2.x) + v0x + v1x) * t3
    const y = p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + 
              (2 * (p1.y - p2.y) + v0y + v1y) * t3
    
    return { x, y }
  }
  
  // Process each segment
  for (let i = 0; i < contour.length; i++) {
    const p1 = getPoint(i)
    const p2 = getPoint(i + 1)
    
    // Check if segment endpoints are on edges
    const p1OnEdge = preserveEdges && isEdgePoint(p1, constraints)
    const p2OnEdge = preserveEdges && isEdgePoint(p2, constraints)
    
    // Always include the first point
    if (i === 0) {
      interpolated.push(p1)
    }
    
    // Skip interpolation if both points are on edges
    if (p1OnEdge && p2OnEdge) {
      if (i < contour.length - 1) {
        interpolated.push(p2)
      }
      continue
    }
    
    // Get control points for Catmull-Rom
    const p0 = getPoint(i - 1)
    const p3 = getPoint(i + 2)
    
    // Interpolate between p1 and p2
    const steps = 3
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1)
      const point = catmullRom(p0, p1, p2, p3, t)
      interpolated.push(clampToEdges(point, constraints))
    }
    
    // Add p2 if not at the end
    if (i < contour.length - 1) {
      interpolated.push(p2)
    }
  }
  
  // Ensure closed contours are properly closed
  if (isClosed && interpolated.length > 0) {
    interpolated[interpolated.length - 1] = interpolated[0]
  }
  
  return interpolated
}