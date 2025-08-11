/**
 * Handles annotation rendering operations
 * Extracted from AnnotationManager for better separation of concerns
 */

import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType,
  LinearDimension,
  OrdinateDimension,
  Callout,
  TextBlock
} from '../types/annotations'
import { LinearDimensionRenderer } from './LinearDimensionRenderer'
import { OrdinateDimensionRenderer } from './OrdinateDimensionRenderer'
import { CalloutRenderer } from './CalloutRenderer'
import { TextBlockRenderer } from './TextBlockRenderer'
import { EnhancedAnnotationEffects } from './EnhancedAnnotationEffects'
import { AnnotationStateManager } from './AnnotationStateManager'
import { Result, success, failure, RenderingError, logger } from '../utils/Result'

export interface RendererConfig {
  scene: Phaser.Scene
  stateManager: AnnotationStateManager
  gridSize: number
  beamBottom: number
}

/**
 * Handles all annotation rendering operations
 */
export class AnnotationRenderer {
  private scene: Phaser.Scene
  private stateManager: AnnotationStateManager
  private annotationGraphics: Map<string, Phaser.GameObjects.Container> = new Map()
  
  // Specialized renderers
  private linearDimensionRenderer: LinearDimensionRenderer
  private ordinateDimensionRenderer: OrdinateDimensionRenderer
  private calloutRenderer: CalloutRenderer
  private textBlockRenderer: TextBlockRenderer
  private enhancedEffects: EnhancedAnnotationEffects

  constructor(config: RendererConfig) {
    this.scene = config.scene
    this.stateManager = config.stateManager
    
    // Initialize specialized renderers
    this.linearDimensionRenderer = new LinearDimensionRenderer(config.scene, config.gridSize)
    this.ordinateDimensionRenderer = new OrdinateDimensionRenderer(config.scene, config.gridSize)
    this.calloutRenderer = new CalloutRenderer(config.scene, config.beamBottom)
    this.textBlockRenderer = new TextBlockRenderer(config.scene)
    this.enhancedEffects = new EnhancedAnnotationEffects(config.scene)
    
    logger.debug('AnnotationRenderer initialized')
  }

  /**
   * Render all annotations
   */
  renderAll(): Result<void, RenderingError> {
    try {
      // Clear existing graphics first
      this.clearAll()
      
      // Render user annotations
      const userAnnotations = this.stateManager.getAnnotations()
      for (const annotation of userAnnotations) {
        const result = this.renderAnnotation(annotation, false)
        if (!Result.isSuccess(result)) {
          logger.warn('Failed to render user annotation', { 
            id: annotation.id, 
            error: result.error.message 
          })
        }
      }
      
      // Render system annotations
      const systemAnnotations = this.stateManager.getSystemAnnotations()
      for (const annotation of systemAnnotations) {
        const result = this.renderAnnotation(annotation, true)
        if (!Result.isSuccess(result)) {
          logger.warn('Failed to render system annotation', { 
            id: annotation.id, 
            error: result.error.message 
          })
        }
      }
      
      logger.debug('All annotations rendered', {
        userCount: userAnnotations.length,
        systemCount: systemAnnotations.length
      })
      
      return success(void 0)
    } catch (error) {
      return failure(new RenderingError(`Failed to render annotations: ${error}`))
    }
  }

  /**
   * Render a single annotation
   */
  renderAnnotation(annotation: Annotation, isSystemGenerated: boolean = false): Result<void, RenderingError> {
    try {
      // Remove existing graphics for this annotation
      this.removeAnnotationGraphics(annotation.id)
      
      // Create container for this annotation
      const container = this.scene.add.container(0, 0)
      container.setDepth(isSystemGenerated ? 500 : 600) // System annotations below user annotations
      
      // Render based on type
      const renderResult = this.renderByType(annotation, container)
      if (!Result.isSuccess(renderResult)) {
        container.destroy()
        return renderResult
      }
      
      // Apply effects for user annotations
      if (!isSystemGenerated) {
        this.applyInteractiveEffects(annotation, container)
      }
      
      // Store container reference
      this.annotationGraphics.set(annotation.id, container)
      
      logger.debug('Annotation rendered', { 
        id: annotation.id, 
        type: annotation.type, 
        isSystem: isSystemGenerated 
      })
      
      return success(void 0)
    } catch (error) {
      return failure(new RenderingError(
        `Failed to render annotation ${annotation.id}: ${error}`,
        { annotation, isSystemGenerated }
      ))
    }
  }

  /**
   * Render annotation based on its type
   */
  private renderByType(annotation: Annotation, container: Phaser.GameObjects.Container): Result<void, RenderingError> {
    switch (annotation.type) {
      case 'linear-dimension':
        return this.renderLinearDimension(annotation as LinearDimension, container)
      
      case 'ordinate-dimension':
        return this.renderOrdinateDimension(annotation as OrdinateDimension, container)
      
      case 'callout':
        return this.renderCallout(annotation as Callout, container)
      
      case 'text-block':
        return this.renderTextBlock(annotation as TextBlock, container)
      
      default:
        return failure(new RenderingError(`Unknown annotation type: ${annotation.type}`))
    }
  }

  /**
   * Render linear dimension
   */
  private renderLinearDimension(
    dimension: LinearDimension, 
    container: Phaser.GameObjects.Container
  ): Result<void, RenderingError> {
    return Result.fromSync(() => {
      const graphics = this.linearDimensionRenderer.render(dimension)
      container.add(graphics)
    }).mapError(error => new RenderingError(`Linear dimension render failed: ${error}`))
  }

