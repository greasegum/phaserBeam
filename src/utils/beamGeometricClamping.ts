/**
 * Beam Geometry-Aware Edge Clamping System
 * 
 * Provides magnetic attraction zones and structural constraints for 
 * creating "sticky" section loss contours that properly hug beam edges.
 */

import { BeamProfile } from '../types/beam'

export interface Point {
  x: number
  y: number
}

export interface Vector2D {
  x: number
  y: number
}

export interface MagneticZone {
  boundary: Point[]           // Geometric boundary defining the zone
  attractionStrength: number  // 0.0 to 1.0 - strength of magnetic pull
  attractionRadius: number    // Distance for magnetic influence
  forceFunction: 'linear' | 'exponential' | 'magnetic' | 'inverse_square'
  priority: number           // Higher priority zones override lower ones
  zoneType: 'web_edge' | 'flange_edge' | 'fillet' | 'corner' | 'transition'
}

export interface BeamGeometry {
  webRegion: {
    left: number
    right: number
    top: number
    bottom: number
  }
  flangeRegions: {
    top: { left: number, right: number, top: number, bottom: number }
    bottom: { left: number, right: number, top: number, bottom: number }
  }
  filletZones: {
    topLeft: Point[]
    topRight: Point[]
    bottomLeft: Point[]
    bottomRight: Point[]
  }
  magneticFields: MagneticZone[]
}

export interface BeamClampingOptions {
  webEdgeStickiness: number      // 0.0 to 1.0, default 0.9
  flangeEdgeStickiness: number   // 0.0 to 1.0, default 0.7
  filletSmoothing: number        // 0.0 to 1.0, default 0.8
  magneticRadius: number         // Grid units, default 1.5
  forceDecayRate: number         // How quickly force decays, default 2.0
  cornerHandling: 'sharp' | 'rounded' | 'chamfered'
  enableTransitionZones: boolean // Smooth web-to-flange transitions
}

const DEFAULT_BEAM_CLAMPING_OPTIONS: BeamClampingOptions = {
  webEdgeStickiness: 0.9,
  flangeEdgeStickiness: 0.7,
  filletSmoothing: 0.8,
  magneticRadius: 1.5,
  forceDecayRate: 2.0,
  cornerHandling: 'rounded',
  enableTransitionZones: true
}

/**
 * Create beam geometry from BeamProfile for magnetic clamping
 */
export function createBeamGeometry(
  beamProfile: BeamProfile,
  gridBounds: { minX: number, maxX: number, minY: number, maxY: number },
  options: Partial<BeamClampingOptions> = {}
): BeamGeometry {
  const config = { ...DEFAULT_BEAM_CLAMPING_OPTIONS, ...options }
  
  // Calculate web region (center of beam)
  const webCenterY = (gridBounds.minY + gridBounds.maxY) / 2
  const webHalfHeight = beamProfile.webHeight / 2
  
  const webRegion = {
    left: gridBounds.minX,
    right: gridBounds.maxX,
    top: webCenterY - webHalfHeight,
    bottom: webCenterY + webHalfHeight
  }
  
  // Calculate flange regions
  const flangeRegions = {
    top: {
      left: gridBounds.minX,
      right: gridBounds.maxX,
      top: webRegion.top - beamProfile.flangeThickness,
      bottom: webRegion.top
    },
    bottom: {
      left: gridBounds.minX,
      right: gridBounds.maxX,
      top: webRegion.bottom,
      bottom: webRegion.bottom + beamProfile.flangeThickness
    }
  }
  
  // Create fillet zones if radius is specified
  const filletRadius = beamProfile.filletRadius || 0.1
  const filletZones = createFilletZones(webRegion, flangeRegions, filletRadius)
  
  // Generate magnetic fields
  const magneticFields = createMagneticFields(
    webRegion, 
    flangeRegions, 
    filletZones, 
    config
  )
  
  return {
    webRegion,
    flangeRegions,
    filletZones,
    magneticFields
  }
}

/**
 * Create fillet zones for smooth corners
 */
