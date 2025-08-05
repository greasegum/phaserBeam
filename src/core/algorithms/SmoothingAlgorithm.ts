/**
 * Contour Smoothing Algorithm Implementation
 * Handles various smoothing techniques for contours with edge preservation
 */

import { Point, Contour } from '../geometry'
import { SmoothingConfig } from '../configuration/SmoothingConfig'

export interface EdgeConstraint {
  x1: number
  y1: number
  x2: number
  y2: number
  strength: number // 0-1, with 1 being strongest
}

export class SmoothingAlgorithm {
  private config: SmoothingConfig
  private edgeConstraints: EdgeConstraint[] = []
  
  constructor(config: SmoothingConfig) {
    this.config = config
  }
  
  /**
   * Set edge constraints for preserving specific edges during smoothing
   */
  setEdgeConstraints(edges: EdgeConstraint[]): void {
    this.edgeConstraints = edges
  }
  
  /**
   * Process contours through the smoothing pipeline
   */
  smoothContours(contours: Contour[]): Contour[] {
    if (!this.config.enabled || contours.length === 0) {
      return contours
    }
    
    let processedContours = [...contours]
    
    // Apply the selected algorithm
    for (let i = 0; i < this.config.iterations; i++) {
      processedContours = processedContours.map(contour => this.smoothContour(contour))
    }
    
    // Apply collision avoidance if enabled
    if (this.config.collision.enabled) {
      processedContours = this.avoidCollisions(processedContours)
    }
    
    // Apply filtering
    return this.filterContours(processedContours)
  }
  
  /**
   * Apply smoothing to a single contour
   */
  private smoothContour(contour: Contour): Contour {
    if (!contour.closed || contour.points.length < 3) {
      return contour
    }
    
    // Get algorithm parameters
    const { algorithm, strength } = this.config
    
    // Points to process
    let smoothedPoints: Point[]
    
    // Apply the selected algorithm
    switch (algorithm) {
      case 'laplacian':
        smoothedPoints = this.laplacianSmoothing(contour.points, contour.closed)
        break
      case 'chaikin':
        smoothedPoints = this.chaikinSmoothing(contour.points, contour.closed)
        break
      case 'catmull-rom':
        smoothedPoints = this.catmullRomSmoothing(contour.points, contour.closed)
        break
      case 'edge-aware':
        smoothedPoints = this.edgeAwareSmoothing(contour.points, contour.closed)
        break
      case 'intelligent':
        smoothedPoints = this.intelligentSmoothing(contour.points, contour.closed)
        break
      case 'selective':
        smoothedPoints = this.selectiveSmoothing(contour.points, contour.closed)
        break
      case 'basic':
      default:
        smoothedPoints = this.basicSmoothing(contour.points, contour.closed)
    }
    
    // Create a new contour with smoothed points and updated bounds
    return {
      points: smoothedPoints,
      closed: contour.closed,
      bounds: this.calculateBounds(smoothedPoints)
    }
  }
  
  /**
   * Basic smoothing algorithm (simple averaging)
   */
  private basicSmoothing(points: Point[], closed: boolean): Point[] {
    const result: Point[] = []
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      // Get the current point
      const current = points[i]
      
      // Get the previous and next points with wrapping for closed contours
      const prev = i > 0 ? points[i - 1] : (closed ? points[n - 1] : current)
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : current)
      
      // Skip if this point is constrained by an edge
      if (this.isPointConstrained(current)) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Calculate the average position
      const avgX = (prev.x + current.x + next.x) / 3
      const avgY = (prev.y + current.y + next.y) / 3
      
      // Apply smoothing with strength parameter
      const smoothedX = current.x + (avgX - current.x) * this.config.strength
      const smoothedY = current.y + (avgY - current.y) * this.config.strength
      
