# PhaserBeam

A sophisticated structural beam inspection tool that enables precise elevation and cross-section markup using an interactive hybrid graphics stack. Built for structural engineers conducting field inspections, it supports fast annotation, advanced contour generation, and professional documentation for engineering review.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🧭 Core Concept

PhaserBeam combines **React** and **Phaser.js** to create a professional-grade inspection tool for structural beams. The application targets efficient inspection workflows for W-beams and other structural members with:

* **Interactive grid-based condition mapping** with paint-style selection
* **Advanced marching squares contour generation** for section loss visualization
* **Professional engineering annotations** with dimension lines and labels
* **Comprehensive W-beam catalog** with real structural profiles
* **Multi-zone inspection** (web, top flange, bottom flange)
* **Multiple elevation views** (North, South, East, West)

---

## 🛠️ Technology Stack

- **React 19.1.1** - Modern UI framework with latest features
- **Phaser 3.90.0** - High-performance 2D graphics engine
- **TypeScript 5.9.2** - Type-safe development
- **Vite 4.5.3** - Fast build tool and development server

---

## 🧱 Architecture Overview

**Modular Core Architecture**
The application has been extensively refactored into a clean, modular architecture:

* **Core Engine Layer**: Unified contour processing pipeline with configurable algorithms
* **React UI Layer**: Setup dialogs, controls, advanced settings, and annotation tools
* **Phaser Rendering Layer**: Interactive grid, real-time feedback, and visualization
* **Algorithm Layer**: Specialized processors for interpolation, marching squares, and smoothing

**Unified Processing Pipeline**
The `processGrid()` function in `core/engine/MarchingSquaresEngine.ts` serves as the main entry point:

* **Single source of truth** for all contour generation
* **Configurable algorithm selection** (interpolation, smoothing methods)
* **Consistent return format** with `ProcessingResult` interface
* **Performance monitoring** and optimization built-in
* **Clean separation** between algorithm logic and UI rendering

---

## 🎯 Current Features

### ✅ **Interactive Beam Inspection**
- Comprehensive W-beam profile database
- Grid-based section loss marking system
- Paint-style interaction (click/drag to select areas)
- Multiple inspection zones (web, flanges)
- Different elevation views with proper labeling

### ✅ **Advanced Annotation System**
- **Professional dimension lines** with Linear and Ordinate styles
- **Enhanced annotation effects** with callouts and labels
- **Interactive annotation toolbar** with tool selection
- **Annotation mode** separate from grid editing
- **Export capabilities** for documentation

### ✅ **Unified Core Engine**
- **Modular algorithm architecture** with specialized processors
- **Single entry point** via `processGrid()` function
- **Performance monitoring** and optimization built-in
- **Configurable processing pipeline** with intelligent defaults
- **Type-safe configuration** with validation and error handling

### ✅ **Advanced Smoothing Methods**
- **Multiple smoothing algorithms**: Laplacian, Chaikin, bilateral, edge-aware, Savitzky-Golay
- **Configurable smoothing strength** and iteration control
- **Edge-aware processing** to preserve important features
- **Performance-optimized implementations** with caching

### ✅ **Professional Visualization**
- Multiple visualization layers (pixel outlines, blurred fields, raw/smooth contours)
- Edit mode vs. view mode with appropriate rendering styles
- Real-time contour generation as cells are selected
- Engineering-grade dimension lines and annotations
- Grid origin control for different coordinate systems

### ✅ **User Experience**
- Modal setup dialog for beam selection and configuration
- Responsive canvas with horizontal scrolling for long beams
- Mouse wheel support for navigation
- Clean, professional UI designed for engineering workflows
- Visual feedback for all interactions

---

## 📁 Project Structure

```
src/
├── core/                     # Core engine and algorithms
│   ├── algorithms/           # Specialized algorithm implementations
│   │   ├── InterpolationAlgorithm.ts
│   │   ├── MarchingSquaresAlgorithm.ts
│   │   ├── SmoothingAlgorithm.ts
│   │   ├── interpolation/    # Interpolation method implementations
│   │   ├── marching/         # Marching squares variants
│   │   └── smoothing/        # Smoothing algorithm implementations
│   ├── configuration/        # Type-safe configuration system
│   │   ├── MarchingSquaresConfig.ts
│   │   ├── InterpolationConfig.ts
│   │   ├── SmoothingConfig.ts
│   │   ├── PerformanceConfig.ts
│   │   └── ConfigUtils.ts
│   ├── engine/              # Core processing engine
│   │   ├── MarchingSquaresEngine.ts  # Main entry point (processGrid)
│   │   ├── ContourProcessor.ts
│   │   └── processors/       # Specialized processors
│   ├── ScalarField.ts       # Scalar field generation
│   ├── ScalarFieldEnhancements.ts
│   ├── BezierRendering.ts   # Bezier curve utilities
│   └── geometry.ts          # Geometric utilities
├── components/              # React UI components
│   ├── PhaserCanvas.tsx     # Main Phaser integration wrapper
│   ├── SetupPopup.tsx       # Beam selection and configuration
│   ├── AdvancedSettings.tsx # Algorithm parameter controls
│   ├── BeamViewer.tsx       # Beam visualization component
│   ├── AnnotationToolbar.tsx # Annotation tool selection
│   ├── ModeToolbar.tsx      # Application mode controls
│   └── ...                  # Additional UI components
├── annotations/             # Professional annotation system
│   ├── AnnotationManager.ts
│   ├── LinearDimensionRenderer.ts
│   ├── OrdinateDimensionRenderer.ts
│   ├── CalloutRenderer.ts
│   └── EnhancedAnnotationEffects.ts
├── scenes/                  # Phaser game scenes
│   ├── BeamElevationScene.ts # Main interactive scene
│   └── GridScene.ts         # Grid management
├── types/                   # TypeScript definitions
│   ├── beam.ts              # BeamProfile, GridCell interfaces
│   ├── contourConfig.ts     # Configuration type definitions
│   ├── annotations.ts       # Annotation system types
│   ├── defects.ts          # Defect classification types
│   └── mode.ts             # Application mode types
└── utils/                   # Domain-specific utilities
    ├── beamCatalog.ts       # Structural beam database
    ├── comprehensiveBeamCatalog.ts
    ├── defectPatterns.ts    # Defect pattern definitions
    ├── canvasExport.ts      # Export functionality
    └── marchingSquares.ts   # Legacy wrapper (compatibility)
```

