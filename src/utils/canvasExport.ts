import Phaser from 'phaser'

export function exportCanvasAsPNG(scene: Phaser.Scene, filename: string = 'beam-inspection.png') {
  // Get the game canvas
  const sourceCanvas = scene.game.canvas
  
  // Create a new canvas with white background
  const exportCanvas = document.createElement('canvas')
  const ctx = exportCanvas.getContext('2d')!
  
  exportCanvas.width = sourceCanvas.width
  exportCanvas.height = sourceCanvas.height
  
  // Fill with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  
  // Draw the game canvas on top
  ctx.drawImage(sourceCanvas, 0, 0)
  
  // Convert to data URL
  const dataURL = exportCanvas.toDataURL('image/png')
  
  // Create a download link
  const link = document.createElement('a')
  link.download = filename
  link.href = dataURL
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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