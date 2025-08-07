/**
 * Enhanced marching squares implementation with scalar field integration
 * Builds on binary marching squares but adds interpolation, smoothing, and advanced features
 */

import type { Point2D, ContourSegment } from '../algorithms/BinaryMarchingSquares'
import { extractBinaryContours, connectContourSegments } from '../algorithms/BinaryMarchingSquares'
import type { ScalarFieldMethod } from '../ScalarField'
import { binaryToScalarField } from '../ScalarField'

export type { Point2D }

export interface ContourPath {
  /** Array of points forming the contour line */
  points: Point2D[]
  /** Whether this contour is closed (forms a loop) */
  closed: boolean
  /** Contour level/threshold value */
  level: number
  /** Optional metadata */
  metadata?: {
    area?: number
    perimeter?: number
    bounds?: { minX: number; minY: number; maxX: number; maxY: number }
  }
}

export interface MarchingSquaresConfig {
  /** Threshold value for contour extraction */
  threshold: number
  /** How to handle edges of the field */
  edgePolicy: 'clamp' | 'wrap' | 'none'
  /** Whether to interpolate between grid points */
  interpolate: boolean
  /** Coordinate system for output */
  coordinateSystem: 'grid' | 'world'
  /** World transform parameters (only used if coordinateSystem === 'world') */
  worldTransform?: {
    offsetX: number
    offsetY: number
    scaleX: number
    scaleY: number
  }
  /** Scalar field processing options */
  scalarField?: {
    /** Method for converting binary to scalar field */
    method: ScalarFieldMethod
    /** Smoothing radius */
    radius: number
    /** Edge clamping strength (for edge-clamping method) */
    edgeClampStrength?: number
  }
}

/**
 * Extract contour paths from a scalar field using enhanced marching squares algorithm
 */
export function extractContours(
  field: number[][], 
  config: MarchingSquaresConfig
): ContourPath[] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  if (rows < 2 || cols < 2) {
    return []
  }
  
  // Convert to binary grid using threshold
  const binaryGrid = field.map(row => row.map(value => value >= config.threshold))
  
  // Extract segments using binary marching squares
  const segments = extractBinaryContours(binaryGrid, {
    edgePolicy: config.edgePolicy,
    interpolate: config.interpolate
  })
  
  // If interpolation is enabled and we have scalar field data, use value-based interpolation
  const interpolatedSegments = config.interpolate 
    ? interpolateSegmentsWithScalarField(segments, field, config.threshold)
    : segments
  
  // Connect segments into continuous paths
  const pointPaths = connectContourSegments(interpolatedSegments)
  
  // Convert to ContourPath objects with metadata
  let contours = pointPaths.map(points => ({
    points,
    closed: isContourClosed(points),
    level: config.threshold,
    metadata: calculateContourMetadata(points)
  }))
  
  // Apply coordinate transformation if needed
  if (config.coordinateSystem === 'world' && config.worldTransform) {
    contours = contours.map(contour => transformContourToWorld(contour, config.worldTransform!))
  }
  
  return contours
}

/**
 * Enhanced contour extraction from binary grid with automatic scalar field generation
 */
export function extractContoursFromBinary(
  binaryGrid: boolean[][],
  config: MarchingSquaresConfig
): ContourPath[] {
  // Generate scalar field if config specified
  let field: number[][]
  
  if (config.scalarField) {
    // Convert boolean to number grid
    const numericGrid = binaryGrid.map(row => row.map(val => val ? 1 : 0))
    
    // Apply scalar field processing
    field = binaryToScalarField(
      numericGrid,
      config.scalarField.method,
      config.scalarField.radius,
      config.scalarField.edgeClampStrength
    )
  } else {
    // Use binary grid directly as scalar field
    field = binaryGrid.map(row => row.map(val => val ? 1 : 0))
  }
  
  return extractContours(field, config)
}

/**
 * Interpolate contour segments using scalar field values
 */
function interpolateSegmentsWithScalarField(
  segments: ContourSegment[],
  field: number[][],
  threshold: number
): ContourSegment[] {
  const rows = field.length
  const cols = field[0]?.length || 0
  
  return segments.map(segment => {
    const start = interpolateEdgePoint(segment.start, field, threshold, rows, cols)
    const end = interpolateEdgePoint(segment.end, field, threshold, rows, cols)
    
    return { start, end }
  })
}

