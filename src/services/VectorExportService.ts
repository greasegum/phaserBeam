import { BeamProfile, GridCell } from '../types/beam'
import { DefectType, DEFECT_STYLES } from '../types/defects'
import jsPDF from 'jspdf'
import 'svg2pdf.js'

export interface VectorLayer {
  id: string
  name: string
  visible: boolean
  opacity?: number
  order: number
}

export interface VectorExportOptions {
  format: 'svg' | 'pdf' | 'dxf'
  scale?: number
  units?: 'mm' | 'in' | 'px'
  layers?: VectorLayer[]
  backgroundColor?: string
  strokeWidth?: number
  fontSize?: number
  includeGrid?: boolean
  includeAnnotations?: boolean
  includeDimensions?: boolean
  includeDefectPattern?: boolean
  includeLegend?: boolean
  title?: string
  metadata?: Record<string, any>
}

export interface VectorExportContext {
  beamProfile: BeamProfile
  beamLength: number
  cells: GridCell[]
  gridSize: number
  dimensions: {
    startX: number
    centerY: number
    width: number
    height: number
  }
  annotations?: any[]
}

/**
 * Service for exporting beam inspection data as vector graphics
 */
export class VectorExportService {
  private readonly defaultLayers: VectorLayer[] = [
    { id: 'background', name: 'Background', visible: true, order: 0, opacity: 1 },
    { id: 'grid', name: 'Grid', visible: true, order: 1, opacity: 0.3 },
    { id: 'beam', name: 'Beam Profile', visible: true, order: 2, opacity: 1 },
    { id: 'defects', name: 'Defects', visible: true, order: 3, opacity: 0.8 },
    { id: 'annotations', name: 'Annotations', visible: true, order: 4, opacity: 1 },
    { id: 'dimensions', name: 'Dimensions', visible: true, order: 5, opacity: 1 },
    { id: 'legend', name: 'Legend', visible: true, order: 6, opacity: 1 }
  ]

  /**
   * Export as SVG with proper layer support
   */
  async exportSVG(
    context: VectorExportContext,
    options: VectorExportOptions = {}
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const layers = options.layers || this.defaultLayers
      const scale = options.scale || 1
      const padding = 50
      
      const { dimensions } = context
      const width = (dimensions.width + padding * 2) * scale
      const height = (dimensions.height + padding * 2) * scale
      
      // Create SVG document with proper structure
      let svg = this.createSVGHeader(width, height, options)
      
      // Add definitions (patterns, gradients, etc.)
      svg += this.createSVGDefs(context, options)
      
      // Sort layers by order and add them
      const sortedLayers = [...layers].sort((a, b) => a.order - b.order)
      
      for (const layer of sortedLayers) {
        if (!layer.visible) continue
        
        svg += `  <g id="${layer.id}" class="layer" opacity="${layer.opacity || 1}">\n`
        
        switch (layer.id) {
          case 'background':
            svg += this.createSVGBackground(width, height, options)
            break
          case 'grid':
            if (options.includeGrid) {
              svg += this.createSVGGrid(context, scale, padding)
            }
            break
          case 'beam':
            svg += this.createSVGBeamProfile(context, scale, padding)
            break
          case 'defects':
            svg += this.createSVGDefects(context, scale, padding, options)
            break
          case 'annotations':
            if (options.includeAnnotations && context.annotations) {
              svg += this.createSVGAnnotations(context, scale, padding)
            }
            break
          case 'dimensions':
            if (options.includeDimensions) {
              svg += this.createSVGDimensions(context, scale, padding)
            }
            break
          case 'legend':
            if (options.includeLegend) {
              svg += this.createSVGLegend(context, scale, padding)
            }
            break
        }
        
        svg += '  </g>\n'
      }
      
      svg += '</svg>'
      
      return { success: true, data: svg }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SVG export failed'
      }
    }
  }

  /**
   * Export as PDF with vector graphics
   */
  async exportPDF(
    context: VectorExportContext,
    options: VectorExportOptions = {}
  ): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      // First create SVG
      const svgResult = await this.exportSVG(context, options)
      if (!svgResult.success || !svgResult.data) {
        throw new Error('Failed to generate SVG for PDF conversion')
      }
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: options.units || 'mm',
        format: 'a3'
      })
      
      // Add metadata
      if (options.metadata) {
        pdf.setProperties({
          title: options.title || 'Beam Inspection Report',
          subject: 'Beam Inspection Data',
          author: 'Beam Inspection System',
          keywords: 'beam, inspection, structural',
          creator: 'PhaserBeam'
        })
      }
      
      // Convert SVG to PDF
      const svgElement = this.createSVGElement(svgResult.data)
      await (pdf as any).svg(svgElement, {
        x: 10,
        y: 10,
        width: 277, // A3 landscape width - margins
        height: 190  // A3 landscape height - margins
      })
      
      // Generate blob
      const blob = pdf.output('blob')
      
      return { success: true, data: blob }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed'
      }
    }
  }

  /**
   * Export as DXF for CAD programs
   */
  async exportDXF(
    context: VectorExportContext,
    options: VectorExportOptions = {}
  ): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const scale = options.scale || 1
      const { beamProfile, beamLength, cells, gridSize, dimensions } = context
      
      let dxf = '0\nSECTION\n2\nHEADER\n'
      dxf += '9\n$ACADVER\n1\nAC1014\n'  // AutoCAD 2000 format
      dxf += '9\n$INSUNITS\n70\n4\n'     // Millimeters
      dxf += '0\nENDSEC\n'
      
      // Tables section
      dxf += '0\nSECTION\n2\nTABLES\n'
      dxf += this.createDXFLayers(options.layers || this.defaultLayers)
      dxf += '0\nENDSEC\n'
      
      // Entities section
      dxf += '0\nSECTION\n2\nENTITIES\n'
      
      // Draw beam profile
      dxf += this.createDXFBeamProfile(context, scale)
      
      // Draw defects
      dxf += this.createDXFDefects(context, scale)
      
      // Draw grid if requested
      if (options.includeGrid) {
        dxf += this.createDXFGrid(context, scale)
      }
      
      // Draw dimensions if requested
      if (options.includeDimensions) {
        dxf += this.createDXFDimensions(context, scale)
      }
      
      dxf += '0\nENDSEC\n'
      dxf += '0\nEOF\n'
      
      return { success: true, data: dxf }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'DXF export failed'
      }
    }
  }

  /**
   * Create SVG header with proper namespaces and metadata
   */
  private createSVGHeader(width: number, height: number, options: VectorExportOptions): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}"
     version="1.1">
  <title>${options.title || 'Beam Inspection'}</title>
  <desc>Beam inspection data with defect mapping</desc>
