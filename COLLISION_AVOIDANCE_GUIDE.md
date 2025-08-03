# Collision Avoidance Guide

This document describes the collision avoidance system that prevents neighboring contour regions from overlapping, regardless of smoothing or other settings.

## Overview

The collision avoidance system automatically detects when contours are too close to each other and applies corrective measures to maintain a minimum distance between them. This ensures that distinct regions remain visually separated even when aggressive smoothing or expansion effects are applied.

## Key Features

### 1. Automatic Neighbor Detection
- Uses bounding box pre-filtering for performance
- Calculates exact minimum distances between contours
- Only processes contours that could potentially collide

### 2. Configurable Parameters
- **Enable/Disable**: Toggle collision avoidance on/off
- **Minimum Distance**: Set the buffer zone between regions (in grid units)
- **Resolution Method**: Choose how collisions are resolved
- **Max Iterations**: Control processing time vs accuracy

### 3. Resolution Methods

#### Push Apart
- Moves contours away from each other
- Maintains original shape and size
- Best for small overlaps
- May cause contours to hit boundaries

#### Shrink Contours
- Reduces contour size toward their centers
- Prevents boundary collisions
- Best when contours are tightly packed
- May reduce visual size significantly

#### Hybrid (Auto)
- Automatically chooses the best method
- Uses "push" for distant contours
- Uses "shrink" for overlapping contours
- Provides the best overall results

### 4. Edge Constraint Compatibility
- Respects edge clamping settings
- Prevents contours from being pushed beyond boundaries
- Ensures web edge alignment is maintained

## Usage

### In Code
```typescript
const marchingOptions: MarchingSquaresOptions = {
  // ... other options
  collisionAvoidance: true,          // Enable collision avoidance
  collisionMinDistance: 0.5,         // Min 0.5 grid units between contours
  collisionMethod: 'hybrid',         // Auto-select best method
  collisionIterations: 10            // Up to 10 iterations to resolve
}
```

### UI Controls
The Advanced Settings panel provides:
- **Checkbox**: Enable/disable collision avoidance
- **Min Distance Slider**: 0.1 to 2.0 grid units
- **Method Dropdown**: Push, Shrink, or Hybrid
- **Iterations Slider**: 1 to 20 iterations

## How It Works

1. **Bounding Box Check**: Quick overlap detection using axis-aligned bounding boxes
2. **Distance Calculation**: Exact minimum distance between contour points
3. **Collision Detection**: Identify contours closer than minimum distance
4. **Resolution**: Apply selected method to separate contours
5. **Iteration**: Repeat until no collisions or max iterations reached
6. **Edge Clamping**: Ensure all points respect boundary constraints

## Performance Considerations

- **Contour Count**: Performance scales with O(n²) for n contours
- **Iterations**: More iterations = better separation but slower processing
- **Method Choice**: "Shrink" is fastest, "Push" is moderate, "Hybrid" adapts
- **Point Count**: Fewer points per contour = faster collision detection

## Best Practices

1. **Default Settings**: Start with default values (0.5 distance, hybrid method)
2. **Visual Tuning**: Adjust minimum distance based on visual requirements
3. **Performance**: Reduce iterations if real-time performance is critical
4. **Method Selection**:
   - Use "Push" when regions have room to move
   - Use "Shrink" when space is constrained
   - Use "Hybrid" (default) for automatic optimization

## Interaction with Other Features

### Smoothing
- Collision avoidance runs AFTER smoothing
- Prevents smooth contours from overlapping
- May slightly reduce smoothing effects near collisions

### Edge Clamping
- Edge constraints are always respected
- Contours won't be pushed beyond beam boundaries
- May force "shrink" behavior near edges

### Buffer Zones
- Grid buffer affects collision detection bounds
- Larger buffers give more room for collision resolution

## Visual Results

With collision avoidance enabled:
- Distinct regions remain separated
- Consistent visual gaps between features
- No overlapping contours
- Clean, professional appearance
- Predictable behavior across all settings

## Troubleshooting

**Contours still touching:**
- Increase minimum distance
- Increase max iterations
- Try "shrink" method for dense areas

**Contours too small:**
- Decrease minimum distance
- Use "push" or "hybrid" method
- Consider reducing smoothing strength

**Performance issues:**
- Reduce max iterations
- Use "shrink" method
- Simplify contours before collision detection