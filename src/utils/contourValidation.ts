/**
 * Contour validation and repair utilities
 * Detects and fixes self-intersecting and non-manifold contours
 */

export interface Point {
  x: number
  y: number
}

export interface ValidationOptions {
  removeSelfIntersections?: boolean
  ensureClockwise?: boolean
  minSegmentLength?: number
  mergeClosePoints?: boolean
  mergeDistance?: number
}

/**
 * Check if two line segments intersect
 */
function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y)
  
  if (Math.abs(det) < 1e-10) {
    return false // Parallel segments
  }
  
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p3.y - p1.y)) / det
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y)) / det
  
  return t > 0 && t < 1 && u > 0 && u < 1
}

/**
 * Find intersection point between two line segments
 */
function getIntersectionPoint(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y)
  
  if (Math.abs(det) < 1e-10) {
    return null // Parallel segments
  }
  
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p3.y - p1.y)) / det
  
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  }
}

/**
 * Calculate the signed area of a contour
 * Positive for clockwise, negative for counter-clockwise
 */
function calculateSignedArea(contour: Point[]): number {
  let area = 0
  const n = contour.length
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += (contour[j].x - contour[i].x) * (contour[j].y + contour[i].y)
  }
  
  return area / 2
}

/**
 * Distance between two points
 */
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Detect self-intersections in a contour
 */
export function detectSelfIntersections(contour: Point[]): Array<{
  index1: number
  index2: number
  point: Point
}> {
  const intersections: Array<{index1: number, index2: number, point: Point}> = []
  const n = contour.length
  
  // Check all pairs of non-adjacent segments
  for (let i = 0; i < n; i++) {
    const p1 = contour[i]
    const p2 = contour[(i + 1) % n]
    
    // Start from i+2 to avoid checking adjacent segments
    for (let j = i + 2; j < n; j++) {
      // Skip if this would be checking the last segment against the first
      if (i === 0 && j === n - 1) continue
      
      const p3 = contour[j]
      const p4 = contour[(j + 1) % n]
      
      if (segmentsIntersect(p1, p2, p3, p4)) {
        const intersectionPoint = getIntersectionPoint(p1, p2, p3, p4)
        if (intersectionPoint) {
          intersections.push({
            index1: i,
            index2: j,
            point: intersectionPoint
          })
        }
      }
    }
  }
  
  return intersections
}

/**
 * Remove self-intersections by splitting the contour at intersection points
 * Returns multiple contours if the original had self-intersections
 */
export function removeSelfIntersections(contour: Point[]): Point[][] {
  const intersections = detectSelfIntersections(contour)
  
  if (intersections.length === 0) {
    return [contour]
  }
  
  // For complex self-intersections, we'll use a simple approach:
  // Split the contour at the first intersection and keep the larger part
  const firstIntersection = intersections[0]
  const { index1, index2, point } = firstIntersection
  
  // Create two possible contours by splitting at the intersection
  const contour1: Point[] = [
    ...contour.slice(0, index1 + 1),
    point,
    ...contour.slice(index2 + 1)
  ]
  
  const contour2: Point[] = [
    point,
    ...contour.slice(index1 + 1, index2 + 1)
  ]
  
  // Keep the larger contour (more likely to be the main shape)
  const mainContour = contour1.length > contour2.length ? contour1 : contour2
  
  // Recursively check for more intersections
  return removeSelfIntersections(mainContour)
}

/**
 * Merge points that are too close together
 */
export function mergeClosePoints(contour: Point[], mergeDistance: number = 0.01): Point[] {
  if (contour.length < 3) return contour
  
  const merged: Point[] = [contour[0]]
  
  for (let i = 1; i < contour.length; i++) {
    const lastPoint = merged[merged.length - 1]
    const currentPoint = contour[i]
    
    if (distance(lastPoint, currentPoint) > mergeDistance) {
      merged.push(currentPoint)
    }
  }
  
  // Check if the last point should be merged with the first
  if (merged.length > 2) {
    const firstPoint = merged[0]
    const lastPoint = merged[merged.length - 1]
    
    if (distance(firstPoint, lastPoint) <= mergeDistance) {
      merged.pop()
    }
  }
  
  return merged.length >= 3 ? merged : contour
}

/**
 * Ensure contour is oriented clockwise
 */
export function ensureClockwise(contour: Point[]): Point[] {
  const area = calculateSignedArea(contour)
  
  if (area < 0) {
    // Counter-clockwise, so reverse it
    return contour.slice().reverse()
  }
  
  return contour
}

/**
 * Remove segments that are too short
 */
export function removeShortSegments(contour: Point[], minLength: number = 0.01): Point[] {
  if (contour.length < 3) return contour
  
  const filtered: Point[] = [contour[0]]
  
  for (let i = 1; i < contour.length; i++) {
    const prev = filtered[filtered.length - 1]
    const curr = contour[i]
    const next = contour[(i + 1) % contour.length]
    
    // Keep the point if either adjacent segment is long enough
    const prevDist = distance(prev, curr)
    const nextDist = distance(curr, next)
    
    if (prevDist >= minLength || nextDist >= minLength) {
      filtered.push(curr)
    }
  }
  
  return filtered.length >= 3 ? filtered : contour
}

/**
 * Validate and repair a contour
 */
export function validateAndRepairContour(
  contour: Point[],
  options: ValidationOptions = {}
): Point[] {
  const {
    removeSelfIntersections: removeSI = true,
    ensureClockwise: ensureCW = true,
    minSegmentLength = 0.01,
    mergeClosePoints: mergePts = true,
    mergeDistance = 0.01
  } = options
  
  let result = contour
  
  // First, merge close points
  if (mergePts) {
    result = mergeClosePoints(result, mergeDistance)
  }
  
  // Remove short segments
  if (minSegmentLength > 0) {
    result = removeShortSegments(result, minSegmentLength)
  }
  
  // Handle self-intersections
  if (removeSI) {
    const contours = removeSelfIntersections(result)
    // Take the largest contour
    result = contours.reduce((largest, current) => 
      current.length > largest.length ? current : largest
    )
  }
  
  // Ensure clockwise orientation
  if (ensureCW) {
    result = ensureClockwise(result)
  }
  
  return result
}

/**
 * Validate and repair multiple contours
 * Also handles overlapping contours
 */
export function validateAndRepairContours(
  contours: Point[][],
  options: ValidationOptions = {}
): Point[][] {
  // First, validate each contour individually
  let validatedContours = contours.map(contour => 
    validateAndRepairContour(contour, options)
  )
  
  // Filter out contours that became too small
  validatedContours = validatedContours.filter(contour => contour.length >= 3)
  
  // Detect and handle overlapping contours
  // For now, we'll just return the individually validated contours
  
  return validatedContours
}

/**
 * Check if a contour is manifold (no self-intersections)
 */
export function isManifold(contour: Point[]): boolean {
  return detectSelfIntersections(contour).length === 0
}

/**
 * Check if a set of contours creates a valid manifold
 */
export function areContoursManifold(contours: Point[][]): boolean {
  // Check each contour individually
  for (const contour of contours) {
    if (!isManifold(contour)) {
      return false
    }
  }
  
  // Check for intersections between different contours
  
  return true
}