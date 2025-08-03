# Marching Squares Parameter Presets Guide

This guide provides tested parameter combinations that work well together for specific use cases.

## 🎨 Visual Style Presets

### Smooth Organic (Default)
Perfect for natural phenomena, terrain, fluid dynamics
```typescript
const smoothOrganic: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  offsetX: 0.5,
  offsetY: 0.5,
  simplificationTolerance: 0.05,
  minContourArea: 0.5
}
```

### Sharp Technical
Ideal for architectural plans, technical drawings
```typescript
const sharpTechnical: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  interpolationMethod: 'none', // Auto-corrected
  smoothing: false,
  offsetX: 0,
  offsetY: 0,
  simplificationTolerance: 0.1,
  edgeSnapping: true
}
```

### Pixel Art / Retro
8-bit style, blocky appearance
```typescript
const pixelArt: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'none',
  smoothing: false,
  offsetX: 0.5,
  offsetY: 0.5,
  simplificationTolerance: 0,
  minContourLength: 4
}
```

### Stylized Minimal
Clean, simplified shapes
```typescript
const stylizedMinimal: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.3,
  minContourLength: 10,
  minContourArea: 2.0
}
```

## ⚡ Performance Presets

### Fast Preview
Quick rendering for real-time updates
```typescript
const fastPreview: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'none',
  smoothing: false,
  simplificationTolerance: 0.5,
  minContourLength: 20,
  minContourArea: 5.0,
  bufferSize: 0
}
```

### Balanced Performance
Good quality with reasonable speed
```typescript
const balanced: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: false, // Skip for performance
  simplificationTolerance: 0.2,
  minContourLength: 8,
  minContourArea: 1.0
}
```

### High Quality
Maximum detail, slower rendering
```typescript
const highQuality: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0,
  minContourLength: 3,
  minContourArea: 0,
  bufferSize: 1,
  bufferValue: 0
}
```

## 🎯 Use Case Presets

### Terrain Contours
Topographic maps, elevation data
```typescript
const terrainContours: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.1,
  minContourArea: 1.0,
  offsetX: 0.5,
  offsetY: 0.5,
  edgeMode: 'clamp'
}
```

### Medical Imaging
Clean boundaries, noise reduction
```typescript
const medicalImaging: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.05,
  minContourArea: 2.0,
  minContourLength: 15,
  bufferSize: 1,
  bufferValue: 0
}
```

### Weather Visualization
Smooth gradients, large features only
```typescript
const weatherViz: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.2,
  minContourArea: 10.0,
  minContourLength: 30,
  globalOffsetX: 0,
  globalOffsetY: 0
}
```

### Game Level Design
Grid-aligned, clear boundaries
```typescript
const gameLevelDesign: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  interpolationMethod: 'none',
  smoothing: false,
  simplificationTolerance: 0,
  offsetX: 0,
  offsetY: 0,
  edgeSnapping: true,
  snapDistance: 0.1
}
```

## 🔧 Special Effect Presets

### Noisy Data Cleanup
Removes small artifacts
```typescript
const cleanupNoisy: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: true,
  simplificationTolerance: 0.15,
  minContourLength: 12,
  minContourArea: 3.0,
  bufferSize: 1,
  bufferValue: 0
}
```

### Edge Enhancement
Emphasizes boundaries
```typescript
const edgeEnhanced: MarchingSquaresOptions = {
  alignmentMode: 'edges',
  interpolationMethod: 'linear',
  smoothing: false,
  simplificationTolerance: 0,
  offsetX: 0.5,
  offsetY: 0.5,
  edgeSnapping: true,
  snapDistance: 0.05,
  bufferSize: 0
}
```

### Artistic Interpretation
Highly stylized output
```typescript
const artistic: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  interpolationMethod: 'none',
  smoothing: true, // Creates unique effect
  simplificationTolerance: 0.4,
  minContourLength: 8,
  offsetX: 0.25,
  offsetY: 0.25
}
```

## ⚠️ Parameter Combinations to Avoid

### ❌ Don't Do This:
```typescript
// Contradictory smoothing
const bad1: MarchingSquaresOptions = {
  interpolationMethod: 'none',
  smoothing: true,  // Conflicts with blocky interpolation
  simplificationTolerance: 0  // Wastes processing
}

// Excessive filtering
const bad2: MarchingSquaresOptions = {
  minContourLength: 50,
  simplificationTolerance: 0.8  // May eliminate all contours
}

// Pointless vertex mode
const bad3: MarchingSquaresOptions = {
  alignmentMode: 'vertices',
  interpolationMethod: 'linear',  // Will be ignored
  offsetX: 0.5,  // Not ideal for vertices
  offsetY: 0.5
}
```

## 💡 Tips

1. **Start with a preset** and adjust gradually
2. **Test incrementally** - change one parameter at a time
3. **Profile performance** - some combinations are much slower
4. **Save your presets** - reuse successful combinations
5. **Consider your data** - noisy data needs different settings than clean data

## 🔄 Dynamic Adjustment Strategy

For interactive applications, consider using different presets based on context:

```typescript
// During interaction (dragging, zooming)
const interactiveMode = fastPreview

// After interaction stops
const staticMode = highQuality

// For export/print
const exportMode = {
  ...highQuality,
  simplificationTolerance: 0,
  minContourArea: 0
}
```