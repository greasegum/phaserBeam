import Phaser from 'phaser'
import { 
  Annotation, 
  AnnotationType, 
  AnnotationPoint, 
  LinearDimension, 
  OrdinateDimension, 
  Callout, 
  TextBlock,
  SnapPoint, 
  AnnotationInteraction,
  DEFAULT_ANNOTATION_STYLE,
  SNAP_THRESHOLD,
  GRID_SNAP_PRIORITY
} from '../types/annotations'
import { LinearDimensionRenderer } from './LinearDimensionRenderer'
import { OrdinateDimensionRenderer } from './OrdinateDimensionRenderer'
import { CalloutRenderer } from './CalloutRenderer'
import { TextBlockRenderer } from './TextBlockRenderer'
import { EnhancedAnnotationEffects } from './EnhancedAnnotationEffects'
import { logger } from '../utils/Result'

export class AnnotationManager {
  private textInputElement?: HTMLInputElement
  private textInputContainer?: HTMLDivElement
  private lastClickTime?: number
  private lastClickAnnotation?: string
  private scene: Phaser.Scene
  private annotations: Map<string, Annotation> = new Map()
  private systemAnnotations: Map<string, Annotation> = new Map()
  private annotationGraphics: Map<string, Phaser.GameObjects.Container> = new Map()
  private snapPoints: SnapPoint[] = []
  private activeAnnotation: AnnotationInteraction | null = null
  private selectedAnnotationId: string | null = null
  private gridSize: number
  private gridOrigin: { x: number, y: number }
  private beamBottom: number = 0
  private beamLength: number = 0
  private isInteractive: boolean = true
  private beamProfile?: any
  private gridTransform?: { scale: number; offsetX: number; offsetY: number }
  
  // Renderers
  private linearDimensionRenderer: LinearDimensionRenderer
  private ordinateDimensionRenderer: OrdinateDimensionRenderer
  private calloutRenderer: CalloutRenderer
  private textBlockRenderer: TextBlockRenderer
  private enhancedEffects: EnhancedAnnotationEffects
  
  // Creation state
  private isCreating: boolean = false
  private creationType: AnnotationType | null = null
  private creationPoints: AnnotationPoint[] = []
  private previewGraphics: Phaser.GameObjects.Graphics
  private ordinateOriginSide: 'left' | 'right' = 'left'
  private modeIndicator: Phaser.GameObjects.Container
  private cursorGraphics: Phaser.GameObjects.Graphics
  private inputZone!: Phaser.GameObjects.Zone
  
  constructor(scene: Phaser.Scene, gridSize: number, gridOrigin: { x: number, y: number }, beamBottom?: number, beamLength?: number) {
    this.scene = scene
    this.gridSize = gridSize
    this.gridOrigin = gridOrigin
    this.beamBottom = beamBottom || 0
    this.beamLength = beamLength || 0
    
    // Initialize renderers
    this.linearDimensionRenderer = new LinearDimensionRenderer(scene, gridSize)
    this.ordinateDimensionRenderer = new OrdinateDimensionRenderer(scene, gridSize)
    this.calloutRenderer = new CalloutRenderer(scene, this.beamBottom)
    this.textBlockRenderer = new TextBlockRenderer(scene)
    this.enhancedEffects = new EnhancedAnnotationEffects(scene)
    
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
    
    logger.debug('AnnotationManager event handlers initialized', { width, height })
  }
  
