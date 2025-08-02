# Marching Squares Parameter Compatibility Analysis

## Parameter Interaction Matrix

### 1. Critical Incompatibilities 🚫

| Parameter 1 | Parameter 2 | Issue | Current Behavior | Recommendation |
|------------|-------------|-------|------------------|----------------|
| `alignmentMode: 'vertices'` | `interpolationMethod` | Interpolation is meaningless for vertex connections | Ignored | Add warning or auto-set to 'none' |
| `simplificationTolerance > 0.5` | `minContourLength` | Over-simplification might violate length requirements | May produce invalid contours | Apply length check after simplification |
| `bufferSize > 5` | Edge clamping | Buffer might push contours beyond clamp range | Unpredictable clamping | Limit buffer size or adjust clamping |

### 2. Suboptimal Combinations ⚠️

| Parameter 1 | Parameter 2 | Issue | Impact |
|------------|-------------|-------|--------|
| `alignmentMode: 'vertices'` | `smoothing: true` | Smoothing defeats angular vertex aesthetic | Loss of sharp edges | Reduce smoothing intensity |
| `interpolationMethod: 'none'` | `smoothing: true` | Contradictory goals (blocky vs smooth) | Confusing output | Warn user |
| `offsetX/Y != 0.5` | `alignmentMode: 'edges'` | Offsets work best at 0.5 for edge mode | Asymmetric contours | Document best practices |
| `minContourArea > 0` | `bufferSize > 0` | Buffer might create small edge artifacts | Unexpected filtering | Consider buffer in area calc |

### 3. Performance Conflicts 🐌

| Parameters | Issue | Impact |
|-----------|-------|--------|
| `smoothing + simplificationTolerance: 0` | Double processing without reduction | Slower with no benefit |
| `bufferSize > 3 + minContourArea: 0` | Processing unnecessary buffer regions | Wasted computation |
| `interpolationMethod: 'linear' + alignmentMode: 'vertices'` | Interpolation calculated but unused | Minor performance hit |

## Recommended Parameter Validation

```typescript
function validateMarchingSquaresOptions(options: MarchingSquaresOptions): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Critical validations
  if (options.alignmentMode === 'vertices' && options.interpolationMethod === 'linear') {
    warnings.push("Interpolation is ignored in vertex alignment mode")
  }
  
  if (options.simplificationTolerance > 0.5 && options.minContourLength > 10) {
    warnings.push("High simplification might violate minimum contour length")
  }
  
  if (options.bufferSize > 5) {
    warnings.push("Large buffer sizes may interfere with edge clamping")
  }
  
  // Suboptimal combinations
  if (options.interpolationMethod === 'none' && options.smoothing) {
    warnings.push("Smoothing with no interpolation produces contradictory results")
  }
  
  if (options.alignmentMode === 'vertices' && options.smoothing) {
    warnings.push("Smoothing reduces the angular appearance of vertex mode")
  }
  
  // Performance warnings
  if (options.smoothing && options.simplificationTolerance === 0) {
    warnings.push("Consider using simplification after smoothing for better performance")
  }
  
  return { warnings, errors, isValid: errors.length === 0 }
}
```

## Safe Parameter Combinations

### For Organic Shapes
```typescript
const organic: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.1,
  offsetX: 0.5,
  offsetY: 0.5,
  minContourArea: 0.5
}
```

### For Technical/Angular
```typescript
const technical: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  interpolationMethod: 'none', // Explicitly set
  smoothing: false,
  simplificationTolerance: 0.2,
  offsetX: 0,
  offsetY: 0
}
```

### For Performance
```typescript
const performant: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'none',
  smoothing: false,
  simplificationTolerance: 0.5,
  minContourLength: 20,
  minContourArea: 1.0
}
```

## Order of Operations Issues

Current processing order:
1. Buffer padding
2. Grid processing
3. Contour generation
4. Smoothing
5. Length filtering
6. Area filtering
7. Simplification
8. Offset application
9. Edge clamping

### Potential Issues:

1. **Filtering before simplification**: Contours might drop below thresholds after simplification
2. **Offsets after generation**: Makes edge behavior less predictable
3. **Buffer before everything**: Can interfere with all subsequent steps

### Recommended Order:
1. Buffer padding
2. Grid processing with alignment mode
3. Contour generation
4. Initial offset application
5. Edge clamping
6. Smoothing (if applicable)
7. Simplification
8. Final filtering (length & area)
9. Global offset application

## Edge Case Scenarios

### 1. Empty Grid After Filtering
- All contours removed by minArea/minLength
- **Solution**: Return empty array gracefully

### 2. Single Cell Grid
- Grid too small for marching squares
- **Current**: Early return
- **Good**: ✓

### 3. All Cells Same Value
- No contours to generate
- **Current**: Returns empty
- **Good**: ✓

### 4. Extreme Threshold Values
- threshold < min(grid) or > max(grid)
- **Result**: Empty or full contours
- **Consider**: Warning for unusual thresholds

### 5. Negative Buffer Values
- Currently not validated
- **Risk**: Array index errors
- **Fix**: Clamp to 0

## Recommendations

1. **Add Parameter Validation Function**
   - Warn about incompatible combinations
   - Suggest alternatives
   - Don't fail hard, just inform

2. **Auto-Adjust Conflicting Parameters**
   - Set interpolationMethod='none' when alignmentMode='vertices'
   - Reduce smoothing intensity in vertex mode
   - Limit buffer size relative to grid size

3. **Document Best Practices**
   - Parameter combination cookbook
   - Visual examples of each combination
   - Performance implications

4. **Add Debug Mode**
   - Log parameter conflicts
   - Show processing statistics
   - Highlight edge cases