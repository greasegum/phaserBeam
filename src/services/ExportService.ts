import { BeamProfile, GridCell } from '../types/beam'
import { DefectType } from '../types/defects'

export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf' | 'dxf' | 'json'

export interface ExportOptions {
  format: ExportFormat
  scale?: number
  quality?: number // For JPEG
  background?: string // Background color
  includeGrid?: boolean
  includeAnnotations?: boolean
  includeDimensions?: boolean
  includeMetadata?: boolean
  fileName?: string
}

export interface ExportResult {
  success: boolean
  data?: Blob | string
  fileName: string
  mimeType: string
  error?: string
}

interface DrawingContext {
  beamProfile: BeamProfile
  cells: GridCell[]
  defectTypes: Map<string, DefectType>
  annotations?: any[]
  gridSize: number
  dimensions: {
    startX: number
    centerY: number
    width: number
    height: number
  }
}

/**
 * Service for exporting beam inspection data in various formats
 */
export class ExportService {
  /**
   * Export inspection data in the specified format
   */
  async export(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'png':
          return await this.exportPNG(context, options)
        case 'jpeg':
          return await this.exportJPEG(context, options)
        case 'svg':
          return await this.exportSVG(context, options)
        case 'pdf':
          return await this.exportPDF(context, options)
        case 'dxf':
          return await this.exportDXF(context, options)
        case 'json':
          return await this.exportJSON(context, options)
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Export as PNG image
   */
  private async exportPNG(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    const canvas = this.createCanvas(context, options)
    
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              fileName: options.fileName || `beam-inspection-${Date.now()}.png`,
              mimeType: 'image/png'
            })
          } else {
            resolve({
              success: false,
              fileName: '',
              mimeType: '',
              error: 'Failed to create PNG'
            })
          }
        },
        'image/png'
      )
    })
  }

  /**
   * Export as JPEG image
   */
  private async exportJPEG(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    const canvas = this.createCanvas(context, options)
    const quality = options.quality || 0.92
    
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              data: blob,
              fileName: options.fileName || `beam-inspection-${Date.now()}.jpg`,
              mimeType: 'image/jpeg'
            })
          } else {
            resolve({
              success: false,
              fileName: '',
              mimeType: '',
              error: 'Failed to create JPEG'
            })
          }
        },
        'image/jpeg',
        quality
      )
    })
  }

  /**
   * Create a canvas with the beam drawing
   */
  private createCanvas(context: DrawingContext, options: ExportOptions): HTMLCanvasElement {
    const scale = options.scale || 1
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    const { beamProfile, dimensions, gridSize } = context
    
    // Set canvas size
    const padding = 100
    canvas.width = (dimensions.width + padding * 2) * scale
    canvas.height = (dimensions.height + padding * 2) * scale
    
    // Scale context
    ctx.scale(scale, scale)
    
    // Draw background - default to white if not specified
    ctx.fillStyle = options.background || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw beam profile
    this.drawBeamProfile(ctx, context)
    
    // Draw section loss
    this.drawSectionLoss(ctx, context)
    
    // Draw grid if requested
    if (options.includeGrid) {
      this.drawGrid(ctx, context)
    }
    
    // Draw annotations if requested
    if (options.includeAnnotations && context.annotations) {
      this.drawAnnotations(ctx, context)
    }
    
    // Draw dimensions if requested
    if (options.includeDimensions) {
      this.drawDimensions(ctx, context)
    }
    
    return canvas
  }

  /**
   * Draw beam profile on canvas
   */
  private drawBeamProfile(ctx: CanvasRenderingContext2D, context: DrawingContext) {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY } = dimensions
    const { webHeight, flangeWidth, flangeThickness } = beamProfile
    
    const webTop = centerY - (webHeight * gridSize) / 2
    const webBottom = centerY + (webHeight * gridSize) / 2
    const flangeTop = webTop - flangeThickness * gridSize
    const beamWidth = dimensions.width
    
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.fillStyle = '#f0f0f0'
    
    // Draw top flange
    ctx.fillRect(startX, flangeTop, beamWidth, flangeThickness * gridSize)
    ctx.strokeRect(startX, flangeTop, beamWidth, flangeThickness * gridSize)
    
    // Draw web
    ctx.fillRect(startX, webTop, beamWidth, webHeight * gridSize)
    ctx.strokeRect(startX, webTop, beamWidth, webHeight * gridSize)
    
    // Draw bottom flange
    ctx.fillRect(startX, webBottom, beamWidth, flangeThickness * gridSize)
    ctx.strokeRect(startX, webBottom, beamWidth, flangeThickness * gridSize)
  }

  /**
   * Draw section loss areas
   */
  private drawSectionLoss(ctx: CanvasRenderingContext2D, context: DrawingContext) {
    const { cells, defectTypes, dimensions, gridSize } = context
    const { startX, centerY } = dimensions
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 1
    
    cells.forEach(cell => {
      const key = `${cell.zone || 'web'}_${cell.x}_${cell.y}`
      const defectType = defectTypes.get(key) || 'section-loss'
      
      // Set color based on defect type
      switch (defectType) {
        case 'hole':
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          break
        case 'section-loss':
        default:
          ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
          break
      }
      
      const x = startX + cell.x * gridSize
      const y = centerY - (context.beamProfile.webHeight * gridSize) / 2 + cell.y * gridSize
      
      ctx.fillRect(x, y, gridSize, gridSize)
      ctx.strokeRect(x, y, gridSize, gridSize)
    })
  }

  /**
   * Draw grid overlay
   */
  private drawGrid(ctx: CanvasRenderingContext2D, context: DrawingContext) {
    const { dimensions, gridSize, beamProfile } = context
    const { startX, centerY, width } = dimensions
    const webTop = centerY - (beamProfile.webHeight * gridSize) / 2
    
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)'
    ctx.lineWidth = 0.5
    
    // Vertical lines
    for (let x = startX; x <= startX + width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, webTop)
      ctx.lineTo(x, webTop + beamProfile.webHeight * gridSize)
      ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = 0; y <= beamProfile.webHeight; y++) {
      const yPos = webTop + y * gridSize
      ctx.beginPath()
      ctx.moveTo(startX, yPos)
      ctx.lineTo(startX + width, yPos)
      ctx.stroke()
    }
  }

  /**
   * Draw annotations
   */
  private drawAnnotations(ctx: CanvasRenderingContext2D, context: DrawingContext) {
    // Implementation would depend on annotation format
    // This is a placeholder
    ctx.fillStyle = '#000'
    ctx.font = '12px Arial'
    
    context.annotations?.forEach(annotation => {
      if (annotation.type === 'text') {
        ctx.fillText(annotation.text, annotation.x, annotation.y)
      }
    })
  }

  /**
   * Draw dimensions
   */
  private drawDimensions(ctx: CanvasRenderingContext2D, context: DrawingContext) {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY, width } = dimensions
    
    ctx.strokeStyle = '#666'
    ctx.fillStyle = '#666'
    ctx.font = '10px Arial'
    ctx.lineWidth = 1
    
    // Beam length dimension
    const dimY = centerY + (beamProfile.webHeight * gridSize) / 2 + 50
    
    // Draw dimension line
    ctx.beginPath()
    ctx.moveTo(startX, dimY)
    ctx.lineTo(startX + width, dimY)
    ctx.stroke()
    
    // Draw end ticks
    ctx.beginPath()
    ctx.moveTo(startX, dimY - 5)
    ctx.lineTo(startX, dimY + 5)
    ctx.moveTo(startX + width, dimY - 5)
    ctx.lineTo(startX + width, dimY + 5)
    ctx.stroke()
    
    // Draw dimension text
    const lengthText = `${(width / gridSize).toFixed(0)}"`
    const textWidth = ctx.measureText(lengthText).width
    ctx.fillText(lengthText, startX + width / 2 - textWidth / 2, dimY - 5)
  }

  /**
   * Export as SVG vector graphics
   */
  private async exportSVG(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    const svg = this.createSVG(context, options)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    
    return {
      success: true,
      data: blob,
      fileName: options.fileName || `beam-inspection-${Date.now()}.svg`,
      mimeType: 'image/svg+xml'
    }
  }

  /**
   * Create SVG string
   */
  private createSVG(context: DrawingContext, options: ExportOptions): string {
    const { beamProfile, cells, defectTypes, dimensions, gridSize } = context
    const scale = options.scale || 1
    const padding = 100
    
    const width = (dimensions.width + padding * 2) * scale
    const height = (dimensions.height + padding * 2) * scale
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g transform="scale(${scale})">
`
    
    // Add background - default to white unless transparent
    const bgColor = options.background || '#ffffff'
    svg += `    <rect width="${width}" height="${height}" fill="${bgColor}"/>\n`
    
    // Add beam profile
    svg += this.createSVGBeamProfile(context)
    
    // Add section loss
    svg += this.createSVGSectionLoss(context)
    
    // Add grid if requested
    if (options.includeGrid) {
      svg += this.createSVGGrid(context)
    }
    
    // Add dimensions if requested
    if (options.includeDimensions) {
      svg += this.createSVGDimensions(context)
    }
    
    svg += `  </g>
</svg>`
    
    return svg
  }

  /**
   * Create SVG beam profile elements
   */
  private createSVGBeamProfile(context: DrawingContext): string {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY } = dimensions
    const { webHeight, flangeWidth, flangeThickness } = beamProfile
    
    const webTop = centerY - (webHeight * gridSize) / 2
    const webBottom = centerY + (webHeight * gridSize) / 2
    const flangeTop = webTop - flangeThickness * gridSize
    const beamWidth = dimensions.width
    
    return `
    <!-- Beam Profile -->
    <g id="beam-profile">
      <!-- Top Flange -->
      <rect x="${startX}" y="${flangeTop}" width="${beamWidth}" height="${flangeThickness * gridSize}" 
            fill="#f0f0f0" stroke="#333" stroke-width="2"/>
      <!-- Web -->
      <rect x="${startX}" y="${webTop}" width="${beamWidth}" height="${webHeight * gridSize}" 
            fill="#f0f0f0" stroke="#333" stroke-width="2"/>
      <!-- Bottom Flange -->
      <rect x="${startX}" y="${webBottom}" width="${beamWidth}" height="${flangeThickness * gridSize}" 
            fill="#f0f0f0" stroke="#333" stroke-width="2"/>
    </g>
`
  }

  /**
   * Create SVG section loss elements
   */
  private createSVGSectionLoss(context: DrawingContext): string {
    const { cells, defectTypes, dimensions, gridSize, beamProfile } = context
    const { startX, centerY } = dimensions
    const webTop = centerY - (beamProfile.webHeight * gridSize) / 2
    
    let svg = '    <!-- Section Loss -->\n    <g id="section-loss">\n'
    
    cells.forEach(cell => {
      const key = `${cell.zone || 'web'}_${cell.x}_${cell.y}`
      const defectType = defectTypes.get(key) || 'section-loss'
      
      let fillColor = 'rgba(255, 0, 0, 0.3)'
      switch (defectType) {
        case 'hole':
          fillColor = 'rgba(0, 0, 0, 0.8)'
          break
        case 'section-loss':
        default:
          fillColor = 'rgba(255, 0, 0, 0.3)'
          break
      }
      
      const x = startX + cell.x * gridSize
      const y = webTop + cell.y * gridSize
      
      svg += `      <rect x="${x}" y="${y}" width="${gridSize}" height="${gridSize}" 
            fill="${fillColor}" stroke="#ff0000" stroke-width="1"/>\n`
    })
    
    svg += '    </g>\n'
    return svg
  }

  /**
   * Create SVG grid elements
   */
  private createSVGGrid(context: DrawingContext): string {
    const { dimensions, gridSize, beamProfile } = context
    const { startX, centerY, width } = dimensions
    const webTop = centerY - (beamProfile.webHeight * gridSize) / 2
    const webHeight = beamProfile.webHeight * gridSize
    
    let svg = '    <!-- Grid -->\n    <g id="grid" stroke="rgba(128,128,128,0.3)" stroke-width="0.5">\n'
    
    // Vertical lines
    for (let x = startX; x <= startX + width; x += gridSize) {
      svg += `      <line x1="${x}" y1="${webTop}" x2="${x}" y2="${webTop + webHeight}"/>\n`
    }
    
    // Horizontal lines
    for (let y = 0; y <= beamProfile.webHeight; y++) {
      const yPos = webTop + y * gridSize
      svg += `      <line x1="${startX}" y1="${yPos}" x2="${startX + width}" y2="${yPos}"/>\n`
    }
    
    svg += '    </g>\n'
    return svg
  }

  /**
   * Create SVG dimension elements
   */
  private createSVGDimensions(context: DrawingContext): string {
    const { beamProfile, dimensions, gridSize } = context
    const { startX, centerY, width } = dimensions
    const dimY = centerY + (beamProfile.webHeight * gridSize) / 2 + 50
    const lengthText = `${(width / gridSize).toFixed(0)}"`
    
    return `
    <!-- Dimensions -->
    <g id="dimensions" stroke="#666" fill="#666" font-family="Arial" font-size="10">
      <line x1="${startX}" y1="${dimY}" x2="${startX + width}" y2="${dimY}" stroke-width="1"/>
      <line x1="${startX}" y1="${dimY - 5}" x2="${startX}" y2="${dimY + 5}" stroke-width="1"/>
      <line x1="${startX + width}" y1="${dimY - 5}" x2="${startX + width}" y2="${dimY + 5}" stroke-width="1"/>
      <text x="${startX + width / 2}" y="${dimY - 5}" text-anchor="middle">${lengthText}</text>
    </g>
`
  }

  /**
   * Export as PDF document
   */
  private async exportPDF(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    // This would require a PDF library like jsPDF
    // For now, return a placeholder
    return {
      success: false,
      fileName: '',
      mimeType: '',
      error: 'PDF export requires jsPDF library'
    }
  }

  /**
   * Export as DXF for CAD software
   */
  private async exportDXF(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    const dxf = this.createDXF(context, options)
    const blob = new Blob([dxf], { type: 'application/dxf' })
    
    return {
      success: true,
      data: blob,
      fileName: options.fileName || `beam-inspection-${Date.now()}.dxf`,
      mimeType: 'application/dxf'
    }
  }

  /**
   * Create DXF file content
   */
  private createDXF(context: DrawingContext, options: ExportOptions): string {
    const { beamProfile, cells, dimensions, gridSize } = context
    const { startX, centerY } = dimensions
    
    let dxf = '0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n'
    
    // Add beam profile as polylines
    const webTop = centerY - (beamProfile.webHeight * gridSize) / 2
    const webBottom = centerY + (beamProfile.webHeight * gridSize) / 2
    const flangeTop = webTop - beamProfile.flangeThickness * gridSize
    const beamWidth = dimensions.width
    
    // Top flange
    dxf += this.createDXFRectangle(startX, flangeTop, beamWidth, beamProfile.flangeThickness * gridSize, 'BEAM')
    
    // Web
    dxf += this.createDXFRectangle(startX, webTop, beamWidth, beamProfile.webHeight * gridSize, 'BEAM')
    
    // Bottom flange
    dxf += this.createDXFRectangle(startX, webBottom, beamWidth, beamProfile.flangeThickness * gridSize, 'BEAM')
    
    // Add section loss areas
    cells.forEach(cell => {
      const x = startX + cell.x * gridSize
      const y = webTop + cell.y * gridSize
      dxf += this.createDXFRectangle(x, y, gridSize, gridSize, 'DEFECTS')
    })
    
    dxf += '0\nENDSEC\n0\nEOF\n'
    
    return dxf
  }

  /**
   * Create DXF rectangle (closed polyline)
   */
  private createDXFRectangle(x: number, y: number, width: number, height: number, layer: string): string {
    return `0
POLYLINE
8
${layer}
66
1
10
0.0
20
0.0
30
0.0
0
VERTEX
8
${layer}
10
${x}
20
${y}
0
VERTEX
8
${layer}
10
${x + width}
20
${y}
0
VERTEX
8
${layer}
10
${x + width}
20
${y + height}
0
VERTEX
8
${layer}
10
${x}
20
${y + height}
0
VERTEX
8
${layer}
10
${x}
20
${y}
0
SEQEND
`
  }

  /**
   * Export as JSON data
   */
  private async exportJSON(
    context: DrawingContext,
    options: ExportOptions
  ): Promise<ExportResult> {
    const data = {
      timestamp: new Date().toISOString(),
      beamProfile: context.beamProfile,
      cells: context.cells,
      defectTypes: Array.from(context.defectTypes.entries()),
      annotations: context.annotations,
      metadata: {
        gridSize: context.gridSize,
        dimensions: context.dimensions,
        exportOptions: options
      }
    }
    
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    
    return {
      success: true,
      data: blob,
      fileName: options.fileName || `beam-inspection-${Date.now()}.json`,
      mimeType: 'application/json'
    }
  }

  /**
   * Download file to user's computer
   */
  static downloadFile(result: ExportResult) {
    if (!result.success || !result.data) {
      console.error('Export failed:', result.error)
      return
    }
    
    const url = URL.createObjectURL(result.data as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}