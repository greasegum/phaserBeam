/**
 * Manages annotation state and data operations
 * Extracted from AnnotationManager for better separation of concerns
 */

import { 
  Annotation, 
  AnnotationType, 
  SnapPoint,
  AnnotationInteraction
} from '../types/annotations'
import { Result, success, failure, AnnotationError, logger } from '../utils/Result'

/**
 * Handles all annotation data management and state operations
 */
export class AnnotationStateManager {
  private annotations: Map<string, Annotation> = new Map()
  private systemAnnotations: Map<string, Annotation> = new Map()
  private snapPoints: SnapPoint[] = []
  private selectedAnnotationId: string | null = null
  private activeAnnotation: AnnotationInteraction | null = null

  /**
   * Add an annotation to the collection
   */
  addAnnotation(annotation: Annotation, isSystemGenerated: boolean = false): Result<void, AnnotationError> {
    try {
      const collection = isSystemGenerated ? this.systemAnnotations : this.annotations
      collection.set(annotation.id, annotation)
      
      logger.debug('Annotation added', { 
        id: annotation.id, 
        type: annotation.type, 
        isSystem: isSystemGenerated 
      })
      
      return success(void 0)
    } catch (error) {
      return failure(new AnnotationError(
        `Failed to add annotation: ${error}`, 
        annotation.id
      ))
    }
  }

  /**
   * Remove an annotation from the collection
   */
  removeAnnotation(id: string): Result<Annotation | null, AnnotationError> {
    try {
      let removedAnnotation = this.annotations.get(id)
      let wasSystem = false
      
      if (!removedAnnotation) {
        removedAnnotation = this.systemAnnotations.get(id)
        wasSystem = true
      }
      
      if (!removedAnnotation) {
        return success(null) // Not found, but not an error
      }
      
      const collection = wasSystem ? this.systemAnnotations : this.annotations
      collection.delete(id)
      
      // Clear selection if this annotation was selected
      if (this.selectedAnnotationId === id) {
        this.selectedAnnotationId = null
      }
      
      // Clear active annotation if this was active
      if (this.activeAnnotation?.annotation.id === id) {
        this.activeAnnotation = null
      }
      
      logger.debug('Annotation removed', { id, type: removedAnnotation.type })
      
      return success(removedAnnotation)
    } catch (error) {
      return failure(new AnnotationError(
        `Failed to remove annotation: ${error}`, 
        id
      ))
    }
  }

  /**
   * Update an existing annotation
   */
  updateAnnotation(id: string, updates: Partial<Annotation>): Result<Annotation, AnnotationError> {
    try {
      let annotation = this.annotations.get(id)
      let isSystem = false
      
      if (!annotation) {
        annotation = this.systemAnnotations.get(id)
        isSystem = true
      }
      
      if (!annotation) {
        return failure(new AnnotationError(`Annotation not found: ${id}`, id))
      }
      
      const updatedAnnotation = { ...annotation, ...updates, id } // Ensure ID doesn't change
      const collection = isSystem ? this.systemAnnotations : this.annotations
      collection.set(id, updatedAnnotation)
      
      logger.debug('Annotation updated', { id, updates: Object.keys(updates) })
      
      return success(updatedAnnotation)
    } catch (error) {
      return failure(new AnnotationError(
        `Failed to update annotation: ${error}`, 
        id
      ))
    }
  }

  /**
   * Get an annotation by ID
   */
  getAnnotation(id: string): Annotation | null {
    return this.annotations.get(id) || this.systemAnnotations.get(id) || null
  }

