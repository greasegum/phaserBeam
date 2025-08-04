import Phaser from 'phaser'
import { OrdinateDimension } from '../types/annotations'

export class OrdinateDimensionRenderer {
  private scene: Phaser.Scene
  private gridSize: number = 30 // pixels per inch
  
  constructor(scene: Phaser.Scene, gridSize: number = 30) {
    this.scene = scene
    this.gridSize = gridSize
  }
  
  render(dimension: OrdinateDimension, container: Phaser.GameObjects.Container): void {
    const { measurePoint, originSide, jogOffset, style, beamLength, beamBottom } = dimension
    
    const graphics = this.scene.add.graphics()
    graphics.lineStyle(style.lineWidth, style.color)
    
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
    
    // Draw witness line from beam bottom to dimension line
    graphics.beginPath()
    graphics.moveTo(measurePoint.x, beamBottom)
    graphics.lineTo(measurePoint.x, dimY + dimension.witnessLineHeight)
    graphics.stroke()
    
    // Draw horizontal dimension line
    graphics.beginPath()
    graphics.moveTo(measurePoint.x, dimY)
    
    // Calculate arrow direction based on origin side
    const arrowX = originSide === 'left' ? originX : originX
    const angle = originSide === 'left' ? Math.PI : 0 // Arrow points toward origin
    
    // Draw dimension line toward origin (but not all the way)
    const lineEndX = originSide === 'left' 
      ? Math.max(measurePoint.x - 100, originX + 20)
      : Math.min(measurePoint.x + 100, originX - 20)
    
    graphics.lineTo(lineEndX, dimY)
    graphics.stroke()
    
    // Draw arrow at the measure point end
    if (dimension.showArrow) {
      this.drawArrow(graphics, measurePoint.x, dimY, angle, style)
    }
    
    // Add text
    const textX = originSide === 'left' 
      ? measurePoint.x - 20
      : measurePoint.x + 20
      
    const textObj = this.scene.add.text(textX, dimY, text, {
      fontSize: `${style.fontSize}px`,
      fontFamily: style.fontFamily,
      color: style.textColor,
      backgroundColor: style.backgroundColor || 'white',
      padding: { x: 4, y: 2 }
    })
    
    // Position text based on origin side
    if (originSide === 'left') {
      textObj.setOrigin(1, 0.5) // Right-aligned
    } else {
      textObj.setOrigin(0, 0.5) // Left-aligned
    }
    
    // Add small indicator at dimension line end to show it continues
    graphics.beginPath()
    graphics.moveTo(lineEndX, dimY - 3)
    graphics.lineTo(lineEndX, dimY + 3)
    graphics.stroke()
    
    // Make the dimension draggable
    const hitArea = new Phaser.Geom.Rectangle(
      measurePoint.x - 10,
      beamBottom - 10,
      20,
      jogOffset + dimension.witnessLineHeight + 20
    )
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
    container.setData('isDraggable', true)
    container.setData('dragType', 'ordinate-dimension')
    
    container.add([graphics, textObj])
  }
  
  private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, style: any): void {
    const arrowLength = 8
    const arrowAngle = Math.PI / 6
    
    // Draw arrowhead lines
    graphics.beginPath()
    graphics.moveTo(x, y)
    graphics.lineTo(
      x + Math.cos(angle - arrowAngle) * arrowLength,
      y + Math.sin(angle - arrowAngle) * arrowLength
    )
    graphics.moveTo(x, y)
    graphics.lineTo(
      x + Math.cos(angle + arrowAngle) * arrowLength,
      y + Math.sin(angle + arrowAngle) * arrowLength
    )
    graphics.stroke()
  }
}