/**
 * Marching Squares Algorithm Implementation
 * Core implementation for generating contours from scalar field
 */

import { Point, Contour } from '../geometry'
import { MarchingSquaresAlgorithmConfig } from '../configuration/MarchingSquaresAlgorithmConfig'

export class MarchingSquaresAlgorithm {
  private config: MarchingSquaresAlgorithmConfig;
  
  // Edge lookup table for case resolution
  private static readonly EDGE_TABLE: number[][] = [
    [],           // 0: 0000 (all outside)
    [3, 2],       // 1: 0001 (bottom-left inside)
    [2, 1],       // 2: 0010 (bottom-right inside)
    [3, 1],       // 3: 0011 (bottom inside)
    [1, 0],       // 4: 0100 (top-right inside)
    [3, 2, 1, 0], // 5: 0101 (diagonal - ambiguous)
    [2, 0],       // 6: 0110 (right inside)
    [3, 0],       // 7: 0111 (all except top-left)
    [0, 3],       // 8: 1000 (top-left inside)
    [0, 2],       // 9: 1001 (left inside)
    [0, 3, 2, 1], // 10: 1010 (diagonal - ambiguous)
    [0, 1],       // 11: 1011 (all except top-right)
    [1, 3],       // 12: 1100 (top inside)
    [1, 2],       // 13: 1101 (all except bottom-right)
    [2, 3],       // 14: 1110 (all except bottom-left)
    []            // 15: 1111 (all inside)
  ];
  
  constructor(config: MarchingSquaresAlgorithmConfig) {
    this.config = config;
  }
  
  /**
   * Generate contours from a scalar field grid
   * 
   * @param grid The scalar field grid (2D array of values)
   * @returns Array of contours
   */
  generateContours(grid: number[][]): Contour[] {
    if (!grid || grid.length < 2 || grid[0].length < 2) {
      return [];
    }
    
    // Process grid
    const rows = grid.length;
    const cols = grid[0].length;
    const segments = this.generateSegments(grid);
    
    // Connect segments into contours
    return this.connectSegments(segments);
  }
  
