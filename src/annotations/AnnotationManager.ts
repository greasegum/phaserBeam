import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType, 
  AnnotationPoint, 
  SnapPoint, 
  SNAP_THRESHOLD,
  AnnotationInteraction,
  LinearDimension,
  OrdinateDimension,
  Callout,
  DEFAULT_ANNOTATION_STYLE
} from '../types/annotations'
import { LinearDimensionRenderer } from './LinearDimensionRenderer'
import { OrdinateDimensionRenderer } from './OrdinateDimensionRenderer'
import { CalloutRenderer } from './CalloutRenderer'

export class AnnotationManager {
  private scene: Phaser.Scene
  private annotations: Map<string, Annotation> = new Map()
  private annotationGraphics: Map<string, Phaser.GameObjects.Container> = new Map()
  private snapPoints: SnapPoint[] = []
  private activeAnnotation: AnnotationInteraction | null = null
  private selectedAnnotationId: string | null = null
  private gridSize: number
  private gridOrigin: { x: number, y: number }
  
  // Renderers for different annotation types
  private linearDimensionRenderer: LinearDimensionRenderer
  private ordinateDimensionRenderer: OrdinateDimensionRenderer
  private calloutRenderer: CalloutRenderer
  
  // Annotation creation state
  private isCreating: boolean = false
  private creationType: AnnotationType | null = null
  private creationPoints: AnnotationPoint[] = []
  private previewGraphics: Phaser.GameObjects.Graphics
  
  constructor(scene: Phaser.Scene, gridSize: number, gridOrigin: { x: number, y: number }) {
    this.scene = scene
    this.gridSize = gridSize
    this.gridOrigin = gridOrigin
    
    // Initialize renderers
    this.linearDimensionRenderer = new LinearDimensionRenderer(scene)
    this.ordinateDimensionRenderer = new OrdinateDimensionRenderer(scene)
    this.calloutRenderer = new CalloutRenderer(scene)
    
    // Create preview graphics layer
    this.previewGraphics = scene.add.graphics()
    this.previewGraphics.setDepth(1000) // Above other elements
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers(): void {
    this.scene.input.on('pointerdown', this.handlePointerDown, this)
    this.scene.input.on('pointermove', this.handlePointerMove, this)
    this.scene.input.on('pointerup', this.handlePointerUp, this)
  }
  
  public destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this)
    this.scene.input.off('pointermove', this.handlePointerMove, this)
    this.scene.input.off('pointerup', this.handlePointerUp, this)
    
    // Clean up preview graphics
    this.previewGraphics.destroy()
    
