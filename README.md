# phaserBeam

A modular, responsive sketching tool for structural beam inspection. It enables precise elevation and cross-section markup using a hybrid graphics stack. Designed with tactility and clarity in mind, it supports fast field annotation, structured condition reporting, and exportable vector documentation for archival and engineering review.

## 🧭 Core Concept

It fuses **Paper.js** and **Phaser** to separate responsibilities between high-fidelity geometry and high-performance interaction. The application targets efficient inspection workflows for W-beams and other structural members with:

* **Interactive condition mapping** over a live grid
* **Smooth contour generation** for loss zones using marching squares
* **Rich callouts**, calligraphic labels, and data overlays
* **Seamless export** to vector formats (SVG, PDF) and raster (PNG)
* **Touch-first, low-latency input handling** for use on tablets or field devices

---

## 🧱 Architecture Overview

**Separation of Concerns**
The architecture is layered for clarity and responsiveness:

* **Phaser Engine Layer**: Handles the grid, camera zoom/pan, cursor responsiveness, real-time feedback, cell highlighting, and interaction orchestration.
* **Paper.js Geometry Layer**: Responsible for vector-drawn elements: beam outlines, annotations, organic contour shapes, and export rendering.
* **React UI Layer**: Provides the control panel, tool selection, measurement readouts, and export options.

**Scene and Input Orchestration**

* Grid cells are Phaser sprites with event bindings (hover, click, long-press)
* Annotation layers are depth-sorted and controlled via Phaser scenes
* Smooth transitions and animations handled via Phaser tweens
* Touch and mouse input normalized for cross-device operation

---

## 🎛️ User Interface Elements

Modeled after classic inspection schematics, the following UI elements are essential:

* **Grid Toggle & Resolution Control**: Define grid spacing, vertical offset, snapping
* **Tool Palette**:

  * Select: cursor mode
  * Annotate: callouts, arrows, text
  * Loss Paint: mark rust or loss areas by severity
  * Polygon: manually draw outlines
* **Callout Editor**: Floating dialog to assign text to callouts, leader line controls
* **Contour Preview**: Toggle smooth region visualization on/off
* **Legend Dock**: Auto-updating key for severity zones, callout types
* **Status Bar**: Shows hovered grid cell position, beam coordinates, current tool
* **Zoom/Pan Controls**: Camera orbit, reset view, zoom-to-fit
* **Export Panel**: Output to SVG, PDF, PNG; include/exclude title block, legend
* **Layer Visibility Panel**: Toggle individual visual layers (grid, notes, photos, etc.)

---

## 🌐 Feature Tree

### Phase 1 – Core Interactive Sketching

* Modular React UI with Phaser grid canvas
* Catalog of W-beam types
* Scalable beam elevation rendering with grid overlay
* Smart snap and click-to-color cell mapping
* Real-time feedback on hover and selection

### Phase 2 – Annotations & Contours

* Arrow+text callouts with styled leader lines
* Polygonal and brush tools for rapid loss sketching
* **Marching Squares algorithm** for auto-generated contours
* Severity-based zone coloring (semi-transparent overlays)
* Layer blending for structure visibility beneath

### Phase 3 – Export & Data

* Export to vector (SVG/PDF) or raster (PNG)
* Title block generation and drawing annotations
* Export/import beam sketches as structured JSON
* Metadata embedding (location, date, inspector ID)

### Phase 4 – Advanced Features

* Profile lookup via field measurements (fuzzy match)
* Time-series mode for condition comparison
* Embedded photo annotations
* CLI tooling for batch report generation
* DXF export for CAD interop

---

## 🚀 Implementation Notes

**Contour Generation**
Selected grid cells are grouped by severity and processed via the Marching Squares algorithm. Output is smoothed via cubic Bézier interpolation to form organic loss areas. These contours are rendered with Paper.js and composited beneath annotation layers.

**Export Pipeline**

* Raster: `phaser.renderer.snapshot()` captures annotated state
* Vector: Paper.js handles final SVG/PDF generation with embedded grid and annotations

**Mobile Optimization**
Touch interaction is prioritized—tools are usable on tablet, with swipe-to-pan, pinch-to-zoom, long-press to activate dialogs, and large hit targets.

---

## 📁 Example Output

The generated drawing mirrors classic inspection schematics: north-south labeled elevation, zone annotations with severity data, legend block, and original section properties. Contour zones are overlaid transparently over structural geometry, with precise callouts reflecting field measurements.

---

Let me know when you're ready to scaffold the core Phaser canvas scene or need the marching squares implementation wired to grid state.
