# Advanced Marching Squares Parameters

Our implementation now includes several advanced parameters for fine-tuning contour generation beyond basic offsets and buffers.

## New Parameters

### 1. **Contour Filtering**

#### `minContourLength` (default: 3)
- **Purpose**: Removes small, noisy contours
- **Range**: 3+ (minimum for a valid contour)
- **Use Case**: Clean up scattered single-cell artifacts
- **Example**: Set to 10 to only keep substantial contours

#### `minContourArea` (default: 0)
- **Purpose**: Filters out contours with small enclosed areas
- **Range**: 0+ (in grid units squared)
- **Use Case**: Remove tiny islands or holes
- **Example**: Set to 0.5 to remove contours smaller than half a grid cell

### 2. **Contour Simplification**

#### `simplificationTolerance` (default: 0)
- **Purpose**: Reduces contour complexity using Douglas-Peucker algorithm
- **Range**: 0+ (0 = no simplification)
- **Use Case**: Optimize rendering performance, create stylized looks
- **Effect**: Higher values create more angular, simplified shapes
- **Example**: 0.1 for subtle simplification, 0.5 for aggressive simplification

### 3. **Interpolation Control**

#### `interpolationMethod` (default: 'linear')
- **Options**: 
  - `'linear'`: Smooth interpolation based on field values
  - `'none'`: Fixed 0.5 positioning (creates blocky, pixel-art style)
- **Use Case**: Control visual style of contours
- **Effect**: 'none' creates a more digital/retro aesthetic

### 4. **Edge Behavior** (Future Enhancement)

#### `edgeMode` (default: 'clamp')
- **Options**:
  - `'clamp'`: Contours snap to grid edges
  - `'extend'`: Contours can extend beyond grid
- **Note**: Currently prepared but not fully implemented

## Usage Examples

### Clean, Simplified Contours
```typescript
const options: MarchingSquaresOptions = {
  minContourLength: 10,        // Remove tiny fragments
  minContourArea: 1.0,         // Remove small islands
  simplificationTolerance: 0.2, // Smooth out minor details
  smoothing: true              // Additional smoothing
}
```

### Pixel Art Style
```typescript
const options: MarchingSquaresOptions = {
  interpolationMethod: 'none',  // No interpolation
  smoothing: false,            // No smoothing
  offsetX: 0,                  // Align to grid corners
  offsetY: 0
}
```

### Performance Optimized
```typescript
const options: MarchingSquaresOptions = {
  simplificationTolerance: 0.5, // Aggressive simplification
  minContourLength: 20,        // Only large contours
  smoothing: false             // Skip smoothing pass
}
```

### High Quality Detailed
```typescript
const options: MarchingSquaresOptions = {
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0,   // No simplification
  minContourLength: 3,         // Keep all contours
  minContourArea: 0            // No area filtering
}
```

## Performance Considerations

1. **Simplification**: Reduces point count, improves rendering performance
2. **Filtering**: Reduces number of contours to process
3. **Interpolation**: 'none' is slightly faster than 'linear'
4. **Smoothing**: Adds processing time but improves appearance

## Visual Effects

- **Low `simplificationTolerance`** (0.05-0.1): Subtle smoothing, preserves detail
- **Medium `simplificationTolerance`** (0.2-0.5): Noticeable simplification, good for performance
- **High `simplificationTolerance`** (0.5+): Very angular, stylized appearance

- **`interpolationMethod: 'none'`**: Creates stepped, blocky contours reminiscent of pixel art
- **`minContourArea` filtering**: Removes "dust" and tiny holes for cleaner shapes

## Best Practices

1. **Start Conservative**: Begin with default values and adjust gradually
2. **Combine Parameters**: Use multiple parameters together for best results
3. **Performance vs Quality**: Balance simplification with visual requirements
4. **Test at Scale**: What looks good zoomed in may need adjustment at full scale

## Implementation Notes

- Douglas-Peucker algorithm preserves shape while reducing points
- Area calculation uses the shoelace formula for accuracy
- Filtering happens before simplification for efficiency
- All parameters work together with existing offset and buffer systems