import { Point } from './marchingSquares'

export interface CollisionAvoidanceOptions {
  minDistance?: number // Minimum distance between contours in grid units
  method?: 'push' | 'shrink' | 'hybrid' // How to handle collisions
  iterations?: number // Max iterations for collision resolution
  preserveArea?: boolean // Try to maintain original area when avoiding collisions
}

interface BoundingBox {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

interface ContourWithBounds {
  contour: Point[]
  bounds: BoundingBox
  neighbors: Set<number> // Indices of potentially colliding contours
}

// Calculate bounding box of a contour
function getBoundingBox(contour: Point[]): BoundingBox {
  if (contour.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  }
  
  let minX = contour[0].x
  let maxX = contour[0].x
  let minY = contour[0].y
  let maxY = contour[0].y
  
  for (const point of contour) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  
  return { minX, maxX, minY, maxY }
}

// Check if two bounding boxes might overlap (with buffer)
function boundingBoxesOverlap(box1: BoundingBox, box2: BoundingBox, buffer: number): boolean {
  return !(
    box1.maxX + buffer < box2.minX - buffer ||
    box2.maxX + buffer < box1.minX - buffer ||
    box1.maxY + buffer < box2.minY - buffer ||
    box2.maxY + buffer < box1.minY - buffer
  )
}

// Calculate minimum distance between two contours
function getMinimumDistance(contour1: Point[], contour2: Point[]): number {
  let minDist = Infinity
  
  for (const p1 of contour1) {
    for (const p2 of contour2) {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      minDist = Math.min(minDist, dist)
    }
  }
  
  return minDist
}

// Find the closest points between two contours
function findClosestPoints(contour1: Point[], contour2: Point[]): { p1: Point; p2: Point; distance: number } {
  let minDist = Infinity
  let closestP1 = contour1[0]
  let closestP2 = contour2[0]
  
  for (const p1 of contour1) {
    for (const p2 of contour2) {
      const dx = p1.x - p2.x
      const dy = p1.y - p2.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < minDist) {
        minDist = dist
        closestP1 = p1
        closestP2 = p2
      }
    }
  }
  
  return { p1: closestP1, p2: closestP2, distance: minDist }
}

// Calculate the centroid of a contour
function getContourCentroid(contour: Point[]): Point {
  if (contour.length === 0) return { x: 0, y: 0 }
  
  let sumX = 0
  let sumY = 0
  
  for (const point of contour) {
    sumX += point.x
    sumY += point.y
  }
  
  return {
    x: sumX / contour.length,
    y: sumY / contour.length
  }
}

// Push contours apart to avoid collision
function pushContoursApart(contour1: Point[], contour2: Point[], minDistance: number): { contour1: Point[]; contour2: Point[] } {
  const closest = findClosestPoints(contour1, contour2)
  
  if (closest.distance >= minDistance) {
    return { contour1, contour2 }
  }
  
  // Calculate push vector
  const pushDistance = (minDistance - closest.distance) / 2
  const dx = closest.p2.x - closest.p1.x
  const dy = closest.p2.y - closest.p1.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) return { contour1, contour2 }
  
  // Normalized push direction
  const pushX = (dx / length) * pushDistance
  const pushY = (dy / length) * pushDistance
  
  // Push contours apart
  const newContour1 = contour1.map(p => ({
    x: p.x - pushX,
    y: p.y - pushY
  }))
  
  const newContour2 = contour2.map(p => ({
    x: p.x + pushX,
    y: p.y + pushY
  }))
  
  return { contour1: newContour1, contour2: newContour2 }
}

// Shrink contours to avoid collision
function shrinkContoursToAvoid(contour1: Point[], contour2: Point[], minDistance: number): { contour1: Point[]; contour2: Point[] } {
  const centroid1 = getContourCentroid(contour1)
  const centroid2 = getContourCentroid(contour2)
  const closest = findClosestPoints(contour1, contour2)
  
  if (closest.distance >= minDistance) {
    return { contour1, contour2 }
  }
  
  // Calculate shrink factor
  const shrinkFactor = closest.distance / minDistance
  
  // Shrink both contours toward their centroids
  const newContour1 = contour1.map(p => ({
    x: centroid1.x + (p.x - centroid1.x) * shrinkFactor,
    y: centroid1.y + (p.y - centroid1.y) * shrinkFactor
  }))
  
  const newContour2 = contour2.map(p => ({
    x: centroid2.x + (p.x - centroid2.x) * shrinkFactor,
    y: centroid2.y + (p.y - centroid2.y) * shrinkFactor
  }))
  
  return { contour1: newContour1, contour2: newContour2 }
}

// Hybrid approach: push apart if far, shrink if close
function hybridCollisionAvoidance(contour1: Point[], contour2: Point[], minDistance: number): { contour1: Point[]; contour2: Point[] } {
  const closest = findClosestPoints(contour1, contour2)
  
  if (closest.distance >= minDistance) {
    return { contour1, contour2 }
  }
  
  // If contours are very close (overlapping), use shrink method
  if (closest.distance < minDistance * 0.3) {
    return shrinkContoursToAvoid(contour1, contour2, minDistance)
  }
  
  // Otherwise, push them apart
  return pushContoursApart(contour1, contour2, minDistance)
}

