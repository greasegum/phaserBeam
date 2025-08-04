# Edge Clamping Data Pipeline Audit

## Overview
This audit examines the complete edge clamping data pipeline from special treatment of edge input grid cells through to selective contour sculpting, including blurring, interpolation, marching squares, and algorithmic contour smoothing.

## Pipeline Stages

### 1. Input Grid Cell Treatment

#### Edge Detection (`detectActivatedEdges`)
**Location**: `src/utils/marchingSquares.ts:576-620`

**Function**: Detects which grid edges have active cells above threshold
```typescript
function detectActivatedEdges(
  grid: number[][],
  threshold: number
): { left: boolean, right: boolean, top: boolean, bottom: boolean }
```

**Edge Clamping Status**: ✅ **STRICT**
- Checks each edge column/row for cells ≥ threshold
- Returns boolean flags for each edge
- Used to determine mandatory edge clamping behavior

**Issues Found**: None - properly detects edge activation

### 2. Scalar Field Generation (Blurring)

#### Gaussian Blur (`gaussianBlur`)
**Location**: `src/utils/scalarField.ts:8-66`

**Function**: Converts binary grid to smooth gradients
```typescript
export function gaussianBlur(grid: number[][], radius: number = 2): number[][]
```

**Edge Clamping Status**: ⚠️ **POTENTIAL ISSUE**
- Uses boundary clamping for kernel convolution
- **Problem**: Blurring can affect edge cell values, potentially weakening edge detection
- **Impact**: May reduce edge activation sensitivity

**Recommendation**: 
- Preserve original edge cell values during blurring
- Apply edge-preserving blur that maintains boundary integrity

#### Signed Distance Field (`signedDistanceField`)
**Location**: `src/utils/scalarField.ts:68-126`

**Function**: Creates distance-based scalar field
```typescript
export function signedDistanceField(grid: number[][], maxDistance: number = 5): number[][]
```

**Edge Clamping Status**: ✅ **GOOD**
- Calculates distance to boundary
- Preserves edge information through distance values
- Maintains structural integrity

### 3. Interpolation Stage

#### Edge Point Interpolation (`getEdgePoint`)
**Location**: `src/utils/marchingSquares.ts:442-551`

**Function**: Interpolates contour points along grid edges
```typescript
function getEdgePoint(
  cellX: number,
  cellY: number,
  edge: number,
  grid: number[][],
  options: Required<MarchingSquaresOptions>,
  edgeCache: EdgeCache
): Point
```

**Edge Clamping Status**: ⚠️ **PARTIAL**
- Uses interpolation methods (linear, cubic, none)
- **Issue**: Interpolation can move points away from exact grid boundaries
- **Impact**: May break edge detection in subsequent stages

**Current Fix**: 
- `classifyInterpolatedPoint` function with increased tolerance (0.3)
- Handles slight offsets from interpolation

**Recommendation**:
- Add edge-preserving interpolation mode
- Maintain exact boundary alignment for edge cells

### 4. Marching Squares Core Algorithm

#### Strict Edge Clamping (`applyStrictEdgeClamping`)
**Location**: `src/utils/marchingSquares.ts:627-654`

**Function**: Enforces exact boundary snapping for activated edges
```typescript
function applyStrictEdgeClamping(
  point: Point,
  gridBounds: { minX: number, maxX: number, minY: number, maxY: number },
  activatedEdges: { left: boolean, right: boolean, top: boolean, bottom: boolean },
  options: Required<MarchingSquaresOptions>
): Point
```

**Edge Clamping Status**: ✅ **EXCELLENT**
- Mandatory behavior for structural beam visualization
- No tolerance - exact boundary snapping
- Properly handles activated edge detection

### 5. Post-Processing Pipeline

#### Global Offset Application
**Location**: `src/utils/marchingSquares.ts:775-785`

**Function**: Applies global positioning offsets
```typescript
const adjustX = options.globalOffsetX - (options.bufferSize > 0 ? options.bufferSize : 0)
const adjustY = options.globalOffsetY - (options.bufferSize > 0 ? options.bufferSize : 0)
```

**Edge Clamping Status**: ✅ **GOOD**
- Applied after edge clamping
- Preserves relative positioning
- No impact on edge integrity

### 6. Smoothing Algorithms

#### Edge-Aware Smoothing (`edgeAwareSmoothing`)
**Location**: `src/utils/edgeAwareSmoothing.ts:365-447`

**Function**: Applies smoothing with edge constraints
```typescript
export function edgeAwareSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions = {}
): Point[]
```