function createFilletZones(
  webRegion: any,
  flangeRegions: any,
  filletRadius: number
): BeamGeometry['filletZones'] {
  const createFilletArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Point[] => {
    const points: Point[] = []
    const steps = 8 // Number of points in the arc
    
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps)
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      })
    }
    
    return points
  }
  
  return {
    topLeft: createFilletArc(
      webRegion.left + filletRadius, 
      webRegion.top - filletRadius, 
      filletRadius, 
      Math.PI, 
      3 * Math.PI / 2
    ),
    topRight: createFilletArc(
      webRegion.right - filletRadius, 
      webRegion.top - filletRadius, 
      filletRadius, 
      3 * Math.PI / 2, 
      2 * Math.PI
    ),
    bottomLeft: createFilletArc(
      webRegion.left + filletRadius, 
      webRegion.bottom + filletRadius, 
      filletRadius, 
      Math.PI / 2, 
      Math.PI
    ),
    bottomRight: createFilletArc(
      webRegion.right - filletRadius, 
      webRegion.bottom + filletRadius, 
      filletRadius, 
      0, 
      Math.PI / 2
    )
  }
}

/**
 * Create magnetic attraction zones
 */
function createMagneticFields(
  webRegion: any,
  flangeRegions: any,
  filletZones: any,
  options: BeamClampingOptions
): MagneticZone[] {
  const zones: MagneticZone[] = []
  
  // Web edge zones (highest priority for section loss)
  zones.push(
    // Left web edge
    {
      boundary: [
        { x: webRegion.left, y: webRegion.top },
        { x: webRegion.left, y: webRegion.bottom }
      ],
      attractionStrength: options.webEdgeStickiness,
      attractionRadius: options.magneticRadius,
      forceFunction: 'inverse_square',
      priority: 100,
      zoneType: 'web_edge'
    },
    // Right web edge
    {
      boundary: [
        { x: webRegion.right, y: webRegion.top },
        { x: webRegion.right, y: webRegion.bottom }
      ],
      attractionStrength: options.webEdgeStickiness,
      attractionRadius: options.magneticRadius,
      forceFunction: 'inverse_square',
      priority: 100,
      zoneType: 'web_edge'
    },
    // Top web edge
    {
      boundary: [
        { x: webRegion.left, y: webRegion.top },
        { x: webRegion.right, y: webRegion.top }
      ],
      attractionStrength: options.webEdgeStickiness,
      attractionRadius: options.magneticRadius,
      forceFunction: 'inverse_square',
      priority: 100,
      zoneType: 'web_edge'
    },
    // Bottom web edge
    {
      boundary: [
        { x: webRegion.left, y: webRegion.bottom },
        { x: webRegion.right, y: webRegion.bottom }
      ],
      attractionStrength: options.webEdgeStickiness,
      attractionRadius: options.magneticRadius,
      forceFunction: 'inverse_square',
      priority: 100,
      zoneType: 'web_edge'
    }
  )
  
  // Flange edge zones (medium priority)
  zones.push(
    // Top flange edges
    {
      boundary: [
        { x: flangeRegions.top.left, y: flangeRegions.top.top },
        { x: flangeRegions.top.right, y: flangeRegions.top.top }
      ],
      attractionStrength: options.flangeEdgeStickiness,
      attractionRadius: options.magneticRadius * 0.8,
      forceFunction: 'exponential',
      priority: 80,
      zoneType: 'flange_edge'
    },
    // Bottom flange edges
    {
      boundary: [
        { x: flangeRegions.bottom.left, y: flangeRegions.bottom.bottom },
        { x: flangeRegions.bottom.right, y: flangeRegions.bottom.bottom }
      ],
      attractionStrength: options.flangeEdgeStickiness,
      attractionRadius: options.magneticRadius * 0.8,
      forceFunction: 'exponential',
      priority: 80,
      zoneType: 'flange_edge'
    }
  )
  
  // Fillet zones (lower priority, smooth transitions)
  if (options.enableTransitionZones) {
    const filletStrength = options.filletSmoothing
    const filletRadius = options.magneticRadius * 0.6
    
    zones.push(
      {
        boundary: filletZones.topLeft,
        attractionStrength: filletStrength,
        attractionRadius: filletRadius,
        forceFunction: 'magnetic',
        priority: 60,
        zoneType: 'fillet'
      },
      {
        boundary: filletZones.topRight,
        attractionStrength: filletStrength,
        attractionRadius: filletRadius,
        forceFunction: 'magnetic',
        priority: 60,
        zoneType: 'fillet'
      },
      {
        boundary: filletZones.bottomLeft,
        attractionStrength: filletStrength,
        attractionRadius: filletRadius,
        forceFunction: 'magnetic',
        priority: 60,
        zoneType: 'fillet'
      },
      {
        boundary: filletZones.bottomRight,
        attractionStrength: filletStrength,
        attractionRadius: filletRadius,
        forceFunction: 'magnetic',
        priority: 60,
        zoneType: 'fillet'
      }
    )
  }
  
  return zones
}

