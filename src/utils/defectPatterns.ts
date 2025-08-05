import Phaser from 'phaser'
import { DefectStyle } from '../types/defects'

export function applyDefectPattern(
  graphics: Phaser.GameObjects.Graphics,
  bounds: { x: number, y: number, width: number, height: number },
  style: DefectStyle
) {
  // Draw base fill
  graphics.fillStyle(style.fillColor, style.fillAlpha)
  graphics.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
  
  // Apply pattern if defined
  if (style.pattern) {
    switch (style.pattern.type) {
      case 'dots':
        drawDotPattern(graphics, bounds, style.pattern)
        break
      case 'diagonal-lines':
        drawDiagonalLines(graphics, bounds, style.pattern)
        break
      case 'cross-hatch':
        drawCrossHatch(graphics, bounds, style.pattern)
        break
    }
  }
  
  // Draw stroke
  if (style.strokeWidth > 0) {
    graphics.lineStyle(style.strokeWidth, style.strokeColor, style.strokeAlpha)
    graphics.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}

function drawDotPattern(
  graphics: Phaser.GameObjects.Graphics,
  bounds: { x: number, y: number, width: number, height: number },
  pattern: { color: number, alpha: number, spacing: number, size?: number }
) {
  const dotSize = pattern.size || 2
  const spacing = pattern.spacing
  
  graphics.fillStyle(pattern.color, pattern.alpha)
  
  for (let y = bounds.y + spacing / 2; y < bounds.y + bounds.height; y += spacing) {
    for (let x = bounds.x + spacing / 2; x < bounds.x + bounds.width; x += spacing) {
      graphics.fillCircle(x, y, dotSize)
    }
  }
}

function drawDiagonalLines(
  graphics: Phaser.GameObjects.Graphics,
  bounds: { x: number, y: number, width: number, height: number },
  pattern: { color: number, alpha: number, spacing: number, angle?: number, lineWidth?: number }
) {
  const angle = (pattern.angle || 45) * Math.PI / 180
  const lineWidth = pattern.lineWidth || 1
  const spacing = pattern.spacing
  
  graphics.lineStyle(lineWidth, pattern.color, pattern.alpha)
  
  // Calculate the diagonal length needed to cover the rectangle
  const diagonal = Math.sqrt(bounds.width * bounds.width + bounds.height * bounds.height)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  
  // Start position offset to ensure full coverage
  const startOffset = -diagonal
  
  for (let offset = startOffset; offset < diagonal * 2; offset += spacing) {
    // Calculate line endpoints
    const perpX = offset * Math.cos(angle + Math.PI / 2)
    const perpY = offset * Math.sin(angle + Math.PI / 2)
    
    const x1 = bounds.x + bounds.width / 2 + perpX - diagonal * cos
    const y1 = bounds.y + bounds.height / 2 + perpY - diagonal * sin
    const x2 = bounds.x + bounds.width / 2 + perpX + diagonal * cos
    const y2 = bounds.y + bounds.height / 2 + perpY + diagonal * sin
    
    // Clip line to bounds
    const clipped = clipLine(x1, y1, x2, y2, bounds)
    if (clipped) {
      graphics.beginPath()
      graphics.moveTo(clipped.x1, clipped.y1)
      graphics.lineTo(clipped.x2, clipped.y2)
      graphics.strokePath()
    }
  }
}

function drawCrossHatch(
  graphics: Phaser.GameObjects.Graphics,
  bounds: { x: number, y: number, width: number, height: number },
  pattern: { color: number, alpha: number, spacing: number, angle?: number, lineWidth?: number }
) {
  // Draw diagonal lines in both directions
  drawDiagonalLines(graphics, bounds, pattern)
  drawDiagonalLines(graphics, bounds, { ...pattern, angle: -(pattern.angle || 45) })
}

function clipLine(
  x1: number, y1: number, x2: number, y2: number,
  bounds: { x: number, y: number, width: number, height: number }
): { x1: number, y1: number, x2: number, y2: number } | null {
  // Cohen-Sutherland line clipping algorithm
  const INSIDE = 0
  const LEFT = 1
  const RIGHT = 2
  const BOTTOM = 4
  const TOP = 8
  
  const xmin = bounds.x
  const xmax = bounds.x + bounds.width
  const ymin = bounds.y
  const ymax = bounds.y + bounds.height
  
  function computeOutCode(x: number, y: number): number {
    let code = INSIDE
    if (x < xmin) code |= LEFT
    else if (x > xmax) code |= RIGHT
    if (y < ymin) code |= TOP
    else if (y > ymax) code |= BOTTOM
    return code
  }
  
  let outcode0 = computeOutCode(x1, y1)
  let outcode1 = computeOutCode(x2, y2)
  let accept = false
  
  while (true) {
    if (!(outcode0 | outcode1)) {
      accept = true
      break
    } else if (outcode0 & outcode1) {
      break
    } else {
      let x = 0, y = 0
      const outcodeOut = outcode0 ? outcode0 : outcode1
      
      if (outcodeOut & TOP) {
        x = x1 + (x2 - x1) * (ymin - y1) / (y2 - y1)
        y = ymin
      } else if (outcodeOut & BOTTOM) {
        x = x1 + (x2 - x1) * (ymax - y1) / (y2 - y1)
        y = ymax
      } else if (outcodeOut & RIGHT) {
        y = y1 + (y2 - y1) * (xmax - x1) / (x2 - x1)
        x = xmax
      } else if (outcodeOut & LEFT) {
        y = y1 + (y2 - y1) * (xmin - x1) / (x2 - x1)
        x = xmin
      }
      
      if (outcodeOut === outcode0) {
        x1 = x
        y1 = y
        outcode0 = computeOutCode(x1, y1)
      } else {
        x2 = x
        y2 = y
        outcode1 = computeOutCode(x2, y2)
      }
    }
  }
  
  return accept ? { x1, y1, x2, y2 } : null
}