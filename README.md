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

**Separation of Concerns**
The architecture is layered for clarity and performance:

* **React UI Layer**: Setup dialogs, controls, and advanced settings
* **Phaser Engine Layer**: Interactive grid, real-time feedback, rendering pipeline
* **Algorithm Layer**: Consolidated marching squares with intelligent defaults

**Scene and Input Orchestration**

* Grid cells are interactive Phaser rectangles with hover/click/drag events
* Multiple visualization layers with depth sorting
* Real-time contour generation and smoothing
* Paint-mode interaction for rapid area selection

---

## 🎯 Current Features

### ✅ **Interactive Beam Inspection**
- Comprehensive W-beam profile database
- Grid-based section loss marking system
- Paint-style interaction (click/drag to select areas)
- Multiple inspection zones (web, flanges)
- Different elevation views with proper labeling

### ✅ **Consolidated Marching Squares Implementation**
- **Single, maintainable algorithm** with intelligent defaults
- **Advanced smoothing methods**: Laplacian, Chaikin, bilateral, edge-aware, Savitzky-Golay
- **Collision avoidance** between separate contour regions
- **Edge clamping** to beam boundaries with corner treatment
- **Scalar field generation** with Gaussian, linear, and step methods
- **Clean configuration interface** with sensible defaults

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
├── components/           # React UI components
│   ├── PhaserCanvas.tsx  # Main Phaser integration wrapper
│   ├── SetupPopup.tsx    # Beam selection and configuration
│   ├── AdvancedSettings.tsx # Marching squares parameter controls
│   └── ...               # Additional UI components
├── scenes/              # Phaser game scenes
│   └── BeamElevationScene.ts # Main interactive scene (1700+ lines)
├── types/               # TypeScript definitions
│   ├── beam.ts          # BeamProfile, GridCell interfaces
│   └── contourConfig.ts # Marching squares configuration types
├── utils/               # Core algorithms and utilities
│   ├── marchingSquares.ts # Consolidated marching squares implementation
│   ├── beamCatalog.ts   # Structural beam database
│   ├── contour*.ts      # Smoothing and collision avoidance
│   └── scalarField.ts   # Field generation methods
└── core/                # Modular engine architecture
```

---

## 🎛️ Marching Squares Configuration

The consolidated marching squares implementation provides a clean interface with intelligent defaults:

```typescript
import { enhancedMarching } from './utils/marchingSquares'

// Simple usage with defaults using the unified pipeline
const contours = enhancedMarching(grid)

// Advanced configuration
const contours = marchingSquares(grid, {
  // Core algorithm
  threshold: 0.5,
  interpolationMethod: 'linear',
  
  // Smoothing
  smoothing: true,
  smoothingMethod: 'edge-aware',
  smoothingStrength: 0.5,
  
  // Edge behavior
  edgeClamping: true,
  edgeClampDistance: 0.8,
  
  // Collision avoidance
  collisionAvoidance: true,
  collisionMinDistance: 0.5
})
```

### **Available Configuration Options**
- **Core Parameters**: threshold, interpolation method, saddle point resolution
- **Smoothing**: multiple algorithms with strength control
- **Edge Behavior**: clamping, snapping, boundary extension
- **Collision Avoidance**: automatic separation of overlapping regions
- **Validation**: contour repair and filtering options

---

## 🔧 Recent Refactoring (2024)

**Marching Squares Consolidation**
The project recently underwent a major refactoring to address technical debt:

### ✅ **Improvements Made**
- **Consolidated 5 separate implementations** into a single, maintainable solution
- **Simplified configuration interface** with intelligent defaults
- **Maintained full backward compatibility** through legacy exports
- **Improved type consistency** across all modules
- **Removed parameter interdependency confusion**

### ✅ **Benefits Achieved**
- **Easier maintenance** - single source of truth for marching squares
- **Better developer experience** - clear, documented configuration options
- **Preserved functionality** - all existing features continue to work
- **Cleaner codebase** - removed duplicate and conflicting implementations

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

The project includes extensive technical documentation:
- `MARCHING_SQUARES_IMPROVEMENTS.md` - Algorithm enhancements
- `CONTOUR_ALIGNMENT_GUIDE.md` - Alignment strategies
- `PARAMETER_COMPATIBILITY_ANALYSIS.md` - Parameter interactions
- `SMOOTHING_ALGORITHMS_GUIDE.md` - Smoothing techniques
- Additional guides in the `docs/` directory

---

## 🏗️ Development Status

This is a **production-ready application** with **recently refactored architecture**:

- ✅ Complete core functionality
- ✅ Consolidated, maintainable algorithms
- ✅ Comprehensive structural beam database
- ✅ Professional-grade contour generation
- ✅ Clean, responsive engineering-focused UI
- ✅ Extensive technical documentation
- ✅ **Successful refactoring completed** (2024)

---

The application demonstrates exceptional technical depth in computational geometry and is designed specifically for professional structural engineering workflows. The recent refactoring has significantly improved code maintainability while preserving all existing functionality.
