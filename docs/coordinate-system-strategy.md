# Beam Inspection Coordinate System Strategy

## Overview

This document codifies the coordinate system currently implemented in the beam inspection prototype. It establishes clear, consistent coordinate models for different domains (web vs flanges) and documents the transformation rules between world coordinates, grid coordinates, and screen coordinates as they exist in the current implementation.

## Core Principles

1. **Single Source of Truth**: World coordinates (inches) are the canonical representation
2. **Explicit Transformations**: All coordinate transformations are explicitly defined
3. **Domain Separation**: 2D coordinates for web, 1D coordinates for flanges
4. **Consistent Origin**: Bottom-left corner of beam at top of bottom flange

## Coordinate Domains

### 1. World Coordinates (Physical Measurements)

**Units**: Inches

**Origin**: (0, 0) at intersection of:
- Left bearing edge (x = 0)
- Top surface of bottom flange (y = 0)

**Axes**:
- X-axis: Horizontal, increasing rightward along beam length
- Y-axis: Vertical, increasing upward from bottom flange

**Bounds**:
- X: [0, beamLength]
- Y: [0, webHeight] for web region
- Y: [-flangeThickness, webHeight + flangeThickness] for complete beam

### 2. Grid Coordinates (Discrete Cell Indices)

**Units**: Integer cell indices

**Web Grid (2D)**:
- Origin: (0, 0) at bottom-left cell
- X: Cell column, 0 to ceil(beamLength) - 1
- Y: Cell row, 0 to ceil(webHeight) - 1
- Cell (i, j) spans world coordinates:
  - X: [i, min(i+1, beamLength)]
  - Y: [j, min(j+1, webHeight)]

**Flange Grid (1D)**:
- Origin: 0 at left edge
- Only X coordinate: 0 to ceil(beamLength) - 1
- Cell i spans world X: [i, min(i+1, beamLength)]

### 3. Screen Coordinates (Rendering)

**Units**: Pixels

**Origin**: Top-left of canvas (standard screen coordinates)

**Current Implementation**:
- Beam is centered vertically at `centerY`
- `webBottom = centerY + (webHeight * gridSize) / 2`
- `webTop = centerY - (webHeight * gridSize) / 2`
- Bottom flange starts at `webBottom`
- Top flange bottom edge at `webTop`

**Transformation from World**:
```
screenX = startX + worldX * gridSize
screenY = webBottom - worldY * gridSize
```

Where:
- `startX`: Left edge of beam rendering (includes viewport padding)
- `gridSize`: Pixels per inch (zoom factor)
- `webBottom`: Screen Y coordinate of web bottom edge (top of bottom flange)

## Coordinate Transformations

### World ↔ Grid

**World to Grid**:
```typescript
gridX = Math.floor(worldX)
gridY = Math.floor(worldY)
```

**Grid to World (cell center)**:
```typescript
worldX = gridX + 0.5
worldY = gridY + 0.5
```

**Grid to World (cell bounds)**:
```typescript
minWorldX = gridX
maxWorldX = min(gridX + 1, beamLength)
minWorldY = gridY
maxWorldY = min(gridY + 1, webHeight)
```

### World ↔ Screen

**World to Screen** (as implemented):
```typescript
screenX = startX + worldX * gridSize
screenY = webBottom - worldY * gridSize  // Y-axis inverted
```

**Screen to World**:
```typescript
worldX = (screenX - startX) / gridSize
worldY = (webBottom - screenY) / gridSize
```

### Grid ↔ Screen

**Grid to Screen (cell corner)** (as implemented):
```typescript
screenX = startX + gridX * gridSize
screenY = webBottom - (gridY + 1) * gridSize  // Cell y position
```

**Screen to Grid**:
```typescript
gridX = Math.floor((screenX - startX) / gridSize)
gridY = Math.floor((webBottom - screenY) / gridSize)
```

## Marching Squares Grid Coordinates

For contour generation, we use a padded grid to handle boundary conditions:

**Padded Grid**:
- Dimensions: (webRows + 2) × (webCols + 2)
- Padding: 1 cell on all sides
- Grid[0][*] and Grid[rows+1][*]: Top/bottom padding
- Grid[*][0] and Grid[*][cols+1]: Left/right padding

**Coordinate Mapping**:
```typescript
// Cell (gridX, gridY) to padded array indices
paddedRow = (paddedRows - 2) - gridY  // Invert Y
paddedCol = gridX + 1                 // Add padding offset
```

**Contour Point Transformation**:
```typescript
// Marching squares output to world coordinates
worldX = contourPoint.x - 1  // Remove padding offset
worldY = (paddedRows - 2) - (contourPoint.y - 1)  // Invert and remove padding
```

## Annotation Anchoring System

### Valid Anchor Points

**Web Region**:
1. **Cell Centers**: (gridX + 0.5, gridY + 0.5) in world coordinates
2. **Cell Corners**: (gridX, gridY) in world coordinates
3. **Contour Points**: Interpolated points from marching squares
4. **Contour Midpoints**: Center points along contour segments
5. **Region Centroids**: Weighted center of section loss regions

