import Phaser from 'phaser'
import { LinearDimension } from '../types/annotations'

export class LinearDimensionRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(dimension: LinearDimension, container: Phaser.GameObjects.Container): void {
    const { startPoint, endPoint, offsetDistance, style } = dimension
    
    // Calculate dimension line position
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
    const perpAngle = angle + Math.PI / 2
    
    // Offset the dimension line
    const dimStartX = startPoint.x + Math.cos(perpAngle) * offsetDistance
    const dimStartY = startPoint.y + Math.sin(perpAngle) * offsetDistance
    const dimEndX = endPoint.x + Math.cos(perpAngle) * offsetDistance
    const dimEndY = endPoint.y + Math.sin(perpAngle) * offsetDistance
    
    // Create graphics
    const graphics = this.scene.add.graphics()
    graphics.lineStyle(style.lineWidth, style.color)
    
    // Draw witness lines if enabled
    if (dimension.showWitnessLines) {
      const witnessStartX = startPoint.x + Math.cos(perpAngle) * (offsetDistance + dimension.witnessLineExtension)
      const witnessStartY = startPoint.y + Math.sin(perpAngle) * (offsetDistance + dimension.witnessLineExtension)
      const witnessEndX = endPoint.x + Math.cos(perpAngle) * (offsetDistance + dimension.witnessLineExtension)
      const witnessEndY = endPoint.y + Math.sin(perpAngle) * (offsetDistance + dimension.witnessLineExtension)
      
      // Start witness line
      graphics.beginPath()
      graphics.moveTo(startPoint.x, startPoint.y)
      graphics.lineTo(witnessStartX, witnessStartY)
      graphics.stroke()
      
      // End witness line
      graphics.beginPath()
      graphics.moveTo(endPoint.x, endPoint.y)
      graphics.lineTo(witnessEndX, witnessEndY)
      graphics.stroke()
    }
    
    // Draw dimension line
    graphics.beginPath()
    graphics.moveTo(dimStartX, dimStartY)
    graphics.lineTo(dimEndX, dimEndY)
    graphics.stroke()
    
    // Draw arrows
    this.drawArrow(graphics, dimStartX, dimStartY, angle + Math.PI, style)
    this.drawArrow(graphics, dimEndX, dimEndY, angle, style)
    
    // Add text
    const midX = (dimStartX + dimEndX) / 2
    const midY = (dimStartY + dimEndY) / 2
    
    let text = dimension.text
    if (dimension.autoText) {
      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      )
      const value = distance / 30 // Assuming 30 pixels per inch
      if (dimension.unit === 'ft') {
        text = `${(value / 12).toFixed(2)}'`
      } else {
        text = `${value.toFixed(1)}"`
      }
    }
    
    const textObj = this.scene.add.text(midX, midY, text, {
      fontSize: `${style.fontSize}px`,
      fontFamily: style.fontFamily,
      color: style.textColor,
      backgroundColor: style.backgroundColor
    })
    
    // Position text based on dimension.textPosition
    if (dimension.textPosition === 'center') {
      textObj.setOrigin(0.5, 0.5)
    } else if (dimension.textPosition === 'above') {
      textObj.setOrigin(0.5, 1)
      textObj.y -= 5
    } else {
      textObj.setOrigin(0.5, 0)
      textObj.y += 5
    }
    
    // Rotate text to align with dimension line
    const textAngle = angle > Math.PI / 2 || angle < -Math.PI / 2 ? angle + Math.PI : angle
    textObj.setRotation(textAngle)
    
    container.add([graphics, textObj])
  }
  
  private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, style: any): void {
    const arrowLength = 8
    const arrowAngle = Math.PI / 6
    
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