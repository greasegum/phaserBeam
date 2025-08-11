import Phaser from 'phaser'
import { logger } from './Result'

export function exportCanvasAsPNG(scene: Phaser.Scene, filename: string = 'beam-inspection.png') {
  logger.info('Starting PNG export', { scene: scene.scene.key, filename })
  
  try {
    // Use Phaser's built-in screenshot functionality
    const game = scene.game
    if (!game) {
      logger.error('No game instance found for PNG export')
      return
    }
    
    // Take a screenshot using Phaser's built-in method
    game.renderer.snapshot((snapshot: HTMLImageElement | Phaser.Display.Color) => {
      logger.debug('Screenshot captured for PNG export')
      
      // Check if we got an image (not a color)
      if (snapshot instanceof HTMLImageElement) {
        // Create a canvas to draw the screenshot
        const exportCanvas = document.createElement('canvas')
        const ctx = exportCanvas.getContext('2d')!
        
        exportCanvas.width = snapshot.width
        exportCanvas.height = snapshot.height
        
        logger.debug('Export canvas created', { width: exportCanvas.width, height: exportCanvas.height })
        
        // Fill with white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
        
        // Draw the screenshot
        ctx.drawImage(snapshot, 0, 0)
        
        logger.debug('Screenshot drawn to export canvas')
        
        // Convert to data URL
        const dataURL = exportCanvas.toDataURL('image/png')
        logger.debug('Data URL generated for PNG export', { dataUrlLength: dataURL.length })
        
        if (dataURL.length < 100) {
          console.error('[CanvasExport] Data URL too short, export may have failed')
          return
        }
        
        // Create a download link
        const link = document.createElement('a')
        link.download = filename
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        logger.info('PNG export completed successfully', { filename })
      } else {
        console.error('[CanvasExport] Screenshot returned a color instead of an image')
      }
    })
    
  } catch (error) {
    console.error('[CanvasExport] Error during PNG export:', error)
  }
}

export function exportCanvasAsSVG(scene: Phaser.Scene, filename: string = 'beam-inspection.svg') {
  // For SVG export, we need to recreate the scene as SVG
  // This is more complex and would require custom rendering
  // For now, we'll create a basic SVG with the canvas as an embedded image
  
  const canvas = scene.game.canvas
  const width = canvas.width
  const height = canvas.height
  
  // Convert canvas to data URL
  const dataURL = canvas.toDataURL('image/png')
  
  // Create SVG with embedded image
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image x="0" y="0" width="${width}" height="${height}" 
         xlink:href="${dataURL}" />
</svg>`
  
  // Create blob and download
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up
  URL.revokeObjectURL(url)
}

export function exportCanvasAsPDF(scene: Phaser.Scene, filename: string = 'beam-inspection.pdf') {
  // PDF export would require a library like jsPDF
  // This is a placeholder for future implementation
  logger.warn('PDF export not yet implemented')
  return false
}