import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType, 
  AnnotationPoint, 
  SnapPoint, 
  SNAP_THRESHOLD,
  GRID_SNAP_PRIORITY,
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
  private beamBottom: number = 0
  private beamLength: number = 0
  private isInteractive: boolean = true
  
  // Renderers for different annotation types
  private linearDimensionRenderer: LinearDimensionRenderer
  private ordinateDimensionRenderer: OrdinateDimensionRenderer
  private calloutRenderer: CalloutRenderer
  
  // Annotation creation state
  private isCreating: boolean = false
  private creationType: AnnotationType | null = null
  private creationPoints: AnnotationPoint[] = []
  private previewGraphics: Phaser.GameObjects.Graphics
  private ordinateOriginSide: 'left' | 'right' = 'left'
  private modeIndicator: Phaser.GameObjects.Container
  private cursorGraphics: Phaser.GameObjects.Graphics
  private inputZone: Phaser.GameObjects.Zone
  
  constructor(scene: Phaser.Scene, gridSize: number, gridOrigin: { x: number, y: number }, beamBottom?: number, beamLength?: number) {
    this.scene = scene
    this.gridSize = gridSize
    this.gridOrigin = gridOrigin
    this.beamBottom = beamBottom || 0
    this.beamLength = beamLength || 0
    
    // Initialize renderers
    this.linearDimensionRenderer = new LinearDimensionRenderer(scene, gridSize)
    this.ordinateDimensionRenderer = new OrdinateDimensionRenderer(scene, gridSize)
    this.calloutRenderer = new CalloutRenderer(scene)
    
    // Create preview graphics layer
    this.previewGraphics = scene.add.graphics()
    this.previewGraphics.setDepth(1000) // Above other elements
    
    // Create cursor graphics
    this.cursorGraphics = scene.add.graphics()
    this.cursorGraphics.setDepth(1001)
    
    // Create mode indicator
    this.modeIndicator = this.createModeIndicator()
    this.modeIndicator.setVisible(false)
    
    this.setupEventHandlers()
  }
  
  private setupEventHandlers(): void {
    // Create an invisible full-screen interactive zone
    const { width, height } = this.scene.cameras.main
    this.inputZone = this.scene.add.zone(width / 2, height / 2, width, height)
    this.inputZone.setInteractive()
    this.inputZone.setDepth(50) // Below grid (100) but above beam graphics
    
    // Attach handlers to the zone instead of scene
    this.inputZone.on('pointerdown', this.handlePointerDown, this)
    this.inputZone.on('pointermove', this.handlePointerMove, this)
    this.inputZone.on('pointerup', this.handlePointerUp, this)
    
    console.log('AnnotationManager event handlers set up with input zone:', width, 'x', height)
  }
  
  public destroy(): void {
    // Clean up input zone
    if (this.inputZone) {
      this.inputZone.destroy()
    }
    
    // Clean up preview graphics
    this.previewGraphics.destroy()
    this.cursorGraphics.destroy()
    this.modeIndicator.destroy()
    
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
    // First, always try to snap to exact grid positions
    const gridX = Math.round((point.x - this.gridOrigin.x) / this.gridSize)
    const gridY = Math.round((point.y - this.gridOrigin.y) / this.gridSize)
    const gridSnapX = this.gridOrigin.x + gridX * this.gridSize
    const gridSnapY = this.gridOrigin.y + gridY * this.gridSize
    
    const gridDistance = Math.sqrt(
      Math.pow(point.x - gridSnapX, 2) + 
      Math.pow(point.y - gridSnapY, 2)
    )
    
    // Always snap to grid if within priority threshold
    if (gridDistance < GRID_SNAP_PRIORITY) {
      return {
        x: gridSnapX,
        y: gridSnapY,
        gridX: gridX,
        gridY: gridY
      }
    }
    
    // Otherwise check for feature snap points
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
    
    // If no snap point found but within general grid snap distance, snap to grid
    if (gridDistance < SNAP_THRESHOLD) {
      return {
        x: gridSnapX,
        y: gridSnapY,
        gridX: gridX,
        gridY: gridY
      }
    }
    
    return point
  }
  
  private findNearestSnapPoint(point: AnnotationPoint): SnapPoint | null {
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
    
    return closestSnap
  }
  
  // Annotation creation methods
  public startCreatingAnnotation(type: AnnotationType): void {
    this.isCreating = true
    this.creationType = type
    this.creationPoints = []
    this.scene.input.setDefaultCursor('none') // Hide default cursor
    this.updateModeIndicator()
    this.modeIndicator.setVisible(true)
  }
  
  public cancelCreation(): void {
    this.isCreating = false
    this.creationType = null
    this.creationPoints = []
    this.previewGraphics.clear()
    this.cursorGraphics.clear()
    this.scene.input.setDefaultCursor('default')
    this.modeIndicator.setVisible(false)
  }
  
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isInteractive) return
    
    const point: AnnotationPoint = {
      x: pointer.worldX,
      y: pointer.worldY
    }
    
    console.log('AnnotationManager handlePointerDown:', point, 'isCreating:', this.isCreating, 'type:', this.creationType)
    
    if (this.isCreating) {
      const snappedPoint = this.snapToGrid(point)
      this.creationPoints.push(snappedPoint)
      
      console.log('Added creation point:', snappedPoint, 'total points:', this.creationPoints.length)
      
      // Check if we have enough points to create the annotation
      if (this.shouldCreateAnnotation()) {
        console.log('Creating annotation...')
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
    
    if (!this.isInteractive) return
    
    if (this.isCreating) {
      this.updatePreview(snappedPoint)
      this.updateCustomCursor(snappedPoint)
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
        return this.creationPoints.length >= 2
      case 'ordinate-dimension':
        return this.creationPoints.length >= 1 // Only need one click for ordinate
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
    
    console.log('Creating annotation type:', this.creationType)
    
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
      console.log('Adding annotation:', annotation)
      this.addAnnotation(annotation)
    } else {
      console.log('Failed to create annotation')
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
    const [measurePoint] = this.creationPoints
    
    // Snap to bottom edge of beam
    const snappedMeasurePoint = {
      ...measurePoint,
      y: this.beamBottom
    }
    
    return {
      id,
      type: 'ordinate-dimension',
      visible: true,
      locked: false,
      style: { ...DEFAULT_ANNOTATION_STYLE },
      measurePoint: snappedMeasurePoint,
      originSide: this.ordinateOriginSide,
      jogOffset: 40,
      text: '',
      unit: 'in',
      autoText: true,
      showArrow: true,
      witnessLineHeight: 10,
      beamLength: this.beamLength,
      beamBottom: this.beamBottom
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
    console.log('Rendering annotation:', annotation.type, annotation.id)
    
    // Remove existing graphics
    const existingContainer = this.annotationGraphics.get(annotation.id)
    if (existingContainer) {
      existingContainer.destroy()
    }
    
    // Create new container
    const container = this.scene.add.container(0, 0)
    container.setDepth(500) // Ensure annotations appear above other elements
    
    // Render based on type
    try {
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
      console.log('Rendered successfully, container children:', container.length)
    } catch (error) {
      console.error('Error rendering annotation:', error)
    }
    
    // Make interactive
    container.setInteractive()
    container.setData('annotationId', annotation.id)
    
    this.annotationGraphics.set(annotation.id, container)
  }
  
  // Interaction methods
  private getAnnotationAtPoint(point: AnnotationPoint): Annotation | null {
    let foundAnnotation: Annotation | null = null
    
    // Check each annotation container for hit
    this.annotationGraphics.forEach((container, id) => {
      if (container.getBounds().contains(point.x, point.y)) {
        foundAnnotation = this.annotations.get(id) || null
      }
    })
    
    return foundAnnotation
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
    
    const annotation = this.activeAnnotation.annotation
    
    if (annotation.type === 'ordinate-dimension') {
      // Update measure point X position only (keep Y at beam bottom)
      const snappedPoint = this.snapToGrid({ ...point, y: this.beamBottom })
      this.updateAnnotation(annotation.id, {
        measurePoint: snappedPoint
      })
    }
  }
  
  // Public API
  public getAnnotations(): Annotation[] {
    const annotations = Array.from(this.annotations.values())
    console.log('AnnotationManager.getAnnotations returning', annotations.length, 'annotations')
    return annotations
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
  
  public setBeamDimensions(beamBottom: number, beamLength: number): void {
    this.beamBottom = beamBottom
    this.beamLength = beamLength
  }
  
  public setOrdinateOriginSide(side: 'left' | 'right'): void {
    this.ordinateOriginSide = side
  }
  
  private updatePreview(currentPoint: AnnotationPoint): void {
    this.previewGraphics.clear()
    
    if (!this.creationType || this.creationPoints.length === 0) return
    
    // Set engineering preview style
    this.previewGraphics.lineStyle(1.5, 0x000000, 0.7) // Black dashed preview
    this.previewGraphics.fillStyle(0xffffff, 0.9) // White background for text
    
    switch (this.creationType) {
      case 'linear-dimension':
        if (this.creationPoints.length === 1) {
          const start = this.creationPoints[0]
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(start.x, start.y)
          this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.stroke()
          
          // Show distance with proper formatting
          const distance = Math.sqrt(
            Math.pow(currentPoint.x - start.x, 2) + 
            Math.pow(currentPoint.y - start.y, 2)
          )
          const midX = (start.x + currentPoint.x) / 2
          const midY = (start.y + currentPoint.y) / 2
          const inches = distance / this.gridSize
          
          // Format distance as feet and inches
          let text: string
          if (inches >= 12) {
            const feet = Math.floor(inches / 12)
            const remainingInches = inches % 12
            text = `${feet}'-${remainingInches.toFixed(1)}"`
          } else {
            text = `${inches.toFixed(1)}"`
          }
          
          // Calculate text bounds
          const fontSize = 14
          const textWidth = text.length * fontSize * 0.6
          const textHeight = fontSize
          
          // Draw text background with border
          this.previewGraphics.lineStyle(1, 0x000000, 1)
          this.previewGraphics.fillStyle(0xffffff, 1)
          this.previewGraphics.fillRect(
            midX - textWidth/2 - 4,
            midY - textHeight/2 - 2,
            textWidth + 8,
            textHeight + 4
          )
          this.previewGraphics.strokeRect(
            midX - textWidth/2 - 4,
            midY - textHeight/2 - 2,
            textWidth + 8,
            textHeight + 4
          )
        }
        break
        
      case 'ordinate-dimension':
        // Show vertical line at cursor position
        this.previewGraphics.beginPath()
        this.previewGraphics.moveTo(currentPoint.x, this.beamBottom)
        this.previewGraphics.lineTo(currentPoint.x, this.beamBottom + 50)
        this.previewGraphics.stroke()
        
        // Show distance from selected origin
        const gridX = Math.round((currentPoint.x - this.gridOrigin.x) / this.gridSize)
        const distance = this.ordinateOriginSide === 'left' 
          ? gridX 
          : this.beamLength - gridX
        const distanceText = `${Math.abs(distance)}"`
        
        // Draw text background
        const textBounds = this.scene.add.text(0, 0, distanceText, { fontSize: '12px' })
        const textWidth = textBounds.width
        const textHeight = textBounds.height
        textBounds.destroy()
        
        this.previewGraphics.fillRect(
          currentPoint.x - textWidth/2 - 4,
          this.beamBottom + 40 - textHeight/2 - 2,
          textWidth + 8,
          textHeight + 4
        )
        break
        
      case 'callout':
        // Show where callout will be placed
        this.previewGraphics.fillStyle(0x0066cc, 0.5)
        this.previewGraphics.fillCircle(currentPoint.x, currentPoint.y, 5)
        
        // Show preview of text box
        const previewBoxX = currentPoint.x + 50
        const previewBoxY = currentPoint.y - 30
        this.previewGraphics.lineStyle(1, 0x0066cc, 0.5)
        this.previewGraphics.strokeRect(previewBoxX, previewBoxY, 100, 40)
        
        // Show leader line preview
        this.previewGraphics.beginPath()
        this.previewGraphics.moveTo(currentPoint.x, currentPoint.y)
        this.previewGraphics.lineTo(previewBoxX, previewBoxY + 20)
        this.previewGraphics.stroke()
        break
    }
  }
  
  private createModeIndicator(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(20, 20)
    container.setDepth(1002)
    
    // Background
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x000000, 0.8)
    bg.fillRoundedRect(0, 0, 200, 40, 5)
    
    // Text
    const text = this.scene.add.text(10, 20, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    })
    text.setOrigin(0, 0.5)
    
    container.add([bg, text])
    container.setData('text', text)
    
    return container
  }
  
  private updateModeIndicator(): void {
    const text = this.modeIndicator.getData('text') as Phaser.GameObjects.Text
    if (!text) return
    
    let modeText = ''
    switch (this.creationType) {
      case 'linear-dimension':
        modeText = '📏 Linear Dimension'
        break
      case 'ordinate-dimension':
        modeText = '📐 Ordinate Dimension'
        break
      case 'callout':
        modeText = '💬 Callout'
        break
    }
    
    text.setText(modeText)
  }
  
  private updateCustomCursor(point: AnnotationPoint): void {
    this.cursorGraphics.clear()
    
    // Check if snapped to grid
    const isSnapping = point.gridX !== undefined && point.gridY !== undefined
    
    // Draw engineering-style crosshair cursor
    // White lines with black outline for visibility
    this.cursorGraphics.lineStyle(3, 0x000000, 0.5) // Black outline
    this.cursorGraphics.beginPath()
    this.cursorGraphics.moveTo(point.x - 15, point.y)
    this.cursorGraphics.lineTo(point.x - 5, point.y)
    this.cursorGraphics.moveTo(point.x + 5, point.y)
    this.cursorGraphics.lineTo(point.x + 15, point.y)
    this.cursorGraphics.moveTo(point.x, point.y - 15)
    this.cursorGraphics.lineTo(point.x, point.y - 5)
    this.cursorGraphics.moveTo(point.x, point.y + 5)
    this.cursorGraphics.lineTo(point.x, point.y + 15)
    this.cursorGraphics.stroke()
    
    this.cursorGraphics.lineStyle(1, 0xffffff, 1) // White lines
    this.cursorGraphics.beginPath()
    this.cursorGraphics.moveTo(point.x - 15, point.y)
    this.cursorGraphics.lineTo(point.x - 5, point.y)
    this.cursorGraphics.moveTo(point.x + 5, point.y)
    this.cursorGraphics.lineTo(point.x + 15, point.y)
    this.cursorGraphics.moveTo(point.x, point.y - 15)
    this.cursorGraphics.lineTo(point.x, point.y - 5)
    this.cursorGraphics.moveTo(point.x, point.y + 5)
    this.cursorGraphics.lineTo(point.x, point.y + 15)
    this.cursorGraphics.stroke()
    
    // Draw snap indicator if snapped to grid
    if (isSnapping) {
      this.cursorGraphics.lineStyle(2, 0x00ff00, 1)
      this.cursorGraphics.fillStyle(0x00ff00, 0.3)
      this.cursorGraphics.fillCircle(point.x, point.y, 4)
      this.cursorGraphics.strokeCircle(point.x, point.y, 4)
    }
    
    // Add type-specific indicators
    switch (this.creationType) {
      case 'linear-dimension':
        // Show dimension arrows
        if (this.creationPoints.length === 1) {
          const start = this.creationPoints[0]
          const angle = Math.atan2(point.y - start.y, point.x - start.x)
          this.drawSmallArrow(point.x, point.y, angle)
        }
        break
        
      case 'ordinate-dimension':
        // Show vertical line
        this.cursorGraphics.lineStyle(1, 0x0066cc, 0.5)
        this.cursorGraphics.beginPath()
        this.cursorGraphics.moveTo(point.x, point.y - 20)
        this.cursorGraphics.lineTo(point.x, point.y + 20)
        this.cursorGraphics.stroke()
        break
        
      case 'callout':
        // Show leader indicator
        this.cursorGraphics.fillStyle(0x0066cc)
        this.cursorGraphics.fillCircle(point.x, point.y, 3)
        break
    }
  }
  
  private drawSmallArrow(x: number, y: number, angle: number): void {
    const arrowLength = 8
    const arrowAngle = Math.PI / 6
    
    this.cursorGraphics.lineStyle(1, 0x0066cc)
    this.cursorGraphics.beginPath()
    this.cursorGraphics.moveTo(x, y)
    this.cursorGraphics.lineTo(
      x - Math.cos(angle - arrowAngle) * arrowLength,
      y - Math.sin(angle - arrowAngle) * arrowLength
    )
    this.cursorGraphics.moveTo(x, y)
    this.cursorGraphics.lineTo(
      x - Math.cos(angle + arrowAngle) * arrowLength,
      y - Math.sin(angle + arrowAngle) * arrowLength
    )
    this.cursorGraphics.stroke()
  }
  
  public setInteractive(interactive: boolean): void {
    this.isInteractive = interactive
    if (this.inputZone) {
      this.inputZone.setInteractive(interactive)
    }
    // Hide creation UI elements when not interactive
    if (!interactive) {
      this.cancelCreation()
      this.cursorGraphics.setVisible(false)
      this.modeIndicator.setVisible(false)
    } else {
      this.cursorGraphics.setVisible(true)
    }
  }
  
  public get isCreatingAnnotation(): boolean {
    return this.isCreating
  }
  
  public restoreAnnotations(savedAnnotations: any[]): void {
    console.log('AnnotationManager.restoreAnnotations called with', savedAnnotations.length, 'annotations')
    savedAnnotations.forEach(saved => {
      // Recreate the annotation with the same properties
      console.log('Restoring annotation:', saved.id, saved.type)
      this.annotations.set(saved.id, saved)
      this.renderAnnotation(saved)
    })
    console.log('Total annotations after restore:', this.annotations.size)
  }
}