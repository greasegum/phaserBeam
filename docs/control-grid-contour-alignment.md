# Control Grid-Contour Alignment Strategy

## Overview

The marching squares algorithm generates contours based on a discrete grid of control points. The alignment between this control grid and the resulting contours is critical for accurate geometric representation, especially in engineering applications where precise boundary conditions matter.

## Core Concepts

### 1. Grid Cell Coordinate System

- **Grid cells** are defined by their top-left corner coordinates (x, y)
- Each cell spans from (x, y) to (x+1, y+1) in grid units
- Cell corners are sampled at integer grid coordinates
- The value at each corner determines whether it's inside (≥ threshold) or outside (< threshold)

### 2. Contour Generation Within Cells

For each cell, marching squares:
1. Evaluates the 4 corner values against the threshold
2. Creates a 4-bit configuration code based on which corners are "inside"
3. Generates line segments based on this configuration
4. Interpolates edge crossing points based on corner values

### 3. Alignment Parameters

#### Cell Offsets (offsetX, offsetY)
- **Purpose**: Fine-tune contour position within each grid cell
- **Range**: Typically -0.5 to 1.5
- **Default**: 0.5 (centers contours on cell edges)
- **Effect**: Shifts interpolation points along cell edges

#### Global Offsets (globalOffsetX, globalOffsetY)
- **Purpose**: Shift entire contour system in grid units
- **Range**: Typically -2 to 2 grid units
- **Effect**: Translates all contours uniformly

#### Alignment Modes
- **Edge Aligned**: Contours follow cell edges (default)
- **Vertex Aligned**: Contours pass through cell vertices
- **Center Aligned**: Contours are centered within cells

## Edge Handling Strategy

### Current Challenges

1. **Edge cells require special treatment** because they lack neighboring cells on one or more sides
2. **Boundary conditions** must be enforced to prevent contours from extending beyond the grid
3. **Edge clamping** is essential for maintaining geometric integrity

### Proposed Rigorous Edge Handling System

#### 1. Cell Classification
```typescript
enum CellType {
  INTERIOR,    // All 4 neighbors exist
  EDGE,        // 1-3 neighbors missing
  CORNER,      // 2 adjacent neighbors missing
}
```

#### 2. Edge Buffer System
- **Minimum buffer**: 0.1 grid units from boundary
- **Configurable buffer**: Allow users to set edge buffer distance
- **Automatic enforcement**: Clamp points that would exceed boundaries

#### 3. Virtual Boundary Extension
- Create virtual cells beyond grid boundaries
- Fill with configurable values (0, threshold, or extrapolated)
- Ensures consistent contour behavior at edges

#### 4. Edge-Specific Interpolation
```typescript
interface EdgeInterpolation {
  method: 'linear' | 'cubic' | 'none';
  clampDistance: number;  // Min distance from edge
  extendMode: 'clamp' | 'extend' | 'mirror';
}
```

## Implementation Details

### Current Implementation
```typescript
// In MarchingSquaresEngine.ts
private processCell(x: number, y: number, ...): Array<[Point, Point]> {
  // Get corner values
  const tl = data[idx]
  const tr = data[idx + 1]
  const bl = data[idx + width]
  const br = data[idx + width + 1]
  
  // Generate segments with offsets
  return this.getEdgeSegments(config, x, y, ...)
}
```

### Recommended Enhancements

1. **Pre-process edge cells**
```typescript
private preprocessEdgeCells(data: Float32Array, width: number, height: number) {
  // Apply edge buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (this.isEdgeCell(x, y, width, height)) {
        this.applyEdgeBuffer(x, y, data, width)
      }
    }
  }
}
```

2. **Edge-aware interpolation**
```typescript
private interpolateEdgePoint(
  p1: Point, 
  p2: Point, 
  t: number,
  isEdge: boolean,
  edgeBuffer: number
): Point {
  const point = this.interpolate(p1, p2, t)
  
  if (isEdge) {
    // Apply edge clamping
    point.x = Math.max(edgeBuffer, Math.min(width - edgeBuffer, point.x))
    point.y = Math.max(edgeBuffer, Math.min(height - edgeBuffer, point.y))
  }
  
  return point
}
```

3. **Configurable edge behavior**
```typescript
interface EdgeBehavior {
  clampToGrid: boolean;      // Force points to stay within grid
  edgeBuffer: number;         // Minimum distance from edge
  extendToBoundary: boolean;  // Extend contours to grid boundary
  snapDistance: number;       // Snap to edge if within distance
}
```

## Best Practices

1. **Always enable edge clamping** for engineering applications
2. **Use a minimum edge buffer** of 0.1 grid units
3. **Configure alignment mode** based on application:
   - Edge-aligned for structural analysis
   - Vertex-aligned for discrete element modeling
   - Center-aligned for visualization

4. **Test edge cases thoroughly**:
   - Single isolated cells at corners
   - Thin strips along edges
   - Diagonal patterns near boundaries

## Configuration Examples

### Conservative Engineering Settings
```typescript
{
  algorithm: {
    interpolationMethod: 'linear',
    threshold: 0.5
  },
  geometry: {
    alignment: {
      mode: 'edges',
      offsetX: 0.5,
      offsetY: 0.5
    },
    edges: {
      clampToGrid: true,
      edgeBuffer: 0.2,
      snapDistance: 0.1
    }
  }
}
```

### Smooth Visualization Settings
```typescript
{
  algorithm: {
    interpolationMethod: 'cubic',
    threshold: 0.5
  },
  geometry: {
    alignment: {
      mode: 'center',
      offsetX: 0.5,
      offsetY: 0.5
    },
    edges: {
      clampToGrid: true,
      edgeBuffer: 0.05,
      extendToBoundary: true
    }
  }
}
```

## Future Enhancements

1. **Adaptive edge buffers** based on local geometry
2. **Multi-resolution edge handling** for hierarchical grids
3. **Edge-specific smoothing algorithms**
4. **Boundary condition templates** for common engineering scenarios