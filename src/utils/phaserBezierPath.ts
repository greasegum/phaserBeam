import Phaser from 'phaser'
import { Point } from './marchingSquaresOptimized'

export function drawBezierContour(
  graphics: Phaser.GameObjects.Graphics,
  contour: Point[],
  closed: boolean = true
): void {
  if (contour.length < 2) return
  
  graphics.beginPath()
  graphics.moveTo(contour[0].x, contour[0].y)
  
  if (contour.length === 2) {
    // Just draw a line for 2 points
    graphics.lineTo(contour[1].x, contour[1].y)
  } else {
    // Draw smooth curve through points using quadratic Bézier curves
    for (let i = 0; i < contour.length - 1; i++) {
      const p0 = contour[i]
      const p1 = contour[i + 1]
      const p2 = contour[i + 2] || (closed ? contour[0] : p1)
      
      // Calculate control point for smooth curve
      const cp1x = p0.x + (p1.x - p0.x) * 0.5
      const cp1y = p0.y + (p1.y - p0.y) * 0.5
      
      const cp2x = p1.x - (p2.x - p0.x) * 0.125
      const cp2y = p1.y - (p2.y - p0.y) * 0.125
      
      // Use Phaser's bezierTo method
      graphics.bezierTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y)
    }
    
    // Close the path if needed
    if (closed && contour.length > 2) {
      const last = contour[contour.length - 1]
      const first = contour[0]
      const second = contour[1]
      
      const cp1x = last.x + (first.x - last.x) * 0.5
      const cp1y = last.y + (first.y - last.y) * 0.5
      
      const cp2x = first.x - (second.x - last.x) * 0.125
      const cp2y = first.y - (second.y - last.y) * 0.125
      
      graphics.bezierTo(cp1x, cp1y, cp2x, cp2y, first.x, first.y)
    }
  }
  
  if (closed) {
    graphics.closePath()
  }
  
  graphics.fillPath()
  graphics.strokePath()
}

export function drawCatmullRomContour(
  graphics: Phaser.GameObjects.Graphics,
  contour: Point[],
  closed: boolean = true,
  tension: number = 0.5
): void {
  if (contour.length < 3) {
    // Fall back to simple line drawing
    graphics.beginPath()
    graphics.moveTo(contour[0].x, contour[0].y)
    if (contour.length === 2) {
      graphics.lineTo(contour[1].x, contour[1].y)
    }
    graphics.strokePath()
    return
  }
  
  const points: number[] = []
  contour.forEach(p => {
    points.push(p.x, p.y)
  })
  
  // Create a Catmull-Rom spline
  const curve = new Phaser.Curves.Spline(points)
  
  // Draw the curve
  graphics.beginPath()
  const resolution = Math.max(20, contour.length * 4) // More points for smoother curves
  const pointsOnCurve = curve.getPoints(resolution)
  
  pointsOnCurve.forEach((point, index) => {
    if (index === 0) {
      graphics.moveTo(point.x, point.y)
    } else {
      graphics.lineTo(point.x, point.y)
    }
  })
  
  if (closed) {
    graphics.closePath()
  }
  
  graphics.fillPath()
  graphics.strokePath()
}