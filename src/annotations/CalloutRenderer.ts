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
    
    // Create text first to measure it
    let displayText = textBox.text
    // Format decimal reading if present
    if (textBox.decimalReading !== undefined) {
      displayText = textBox.decimalReading.toFixed(3) + '"'
    }
    
    const textObj = this.scene.add.text(
      textBox.x + textBox.padding,
      textBox.y + textBox.padding,
      displayText,
      {
        fontSize: `${style.fontSize}px`,
        fontFamily: style.fontFamily,
        color: style.textColor,
        wordWrap: { width: textBox.width - textBox.padding * 2 }
      }
    )
    
    // Auto-fit text box around text
    const textBounds = textObj.getBounds()
    const tightWidth = textBounds.width + textBox.padding * 2
    const tightHeight = textBounds.height + textBox.padding * 2
    
    // Update text box dimensions
    textBox.width = tightWidth
    textBox.height = tightHeight
    
    // Draw text box background if border is shown
    if (textBox.showBorder) {
      graphics.lineStyle(style.lineWidth, style.borderColor ? parseInt(style.borderColor.replace('#', ''), 16) : style.color)
      graphics.strokeRect(textBox.x, textBox.y, textBox.width, textBox.height)
      
      if (style.backgroundColor) {
        graphics.fillStyle(parseInt(style.backgroundColor.replace('#', ''), 16), 0.9)
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
      
      // Draw diagonal-horizontal leader
      if (leaderPoints.length >= 1) {
        const arrowPoint = leaderPoints[0]
        
        // Calculate the horizontal extension point
        const horizontalY = connectionY
        const horizontalX = arrowPoint.x + (connectionX - arrowPoint.x) * 0.7 // 70% of the way
        
        // Draw the leader line
        graphics.beginPath()
        graphics.moveTo(arrowPoint.x, arrowPoint.y)
        
        // Diagonal segment
        graphics.lineTo(horizontalX, horizontalY)
        
        // Horizontal segment to text box
        graphics.lineTo(connectionX, connectionY)
        
        graphics.stroke()
        
        // Draw improved arrow head at leader point
        this.drawEndStyle(graphics, arrowPoint, horizontalX, horizontalY, endStyle, style)
        
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
    
    container.add([graphics, textObj])
    
    // Create interactive areas with hover effects
    
    // Text box hit area for dragging the whole callout
    const textBoxHitArea = new Phaser.Geom.Rectangle(
      textBox.x, textBox.y, textBox.width, textBox.height
    )
    const textBoxZone = this.scene.add.zone(textBox.x + textBox.width/2, textBox.y + textBox.height/2, textBox.width, textBox.height)
    textBoxZone.setInteractive({ useHandCursor: false })
    
    // Arrow point hit area
    if (leaderPoints.length > 0) {
      const arrowZone = this.scene.add.zone(leaderPoints[0].x, leaderPoints[0].y, 20, 20)
      arrowZone.setInteractive({ useHandCursor: true })
      arrowZone.setData('handle', 'arrow')
      container.add(arrowZone)
    }
    
    // Add hover effects
    textBoxZone.on('pointerover', () => {
      graphics.lineStyle(style.lineWidth + 1, 0x0099ff)
      graphics.strokeRect(textBox.x - 1, textBox.y - 1, textBox.width + 2, textBox.height + 2)
      this.scene.input.setDefaultCursor('text')
    })
    
    textBoxZone.on('pointerout', () => {
      graphics.clear()
      this.render(callout, container) // Re-render to clear highlight
      this.scene.input.setDefaultCursor('default')
    })
    
    textBoxZone.setData('handle', 'textbox')
    container.add(textBoxZone)
    
    container.setData('annotation', callout)
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
      const arrowLength = 12
      const arrowAngle = Math.PI / 5 // Slightly wider angle for better visibility
      
      // Draw filled arrow head
      graphics.fillStyle(style.color)
      graphics.beginPath()
      graphics.moveTo(point.x, point.y)
      graphics.lineTo(
        point.x + Math.cos(angle - arrowAngle) * arrowLength,
        point.y + Math.sin(angle - arrowAngle) * arrowLength
      )
      graphics.lineTo(
        point.x + Math.cos(angle) * arrowLength * 0.7,
        point.y + Math.sin(angle) * arrowLength * 0.7
      )
      graphics.lineTo(
        point.x + Math.cos(angle + arrowAngle) * arrowLength,
        point.y + Math.sin(angle + arrowAngle) * arrowLength
      )
      graphics.closePath()
      graphics.fill()
      
    } else if (endStyle === 'dot') {
      graphics.fillStyle(style.color)
      graphics.fillCircle(point.x, point.y, 4)
    }
  }
}