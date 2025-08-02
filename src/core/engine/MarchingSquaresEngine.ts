/**
 * Professional marching squares engine
 * Maintains all geometric controls with clean architecture
 */

import { MarchingSquaresConfig, AlgorithmConfig, GeometryConfig } from '../configuration/MarchingSquaresConfig'
import { Point, Contour, GridData, ProcessingResult } from '../types/geometry'
import { ContourProcessor } from './processors/ContourProcessor'
import { PerformanceMonitor } from '../utils/PerformanceMonitor'

export class MarchingSquaresEngine {
  private config: MarchingSquaresConfig
  private processor: ContourProcessor
  private monitor: PerformanceMonitor
  private interpolationCache: Map<string, number> | null = null
  
  constructor(config: MarchingSquaresConfig) {
    this.config = config
    this.processor = new ContourProcessor(config.processing)
    this.monitor = new PerformanceMonitor()
    
    if (config.performance.interpolationCache) {
      this.interpolationCache = new Map()
    }
  }
  
  /**
   * Process grid data and return contours
   */
  process(gridData: GridData): ProcessingResult {
    this.monitor.start('total')
    
    try {
      // Apply buffer if configured
      const bufferedGrid = this.applyBuffer(gridData)
      
      // Extract raw contours
      this.monitor.start('extraction')
      const rawContours = this.extractContours(bufferedGrid)
      this.monitor.end('extraction')
      
      // Apply geometric transformations
      this.monitor.start('transformation')
      const transformedContours = this.applyGeometricTransforms(rawContours, bufferedGrid)
      this.monitor.end('transformation')
      
      // Process contours (smoothing, simplification, collision avoidance)
      this.monitor.start('processing')
      const processedContours = this.processor.process(transformedContours)
      this.monitor.end('processing')
      
      this.monitor.end('total')
      
      return {
        contours: processedContours,
        metadata: {
          originalGrid: gridData,
          config: this.config,
          performance: this.monitor.getMetrics()
        }
      }
    } catch (error) {
      this.monitor.end('total')
      throw new Error(`Marching squares processing failed: ${error.message}`)
    }
  }
  