  public update(): void {
    // Update enhanced effects
    this.enhancedEffects.update()
    
    // Apply magnetic attraction to annotations near cursor if enabled
    if (this.scene.input.activePointer) {
      const pointer = this.scene.input.activePointer
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
      
      this.annotationGraphics.forEach((container, id) => {
        if (!this.systemAnnotations.has(id)) { // Don't apply to system annotations
          this.enhancedEffects.applyMagneticAttraction(container, worldPoint.x, worldPoint.y, 0.05)
        }
      })
    }
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
    
    // Clean up text input if exists
    if (this.textInputContainer) {
      document.body.removeChild(this.textInputContainer)
      this.textInputContainer = undefined
      this.textInputElement = undefined
    }
    
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
      
      // Add grid line midpoints
      this.snapPoints.push(
        { x: cell.x + cell.width / 2, y: cell.y, type: 'grid-edge', priority: 2 }, // Top edge midpoint
        { x: cell.x + cell.width / 2, y: cell.y + cell.height, type: 'grid-edge', priority: 2 }, // Bottom edge midpoint
        { x: cell.x, y: cell.y + cell.height / 2, type: 'grid-edge', priority: 2 }, // Left edge midpoint
        { x: cell.x + cell.width, y: cell.y + cell.height / 2, type: 'grid-edge', priority: 2 } // Right edge midpoint
      )
      
      // Add grid centers
      this.snapPoints.push({
        x: cell.x + cell.width / 2,
        y: cell.y + cell.height / 2,
        type: 'grid-center',
        priority: 3
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
    // If already creating, reset state for the new tool
    if (this.isCreating && this.creationType !== type) {
      this.creationPoints = []
      this.previewGraphics.clear()
    }
    
    this.isCreating = true
    this.creationType = type
    this.creationPoints = []
    this.scene.input.setDefaultCursor('crosshair') // Use standard crosshair cursor
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
  
  public isDragging(): boolean {
    return this.activeAnnotation?.isDragging || false
  }
  
  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.isInteractive) return
    
    const point: AnnotationPoint = {
      x: pointer.worldX,
      y: pointer.worldY
    }
    
    logger.debug('Handling pointer down', { point, isCreating: this.isCreating, type: this.creationType })
    
    // Event handled - no need to disable camera as scene already checks isCreatingAnnotation()
    
    if (this.isCreating) {
      const snappedPoint = this.snapToGrid(point)
      this.creationPoints.push(snappedPoint)
      
      logger.debug('Added creation point', { point: snappedPoint, totalPoints: this.creationPoints.length })
      
      // Check if we have enough points to create the annotation
      if (this.shouldCreateAnnotation()) {
        logger.debug('Creating annotation from points')
        this.createAnnotation()
        // Reset points but keep the tool active for repeatability
        this.creationPoints = []
        this.previewGraphics.clear()
        // Don't call cancelCreation() to keep the tool active
      }
    
    } else {
      // Check if clicking on an existing annotation
      const result = this.getAnnotationAtPoint(point)
      if (result) {
        // Check for double-click to edit
        const now = Date.now()
        if (this.lastClickTime && now - this.lastClickTime < 300 && 
            this.lastClickAnnotation === result.annotation.id) {
          // Double click - edit annotation
          this.editAnnotation(result.annotation)
        } else {
          // Single click - start dragging
          this.startDragging(result.annotation, point, result.handle)
        }
        this.lastClickTime = now
        this.lastClickAnnotation = result.annotation.id
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
        return this.creationPoints.length >= 2 // Need 2 clicks: arrow point and text location
      default:
        return false
    }
  }
  
  private createAnnotation(): void {
    if (!this.creationType) return
    
    const id = `annotation_${Date.now()}`
    let annotation: Annotation | null = null
    
    logger.debug('Creating annotation', { type: this.creationType })
    
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
    const [arrowPoint, textPoint] = this.creationPoints
    
    // For diagonal-horizontal leader, we only need the arrow point
    // The renderer will calculate the diagonal-horizontal path
    const dx = textPoint.x - arrowPoint.x
    const dy = textPoint.y - arrowPoint.y
    
    // Calculate text box position relative to text point
    const textBoxWidth = 120
    const textBoxHeight = 50
    let textBoxX = textPoint.x - textBoxWidth / 2
    let textBoxY = textPoint.y - textBoxHeight / 2
    
    // Adjust if text point is at edge of box
    if (dx > 0) {
      textBoxX = textPoint.x - 10 // Left edge connection
    } else {
      textBoxX = textPoint.x - textBoxWidth + 10 // Right edge connection
    }
    
    const callout: Callout = {
      id,
      type: 'callout',
      visible: true,
      locked: false,
      style: { ...DEFAULT_ANNOTATION_STYLE },
      leaderPoints: [arrowPoint], // Only store the arrow point
      textBox: {
        x: textBoxX,
        y: textBoxY,
        width: textBoxWidth,
        height: textBoxHeight,
        text: '', // Start with empty text
        showBorder: true,
        padding: 8
      },
      leaderStyle: 'diagonal', // Use diagonal-horizontal leader
      endStyle: 'arrow'
    }
    
    // Prompt for text content after creation
    setTimeout(() => {
      this.promptForCalloutText(callout)
    }, 100)
    
    return callout
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
      
      // Apply intelligent nudging for callouts to avoid overlaps
      if (annotation.type === 'callout') {
        this.applyCalloutNudging(annotation as Callout)
      }
      
      this.renderAnnotation(annotation)
    }
  }
  
  private applyCalloutNudging(targetCallout: Callout): void {
    const padding = 10 // Minimum space between callouts
    const iterations = 10 // Max nudge iterations
    
    for (let iter = 0; iter < iterations; iter++) {
      let hasOverlap = false
      
      // Check against all other callouts
      this.annotations.forEach((annotation) => {
        if (annotation.id === targetCallout.id || annotation.type !== 'callout') return
        
        const otherCallout = annotation as Callout
        
        // Check text box overlap
        const targetBounds = {
          left: targetCallout.textBox.x,
          right: targetCallout.textBox.x + targetCallout.textBox.width,
          top: targetCallout.textBox.y,
          bottom: targetCallout.textBox.y + targetCallout.textBox.height
        }
        
        const otherBounds = {
          left: otherCallout.textBox.x,
          right: otherCallout.textBox.x + otherCallout.textBox.width,
          top: otherCallout.textBox.y,
          bottom: otherCallout.textBox.y + otherCallout.textBox.height
        }
        
        // Check for overlap
        if (targetBounds.left < otherBounds.right + padding &&
            targetBounds.right > otherBounds.left - padding &&
            targetBounds.top < otherBounds.bottom + padding &&
            targetBounds.bottom > otherBounds.top - padding) {
          
          hasOverlap = true
          
          // Calculate nudge direction (away from overlap)
          const targetCenterX = (targetBounds.left + targetBounds.right) / 2
          const targetCenterY = (targetBounds.top + targetBounds.bottom) / 2
          const otherCenterX = (otherBounds.left + otherBounds.right) / 2
          const otherCenterY = (otherBounds.top + otherBounds.bottom) / 2
          
          const dx = targetCenterX - otherCenterX
          const dy = targetCenterY - otherCenterY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0) {
            // Nudge away from the other callout
            const nudgeDistance = 5
            const nudgeX = (dx / distance) * nudgeDistance
            const nudgeY = (dy / distance) * nudgeDistance
            
            targetCallout.textBox.x += nudgeX
            targetCallout.textBox.y += nudgeY
            
            // No need to update leader points for diagonal-horizontal leader
            // The renderer calculates the path dynamically
          }
        }
      })
      
      if (!hasOverlap) break
    }
  }
  