**Flange Region**:
1. **Cell Centers**: (gridX + 0.5) in world X coordinate
2. **Cell Boundaries**: (gridX) in world X coordinate
3. **Segment Midpoints**: Center of continuous loss segments

### Anchor Point Storage

```typescript
interface AnchorPoint {
  type: 'cell-center' | 'cell-corner' | 'contour-point' | 'contour-midpoint' | 'centroid'
  worldCoords: { x: number, y: number }  // Always in inches
  gridRef?: { x: number, y: number }     // Optional grid reference
  metadata?: {
    contourIndex?: number
    segmentIndex?: number
    regionId?: string
  }
}
```

## Implementation Guidelines

### 1. Coordinate System Initialization

```typescript
class CoordinateSystem {
  // World space dimensions (inches)
  beamLength: number
  webHeight: number
  flangeThickness: number
  
  // Screen space parameters
  viewportPadding: number = 100  // pixels
  gridSize: number = 20          // pixels per inch
  
  // Derived values
  webBottom: number  // Screen Y of web bottom
  webTop: number     // Screen Y of web top
  
  constructor(beamProfile: BeamProfile, viewport: Viewport) {
    // Initialize from beam profile
  }
}
```

### 2. Transformation Functions

```typescript
class CoordinateTransform {
  // Always use explicit transformation functions
  worldToScreen(world: Point): ScreenPoint
  screenToWorld(screen: ScreenPoint): Point
  worldToGrid(world: Point): GridPoint
  gridToWorld(grid: GridPoint): Point
  
  // Specialized transformations
  gridCellToScreenBounds(grid: GridPoint): ScreenRect
  contourPointToWorld(contourPt: Point, paddedGrid: Grid): Point
}
```

### 3. Validation and Bounds Checking

```typescript
class CoordinateValidator {
  isValidWorldPoint(pt: Point): boolean {
    return pt.x >= 0 && pt.x <= this.beamLength &&
           pt.y >= 0 && pt.y <= this.webHeight
  }
  
  isValidGridCell(cell: GridPoint): boolean {
    return cell.x >= 0 && cell.x < Math.ceil(this.beamLength) &&
           cell.y >= 0 && cell.y < Math.ceil(this.webHeight)
  }
  
  clampToBeamBounds(pt: Point): Point {
    return {
      x: Math.max(0, Math.min(this.beamLength, pt.x)),
      y: Math.max(0, Math.min(this.webHeight, pt.y))
    }
  }
}
```

### 4. Debugging Support

```typescript
class CoordinateDebugger {
  // Render coordinate grid overlay
  renderCoordinateGrid(graphics: Graphics): void
  
  // Display coordinate info at cursor
  showCoordinateInfo(screenPt: ScreenPoint): string {
    const world = this.screenToWorld(screenPt)
    const grid = this.worldToGrid(world)
    return `Screen: (${screenPt.x}, ${screenPt.y})\n` +
           `World: (${world.x.toFixed(2)}", ${world.y.toFixed(2)}")\n` +
           `Grid: (${grid.x}, ${grid.y})`
  }
}
```

## Common Pitfalls and Solutions

### 1. Y-Axis Inversion
**Problem**: Screen Y increases downward, world Y increases upward
**Solution**: Always apply inversion in world↔screen transformations

### 2. Grid Boundary Cells
**Problem**: Edge cells may be partial (less than 1 inch)
**Solution**: Use min(gridIndex + 1, dimension) for cell bounds

### 3. Marching Squares Padding
**Problem**: Padded grid indices don't match world coordinates
**Solution**: Always subtract padding offset and apply Y-inversion

### 4. Floating Point Precision
**Problem**: Coordinate comparisons may fail due to precision
**Solution**: Use epsilon comparisons for coordinate matching

### 5. Anchor Point Persistence
**Problem**: Anchor points may become invalid after grid changes
**Solution**: Store in world coordinates, validate on load

## Testing Strategy

1. **Unit Tests**: Test each transformation function with known values
2. **Round-Trip Tests**: Verify world→screen→world preserves coordinates
3. **Boundary Tests**: Test edge cases at beam boundaries
4. **Visual Tests**: Render coordinate grid overlay for visual verification
5. **Interactive Tests**: Display live coordinate info during development

## Migration Plan

1. **Phase 1**: Implement CoordinateSystem and CoordinateTransform classes
2. **Phase 2**: Update marching squares to use consistent transformations
3. **Phase 3**: Migrate annotation system to world coordinate anchors
4. **Phase 4**: Add coordinate debugging overlay
5. **Phase 5**: Update all coordinate-dependent code to use new system

## Current Implementation Notes

The prototype currently implements this coordinate system with the following key characteristics:

1. **Web cells**: Created with `y = webBottom - (row + 1) * gridSize` where row 0 is at the bottom
2. **Grid origin**: Always at the left end of the beam, regardless of the `gridOrigin` setting (which only affects dimension labels)
3. **Flange representation**: 1D linear grids at fixed Y positions
4. **Marching squares**: Uses inverted Y coordinates in the padded grid array

This documentation reflects the existing implementation to ensure future features align with the established coordinate system.

## Version History

- v1.0 (2025-08-01): Initial strategy document documenting current implementation
- Future: Add support for rotated coordinate systems
- Future: Add support for multiple beam segments