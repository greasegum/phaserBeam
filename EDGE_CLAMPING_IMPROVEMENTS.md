# Edge Clamping Improvements

## Overview
The marching squares implementation now features enhanced edge clamping that works correctly regardless of offset values. Additionally, an unobtrusive advanced settings menu has been added to the application for easy adjustment of contour alignment.

## Edge Clamping Enhancements

### Intelligent Edge Detection
The system now detects whether cells actually exist at the beam edges before applying clamping:

```typescript
const hasLeftEdgeCells = webCells.some(cell => cell.x === 0)
const hasRightEdgeCells = webCells.some(cell => cell.x === Math.ceil(this.beamLength) - 1)
const hasTopEdgeCells = webCells.some(cell => cell.y === Math.ceil(webHeight) - 1)
const hasBottomEdgeCells = webCells.some(cell => cell.y === 0)
```

### Smooth Edge Transitions
Instead of hard snapping, the system uses interpolation for smooth transitions near edges:

```typescript
const edgeProximityThreshold = 1.5 // cells from edge
const t = Math.max(0, Math.min(1, (edgeProximityThreshold - point.x) / edgeProximityThreshold))
x = startX * t + x * (1 - t)
```

### Offset-Independent Clamping
Edge clamping now works correctly regardless of the offset values:
- Clamping is applied after offset calculations
- Only activates when cells exist at edges
- Preserves smooth contours while ensuring proper beam boundaries

## Advanced Settings Menu

### Unobtrusive Design
- Small gear icon button in bottom-right corner
- Expands to show settings panel when clicked
- Smooth slide-up animation
- Automatically hides when not in use

### Features
1. **Real-time Adjustment**: Changes apply immediately as you drag sliders
2. **Visual Feedback**: Current values displayed next to each slider
3. **Reset Function**: One-click reset to default values
4. **Helpful Tooltips**: Brief explanations of what each setting does

### Settings Available
- **Cell Offset X**: -0.5 to 1.5 (default: 0.5)
- **Cell Offset Y**: -0.5 to 1.5 (default: 0.5)
- **Global Offset X**: -5 to 5 (default: 0)
- **Global Offset Y**: -5 to 5 (default: 0)

## Implementation Details

### BeamElevationScene Updates
- Enhanced coordinate transformation with edge detection
- Smooth interpolation near boundaries
- Conditional clamping based on cell presence

### AdvancedSettings Component
- Minimalist floating UI design
- State synchronization with scene
- Responsive controls with immediate feedback
- Professional appearance with subtle animations

## Usage

The advanced settings menu is automatically available when viewing the beam elevation. Simply:

1. Click the gear icon in the bottom-right corner
2. Adjust sliders to fine-tune contour alignment
3. Click "Reset to Defaults" if needed
4. Click the gear icon again to hide the settings

## Benefits

1. **Precise Control**: Fine-tune contour alignment without code changes
2. **Edge Integrity**: Contours properly align with beam edges when cells are present
3. **Offset Flexibility**: Use any offset values while maintaining proper edge behavior
4. **User-Friendly**: Non-technical users can adjust alignment easily
5. **Non-Intrusive**: Settings stay out of the way during normal use

## Technical Notes

- Edge clamping uses a proximity threshold of 1.5 cells for smooth transitions
- Hard clamping occurs within 0.1 cells of edges
- All calculations respect the current offset values
- The UI uses React hooks for efficient state management
- Settings persist during the current session