import { contours } from 'd3-contour';
import * as turf from '@turf/turf';
import { 
  Feature, 
  Polygon, 
  MultiPolygon, 
  Position,
  LineString,
  FeatureCollection 
} from 'geojson';

export interface Point {
  x: number
  y: number
}

export interface D3ContourOptions {
  threshold?: number
  smoothing?: boolean
  simplifyTolerance?: number
  bufferDistance?: number
  ensureClockwise?: boolean
  removeOverlaps?: boolean
}

/**
 * Convert grid to flat array format expected by d3-contour
 */
function gridToValues(grid: number[][]): number[] {
  const height = grid.length;
  const width = grid[0].length;
  const values = new Float32Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      values[y * width + x] = grid[y][x];
    }
  }
  
  return Array.from(values);
}

/**
 * Convert d3 contour coordinates to our Point format
 */
function contourToPoints(coordinates: Position[][]): Point[][] {
  return coordinates.map(ring => 
    ring.map(coord => ({
      x: coord[0],
      y: coord[1]
    }))
  );
}

/**
 * Convert points to GeoJSON polygon for turf operations
 */
function pointsToPolygon(points: Point[]): Feature<Polygon> {
  const coordinates = points.map(p => [p.x, p.y]);
  // Ensure closed ring
  if (coordinates.length > 0 && 
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
       coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
    coordinates.push(coordinates[0]);
  }
  return turf.polygon([coordinates]);
}

/**
 * Convert GeoJSON polygon back to points
 */
function polygonToPoints(polygon: Feature<Polygon>): Point[] {
  const ring = polygon.geometry.coordinates[0];
  // Remove closing point if present
  const points = ring.slice(0, -1);
  return points.map(coord => ({
    x: coord[0],
    y: coord[1]
  }));
}

/**
 * Generate contours using d3-contour with post-processing
 */
export function generateContoursD3(
  grid: number[][],
  options: D3ContourOptions = {}
): Point[][] {
  const {
    threshold = 0.5,
    smoothing = true,
    simplifyTolerance = 0.01,
    bufferDistance = 0,
    ensureClockwise = true,
    removeOverlaps = true
  } = options;
  
  const height = grid.length;
  const width = grid[0].length;
  
  // Convert grid to d3 format
  const values = gridToValues(grid);
  
  // Generate contours
  const contourGenerator = contours()
    .size([width, height])
    .thresholds([threshold])
    .smooth(smoothing);
    
  const contourData = contourGenerator(values);
  
  if (contourData.length === 0) {
    return [];
  }
  
  // Extract all rings from the MultiPolygon
  let allContours: Point[][] = [];
  const multiPolygon = contourData[0];
  
  multiPolygon.coordinates.forEach(polygon => {
    // First ring is exterior, rest are holes
    const exterior = contourToPoints([polygon[0]])[0];
    allContours.push(exterior);
    
    // Add holes as separate contours (reversed)
    for (let i = 1; i < polygon.length; i++) {
      const hole = contourToPoints([polygon[i]])[0];
      allContours.push(hole.reverse());
    }
  });
  
  // Post-process with turf
  let processedContours: Point[][] = [];
  
  for (const contour of allContours) {
    try {
      let polygon = pointsToPolygon(contour);
      
      // Simplify if requested
      if (simplifyTolerance > 0) {
        polygon = turf.simplify(polygon, {
          tolerance: simplifyTolerance,
          highQuality: true
        });
      }
      
      // Fix self-intersections
      const unkinked = turf.unkinkPolygon(polygon);
      
      // Process each resulting polygon
      unkinked.features.forEach(feature => {
        let processed = feature as Feature<Polygon>;
        
        // Apply buffer if requested
        if (bufferDistance !== 0) {
          processed = turf.buffer(processed, bufferDistance, {
            units: 'degrees' // Adjust based on your coordinate system
          }) as Feature<Polygon>;
        }
        
        // Ensure orientation
        if (ensureClockwise) {
          processed = turf.rewind(processed, { reverse: true });
        }
        
        const points = polygonToPoints(processed);
        if (points.length >= 3) {
          processedContours.push(points);
        }
      });
    } catch (error) {
      console.warn('Error processing contour:', error);
      // Fall back to original contour
      if (contour.length >= 3) {
        processedContours.push(contour);
      }
    }
  }
  
  // Remove overlaps if requested
  if (removeOverlaps && processedContours.length > 1) {
    processedContours = removeOverlappingContours(processedContours);
  }
  
  return processedContours;
}

/**
 * Remove overlapping contours by merging them
 */
function removeOverlappingContours(contours: Point[][]): Point[][] {
  if (contours.length < 2) return contours;
  
  const polygons = contours.map(pointsToPolygon);
  const processed: Feature<Polygon>[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < polygons.length; i++) {
    if (used.has(i)) continue;
    
    let current = polygons[i];
    let merged = false;
    
    for (let j = i + 1; j < polygons.length; j++) {
      if (used.has(j)) continue;
      
      try {
        if (turf.booleanOverlap(current, polygons[j]) || 
            turf.booleanContains(current, polygons[j]) ||
            turf.booleanContains(polygons[j], current)) {
          // Merge overlapping polygons
          const union = turf.union(current, polygons[j]);
          if (union) {
            current = union as Feature<Polygon>;
            used.add(j);
            merged = true;
          }
        }
      } catch (error) {
        // Skip if operation fails
      }
    }
    
    processed.push(current);
    used.add(i);
  }
  
  return processed.map(polygonToPoints).filter(points => points.length >= 3);
}

/**
 * Apply collision avoidance between contours
 */
export function applyCollisionAvoidance(
  contours: Point[][],
  minDistance: number = 0.5
): Point[][] {
  if (contours.length < 2) return contours;
  
  const polygons = contours.map(pointsToPolygon);
  const processed: Feature<Polygon>[] = [];
  
  for (let i = 0; i < polygons.length; i++) {
    let current = polygons[i];
    
    for (let j = 0; j < polygons.length; j++) {
      if (i === j) continue;
      
      try {
        const distance = turf.distance(current, polygons[j]);
        
        if (distance < minDistance) {
          // Shrink the current polygon slightly
          const shrinkAmount = (minDistance - distance) / 2;
          current = turf.buffer(current, -shrinkAmount, {
            units: 'degrees'
          }) as Feature<Polygon>;
        }
      } catch (error) {
        // Skip if operation fails
      }
    }
    
    if (current) {
      processed.push(current);
    }
  }
  
  return processed.map(polygonToPoints).filter(points => points.length >= 3);
}