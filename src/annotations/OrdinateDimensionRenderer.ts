import Phaser from 'phaser'
import { OrdinateDimension } from '../types/annotations'

export class OrdinateDimensionRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(dimension: OrdinateDimension, container: Phaser.GameObjects.Container): void {
    const { originPoint, measurePoint, isVertical, joggedLine, jogOffset, style } = dimension
    
    const graphics = this.scene.add.graphics()
    graphics.lineStyle(style.lineWidth, style.color)
    
    // Calculate dimension value
    const distance = isVertical 
      ? Math.abs(measurePoint.y - originPoint.y)
      : Math.abs(measurePoint.x - originPoint.x)
    
    let text = dimension.text
    if (dimension.text.includes('"') || dimension.text.includes("'")) {
      // Use provided text
    } else {
      // Auto-calculate
      const value = distance / 30 // Assuming 30 pixels per inch
      if (dimension.unit === 'ft') {
        text = `${(value / 12).toFixed(2)}'`
      } else {
        text = `${value.toFixed(1)}"`
      }
    }
    
    // Draw witness line (jogged or straight)
    if (joggedLine) {
      if (isVertical) {
        // Vertical dimension with horizontal jog
        const jogX = measurePoint.x + jogOffset
        
        // Witness line from measure point to jog
        graphics.beginPath()
        graphics.moveTo(measurePoint.x, measurePoint.y)
        graphics.lineTo(jogX, measurePoint.y)
        graphics.stroke()
        
        // Jog line
        graphics.beginPath()
        graphics.moveTo(jogX, measurePoint.y)
        graphics.lineTo(jogX, originPoint.y)
        graphics.stroke()
        
        // Arrow at origin
        if (dimension.showArrow) {
          this.drawArrow(graphics, jogX, originPoint.y, isVertical ? -Math.PI/2 : 0, style)
        }
        
        // Add text
        const textObj = this.scene.add.text(jogX + 5, measurePoint.y, text, {
          fontSize: `${style.fontSize}px`,
          fontFamily: style.fontFamily,
          color: style.textColor
        })
        textObj.setOrigin(0, 0.5)
        container.add(textObj)
        
      } else {
        // Horizontal dimension with vertical jog
        const jogY = measurePoint.y + jogOffset
        
        // Witness line from measure point to jog
        graphics.beginPath()
        graphics.moveTo(measurePoint.x, measurePoint.y)
        graphics.lineTo(measurePoint.x, jogY)
        graphics.stroke()
        
        // Jog line
        graphics.beginPath()
        graphics.moveTo(measurePoint.x, jogY)
        graphics.lineTo(originPoint.x, jogY)
        graphics.stroke()
        
        // Arrow at origin
        if (dimension.showArrow) {
          this.drawArrow(graphics, originPoint.x, jogY, 0, style)
        }
        
        // Add text
        const textObj = this.scene.add.text(measurePoint.x, jogY - 5, text, {
          fontSize: `${style.fontSize}px`,
          fontFamily: style.fontFamily,
          color: style.textColor
        })
        textObj.setOrigin(0.5, 1)
        container.add(textObj)
      }
    } else {
      // Straight witness line
      graphics.beginPath()
      graphics.moveTo(measurePoint.x, measurePoint.y)
      graphics.lineTo(originPoint.x, originPoint.y)
      graphics.stroke()
      
      // Arrow at origin
      if (dimension.showArrow) {
        const angle = Math.atan2(originPoint.y - measurePoint.y, originPoint.x - measurePoint.x)
        this.drawArrow(graphics, originPoint.x, originPoint.y, angle + Math.PI, style)
      }
      
      // Add text at midpoint
      const midX = (measurePoint.x + originPoint.x) / 2
      const midY = (measurePoint.y + originPoint.y) / 2
      
      const textObj = this.scene.add.text(midX, midY, text, {
        fontSize: `${style.fontSize}px`,
        fontFamily: style.fontFamily,
        color: style.textColor,
        backgroundColor: style.backgroundColor
      })
      textObj.setOrigin(0.5, 0.5)
      container.add(textObj)
    }
    
    // Draw origin indicator (small circle or tick)
    graphics.lineStyle(2, style.color)
    graphics.strokeCircle(originPoint.x, originPoint.y, 3)
    
    container.add(graphics)
  }
  
  private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, style: any): void {
    const arrowLength = 10
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