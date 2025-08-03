import Phaser from 'phaser'
import { Point } from './marchingSquares'

export function drawBezierContour(
  graphics: Phaser.GameObjects.Graphics,
  contour: Point[],
  closed: boolean = true
): void {
  if (contour.length < 2) return
  
  // For very smooth curves, we'll use a simple curve interpolation
  // that works reliably with Phaser 3's graphics API
  
  graphics.beginPath()
  
  if (contour.length === 2) {
    // Just draw a line for 2 points
    graphics.moveTo(contour[0].x, contour[0].y)
    graphics.lineTo(contour[1].x, contour[1].y)
  } else {
    // Create smooth curve by interpolating between points
    const smoothness = 0.2 // How much to smooth (0 = straight lines, 1 = very smooth)
    const points: Point[] = []
    
    // Generate smooth curve points
    for (let i = 0; i < contour.length; i++) {
      const p0 = contour[(i - 1 + contour.length) % contour.length]
      const p1 = contour[i]
      const p2 = contour[(i + 1) % contour.length]
      const p3 = contour[(i + 2) % contour.length]
      
      // Catmull-Rom spline interpolation
      for (let t = 0; t < 1; t += 0.1) {
        const t2 = t * t
        const t3 = t2 * t
        
        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        )
        
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        )
        
        points.push({ x, y })
      }
    }
    
    // Draw the smooth curve
    graphics.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y)
    }
    
    if (closed) {
      graphics.lineTo(points[0].x, points[0].y)
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