  /**
   * Generate line segments from grid by processing each cell
   */
  private generateSegments(grid: number[][]): { p1: Point, p2: Point }[] {
    const rows = grid.length;
    const cols = grid[0].length;
    const segments: { p1: Point, p2: Point }[] = [];
    
    // Edge cache for interpolation consistency
    const edgeCache = {
      horizontal: new Map<string, number>(),
      vertical: new Map<string, number>()
    };
    
    // Process each cell
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const cellSegments = this.processCell(row, col, grid, edgeCache);
        segments.push(...cellSegments);
      }
    }
    
    return segments;
  }
  
  /**
   * Process a single grid cell to generate edge segments
   */
  private processCell(
    row: number,
    col: number,
    grid: number[][],
    edgeCache: { horizontal: Map<string, number>, vertical: Map<string, number> }
  ): { p1: Point, p2: Point }[] {
    // Get corner values
    const tl = grid[row][col];
    const tr = grid[row][col + 1];
    const br = grid[row + 1][col + 1];
    const bl = grid[row + 1][col];
    
    // Determine case index (0-15) based on which corners are inside/outside
    let caseIndex = 0;
    if (tl >= this.config.threshold) caseIndex |= 8;  // 1000
    if (tr >= this.config.threshold) caseIndex |= 4;  // 0100
    if (br >= this.config.threshold) caseIndex |= 2;  // 0010
    if (bl >= this.config.threshold) caseIndex |= 1;  // 0001
    
    // Handle ambiguous cases (saddle points)
    if (caseIndex === 5 || caseIndex === 10) {
      return this.handleAmbiguousCase(caseIndex, row, col, grid, edgeCache);
    }
    
    // Get edge indices for this case
    const edgeIndices = MarchingSquaresAlgorithm.EDGE_TABLE[caseIndex];
    
    // If no edges, return empty array
    if (!edgeIndices.length) {
      return [];
    }
    
    // Process edge indices to get points
    const segments: { p1: Point, p2: Point }[] = [];
    
    for (let i = 0; i < edgeIndices.length; i += 2) {
      const edge1 = edgeIndices[i];
      const edge2 = edgeIndices[i + 1];
      
      const p1 = this.getEdgePoint(edge1, row, col, grid, edgeCache);
      const p2 = this.getEdgePoint(edge2, row, col, grid, edgeCache);
      
      segments.push({ p1, p2 });
    }
    
    return segments;
  }
  
  /**
   * Handle ambiguous cases (saddle points)
   */
  private handleAmbiguousCase(
    caseIndex: number,
    row: number,
    col: number,
    grid: number[][],
    edgeCache: { horizontal: Map<string, number>, vertical: Map<string, number> }
  ): { p1: Point, p2: Point }[] {
    const { saddlePointResolution } = this.config;
    
    // Default to center resolution method
    if (saddlePointResolution === 'center' || saddlePointResolution === 'gradient') {
      // Connect NW-SE for case 5, NE-SW for case 10
      const edges = caseIndex === 5 ? [0, 2, 1, 3] : [0, 1, 2, 3];
      
      const segments: { p1: Point, p2: Point }[] = [];
      
      for (let i = 0; i < edges.length; i += 2) {
        const edge1 = edges[i];
        const edge2 = edges[i + 1];
        
        const p1 = this.getEdgePoint(edge1, row, col, grid, edgeCache);
        const p2 = this.getEdgePoint(edge2, row, col, grid, edgeCache);
        
        segments.push({ p1, p2 });
      }
      
      return segments;
    }
    else if (saddlePointResolution === 'majority') {
      // Check the average value
      const tl = grid[row][col];
      const tr = grid[row][col + 1];
      const br = grid[row + 1][col + 1];
      const bl = grid[row + 1][col];
      
      const average = (tl + tr + br + bl) / 4;
      
      // If average > threshold, use the opposite connectivity
      const edges = (average > this.config.threshold) === (caseIndex === 10) 
        ? [0, 3, 1, 2]  // Connect diagonally
        : [0, 1, 2, 3]; // Connect adjacent
      
      const segments: { p1: Point, p2: Point }[] = [];
      
      for (let i = 0; i < edges.length; i += 2) {
        const edge1 = edges[i];
        const edge2 = edges[i + 1];
        
        const p1 = this.getEdgePoint(edge1, row, col, grid, edgeCache);
        const p2 = this.getEdgePoint(edge2, row, col, grid, edgeCache);
        
        segments.push({ p1, p2 });
      }
      
      return segments;
    }
    
    // Should never reach here
    return [];
  }
  
  /**
   * Get point on cell edge with interpolation
   */
  private getEdgePoint(
    edgeIndex: number,
    row: number,
    col: number,
    grid: number[][],
    edgeCache: { horizontal: Map<string, number>, vertical: Map<string, number> }
  ): Point {
    const { mode, offsetX, offsetY } = this.config.alignment;
    
    // Based on alignment mode
    if (mode === 'vertices') {
      // In vertex mode, contours go through cell vertices directly
      // Edge indices in this mode:
      // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
      switch (edgeIndex) {
        case 0: return { x: col, y: row };
        case 1: return { x: col + 1, y: row };
        case 2: return { x: col + 1, y: row + 1 };
        case 3: return { x: col, y: row + 1 };
        default: return { x: col, y: row }; // Shouldn't reach here
      }
    } 
    else {
      // In edge or center modes, contours go through cell edges
      // Edge indices in this mode:
      // 0: top edge, 1: right edge, 2: bottom edge, 3: left edge
      
      // Determine base position without interpolation
      let x = col;
      let y = row;
      
      switch (edgeIndex) {
        case 0: // Top edge: x varies, y fixed at top
          x += 0.5; 
          break;
        case 1: // Right edge: x fixed at right, y varies
          x += 1;
          y += 0.5;
          break;
        case 2: // Bottom edge: x varies, y fixed at bottom
          x += 0.5;
          y += 1;
          break;
        case 3: // Left edge: x fixed at left, y varies
          y += 0.5;
          break;
      }
      
      // Apply offsets
      x += offsetX - 0.5;
      y += offsetY - 0.5;
      
      return { x, y };
    }
  }
  
  /**
   * Connect line segments into closed contours
   */
  private connectSegments(segments: { p1: Point, p2: Point }[]): Contour[] {
    if (!segments.length) return [];
    
    // Copy segments to avoid modifying the original
    const remainingSegments = segments.map(seg => ({
      p1: { x: seg.p1.x, y: seg.p1.y },
      p2: { x: seg.p2.x, y: seg.p2.y }
    }));
    
    const contours: Contour[] = [];
    
    // While there are segments remaining
    while (remainingSegments.length > 0) {
      // Start with the first segment
      const firstSegment = remainingSegments.pop()!;
      const contourPoints: Point[] = [
        { x: firstSegment.p1.x, y: firstSegment.p1.y },
        { x: firstSegment.p2.x, y: firstSegment.p2.y }
      ];
      
      let closed = false;
      
      // Try to find connecting segments
      while (!closed && remainingSegments.length > 0) {
        const lastPoint = contourPoints[contourPoints.length - 1];
        let foundConnection = false;
        
        // Find a segment that connects to the last point
        for (let i = 0; i < remainingSegments.length; i++) {
          const seg = remainingSegments[i];
          
          // Check if p1 connects to last point
          if (this.pointsEqual(seg.p1, lastPoint)) {
            contourPoints.push({ x: seg.p2.x, y: seg.p2.y });
            remainingSegments.splice(i, 1);
            foundConnection = true;
            break;
          }
          
          // Check if p2 connects to last point
          if (this.pointsEqual(seg.p2, lastPoint)) {
            contourPoints.push({ x: seg.p1.x, y: seg.p1.y });
            remainingSegments.splice(i, 1);
            foundConnection = true;
            break;
          }
        }
        
        // Check if the contour is closed
        if (contourPoints.length > 2 && 
            this.pointsEqual(contourPoints[0], contourPoints[contourPoints.length - 1])) {
          // Remove the duplicate end point
          contourPoints.pop();
          closed = true;
        }
        
        // If no connection found, break the loop
        if (!foundConnection && !closed) {
          break;
        }
      }
      
      // Add the contour
      contours.push({
        points: contourPoints,
        closed: closed,
        bounds: this.calculateBounds(contourPoints)
      });
    }
    
    return contours;
  }
  
  /**
   * Check if two points are equal (within floating point epsilon)
   */
  private pointsEqual(p1: Point, p2: Point): boolean {
    const epsilon = 0.000001;
    return Math.abs(p1.x - p2.x) < epsilon && Math.abs(p1.y - p2.y) < epsilon;
  }

  /**
   * Calculate bounds for a contour
   */
  private calculateBounds(points: Point[]): Contour['bounds'] {
    if (!points.length) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }
    
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, maxX, minY, maxY };
  }
}
