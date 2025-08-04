import Phaser from 'phaser'
import { LinearDimension } from '../types/annotations'

// Engineering-grade dimension constants
const ARROW_LENGTH = 12
const ARROW_ANGLE = Math.PI / 6
const WITNESS_LINE_GAP = 3 // Gap between witness line and measured point
const TEXT_PADDING = 8 // Distance from dimension line to text
const DIMENSION_LINE_WEIGHT = 1.5
const WITNESS_LINE_WEIGHT = 0.75

export class LinearDimensionRenderer {
  private scene: Phaser.Scene
  private gridSize: number
  
  constructor(scene: Phaser.Scene, gridSize: number = 30) {
    this.scene = scene
    this.gridSize = gridSize
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
    
    // Create graphics with antialiasing
    const graphics = this.scene.add.graphics()
    graphics.setDefaultStyles({
      lineStyle: {
        width: DIMENSION_LINE_WEIGHT,
        color: style.color,
        alpha: 1
      }
    })
    
    // Add subtle shadow effect for depth
    const shadowGraphics = this.scene.add.graphics()
    shadowGraphics.setDefaultStyles({
      lineStyle: {
        width: DIMENSION_LINE_WEIGHT + 1,
        color: 0x000000,
        alpha: 0.2
      }
    })
    shadowGraphics.setPosition(1, 1) // Offset shadow
    container.add(shadowGraphics)
    
    // Draw witness lines (extension lines)
    if (dimension.showWitnessLines) {
      graphics.lineStyle(WITNESS_LINE_WEIGHT, style.color, 0.8)
      
      const witnessExtension = dimension.witnessLineExtension || 20
      const witnessGapStartX = startPoint.x + Math.cos(perpAngle) * WITNESS_LINE_GAP
      const witnessGapStartY = startPoint.y + Math.sin(perpAngle) * WITNESS_LINE_GAP
      const witnessGapEndX = endPoint.x + Math.cos(perpAngle) * WITNESS_LINE_GAP
      const witnessGapEndY = endPoint.y + Math.sin(perpAngle) * WITNESS_LINE_GAP
      
      const witnessStartX = startPoint.x + Math.cos(perpAngle) * (offsetDistance + witnessExtension)
      const witnessStartY = startPoint.y + Math.sin(perpAngle) * (offsetDistance + witnessExtension)
      const witnessEndX = endPoint.x + Math.cos(perpAngle) * (offsetDistance + witnessExtension)
      const witnessEndY = endPoint.y + Math.sin(perpAngle) * (offsetDistance + witnessExtension)
      
      // Start witness line with gap
      graphics.beginPath()
      graphics.moveTo(witnessGapStartX, witnessGapStartY)
      graphics.lineTo(witnessStartX, witnessStartY)
      graphics.stroke()
      
      // End witness line with gap
      graphics.beginPath()
      graphics.moveTo(witnessGapEndX, witnessGapEndY)
      graphics.lineTo(witnessEndX, witnessEndY)
      graphics.stroke()
    }
    
    // Draw shadow dimension line first
    shadowGraphics.beginPath()
    shadowGraphics.moveTo(dimStartX, dimStartY)
    shadowGraphics.lineTo(dimEndX, dimEndY)
    shadowGraphics.stroke()
    
    // Draw shadow arrows
    this.drawArrow(shadowGraphics, dimStartX, dimStartY, angle + Math.PI, { ...style, color: 0x000000 })
    this.drawArrow(shadowGraphics, dimEndX, dimEndY, angle, { ...style, color: 0x000000 })
    
    // Draw dimension line with proper weight
    graphics.lineStyle(DIMENSION_LINE_WEIGHT, style.color, 1)
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
      // Convert pixels to actual dimension based on grid size
      // Grid size represents 1 inch
      const inches = distance / this.gridSize
      
      if (dimension.unit === 'ft') {
        const feet = Math.floor(inches / 12)
        const remainingInches = inches % 12
        if (remainingInches === 0) {
          text = `${feet}'-0"`
        } else {
          // Format as feet and inches with fractions
          const fraction = this.toFraction(remainingInches)
          text = `${feet}'-${fraction}"`
        }
      } else {
        // Format inches with fractions
        text = `${this.toFraction(inches)}"`
      }
    }
    