`
  }

  /**
   * Create SVG definitions for patterns and styles
   */
  private createSVGDefs(context: VectorExportContext, options: VectorExportOptions): string {
    let defs = '  <defs>\n'
    
    // Define patterns for different defect types
    defs += `    <pattern id="section-loss-pattern" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="10" height="10" fill="#ff6b6b" opacity="0.3"/>
      <circle cx="5" cy="5" r="2" fill="#cc0000" opacity="0.6"/>
    </pattern>
    
    <pattern id="hole-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="#4dabf7" opacity="0.3"/>
      <line x1="0" y1="8" x2="8" y2="0" stroke="#0066cc" stroke-width="1" opacity="0.6"/>
      <line x1="0" y1="0" x2="8" y2="8" stroke="#0066cc" stroke-width="1" opacity="0.6"/>
    </pattern>
    
    <!-- Grid pattern -->
    <pattern id="grid-pattern" patternUnits="userSpaceOnUse" width="${context.gridSize}" height="${context.gridSize}">
      <rect width="${context.gridSize}" height="${context.gridSize}" fill="none" stroke="#cccccc" stroke-width="0.5" opacity="0.5"/>
    </pattern>
`
    
    defs += '  </defs>\n'
    return defs
  }

  /**
   * Create SVG background layer
   */
  private createSVGBackground(width: number, height: number, options: VectorExportOptions): string {
    if (!options.backgroundColor || options.backgroundColor === 'transparent') {
      return ''
    }
    return `    <rect x="0" y="0" width="${width}" height="${height}" fill="${options.backgroundColor}"/>\n`
  }

  /**
   * Create SVG grid layer
   */
  private createSVGGrid(context: VectorExportContext, scale: number, padding: number): string {
    const { gridSize, dimensions, beamProfile } = context
    const { startX, centerY, width } = dimensions
    
    let grid = ''
    const scaledGridSize = gridSize * scale
    const scaledStartX = (startX + padding) * scale
    const scaledCenterY = (centerY + padding) * scale
    
    // Calculate grid bounds
    const webHeight = beamProfile.webHeight * gridSize * scale
    const webTop = scaledCenterY - webHeight / 2
    const webBottom = scaledCenterY + webHeight / 2
    
    // Vertical lines
    const cols = Math.ceil(width / gridSize)
    for (let i = 0; i <= cols; i++) {
      const x = scaledStartX + i * scaledGridSize
      grid += `    <line x1="${x}" y1="${webTop}" x2="${x}" y2="${webBottom}" stroke="#cccccc" stroke-width="0.5" opacity="0.5"/>\n`
    }
    
    // Horizontal lines
    const rows = Math.ceil(beamProfile.webHeight)
    for (let i = 0; i <= rows; i++) {
      const y = webTop + i * scaledGridSize
      grid += `    <line x1="${scaledStartX}" y1="${y}" x2="${scaledStartX + width * scale}" y2="${y}" stroke="#cccccc" stroke-width="0.5" opacity="0.5"/>\n`
    }
    
    return grid
  }

  /**
   * Create SVG beam profile
   */
  private createSVGBeamProfile(context: VectorExportContext, scale: number, padding: number): string {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY, width } = dimensions
    const { webHeight, flangeThickness } = beamProfile
    
    const scaledStartX = (startX + padding) * scale
    const scaledCenterY = (centerY + padding) * scale
    const scaledWidth = width * scale
    const scaledWebHeight = webHeight * gridSize * scale
    const scaledFlangeThickness = flangeThickness * gridSize * scale
    
    const webTop = scaledCenterY - scaledWebHeight / 2
    const webBottom = scaledCenterY + scaledWebHeight / 2
    const flangeTop = webTop - scaledFlangeThickness
    
    let beam = ''
    
    // Top flange
    beam += `    <rect x="${scaledStartX}" y="${flangeTop}" width="${scaledWidth}" height="${scaledFlangeThickness}" 
           fill="#f0f0f0" stroke="#333" stroke-width="2"/>\n`
    
    // Web
    beam += `    <rect x="${scaledStartX}" y="${webTop}" width="${scaledWidth}" height="${scaledWebHeight}" 
           fill="#f0f0f0" stroke="#333" stroke-width="2"/>\n`
    
    // Bottom flange
    beam += `    <rect x="${scaledStartX}" y="${webBottom}" width="${scaledWidth}" height="${scaledFlangeThickness}" 
           fill="#f0f0f0" stroke="#333" stroke-width="2"/>\n`
    
    return beam
  }

  /**
   * Create SVG defects layer
   */
  private createSVGDefects(
    context: VectorExportContext,
    scale: number,
    padding: number,
    options: VectorExportOptions
  ): string {
    const { cells, gridSize, dimensions, beamProfile } = context
    const { startX, centerY } = dimensions
    
    let defects = ''
    const scaledGridSize = gridSize * scale
    const scaledStartX = (startX + padding) * scale
    const scaledCenterY = (centerY + padding) * scale
    
    // Group cells by defect type
    const cellsByType = new Map<DefectType, GridCell[]>()
    cells.forEach(cell => {
      const type = cell.defectType || 'section-loss'
      if (!cellsByType.has(type)) {
        cellsByType.set(type, [])
      }
      cellsByType.get(type)!.push(cell)
    })
    
    // Draw defects by type
    cellsByType.forEach((typeCells, defectType) => {
      const style = DEFECT_STYLES[defectType]
      if (!style) return
      
      const fillColor = `#${style.fillColor.toString(16).padStart(6, '0')}`
      const fillOpacity = style.fillAlpha
      
      typeCells.forEach(cell => {
        const x = scaledStartX + cell.col * scaledGridSize
        let y: number
        
        if (cell.zone === 'web') {
          const webTop = scaledCenterY - (beamProfile.webHeight * gridSize * scale) / 2
          const webBottom = scaledCenterY + (beamProfile.webHeight * gridSize * scale) / 2
          y = webBottom - (cell.row + 1) * scaledGridSize
        } else {
          // Flange cells
          y = cell.zone === 'flange-top' 
            ? scaledCenterY - (beamProfile.webHeight * gridSize * scale) / 2 - beamProfile.flangeThickness * gridSize * scale
            : scaledCenterY + (beamProfile.webHeight * gridSize * scale) / 2
        }
        
        const height = cell.zone === 'web' 
          ? scaledGridSize 
          : beamProfile.flangeThickness * gridSize * scale
        
        // Use pattern if enabled, otherwise solid fill
        const fill = options.includeDefectPattern 
          ? `url(#${defectType}-pattern)`
          : fillColor
        
        defects += `    <rect x="${x}" y="${y}" width="${scaledGridSize}" height="${height}" 
           fill="${fill}" opacity="${fillOpacity}" stroke="${fillColor}" stroke-width="0.5"/>\n`
      })
    })
    
    return defects
  }

  /**
   * Create SVG annotations layer
   */
  private createSVGAnnotations(context: VectorExportContext, scale: number, padding: number): string {
    // Placeholder for annotations
    return ''
  }

  /**
   * Create SVG dimensions layer
   */
  private createSVGDimensions(context: VectorExportContext, scale: number, padding: number): string {
    const { beamProfile, beamLength, dimensions, gridSize } = context
    const { startX, centerY, width } = dimensions
    
    const scaledStartX = (startX + padding) * scale
    const scaledCenterY = (centerY + padding) * scale
    const scaledWidth = width * scale
    const fontSize = 12 * scale
    
    let dims = ''
    
    // Beam length dimension
    const dimY = scaledCenterY + (beamProfile.webHeight * gridSize * scale) / 2 + 
                 beamProfile.flangeThickness * gridSize * scale + 30 * scale
    
    dims += `    <line x1="${scaledStartX}" y1="${dimY}" x2="${scaledStartX + scaledWidth}" y2="${dimY}" 
           stroke="#000" stroke-width="1" marker-start="url(#arrow)" marker-end="url(#arrow)"/>\n`
    dims += `    <text x="${scaledStartX + scaledWidth / 2}" y="${dimY - 5}" 
           font-size="${fontSize}" text-anchor="middle">${beamLength}"</text>\n`
    
    return dims
  }

  /**
   * Create SVG legend
   */
  private createSVGLegend(context: VectorExportContext, scale: number, padding: number): string {
    const legendX = padding * scale
    const legendY = padding * scale
    const fontSize = 12 * scale
    const boxSize = 20 * scale
    const spacing = 30 * scale
    
    let legend = `    <g transform="translate(${legendX}, ${legendY})">\n`
    legend += `      <text x="0" y="${fontSize}" font-size="${fontSize}" font-weight="bold">Legend</text>\n`
    
    let yOffset = spacing
    
    // Add defect types to legend
    const defectTypes: DefectType[] = ['section-loss', 'hole']
    defectTypes.forEach(type => {
      const style = DEFECT_STYLES[type]
      if (!style) return
      
      const fillColor = `#${style.fillColor.toString(16).padStart(6, '0')}`
      
      legend += `      <rect x="0" y="${yOffset}" width="${boxSize}" height="${boxSize}" 
               fill="${fillColor}" opacity="${style.fillAlpha}" stroke="${fillColor}" stroke-width="1"/>\n`
      legend += `      <text x="${boxSize + 10}" y="${yOffset + boxSize / 2 + fontSize / 3}" 
               font-size="${fontSize}">${type === 'section-loss' ? 'Section Loss' : 'Hole'}</text>\n`
      
      yOffset += spacing
    })
    
    legend += '    </g>\n'
    return legend
  }

  /**
   * Create DXF layer table
   */
  private createDXFLayers(layers: VectorLayer[]): string {
    let dxf = '0\nTABLE\n2\nLAYER\n'
    
    layers.forEach(layer => {
      dxf += '0\nLAYER\n'
      dxf += `2\n${layer.name}\n`    // Layer name
      dxf += '70\n0\n'                // Standard flags
      dxf += '62\n7\n'                // Color (white)
      dxf += '6\nCONTINUOUS\n'        // Line type
    })
    
    dxf += '0\nENDTAB\n'
    return dxf
  }

  /**
   * Create DXF beam profile entities
   */
  private createDXFBeamProfile(context: VectorExportContext, scale: number): string {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY, width } = dimensions
    const { webHeight, flangeThickness } = beamProfile
    
    const scaledStartX = startX * scale
    const scaledCenterY = centerY * scale
    const scaledWidth = width * scale
    const scaledWebHeight = webHeight * gridSize * scale
    const scaledFlangeThickness = flangeThickness * gridSize * scale
    
    const webTop = scaledCenterY - scaledWebHeight / 2
    const webBottom = scaledCenterY + scaledWebHeight / 2
    const flangeTop = webTop - scaledFlangeThickness
    
    let dxf = ''
    
    // Draw rectangles as polylines
    // Top flange
    dxf += this.createDXFRectangle(
      scaledStartX, flangeTop,
      scaledWidth, scaledFlangeThickness,
      'Beam Profile'
    )
    
    // Web
    dxf += this.createDXFRectangle(
      scaledStartX, webTop,
      scaledWidth, scaledWebHeight,
      'Beam Profile'
    )
    
    // Bottom flange
    dxf += this.createDXFRectangle(
      scaledStartX, webBottom,
      scaledWidth, scaledFlangeThickness,
      'Beam Profile'
    )
    
    return dxf
  }

  /**
   * Create DXF rectangle as closed polyline
   */
  private createDXFRectangle(x: number, y: number, width: number, height: number, layer: string): string {
    let dxf = '0\nLWPOLYLINE\n'
    dxf += `8\n${layer}\n`           // Layer name
    dxf += '90\n5\n'                  // Number of vertices
    dxf += '70\n1\n'                  // Closed polyline
    
    // Vertices
    dxf += `10\n${x}\n20\n${y}\n`
    dxf += `10\n${x + width}\n20\n${y}\n`
    dxf += `10\n${x + width}\n20\n${y + height}\n`
    dxf += `10\n${x}\n20\n${y + height}\n`
    dxf += `10\n${x}\n20\n${y}\n`    // Close the polyline
    
    return dxf
  }

  /**
   * Create DXF defects
   */
  private createDXFDefects(context: VectorExportContext, scale: number): string {
    const { cells, gridSize, dimensions, beamProfile } = context
    const { startX, centerY } = dimensions
    
    let dxf = ''
    
    cells.forEach(cell => {
      const x = startX + cell.col * gridSize
      let y: number
      
      if (cell.zone === 'web') {
        const webBottom = centerY + (beamProfile.webHeight * gridSize) / 2
        y = webBottom - (cell.row + 1) * gridSize
      } else {
        y = cell.zone === 'flange-top'
          ? centerY - (beamProfile.webHeight * gridSize) / 2 - beamProfile.flangeThickness * gridSize
          : centerY + (beamProfile.webHeight * gridSize) / 2
      }
      
      const height = cell.zone === 'web' 
        ? gridSize 
        : beamProfile.flangeThickness * gridSize
      
      dxf += this.createDXFRectangle(
        x * scale,
        y * scale,
        gridSize * scale,
        height * scale,
        'Defects'
      )
    })
    
    return dxf
  }

  /**
   * Create DXF grid
   */
  private createDXFGrid(context: VectorExportContext, scale: number): string {
    const { gridSize, dimensions, beamProfile } = context
    const { startX, centerY, width } = dimensions
    
    let dxf = ''
    const scaledGridSize = gridSize * scale
    const scaledStartX = startX * scale
    const scaledCenterY = centerY * scale
    
    // Calculate grid bounds
    const webHeight = beamProfile.webHeight * gridSize * scale
    const webTop = scaledCenterY - webHeight / 2
    const webBottom = scaledCenterY + webHeight / 2
    
    // Vertical lines
    const cols = Math.ceil(width / gridSize)
    for (let i = 0; i <= cols; i++) {
      const x = scaledStartX + i * scaledGridSize
      dxf += '0\nLINE\n'
      dxf += '8\nGrid\n'
      dxf += `10\n${x}\n20\n${webTop}\n30\n0\n`
      dxf += `11\n${x}\n21\n${webBottom}\n31\n0\n`
    }
    
    // Horizontal lines
    const rows = Math.ceil(beamProfile.webHeight)
    for (let i = 0; i <= rows; i++) {
      const y = webTop + i * scaledGridSize
      dxf += '0\nLINE\n'
      dxf += '8\nGrid\n'
      dxf += `10\n${scaledStartX}\n20\n${y}\n30\n0\n`
      dxf += `11\n${scaledStartX + width * scale}\n21\n${y}\n31\n0\n`
    }
    
    return dxf
  }

  /**
   * Create DXF dimensions
   */
  private createDXFDimensions(context: VectorExportContext, scale: number): string {
    const { beamLength, dimensions, beamProfile, gridSize } = context
    const { startX, centerY, width } = dimensions
    
    const scaledStartX = startX * scale
    const scaledCenterY = centerY * scale
    const scaledWidth = width * scale
    
    let dxf = '0\nDIMENSION\n'
    dxf += '8\nDimensions\n'
    dxf += '2\n*Model_Space\n'
    dxf += '10\n' + scaledStartX + '\n'
    dxf += '20\n' + (scaledCenterY + (beamProfile.webHeight * gridSize * scale) / 2 + 50) + '\n'
    dxf += '30\n0\n'
    dxf += '11\n' + (scaledStartX + scaledWidth) + '\n'
    dxf += '21\n' + (scaledCenterY + (beamProfile.webHeight * gridSize * scale) / 2 + 50) + '\n'
    dxf += '31\n0\n'
    dxf += '1\n' + beamLength + '"\n'
    
    return dxf
  }

  /**
   * Create SVG element from string
   */
  private createSVGElement(svgString: string): SVGElement {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    return doc.documentElement as unknown as SVGElement
  }
}