    // Clean up all annotations
    this.annotationGraphics.forEach(container => container.destroy())
    this.annotations.clear()
    this.annotationGraphics.clear()
  }
  
  // Grid snapping methods
  public updateSnapPoints(gridCells: { x: number, y: number, width: number, height: number }[]): void {
    this.snapPoints = []
    
    gridCells.forEach(cell => {
      // Add grid vertices
      this.snapPoints.push(
        { x: cell.x, y: cell.y, type: 'grid-vertex', priority: 1 },
        { x: cell.x + cell.width, y: cell.y, type: 'grid-vertex', priority: 1 },
        { x: cell.x, y: cell.y + cell.height, type: 'grid-vertex', priority: 1 },
        { x: cell.x + cell.width, y: cell.y + cell.height, type: 'grid-vertex', priority: 1 }
      )
      
      // Add grid centers
      this.snapPoints.push({
        x: cell.x + cell.width / 2,
        y: cell.y + cell.height / 2,
        type: 'grid-center',
        priority: 2
      })
    })
  }
  
  private snapToGrid(point: AnnotationPoint): AnnotationPoint {
    let closestSnap: SnapPoint | null = null
    let closestDistance = SNAP_THRESHOLD
    
    for (const snap of this.snapPoints) {
      const distance = Math.sqrt(
        Math.pow(point.x - snap.x, 2) + 
        Math.pow(point.y - snap.y, 2)
      )
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestSnap = snap
      }
    }
    
    if (closestSnap) {
      return {
        x: closestSnap.x,
        y: closestSnap.y,
        gridX: Math.round((closestSnap.x - this.gridOrigin.x) / this.gridSize),
        gridY: Math.round((closestSnap.y - this.gridOrigin.y) / this.gridSize)
      }
    }
    
    return point
  }
  
  // Annotation creation methods
  public startCreatingAnnotation(type: AnnotationType): void {
    this.isCreating = true
    this.creationType = type
    this.creationPoints = []
    this.scene.input.setDefaultCursor('crosshair')
  }
  
  public cancelCreation(): void {
    this.isCreating = false
    this.creationType = null
    this.creationPoints = []
    this.previewGraphics.clear()
    this.scene.input.setDefaultCursor('default')
  }
  
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const point: AnnotationPoint = {
      x: pointer.worldX,
      y: pointer.worldY
    }
    
    if (this.isCreating) {
      const snappedPoint = this.snapToGrid(point)
      this.creationPoints.push(snappedPoint)
      
      // Check if we have enough points to create the annotation
      if (this.shouldCreateAnnotation()) {
        this.createAnnotation()
        this.cancelCreation()
      }
    } else {
      // Check if clicking on an existing annotation
      const annotation = this.getAnnotationAtPoint(point)
      if (annotation) {
        this.startDragging(annotation, point)
      }
    }
  }
  
  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const point: AnnotationPoint = {
      x: pointer.worldX,
      y: pointer.worldY
    }
    const snappedPoint = this.snapToGrid(point)
    
    if (this.isCreating) {
      this.updatePreview(snappedPoint)
    } else if (this.activeAnnotation && this.activeAnnotation.isDragging) {
      this.updateDraggedAnnotation(snappedPoint)
    }
  }
  
  private handlePointerUp(): void {
    if (this.activeAnnotation) {
      this.activeAnnotation.isDragging = false
      this.activeAnnotation = null
    }
  }
  
  private shouldCreateAnnotation(): boolean {
    if (!this.creationType) return false
    
    switch (this.creationType) {
      case 'linear-dimension':
      case 'ordinate-dimension':
        return this.creationPoints.length >= 2
      case 'callout':
        return this.creationPoints.length >= 1
      default:
        return false
    }
  }
  
  private createAnnotation(): void {
    if (!this.creationType) return
    
    const id = `annotation_${Date.now()}`
    let annotation: Annotation | null = null
    
    switch (this.creationType) {
      case 'linear-dimension':
        annotation = this.createLinearDimension(id)
        break
      case 'ordinate-dimension':
        annotation = this.createOrdinateDimension(id)
        break
      case 'callout':
        annotation = this.createCallout(id)
        break
    }
    
    if (annotation) {
      this.addAnnotation(annotation)
    }
  }
  
  private createLinearDimension(id: string): LinearDimension {
    const [start, end] = this.creationPoints
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + 
      Math.pow(end.y - start.y, 2)
    )
    const dimensionInInches = distance / this.gridSize
    
    return {
      id,
      type: 'linear-dimension',
      visible: true,
      locked: false,
      style: { ...DEFAULT_ANNOTATION_STYLE },
      startPoint: start,
      endPoint: end,
      offsetDistance: 20,
      text: `${dimensionInInches.toFixed(1)}"`,
      unit: 'in',
      showWitnessLines: true,
      witnessLineExtension: 10,
      textPosition: 'center',
      autoText: true
    }
  }
  
  private createOrdinateDimension(id: string): OrdinateDimension {
    const [origin, measure] = this.creationPoints
    const isVertical = Math.abs(measure.x - origin.x) < Math.abs(measure.y - origin.y)
    const distance = isVertical 
      ? Math.abs(measure.y - origin.y) 
      : Math.abs(measure.x - origin.x)
    const dimensionInInches = distance / this.gridSize
    
    return {
      id,
      type: 'ordinate-dimension',
      visible: true,
      locked: false,
      style: { ...DEFAULT_ANNOTATION_STYLE },
      originPoint: origin,
      measurePoint: measure,
      isVertical,
      joggedLine: true,
      jogOffset: 30,
      text: `${dimensionInInches.toFixed(1)}"`,
      unit: 'in',
      showArrow: true
    }
  }
  
  private createCallout(id: string): Callout {
    const [leader] = this.creationPoints
    
    return {
      id,
      type: 'callout',
      visible: true,
      locked: false,
      style: { ...DEFAULT_ANNOTATION_STYLE },
      leaderPoints: [leader],
      textBox: {
        x: leader.x + 50,
        y: leader.y - 30,
        width: 100,
        height: 40,
        text: 'Note',
        showBorder: true,
        padding: 8
      },
      leaderStyle: 'straight',
      endStyle: 'arrow'
    }
  }
  
  // Annotation management
  public addAnnotation(annotation: Annotation): void {
    this.annotations.set(annotation.id, annotation)
    this.renderAnnotation(annotation)
  }
  
  public removeAnnotation(id: string): void {
    const container = this.annotationGraphics.get(id)
    if (container) {
      container.destroy()
      this.annotationGraphics.delete(id)
    }
    this.annotations.delete(id)
  }
  
  public updateAnnotation(id: string, updates: Partial<Annotation>): void {
    const annotation = this.annotations.get(id)
    if (annotation) {
      Object.assign(annotation, updates)
      this.renderAnnotation(annotation)
    }
  }
  
  private renderAnnotation(annotation: Annotation): void {
    // Remove existing graphics
    const existingContainer = this.annotationGraphics.get(annotation.id)
    if (existingContainer) {
      existingContainer.destroy()
    }
    
    // Create new container
    const container = this.scene.add.container(0, 0)
    
    // Render based on type
    switch (annotation.type) {
      case 'linear-dimension':
        this.linearDimensionRenderer.render(annotation, container)
        break
      case 'ordinate-dimension':
        this.ordinateDimensionRenderer.render(annotation, container)
        break
      case 'callout':
        this.calloutRenderer.render(annotation, container)
        break
    }
    
    // Make interactive
    container.setInteractive()
    container.setData('annotationId', annotation.id)
    
    this.annotationGraphics.set(annotation.id, container)
  }
  
  // Interaction methods
  private getAnnotationAtPoint(point: AnnotationPoint): Annotation | null {
    // Implementation would check bounds of each annotation
    // For now, return null
    return null
  }
  
  private startDragging(annotation: Annotation, point: AnnotationPoint): void {
    this.activeAnnotation = {
      annotation,
      isDragging: true,
      startDragPoint: point
    }
  }
  
  private updateDraggedAnnotation(point: AnnotationPoint): void {
    if (!this.activeAnnotation) return
    
    // Implementation would update annotation position based on drag
    // This is a placeholder
  }
  
  // Public API
  public getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values())
  }
  
  public setSelectedAnnotation(id: string | null): void {
    this.selectedAnnotationId = id
    // Update visual selection state
  }
  
  public getSelectedAnnotation(): Annotation | null {
    if (this.selectedAnnotationId) {
      return this.annotations.get(this.selectedAnnotationId) || null
    }
    return null
  }
  
  private updatePreview(currentPoint: AnnotationPoint): void {
    this.previewGraphics.clear()
    
    if (!this.creationType || this.creationPoints.length === 0) return
    
    // Set preview style
    this.previewGraphics.lineStyle(1, 0x0066cc, 0.5)
    this.previewGraphics.fillStyle(0x0066cc, 0.3)
    
    switch (this.creationType) {
      case 'linear-dimension':
        if (this.creationPoints.length === 1) {
          const start = this.creationPoints[0]
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(start.x, start.y)
          this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.stroke()
          
          // Show distance
          const distance = Math.sqrt(
            Math.pow(currentPoint.x - start.x, 2) + 
            Math.pow(currentPoint.y - start.y, 2)
          )
          const midX = (start.x + currentPoint.x) / 2
          const midY = (start.y + currentPoint.y) / 2
          const distanceInInches = distance / this.gridSize
          
          // Draw text background
          const text = `${distanceInInches.toFixed(1)}"`
          const textBounds = this.scene.add.text(0, 0, text, { fontSize: '12px' })
          const textWidth = textBounds.width
          const textHeight = textBounds.height
          textBounds.destroy()
          
          this.previewGraphics.fillRect(
            midX - textWidth/2 - 4,
            midY - textHeight/2 - 2,
            textWidth + 8,
            textHeight + 4
          )
        }
        break
        
      case 'ordinate-dimension':
        if (this.creationPoints.length === 1) {
          const origin = this.creationPoints[0]
          this.previewGraphics.strokeCircle(origin.x, origin.y, 4)
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(origin.x, origin.y)
          this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.stroke()
        }
        break
        
      case 'callout':
        // Show crosshair at current point
        this.previewGraphics.beginPath()
        this.previewGraphics.moveTo(currentPoint.x - 10, currentPoint.y)
        this.previewGraphics.lineTo(currentPoint.x + 10, currentPoint.y)
        this.previewGraphics.moveTo(currentPoint.x, currentPoint.y - 10)
        this.previewGraphics.lineTo(currentPoint.x, currentPoint.y + 10)
        this.previewGraphics.stroke()
        break
    }
  }
}