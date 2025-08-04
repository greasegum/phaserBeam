# Vertex vs Edge Alignment in Marching Squares

The marching squares implementation now supports two fundamental alignment modes that dramatically change how contours are drawn.

## Alignment Modes

### 1. **Edge Mode** (Default: `alignmentMode: 'edges'`)
This is the traditional marching squares approach where contours pass through the edges of grid cells.

**Characteristics:**
- Contours intersect cell edges at interpolated positions
- Smooth, curved appearance
- Better for organic shapes and natural phenomena
- Interpolation determines exact crossing points on edges

**Visual Result:**
```
Grid cells:     Contours cross edges:
+---+---+       +---*---+
| 0 | 1 |       | 0 /*1 |
+---+---+  →    +--/-+--+
| 0 | 1 |       | /0 | 1 |
+---+---+       *---+---+
```

### 2. **Vertex Mode** (`alignmentMode: 'vertices'`)
Contours pass through the vertices (corners) of grid cells, creating a dual grid effect.

**Characteristics:**
- Contours connect grid intersection points directly
- More angular, crystalline appearance
- Better for technical/architectural visualizations
- No interpolation - straight lines between vertices

**Visual Result:**
```
Grid cells:     Contours through vertices:
+---+---+       *---+---+
| 0 | 1 |       |\0 | 1 |
+---+---+  →    +-\-+---+
| 0 | 1 |       | 0\| 1 |
+---+---+       +---*---+
```

## Usage Examples

### Standard Edge-Based (Smooth, Organic)
```typescript
const options: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true
}
```

### Vertex-Based (Angular, Technical)
```typescript
const options: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  // Note: interpolation is ignored in vertex mode
  smoothing: false  // Optional, but maintains angular look
}
```

### Comparison Settings
```typescript
// Organic blob-like shapes
const organicOptions: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  offsetX: 0.5,  // Center on edges
  offsetY: 0.5
}

// Technical/CAD-like shapes
const technicalOptions: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  smoothing: false,
  offsetX: 0,  // Align to grid
  offsetY: 0
}

// Pixel art style
const pixelArtOptions: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'none',  // No interpolation
  smoothing: false,
  offsetX: 0.5,
  offsetY: 0.5
}
```

## Key Differences

| Aspect | Edge Mode | Vertex Mode |
|--------|-----------|-------------|
| Contour Path | Through cell edges | Through cell vertices |
| Interpolation | Used to find edge positions | Not applicable |
| Visual Style | Smooth, curved | Angular, crystalline |
| Best For | Natural shapes, terrain | Technical drawings, crystals |
| Grid Relationship | Crosses cell boundaries | Follows grid structure |
| Smoothing Effect | Very effective | Less noticeable |

## Implementation Notes

1. **Vertex Mode Configuration Mapping**:
   - Each marching squares case directly maps to which vertices to connect
   - No interpolation calculation needed
   - Simpler computation but different visual result

2. **Offset Behavior**:
   - In edge mode: Offsets shift interpolation along edges
   - In vertex mode: Offsets shift the entire vertex grid

3. **Combining with Other Parameters**:
   - `simplificationTolerance`: Works well with both modes
   - `minContourArea`: Equally effective in both modes
   - `bufferSize`: Applied before mode selection
   - `smoothing`: More effective in edge mode

## Visual Use Cases

### Edge Mode Best For:
- Terrain contours
- Weather patterns
- Organic damage visualization
- Fluid dynamics
- Natural phenomena

### Vertex Mode Best For:
- Crystal growth patterns
- Technical schematics
- Grid-aligned artwork
- Architectural plans
- Geometric patterns

## Performance Considerations

- **Vertex mode** is slightly faster (no interpolation calculations)
- **Edge mode** with `interpolationMethod: 'none'` is nearly as fast
- Both modes benefit equally from simplification and filtering

## Tips

1. **For smooth transitions**: Use edge mode with linear interpolation and smoothing
2. **For sharp, technical look**: Use vertex mode with no smoothing
3. **For retro/pixel art**: Use edge mode with no interpolation
4. **Mix modes**: Generate multiple layers with different modes for complex effects