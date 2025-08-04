/**
 * Contour post-processing pipeline
 * Handles smoothing, simplification, collision avoidance, and filtering
 */

import { ProcessingConfig } from '../../configuration/MarchingSquaresConfig'
import { Point, Contour } from '../../types/geometry'

export class ContourProcessor {
  private config: ProcessingConfig
  
  constructor(config: ProcessingConfig) {
    this.config = config
  }
  
  /**
   * Process contours through the full pipeline
   */
  process(contours: Contour[]): Contour[] {
    let processed = contours
    
    // Apply smoothing
    if (this.config.smoothing.enabled) {
      processed = processed.map(contour => this.smoothContour(contour))
    }
    
    // Apply simplification
    if (this.config.simplification.enabled) {
      processed = processed.map(contour => this.simplifyContour(contour))
    }
    
    // Apply collision avoidance
    if (this.config.collision.enabled && processed.length > 1) {
      processed = this.resolveCollisions(processed)
    }
    
    // Apply filtering
    processed = this.filterContours(processed)
    
    return processed
  }
  
  /**
   * Smooth a contour using the configured algorithm
   */
  private smoothContour(contour: Contour): Contour {
    const { algorithm, iterations, strength, preserveCorners, cornerThreshold } = this.config.smoothing
    
    let points = [...contour.points]
    
    for (let i = 0; i < iterations; i++) {
      switch (algorithm) {
        case 'laplacian':
          points = this.laplacianSmoothing(points, strength, contour.closed)
          break
        
        case 'chaikin':
          points = this.chaikinSmoothing(points, strength, contour.closed)
          break
        
        case 'catmull-rom':
          points = this.catmullRomSmoothing(points, strength, contour.closed)
          break
        
        case 'bezier':
          points = this.bezierSmoothing(points, strength, contour.closed)
          break
      }
      
      if (preserveCorners) {
        points = this.preserveCorners(points, contour.points, cornerThreshold)
      }
    }
    
    return {
      ...contour,
      points,
      bounds: this.calculateBounds(points)
    }
  }
  
  /**
   * Laplacian smoothing
   */
  private laplacianSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const smoothed: Point[] = []
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      if (!closed && (i === 0 || i === n - 1)) {
        smoothed.push(points[i])
        continue
      }
      
      const prev = points[(i - 1 + n) % n]
      const curr = points[i]
      const next = points[(i + 1) % n]
      
