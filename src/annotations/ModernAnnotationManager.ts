/**
 * Modern, refactored AnnotationManager using composition instead of monolithic design
 * Replaces the 1,631-line AnnotationManager with focused, single-responsibility classes
 */

import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType, 
  AnnotationPoint, 
  SnapPoint 
} from '../types/annotations'
import { AnnotationStateManager } from './AnnotationStateManager'
import { AnnotationEventHandler } from './AnnotationEventHandler'
import { AnnotationRenderer } from './AnnotationRenderer'
import { CoordinateTransformer, GridConfig, BeamConfig } from '../services/CoordinateTransformer'
import { Result, success, failure, AnnotationError, logger } from '../utils/Result'

export interface AnnotationManagerConfig {
  scene: Phaser.Scene
  gridSize: number
  gridOrigin: { x: number, y: number }
  beamBottom?: number
  beamLength?: number
  interactive?: boolean
}

/**
 * Modern annotation manager using composition for better maintainability
 */
export class ModernAnnotationManager {
  private scene: Phaser.Scene
  private stateManager: AnnotationStateManager
  private eventHandler: AnnotationEventHandler
  private renderer: AnnotationRenderer
  private coordinateTransformer: CoordinateTransformer
  
  private config: Required<AnnotationManagerConfig>
  
  constructor(config: AnnotationManagerConfig) {
    this.scene = config.scene
    this.config = {
      ...config,
      beamBottom: config.beamBottom || 0,
      beamLength: config.beamLength || 120,
      interactive: config.interactive !== false
    }
    
    // Initialize coordinate transformer
    this.coordinateTransformer = new CoordinateTransformer(
      {
        size: this.config.gridSize,
        origin: this.config.gridOrigin
      },
      {
        length: this.config.beamLength,
        bottom: this.config.beamBottom
      }
    )
    
    // Initialize state manager
    this.stateManager = new AnnotationStateManager()
    
    // Initialize event handler
    this.eventHandler = new AnnotationEventHandler({
      scene: this.scene,
      stateManager: this.stateManager,
      coordinateTransformer: this.coordinateTransformer,
      isInteractive: this.config.interactive
    })
    
    // Initialize renderer
    this.renderer = new AnnotationRenderer({
      scene: this.scene,
      stateManager: this.stateManager,
      gridSize: this.config.gridSize,
      beamBottom: this.config.beamBottom
    })
    
    this.setupEventListeners()
    
    logger.info('ModernAnnotationManager initialized', this.config)
  }

  /**
   * Set up event listeners between components
   */
  private setupEventListeners(): void {
    // Handle annotation creation from event handler
    this.scene.events.on('annotation:create', this.handleAnnotationCreation, this)
    
    // Handle annotation clicks
    this.scene.events.on('annotation:click', this.handleAnnotationClick, this)
    
    // Handle annotation double-clicks
    this.scene.events.on('annotation:doubleClick', this.handleAnnotationDoubleClick, this)
    
    // Handle drag events
    this.scene.events.on('annotation:drag', this.handleAnnotationDrag, this)
    
    // Update renderer when selection changes
    this.stateManager.destroy = (() => {
      const originalDestroy = this.stateManager.destroy.bind(this.stateManager)
      return () => {
        this.renderer.updateSelectionEffects()
        originalDestroy()
      }
    })()
  }

  /**
   * Handle annotation creation from event system
   */
  private handleAnnotationCreation(data: { type: AnnotationType; points: AnnotationPoint[] }): void {
    const result = this.createAnnotationFromData(data)
    if (!Result.isSuccess(result)) {
      logger.error('Failed to create annotation from event', result.error)
    }
  }

