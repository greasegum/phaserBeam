/**
 * Contour Smoothing Algorithm Implementation
 * Handles various smoothing techniques for contours with edge preservation
 */

import { Point, Contour } from '../../types/geometry'
import { SmoothingConfig } from '../../configuration/SmoothingConfig'

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
   * Set edge constraints to preserve during smoothing
   */
  setEdgeConstraints(constraints: EdgeConstraint[]): void {
    this.edgeConstraints = constraints
  }
  
  /**
   * Process a set of contours with the configured smoothing algorithm
   */
  processContours(contours: Contour[]): Contour[] {
    if (!this.config.enabled) {
      return contours // No smoothing needed
    }
    
    const processed = contours.map(contour => this.processContour(contour))
    
    // Apply collision avoidance if enabled
    if (this.config.collision.enabled && processed.length > 1) {
      return this.applyCollisionAvoidance(processed)
    }
    
    // Apply filtering
    return this.filterContours(processed)
  }
  
  /**
   * Process a single contour with the configured smoothing algorithm
   */
  private processContour(contour: Contour): Contour {
    // Skip smoothing if too few points
    if (contour.points.length <= 2) {
      return contour
    }
    
    const { algorithm, iterations, strength } = this.config
    let points = [...contour.points]
    
    // Apply the selected algorithm for the specified number of iterations
    for (let i = 0; i < iterations; i++) {
      switch (algorithm) {
        case 'laplacian':
          points = this.laplacianSmoothing(points, strength, contour.closed)
          break
        case 'chaikin':
          points = this.chaikinSmoothing(points, strength, contour.closed)
          break
        case 'bilateral':
          points = this.bilateralSmoothing(points, strength, contour.closed)
          break
        case 'catmull-rom':
          points = this.catmullRomSmoothing(points, strength, contour.closed)
          break
        case 'edge-aware':
          points = this.edgeAwareSmoothing(points, contour.closed)
          break
        case 'intelligent':
          points = this.intelligentSmoothing(points, contour.closed)
          break
        case 'selective':
          points = this.selectiveSmoothing(points, contour.closed)
          break
        case 'basic':
        default:
          points = this.basicSmoothing(points, strength, contour.closed)
          break
      }
    }
    
    // Create new contour with smoothed points
    return {
      points,
      closed: contour.closed,
      bounds: this.recalculateBounds(points)
    }
  }
  
  /**
   * Basic smoothing - simple moving average
   */
  private basicSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    const result: Point[] = new Array(n)
    
    for (let i = 0; i < n; i++) {
      // For closed contours, wrap around
      // For open contours, keep endpoints fixed
      if (!closed && (i === 0 || i === n - 1)) {
        result[i] = { ...points[i] }
        continue
      }
      
      const prev = closed ? (i - 1 + n) % n : Math.max(0, i - 1)
      const next = closed ? (i + 1) % n : Math.min(n - 1, i + 1)
      
      // Simple average between current point and neighbors
      result[i] = {
        x: points[i].x * (1 - strength) + (points[prev].x + points[next].x) * (strength / 2),
        y: points[i].y * (1 - strength) + (points[prev].y + points[next].y) * (strength / 2)
      }
    }
    
    return result
  }
  
  /**
   * Laplacian smoothing with variable strength
   */
  private laplacianSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    const result: Point[] = new Array(n)
    
    for (let i = 0; i < n; i++) {
      // Check if this is near an edge constraint
      const isNearEdge = this.isPointNearEdge(points[i])
      
      // For closed contours, wrap around
      // For open contours, keep endpoints fixed
      if ((!closed && (i === 0 || i === n - 1)) || 
          (this.config.edgePreservation.enabled && isNearEdge)) {
        result[i] = { ...points[i] }
        continue
      }
      
      const prev = closed ? (i - 1 + n) % n : Math.max(0, i - 1)
      const next = closed ? (i + 1) % n : Math.min(n - 1, i + 1)
      
      // Calculate Laplacian offset
      const dx = (points[prev].x + points[next].x) / 2 - points[i].x
      const dy = (points[prev].y + points[next].y) / 2 - points[i].y
      
      // Apply offset with strength parameter
      result[i] = {
        x: points[i].x + dx * strength,
        y: points[i].y + dy * strength
      }
    }
    
    return result
  }
  
  /**
   * Chaikin's corner cutting algorithm
   */
  private chaikinSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    // Adjusted strength - Chaikin's typically uses 0.25 as base
    const q = 0.25 * Math.min(1, Math.max(0, strength * 2))
    
    // Create a new set of points by subdivision
    const result: Point[] = []
    
    // For closed contours, we need to handle the wrap-around
    const count = closed ? n : n - 1
    
    for (let i = 0; i < count; i++) {
      const p0 = points[i]
      const p1 = points[(i + 1) % n]
      
      // Check if this edge should be preserved
      const preserveEdge = this.config.edgePreservation.enabled && (
        this.isEdgeAlongConstraint(p0, p1) || 
        this.shouldPreserveSegment(p0, p1)
      )
      
      if (preserveEdge) {
        // If preserving this edge, just add the first point
        // (the second point will be added on the next iteration)
        result.push({ ...p0 })
      } else {
        // Q is the point (1-q) of the way from p0 to p1
        // R is the point q of the way from p0 to p1
        const q0 = {
          x: p0.x * (1 - q) + p1.x * q,
          y: p0.y * (1 - q) + p1.y * q
        }
        
        const q1 = {
          x: p0.x * q + p1.x * (1 - q),
          y: p0.y * q + p1.y * (1 - q)
        }
        
        result.push(q0, q1)
      }
    }
    
    // For open contours, add the last point
    if (!closed) {
      result.push({ ...points[n - 1] })
    }
    
    return result
  }
  
  /**
   * Bilateral smoothing - preserves sharp features
   */
  private bilateralSmoothing(points: Point[], strength: number, closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    const result: Point[] = new Array(n)
    
    for (let i = 0; i < n; i++) {
      // For closed contours, wrap around
      // For open contours, keep endpoints fixed
      if (!closed && (i === 0 || i === n - 1)) {
        result[i] = { ...points[i] }
        continue
      }
      
      const p = points[i]
      let sumX = 0, sumY = 0, weightSum = 0
      
      // Consider a neighborhood of points
      const radius = Math.min(5, Math.floor(n / 3))
      for (let j = -radius; j <= radius; j++) {
        if (j === 0) continue // Skip self
        
        // Get index with proper wrapping
        const idx = closed 
          ? (i + j + n) % n 
          : Math.min(Math.max(i + j, 0), n - 1)
        
        const neighbor = points[idx]
        
        // Calculate spatial weight (based on arc-length distance)
        const spatialDist = Math.abs(j)
        const spatialWeight = Math.exp(-spatialDist * spatialDist / (2 * radius * radius))
        
        // Calculate feature weight (based on how similar the curvature is)
        const curvature = this.calculateCurvature(points, i, closed)
        const neighborCurvature = this.calculateCurvature(points, idx, closed)
        const curvatureDist = Math.abs(curvature - neighborCurvature)
        const featureWeight = Math.exp(-curvatureDist * curvatureDist / 0.01)
        
        // Combined weight
        const weight = spatialWeight * featureWeight
        
        sumX += neighbor.x * weight
        sumY += neighbor.y * weight
        weightSum += weight
      }
      
      // Check if this point should be preserved due to edge constraints
      if (this.config.edgePreservation.enabled && this.isPointNearEdge(p)) {
        result[i] = { ...p }
      } else {
        // Weighted average with strength parameter
        result[i] = {
          x: p.x * (1 - strength) + (sumX / weightSum) * strength,
          y: p.y * (1 - strength) + (sumY / weightSum) * strength
        }
      }
    }
    
    return result
  }
  
  /**
   * Catmull-Rom spline smoothing
   */
  private catmullRomSmoothing(points: Point[], tension: number, closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    // Alpha parameter: 0 = uniform, 0.5 = centripetal, 1 = chordal
    const alpha = 0.5
    
    // Number of points to insert between each original pair
    const segments = Math.max(2, Math.ceil(tension * 6))
    
    // Pre-compute initial control points
    let p0, p1, p2, p3
    const result: Point[] = []
    
    // For each segment of the original curve
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      p1 = points[i]
      p2 = points[(i + 1) % n]
      
      // Get surrounding points for control, with proper wrapping
      if (closed) {
        p0 = points[(i - 1 + n) % n]
        p3 = points[(i + 2) % n]
      } else {
        // For open curves, mirror end points
        p0 = i === 0 ? this.reflectPoint(p2, p1) : points[i - 1]
        p3 = i >= n - 2 ? this.reflectPoint(p1, p2) : points[i + 2]
      }
      
      // Check if this edge should be preserved
      const preserveEdge = this.config.edgePreservation.enabled && (
        this.isEdgeAlongConstraint(p1, p2) || 
        this.shouldPreserveSegment(p1, p2)
      )
      
      if (preserveEdge) {
        // If preserving this edge, just add p1
        result.push({ ...p1 })
      } else {
        // Add first point of segment
        result.push({ ...p1 })
        
        // Add intermediate points
        for (let t = 1; t < segments; t++) {
          const u = t / segments
          const point = this.catmullRomPoint(p0, p1, p2, p3, u, alpha)
          result.push(point)
        }
      }
    }
    
    // For open curves, add the last point
    if (!closed) {
      result.push({ ...points[n - 1] })
    }
    
    return result
  }
  
  /**
   * Calculate a single point on a Catmull-Rom spline
   */
  private catmullRomPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number, alpha: number): Point {
    // Convert uniform parameter t to non-uniform parameter
    const t01 = Math.pow(this.distance(p0, p1), alpha)
    const t12 = Math.pow(this.distance(p1, p2), alpha)
    const t23 = Math.pow(this.distance(p2, p3), alpha)
    
    // Safety check for zero distances
    const t1 = t * t12
    
    // Calculate blending functions
    let b1, b2, b3, b4
    
    if (t01 === 0) {
      b1 = p1.x
      b3 = p1.y
    } else {
      b1 = p1.x + (p2.x - p0.x) * (t1 / (2 * t01 + t12))
      b3 = p1.y + (p2.y - p0.y) * (t1 / (2 * t01 + t12))
    }
    
    if (t23 === 0) {
      b2 = p2.x
      b4 = p2.y
    } else {
      b2 = p2.x - (p3.x - p1.x) * ((t12 - t1) / (2 * t23 + t12))
      b4 = p2.y - (p3.y - p1.y) * ((t12 - t1) / (2 * t23 + t12))
    }
    
    // Interpolate between control points
    const s = t * t12 / t12
    return {
      x: this.hermite(p1.x, b1, b2, p2.x, s),
      y: this.hermite(p1.y, b3, b4, p2.y, s)
    }
  }
  
  /**
   * Cubic Hermite interpolation helper
   */
  private hermite(p0: number, m0: number, m1: number, p1: number, t: number): number {
    const t2 = t * t
    const t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 +
           (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1
  }
  
  /**
   * Edge-aware smoothing that preserves edges and features
   */
  private edgeAwareSmoothing(points: Point[], closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    const { strength } = this.config
    const { preserveStraightSegments, curvatureThreshold } = this.config.edgePreservation
    const result: Point[] = new Array(n)
    
    for (let i = 0; i < n; i++) {
      const p = points[i]
      
      // For open contours, keep endpoints fixed
      if (!closed && (i === 0 || i === n - 1)) {
        result[i] = { ...p }
        continue
      }
      
      // Check if this point should be preserved
      const curvature = this.calculateCurvature(points, i, closed)
      const isCorner = Math.abs(curvature) > curvatureThreshold
      const isNearEdge = this.config.edgePreservation.enabled && this.isPointNearEdge(p)
      
      if (isCorner || isNearEdge) {
        result[i] = { ...p }
        continue
      }
      
      // Otherwise apply smoothing with strength adjustment
      const prev = closed ? (i - 1 + n) % n : Math.max(0, i - 1)
      const next = closed ? (i + 1) % n : Math.min(n - 1, i + 1)
      
      // Apply adaptive strength based on local curvature
      const adaptiveStrength = strength * (1 - Math.min(1, Math.abs(curvature) / curvatureThreshold))
      
      // Calculate smoothed position
      result[i] = {
        x: p.x * (1 - adaptiveStrength) + ((points[prev].x + points[next].x) / 2) * adaptiveStrength,
        y: p.y * (1 - adaptiveStrength) + ((points[prev].y + points[next].y) / 2) * adaptiveStrength
      }
    }
    
    return result
  }
  
  /**
   * Intelligent smoothing that automatically adapts to contour features
   */
  private intelligentSmoothing(points: Point[], closed: boolean): Point[] {
    // This is an advanced method that combines multiple techniques
    const n = points.length
    if (n < 3) return points
    
    // First pass - analyze the contour to identify features
    const curvatures = new Array(n)
    let maxCurvature = 0
    
    for (let i = 0; i < n; i++) {
      curvatures[i] = this.calculateCurvature(points, i, closed)
      maxCurvature = Math.max(maxCurvature, Math.abs(curvatures[i]))
    }
    
    // Normalize curvatures to 0-1 range
    const normalizedCurvatures = curvatures.map(c => maxCurvature > 0 ? Math.abs(c) / maxCurvature : 0)
    
    // Second pass - apply adaptive smoothing based on local features
    const result: Point[] = new Array(n)
    
    for (let i = 0; i < n; i++) {
      const p = points[i]
      
      // For open contours, keep endpoints fixed
      if (!closed && (i === 0 || i === n - 1)) {
        result[i] = { ...p }
        continue
      }
      
      // Check if near edge constraint
      const isNearEdge = this.config.edgePreservation.enabled && this.isPointNearEdge(p)
      
      if (isNearEdge) {
        result[i] = { ...p }
        continue
      }
      
      // Calculate feature intensity (0-1) where 1 means strong feature
      const featureIntensity = normalizedCurvatures[i]
      
      // Adjust smoothing algorithm and strength based on feature intensity
      if (featureIntensity > 0.7) {
        // Strong feature - minimal smoothing
        result[i] = { ...p }
      } 
      else if (featureIntensity > 0.4) {
        // Moderate feature - bilateral smoothing
        result[i] = this.bilateralSmoothPoint(points, i, closed, this.config.strength * 0.5)
      } 
      else {
        // Weak feature - stronger Laplacian smoothing
        result[i] = this.laplacianSmoothPoint(points, i, closed, this.config.strength)
      }
    }
    
    return result
  }
  
  /**
   * Selective smoothing that only smooths certain regions
   */
  private selectiveSmoothing(points: Point[], closed: boolean): Point[] {
    const n = points.length
    if (n < 3) return points
    
    const { 
      preserveStraightSegments, 
      bufferDistance, 
      curvatureThreshold 
    } = this.config.edgePreservation
    
    const result: Point[] = new Array(n)
    
    // First pass - detect straight segments and corners
    const isStraight = new Array(n)
    const isCorner = new Array(n)
    
    for (let i = 0; i < n; i++) {
      const curvature = this.calculateCurvature(points, i, closed)
      isCorner[i] = Math.abs(curvature) > curvatureThreshold
      
      // Check if this is part of a straight segment
      if (preserveStraightSegments) {
        const prev = closed ? (i - 1 + n) % n : Math.max(0, i - 1)
        const next = closed ? (i + 1) % n : Math.min(n - 1, i + 1)
        
        const prevVec = {
          x: points[i].x - points[prev].x,
          y: points[i].y - points[prev].y
        }
        
        const nextVec = {
          x: points[next].x - points[i].x,
          y: points[next].y - points[i].y
        }
        
        // Normalize vectors
        const prevLen = Math.sqrt(prevVec.x * prevVec.x + prevVec.y * prevVec.y)
        const nextLen = Math.sqrt(nextVec.x * nextVec.x + nextVec.y * nextVec.y)
        
        if (prevLen > 0 && nextLen > 0) {
          prevVec.x /= prevLen
          prevVec.y /= prevLen
          nextVec.x /= nextLen
          nextVec.y /= nextLen
          
          // Dot product (cos of angle between vectors)
          const dotProduct = prevVec.x * nextVec.x + prevVec.y * nextVec.y
          isStraight[i] = dotProduct > 0.98 // Approximately 11 degrees or less
        } else {
          isStraight[i] = false
        }
      } else {
        isStraight[i] = false
      }
    }
    
    // Second pass - apply selective smoothing
    for (let i = 0; i < n; i++) {
      const p = points[i]
      
      // Check conditions for preservation
      const nearEdge = this.config.edgePreservation.enabled && this.isPointNearEdge(p, bufferDistance)
      
      if ((!closed && (i === 0 || i === n - 1)) || // Endpoint of open contour
          nearEdge ||                             // Near edge constraint
          isCorner[i] ||                          // Corner point
          isStraight[i]) {                        // Part of straight segment
        result[i] = { ...p }
      } else {
        // Apply smoothing
        result[i] = this.laplacianSmoothPoint(points, i, closed, this.config.strength)
      }
    }
    
    return result
  }
  
  /**
   * Helper method to apply Laplacian smoothing to a single point
   */
  private laplacianSmoothPoint(points: Point[], index: number, closed: boolean, strength: number): Point {
    const n = points.length
    const p = points[index]
    
    const prev = closed ? (index - 1 + n) % n : Math.max(0, index - 1)
    const next = closed ? (index + 1) % n : Math.min(n - 1, index + 1)
    
    // Calculate Laplacian offset
    const dx = (points[prev].x + points[next].x) / 2 - p.x
    const dy = (points[prev].y + points[next].y) / 2 - p.y
    
    // Apply offset with strength parameter
    return {
      x: p.x + dx * strength,
      y: p.y + dy * strength
    }
  }
  
  /**
   * Helper method to apply bilateral smoothing to a single point
   */
  private bilateralSmoothPoint(points: Point[], index: number, closed: boolean, strength: number): Point {
    const n = points.length
    const p = points[index]
    
    let sumX = 0, sumY = 0, weightSum = 0
    
    // Consider a neighborhood of points
    const radius = Math.min(5, Math.floor(n / 3))
    for (let j = -radius; j <= radius; j++) {
      if (j === 0) continue // Skip self
      
      // Get index with proper wrapping
      const idx = closed 
        ? (index + j + n) % n 
        : Math.min(Math.max(index + j, 0), n - 1)
      
      const neighbor = points[idx]
      
      // Calculate spatial weight
      const spatialDist = Math.abs(j)
      const spatialWeight = Math.exp(-spatialDist * spatialDist / (2 * radius * radius))
      
      // Calculate feature weight
      const curvature = this.calculateCurvature(points, index, closed)
      const neighborCurvature = this.calculateCurvature(points, idx, closed)
      const curvatureDist = Math.abs(curvature - neighborCurvature)
      const featureWeight = Math.exp(-curvatureDist * curvatureDist / 0.01)
      
      // Combined weight
      const weight = spatialWeight * featureWeight
      
      sumX += neighbor.x * weight
      sumY += neighbor.y * weight
      weightSum += weight
    }
    
    // Weighted average with strength parameter
    return {
      x: p.x * (1 - strength) + (sumX / weightSum) * strength,
      y: p.y * (1 - strength) + (sumY / weightSum) * strength
    }
  }
  
  /**
   * Apply collision avoidance between contours
   */
  private applyCollisionAvoidance(contours: Contour[]): Contour[] {
    const { minDistance, method, maxIterations } = this.config.collision
    
    // Quick check for potential collisions
    if (!this.hasContourCollisions(contours, minDistance)) {
      return contours
    }
    
    // Clone contours for modification
    let processedContours = contours.map(c => ({
      ...c,
      points: [...c.points]
    }))
    
    // Iteratively adjust contours to avoid collisions
    for (let iter = 0; iter < maxIterations; iter++) {
      let movements = 0
      
      // Check each pair of contours
      for (let i = 0; i < processedContours.length; i++) {
        for (let j = i + 1; j < processedContours.length; j++) {
          const movements = this.resolveContourCollision(
            processedContours[i], 
            processedContours[j], 
            minDistance,
            method
          )
          
          if (movements > 0) {
            // Recalculate bounds after movement
            processedContours[i].bounds = this.recalculateBounds(processedContours[i].points)
            processedContours[j].bounds = this.recalculateBounds(processedContours[j].points)
          }
        }
      }
      
      // If no movements were made, we're done
      if (movements === 0) break
    }
    
    return processedContours
  }
  
  /**
   * Check if any contours potentially collide
   */
  private hasContourCollisions(contours: Contour[], minDistance: number): boolean {
    // Quick check using bounding boxes first
    for (let i = 0; i < contours.length; i++) {
      for (let j = i + 1; j < contours.length; j++) {
        const c1 = contours[i]
        const c2 = contours[j]
        
        // Expanded bounds check
        if (c1.bounds.minX - minDistance <= c2.bounds.maxX + minDistance && 
            c1.bounds.maxX + minDistance >= c2.bounds.minX - minDistance &&
            c1.bounds.minY - minDistance <= c2.bounds.maxY + minDistance && 
            c1.bounds.maxY + minDistance >= c2.bounds.minY - minDistance) {
          
          // Potential collision, check more closely
          if (this.checkDetailedCollision(c1, c2, minDistance)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  /**
   * Check if two contours collide at the point level
   */
  private checkDetailedCollision(c1: Contour, c2: Contour, minDistance: number): boolean {
    // Check if any points are too close
    for (const p1 of c1.points) {
      for (const p2 of c2.points) {
        const dist = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y))
        if (dist < minDistance) {
          return true
        }
      }
    }
    
    return false
  }
  
  /**
   * Resolve collision between two contours
   * Returns number of points that were moved
   */
  private resolveContourCollision(
    c1: Contour, 
    c2: Contour, 
    minDistance: number,
    method: 'repulsion' | 'shrink' | 'hybrid'
  ): number {
    let movements = 0
    
    // Calculate center points
    const c1Center = {
      x: (c1.bounds.minX + c1.bounds.maxX) / 2,
      y: (c1.bounds.minY + c1.bounds.maxY) / 2
    }
    
    const c2Center = {
      x: (c2.bounds.minX + c2.bounds.maxX) / 2,
      y: (c2.bounds.minY + c2.bounds.maxY) / 2
    }
    
    // For each point in c1
    for (let i = 0; i < c1.points.length; i++) {
      const p1 = c1.points[i]
      
      // Check against each point in c2
      for (let j = 0; j < c2.points.length; j++) {
        const p2 = c2.points[j]
        
        // Calculate distance
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        // If too close
        if (distance < minDistance) {
          movements++
          
          // Amount to move
          const moveAmount = (minDistance - distance) / 2
          
          // Direction vector (normalized)
          const dirX = distance > 0 ? dx / distance : 0
          const dirY = distance > 0 ? dy / distance : 0
          
          if (method === 'repulsion' || method === 'hybrid') {
            // Move points apart
            c1.points[i] = {
              x: p1.x - dirX * moveAmount,
              y: p1.y - dirY * moveAmount
            }
            
            c2.points[j] = {
              x: p2.x + dirX * moveAmount,
              y: p2.y + dirY * moveAmount
            }
          }
          
          if (method === 'shrink' || method === 'hybrid') {
            // For shrink, move points toward their respective centers
            const p1ToCenterX = c1Center.x - p1.x
            const p1ToCenterY = c1Center.y - p1.y
            const p1ToCenterDist = Math.sqrt(p1ToCenterX * p1ToCenterX + p1ToCenterY * p1ToCenterY)
            
            const p2ToCenterX = c2Center.x - p2.x
            const p2ToCenterY = c2Center.y - p2.y
            const p2ToCenterDist = Math.sqrt(p2ToCenterX * p2ToCenterX + p2ToCenterY * p2ToCenterY)
            
            // Shrink factor depends on method
            const shrinkFactor = method === 'hybrid' ? moveAmount * 0.5 : moveAmount
            
            if (p1ToCenterDist > 0) {
              c1.points[i] = {
                x: p1.x + (p1ToCenterX / p1ToCenterDist) * shrinkFactor,
                y: p1.y + (p1ToCenterY / p1ToCenterDist) * shrinkFactor
              }
            }
            
            if (p2ToCenterDist > 0) {
              c2.points[j] = {
                x: p2.x + (p2ToCenterX / p2ToCenterDist) * shrinkFactor,
                y: p2.y + (p2ToCenterY / p2ToCenterDist) * shrinkFactor
              }
            }
          }
        }
      }
    }
    
    return movements
  }
  
  /**
   * Filter contours based on configured criteria
   */
  private filterContours(contours: Contour[]): Contour[] {
    const { minContourArea, minContourLength, maxContours } = this.config.filtering
    
    // Filter by length first (cheaper)
    let filtered = contours.filter(c => c.points.length >= minContourLength)
    
    // Filter by area if needed
    if (minContourArea > 0) {
      filtered = filtered.filter(c => this.calculateContourArea(c) >= minContourArea)
    }
    
    // Limit number of contours if needed
    if (filtered.length > maxContours) {
      // Sort by area, descending
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
    if (points.length < 3) return 0
    
    // For open contours, calculate area as if it was closed
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
   * Check if a point is near any edge constraint
   */
  private isPointNearEdge(point: Point, bufferDistance?: number): boolean {
    const buffer = bufferDistance || this.config.edgePreservation.bufferDistance
    
    for (const edge of this.edgeConstraints) {
      // Calculate distance from point to line segment
      const dist = this.distanceToLineSegment(
        point,
        { x: edge.x1, y: edge.y1 },
        { x: edge.x2, y: edge.y2 }
      )
      
      if (dist < buffer) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Check if an edge (line segment) is along a constraint edge
   */
  private isEdgeAlongConstraint(p1: Point, p2: Point): boolean {
    // Calculate midpoint of the edge
    const mid = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    }
    
    // Check if midpoint is near any constraint
    if (this.isPointNearEdge(mid)) {
      return true
    }
    
    // Check if both endpoints are near constraints
    return this.isPointNearEdge(p1) && this.isPointNearEdge(p2)
  }
  
  /**
   * Check if a segment should be preserved based on its properties
   */
  private shouldPreserveSegment(p1: Point, p2: Point): boolean {
    // If we're not preserving straight segments, return false
    if (!this.config.edgePreservation.preserveStraightSegments) {
      return false
    }
    
    // Calculate segment length
    const length = this.distance(p1, p2)
    
    // Short segments should never be preserved
    if (length < 1.0) {
      return false
    }
    
    // Long straight segments might be important features
    if (length > this.config.edgePreservation.bufferDistance * 2) {
      return true
    }
    
    return false
  }
  
  /**
   * Distance from point to line segment
   */
  private distanceToLineSegment(p: Point, l1: Point, l2: Point): number {
    // Vector from l1 to l2
    const vx = l2.x - l1.x
    const vy = l2.y - l1.y
    
    // Vector from l1 to p
    const wx = p.x - l1.x
    const wy = p.y - l1.y
    
    // Dot product
    const dot = wx * vx + wy * vy
    
    // Squared length of the segment
    const segLengthSq = vx * vx + vy * vy
    
    // If segment is effectively a point, return distance to l1
    if (segLengthSq < 0.00001) {
      return this.distance(p, l1)
    }
    
    // Get projection factor
    const t = Math.max(0, Math.min(1, dot / segLengthSq))
    
    // Project onto segment
    const projectionX = l1.x + t * vx
    const projectionY = l1.y + t * vy
    
    // Distance to projection
    return Math.sqrt((p.x - projectionX) * (p.x - projectionX) + 
                     (p.y - projectionY) * (p.y - projectionY))
  }
  
  /**
   * Calculate curvature at a point
   */
  private calculateCurvature(points: Point[], index: number, closed: boolean): number {
    const n = points.length
    
    // Get previous and next points with proper wrapping
    const prev = closed ? (index - 1 + n) % n : Math.max(0, index - 1)
    const curr = index
    const next = closed ? (index + 1) % n : Math.min(n - 1, index + 1)
    
    // Get the points
    const p0 = points[prev]
    const p1 = points[curr]
    const p2 = points[next]
    
    // If any points are the same, return 0
    if ((p0.x === p1.x && p0.y === p1.y) || (p1.x === p2.x && p1.y === p2.y)) {
      return 0
    }
    
    // Calculate vectors
    const v1 = { x: p0.x - p1.x, y: p0.y - p1.y }
    const v2 = { x: p2.x - p1.x, y: p2.y - p1.y }
    
    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    
    v1.x /= len1
    v1.y /= len1
    v2.x /= len2
    v2.y /= len2
    
    // Cross product (z component)
    const cross = v1.x * v2.y - v1.y * v2.x
    
    // Dot product
    const dot = v1.x * v2.x + v1.y * v2.y
    
    // Angle
    const angle = Math.atan2(cross, dot)
    
    return angle
  }
  
  /**
   * Calculate distance between two points
   */
  private distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  /**
   * Reflect a point across another point
   */
  private reflectPoint(center: Point, point: Point): Point {
    return {
      x: 2 * center.x - point.x,
      y: 2 * center.y - point.y
    }
  }
  
  /**
   * Recalculate bounds for a contour
   */
  private recalculateBounds(points: Point[]): Contour['bounds'] {
    if (!points.length) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    
    let minX = points[0].x
    let maxX = points[0].x
    let minY = points[0].y
    let maxY = points[0].y
    
    for (let i = 1; i < points.length; i++) {
      const p = points[i]
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    
    return { minX, maxX, minY, maxY }
  }
}
