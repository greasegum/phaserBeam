import Phaser from 'phaser'
import { Callout, TEXT_PADDING } from '../types/annotations'

export class CalloutRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(callout: Callout, container: Phaser.GameObjects.Container): void {
    const { leaderPoints, textBox, style, leaderStyle, endStyle } = callout
    
    const graphics = this.scene.add.graphics()
    
    // Draw text box background if border is shown
    if (textBox.showBorder) {
      graphics.lineStyle(style.lineWidth, style.borderColor ? parseInt(style.borderColor.replace('#', ''), 16) : style.color)
      graphics.strokeRect(textBox.x, textBox.y, textBox.width, textBox.height)
      
      if (style.backgroundColor) {
        graphics.fillStyle(parseInt(style.backgroundColor.replace('#', ''), 16))
        graphics.fillRect(textBox.x, textBox.y, textBox.width, textBox.height)
      }
    }
    
    // Draw leader line(s)
    graphics.lineStyle(style.lineWidth, style.color)
    
    if (leaderPoints.length > 0) {
      const lastPoint = leaderPoints[leaderPoints.length - 1]
      
      // Find the closest point on the text box to the last leader point
      const boxCenterX = textBox.x + textBox.width / 2
      const boxCenterY = textBox.y + textBox.height / 2
      
      let connectionX: number
      let connectionY: number
      
      // Determine which edge of the box to connect to
      const angle = Math.atan2(lastPoint.y - boxCenterY, lastPoint.x - boxCenterX)
      const absAngle = Math.abs(angle)
      
      if (absAngle < Math.PI / 4) {
        // Right edge
        connectionX = textBox.x + textBox.width
        connectionY = Math.max(textBox.y, Math.min(textBox.y + textBox.height, lastPoint.y))
      } else if (absAngle > 3 * Math.PI / 4) {
        // Left edge
        connectionX = textBox.x
        connectionY = Math.max(textBox.y, Math.min(textBox.y + textBox.height, lastPoint.y))
      } else if (angle > 0) {
        // Bottom edge
        connectionX = Math.max(textBox.x, Math.min(textBox.x + textBox.width, lastPoint.x))
        connectionY = textBox.y + textBox.height
      } else {
        // Top edge
        connectionX = Math.max(textBox.x, Math.min(textBox.x + textBox.width, lastPoint.x))
        connectionY = textBox.y
      }
      
      // Draw leader based on style
      if (leaderStyle === 'straight' && leaderPoints.length === 1) {
        graphics.beginPath()
        graphics.moveTo(leaderPoints[0].x, leaderPoints[0].y)
        graphics.lineTo(connectionX, connectionY)
        graphics.stroke()
        
        // Draw end style at leader point
        this.drawEndStyle(graphics, leaderPoints[0], connectionX, connectionY, endStyle, style)
        
      } else if (leaderStyle === 'polyline' || leaderPoints.length > 1) {
        graphics.beginPath()
        graphics.moveTo(leaderPoints[0].x, leaderPoints[0].y)
        
        for (let i = 1; i < leaderPoints.length; i++) {
          graphics.lineTo(leaderPoints[i].x, leaderPoints[i].y)
        }
        
        graphics.lineTo(connectionX, connectionY)
        graphics.stroke()
        
        // Draw end style at first leader point
        if (leaderPoints.length > 1) {
          this.drawEndStyle(graphics, leaderPoints[0], leaderPoints[1].x, leaderPoints[1].y, endStyle, style)
        }
        
      } else if (leaderStyle === 'curved') {
        // Simple bezier curve
        const cp1x = leaderPoints[0].x + (connectionX - leaderPoints[0].x) * 0.5
        const cp1y = leaderPoints[0].y
        const cp2x = connectionX
        const cp2y = leaderPoints[0].y + (connectionY - leaderPoints[0].y) * 0.5
        
        graphics.beginPath()
        graphics.moveTo(leaderPoints[0].x, leaderPoints[0].y)
        const curve = new Phaser.Curves.CubicBezier(
          new Phaser.Math.Vector2(leaderPoints[0].x, leaderPoints[0].y),
          new Phaser.Math.Vector2(cp1x, cp1y),
          new Phaser.Math.Vector2(cp2x, cp2y),
          new Phaser.Math.Vector2(connectionX, connectionY)
        )
        
        const points = curve.getPoints(32)
        for (let i = 0; i < points.length; i++) {
          if (i === 0) {
            graphics.moveTo(points[i].x, points[i].y)
          } else {
            graphics.lineTo(points[i].x, points[i].y)
          }
        }
        graphics.stroke()
        
        // Draw end style
        const tangent = curve.getTangent(0)
        this.drawEndStyle(graphics, leaderPoints[0], 
          leaderPoints[0].x + tangent.x * 10, 
          leaderPoints[0].y + tangent.y * 10, 
          endStyle, style)
      }
    }
    
    // Add text
    const textObj = this.scene.add.text(
      textBox.x + textBox.padding,
      textBox.y + textBox.padding,
      textBox.text,
      {
        fontSize: `${style.fontSize}px`,
        fontFamily: style.fontFamily,
        color: style.textColor,
        wordWrap: { width: textBox.width - textBox.padding * 2 }
      }
    )
    
    container.add([graphics, textObj])
    
    // Make text box draggable
    const hitArea = new Phaser.Geom.Rectangle(
      textBox.x, textBox.y, textBox.width, textBox.height
    )
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains)
  }
  
  private drawEndStyle(
    graphics: Phaser.GameObjects.Graphics, 
    point: { x: number, y: number },
    towardX: number,
    towardY: number,
    endStyle: string,
    style: any
  ): void {
    if (endStyle === 'arrow') {
      const angle = Math.atan2(towardY - point.y, towardX - point.x)
      const arrowLength = 10
      const arrowAngle = Math.PI / 6
      
      graphics.beginPath()
      graphics.moveTo(point.x, point.y)
      graphics.lineTo(
        point.x + Math.cos(angle - arrowAngle) * arrowLength,
        point.y + Math.sin(angle - arrowAngle) * arrowLength
      )
      graphics.moveTo(point.x, point.y)
      graphics.lineTo(
        point.x + Math.cos(angle + arrowAngle) * arrowLength,
        point.y + Math.sin(angle + arrowAngle) * arrowLength
      )
      graphics.stroke()
      
    } else if (endStyle === 'dot') {
      graphics.fillStyle(style.color)
      graphics.fillCircle(point.x, point.y, 4)
    }
  }
}