  /**
   * Create annotation from event data
   */
  private createAnnotationFromData(data: { type: AnnotationType; points: AnnotationPoint[] }): Result<Annotation, AnnotationError> {
    try {
      const id = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create annotation based on type
      let annotation: Annotation
      
      switch (data.type) {
        case 'linear-dimension':
          annotation = this.createLinearDimension(id, data.points)
          break
        case 'ordinate-dimension':
          annotation = this.createOrdinateDimension(id, data.points)
          break
        case 'callout':
          annotation = this.createCallout(id, data.points)
          break
        case 'text-block':
          annotation = this.createTextBlock(id, data.points)
          break
        default:
          return failure(new AnnotationError(`Unknown annotation type: ${data.type}`))
      }
      
      // Add to state manager
      const addResult = this.stateManager.addAnnotation(annotation)
      if (!Result.isSuccess(addResult)) {
        return addResult
      }
      
      // Render the annotation
      const renderResult = this.renderer.renderAnnotation(annotation)
      if (!Result.isSuccess(renderResult)) {
        // Remove from state if render failed
        this.stateManager.removeAnnotation(id)
        return failure(new AnnotationError(
          `Failed to render annotation: ${renderResult.error.message}`,
          id
        ))
      }
      
      logger.info('Annotation created successfully', { id, type: data.type })
      return success(annotation)
      
    } catch (error) {
      return failure(new AnnotationError(`Failed to create annotation: ${error}`))
    }
  }

  // Factory methods for different annotation types
  private createLinearDimension(id: string, points: AnnotationPoint[]): any {
    if (points.length < 2) {
      throw new Error('Linear dimension requires at least 2 points')
    }
    
    return {
      id,
      type: 'linear-dimension' as const,
      startPoint: points[0],
      endPoint: points[1],
      points,
      style: { color: 0x0000ff, thickness: 2 },
      measurementText: '0.000"',
      isVisible: true,
      created: new Date().toISOString()
    }
  }

  private createOrdinateDimension(id: string, points: AnnotationPoint[]): any {
    if (points.length < 1) {
      throw new Error('Ordinate dimension requires at least 1 point')
    }
    
    return {
      id,
      type: 'ordinate-dimension' as const,
      measurePoint: points[0],
      points,
      style: { color: 0x00ff00, thickness: 2 },
      measurementText: '0.000"',
      isVisible: true,
      created: new Date().toISOString()
    }
  }

  private createCallout(id: string, points: AnnotationPoint[]): any {
    if (points.length < 1) {
      throw new Error('Callout requires at least 1 point')
    }
    
    return {
      id,
      type: 'callout' as const,
      textBox: {
        x: points[0].x,
        y: points[0].y,
        text: 'New callout',
        width: 100,
        height: 30
      },
      leaderPoints: points,
      points,
      style: { color: 0xff0000, thickness: 1 },
      isVisible: true,
      created: new Date().toISOString()
    }
  }

  private createTextBlock(id: string, points: AnnotationPoint[]): any {
    if (points.length < 1) {
      throw new Error('Text block requires at least 1 point')
    }
    
    return {
      id,
      type: 'text-block' as const,
      position: points[0],
      text: 'New text',
      points,
      style: { 
        fontSize: 12, 
        color: 0x000000, 
        backgroundColor: 0xffffff,
        padding: 5
      },
      isVisible: true,
      isSystemGenerated: false,
      created: new Date().toISOString()
    }
  }

  /**
   * Handle annotation clicks
   */
  private handleAnnotationClick(annotation: Annotation): void {
    const result = this.stateManager.setSelectedAnnotation(annotation.id)
    if (Result.isSuccess(result)) {
      this.renderer.updateSelectionEffects()
      logger.debug('Annotation selected', { id: annotation.id })
    }
  }

  /**
   * Handle annotation double-clicks
   */
  private handleAnnotationDoubleClick(annotation: Annotation): void {
    // Emit edit event for external handlers
    this.scene.events.emit('annotation:edit', annotation)
    logger.debug('Annotation edit requested', { id: annotation.id })
  }

  /**
   * Handle annotation drag
   */
  private handleAnnotationDrag(data: { annotation: Annotation; point: AnnotationPoint; handle?: string }): void {
    // Update annotation position based on drag
    const updates: Partial<Annotation> = {}
    
    // Calculate position delta
    const activeAnnotation = this.stateManager.getActiveAnnotation()
    if (!activeAnnotation) return
    
    const deltaX = data.point.x - activeAnnotation.startPoint.x
    const deltaY = data.point.y - activeAnnotation.startPoint.y
    
    // Apply delta to annotation points (simplified)
    if ('position' in data.annotation) {
      (updates as any).position = {
        x: (data.annotation as any).position.x + deltaX,
        y: (data.annotation as any).position.y + deltaY
      }
    }
    
    // Update in state manager
    const updateResult = this.stateManager.updateAnnotation(data.annotation.id, updates)
    if (Result.isSuccess(updateResult)) {
      // Re-render annotation
      this.renderer.updateAnnotation(data.annotation.id)
    }
  }

