/**
 * Core geometry types for the marching squares engine
 */

export interface Point {
  x: number
  y: number
}

export interface Contour {
  points: Point[]
  closed: boolean
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export interface GridData {
  data: Float32Array
  width: number
  height: number
  offsetX?: number
  offsetY?: number
}

export interface ProcessingResult {
  contours: Contour[]
  metadata: {
    originalGrid: GridData
    config: any
    performance: PerformanceMetrics
  }
}

export interface PerformanceMetrics {
  total: number
  extraction: number
  transformation: number
  processing: number
  [key: string]: number
}