    // Create text with engineering font style
    const textObj = this.scene.add.text(midX, midY, text, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'normal',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 4, y: 2 },
      align: 'center'
    })
    
    // Position text with proper offset from dimension line
    textObj.setOrigin(0.5, 0.5)
    
    if (dimension.textPosition === 'center') {
      // Center on dimension line with background
      textObj.setBackgroundColor('#ffffff')
    } else if (dimension.textPosition === 'above') {
      const textOffsetX = Math.cos(perpAngle) * TEXT_PADDING
      const textOffsetY = Math.sin(perpAngle) * TEXT_PADDING
      textObj.x += textOffsetX
      textObj.y += textOffsetY
    } else {
      const textOffsetX = -Math.cos(perpAngle) * TEXT_PADDING
      const textOffsetY = -Math.sin(perpAngle) * TEXT_PADDING
      textObj.x += textOffsetX
      textObj.y += textOffsetY
    }
    
    // Rotate text to align with dimension line
    const textAngle = angle > Math.PI / 2 || angle < -Math.PI / 2 ? angle + Math.PI : angle
    textObj.setRotation(textAngle)
    
    // Make text draggable for witness line adjustment
    textObj.setInteractive({ useHandCursor: true })
    textObj.setData('isDraggable', true)
    textObj.setData('dragType', 'dimension-text')
    textObj.setData('dimensionAngle', angle)
    textObj.setData('perpAngle', perpAngle)
    
    // Add hover effect
    textObj.on('pointerover', () => {
      textObj.setBackgroundColor('#ffff99')
      this.scene.input.setDefaultCursor('move')
    })
    
    textObj.on('pointerout', () => {
      textObj.setBackgroundColor('#ffffff')
      this.scene.input.setDefaultCursor('default')
    })
    
    container.add([graphics, textObj])
  }
  
  private drawArrow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, style: any): void {
    // Draw filled arrowhead for better visibility
    graphics.fillStyle(style.color, 1)
    graphics.beginPath()
    graphics.moveTo(x, y)
    graphics.lineTo(
      x + Math.cos(angle - ARROW_ANGLE) * ARROW_LENGTH,
      y + Math.sin(angle - ARROW_ANGLE) * ARROW_LENGTH
    )
    graphics.lineTo(
      x + Math.cos(angle) * ARROW_LENGTH * 0.6,
      y + Math.sin(angle) * ARROW_LENGTH * 0.6
    )
    graphics.lineTo(
      x + Math.cos(angle + ARROW_ANGLE) * ARROW_LENGTH,
      y + Math.sin(angle + ARROW_ANGLE) * ARROW_LENGTH
    )
    graphics.closePath()
    graphics.fillPath()
  }
  
  // Convert decimal inches to fractional representation
  private toFraction(decimal: number): string {
    const wholePart = Math.floor(decimal)
    const fractionalPart = decimal - wholePart
    
    // Common fractions in engineering
    const fractions = [
      { value: 0, text: '' },
      { value: 0.0625, text: '1/16' },
      { value: 0.125, text: '1/8' },
      { value: 0.1875, text: '3/16' },
      { value: 0.25, text: '1/4' },
      { value: 0.3125, text: '5/16' },
      { value: 0.375, text: '3/8' },
      { value: 0.4375, text: '7/16' },
      { value: 0.5, text: '1/2' },
      { value: 0.5625, text: '9/16' },
      { value: 0.625, text: '5/8' },
      { value: 0.6875, text: '11/16' },
      { value: 0.75, text: '3/4' },
      { value: 0.8125, text: '13/16' },
      { value: 0.875, text: '7/8' },
      { value: 0.9375, text: '15/16' }
    ]
    
    // Find closest fraction
    let closest = fractions[0]
    let minDiff = Math.abs(fractionalPart)
    
    for (const fraction of fractions) {
      const diff = Math.abs(fractionalPart - fraction.value)
      if (diff < minDiff) {
        minDiff = diff
        closest = fraction
      }
    }
    
    if (wholePart === 0 && closest.text === '') {
      return '0'
    } else if (wholePart === 0) {
      return closest.text
    } else if (closest.text === '') {
      return wholePart.toString()
    } else {
      return `${wholePart} ${closest.text}`
    }
  }
}