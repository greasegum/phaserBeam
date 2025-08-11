/**
 * Handles annotation interaction events
 * Extracted from AnnotationManager for better separation of concerns
 */

import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType, 
  AnnotationPoint, 
  AnnotationInteraction,
  SNAP_THRESHOLD
} from '../types/annotations'
import { AnnotationStateManager } from './AnnotationStateManager'
import { CoordinateTransformer } from '../services/CoordinateTransformer'
import { Result, success, failure, logger } from '../utils/Result'

export interface EventHandlerConfig {
  scene: Phaser.Scene
  stateManager: AnnotationStateManager
  coordinateTransformer: CoordinateTransformer
  isInteractive: boolean
}

export interface CreationState {
  isCreating: boolean
  creationType: AnnotationType | null
  creationPoints: AnnotationPoint[]
}

/**
 * Handles all user interaction events for annotations
 */
export class AnnotationEventHandler {
  private scene: Phaser.Scene
  private stateManager: AnnotationStateManager
  private coordinateTransformer: CoordinateTransformer
  private inputZone?: Phaser.GameObjects.Zone
  private isInteractive: boolean = true

  // Creation state
  private creationState: CreationState = {
    isCreating: false,
    creationType: null,
    creationPoints: []
  }

  // Interaction tracking
  private lastClickTime?: number
  private lastClickAnnotation?: string

  constructor(config: EventHandlerConfig) {
    this.scene = config.scene
    this.stateManager = config.stateManager
    this.coordinateTransformer = config.coordinateTransformer
    this.isInteractive = config.isInteractive

    this.setupEventHandlers()
  }

  /**
   * Set up event handlers for user interaction
   */
  private setupEventHandlers(): void {
    if (!this.isInteractive) return

    // Create an invisible full-screen interactive zone
    const { width, height } = this.scene.cameras.main
    this.inputZone = this.scene.add.zone(width / 2, height / 2, width, height)
    this.inputZone.setInteractive()
    this.inputZone.setDepth(50) // Below grid (100) but above beam graphics

    // Attach handlers to the zone
    this.inputZone.on('pointerdown', this.handlePointerDown, this)
    this.inputZone.on('pointermove', this.handlePointerMove, this)
    this.inputZone.on('pointerup', this.handlePointerUp, this)

    logger.debug('AnnotationEventHandler initialized', { width, height })
  }

  /**
   * Start creating an annotation of the specified type
   */
  startCreatingAnnotation(type: AnnotationType): Result<void, Error> {
    try {
      // Cancel any existing creation
      if (this.creationState.isCreating && this.creationState.creationType !== type) {
        this.cancelCreation()
      }

      this.creationState = {
        isCreating: true,
        creationType: type,
        creationPoints: []
      }

      logger.debug('Started creating annotation', { type })
      return success(void 0)
    } catch (error) {
      return failure(new Error(`Failed to start annotation creation: ${error}`))
    }
  }

  /**
   * Cancel current annotation creation
   */
  cancelCreation(): void {
    this.creationState = {
      isCreating: false,
      creationType: null,
      creationPoints: []
    }

    logger.debug('Annotation creation cancelled')
  }

  /**
   * Check if currently creating an annotation
   */
  isCreatingAnnotation(): boolean {
    return this.creationState.isCreating
  }

  /**
   * Get current creation type
   */
  getCurrentCreationType(): AnnotationType | null {
    return this.creationState.creationType
  }

  /**
   * Get current creation points
   */
  getCurrentCreationPoints(): AnnotationPoint[] {
    return [...this.creationState.creationPoints] // Return copy
  }

