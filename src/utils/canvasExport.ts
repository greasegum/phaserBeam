import Phaser from 'phaser'

export function exportCanvasAsPNG(scene: Phaser.Scene, filename: string = 'beam-inspection.png') {
  console.log('[CanvasExport] Starting PNG export')
  console.log('[CanvasExport] Scene:', scene)
  console.log('[CanvasExport] Filename:', filename)
  
  try {
    // Get the game canvas
    const sourceCanvas = scene.game.canvas
    console.log('[CanvasExport] Source canvas:', sourceCanvas)
    
    if (!sourceCanvas) {
      console.error('[CanvasExport] No canvas found')
      return
    }
    
    console.log('[CanvasExport] Canvas dimensions:', sourceCanvas.width, 'x', sourceCanvas.height)
    console.log('[CanvasExport] Canvas style dimensions:', sourceCanvas.style.width, 'x', sourceCanvas.style.height)
    
    // Check if canvas has content
    if (sourceCanvas.width === 0 || sourceCanvas.height === 0) {
      console.error('[CanvasExport] Canvas has zero dimensions')
      return
    }
    
    // Check if canvas is visible
    const canvasStyle = window.getComputedStyle(sourceCanvas)
    console.log('[CanvasExport] Canvas visibility:', canvasStyle.visibility)
    console.log('[CanvasExport] Canvas display:', canvasStyle.display)
    
    // Create a new canvas with white background
    const exportCanvas = document.createElement('canvas')
    const ctx = exportCanvas.getContext('2d')!
    
    if (!ctx) {
      console.error('[CanvasExport] Could not get 2D context')
      return
    }
    
    exportCanvas.width = sourceCanvas.width
    exportCanvas.height = sourceCanvas.height
    
    console.log('[CanvasExport] Export canvas dimensions:', exportCanvas.width, 'x', exportCanvas.height)
    
    // Fill with white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    
    // Draw the game canvas on top
    ctx.drawImage(sourceCanvas, 0, 0)
    
    console.log('[CanvasExport] Canvas drawn to export canvas')
    
    // Convert to data URL
    const dataURL = exportCanvas.toDataURL('image/png')
    console.log('[CanvasExport] Data URL generated, length:', dataURL.length)
    
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
    
    console.log('[CanvasExport] PNG export completed successfully')
    
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
  console.log('PDF export not yet implemented')
  return false
}