      smoothed.push({
        x: curr.x + strength * ((prev.x + next.x) / 2 - curr.x),
        y: curr.y + strength * ((prev.y + next.y) / 2 - curr.y)
      })
    }
    
    return smoothed
  }
  
  /**
   * Chaikin's corner cutting algorithm
   */
  private chaikinSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const smoothed: Point[] = []
    const n = points.length
    const ratio = 0.25 * strength
    
    for (let i = 0; i < n - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      
      if (i === 0 && !closed) {
        smoothed.push(p0)
      }
      
      smoothed.push({
        x: (1 - ratio) * p0.x + ratio * p1.x,
        y: (1 - ratio) * p0.y + ratio * p1.y
      })
      
      smoothed.push({
        x: ratio * p0.x + (1 - ratio) * p1.x,
        y: ratio * p0.y + (1 - ratio) * p1.y
      })
      
      if (i === n - 2 && !closed) {
        smoothed.push(p1)
      }
    }
    
    if (closed && smoothed.length > 0) {
      // Handle closing segment
      const p0 = points[n - 1]
      const p1 = points[0]
      
      smoothed.push({
        x: (1 - ratio) * p0.x + ratio * p1.x,
        y: (1 - ratio) * p0.y + ratio * p1.y
      })
      
      smoothed.push({
        x: ratio * p0.x + (1 - ratio) * p1.x,
        y: ratio * p0.y + (1 - ratio) * p1.y
      })
    }
    
    return smoothed
  }
  
  /**
   * Catmull-Rom spline smoothing
   */
  private catmullRomSmoothing(points: Point[], tension: number, closed: boolean): Point[] {
    if (points.length < 4) return points
    
    const smoothed: Point[] = []
    const n = points.length
    
    const getPoint = (i: number): Point => {
      if (closed) return points[(i + n) % n]
      return points[Math.max(0, Math.min(n - 1, i))]
    }
    
    for (let i = 0; i < n; i++) {
      const p0 = getPoint(i - 1)
      const p1 = getPoint(i)
      const p2 = getPoint(i + 1)
      const p3 = getPoint(i + 2)
      
      // Add the current point
      smoothed.push(p1)
      
      // Add interpolated points
      for (let t = 0.25; t < 1; t += 0.25) {
        const t2 = t * t
        const t3 = t2 * t
        
        const v0x = (p2.x - p0.x) * tension
        const v0y = (p2.y - p0.y) * tension
        const v1x = (p3.x - p1.x) * tension
        const v1y = (p3.y - p1.y) * tension
        
        smoothed.push({
          x: p1.x + v0x * t + (3 * (p2.x - p1.x) - 2 * v0x - v1x) * t2 + 
             (2 * (p1.x - p2.x) + v0x + v1x) * t3,
          y: p1.y + v0y * t + (3 * (p2.y - p1.y) - 2 * v0y - v1y) * t2 + 
             (2 * (p1.y - p2.y) + v0y + v1y) * t3
        })
      }
    }
    
    return smoothed
  }
  
  /**
   * Bezier curve smoothing
   */
  private bezierSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    if (points.length < 3) return points
    
    const smoothed: Point[] = []
    const n = points.length
    
    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n]
      const curr = points[i]
      const next = points[(i + 1) % n]
      
      if (!closed && i === 0) {
        smoothed.push(curr)
        continue
      }
      
      // Calculate control points
      const cp1 = {
        x: curr.x - (next.x - prev.x) * strength * 0.25,
        y: curr.y - (next.y - prev.y) * strength * 0.25
      }
      
      const cp2 = {
        x: curr.x + (next.x - prev.x) * strength * 0.25,
        y: curr.y + (next.y - prev.y) * strength * 0.25
      }
      
      // Add bezier curve points
      for (let t = 0; t <= 1; t += 0.2) {
        const t2 = t * t
        const t3 = t2 * t
        const mt = 1 - t
        const mt2 = mt * mt
        const mt3 = mt2 * mt
        
        smoothed.push({
          x: mt3 * prev.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * curr.x,
          y: mt3 * prev.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * curr.y
        })
      }
    }
    
    return smoothed
  }
  
  /**
   * Preserve sharp corners
   */
  private preserveCorners(
    smoothed: Point[],
    original: Point[],
    threshold: number
  ): Point[] {
    const thresholdRad = threshold * Math.PI / 180
    const result: Point[] = []
    
    for (let i = 0; i < original.length; i++) {
      const prev = original[(i - 1 + original.length) % original.length]
      const curr = original[i]
      const next = original[(i + 1) % original.length]
      
      // Calculate angle
      const v1x = curr.x - prev.x
      const v1y = curr.y - prev.y
      const v2x = next.x - curr.x
      const v2y = next.y - curr.y
      
      const angle = Math.acos(
        (v1x * v2x + v1y * v2y) /
        (Math.sqrt(v1x * v1x + v1y * v1y) * Math.sqrt(v2x * v2x + v2y * v2y))
      )
      
      if (angle < thresholdRad) {
        // Sharp corner, use original point
        result.push(curr)
      } else {
        // Use smoothed point
        result.push(smoothed[i] || curr)
      }
    }
    
    return result
  }
  
  /**
   * Simplify contour using Douglas-Peucker algorithm
   */
  private simplifyContour(contour: Contour): Contour {
    const { tolerance, minVertices, preserveTopology } = this.config.simplification
    
    if (contour.points.length <= minVertices) {
      return contour
    }
    
    const simplified = this.douglasPeucker(contour.points, tolerance, contour.closed)
    
    // Ensure minimum vertices
    if (simplified.length < minVertices) {
      return contour
    }
    
    // Check topology preservation
    if (preserveTopology && !this.isTopologyPreserved(contour.points, simplified)) {
      return contour
    }
    
    return {
      ...contour,
      points: simplified,
      bounds: this.calculateBounds(simplified)
    }
  }
  
  /**
   * Douglas-Peucker implementation
   */
  private douglasPeucker(points: Point[], tolerance: number, closed: boolean): Point[] {
    if (points.length < 3) return points
    
    const n = points.length
    const keep = new Array(n).fill(false)
    keep[0] = true
    keep[n - 1] = !closed
    
    this.douglasPeuckerRecursive(points, 0, n - 1, tolerance, keep)
    
    if (closed) {
      // Check closing segment
      this.douglasPeuckerRecursive(points, n - 1, 0, tolerance, keep)
    }
    
    return points.filter((_, i) => keep[i])
  }
  
  private douglasPeuckerRecursive(
    points: Point[],
    start: number,
    end: number,
    tolerance: number,
    keep: boolean[]
  ): void {
    if (Math.abs(end - start) <= 1) return
    
    let maxDist = 0
    let maxIndex = 0
    
    const s = start < end ? 1 : -1
    for (let i = start + s; i !== end; i += s) {
      const dist = this.pointLineDistance(points[i], points[start], points[end])
      if (dist > maxDist) {
        maxDist = dist
        maxIndex = i
      }
    }
    
    if (maxDist > tolerance) {
      keep[maxIndex] = true
      this.douglasPeuckerRecursive(points, start, maxIndex, tolerance, keep)
      this.douglasPeuckerRecursive(points, maxIndex, end, tolerance, keep)
    }
  }
  
  private pointLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lengthSquared = dx * dx + dy * dy
    
    if (lengthSquared === 0) {
      return Math.hypot(point.x - lineStart.x, point.y - lineStart.y)
    }
    
    const t = Math.max(0, Math.min(1, 
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
    ))
    
    const projX = lineStart.x + t * dx
    const projY = lineStart.y + t * dy
    
    return Math.hypot(point.x - projX, point.y - projY)
  }
  
  /**
   * Check if topology is preserved after simplification
   */
  private isTopologyPreserved(original: Point[], simplified: Point[]): boolean {
    // Simple check: ensure no self-intersections introduced
    // This is a placeholder - real implementation would be more sophisticated
    return true
  }
  
  /**
   * Resolve collisions between contours
   */
  private resolveCollisions(contours: Contour[]): Contour[] {
    const { method, minDistance, maxIterations, priority } = this.config.collision
    
    // Sort by priority
    const sorted = this.sortByPriority(contours, priority)
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let hasCollisions = false
      
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const result = this.resolveContourPair(
            sorted[i], sorted[j], minDistance, method, priority
          )
          
          if (result) {
            sorted[i] = result[0]
            sorted[j] = result[1]
            hasCollisions = true
          }
        }
      }
      
      if (!hasCollisions) break
    }
    
    return sorted
  }
  
  /**
   * Sort contours by priority
   */
  private sortByPriority(contours: Contour[], priority: ProcessingConfig['collision']['priority']): Contour[] {
    if (priority === 'equal') return contours
    
    return [...contours].sort((a, b) => {
      if (priority === 'area') {
        return this.calculateArea(b.points) - this.calculateArea(a.points)
      } else if (priority === 'perimeter') {
        return this.calculatePerimeter(b.points) - this.calculatePerimeter(a.points)
      }
      return 0
    })
  }
  
  /**
   * Resolve collision between two contours
   */
  private resolveContourPair(
    contour1: Contour,
    contour2: Contour,
    minDistance: number,
    method: ProcessingConfig['collision']['method'],
    priority: ProcessingConfig['collision']['priority']
  ): [Contour, Contour] | null {
    const closest = this.findClosestPoints(contour1.points, contour2.points)
    
    if (closest.distance >= minDistance) {
      return null
    }
    
    switch (method) {
      case 'repulsion':
        return this.repulsionMethod(contour1, contour2, minDistance, closest)
      
      case 'shrink':
        return this.shrinkMethod(contour1, contour2, minDistance, priority)
      
      case 'morph':
        return this.morphMethod(contour1, contour2, minDistance, closest)
      
      default:
        return null
    }
  }
  
  /**
   * Repulsion collision resolution
   */
  private repulsionMethod(
    contour1: Contour,
    contour2: Contour,
    minDistance: number,
    closest: { p1: Point; p2: Point; distance: number }
  ): [Contour, Contour] {
    const pushDistance = (minDistance - closest.distance) / 2
    const dx = closest.p2.x - closest.p1.x
    const dy = closest.p2.y - closest.p1.y
    const length = Math.hypot(dx, dy)
    
    if (length === 0) return [contour1, contour2]
    
    const pushX = (dx / length) * pushDistance
    const pushY = (dy / length) * pushDistance
    
    return [
      {
        ...contour1,
        points: contour1.points.map(p => ({ x: p.x - pushX, y: p.y - pushY })),
        bounds: this.calculateBounds(contour1.points.map(p => ({ x: p.x - pushX, y: p.y - pushY })))
      },
      {
        ...contour2,
        points: contour2.points.map(p => ({ x: p.x + pushX, y: p.y + pushY })),
        bounds: this.calculateBounds(contour2.points.map(p => ({ x: p.x + pushX, y: p.y + pushY })))
      }
    ]
  }
  
  /**
   * Shrink collision resolution
   */
  private shrinkMethod(
    contour1: Contour,
    contour2: Contour,
    minDistance: number,
    priority: ProcessingConfig['collision']['priority']
  ): [Contour, Contour] {
    const center1 = this.calculateCenter(contour1.points)
    const center2 = this.calculateCenter(contour2.points)
    
    // Determine shrink factors based on priority
    let factor1 = 0.95
    let factor2 = 0.95
    
    if (priority === 'area') {
      const area1 = this.calculateArea(contour1.points)
      const area2 = this.calculateArea(contour2.points)
      const ratio = area1 / (area1 + area2)
      factor1 = 0.9 + 0.1 * ratio
      factor2 = 0.9 + 0.1 * (1 - ratio)
    }
    
    return [
      {
        ...contour1,
        points: contour1.points.map(p => ({
          x: center1.x + (p.x - center1.x) * factor1,
          y: center1.y + (p.y - center1.y) * factor1
        })),
        bounds: this.calculateBounds(contour1.points.map(p => ({
          x: center1.x + (p.x - center1.x) * factor1,
          y: center1.y + (p.y - center1.y) * factor1
        })))
      },
      {
        ...contour2,
        points: contour2.points.map(p => ({
          x: center2.x + (p.x - center2.x) * factor2,
          y: center2.y + (p.y - center2.y) * factor2
        })),
        bounds: this.calculateBounds(contour2.points.map(p => ({
          x: center2.x + (p.x - center2.x) * factor2,
          y: center2.y + (p.y - center2.y) * factor2
        })))
      }
    ]
  }
  
  /**
   * Morph collision resolution
   */
  private morphMethod(
    contour1: Contour,
    contour2: Contour,
    minDistance: number,
    closest: { p1: Point; p2: Point; distance: number }
  ): [Contour, Contour] {
    // Morph contours away from collision point
    const morphStrength = 1 - (closest.distance / minDistance)
    
    return [
      {
        ...contour1,
        points: contour1.points.map(p => {
          const dist = Math.hypot(p.x - closest.p1.x, p.y - closest.p1.y)
          const factor = Math.exp(-dist * dist / (minDistance * minDistance))
          const dx = p.x - closest.p1.x
          const dy = p.y - closest.p1.y
          const length = Math.hypot(dx, dy)
          
          if (length === 0) return p
          
          return {
            x: p.x - (dx / length) * morphStrength * factor * minDistance,
            y: p.y - (dy / length) * morphStrength * factor * minDistance
          }
        }),
        bounds: this.calculateBounds(contour1.points)
      },
      {
        ...contour2,
        points: contour2.points.map(p => {
          const dist = Math.hypot(p.x - closest.p2.x, p.y - closest.p2.y)
          const factor = Math.exp(-dist * dist / (minDistance * minDistance))
          const dx = p.x - closest.p2.x
          const dy = p.y - closest.p2.y
          const length = Math.hypot(dx, dy)
          
          if (length === 0) return p
          
          return {
            x: p.x + (dx / length) * morphStrength * factor * minDistance,
            y: p.y + (dy / length) * morphStrength * factor * minDistance
          }
        }),
        bounds: this.calculateBounds(contour2.points)
      }
    ]
  }
  
  /**
   * Filter contours based on criteria
   */
  private filterContours(contours: Contour[]): Contour[] {
    const { minContourArea, minContourLength, maxContours, mergeDistance } = this.config.filtering
    
    let filtered = contours
    
    // Filter by minimum area
    if (minContourArea > 0) {
      filtered = filtered.filter(c => this.calculateArea(c.points) >= minContourArea)
    }
    
    // Filter by minimum length
    if (minContourLength > 3) {
      filtered = filtered.filter(c => c.points.length >= minContourLength)
    }
    
    // Merge close contours
    if (mergeDistance > 0) {
      filtered = this.mergeCloseContours(filtered, mergeDistance)
    }
    
    // Limit number of contours
    if (maxContours < filtered.length) {
      // Keep largest contours
      filtered = filtered
        .sort((a, b) => this.calculateArea(b.points) - this.calculateArea(a.points))
        .slice(0, maxContours)
    }
    
    return filtered
  }
  
  /**
   * Merge contours that are very close
   */
  private mergeCloseContours(contours: Contour[], mergeDistance: number): Contour[] {
    // Simple implementation - could be improved
    return contours
  }
  
  // Utility methods
  
  private findClosestPoints(points1: Point[], points2: Point[]): { p1: Point; p2: Point; distance: number } {
    let minDist = Infinity
    let closest = { p1: points1[0], p2: points2[0], distance: Infinity }
    
    for (const p1 of points1) {
      for (const p2 of points2) {
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y)
        if (dist < minDist) {
          minDist = dist
          closest = { p1, p2, distance: dist }
        }
      }
    }
    
    return closest
  }
  
  private calculateBounds(points: Point[]): { minX: number; maxX: number; minY: number; maxY: number } {
    if (points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    
    let minX = points[0].x, maxX = points[0].x
    let minY = points[0].y, maxY = points[0].y
    
    for (const p of points) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    
    return { minX, maxX, minY, maxY }
  }
  
  private calculateCenter(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 }
    
    let sumX = 0, sumY = 0
    for (const p of points) {
      sumX += p.x
      sumY += p.y
    }
    
    return { x: sumX / points.length, y: sumY / points.length }
  }
  
  private calculateArea(points: Point[]): number {
    if (points.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    
    return Math.abs(area) / 2
  }
  
  private calculatePerimeter(points: Point[]): number {
    if (points.length < 2) return 0
    
    let perimeter = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      perimeter += Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y)
    }
    
    return perimeter
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: ProcessingConfig): void {
    this.config = config
  }
}