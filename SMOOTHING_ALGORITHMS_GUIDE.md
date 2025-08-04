# Marching Squares Smoothing Algorithms Guide

This document describes the additional smoothing algorithms available for post-processing marching squares contours while preserving edge clamping.

## Overview

The marching squares implementation now supports multiple advanced smoothing algorithms that can be applied after contour generation. These algorithms are designed to work with edge clamping, ensuring that contours remain properly aligned with beam boundaries.

## Available Smoothing Methods

### 1. Basic (Original)
- **Description**: The original simple averaging smoothing
- **Best for**: Quick smoothing with minimal computational cost
- **Parameters**: None
- **Edge behavior**: Does not explicitly preserve edge constraints

### 2. Laplacian Smoothing
- **Description**: Iteratively moves each vertex toward the average of its neighbors
- **Best for**: Creating organic, fluid shapes
- **Parameters**: 
  - Iterations (1-5): More iterations = smoother curves
  - Strength (0.1-1.0): How much vertices move toward average
- **Edge behavior**: Edge vertices remain fixed to preserve clamping

### 3. Chaikin's Corner Cutting
- **Description**: Subdivides segments by cutting corners, creating smooth curves
- **Best for**: Smooth corners while maintaining overall shape
- **Parameters**: 
  - Iterations (1-5): More iterations = smoother, more subdivided curves
- **Edge behavior**: Edge segments are preserved, only interior corners are cut

### 4. Bilateral Smoothing
- **Description**: Smooths based on both spatial distance and geometric similarity
- **Best for**: Preserving sharp features while smoothing other areas
- **Parameters**: 
  - Iterations (1-5): More iterations = stronger smoothing
  - Strength (0.1-1.0): Overall smoothing intensity
- **Edge behavior**: Preserves edge points and sharp features near boundaries

### 5. Savitzky-Golay Filter
- **Description**: Polynomial smoothing that preserves shape characteristics
- **Best for**: Reducing noise while maintaining overall contour shape
- **Parameters**: None (uses fixed 5-point quadratic filter)
- **Edge behavior**: Edge points are preserved, polynomial fitting respects boundaries

### 6. Catmull-Rom Splines
- **Description**: Creates smooth spline curves through control points
- **Best for**: Very smooth, flowing curves
- **Parameters**: 
  - Strength (0.1-1.0): Tension of the spline curves
- **Edge behavior**: Edge segments use constrained interpolation

## Edge Clamping Preservation

All smoothing algorithms (except basic) include edge-aware processing:

1. **Edge Detection**: Points within 0.1 grid units of defined edges are considered "edge points"
2. **Edge Preservation**: Edge points are either:
   - Kept fixed (Laplacian, Savitzky-Golay)
   - Specially handled (Chaikin, Bilateral, Catmull-Rom)
3. **Constraint Application**: All smoothed points are checked against edge constraints and clamped if necessary

## Usage in Code

```typescript
const marchingOptions: MarchingSquaresOptions = {
  threshold: 0.5,
  smoothing: true,
  smoothingMethod: 'laplacian',     // Choose method
  smoothingIterations: 3,            // For iterative methods
  smoothingStrength: 0.7,            // For strength-based methods
  edgeMode: 'clamp',                 // Enable edge clamping
  // ... other options
}

const contours = marchingSquaresOptimized(grid, marchingOptions)
```

## UI Controls

The Advanced Settings panel provides controls for:
- **Smoothing Method**: Dropdown to select algorithm
- **Smoothing Iterations**: Slider (shown for applicable methods)
- **Smoothing Strength**: Slider (shown for applicable methods)

## Performance Considerations

1. **Basic**: Fastest, minimal overhead
2. **Savitzky-Golay**: Fast, single-pass algorithm
3. **Laplacian/Bilateral**: Moderate, depends on iterations
4. **Chaikin**: Can increase point count significantly with iterations
5. **Catmull-Rom**: Most computationally intensive, creates many interpolated points

## Recommendations

- **For organic web shapes**: Use Laplacian with 2-3 iterations
- **For technical drawings**: Use Savitzky-Golay or low-iteration Chaikin
- **For artistic effects**: Use Catmull-Rom with moderate strength
- **For performance-critical applications**: Use Basic or single-iteration algorithms
- **When edge alignment is critical**: Use Bilateral or Laplacian with edge preservation

## Edge Clamping Behavior

With `edgeMode: 'clamp'` enabled:
- Contour points near grid boundaries are constrained to those boundaries
- The clamping threshold is 0.1 grid units by default
- Edge clamping works in conjunction with all smoothing methods
- Visual result: Contours seamlessly connect to beam edges without gaps or overshoots