// Main collision avoidance function
export function applyCollisionAvoidance(
  contours: Point[][],
  options: CollisionAvoidanceOptions = {}
): Point[][] {
  const {
    minDistance = 0.5,
    method = 'hybrid',
    iterations = 10
  } = options
  
  if (contours.length < 2) return contours
  
  // Create contour data with bounding boxes
  let contoursWithBounds: ContourWithBounds[] = contours.map(contour => ({
    contour: [...contour],
    bounds: getBoundingBox(contour),
    neighbors: new Set<number>()
  }))
  
  // Find potential neighbors based on bounding box overlap
  for (let i = 0; i < contoursWithBounds.length; i++) {
    for (let j = i + 1; j < contoursWithBounds.length; j++) {
      if (boundingBoxesOverlap(contoursWithBounds[i].bounds, contoursWithBounds[j].bounds, minDistance)) {
        contoursWithBounds[i].neighbors.add(j)
        contoursWithBounds[j].neighbors.add(i)
      }
    }
  }
  
  // Iteratively resolve collisions
  for (let iter = 0; iter < iterations; iter++) {
    let hasCollisions = false
    
    // Check and resolve collisions between neighbors
    for (let i = 0; i < contoursWithBounds.length; i++) {
      const contourData = contoursWithBounds[i]
      
      for (const j of contourData.neighbors) {
        if (j <= i) continue // Avoid processing pairs twice
        
        const neighborData = contoursWithBounds[j]
        const distance = getMinimumDistance(contourData.contour, neighborData.contour)
        
        if (distance < minDistance) {
          hasCollisions = true
          
          let result: { contour1: Point[]; contour2: Point[] }
          
          switch (method) {
            case 'push':
              result = pushContoursApart(contourData.contour, neighborData.contour, minDistance)
              break
            case 'shrink':
              result = shrinkContoursToAvoid(contourData.contour, neighborData.contour, minDistance)
              break
            case 'hybrid':
            default:
              result = hybridCollisionAvoidance(contourData.contour, neighborData.contour, minDistance)
              break
          }
          
          // Update contours and bounds
          contourData.contour = result.contour1
          contourData.bounds = getBoundingBox(result.contour1)
          neighborData.contour = result.contour2
          neighborData.bounds = getBoundingBox(result.contour2)
        }
      }
    }
    
    // If no collisions found, we're done
    if (!hasCollisions) break
    
    // Update neighbor relationships based on new bounds
    for (let i = 0; i < contoursWithBounds.length; i++) {
      contoursWithBounds[i].neighbors.clear()
    }
    
    for (let i = 0; i < contoursWithBounds.length; i++) {
      for (let j = i + 1; j < contoursWithBounds.length; j++) {
        if (boundingBoxesOverlap(contoursWithBounds[i].bounds, contoursWithBounds[j].bounds, minDistance)) {
          contoursWithBounds[i].neighbors.add(j)
          contoursWithBounds[j].neighbors.add(i)
        }
      }
    }
  }
  
  // Extract the final contours
  return contoursWithBounds.map(data => data.contour)
}

// Create a buffer zone around contours by expanding them
export function createContourBuffer(contour: Point[], bufferDistance: number): Point[] {
  if (contour.length < 3 || bufferDistance <= 0) return contour
  
  const centroid = getContourCentroid(contour)
  
  // Expand contour outward from centroid
  return contour.map(point => {
    const dx = point.x - centroid.x
    const dy = point.y - centroid.y
    const length = Math.sqrt(dx * dx + dy * dy)
    
    if (length === 0) return point
    
    const expandX = (dx / length) * bufferDistance
    const expandY = (dy / length) * bufferDistance
    
    return {
      x: point.x + expandX,
      y: point.y + expandY
    }
  })
}

// Apply collision avoidance with edge constraints
export function applyCollisionAvoidanceWithConstraints(
  contours: Point[][],
  edgeConstraints: { leftEdge?: number; rightEdge?: number; topEdge?: number; bottomEdge?: number },
  options: CollisionAvoidanceOptions = {}
): Point[][] {
  // First apply collision avoidance
  let adjustedContours = applyCollisionAvoidance(contours, options)
  
  // Then ensure all points respect edge constraints
  return adjustedContours.map(contour => 
    contour.map(point => {
      let x = point.x
      let y = point.y
      
      if (edgeConstraints.leftEdge !== undefined && x < edgeConstraints.leftEdge) {
        x = edgeConstraints.leftEdge
      }
      if (edgeConstraints.rightEdge !== undefined && x > edgeConstraints.rightEdge) {
        x = edgeConstraints.rightEdge
      }
      if (edgeConstraints.topEdge !== undefined && y < edgeConstraints.topEdge) {
        y = edgeConstraints.topEdge
      }
      if (edgeConstraints.bottomEdge !== undefined && y > edgeConstraints.bottomEdge) {
        y = edgeConstraints.bottomEdge
      }
      
      return { x, y }
    })
  )
}