  /**
   * Apply buffer zone to grid
   */
  private applyBuffer(gridData: GridData): GridData {
    if (!this.config.geometry.buffer.enabled) {
      return gridData
    }
    
    const { size, value, fadeDistance } = this.config.geometry.buffer
    const { data, width, height } = gridData
    
    const newWidth = width + 2 * size
    const newHeight = height + 2 * size
    const buffered = new Float32Array(newWidth * newHeight)
    
    // Fill buffer with base value
    buffered.fill(value)
    
    // Copy original data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        buffered[(y + size) * newWidth + (x + size)] = data[y * width + x]
      }
    }
    
    // Apply fade if configured
    if (fadeDistance > 0) {
      this.applyBufferFade(buffered, newWidth, newHeight, size, fadeDistance, value)
    }
    
    return {
      data: buffered,
      width: newWidth,
      height: newHeight,
      offsetX: -size,
      offsetY: -size
    }
  }
  
  /**
   * Apply gradient fade to buffer edges
   */
  private applyBufferFade(
    buffer: Float32Array,
    width: number,
    height: number,
    bufferSize: number,
    fadeDistance: number,
    baseValue: number
  ): void {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distToEdge = Math.min(x, y, width - 1 - x, height - 1 - y)
        
        if (distToEdge < bufferSize) {
          const fadeRatio = Math.min(1, distToEdge / fadeDistance)
          const originalValue = buffer[y * width + x]
          buffer[y * width + x] = baseValue + (originalValue - baseValue) * fadeRatio
        }
      }
    }
  }
  
  /**
   * Extract contours using marching squares algorithm
   */
  private extractContours(gridData: GridData): Contour[] {
    const { data, width, height } = gridData
    const { threshold, interpolationMethod, saddlePointResolution } = this.config.algorithm
    const segments: Array<[Point, Point]> = []
    
    // Process each cell
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const cellSegments = this.processCell(
          x, y, data, width, height,
          threshold, interpolationMethod, saddlePointResolution
        )
        segments.push(...cellSegments)
      }
    }
    
    // Connect segments into contours
    return this.connectSegments(segments)
  }
  
  /**
   * Process a single grid cell
   */
  private processCell(
    x: number,
    y: number,
    data: Float32Array,
    width: number,
    height: number,
    threshold: number,
    interpolationMethod: AlgorithmConfig['interpolationMethod'],
    saddleResolution: AlgorithmConfig['saddlePointResolution']
  ): Array<[Point, Point]> {
    // Get corner values
    const idx = y * width + x
    const tl = data[idx]
    const tr = data[idx + 1]
    const bl = data[idx + width]
    const br = data[idx + width + 1]
    
    // Calculate configuration
    const config = 
      (tl >= threshold ? 8 : 0) |
      (tr >= threshold ? 4 : 0) |
      (br >= threshold ? 2 : 0) |
      (bl >= threshold ? 1 : 0)
    
    // Get edge points based on configuration
    return this.getEdgeSegments(
      config, x, y,
      tl, tr, bl, br,
      threshold, interpolationMethod, saddleResolution
    )
  }
  
  /**
   * Get edge segments for a given cell configuration
   */
  private getEdgeSegments(
    config: number,
    x: number,
    y: number,
    tl: number,
    tr: number,
    bl: number,
    br: number,
    threshold: number,
    interpolationMethod: AlgorithmConfig['interpolationMethod'],
    saddleResolution: AlgorithmConfig['saddlePointResolution']
  ): Array<[Point, Point]> {
    // Lookup table for edge connections
    const EDGE_TABLE = [
      [],           // 0
      [[3, 0]],     // 1
      [[0, 1]],     // 2
      [[3, 1]],     // 3
      [[1, 2]],     // 4
      [[3, 0], [1, 2]], // 5 - saddle
      [[0, 2]],     // 6
      [[3, 2]],     // 7
      [[2, 3]],     // 8
      [[2, 0]],     // 9
      [[0, 1], [2, 3]], // 10 - saddle
      [[2, 1]],     // 11
      [[1, 3]],     // 12
      [[1, 0]],     // 13
      [[0, 3]],     // 14
      []            // 15
    ]
    
    const edges = EDGE_TABLE[config]
    if (edges.length === 0) return []
    
    // Handle saddle points
    if ((config === 5 || config === 10) && edges.length === 2) {
      const shouldSwap = this.resolveSaddlePoint(
        tl, tr, bl, br, threshold, saddleResolution
      )
      
      if (shouldSwap) {
        return [
          [this.getEdgePoint(x, y, edges[0][0], tl, tr, bl, br, threshold, interpolationMethod),
           this.getEdgePoint(x, y, edges[1][1], tl, tr, bl, br, threshold, interpolationMethod)],
          [this.getEdgePoint(x, y, edges[1][0], tl, tr, bl, br, threshold, interpolationMethod),
           this.getEdgePoint(x, y, edges[0][1], tl, tr, bl, br, threshold, interpolationMethod)]
        ]
      }
    }
    
    // Normal case
    return edges.map(edge => [
      this.getEdgePoint(x, y, edge[0], tl, tr, bl, br, threshold, interpolationMethod),
      this.getEdgePoint(x, y, edge[1], tl, tr, bl, br, threshold, interpolationMethod)
    ])
  }
  
  /**
   * Resolve saddle point ambiguity
   */
  private resolveSaddlePoint(
    tl: number,
    tr: number,
    bl: number,
    br: number,
    threshold: number,
    method: AlgorithmConfig['saddlePointResolution']
  ): boolean {
    switch (method) {
      case 'center':
        return (tl + tr + bl + br) / 4 >= threshold
      
      case 'gradient': {
        const gradX = (tr - tl + br - bl) / 2
        const gradY = (bl - tl + br - tr) / 2
        const center = (tl + tr + bl + br) / 4
        return center + 0.5 * (gradX + gradY) >= threshold
      }
      
      case 'majority':
        return (tl >= threshold ? 1 : 0) + (tr >= threshold ? 1 : 0) +
               (bl >= threshold ? 1 : 0) + (br >= threshold ? 1 : 0) >= 2
      
      default:
        return false
    }
  }
  
  /**
   * Get interpolated point on cell edge
   */
  private getEdgePoint(
    cellX: number,
    cellY: number,
    edge: number,
    tl: number,
    tr: number,
    bl: number,
    br: number,
    threshold: number,
    method: AlgorithmConfig['interpolationMethod']
  ): Point {
    const cacheKey = this.interpolationCache ? 
      `${cellX},${cellY},${edge},${threshold}` : null
    
    if (cacheKey && this.interpolationCache!.has(cacheKey)) {
      const t = this.interpolationCache!.get(cacheKey)!
      return this.calculateEdgePosition(cellX, cellY, edge, t)
    }
    
    let t = 0.5 // Default to midpoint
    
    switch (edge) {
      case 0: // Top edge
        t = this.interpolate(tl, tr, threshold, method)
        break
      case 1: // Right edge
        t = this.interpolate(tr, br, threshold, method)
        break
      case 2: // Bottom edge
        t = this.interpolate(bl, br, threshold, method)
        break
      case 3: // Left edge
        t = this.interpolate(tl, bl, threshold, method)
        break
    }
    
    if (cacheKey) {
      this.interpolationCache!.set(cacheKey, t)
    }
    
    return this.calculateEdgePosition(cellX, cellY, edge, t)
  }
  
  /**
   * Interpolation methods
   */
  private interpolate(
    v1: number,
    v2: number,
    threshold: number,
    method: AlgorithmConfig['interpolationMethod']
  ): number {
    if (method === 'none') return 0.5
    
    // Avoid division by zero
    if (Math.abs(v2 - v1) < 1e-10) return 0.5
    
    if (method === 'linear') {
      return Math.max(0, Math.min(1, (threshold - v1) / (v2 - v1)))
    }
    
    if (method === 'cubic') {
      // Cubic interpolation for smoother curves
      const t = (threshold - v1) / (v2 - v1)
      const t2 = t * t
      const t3 = t2 * t
      return Math.max(0, Math.min(1, 3 * t2 - 2 * t3))
    }
    
    return 0.5
  }
  
  /**
   * Calculate actual edge position with alignment offsets
   */
  private calculateEdgePosition(
    cellX: number,
    cellY: number,
    edge: number,
    t: number
  ): Point {
    const { mode, offsetX, offsetY } = this.config.geometry.alignment
    
    let x: number, y: number
    
    // Base positions
    switch (edge) {
      case 0: // Top
        x = cellX + t
        y = cellY
        break
      case 1: // Right
        x = cellX + 1
        y = cellY + t
        break
      case 2: // Bottom
        x = cellX + t
        y = cellY + 1
        break
      case 3: // Left
        x = cellX
        y = cellY + t
        break
      default:
        x = cellX + 0.5
        y = cellY + 0.5
    }
    
    // Apply alignment mode
    if (mode === 'vertices') {
      // Snap to nearest vertex
      x = Math.round(x)
      y = Math.round(y)
    } else if (mode === 'center') {
      // Offset toward cell center
      x += (0.5 - t) * 0.5
      y += (0.5 - t) * 0.5
    }
    
    // Apply user offsets
    x += offsetX
    y += offsetY
    
    return { x, y }
  }
  
  /**
   * Connect segments into contours
   */
  private connectSegments(segments: Array<[Point, Point]>): Contour[] {
    if (segments.length === 0) return []
    
    const contours: Contour[] = []
    const used = new Set<number>()
    const pointMap = this.buildPointMap(segments)
    
    for (let i = 0; i < segments.length; i++) {
      if (used.has(i)) continue
      
      const contour = this.buildContour(i, segments, pointMap, used)
      if (contour.points.length >= 3) {
        contours.push(contour)
      }
    }
    
    return contours
  }
  
  /**
   * Build point adjacency map
   */
  private buildPointMap(segments: Array<[Point, Point]>): Map<string, number[]> {
    const map = new Map<string, number[]>()
    
    segments.forEach((segment, index) => {
      const p1Key = this.pointKey(segment[0])
      const p2Key = this.pointKey(segment[1])
      
      if (!map.has(p1Key)) map.set(p1Key, [])
      if (!map.has(p2Key)) map.set(p2Key, [])
      
      map.get(p1Key)!.push(index)
      map.get(p2Key)!.push(index)
    })
    
    return map
  }
  
  /**
   * Build a single contour from connected segments
   */
  private buildContour(
    startIndex: number,
    segments: Array<[Point, Point]>,
    pointMap: Map<string, number[]>,
    used: Set<number>
  ): Contour {
    const points: Point[] = []
    let currentSegment = segments[startIndex]
    used.add(startIndex)
    
    points.push(currentSegment[0], currentSegment[1])
    let currentPoint = currentSegment[1]
    
    // Follow the chain
    let foundNext = true
    while (foundNext) {
      foundNext = false
      const currentKey = this.pointKey(currentPoint)
      const connected = pointMap.get(currentKey) || []
      
      for (const segIndex of connected) {
        if (used.has(segIndex)) continue
        
        const seg = segments[segIndex]
        const seg0 = seg[0]
        const seg1 = seg[1]
        
        if (this.pointsEqual(seg0, currentPoint)) {
          points.push(seg1)
          currentPoint = seg1
          used.add(segIndex)
          foundNext = true
          break
        } else if (this.pointsEqual(seg1, currentPoint)) {
          points.push(seg0)
          currentPoint = seg0
          used.add(segIndex)
          foundNext = true
          break
        }
      }
    }
    
    // Check if closed
    const closed = this.pointsEqual(points[0], points[points.length - 1])
    if (closed && points.length > 1) {
      points.pop() // Remove duplicate closing point
    }
    
    return {
      points,
      closed,
      bounds: this.calculateBounds(points)
    }
  }
  
  /**
   * Apply geometric transformations
   */
  private applyGeometricTransforms(contours: Contour[], gridData: GridData): Contour[] {
    const { transform, edges } = this.config.geometry
    
    return contours.map(contour => {
      let points = contour.points
      
      // Apply global offset
      if (transform.globalOffsetX !== 0 || transform.globalOffsetY !== 0) {
        points = points.map(p => ({
          x: p.x + transform.globalOffsetX,
          y: p.y + transform.globalOffsetY
        }))
      }
      
      // Apply scale
      if (transform.scale !== 1) {
        const center = this.calculateCenter(points)
        points = points.map(p => ({
          x: center.x + (p.x - center.x) * transform.scale,
          y: center.y + (p.y - center.y) * transform.scale
        }))
      }
      
      // Apply rotation
      if (transform.rotation !== 0) {
        const center = this.calculateCenter(points)
        const rad = transform.rotation * Math.PI / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        
        points = points.map(p => {
          const dx = p.x - center.x
          const dy = p.y - center.y
          return {
            x: center.x + dx * cos - dy * sin,
            y: center.y + dx * sin + dy * cos
          }
        })
      }
      
      // Apply edge clamping
      if (edges.clampToGrid) {
        const bounds = {
          minX: gridData.offsetX || 0,
          maxX: (gridData.offsetX || 0) + gridData.width,
          minY: gridData.offsetY || 0,
          maxY: (gridData.offsetY || 0) + gridData.height
        }
        
        points = this.clampPointsToBounds(points, bounds, edges)
      }
      
      return {
        ...contour,
        points,
        bounds: this.calculateBounds(points)
      }
    })
  }
  
  /**
   * Clamp points to grid bounds with edge behavior
   */
  private clampPointsToBounds(
    points: Point[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    edgeConfig: GeometryConfig['edges']
  ): Point[] {
    return points.map(point => {
      let { x, y } = point
      
      // Apply snap distance for near-edge points
      const snapDist = edgeConfig.snapDistance
      
      if (Math.abs(x - bounds.minX) < snapDist) x = bounds.minX
      if (Math.abs(x - bounds.maxX) < snapDist) x = bounds.maxX
      if (Math.abs(y - bounds.minY) < snapDist) y = bounds.minY
      if (Math.abs(y - bounds.maxY) < snapDist) y = bounds.maxY
      
      // Hard clamp
      x = Math.max(bounds.minX, Math.min(bounds.maxX, x))
      y = Math.max(bounds.minY, Math.min(bounds.maxY, y))
      
      return { x, y }
    })
  }
  
  // Utility methods
  
  private pointKey(p: Point): string {
    return `${p.x.toFixed(6)},${p.y.toFixed(6)}`
  }
  
  private pointsEqual(p1: Point, p2: Point): boolean {
    return Math.abs(p1.x - p2.x) < 1e-10 && Math.abs(p1.y - p2.y) < 1e-10
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
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<MarchingSquaresConfig>): void {
    this.config = { ...this.config, ...config }
    this.processor.updateConfig(this.config.processing)
    
    if (this.config.performance.interpolationCache && !this.interpolationCache) {
      this.interpolationCache = new Map()
    } else if (!this.config.performance.interpolationCache && this.interpolationCache) {
      this.interpolationCache = null
    }
  }
  
  /**
   * Clear caches
   */
  clearCache(): void {
    this.interpolationCache?.clear()
  }
}