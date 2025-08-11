import Phaser from 'phaser'
import { TextBlock, AnnotationStyle } from '../types/annotations'

export class TextBlockRenderer {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  render(textBlock: TextBlock, container: Phaser.GameObjects.Container): void {
    container.setPosition(textBlock.position.x, textBlock.position.y)
    
    // Create text object
    const textObj = this.scene.add.text(0, 0, textBlock.text, {
      fontSize: `${textBlock.style.fontSize}px`,
      fontFamily: textBlock.style.fontFamily,
      color: textBlock.style.textColor,
      backgroundColor: textBlock.backgroundColor,
      padding: {
        x: textBlock.padding || 0,
        y: textBlock.padding || 0
      }
    })

    // Set alignment
    textObj.setOrigin(this.getOriginFromAlignment(textBlock.alignment))
    
    // Set rotation
    textObj.setRotation(textBlock.rotation)
    
    // Set max width for text wrapping
    if (textBlock.maxWidth) {
      textObj.setWordWrapWidth(textBlock.maxWidth)
    }
    
    // Add border if specified
    if (textBlock.borderColor && textBlock.borderWidth) {
      const graphics = this.scene.add.graphics()
      graphics.lineStyle(textBlock.borderWidth, Phaser.Display.Color.ValueToColor(textBlock.borderColor).color)
      
      const bounds = textObj.getBounds()
      graphics.strokeRect(
        bounds.x - textBlock.padding!,
        bounds.y - textBlock.padding!,
        bounds.width + textBlock.padding! * 2,
        bounds.height + textBlock.padding! * 2
      )
      
      container.add(graphics)
    }
    
    container.add(textObj)
    
    // Set depth for proper layering
    container.setDepth(textBlock.isSystemGenerated ? 50 : 1000) // System text below user text
  }

  private getOriginFromAlignment(alignment: 'left' | 'center' | 'right'): number {
    switch (alignment) {
      case 'left':
        return 0
      case 'center':
        return 0.5
      case 'right':
        return 1
      default:
        return 0.5
    }
  }

  update(container: Phaser.GameObjects.Container, textBlock: TextBlock): void {
    // Clear existing content
    container.removeAll()
    
    // Re-render with updated properties
    this.render(textBlock, container)
  }

  destroy(container: Phaser.GameObjects.Container): void {
    container.destroy()
  }
} 