  private renderAnnotation(annotation: Annotation, isSystemGenerated: boolean = false): void {
    // Remove existing graphics if they exist
    const existingContainer = this.annotationGraphics.get(annotation.id)
    if (existingContainer) {
      existingContainer.destroy()
    }

    // Create new container
    const container = this.scene.add.container(0, 0)
    container.setDepth(500) // Ensure annotations appear above other elements

    switch (annotation.type) {
      case 'linear-dimension':
        this.linearDimensionRenderer.render(annotation, container)
        break
      case 'ordinate-dimension':
        this.ordinateDimensionRenderer.render(annotation, container, isSystemGenerated)
        break
      case 'callout':
        this.calloutRenderer.render(annotation, container)
        break
      case 'text-block':
        this.textBlockRenderer.render(annotation, container)
        break
      default:
        console.warn('Unknown annotation type:', annotation.type)
        return
    }

    // Store the container
    this.annotationGraphics.set(annotation.id, container)

    // Make interactive if not system-generated and interactive mode is on
    if (!isSystemGenerated && this.isInteractive) {
      container.setInteractive()
      container.on('pointerdown', () => this.handleAnnotationClick(annotation))
    }
  }

  /**
   * Create a system-generated text block (title, label, etc.)
   */
  public createTextBlock(
    id: string,
    text: string,
    position: { x: number; y: number },
    options: {
      fontSize?: number
      fontFamily?: string
      textColor?: string
      alignment?: 'left' | 'center' | 'right'
      rotation?: number
      isSystemGenerated?: boolean
      backgroundColor?: string
      borderColor?: string
      borderWidth?: number
      padding?: number
    } = {}
  ): void {
    const textBlock: TextBlock = {
      id,
      type: 'text-block',
      visible: true,
      locked: true,
      style: {
        ...DEFAULT_ANNOTATION_STYLE,
        fontSize: options.fontSize || DEFAULT_ANNOTATION_STYLE.fontSize,
        fontFamily: options.fontFamily || DEFAULT_ANNOTATION_STYLE.fontFamily,
        textColor: options.textColor || DEFAULT_ANNOTATION_STYLE.textColor,
        color: 0x000000,
        lineWidth: 1
      },
      position: {
        x: position.x,
        y: position.y
      },
      text,
      alignment: options.alignment || 'center',
      rotation: options.rotation || 0,
      backgroundColor: options.backgroundColor,
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      padding: options.padding,
      isSystemGenerated: options.isSystemGenerated ?? true
    }

    // Add to system annotations if system-generated, otherwise to regular annotations
    if (textBlock.isSystemGenerated) {
      this.systemAnnotations.set(id, textBlock)
    } else {
      this.annotations.set(id, textBlock)
    }

    // Render the text block
    this.renderAnnotation(textBlock, textBlock.isSystemGenerated)
  }