  // Public API methods
  
  /**
   * Start creating an annotation of the specified type
   */
  startCreatingAnnotation(type: AnnotationType): Result<void, Error> {
    return this.eventHandler.startCreatingAnnotation(type)
  }

  /**
   * Cancel current annotation creation
   */
  cancelCreation(): void {
    this.eventHandler.cancelCreation()
  }

  /**
   * Add an annotation programmatically
   */
  addAnnotation(annotation: Annotation, isSystemGenerated: boolean = false): Result<void, AnnotationError> {
    const addResult = this.stateManager.addAnnotation(annotation, isSystemGenerated)
    if (!Result.isSuccess(addResult)) {
      return addResult
    }
    
    const renderResult = this.renderer.renderAnnotation(annotation, isSystemGenerated)
    if (!Result.isSuccess(renderResult)) {
      // Rollback state change
      this.stateManager.removeAnnotation(annotation.id)
      return failure(new AnnotationError(
        `Failed to render annotation: ${renderResult.error.message}`,
        annotation.id
      ))
    }
    
    return success(void 0)
  }

  /**
   * Remove an annotation
   */
  removeAnnotation(id: string): Result<void, AnnotationError> {
    const removeResult = this.stateManager.removeAnnotation(id)
    if (!Result.isSuccess(removeResult)) {
      return removeResult
    }
    
    this.renderer.removeAnnotationGraphics(id)
    return success(void 0)
  }

  /**
   * Update annotation snap points
   */
  updateSnapPoints(snapPoints: SnapPoint[]): void {
    this.stateManager.updateSnapPoints(snapPoints)
  }

  /**
   * Get all annotations
   */
  getAnnotations(): Annotation[] {
    return this.stateManager.getAnnotations()
  }

  /**
   * Get selected annotation
   */
  getSelectedAnnotation(): Annotation | null {
    return this.stateManager.getSelectedAnnotation()
  }

  /**
   * Set interactive mode
   */
  setInteractive(interactive: boolean): void {
    this.eventHandler.setInteractive(interactive)
  }

  /**
   * Update beam dimensions
   */
  setBeamDimensions(beamBottom: number, beamLength: number): void {
    this.config.beamBottom = beamBottom
    this.config.beamLength = beamLength
    
    this.coordinateTransformer.updateBeamConfig({
      length: beamLength,
      bottom: beamBottom
    })
  }

  /**
   * Restore annotations from saved data
   */
  restoreAnnotations(savedAnnotations: any[]): Result<number, AnnotationError> {
    const restoreResult = this.stateManager.restoreAnnotations(savedAnnotations)
    if (!Result.isSuccess(restoreResult)) {
      return restoreResult
    }
    
    // Re-render all annotations
    const renderResult = this.renderer.renderAll()
    if (!Result.isSuccess(renderResult)) {
      logger.warn('Some annotations failed to render after restore')
    }
    
    return restoreResult
  }

  /**
   * Check if currently creating annotation
   */
  get isCreatingAnnotation(): boolean {
    return this.eventHandler.isCreatingAnnotation()
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.eventHandler.isDragging()
  }

  /**
   * Update scene
   */
  update(): void {
    // Update coordinate transformer if needed
    if (this.scene.input.activePointer) {
      // Handle any continuous updates
    }
  }

  /**
   * Get manager statistics
   */
  getStatistics(): any {
    return {
      state: this.stateManager.getStatistics(),
      rendering: this.renderer.getStatistics(),
      isCreating: this.eventHandler.isCreatingAnnotation(),
      isDragging: this.eventHandler.isDragging()
    }
  }

  /**
   * Destroy the manager and clean up all resources
   */
  destroy(): void {
    // Remove event listeners
    this.scene.events.off('annotation:create', this.handleAnnotationCreation, this)
    this.scene.events.off('annotation:click', this.handleAnnotationClick, this)
    this.scene.events.off('annotation:doubleClick', this.handleAnnotationDoubleClick, this)
    this.scene.events.off('annotation:drag', this.handleAnnotationDrag, this)
    
    // Destroy components
    if (this.eventHandler) {
      this.eventHandler.destroy()
    }
    
    if (this.renderer) {
      this.renderer.destroy()
    }
    
    if (this.stateManager) {
      this.stateManager.destroy()
    }
    
    logger.info('ModernAnnotationManager destroyed')
  }
}