  /**
   * Get all user annotations (excluding system annotations)
   */
  getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values())
  }

  /**
   * Get all system annotations
   */
  getSystemAnnotations(): Annotation[] {
    return Array.from(this.systemAnnotations.values())
  }

  /**
   * Get all annotations (user + system)
   */
  getAllAnnotations(): Annotation[] {
    return [...this.getAnnotations(), ...this.getSystemAnnotations()]
  }

  /**
   * Clear all user annotations
   */
  clearAnnotations(): Result<number, AnnotationError> {
    try {
      const count = this.annotations.size
      this.annotations.clear()
      this.selectedAnnotationId = null
      this.activeAnnotation = null
      
      logger.info('All user annotations cleared', { count })
      
      return success(count)
    } catch (error) {
      return failure(new AnnotationError(`Failed to clear annotations: ${error}`))
    }
  }

  /**
   * Clear system annotations by type
   */
  clearSystemAnnotations(type?: AnnotationType): Result<number, AnnotationError> {
    try {
      let count = 0
      
      if (type) {
        // Clear specific type
        for (const [id, annotation] of this.systemAnnotations.entries()) {
          if (annotation.type === type) {
            this.systemAnnotations.delete(id)
            count++
          }
        }
        logger.info('System annotations cleared by type', { type, count })
      } else {
        // Clear all system annotations
        count = this.systemAnnotations.size
        this.systemAnnotations.clear()
        logger.info('All system annotations cleared', { count })
      }
      
      return success(count)
    } catch (error) {
      return failure(new AnnotationError(`Failed to clear system annotations: ${error}`))
    }
  }

  /**
   * Set selected annotation
   */
  setSelectedAnnotation(id: string | null): Result<void, AnnotationError> {
    if (id !== null && !this.getAnnotation(id)) {
      return failure(new AnnotationError(`Cannot select non-existent annotation: ${id}`, id))
    }
    
    this.selectedAnnotationId = id
    logger.debug('Annotation selection changed', { selectedId: id })
    
    return success(void 0)
  }

  /**
   * Get selected annotation
   */
  getSelectedAnnotation(): Annotation | null {
    return this.selectedAnnotationId ? this.getAnnotation(this.selectedAnnotationId) : null
  }

  /**
   * Get selected annotation ID
   */
  getSelectedAnnotationId(): string | null {
    return this.selectedAnnotationId
  }

  /**
   * Set active annotation (for dragging/interaction)
   */
  setActiveAnnotation(interaction: AnnotationInteraction | null): void {
    this.activeAnnotation = interaction
  }

  /**
   * Get active annotation
   */
  getActiveAnnotation(): AnnotationInteraction | null {
    return this.activeAnnotation
  }

  /**
   * Check if an annotation is selected
   */
  isSelected(id: string): boolean {
    return this.selectedAnnotationId === id
  }

  /**
   * Check if an annotation is active
   */
  isActive(id: string): boolean {
    return this.activeAnnotation?.annotation.id === id
  }

  /**
   * Update snap points for grid snapping
   */
  updateSnapPoints(snapPoints: SnapPoint[]): void {
    this.snapPoints = [...snapPoints] // Create copy
    logger.debug('Snap points updated', { count: snapPoints.length })
  }

  /**
   * Get current snap points
   */
  getSnapPoints(): SnapPoint[] {
    return [...this.snapPoints] // Return copy to prevent mutation
  }

  /**
   * Find annotations of a specific type
   */
  getAnnotationsByType(type: AnnotationType, includeSystem: boolean = false): Annotation[] {
    const userAnnotations = this.getAnnotations().filter(a => a.type === type)
    
    if (includeSystem) {
      const systemAnnotations = this.getSystemAnnotations().filter(a => a.type === type)
      return [...userAnnotations, ...systemAnnotations]
    }
    
    return userAnnotations
  }

  /**
   * Count annotations by type
   */
  getAnnotationCount(type?: AnnotationType, includeSystem: boolean = false): number {
    if (type) {
      return this.getAnnotationsByType(type, includeSystem).length
    }
    
    const userCount = this.annotations.size
    const systemCount = includeSystem ? this.systemAnnotations.size : 0
    
    return userCount + systemCount
  }

  /**
   * Check if any annotations exist
   */
  hasAnnotations(includeSystem: boolean = false): boolean {
    return this.getAnnotationCount(undefined, includeSystem) > 0
  }

  /**
   * Restore annotations from saved data
   */
  restoreAnnotations(savedAnnotations: any[]): Result<number, AnnotationError> {
    try {
      let restoredCount = 0
      
      for (const annotationData of savedAnnotations) {
        // Validate annotation data structure
        if (!this.isValidAnnotationData(annotationData)) {
          logger.warn('Invalid annotation data skipped', annotationData)
          continue
        }
        
        const result = this.addAnnotation(annotationData as Annotation)
        if (Result.isSuccess(result)) {
          restoredCount++
        } else {
          logger.warn('Failed to restore annotation', { 
            id: annotationData.id, 
            error: result.error.message 
          })
        }
      }
      
      logger.info('Annotations restored', { 
        total: savedAnnotations.length, 
        restored: restoredCount 
      })
      
      return success(restoredCount)
    } catch (error) {
      return failure(new AnnotationError(`Failed to restore annotations: ${error}`))
    }
  }

  /**
   * Export annotations to serializable format
   */
  exportAnnotations(): any[] {
    return this.getAnnotations()
  }

  /**
   * Get annotation statistics
   */
  getStatistics(): {
    total: number
    byType: Record<AnnotationType, number>
    systemTotal: number
    systemByType: Record<AnnotationType, number>
    selected: string | null
    active: string | null
  } {
    const allAnnotations = this.getAnnotations()
    const systemAnnotations = this.getSystemAnnotations()
    
    const byType = {} as Record<AnnotationType, number>
    const systemByType = {} as Record<AnnotationType, number>
    
    // Count user annotations by type
    for (const annotation of allAnnotations) {
      byType[annotation.type] = (byType[annotation.type] || 0) + 1
    }
    
    // Count system annotations by type
    for (const annotation of systemAnnotations) {
      systemByType[annotation.type] = (systemByType[annotation.type] || 0) + 1
    }
    
    return {
      total: allAnnotations.length,
      byType,
      systemTotal: systemAnnotations.length,
      systemByType,
      selected: this.selectedAnnotationId,
      active: this.activeAnnotation?.annotation.id || null
    }
  }

  /**
   * Validate annotation data structure
   */
  private isValidAnnotationData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.type === 'string' &&
      data.points &&
      Array.isArray(data.points)
    )
  }

  /**
   * Clear all state
   */
  destroy(): void {
    this.annotations.clear()
    this.systemAnnotations.clear()
    this.snapPoints = []
    this.selectedAnnotationId = null
    this.activeAnnotation = null
    
    logger.debug('AnnotationStateManager destroyed')
  }
}