  /**
   * Create system-generated title and labels
   */
  public createSystemTextBlocks(
    elevationView: 'N' | 'S' | 'E' | 'W',
    beamWidth: number,
    startX: number,
    centerY: number
  ): void {
    // Create title
    const elevationNames = { 'N': 'North', 'S': 'South', 'E': 'East', 'W': 'West' }
    const titleX = startX + beamWidth / 2
    this.createTextBlock(
      'system-title',
      `${elevationNames[elevationView]} Beam Elevation`,
      { x: titleX, y: 30 },
      {
        fontSize: 20,
        textColor: '#333',
        fontFamily: 'Arial, sans-serif',
        alignment: 'center',
        isSystemGenerated: true
      }
    )

    // Create end labels based on elevation view
    let leftLabel: string, rightLabel: string
    switch (elevationView) {
      case 'N': // Looking at North elevation
        leftLabel = 'East End'
        rightLabel = 'West End'
        break
      case 'S': // Looking at South elevation
        leftLabel = 'West End'
        rightLabel = 'East End'
        break
      case 'E': // Looking at East elevation
        leftLabel = 'South End'
        rightLabel = 'North End'
        break
      case 'W': // Looking at West elevation
        leftLabel = 'North End'
        rightLabel = 'South End'
        break
      default:
        leftLabel = 'Left End'
        rightLabel = 'Right End'
    }

    // Calculate label position
    const totalHeight = this.beamProfile?.webHeight + 2 * this.beamProfile?.flangeThickness || 0
    const beamTopGrid = -totalHeight / 2
    const beamTop = this.gridTransform ? 
      this.gridTransform.offsetY + beamTopGrid * this.gridTransform.scale : 
      centerY - (totalHeight * this.gridSize) / 2
    const labelY = beamTop - 30

    // Create left end label
    this.createTextBlock(
      'system-left-end-label',
      leftLabel,
      { x: startX, y: labelY },
      {
        fontSize: 14,
        textColor: '#333',
        fontFamily: 'Arial, sans-serif',
        alignment: 'center',
        isSystemGenerated: true
      }
    )

    // Create right end label
    this.createTextBlock(
      'system-right-end-label',
      rightLabel,
      { x: startX + beamWidth, y: labelY },
      {
        fontSize: 14,
        textColor: '#333',
        fontFamily: 'Arial, sans-serif',
        alignment: 'center',
        isSystemGenerated: true
      }
    )
  }

  /**
   * Clear all system text blocks
   */
  public clearSystemTextBlocks(): void {
    const textBlockIds = ['system-title', 'system-left-end-label', 'system-right-end-label']
    
    textBlockIds.forEach(id => {
      const annotation = this.systemAnnotations.get(id)
      if (annotation && annotation.type === 'text-block') {
        const container = this.annotationGraphics.get(id)
        if (container) {
          container.destroy()
        }
        this.systemAnnotations.delete(id)
      }
    })
  }

  private handleAnnotationClick(annotation: Annotation): void {
    // Handle annotation click - could be used for selection, editing, etc.
    console.log('Annotation clicked:', annotation.id)
  }
  
  // Interaction methods
  private getAnnotationAtPoint(point: AnnotationPoint): { annotation: Annotation, handle?: string } | null {
    let foundResult: { annotation: Annotation, handle?: string } | null = null
    
    // Check each annotation in reverse order (top to bottom)
    const entries = Array.from(this.annotationGraphics.entries()).reverse()
    
    for (const [id, container] of entries) {
      const annotation = this.annotations.get(id)
      if (!annotation) continue
      
      if (annotation.type === 'callout') {
        const callout = annotation as Callout
        
        // Check text box
        const textBoxBounds = new Phaser.Geom.Rectangle(
          callout.textBox.x,
          callout.textBox.y,
          callout.textBox.width,
          callout.textBox.height
        )
        if (textBoxBounds.contains(point.x, point.y)) {
          return { annotation, handle: 'textBox' }
        }
        
        // Check arrow point (first leader point)
        if (callout.leaderPoints.length > 0) {
          const arrowPoint = callout.leaderPoints[0]
          const distance = Math.sqrt(
            Math.pow(point.x - arrowPoint.x, 2) + 
            Math.pow(point.y - arrowPoint.y, 2)
          )
          if (distance < 10) {
            return { annotation, handle: 'arrow' }
          }
        }
        
        // Check leader line
        for (let i = 0; i < callout.leaderPoints.length - 1; i++) {
          const p1 = callout.leaderPoints[i]
          const p2 = callout.leaderPoints[i + 1]
          const dist = this.pointToLineDistance(point, p1, p2)
          if (dist < 5) {
            return { annotation, handle: 'leader' }
          }
        }
      } else if (container.getBounds().contains(point.x, point.y)) {
        foundResult = { annotation }
      }
    }
    
    return foundResult
  }
  