  /**
   * Handle pointer down events
   */
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isInteractive) return

    const point: AnnotationPoint = {
      x: pointer.x,
      y: pointer.y
    }

    if (this.creationState.isCreating) {
      this.handleCreationPointerDown(point)
    } else {
      this.handleSelectionPointerDown(point, pointer)
    }
  }

  /**
   * Handle pointer down during annotation creation
   */
  private handleCreationPointerDown(point: AnnotationPoint): void {
    // Snap to grid if close enough
    const snappedPoint = this.snapToNearestSnapPoint(point)
    this.creationState.creationPoints.push(snappedPoint)

    if (this.shouldCreateAnnotation()) {
      this.createAnnotationFromPoints()
    }

    logger.debug('Creation point added', { 
      point: snappedPoint, 
      totalPoints: this.creationState.creationPoints.length 
    })
  }

  /**
   * Handle pointer down for selection/interaction
   */
  private handleSelectionPointerDown(point: AnnotationPoint, pointer: Phaser.Input.Pointer): void {
    const result = this.getAnnotationAtPoint(point)
    const now = Date.now()

    if (result) {
      // Handle annotation interaction
      this.handleAnnotationInteraction(result, point, now)
    } else {
      // Clear selection if clicking on empty space
      this.stateManager.setSelectedAnnotation(null)
      logger.debug('Selection cleared - clicked on empty space')
    }
  }

  /**
   * Handle annotation interaction (selection, dragging)
   */
  private handleAnnotationInteraction(
    result: { annotation: Annotation; handle?: string },
    point: AnnotationPoint,
    timestamp: number
  ): void {
    const { annotation, handle } = result

    // Check for double-click to edit
    if (this.lastClickTime && 
        timestamp - this.lastClickTime < 300 && 
        this.lastClickAnnotation === annotation.id) {
      this.handleAnnotationDoubleClick(annotation)
      return
    }

    // Single click - select and potentially start dragging
    this.stateManager.setSelectedAnnotation(annotation.id)
    this.startDragging(annotation, point, handle)

    this.lastClickTime = timestamp
    this.lastClickAnnotation = annotation.id

    logger.debug('Annotation interaction', { 
      id: annotation.id, 
      type: annotation.type, 
      handle 
    })
  }

  /**
   * Handle double-click on annotation
   */
  private handleAnnotationDoubleClick(annotation: Annotation): void {
    logger.debug('Annotation double-clicked', { id: annotation.id, type: annotation.type })
    
    // Emit event for external handlers (like text editing)
    this.scene.events.emit('annotation:doubleClick', annotation)
  }

  /**
   * Handle pointer move events
   */
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isInteractive) return

    const point: AnnotationPoint = {
      x: pointer.x,
      y: pointer.y
    }

    if (this.creationState.isCreating) {
      this.handleCreationPointerMove(point)
    } else {
      this.handleInteractionPointerMove(point)
    }
  }

  /**
   * Handle pointer move during creation
   */
  private handleCreationPointerMove(point: AnnotationPoint): void {
    const snappedPoint = this.snapToNearestSnapPoint(point)
    
    // Emit preview event
    this.scene.events.emit('annotation:preview', {
      type: this.creationState.creationType,
      points: [...this.creationState.creationPoints, snappedPoint]
    })
  }

  /**
   * Handle pointer move during interaction
   */
  private handleInteractionPointerMove(point: AnnotationPoint): void {
    const activeAnnotation = this.stateManager.getActiveAnnotation()
    
    if (activeAnnotation?.isDragging) {
      this.updateDraggedAnnotation(point)
    } else {
      // Update cursor based on hover
      this.updateCursorForPoint(point)
    }
  }

  /**
   * Handle pointer up events
   */
  private handlePointerUp(): void {
    const activeAnnotation = this.stateManager.getActiveAnnotation()
    
    if (activeAnnotation?.isDragging) {
      // End dragging
      this.stateManager.setActiveAnnotation({
        ...activeAnnotation,
        isDragging: false
      })
      
      logger.debug('Dragging ended', { id: activeAnnotation.annotation.id })
    }
  }

  /**
   * Start dragging an annotation
   */
  private startDragging(annotation: Annotation, point: AnnotationPoint, handle?: string): void {
    const interaction: AnnotationInteraction = {
      annotation,
      startPoint: point,
      currentPoint: point,
      dragHandle: handle,
      isDragging: true
    }

    this.stateManager.setActiveAnnotation(interaction)
    logger.debug('Started dragging annotation', { id: annotation.id, handle })
  }

  /**
   * Update dragged annotation position
   */
  private updateDraggedAnnotation(point: AnnotationPoint): void {
    const activeAnnotation = this.stateManager.getActiveAnnotation()
    if (!activeAnnotation) return

    const snappedPoint = this.snapToNearestSnapPoint(point)
    
    // Update interaction state
    this.stateManager.setActiveAnnotation({
      ...activeAnnotation,
      currentPoint: snappedPoint
    })

    // Emit drag event for external handlers
    this.scene.events.emit('annotation:drag', {
      annotation: activeAnnotation.annotation,
      point: snappedPoint,
      handle: activeAnnotation.dragHandle
    })
  }

  /**
   * Snap point to nearest snap point
   */
  private snapToNearestSnapPoint(point: AnnotationPoint): AnnotationPoint {
    const snapPoints = this.stateManager.getSnapPoints()
    let closestSnap: any = null
    let closestDistance = SNAP_THRESHOLD

    for (const snap of snapPoints) {
      const distance = Math.sqrt(
        Math.pow(point.x - snap.x, 2) + Math.pow(point.y - snap.y, 2)
      )

      if (distance < closestDistance) {
        closestDistance = distance
        closestSnap = snap
      }
    }

    return closestSnap ? { x: closestSnap.x, y: closestSnap.y } : point
  }

  /**
   * Determine if we have enough points to create annotation
   */
  private shouldCreateAnnotation(): boolean {
    const { creationType, creationPoints } = this.creationState
    if (!creationType) return false

    switch (creationType) {
      case 'linear-dimension':
        return creationPoints.length >= 2
      case 'ordinate-dimension':
        return creationPoints.length >= 1
      case 'callout':
        return creationPoints.length >= 1
      case 'text-block':
        return creationPoints.length >= 1
      default:
        return false
    }
  }

  /**
   * Create annotation from current creation points
   */
  private createAnnotationFromPoints(): void {
    if (!this.creationState.creationType || this.creationState.creationPoints.length === 0) {
      return
    }

    // Emit creation event for external handler
    this.scene.events.emit('annotation:create', {
      type: this.creationState.creationType,
      points: this.creationState.creationPoints
    })

    // Reset creation state
    this.cancelCreation()
  }

  /**
   * Get annotation at specified point
   */
  private getAnnotationAtPoint(point: AnnotationPoint): { annotation: Annotation; handle?: string } | null {
    // This would typically check rendered annotation graphics
    // For now, emit event for external handler
    const result = this.scene.events.emit('annotation:hitTest', point)
    return result as any // Type would be properly handled by external system
  }

  /**
   * Update cursor based on point position
   */
  private updateCursorForPoint(point: AnnotationPoint): void {
    const result = this.getAnnotationAtPoint(point)
    const cursor = result ? 'pointer' : 'default'
    
    // Update DOM cursor
    if (this.scene.game.canvas) {
      this.scene.game.canvas.style.cursor = cursor
    }
  }

  /**
   * Set interactive mode
   */
  setInteractive(interactive: boolean): void {
    this.isInteractive = interactive
    
    if (this.inputZone) {
      this.inputZone.setInteractive(interactive)
    }
    
    if (!interactive) {
      this.cancelCreation()
      this.stateManager.setActiveAnnotation(null)
    }
    
    logger.debug('Interactive mode changed', { interactive })
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    const activeAnnotation = this.stateManager.getActiveAnnotation()
    return activeAnnotation?.isDragging || false
  }

  /**
   * Destroy event handler and clean up
   */
  destroy(): void {
    if (this.inputZone) {
      this.inputZone.removeAllListeners()
      this.inputZone.destroy()
      this.inputZone = undefined
    }

    this.cancelCreation()
    this.stateManager.setActiveAnnotation(null)
    
    logger.debug('AnnotationEventHandler destroyed')
  }
}