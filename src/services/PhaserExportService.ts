import { ExportService, ExportOptions, ExportResult } from './ExportService'

/**
 * Enhanced export service that can capture directly from Phaser scene
 */
export class PhaserExportService extends ExportService {
  private scene: Phaser.Scene | null = null
  
  constructor(scene?: Phaser.Scene) {
    super()
    this.scene = scene || null
  }
  
  /**
   * Set the Phaser scene for direct capture
   */
  setScene(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  /**
   * Capture the current Phaser scene as an image
   */
  async captureSceneAsImage(
    format: 'png' | 'jpeg' = 'png',
    quality: number = 0.92
  ): Promise<ExportResult> {
    if (!this.scene || !this.scene.game) {
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: 'No Phaser scene available'
      }
    }
    
    return new Promise((resolve) => {
      try {
        // Use Phaser's snapshot functionality
        this.scene.game.renderer.snapshot((image: HTMLImageElement) => {
          // Convert image to canvas for processing
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          
          canvas.width = image.width
          canvas.height = image.height
          ctx.drawImage(image, 0, 0)
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  success: true,
                  data: blob,
                  fileName: `beam-inspection-${Date.now()}.${format}`,
                  mimeType: format === 'png' ? 'image/png' : 'image/jpeg'
                })
              } else {
                resolve({
                  success: false,
                  fileName: '',
                  mimeType: '',
                  error: 'Failed to create image from scene'
                })
              }
            },
            format === 'png' ? 'image/png' : 'image/jpeg',
            quality
          )
        })
      } catch (error) {
        resolve({
          success: false,
          fileName: '',
          mimeType: '',
          error: error instanceof Error ? error.message : 'Failed to capture scene'
        })
      }
    })
  }
  
  /**
   * Capture a specific region of the Phaser scene
   */
  async captureSceneRegion(
    x: number,
    y: number,
    width: number,
    height: number,
    format: 'png' | 'jpeg' = 'png',
    quality: number = 0.92
  ): Promise<ExportResult> {
    if (!this.scene || !this.scene.game) {
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: 'No Phaser scene available'
      }
    }
    
    return new Promise((resolve) => {
      try {
        // Capture specific region using snapshotArea
        this.scene.game.renderer.snapshotArea(
          x,
          y,
          width,
          height,
          (image: HTMLImageElement) => {
            // Convert image to canvas
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            
            canvas.width = width
            canvas.height = height
            ctx.drawImage(image, 0, 0)
            
            // Convert to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve({
                    success: true,
                    data: blob,
                    fileName: `beam-inspection-${Date.now()}.${format}`,
                    mimeType: format === 'png' ? 'image/png' : 'image/jpeg'
                  })
                } else {
                  resolve({
                    success: false,
                    fileName: '',
                    mimeType: '',
                    error: 'Failed to create image from region'
                  })
                }
              },
              format === 'png' ? 'image/png' : 'image/jpeg',
              quality
            )
          }
        )
      } catch (error) {
        resolve({
          success: false,
          fileName: '',
          mimeType: '',
          error: error instanceof Error ? error.message : 'Failed to capture region'
        })
      }
    })
  }
  
  /**
   * Export with high resolution by scaling the scene
   */
  async exportHighResolution(
    scale: number = 2,
    format: 'png' | 'jpeg' = 'png',
    quality: number = 0.92
  ): Promise<ExportResult> {
    if (!this.scene || !this.scene.game) {
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: 'No Phaser scene available'
      }
    }
    
    // Save current camera zoom
    const camera = this.scene.cameras.main
    const originalZoom = camera.zoom
    const originalScrollX = camera.scrollX
    const originalScrollY = camera.scrollY
    
    try {
      // Temporarily increase resolution
      camera.setZoom(originalZoom * scale)
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Capture at higher resolution
      const result = await this.captureSceneAsImage(format, quality)
      
      // Restore original zoom
      camera.setZoom(originalZoom)
      camera.setScroll(originalScrollX, originalScrollY)
      
      return result
    } catch (error) {
      // Restore zoom on error
      camera.setZoom(originalZoom)
      camera.setScroll(originalScrollX, originalScrollY)
      
      return {
        success: false,
        fileName: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Failed to export high resolution'
      }
    }
  }
  
  /**
   * Export scene with overlays and annotations
   */
  async exportWithOverlays(
    options: ExportOptions & {
      title?: string
      subtitle?: string
      footer?: string
      watermark?: string
      scale?: number
    }
  ): Promise<ExportResult> {
    // First capture the scene
    const sceneCapture = await this.captureSceneAsImage('png')
    
    if (!sceneCapture.success || !sceneCapture.data) {
      return sceneCapture
    }
    
    // Convert blob to image
    const url = URL.createObjectURL(sceneCapture.data as Blob)
    const img = new Image()
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Create canvas with padding for overlays
        const padding = 50
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        canvas.width = img.width + padding * 2
        canvas.height = img.height + padding * 2 + 100 // Extra space for title/footer
        
        // Draw background
        ctx.fillStyle = options.background || '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw title
        if (options.title) {
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 24px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(options.title, canvas.width / 2, 40)
        }
        
        // Draw subtitle
        if (options.subtitle) {
          ctx.fillStyle = '#666666'
          ctx.font = '16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(options.subtitle, canvas.width / 2, 65)
        }
        
        // Draw scene image
        ctx.drawImage(img, padding, padding + 50)
        
        // Draw border
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        ctx.strokeRect(padding, padding + 50, img.width, img.height)
        
        // Draw footer
        if (options.footer) {
          ctx.fillStyle = '#666666'
          ctx.font = '14px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(options.footer, canvas.width / 2, canvas.height - 20)
        }
        
        // Draw watermark
        if (options.watermark) {
          ctx.save()
          ctx.globalAlpha = 0.3
          ctx.fillStyle = '#999999'
          ctx.font = 'bold 48px Arial'
          ctx.textAlign = 'center'
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate(-Math.PI / 6)
          ctx.fillText(options.watermark, 0, 0)
          ctx.restore()
        }
        
        // Add timestamp
        const timestamp = new Date().toLocaleString()
        ctx.fillStyle = '#999999'
        ctx.font = '10px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(timestamp, canvas.width - 10, canvas.height - 5)
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            
            if (blob) {
              resolve({
                success: true,
                data: blob,
                fileName: options.fileName || `beam-inspection-${Date.now()}.${options.format}`,
                mimeType: options.format === 'jpeg' ? 'image/jpeg' : 'image/png'
              })
            } else {
              resolve({
                success: false,
                fileName: '',
                mimeType: '',
                error: 'Failed to create image with overlays'
              })
            }
          },
          options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
          options.quality
        )
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({
          success: false,
          fileName: '',
          mimeType: '',
          error: 'Failed to load scene image'
        })
      }
      
      img.src = url
    })
  }
  
  /**
   * Create a print-ready PDF with multiple views
   */
  async exportPrintReady(options: {
    orientation?: 'portrait' | 'landscape'
    paperSize?: 'letter' | 'a4' | 'legal'
    includeReport?: boolean
  } = {}): Promise<ExportResult> {
    // This would require jsPDF library
    // Implementation would create a multi-page PDF with:
    // - Cover page with project info
    // - Full beam view
    // - Detailed defect areas
    // - Statistics and summary
    // - Annotations page
    
    return {
      success: false,
      fileName: '',
      mimeType: '',
      error: 'PDF export requires jsPDF library. Use SVG export for vector output.'
    }
  }
}