---

## 🎛️ Core Engine Configuration

The unified core engine provides a clean, type-safe interface with intelligent defaults:

```typescript
import { processGrid } from './core/engine/MarchingSquaresEngine'

// Simple usage with defaults
const result = await processGrid(gridData)
const contours = result.contours

// Advanced configuration with full control
const result = await processGrid(gridData, {
  // Core marching squares algorithm
  algorithm: {
    threshold: 0.5,
    interpolation: 'linear',
    edgeHandling: 'clamp'
  },
  
  // Smoothing configuration
  smoothing: {
    enabled: true,
    method: 'edge-aware',
    strength: 0.7,
    iterations: 2
  },
  
  // Interpolation settings
  interpolation: {
    method: 'cubic',
    tension: 0.5,
    samples: 100
  },
  
  // Performance optimization
  performance: {
    enableCaching: true,
    maxCacheSize: 1000,
    enableProfiling: false
  }
})
```

### **Configuration Architecture**
- **Modular configuration system** with separate config objects for each algorithm
- **Type-safe validation** with comprehensive error reporting
- **Intelligent defaults** for all parameters
- **Builder pattern support** for complex configurations
- **Performance monitoring** and caching built-in

---

## 🔧 Recent Major Refactoring (2025)

**Core Engine Unification and Modularization**
The project underwent extensive architectural improvements:

### ✅ **Structural Improvements**
- **Unified processing pipeline** with single `processGrid()` entry point
- **Modular algorithm architecture** with specialized processors
- **Flattened file structure** eliminating single-file directories
- **Separation of concerns** between algorithmic logic and utilities
- **Comprehensive type safety** with validated configuration system
- **Performance optimization** with caching and profiling capabilities

### ✅ **Code Quality Enhancements**
- **Eliminated orphaned and deprecated code** across the entire codebase
- **Consolidated algorithm implementations** removing duplication
- **Improved maintainability** through clear module boundaries
- **Enhanced debugging capabilities** with visualization modes
- **Better error handling** and validation throughout the pipeline

### ✅ **Benefits Achieved**
- **Single source of truth** for all contour processing
- **Cleaner codebase** with logical organization
- **Easier maintenance** and feature development
- **Better performance** through optimized algorithms
- **Enhanced developer experience** with comprehensive type safety

---

## 🎯 Use Cases

Perfect for **structural engineers** who need to:
- Document section loss during field inspections
- Generate smooth, professional contours from grid-based input
- Work with standard W-beam structural profiles
- Create precise engineering documentation
- Visualize damage patterns with advanced algorithms

---

## 📚 Documentation

The project includes comprehensive technical documentation:
- `SMOOTHING_ALGORITHMS_GUIDE.md` - Advanced smoothing techniques and implementations
- `VERTEX_VS_EDGE_ALIGNMENT.md` - Contour alignment strategies and best practices
- `docs/control-grid-contour-alignment.md` - Grid alignment optimization
- `docs/coordinate-system-strategy.md` - Coordinate system architecture
- `core/README.md` - Core engine architecture and usage guide
- Additional technical guides throughout the codebase

---

## 🏗️ Development Status

This is a **production-ready application** with **recently modernized architecture**:

- ✅ Complete core functionality with unified processing engine
- ✅ Modular, maintainable algorithm architecture
- ✅ Comprehensive structural beam database
- ✅ Professional-grade contour generation and annotation system
- ✅ Clean, responsive engineering-focused UI
- ✅ Advanced annotation tools with dimension lines and callouts
- ✅ Debug visualization modes for development and troubleshooting
- ✅ Type-safe configuration system with validation
- ✅ Performance optimization with caching and profiling
- ✅ **Major architectural refactoring completed** (2025)

---

The application demonstrates exceptional technical depth in computational geometry and professional annotation systems, specifically designed for structural engineering workflows. The recent architectural improvements have significantly enhanced code maintainability, performance, and developer experience while expanding functionality.
