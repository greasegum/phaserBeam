import Phaser from 'phaser'
import { OrdinateDimension } from '../types/annotations'

export class OrdinateDimensionRenderer {
  private scene: Phaser.Scene
  private gridSize: number = 30 // pixels per inch
  
  constructor(scene: Phaser.Scene, gridSize: number = 30) {
    this.scene = scene
    this.gridSize = gridSize
  }
  
  render(dimension: OrdinateDimension, container: Phaser.GameObjects.Container, isSystemGenerated: boolean = false): void {
    const { measurePoint, originSide, jogOffset, style, beamLength, beamBottom } = dimension
    
    const graphics = this.scene.add.graphics()
    
    // Use grey color for system-generated dimensions
    const color = isSystemGenerated ? 0x888888 : style.color
    const textColor = isSystemGenerated ? '#888888' : style.textColor
    
    graphics.lineStyle(style.lineWidth, color)
    
    // Calculate origin point based on side
    const originX = originSide === 'left' ? measurePoint.x - (measurePoint.gridX || 0) * this.gridSize : measurePoint.x + (beamLength - (measurePoint.gridX || 0)) * this.gridSize
    
    // Calculate dimension value
    const distanceInGridUnits = originSide === 'left' 
      ? (measurePoint.gridX || 0)
      : beamLength - (measurePoint.gridX || 0)
    
    let text = dimension.text
    if (dimension.autoText) {
      const value = Math.abs(distanceInGridUnits)
      if (dimension.unit === 'ft') {
        text = `${(value / 12).toFixed(1)}'`
      } else {
        text = `${value.toFixed(0)}"`
      }
    }
    
    // Position for dimension line (below beam)
    const dimY = beamBottom + jogOffset
    const jogHeight = 15 // Height of the jog
    const witnessExtension = 5 // How far witness line extends past dimension line
    
    // Draw witness line with jog from beam bottom
    graphics.beginPath()
    graphics.moveTo(measurePoint.x, beamBottom)
    graphics.lineTo(measurePoint.x, dimY - jogHeight)
    
    // Draw jog (horizontal offset)
    const jogWidth = 8
    graphics.lineTo(measurePoint.x + jogWidth, dimY - jogHeight)
    graphics.lineTo(measurePoint.x + jogWidth, dimY + witnessExtension)
    graphics.stroke()
    
    // Draw horizontal dimension line (shorter)
    graphics.beginPath()
    graphics.moveTo(measurePoint.x + jogWidth, dimY)
    
    // Calculate line end based on origin side (much shorter line)
    const lineLength = 40
    const lineEndX = originSide === 'left' 
      ? measurePoint.x + jogWidth - lineLength
      : measurePoint.x + jogWidth + lineLength
    
    graphics.lineTo(lineEndX, dimY)
    graphics.stroke()
    
    // Draw improved arrow at the appropriate end based on origin side
    if (dimension.showArrow) {
      const arrowX = originSide === 'left' ? lineEndX : lineEndX
      const angle = originSide === 'left' ? Math.PI : 0 // Arrow points toward origin
      this.drawImprovedArrow(graphics, arrowX, dimY, angle, color)
    }
    
    // Position text based on origin side - follows pattern: left = "dim"-arrow, right = "dim"-line-arrow
    let textX: number
    let textAlign: number
    
    if (originSide === 'left') {
      // Text on left side of line
      textX = lineEndX - 5
      textAlign = 1 // Right-aligned
    } else {
      // Text on right side of line
      textX = lineEndX + 5
      textAlign = 0 // Left-aligned
    }
      
    const textObj = this.scene.add.text(textX, dimY, text, {
      fontSize: `${style.fontSize}px`,
      fontFamily: style.fontFamily,
      color: textColor,
      backgroundColor: style.backgroundColor || 'rgba(255,255,255,0.8)',
      padding: { x: 4, y: 2 }
    })
    
    textObj.setOrigin(textAlign, 0.5)
    
    // Make the dimension draggable only if not system-generated
    if (!isSystemGenerated) {
      const hitArea = new Phaser.Geom.Rectangle(
        measurePoint.x - 10,
        beamBottom - 10,
        20,
        jogOffset + witnessExtension + 20
      )
      container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
      container.setData('isDraggable', true)
      container.setData('dragType', 'ordinate-dimension')
    }
    
    container.add([graphics, textObj])
  }
  
  private drawImprovedArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, color: number): void {
    // Draw filled arrow head
    const arrowLength = 10
    const arrowAngle = Math.PI / 5
    
    graphics.fillStyle(color)
    graphics.beginPath()
    graphics.moveTo(x, y)
    graphics.lineTo(
      x + Math.cos(angle - arrowAngle) * arrowLength,
      y + Math.sin(angle - arrowAngle) * arrowLength
    )
    graphics.lineTo(
      x + Math.cos(angle) * arrowLength * 0.6,
      y + Math.sin(angle) * arrowLength * 0.6
    )
    graphics.lineTo(
      x + Math.cos(angle + arrowAngle) * arrowLength,
      y + Math.sin(angle + arrowAngle) * arrowLength
    )
    graphics.closePath()
    graphics.fill()
  }
}