/**
 * Apply magnetic beam clamping to a point
 */
export function applyBeamMagneticClamping(
  point: Point,
  beamGeometry: BeamGeometry,
  options: Partial<BeamClampingOptions> = {}
): Point {
  const config = { ...DEFAULT_BEAM_CLAMPING_OPTIONS, ...options }
  
  // Calculate total magnetic force
  const totalForce = calculateMagneticForce(point, beamGeometry.magneticFields, config)
  
  // Apply force to point with damping to prevent oscillation
  const dampingFactor = 0.8
  const newPoint = {
    x: point.x + totalForce.x * dampingFactor,
    y: point.y + totalForce.y * dampingFactor
  }
  
  return newPoint
}

/**
 * Calculate magnetic force from all zones
 */
function calculateMagneticForce(
  point: Point,
  zones: MagneticZone[],
  options: BeamClampingOptions
): Vector2D {
  let totalForce = { x: 0, y: 0 }
  let maxPriority = -1
  let dominantForce = { x: 0, y: 0 }
  
  for (const zone of zones) {
    const { distance, closestPoint } = distanceToGeometry(point, zone.boundary)
    
    if (distance > zone.attractionRadius) continue
    
    const forceVector = calculateZoneForce(point, closestPoint, zone, distance, options)
    
    if (zone.priority > maxPriority) {
      // High priority zones dominate
      maxPriority = zone.priority
      dominantForce = forceVector
      totalForce = { x: forceVector.x, y: forceVector.y }
    } else if (zone.priority === maxPriority) {
      // Same priority zones blend
      totalForce.x += forceVector.x * 0.5
      totalForce.y += forceVector.y * 0.5
    } else {
      // Lower priority zones contribute minimally
      totalForce.x += forceVector.x * 0.2
      totalForce.y += forceVector.y * 0.2
    }
  }
  
  // Normalize force to prevent excessive movement
  const forceMagnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y)
  const maxForce = 0.5 // Maximum force per step
  
  if (forceMagnitude > maxForce) {
    const scale = maxForce / forceMagnitude
    totalForce.x *= scale
    totalForce.y *= scale
  }
  
  return totalForce
}

/**
 * Calculate force for a specific zone
 */