  /**
   * Render ordinate dimension
   */
  private renderOrdinateDimension(
    dimension: OrdinateDimension,
    container: Phaser.GameObjects.Container
  ): Result<void, RenderingError> {
    return Result.fromSync(() => {
      const graphics = this.ordinateDimensionRenderer.render(dimension)
      container.add(graphics)
    }).mapError(error => new RenderingError(`Ordinate dimension render failed: ${error}`))
  }

  /**
   * Render callout
   */
  private renderCallout(
    callout: Callout,
    container: Phaser.GameObjects.Container
  ): Result<void, RenderingError> {
    return Result.fromSync(() => {
      const graphics = this.calloutRenderer.render(callout)
      container.add(graphics)
    }).mapError(error => new RenderingError(`Callout render failed: ${error}`))
  }

  /**
   * Render text block
   */
  private renderTextBlock(
    textBlock: TextBlock,
    container: Phaser.GameObjects.Container
  ): Result<void, RenderingError> {
    return Result.fromSync(() => {
      const graphics = this.textBlockRenderer.render(textBlock)
      container.add(graphics)
    }).mapError(error => new RenderingError(`Text block render failed: ${error}`))
  }

  /**
   * Apply interactive effects to user annotations
   */
  private applyInteractiveEffects(annotation: Annotation, container: Phaser.GameObjects.Container): void {
    const isSelected = this.stateManager.isSelected(annotation.id)
    const isActive = this.stateManager.isActive(annotation.id)
    
    if (isSelected) {
      this.enhancedEffects.addSelectionEffect(container, annotation)
    }
    
    if (isActive) {
      this.enhancedEffects.addActiveEffect(container, annotation)
    }
    
    // Add hover effects
    this.enhancedEffects.addHoverEffect(container, annotation)
    
    // Make container interactive
    container.setInteractive()
    container.on('pointerdown', () => {
      this.scene.events.emit('annotation:click', annotation)
    })
  }

  /**
   * Update a specific annotation's rendering
   */
  updateAnnotation(id: string): Result<void, RenderingError> {
    const annotation = this.stateManager.getAnnotation(id)
    if (!annotation) {
      return failure(new RenderingError(`Annotation not found: ${id}`))
    }
    
    const isSystem = this.stateManager.getSystemAnnotations().some(a => a.id === id)
    return this.renderAnnotation(annotation, isSystem)
  }

  /**
   * Remove graphics for a specific annotation
   */
  removeAnnotationGraphics(id: string): void {
    const container = this.annotationGraphics.get(id)
    if (container) {
      container.destroy()
      this.annotationGraphics.delete(id)
      logger.debug('Annotation graphics removed', { id })
    }
  }

  /**
   * Clear all annotation graphics
   */
  clearAll(): void {
    for (const [id, container] of this.annotationGraphics.entries()) {
      container.destroy()
    }
    this.annotationGraphics.clear()
    logger.debug('All annotation graphics cleared')
  }

  /**
   * Clear system annotation graphics by type
   */
  clearSystemAnnotations(type?: AnnotationType): void {
    const systemAnnotations = this.stateManager.getSystemAnnotations()
    
    for (const annotation of systemAnnotations) {
      if (!type || annotation.type === type) {
        this.removeAnnotationGraphics(annotation.id)
      }
    }
    
    logger.debug('System annotation graphics cleared', { type })
  }

  /**
   * Show/hide annotations by type
   */
  setAnnotationVisibility(type: AnnotationType, visible: boolean): void {
    const allAnnotations = this.stateManager.getAllAnnotations()
    
    for (const annotation of allAnnotations) {
      if (annotation.type === type) {
        const container = this.annotationGraphics.get(annotation.id)
        if (container) {
          container.setVisible(visible)
        }
      }
    }
    
    logger.debug('Annotation visibility changed', { type, visible })
  }

  /**
   * Update selection highlighting
   */
  updateSelectionEffects(): void {
    const selectedId = this.stateManager.getSelectedAnnotationId()
    
    for (const [id, container] of this.annotationGraphics.entries()) {
      const annotation = this.stateManager.getAnnotation(id)
      if (!annotation) continue
      
      // Remove existing effects
      this.enhancedEffects.clearEffects(container)
      
      // Apply current effects
      if (id === selectedId) {
        this.enhancedEffects.addSelectionEffect(container, annotation)
      }
      
      if (this.stateManager.isActive(id)) {
        this.enhancedEffects.addActiveEffect(container, annotation)
      }
    }
  }

  /**
   * Get rendered container for annotation
   */
  getAnnotationContainer(id: string): Phaser.GameObjects.Container | null {
    return this.annotationGraphics.get(id) || null
  }

  /**
   * Get rendering statistics
   */
  getStatistics(): {
    totalRendered: number
    byType: Record<AnnotationType, number>
    systemRendered: number
  } {
    const stats = {
      totalRendered: this.annotationGraphics.size,
      byType: {} as Record<AnnotationType, number>,
      systemRendered: 0
    }
    
    for (const [id, _] of this.annotationGraphics.entries()) {
      const annotation = this.stateManager.getAnnotation(id)
      if (annotation) {
        stats.byType[annotation.type] = (stats.byType[annotation.type] || 0) + 1
        
        const isSystem = this.stateManager.getSystemAnnotations().some(a => a.id === id)
        if (isSystem) {
          stats.systemRendered++
        }
      }
    }
    
    return stats
  }

  /**
   * Destroy renderer and clean up resources
   */
  destroy(): void {
    this.clearAll()
    
    // Destroy specialized renderers
    if (this.enhancedEffects) {
      // Note: EnhancedAnnotationEffects may not have destroy method
      // We'll just clear references
    }
    
    logger.debug('AnnotationRenderer destroyed')
  }
}