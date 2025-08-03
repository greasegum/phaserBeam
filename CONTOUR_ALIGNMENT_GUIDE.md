# Contour Alignment Configuration Guide

The marching squares implementation now supports configurable offsets and buffer padding to fine-tune the alignment between grid cells and generated contours.

## Configuration Options

### 1. Cell Offsets (`offsetX`, `offsetY`)
These offsets adjust where contours are positioned relative to grid cell boundaries.

- **Range**: Typically -1.0 to 1.0
- **Default**: 0.5 (centers contours on cell edges)
- **Units**: Grid cell units (1.0 = one full cell)

#### Common Values:
- `0.0`: Aligns contours with cell corners
- `0.5`: Centers contours on cell edges (default)
- `1.0`: Shifts contours by one full cell

### 2. Global Offsets (`globalOffsetX`, `globalOffsetY`)
These offsets shift the entire contour set after generation.

- **Range**: Any value (typically -10 to 10 for fine adjustments)
- **Default**: 0
- **Units**: Grid units (same as cell coordinates)

### 3. Buffer Configuration (`bufferSize`, `bufferValue`)
Buffer padding adds extra cells around the grid edges to control contour behavior at boundaries.

- **bufferSize**: Number of cells to pad around all edges
  - **Range**: 0-5 (typically)
  - **Default**: 0 (no buffer)
  - **Effect**: Extends the grid processing area
  
- **bufferValue**: Value assigned to buffer cells
  - **Range**: 0.0 to 1.0
  - **Default**: 0 (empty cells)
  - **Effect**: Controls whether buffer cells are "inside" (1) or "outside" (0) the contour

## Usage Examples

### Basic Configuration
```typescript
const marchingOptions: MarchingSquaresOptions = {
  threshold: 0.5,
  smoothing: true,
  offsetX: 0.5,      // Center on horizontal edges
  offsetY: 0.5,      // Center on vertical edges
  globalOffsetX: 0,  // No global shift
  globalOffsetY: 0   // No global shift
}
```

### Align to Cell Corners
```typescript
const marchingOptions: MarchingSquaresOptions = {
  offsetX: 0,  // Align to left edge of cells
  offsetY: 0   // Align to bottom edge of cells
}
```

### Fine-tune Alignment
```typescript
const marchingOptions: MarchingSquaresOptions = {
  offsetX: 0.5,        // Center on edges
  offsetY: 0.5,        // Center on edges
  globalOffsetX: -0.25, // Shift left by 1/4 cell
  globalOffsetY: 0.1    // Slight upward shift
}
```

### Buffer for Edge Control
```typescript
// Add empty buffer to pull contours away from edges
const marchingOptions: MarchingSquaresOptions = {
  bufferSize: 2,      // 2-cell buffer around edges
  bufferValue: 0      // Buffer cells are "outside"
}

// Add filled buffer to extend contours beyond edges
const marchingOptions: MarchingSquaresOptions = {
  bufferSize: 1,      // 1-cell buffer
  bufferValue: 1      // Buffer cells are "inside"
}
```

## BeamElevationScene API

The scene provides methods to adjust offsets dynamically:

```typescript
// Set cell offsets
scene.setContourOffsets(0.5, 0.5)

// Set global offsets
scene.setContourGlobalOffsets(-1, 0)

// Get current offsets
const offsets = scene.getContourOffsets()
console.log(offsets) // { offsetX: 0.5, offsetY: 0.5, globalOffsetX: -1, globalOffsetY: 0 }

// Set buffer configuration
scene.setContourBuffer(2, 0) // 2-cell buffer with empty cells

// Get current buffer settings
const buffer = scene.getContourBuffer()
console.log(buffer) // { bufferSize: 2, bufferValue: 0 }
```

## Visual Guide

```
Cell Grid:
+---+---+---+
| 0 | 1 | 0 |  offsetX/Y = 0.0: Contours at cell corners
+---+---+---+  offsetX/Y = 0.5: Contours at cell edges (default)
| 1 | 1 | 1 |  offsetX/Y = 1.0: Contours shifted by full cell
+---+---+---+
| 0 | 1 | 0 |
+---+---+---+

Global offsets shift the entire contour after generation.
```

## Tips for Alignment

1. **Start with defaults** (0.5, 0.5) - this centers contours on cell boundaries
2. **Use cell offsets first** to align with your grid system
3. **Apply global offsets** for fine-tuning if needed
4. **Test incrementally** - small changes (0.1) can make a big difference
5. **Consider grid size** - offsets are in grid units, not pixels
6. **Use buffer for edge behavior**:
   - Buffer with value 0: Pulls contours inward from edges
   - Buffer with value 1: Extends contours beyond edges
   - Buffer size affects how gradual the edge transition is

## React Component Example

The `ContourAlignmentControls` component provides a UI for adjusting offsets:

```tsx
import { ContourAlignmentControls } from './components/ContourAlignmentControls'

// In your component
<ContourAlignmentControls scene={beamElevationScene} />
```

This provides sliders for real-time adjustment of all offset values.