function calculateZoneForce(
  point: Point,
  attractionPoint: Point,
  zone: MagneticZone,
  distance: number,
  options: BeamClampingOptions
): Vector2D {
  // Direction vector toward attraction point
  const directionX = attractionPoint.x - point.x
  const directionY = attractionPoint.y - point.y
  const directionMagnitude = Math.sqrt(directionX * directionX + directionY * directionY)
  
  if (directionMagnitude === 0) return { x: 0, y: 0 }
  
  const normalizedDirX = directionX / directionMagnitude
  const normalizedDirY = directionY / directionMagnitude
  
  // Calculate force magnitude based on function type
  let forceMagnitude = 0
  const normalizedDistance = distance / zone.attractionRadius
  
  switch (zone.forceFunction) {
    case 'linear':
      forceMagnitude = zone.attractionStrength * (1.0 - normalizedDistance)
      break
      
    case 'exponential':
      forceMagnitude = zone.attractionStrength * Math.exp(-normalizedDistance * options.forceDecayRate)
      break
      
    case 'magnetic':
      // Magnetic force follows inverse square law but with a minimum
      const minForce = 0.1
      forceMagnitude = zone.attractionStrength * Math.max(minForce, 1.0 / (1.0 + normalizedDistance * normalizedDistance))
      break
      
    case 'inverse_square':
      // Pure inverse square for very strong short-range attraction
      forceMagnitude = zone.attractionStrength / (1.0 + normalizedDistance * normalizedDistance * options.forceDecayRate)
      break
  }
  
  return {
    x: normalizedDirX * forceMagnitude,
    y: normalizedDirY * forceMagnitude
  }
}

/**
 * Calculate distance from point to geometric boundary
 */
function distanceToGeometry(point: Point, boundary: Point[]): { distance: number, closestPoint: Point } {
  if (boundary.length === 0) {
    return { distance: Infinity, closestPoint: point }
  }
  
  if (boundary.length === 1) {
    const dx = point.x - boundary[0].x
    const dy = point.y - boundary[0].y
    return { 
      distance: Math.sqrt(dx * dx + dy * dy), 
      closestPoint: boundary[0] 
    }
  }
  
  let minDistance = Infinity
  let closestPoint = boundary[0]
  
  // For line segments, find closest point on each segment
  for (let i = 0; i < boundary.length - 1; i++) {
    const segmentResult = pointToLineSegmentDistance(point, boundary[i], boundary[i + 1])
    
    if (segmentResult.distance < minDistance) {
      minDistance = segmentResult.distance
      closestPoint = segmentResult.closestPoint
    }
  }
  
  // For closed boundaries (like fillets), also check last-to-first segment
  if (boundary.length > 2) {
    const segmentResult = pointToLineSegmentDistance(point, boundary[boundary.length - 1], boundary[0])
    
    if (segmentResult.distance < minDistance) {
      minDistance = segmentResult.distance
      closestPoint = segmentResult.closestPoint
    }
  }
  
  return { distance: minDistance, closestPoint }
}

/**
 * Calculate distance from point to line segment
 */
function pointToLineSegmentDistance(
  point: Point, 
  segmentStart: Point, 
  segmentEnd: Point
): { distance: number, closestPoint: Point } {
  const dx = segmentEnd.x - segmentStart.x
  const dy = segmentEnd.y - segmentStart.y
  const lengthSquared = dx * dx + dy * dy
  
  if (lengthSquared === 0) {
    // Degenerate segment (point)
    const distance = Math.sqrt(
      (point.x - segmentStart.x) ** 2 + (point.y - segmentStart.y) ** 2
    )
    return { distance, closestPoint: segmentStart }
  }
  
  // Parameter t for closest point on line
  const t = Math.max(0, Math.min(1, 
    ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) / lengthSquared
  ))
  
  const closestPoint = {
    x: segmentStart.x + t * dx,
    y: segmentStart.y + t * dy
  }
  
  const distance = Math.sqrt(
    (point.x - closestPoint.x) ** 2 + (point.y - closestPoint.y) ** 2
  )
  
  return { distance, closestPoint }
}

/**
 * Validate that a point is within reasonable beam boundaries
 */
export function validateBeamBounds(
  point: Point,
  beamGeometry: BeamGeometry,
  tolerance: number = 2.0
): boolean {
  const { webRegion, flangeRegions } = beamGeometry
  
  // Allow some tolerance beyond the beam boundaries
  const minX = Math.min(webRegion.left, flangeRegions.top.left) - tolerance
  const maxX = Math.max(webRegion.right, flangeRegions.top.right) + tolerance
  const minY = Math.min(flangeRegions.top.top, flangeRegions.bottom.top) - tolerance
  const maxY = Math.max(flangeRegions.top.bottom, flangeRegions.bottom.bottom) + tolerance
  
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
}