**Edge Clamping Status**: ✅ **EXCELLENT**
- Uses `applyEdgeTransition` for strict edge handling
- Checks for strict edge activation
- Constrains points exactly to boundaries

#### Selective Smoothing (`selectiveEdgeSmoothing`)
**Location**: `src/utils/edgeAwareSmoothing.ts:547-683`

**Function**: Only smooths segments away from edges
```typescript
export function selectiveEdgeSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions & {
    edgeBufferDistance?: number
    preserveEdgeSegments?: boolean
    transitionBlending?: boolean
  } = {}
): Point[]
```

**Edge Clamping Status**: ✅ **EXCELLENT**
- Classifies segments as EDGE_SEGMENT vs INTERIOR_SEGMENT
- Preserves edge segments exactly as-is
- Uses `classifyInterpolatedPoint` for robust edge detection
- Configurable buffer distance from edges

#### Intelligent Selective Smoothing (`intelligentSelectiveSmoothing`)
**Location**: `src/utils/edgeAwareSmoothing.ts:690-813`

**Function**: Advanced selective smoothing with curvature detection
```typescript
export function intelligentSelectiveSmoothing(
  contour: Point[],
  bounds: GridBounds,
  options: EdgeAwareSmoothingOptions & {
    edgeBufferDistance?: number
    curvatureThreshold?: number
    preserveStraightSegments?: boolean
  } = {}
): Point[]
```

**Edge Clamping Status**: ✅ **EXCELLENT**
- Detects straight segments to preserve
- Uses curvature analysis for intelligent preservation
- Maintains edge integrity while allowing interior smoothing

### 7. Edge Transition Handling

#### Edge Transition Application (`applyEdgeTransition`)
**Location**: `src/utils/edgeAwareSmoothing.ts:290-360`

**Function**: Handles transitions between smoothed and edge-constrained points
```typescript
function applyEdgeTransition(
  point: Point,
  smoothedPoint: Point,
  classification: PointClassification,
  transitionZone: number,
  bounds: GridBounds
): Point
```

**Edge Clamping Status**: ✅ **EXCELLENT**
- Checks for strict edge activation
- Constrains exactly to boundary when on edge
- Blends smoothly in transition zones
- Mandatory edge clamping for activated edges

## Critical Issues Identified

### 1. **Blurring Impact on Edge Detection**
**Severity**: Medium
**Issue**: Gaussian blur can weaken edge cell values, potentially causing edge deactivation
**Solution**: Implement edge-preserving blur that maintains boundary integrity

### 2. **Interpolation Coordinate Handling**
**Severity**: Low (Partially Fixed)
**Issue**: Interpolation moves points away from exact grid boundaries
**Current Fix**: `classifyInterpolatedPoint` with increased tolerance
**Recommendation**: Add edge-preserving interpolation mode

### 3. **Pipeline Order Dependencies**
**Severity**: Low
**Issue**: Some operations depend on specific ordering
**Status**: Currently well-ordered with proper edge preservation

## Recommendations for Enhanced Edge Clamping

### 1. **Edge-Preserving Blur**
```typescript
export function edgePreservingBlur(
  grid: number[][], 
  radius: number = 2,
  preserveEdges: boolean = true
): number[][] {
  // Preserve original edge cell values during blurring
  // Apply blur only to interior cells
}
```

### 2. **Edge-Preserving Interpolation**
```typescript
function getEdgePreservingPoint(
  cellX: number,
  cellY: number,
  edge: number,
  grid: number[][],
  options: Required<MarchingSquaresOptions>
): Point {
  // Maintain exact boundary alignment for edge cells
  // Use interpolation only for interior cells
}
```

### 3. **Enhanced Edge Detection**
```typescript
function detectActivatedEdgesWithTolerance(
  grid: number[][],
  threshold: number,
  edgeTolerance: number = 0.1
): { left: boolean, right: boolean, top: boolean, bottom: boolean } {
  // More robust edge detection with tolerance
  // Handle edge cases where blurring affects values
}
```

## Summary

The edge clamping pipeline is **well-architected** with strong edge preservation throughout most stages. The selective smoothing approach provides excellent control over edge behavior while allowing interior smoothing. The main areas for improvement are:

1. **Edge-preserving blur** to maintain boundary integrity during scalar field generation
2. **Edge-preserving interpolation** to maintain exact boundary alignment
3. **Enhanced edge detection** with tolerance for blurred edge cases

The current implementation successfully maintains strict edge clamping through the selective smoothing approach, providing predictable and controlled edge behavior while allowing algorithmic contour sculpting in interior regions. 