      result.push({ x: smoothedX, y: smoothedY })
    }
    
    return result
  }
  
  /**
   * Laplacian smoothing algorithm
   */
  private laplacianSmoothing(points: Point[], closed: boolean): Point[] {
    const result: Point[] = []
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      const current = points[i]
      
      // Skip if this point is constrained by an edge
      if (this.isPointConstrained(current)) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Get adjacent points
      const prev = i > 0 ? points[i - 1] : (closed ? points[n - 1] : current)
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : current)
      
      // Laplacian smoothing formula
      const avgX = (prev.x + next.x) / 2
      const avgY = (prev.y + next.y) / 2
      
      // Apply smoothing with strength parameter
      const smoothedX = current.x + (avgX - current.x) * this.config.strength
      const smoothedY = current.y + (avgY - current.y) * this.config.strength
      
      result.push({ x: smoothedX, y: smoothedY })
    }
    
    return result
  }
  
  /**
   * Chaikin's smoothing algorithm (corner cutting)
   */
  private chaikinSmoothing(points: Point[], closed: boolean): Point[] {
    if (points.length < 3) {
      return [...points]
    }
    
    const result: Point[] = []
    const n = points.length
    
    // The number of points increases with Chaikin's algorithm
    for (let i = 0; i < n; i++) {
      const current = points[i]
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : current)
      
      // Skip if both points are constrained
      const currentConstrained = this.isPointConstrained(current)
      const nextConstrained = this.isPointConstrained(next)
      
      if (currentConstrained && nextConstrained) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Calculate the quarter and three-quarter points
      const q1x = current.x + (next.x - current.x) * 0.25
      const q1y = current.y + (next.y - current.y) * 0.25
      
      const q3x = current.x + (next.x - current.x) * 0.75
      const q3y = current.y + (next.y - current.y) * 0.75
      
      // Add both points to the result
      result.push({ x: q1x, y: q1y })
      result.push({ x: q3x, y: q3y })
    }
    
    // For open contours, add back the end points
    if (!closed) {
      result.unshift({ ...points[0] })
      result.push({ ...points[n - 1] })
    }
    
    return result
  }
  
  /**
   * Catmull-Rom spline smoothing
   */
  private catmullRomSmoothing(points: Point[], closed: boolean): Point[] {
    if (points.length < 4) {
      // Need at least 4 points for proper Catmull-Rom
      return this.laplacianSmoothing(points, closed)
    }
    
    // Alpha value controls the "tension" of the curve
    const alpha = 0.5
    
    const result: Point[] = []
    const n = points.length
    
    // Generate more points along the spline
    const steps = 5 // Number of intermediate points
    
    for (let i = 0; i < n; i++) {
      // Get four consecutive points for the spline segment
      const p0 = i > 0 ? points[i - 1] : (closed ? points[n - 1] : points[0])
      const p1 = points[i]
      const p2 = i < n - 1 ? points[i + 1] : (closed ? points[0] : points[n - 1])
      const p3 = i < n - 2 ? points[i + 2] : (closed ? points[i + 2 - n] : points[n - 1])
      
      // If the current point is constrained, keep it as is
      if (this.isPointConstrained(p1)) {
        result.push({ x: p1.x, y: p1.y })
        continue
      }
      
      // Add the current point
      result.push({ x: p1.x, y: p1.y })
      
      // Add intermediate points for smoother curves
      for (let t = 1; t < steps; t++) {
        const u = t / steps
        
        // Catmull-Rom spline formula
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u * u +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u * u * u
        )
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u * u +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u * u * u
        )
        
        result.push({ x, y })
      }
    }
    
    return result
  }
  
  /**
   * Edge-aware smoothing algorithm
   */
  private edgeAwareSmoothing(points: Point[], closed: boolean): Point[] {
    // Edge aware smoothing preserves sharp corners and edges
    const { edgePreservation } = this.config
    
    if (!edgePreservation.enabled) {
      // Fall back to laplacian if edge preservation is disabled
      return this.laplacianSmoothing(points, closed)
    }
    
    const result: Point[] = []
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      const current = points[i]
      
      // Skip if this point is constrained by an edge
      if (this.isPointConstrained(current)) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Get adjacent points
      const prev = i > 0 ? points[i - 1] : (closed ? points[n - 1] : current)
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : current)
      
      // Calculate curvature (angle between segments)
      const dx1 = current.x - prev.x
      const dy1 = current.y - prev.y
      const dx2 = next.x - current.x
      const dy2 = next.y - current.y
      
      // Normalize vectors
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
      
      // Avoid division by zero
      if (len1 < 0.0001 || len2 < 0.0001) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      const nx1 = dx1 / len1
      const ny1 = dy1 / len1
      const nx2 = dx2 / len2
      const ny2 = dy2 / len2
      
      // Dot product gives cosine of angle
      const dotProduct = nx1 * nx2 + ny1 * ny2
      
      // Preserve corners above threshold
      const preserveCorner = edgePreservation.preserveStraightSegments && 
                             Math.abs(dotProduct) < edgePreservation.curvatureThreshold
      
      if (preserveCorner) {
        // Keep corner point as is
        result.push({ x: current.x, y: current.y })
      } else {
        // Normal smoothing with weight based on curvature
        const weight = Math.max(0, Math.min(1, this.config.strength * (1 - Math.abs(dotProduct))))
        
        // Weighted average
        const avgX = (prev.x + current.x + next.x) / 3
        const avgY = (prev.y + current.y + next.y) / 3
        
        const smoothedX = current.x + (avgX - current.x) * weight
        const smoothedY = current.y + (avgY - current.y) * weight
        
        result.push({ x: smoothedX, y: smoothedY })
      }
    }
    
    return result
  }
  
  /**
   * Intelligent smoothing algorithm with adaptive weighting
   */
  private intelligentSmoothing(points: Point[], closed: boolean): Point[] {
    // This is a more complex algorithm that combines multiple approaches
    const { edgePreservation } = this.config
    
    // If basic edge preservation is disabled, fall back to edge-aware
    if (!edgePreservation.enabled) {
      return this.edgeAwareSmoothing(points, closed)
    }
    
    const result: Point[] = []
    const n = points.length
    
    // Calculate local curvatures for adaptive smoothing
    const curvatures = this.calculateLocalCurvatures(points, closed)
    
    for (let i = 0; i < n; i++) {
      const current = points[i]
      
      // Skip if this point is constrained by an edge
      if (this.isPointConstrained(current)) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Get adjacent points with variable window size
      const windowSize = 2 // Adjust based on local curvature if needed
      const neighbors = this.getNeighborsInWindow(points, i, windowSize, closed)
      
      // Skip if not enough neighbors
      if (neighbors.length < 2) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Local curvature affects smoothing strength
      const curvatureWeight = Math.max(0, Math.min(1, 1 - curvatures[i]))
      const effectiveStrength = this.config.strength * curvatureWeight
      
      // Calculate weighted average of neighbors
      let sumX = 0, sumY = 0, sumWeight = 0
      
      for (const neighbor of neighbors) {
        // Distance-based weight
        const dx = neighbor.x - current.x
        const dy = neighbor.y - current.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const weight = Math.exp(-distance * 2)
        
        sumX += neighbor.x * weight
        sumY += neighbor.y * weight
        sumWeight += weight
      }
      
      // Add the current point with higher weight
      const selfWeight = 2.0
      sumX += current.x * selfWeight
      sumY += current.y * selfWeight
      sumWeight += selfWeight
      
      // Calculate the weighted average
      const avgX = sumX / sumWeight
      const avgY = sumY / sumWeight
      
      // Apply smoothing with adaptive strength
      const smoothedX = current.x + (avgX - current.x) * effectiveStrength
      const smoothedY = current.y + (avgY - current.y) * effectiveStrength
      
      result.push({ x: smoothedX, y: smoothedY })
    }
    
    return result
  }
  
  /**
   * Selective smoothing algorithm that targets specific areas
   */
  private selectiveSmoothing(points: Point[], closed: boolean): Point[] {
    const { edgePreservation } = this.config
    const result: Point[] = []
    const n = points.length
    
    // Calculate local curvatures
    const curvatures = this.calculateLocalCurvatures(points, closed)
    const maxCurvature = Math.max(...curvatures)
    
    for (let i = 0; i < n; i++) {
      const current = points[i]
      
      // Skip if this point is constrained by an edge
      if (this.isPointConstrained(current)) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Normalize curvature
      const normalizedCurvature = maxCurvature > 0 ? curvatures[i] / maxCurvature : 0
      
      // Determine if this is a high-curvature area
      const isHighCurvature = normalizedCurvature > edgePreservation.curvatureThreshold
      
      // If preserving corners and this is a corner, keep it as is
      if (edgePreservation.preserveStraightSegments && isHighCurvature) {
        result.push({ x: current.x, y: current.y })
        continue
      }
      
      // Get adjacent points
      const prev = i > 0 ? points[i - 1] : (closed ? points[n - 1] : current)
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : current)
      
      // Adaptive smoothing strength based on curvature
      const adaptiveStrength = this.config.strength * (1 - normalizedCurvature)
      
      // Weighted average
      const avgX = (prev.x + current.x + next.x) / 3
      const avgY = (prev.y + current.y + next.y) / 3
      
      const smoothedX = current.x + (avgX - current.x) * adaptiveStrength
      const smoothedY = current.y + (avgY - current.y) * adaptiveStrength
      
      result.push({ x: smoothedX, y: smoothedY })
    }
    
    return result
  }
  
  /**
   * Calculate local curvatures for all points
   */
  private calculateLocalCurvatures(points: Point[], closed: boolean): number[] {
    const n = points.length
    const curvatures: number[] = new Array(n).fill(0)
    
    for (let i = 0; i < n; i++) {
      const prev = i > 0 ? points[i - 1] : (closed ? points[n - 1] : points[0])
      const curr = points[i]
      const next = i < n - 1 ? points[i + 1] : (closed ? points[0] : points[n - 1])
      
      // Calculate vectors
      const v1x = curr.x - prev.x
      const v1y = curr.y - prev.y
      const v2x = next.x - curr.x
      const v2y = next.y - curr.y
      
      // Normalize vectors
      const len1 = Math.sqrt(v1x * v1x + v1y * v1y)
      const len2 = Math.sqrt(v2x * v2x + v2y * v2y)
      
      if (len1 < 0.0001 || len2 < 0.0001) {
        curvatures[i] = 0
        continue
      }
      
      const n1x = v1x / len1
      const n1y = v1y / len1
      const n2x = v2x / len2
      const n2y = v2y / len2
      
      // Dot product gives cosine of angle
      const dotProduct = n1x * n2x + n1y * n2y
      
      // Angle-based curvature
      curvatures[i] = 1 - Math.abs(dotProduct)
    }
    
    return curvatures
  }
  
  /**
   * Get neighbors of a point within a window
   */
  private getNeighborsInWindow(points: Point[], index: number, windowSize: number, closed: boolean): Point[] {
    const n = points.length
    const neighbors: Point[] = []
    
    for (let i = index - windowSize; i <= index + windowSize; i++) {
      if (i === index) continue // Skip the center point
      
      let actualIndex: number
      
      if (closed) {
        // Wrap around for closed contours
        actualIndex = ((i % n) + n) % n
      } else {
        // Clamp to edges for open contours
        actualIndex = Math.max(0, Math.min(n - 1, i))
      }
      
      if (actualIndex !== index) {
        neighbors.push(points[actualIndex])
      }
    }
    
    return neighbors
  }
  
  /**
   * Check if a point is constrained by edge boundaries
   */
  private isPointConstrained(point: Point): boolean {
    if (this.edgeConstraints.length === 0 || !this.config.edgePreservation.enabled) {
      return false
    }
    
    const bufferDistance = this.config.edgePreservation.bufferDistance
    
    // Check against all edge constraints
    for (const edge of this.edgeConstraints) {
      // Calculate distance from point to line segment
      const distToEdge = this.distanceToLineSegment(
        point,
        { x: edge.x1, y: edge.y1 },
        { x: edge.x2, y: edge.y2 }
      )
      
      // If point is within buffer distance of an edge, consider it constrained
      if (distToEdge < bufferDistance * edge.strength) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Calculate distance from point to line segment
   */
  private distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    
    // If the line is just a point, return distance to that point
    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        (point.x - lineStart.x) * (point.x - lineStart.x) + 
        (point.y - lineStart.y) * (point.y - lineStart.y)
      )
    }
    
    // Calculate projection parameter
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
    
    if (t < 0) {
      // Beyond lineStart end of line segment
      return Math.sqrt(
        (point.x - lineStart.x) * (point.x - lineStart.x) + 
        (point.y - lineStart.y) * (point.y - lineStart.y)
      )
    }
    
    if (t > 1) {
      // Beyond lineEnd end of line segment
      return Math.sqrt(
        (point.x - lineEnd.x) * (point.x - lineEnd.x) + 
        (point.y - lineEnd.y) * (point.y - lineEnd.y)
      )
    }
    
    // Projection falls within line segment
    const projectionX = lineStart.x + t * dx
    const projectionY = lineStart.y + t * dy
    
    return Math.sqrt(
      (point.x - projectionX) * (point.x - projectionX) + 
      (point.y - projectionY) * (point.y - projectionY)
    )
  }
  
  /**
   * Collision avoidance between contours
   */
  private avoidCollisions(contours: Contour[]): Contour[] {
    if (contours.length < 2) {
      return contours
    }
    
    const { minDistance, method, maxIterations } = this.config.collision
    
    // Simple implementation - could be enhanced for better performance
    const processedContours = [...contours]
    
    // Perform multiple iterations
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasChanges = false
      
      // Process each contour pair
      for (let i = 0; i < processedContours.length; i++) {
        for (let j = i + 1; j < processedContours.length; j++) {
          const contourA = processedContours[i]
          const contourB = processedContours[j]
          
          // Quick check using bounding boxes first
          if (!this.boundingBoxesOverlap(contourA.bounds, contourB.bounds, minDistance)) {
            continue
          }
          
          // Check for close points and apply repulsion
          const changes = this.resolveContourCollision(
            contourA, 
            contourB, 
            minDistance, 
            method
          )
          
          hasChanges = hasChanges || changes
        }
      }
      
      // Stop if no more changes needed
      if (!hasChanges) {
        break
      }
    }
    
    return processedContours
  }
  
  /**
   * Check if two bounding boxes overlap or are close
   */
  private boundingBoxesOverlap(
    boundsA: Contour['bounds'], 
    boundsB: Contour['bounds'], 
    minDistance: number
  ): boolean {
    // Expand bounds by the minimum distance
    const expandedA = {
      minX: boundsA.minX - minDistance,
      maxX: boundsA.maxX + minDistance,
      minY: boundsA.minY - minDistance,
      maxY: boundsA.maxY + minDistance
    }
    
    // Check for overlap
    return !(
      expandedA.maxX < boundsB.minX ||
      expandedA.minX > boundsB.maxX ||
      expandedA.maxY < boundsB.minY ||
      expandedA.minY > boundsB.maxY
    )
  }
  
  /**
   * Resolve collision between two contours
   */
  private resolveContourCollision(
    contourA: Contour, 
    contourB: Contour, 
    minDistance: number,
    method: 'repulsion' | 'shrink' | 'hybrid'
  ): boolean {
    let hasChanges = false
    
    // Simple implementation - could be optimized with spatial partitioning
    for (const pointA of contourA.points) {
      for (const pointB of contourB.points) {
        const dx = pointB.x - pointA.x
        const dy = pointB.y - pointA.y
        const distanceSquared = dx * dx + dy * dy
        
        if (distanceSquared < minDistance * minDistance) {
          // Points are too close
          const distance = Math.sqrt(distanceSquared)
          const overlap = minDistance - distance
          
          if (overlap <= 0) continue
          
          // Unit vector from A to B
          const ux = dx / distance
          const uy = dy / distance
          
          switch (method) {
            case 'repulsion':
              // Move points apart
              pointA.x -= ux * overlap * 0.5
              pointA.y -= uy * overlap * 0.5
              pointB.x += ux * overlap * 0.5
              pointB.y += uy * overlap * 0.5
              break
            
            case 'shrink':
              // Shrink towards contour centers
              const centerA = this.getContourCenter(contourA)
              const centerB = this.getContourCenter(contourB)
              
              // Move points towards their respective centers
              const factorA = 0.3 * overlap / distance
              const factorB = 0.3 * overlap / distance
              
              pointA.x += (centerA.x - pointA.x) * factorA
              pointA.y += (centerA.y - pointA.y) * factorA
              pointB.x += (centerB.x - pointB.x) * factorB
              pointB.y += (centerB.y - pointB.y) * factorB
              break
              
            case 'hybrid':
              // Combine repulsion and shrinking
              pointA.x -= ux * overlap * 0.3
              pointA.y -= uy * overlap * 0.3
              pointB.x += ux * overlap * 0.3
              pointB.y += uy * overlap * 0.3
              
              const centerA2 = this.getContourCenter(contourA)
              const centerB2 = this.getContourCenter(contourB)
              
              pointA.x += (centerA2.x - pointA.x) * 0.1
              pointA.y += (centerA2.y - pointA.y) * 0.1
              pointB.x += (centerB2.x - pointB.x) * 0.1
              pointB.y += (centerB2.y - pointB.y) * 0.1
              break
          }
          
          hasChanges = true
        }
      }
    }
    
    // Update bounds if changes were made
    if (hasChanges) {
      contourA.bounds = this.calculateBounds(contourA.points)
      contourB.bounds = this.calculateBounds(contourB.points)
    }
    
    return hasChanges
  }
  
  /**
   * Calculate the center point of a contour
   */
  private getContourCenter(contour: Contour): Point {
    const { points } = contour
    
    if (points.length === 0) {
      return { x: 0, y: 0 }
    }
    
    let sumX = 0, sumY = 0
    
    for (const point of points) {
      sumX += point.x
      sumY += point.y
    }
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    }
  }
  
  /**
   * Filter contours based on area, length, etc.
   */
  private filterContours(contours: Contour[]): Contour[] {
    const { minContourArea, minContourLength, maxContours } = this.config.filtering
    
    // Filter by length first (faster than area calculation)
    let filtered = contours.filter(contour => contour.points.length >= minContourLength)
    
    // Filter by area if needed
    if (minContourArea > 0) {
      filtered = filtered.filter(contour => this.calculateContourArea(contour) >= minContourArea)
    }
    
    // Sort by area (largest first) if we need to limit the number
    if (maxContours > 0 && filtered.length > maxContours) {
      filtered.sort((a, b) => this.calculateContourArea(b) - this.calculateContourArea(a))
      filtered = filtered.slice(0, maxContours)
    }
    
    return filtered
  }
  
  /**
   * Calculate the area of a contour
   */
  private calculateContourArea(contour: Contour): number {
    const { points, closed } = contour
    
    if (!closed || points.length < 3) {
      return 0
    }
    
    // Shoelace formula for polygon area
    let area = 0
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    
    return Math.abs(area) / 2
  }
  
  /**
   * Calculate bounds for a contour
   */
  private calculateBounds(points: Point[]): Contour['bounds'] {
    if (!points.length) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    
    let minX = points[0].x
    let maxX = points[0].x
    let minY = points[0].y
    let maxY = points[0].y
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i]
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }
    
    return { minX, maxX, minY, maxY }
  }
}