  private pointToLineDistance(point: AnnotationPoint, lineStart: AnnotationPoint, lineEnd: AnnotationPoint): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) {
      param = dot / lenSq
    }
    
    let xx, yy
    
    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    
    return Math.sqrt(dx * dx + dy * dy)
  }
  
  private startDragging(annotation: Annotation, point: AnnotationPoint, handle?: string): void {
    this.activeAnnotation = {
      annotation,
      isDragging: true,
      startDragPoint: point,
      dragHandle: handle
    }
  }
  
  private updateDraggedAnnotation(point: AnnotationPoint): void {
    if (!this.activeAnnotation || !this.activeAnnotation.startDragPoint) return
    
    const annotation = this.activeAnnotation.annotation
    const snappedPoint = this.snapToGrid(point)
    const dx = snappedPoint.x - this.activeAnnotation.startDragPoint.x
    const dy = snappedPoint.y - this.activeAnnotation.startDragPoint.y
    
    if (annotation.type === 'callout') {
      const callout = annotation as Callout
      
      if (this.activeAnnotation.dragHandle === 'textBox') {
        // Move text box
        callout.textBox.x += dx
        callout.textBox.y += dy
      } else if (this.activeAnnotation.dragHandle === 'arrow') {
        // Move arrow point
        if (callout.leaderPoints.length > 0) {
          callout.leaderPoints[0] = snappedPoint
          // Recalculate midpoint
          if (callout.leaderPoints.length > 1) {
            const textCenterX = callout.textBox.x + callout.textBox.width / 2
            const textCenterY = callout.textBox.y + callout.textBox.height / 2
            const dx = textCenterX - snappedPoint.x
            const dy = textCenterY - snappedPoint.y
            
            if (Math.abs(dx) > Math.abs(dy)) {
              callout.leaderPoints[1] = {
                x: snappedPoint.x,
                y: textCenterY
              }
            } else {
              callout.leaderPoints[1] = {
                x: textCenterX,
                y: snappedPoint.y
              }
            }
          }
        }
      } else {
        // Move entire callout
        callout.textBox.x += dx
        callout.textBox.y += dy
        callout.leaderPoints = callout.leaderPoints.map(p => ({
          x: p.x + dx,
          y: p.y + dy
        }))
      }
      
      this.updateAnnotation(annotation.id, callout)
      this.activeAnnotation.startDragPoint = snappedPoint
      
    } else if (annotation.type === 'ordinate-dimension') {
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
    // Update only system ordinate dimensions
    this.updateSystemOrdinateOrigin(side)
  }
  
  /**
   * Update origin side for system ordinate dimensions only
   */
  private updateSystemOrdinateOrigin(side: 'left' | 'right'): void {
    this.systemAnnotations.forEach((annotation, id) => {
      if (annotation.type === 'ordinate-dimension' && id.includes('system-ordinate')) {
        const ordinateDim = annotation as OrdinateDimension
        ordinateDim.originSide = side
        
        // Update the text based on new origin
        if (ordinateDim.measurePoint.gridX !== undefined) {
          const value = side === 'left' 
            ? ordinateDim.measurePoint.gridX 
            : this.beamLength - ordinateDim.measurePoint.gridX
          ordinateDim.text = `${value}"`
        }
        
        // Re-render the dimension
        const container = this.annotationGraphics.get(id)
        if (container) {
          container.destroy()
          this.renderAnnotation(ordinateDim, true)
        }
      }
    })
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
        if (this.creationPoints.length === 0) {
          // First click preview - show arrow point
          this.previewGraphics.fillStyle(0xff0000, 0.5)
          this.previewGraphics.fillCircle(currentPoint.x, currentPoint.y, 5)
          
          // Draw arrow indicator
          this.previewGraphics.lineStyle(2, 0xff0000, 0.5)
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(currentPoint.x - 10, currentPoint.y)
          this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.lineTo(currentPoint.x - 5, currentPoint.y - 5)
          this.previewGraphics.moveTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.lineTo(currentPoint.x - 5, currentPoint.y + 5)
          this.previewGraphics.stroke()
        } else {
          // Second click - show diagonal-horizontal leader and text box
          const arrowPoint = this.creationPoints[0]
          
          // Calculate diagonal-horizontal path
          const dx = currentPoint.x - arrowPoint.x
          const horizontalY = currentPoint.y
          const horizontalX = arrowPoint.x + dx * 0.7
          
          // Draw diagonal-horizontal leader line
          this.previewGraphics.lineStyle(2, 0x0066cc, 0.8)
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(arrowPoint.x, arrowPoint.y)
          this.previewGraphics.lineTo(horizontalX, horizontalY)
          this.previewGraphics.lineTo(currentPoint.x, currentPoint.y)
          this.previewGraphics.stroke()
          
          // Draw improved arrow head
          const firstAngle = Math.atan2(horizontalY - arrowPoint.y, horizontalX - arrowPoint.x)
          this.previewGraphics.fillStyle(0x0066cc, 0.8)
          this.previewGraphics.beginPath()
          this.previewGraphics.moveTo(arrowPoint.x, arrowPoint.y)
          this.previewGraphics.lineTo(
            arrowPoint.x + Math.cos(firstAngle - Math.PI / 5) * 12,
            arrowPoint.y + Math.sin(firstAngle - Math.PI / 5) * 12
          )
          this.previewGraphics.lineTo(
            arrowPoint.x + Math.cos(firstAngle) * 8,
            arrowPoint.y + Math.sin(firstAngle) * 8
          )
          this.previewGraphics.lineTo(
            arrowPoint.x + Math.cos(firstAngle + Math.PI / 5) * 12,
            arrowPoint.y + Math.sin(firstAngle + Math.PI / 5) * 12
          )
          this.previewGraphics.closePath()
          this.previewGraphics.fill()
          
          // Draw text box preview
          const textBoxWidth = 120
          const textBoxHeight = 50
          let previewBoxX = currentPoint.x - textBoxWidth / 2
          const previewBoxY = currentPoint.y - textBoxHeight / 2
          
          if (dx > 0) {
            previewBoxX = currentPoint.x - 10
          } else {
            previewBoxX = currentPoint.x - textBoxWidth + 10
          }
          
          this.previewGraphics.lineStyle(2, 0x0066cc, 0.5)
          this.previewGraphics.strokeRect(previewBoxX, previewBoxY, textBoxWidth, textBoxHeight)
          this.previewGraphics.fillStyle(0x0066cc, 0.1)
          this.previewGraphics.fillRect(previewBoxX, previewBoxY, textBoxWidth, textBoxHeight)
        }
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
    
    // Draw snap indicator if snapped to grid - yellow cross
    if (isSnapping) {
      // Draw black outline first for visibility
      this.cursorGraphics.lineStyle(5, 0x000000, 0.3) // Black outline
      this.cursorGraphics.beginPath()
      this.cursorGraphics.moveTo(point.x - 10, point.y)
      this.cursorGraphics.lineTo(point.x + 10, point.y)
      this.cursorGraphics.moveTo(point.x, point.y - 10)
      this.cursorGraphics.lineTo(point.x, point.y + 10)
      this.cursorGraphics.stroke()
      
      // Draw yellow cross on top
      this.cursorGraphics.lineStyle(3, 0xffff00, 1) // Thick yellow line
      this.cursorGraphics.beginPath()
      this.cursorGraphics.moveTo(point.x - 10, point.y)
      this.cursorGraphics.lineTo(point.x + 10, point.y)
      this.cursorGraphics.moveTo(point.x, point.y - 10)
      this.cursorGraphics.lineTo(point.x, point.y + 10)
      this.cursorGraphics.stroke()
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
        // Show different indicator based on click count
        if (this.creationPoints.length === 0) {
          // First click - show arrow point indicator
          this.cursorGraphics.fillStyle(0xff0000)
          this.cursorGraphics.fillCircle(point.x, point.y, 4)
          this.cursorGraphics.lineStyle(2, 0xff0000)
          // Draw small arrow symbol
          this.cursorGraphics.beginPath()
          this.cursorGraphics.moveTo(point.x - 8, point.y)
          this.cursorGraphics.lineTo(point.x, point.y)
          this.cursorGraphics.lineTo(point.x - 4, point.y - 4)
          this.cursorGraphics.moveTo(point.x, point.y)
          this.cursorGraphics.lineTo(point.x - 4, point.y + 4)
          this.cursorGraphics.stroke()
        } else {
          // Second click - show text box indicator
          this.cursorGraphics.lineStyle(2, 0x0066cc)
          this.cursorGraphics.strokeRect(point.x - 30, point.y - 15, 60, 30)
          this.cursorGraphics.fillStyle(0x0066cc, 0.2)
          this.cursorGraphics.fillRect(point.x - 30, point.y - 15, 60, 30)
        }
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
  
  private promptForCalloutText(callout: Callout): void {
    // Create text input overlay
    if (!this.textInputContainer) {
      this.textInputContainer = document.createElement('div')
      this.textInputContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        width: 300px;
      `
      
      this.textInputElement = document.createElement('input')
      this.textInputElement.type = 'text'
      this.textInputElement.placeholder = 'Enter callout text...'
      this.textInputElement.style.cssText = `
        width: 100%;
        padding: 8px;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      `
      
      const label = document.createElement('div')
      label.textContent = 'Callout Text:'
      label.style.cssText = 'margin-bottom: 8px; font-weight: bold; font-size: 14px;'
      
      const buttonContainer = document.createElement('div')
      buttonContainer.style.cssText = 'margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;'
      
      const okButton = document.createElement('button')
      okButton.textContent = 'OK'
      okButton.style.cssText = `
        padding: 6px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `
      
      const cancelButton = document.createElement('button')
      cancelButton.textContent = 'Cancel'
      cancelButton.style.cssText = `
        padding: 6px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `
      
      this.textInputContainer.appendChild(label)
      this.textInputContainer.appendChild(this.textInputElement)
      buttonContainer.appendChild(cancelButton)
      buttonContainer.appendChild(okButton)
      this.textInputContainer.appendChild(buttonContainer)
    }
    
    // Set current text if editing
    this.textInputElement!.value = callout.textBox.text || ''
    
    // Show the container
    document.body.appendChild(this.textInputContainer!)
    this.textInputElement!.focus()
    this.textInputElement!.select()
    
    // Handle input
    const handleOk = () => {
      const text = this.textInputElement!.value.trim()
      if (text) {
        callout.textBox.text = text
        this.updateAnnotation(callout.id, callout)
      }
      cleanup()
    }
    
    const handleCancel = () => {
      // If this is a new callout with no text, remove it
      if (!callout.textBox.text) {
        this.removeAnnotation(callout.id)
      }
      cleanup()
    }
    
    const cleanup = () => {
      if (this.textInputContainer && this.textInputContainer.parentNode) {
        document.body.removeChild(this.textInputContainer)
      }
      this.textInputElement!.removeEventListener('keydown', handleKeydown)
    }
    
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleOk()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    }
    
    // Find buttons
    const buttons = this.textInputContainer!.querySelectorAll('button')
    buttons[0].onclick = handleCancel
    buttons[1].onclick = handleOk
    this.textInputElement!.addEventListener('keydown', handleKeydown)
  }
  
  public editAnnotation(annotation: Annotation): void {
    if (annotation.type === 'callout') {
      this.promptForCalloutText(annotation as Callout)
    }
    // Add other annotation type editing as needed
  }
  
  /**
   * Create system-generated beam end dimensions
   */
  public createBeamEndDimensions(beamProfile: any, beamLength: number, centerX: number, centerY: number): void {
    const { webHeight, flangeThickness } = beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    const topY = centerY - (totalHeight * this.gridSize) / 2
    const bottomY = centerY + (totalHeight * this.gridSize) / 2
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    
    // Create dimension for top flange
    const topFlangeDim: LinearDimension = {
      id: 'system-top-flange',
      type: 'linear-dimension',
      visible: true,
      locked: true,
      style: { ...DEFAULT_ANNOTATION_STYLE, color: 0x666666, textColor: '#666666' },
      startPoint: { x: centerX - 40, y: topY },
      endPoint: { x: centerX - 40, y: webTop },
      text: `${flangeThickness.toFixed(3)}"`,
      unit: 'inches',
      witnessLineStart: 10,
      witnessLineEnd: 10,
      dimensionOffset: 25,
      autoText: false,
      showArrows: true,
      orientation: 'vertical'
    }
    
    // Create dimension for web height
    const webHeightDim: LinearDimension = {
      id: 'system-web-height',
      type: 'linear-dimension',
      visible: true,
      locked: true,
      style: { ...DEFAULT_ANNOTATION_STYLE, color: 0x666666, textColor: '#666666' },
      startPoint: { x: centerX - 55, y: webTop },
      endPoint: { x: centerX - 55, y: webBottom },
      text: `${webHeight.toFixed(3)}"`,
      unit: 'inches',
      witnessLineStart: 10,
      witnessLineEnd: 10,
      dimensionOffset: 25,
      autoText: false,
      showArrows: true,
      orientation: 'vertical'
    }
    
    // Create dimension for bottom flange
    const bottomFlangeDim: LinearDimension = {
      id: 'system-bottom-flange',
      type: 'linear-dimension',
      visible: true,
      locked: true,
      style: { ...DEFAULT_ANNOTATION_STYLE, color: 0x666666, textColor: '#666666' },
      startPoint: { x: centerX - 40, y: webBottom },
      endPoint: { x: centerX - 40, y: bottomY },
      text: `${flangeThickness.toFixed(3)}"`,
      unit: 'inches',
      witnessLineStart: 10,
      witnessLineEnd: 10,
      dimensionOffset: 25,
      autoText: false,
      showArrows: true,
      orientation: 'vertical'
    }
    
    // Create overall height dimension
    const overallHeightDim: LinearDimension = {
      id: 'system-overall-height',
      type: 'linear-dimension',
      visible: true,
      locked: true,
      style: { ...DEFAULT_ANNOTATION_STYLE, color: 0x333333, textColor: '#333333', fontSize: 13 },
      startPoint: { x: centerX - 70, y: topY },
      endPoint: { x: centerX - 70, y: bottomY },
      text: `${totalHeight.toFixed(3)}"`,
      unit: 'inches',
      witnessLineStart: 10,
      witnessLineEnd: 10,
      dimensionOffset: 25,
      autoText: false,
      showArrows: true,
      orientation: 'vertical'
    }
    
    // Add all system dimensions
    this.systemAnnotations.set(topFlangeDim.id, topFlangeDim)
    this.systemAnnotations.set(webHeightDim.id, webHeightDim)
    this.systemAnnotations.set(bottomFlangeDim.id, bottomFlangeDim)
    this.systemAnnotations.set(overallHeightDim.id, overallHeightDim)
    
    // Render them
    this.renderAnnotation(topFlangeDim, true)
    this.renderAnnotation(webHeightDim, true)
    this.renderAnnotation(bottomFlangeDim, true)
    this.renderAnnotation(overallHeightDim, true)
  }
  
  /**
   * Create system-generated bottom ordinate dimensions
   */
  public createBottomOrdinateDimensions(beamLength: number, centerX: number, bottomY: number): void {
    // Create ordinate dimensions every 12 inches
    for (let i = 0; i <= beamLength; i += 12) {
      const x = centerX + i * this.gridSize
      const dimId = `system-ordinate-${i}`
      
      // Calculate value based on current origin side
      const value = this.ordinateOriginSide === 'left' ? i : beamLength - i
      
      const ordinateDim: OrdinateDimension = {
        id: dimId,
        type: 'ordinate-dimension',
        visible: true,
        locked: true,
        style: { ...DEFAULT_ANNOTATION_STYLE, color: 0x888888, textColor: '#888888' },
        measurePoint: { x, y: bottomY, gridX: i },
        originSide: this.ordinateOriginSide,
        jogOffset: 40,
        beamLength,
        beamBottom: bottomY,
        text: `${value}"`,
        unit: 'inches',
        autoText: false,
        showArrow: true,
        witnessLineHeight: 10
      }
      
      this.systemAnnotations.set(dimId, ordinateDim)
      this.renderAnnotation(ordinateDim, true)
    }
  }
  
  /**
   * Toggle visibility of system dimensions
   */
  public toggleSystemDimensions(type: 'beamEnd' | 'bottomOrdinate', visible: boolean): void {
    this.systemAnnotations.forEach((annotation, id) => {
      if (type === 'beamEnd' && id.startsWith('system-') && !id.includes('ordinate')) {
        annotation.visible = visible
        const container = this.annotationGraphics.get(id)
        if (container) {
          container.setVisible(visible)
        }
      } else if (type === 'bottomOrdinate' && id.includes('ordinate')) {
        annotation.visible = visible
        const container = this.annotationGraphics.get(id)
        if (container) {
          container.setVisible(visible)
        }
      }
    })
  }
  
  /**
   * Clear all system dimensions
   */
  public clearSystemDimensions(): void {
    this.systemAnnotations.forEach((_, id) => {
      const container = this.annotationGraphics.get(id)
      if (container) {
        container.destroy()
      }
    })
    this.systemAnnotations.clear()
  }
}