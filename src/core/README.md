# PhaserBeam Contour Generation Architecture

This document provides an overview of the new contour generation architecture in PhaserBeam.

## Architecture Overview

The contour generation system is organized into three main components, each with a clear responsibility:

1. **Marching Squares Algorithm**: Core implementation for generating contours from a scalar field
2. **Interpolation Algorithm**: Handles scalar field processing and enhancement
3. **Smoothing Algorithm**: Post-processes contours with various smoothing techniques

These components are coordinated by the `MarchingSquaresEngine`, which manages the pipeline flow and caching.

## Directory Structure

```
/src/core/
  /algorithms/
    /marching/
      MarchingSquaresAlgorithm.ts    - Core contour extraction algorithm
    /interpolation/
      InterpolationAlgorithm.ts       - Scalar field processing
    /smoothing/
      SmoothingAlgorithm.ts          - Contour smoothing and post-processing
    index.ts                         - Exports all algorithms
  /configuration/
    MarchingSquaresConfig.ts         - Main configuration interface
    MarchingSquaresAlgorithmConfig.ts - Configuration for marching algorithm
    InterpolationConfig.ts           - Configuration for interpolation
    SmoothingConfig.ts               - Configuration for smoothing
    PerformanceConfig.ts             - Performance-related settings
    ConfigUtils.ts                   - Configuration utilities and builder
  /engine/
    MarchingSquaresEngine.ts         - Main engine coordinating algorithms
    /processors/
      ContourProcessor.ts            - Legacy wrapper for smoothing algorithm
  /types/
    geometry.ts                      - Core geometric types
  /utils/
    PerformanceMonitor.ts            - Utility for performance tracking
  index.ts                           - Main API export file
```

## Usage Example

```typescript
import { 
  MarchingSquaresEngine, 
  ConfigBuilder 
} from './core'

// Create configuration with builder
const config = ConfigBuilder.create()
  .withThreshold(0.5)
  .withAlignmentMode('edges')
  .withInterpolation(true, 'linear')
  .withSmoothing(true, 'edge-aware', 0.5)
  .build()

// Create engine
const engine = new MarchingSquaresEngine(config)

// Generate contours from grid data
const grid = [
  [0.1, 0.2, 0.3],
  [0.4, 0.6, 0.5],
  [0.7, 0.8, 0.9]
]

const result = engine.process(grid)
console.log(`Generated ${result.contours.length} contours`)
console.log(`Took ${result.metrics.total}ms total processing time`)
```

## Configuration

Each component has its own configuration interface:

- `MarchingSquaresAlgorithmConfig`: Controls threshold, alignment, edge behavior
- `InterpolationConfig`: Controls scalar field processing and transformations
- `SmoothingConfig`: Controls post-processing, filtering, and collision avoidance
- `PerformanceConfig`: Controls caching and optimization settings

These are combined in the main `MarchingSquaresConfig` interface.