/**
 * Interpolate exact edge intersection point using scalar field values
 */
function interpolateEdgePoint(
  point: Point2D,
  field: number[][],
  threshold: number,
  rows: number,
  cols: number
): Point2D {
  const x = point.x
  const y = point.y
  
  // Check if point is on a grid edge and interpolate
  const isOnVerticalEdge = Math.abs(x - Math.round(x)) < 0.01
  const isOnHorizontalEdge = Math.abs(y - Math.round(y)) < 0.01
  
  if (isOnHorizontalEdge && !isOnVerticalEdge) {
    // Point is on horizontal edge - interpolate in X direction
    const row = Math.round(y)
    const col = Math.floor(x)
    
    if (row >= 0 && row < rows && col >= 0 && col < cols - 1) {
      const v1 = field[row][col]
      const v2 = field[row][col + 1]
      
      if (Math.abs(v2 - v1) > 0.001) {
        const t = (threshold - v1) / (v2 - v1)
        return { x: col + Math.max(0, Math.min(1, t)), y }
      }
    }
  } else if (isOnVerticalEdge && !isOnHorizontalEdge) {
    // Point is on vertical edge - interpolate in Y direction
    const col = Math.round(x)
    const row = Math.floor(y)
    
    if (col >= 0 && col < cols && row >= 0 && row < rows - 1) {
      const v1 = field[row][col]
      const v2 = field[row + 1][col]
      
      if (Math.abs(v2 - v1) > 0.001) {
        const t = (threshold - v1) / (v2 - v1)
        return { x, y: row + Math.max(0, Math.min(1, t)) }
      }
    }
  }
  
  // Return original point if interpolation not applicable
  return point
}

/**
 * Check if a contour path forms a closed loop
 */
function isContourClosed(points: Point2D[]): boolean {
  if (points.length < 3) return false
  
  const first = points[0]
  const last = points[points.length - 1]
  const tolerance = 0.001
  
  return Math.abs(first.x - last.x) < tolerance && Math.abs(first.y - last.y) < tolerance
}

/**
 * Calculate metadata for a contour path
 */
function calculateContourMetadata(points: Point2D[]): ContourPath['metadata'] {
  if (points.length === 0) return {}
  
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  let perimeter = 0
  
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
    
    if (i > 0) {
      const prev = points[i - 1]
      perimeter += Math.sqrt((point.x - prev.x) ** 2 + (point.y - prev.y) ** 2)
    }
  }
  
  // Rough area calculation using shoelace formula (for closed contours)
  let area = 0
  if (isContourClosed(points)) {
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]
      const next = points[i + 1]
      area += curr.x * next.y - next.x * curr.y
    }
    area = Math.abs(area) / 2
  }
  
  return {
    bounds: { minX, minY, maxX, maxY },
    perimeter,
    area: area > 0 ? area : undefined
  }
}

/**
 * Transform contour from grid coordinates to world coordinates
 */
function transformContourToWorld(
  contour: ContourPath, 
  transform: NonNullable<MarchingSquaresConfig['worldTransform']>
): ContourPath {
  const transformedPoints = contour.points.map(point => ({
    x: point.x * transform.scaleX + transform.offsetX,
    y: point.y * transform.scaleY + transform.offsetY
  }))
  
  return {
    ...contour,
    points: transformedPoints,
    metadata: contour.metadata ? {
      ...contour.metadata,
      bounds: contour.metadata.bounds ? {
        minX: contour.metadata.bounds.minX * transform.scaleX + transform.offsetX,
        minY: contour.metadata.bounds.minY * transform.scaleY + transform.offsetY,
        maxX: contour.metadata.bounds.maxX * transform.scaleX + transform.offsetX,
        maxY: contour.metadata.bounds.maxY * transform.scaleY + transform.offsetY
      } : undefined,
      perimeter: contour.metadata.perimeter ? contour.metadata.perimeter * Math.sqrt(transform.scaleX ** 2 + transform.scaleY ** 2) : undefined,
      area: contour.metadata.area ? contour.metadata.area * transform.scaleX * transform.scaleY : undefined
    } : undefined
  }
}
