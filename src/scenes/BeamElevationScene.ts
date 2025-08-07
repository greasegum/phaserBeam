import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { AppMode } from '../types/mode'
import { AnnotationType } from '../types/annotations'
import { processGrid } from '../core'
import { MarchingSquaresConfig } from '../core'
import type { ScalarFieldMethod } from '../core/ScalarField'
import { maskFromSelectedCells } from '../utils/gridMask'
import { ContourStyles, ControlPointStyles, createGridToScreenTransform, renderContours } from '../core/ContourRenderer'
import { AnnotationManager } from '../annotations/AnnotationManager'
import { DefectType, DEFECT_STYLES } from '../types/defects'
import { applyDefectPattern } from '../utils/defectPatterns'
import { SceneConfigManager, SceneConfig, DEFAULT_SCENE_CONFIG } from '../core/config/SceneConfigManager'
import { GridSystem, GridSystemConfig } from '../core/grid/GridSystem'
import { BeamRenderer, BeamRenderConfig, BeamDimensions, ContourData } from '../core/rendering/BeamRenderer'
import { InteractionController, InteractionState, PaintMode } from '../core/interaction/InteractionController'

export class BeamElevationScene extends Phaser.Scene {
  // Core modules
  private gridSystem?: GridSystem
  private beamRenderer?: BeamRenderer
  private interactionController?: InteractionController
  private configManager?: SceneConfigManager
  
  // Scene-specific properties
  private beamProfile: BeamProfile | null = null
  private gridSize = 30 // pixels per inch
  private beamLength = 120 // inches (10 feet default)
  private editMode = true
  private showGrid = true
  private gridOrigin: 'left' | 'right' = 'left'
  private showTopFlange = true
  private elevationView: 'N' | 'S' | 'E' | 'W' = 'N'
  private appMode: AppMode = 'edit'
  private storedCells: GridCell[] = []
  private onCellChange?: (cells: GridCell[]) => void
  private spanLength = 96 // inches (8 feet default)
  private selectedDefectType: DefectType = 'section-loss'
  private dimensionText: Phaser.GameObjects.Text[] = []
  public annotationManager?: AnnotationManager
  private savedAnnotations: any[] = [] // Store annotations when switching modes
  private currentAnnotationType: AnnotationType = 'linear-dimension'
  private useSmoothCurves = true // Enable smooth organic curves
  // Marching squares alignment offsets
  private contourOffsetX = 0.5 // Center on edges for proper grid alignment
  private contourOffsetY = 0.5 // Center on edges for proper grid alignment
  private contourGlobalOffsetX = -1 // Shift left by 1 cell
  private contourGlobalOffsetY = -1 // Shift up by 1 cell
  // Marching squares buffer configuration
  private contourBufferSize = 1 // Buffer of 1 to ensure proper edge processing
  private contourBufferValue = 0 // Default buffer value
  // Smoothing options
  private smoothingMethod: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective' = 'edge-aware'
  private smoothingIterations = 1
  private smoothingStrength = 0.3
  
  // Selective smoothing options
  private edgeBufferDistance = 2.0 // Distance from edge where smoothing is disabled
  private preserveEdgeSegments = true // Whether to keep edge segments exactly as-is
  private transitionBlending = true // Whether to blend between smoothed and edge segments
  private curvatureThreshold = 0.1 // Curvature threshold for preserving segments
  private preserveStraightSegments = true // Whether to preserve straight segments
  private useInterpolationWithSelective = false // Whether to use interpolation with selective smoothing
  // Collision avoidance options
  private collisionAvoidance = false // Default to disabled for simpler behavior
  private collisionMinDistance = 0.5
  private collisionMethod: 'repulsion' | 'shrink' | 'hybrid' = 'hybrid'
  private collisionIterations = 10
  // View mode options
  private showRawMarchingSquares = false // Show raw marching squares without smoothing
  private showControlPoints = false // Show marching squares control points in edit mode
  private showBlurredField = false // Show blurred field visualization
  // Marching Squares Algorithm Properties
  private interpolationMethod: 'linear' | 'cubic' | 'none' = 'linear'
  private scalarFieldMethod: ScalarFieldMethod = 'edge-preserving'
  private scalarFieldRadius = 2
  private edgeClampStrength = 0.95
  private saddlePointResolution: 'center' | 'gradient' | 'majority' = 'center'
  
  // Edge detection parameters
  private edgeDetectionThreshold = 0.1 // Separate threshold for edge detection
  private edgeDetectionEnabled = true // Whether to use edge detection for clamping
  private threshold = 0.5
  private alignmentMode: 'edges' | 'vertices' | 'center' = 'edges' // Default to edges for smooth contours
  private clampToGrid = true
  private extendToBoundary = false
  private snapDistance = 0.1
  // Edge clamping options
  private edgeClamping = true  // Enable by default for proper web section visualization
  private edgeClampDistance = 0.8  // Slightly larger distance for more aggressive clamping
  private cornerTreatment: 'trimmed' | 'flared' | 'square' = 'flared'

  constructor() {
    super({ key: 'BeamElevationScene' })
  }

  /**
   * Initialize and configure all extracted modules
   */
  private initializeModules(): void {
    if (!this.beamProfile || !this.gridSystem || !this.beamRenderer || !this.interactionController) return

    // Configure GridSystem
    const gridConfig: Partial<GridSystemConfig> = {
      gridSize: this.gridSize,
      showGrid: this.showGrid,
      editMode: this.editMode,
      showTopFlange: this.showTopFlange,
      gridOrigin: this.gridOrigin,
      elevationView: this.elevationView
    }
    this.gridSystem.initialize(this.beamProfile, gridConfig)
    
    // Set up GridSystem callbacks
    this.gridSystem.onCellChange((cells) => {
      if (this.onCellChange) {
        this.onCellChange(cells)
      }
      this.redrawVisualization()
    })
    
    // Restore stored cells if any
    if (this.storedCells.length > 0) {
      this.gridSystem.setSelectedCells(this.storedCells)
    }
    
    // Configure BeamRenderer
    const renderConfig: Partial<BeamRenderConfig> = {
      gridSize: this.gridSize,
      showTopFlange: this.showTopFlange,
      showBinaryContour: this.showRawMarchingSquares,
      showRawContour: false,
      showSmoothedContour: !this.showRawMarchingSquares,
      showControlPoints: this.showControlPoints,
      showPixelOutline: false,
      showBlurredField: this.showBlurredField,
      editMode: this.editMode,
      contourOffsetX: this.contourOffsetX,
      contourOffsetY: this.contourOffsetY,
      contourGlobalOffsetX: this.contourGlobalOffsetX,
      contourGlobalOffsetY: this.contourGlobalOffsetY
    }
    this.beamRenderer.setBeamProfile(this.beamProfile)
    this.beamRenderer.updateConfig(renderConfig)
    
    // Configure InteractionController
    const interactionState: Partial<InteractionState> = {
      editMode: this.editMode,
      appMode: this.appMode,
      selectedDefectType: this.selectedDefectType,
      isMouseDown: false,
      isPainting: false,
      paintMode: null
    }
    this.interactionController.initialize()
    this.interactionController.updateConfig(interactionState)
    
    // Connect InteractionController to GridSystem
    this.interactionController.setCellCallbacks({
      onCellSelect: (key, defectType) => {
        if (this.gridSystem) {
          this.gridSystem.selectCell(key, defectType)
        }
      },
      onCellDeselect: (key) => {
        if (this.gridSystem) {
          this.gridSystem.deselectCell(key)
        }
      },
      onRedrawNeeded: () => {
        this.redrawVisualization()
      }
    })
    
    // Set up annotation manager if in annotation mode
    if (this.appMode === 'annotation') {
      this.interactionController.setAnnotationManager(this.annotationManager)
    }
  }

  /**
   * Initialize configuration manager with current scene values
   */
  private initializeConfigManager(): void {
    const initialConfig: Partial<SceneConfig> = {
      showRawMarchingSquares: this.showRawMarchingSquares,
      showControlPoints: this.showControlPoints,
      showBlurredField: this.showBlurredField,
      interpolationMethod: this.interpolationMethod,
      saddlePointResolution: this.saddlePointResolution,
      threshold: this.threshold,
      alignmentMode: this.alignmentMode,
      clampToGrid: this.clampToGrid,
      extendToBoundary: this.extendToBoundary,
      snapDistance: this.snapDistance,
      smoothingMethod: this.smoothingMethod,
      smoothingIterations: this.smoothingIterations,
      smoothingStrength: this.smoothingStrength,
      edgeClamping: this.edgeClamping,
      edgeClampStrength: this.edgeClampStrength,
      edgeClampDistance: this.edgeClampDistance,
      cornerTreatment: this.cornerTreatment,
      scalarFieldMethod: this.scalarFieldMethod,
      scalarFieldRadius: this.scalarFieldRadius,
      collisionAvoidance: this.collisionAvoidance,
      collisionMinDistance: this.collisionMinDistance,
      collisionMethod: this.collisionMethod,
      collisionIterations: this.collisionIterations
    }

    this.configManager = new SceneConfigManager(initialConfig, () => this.onConfigChange())
  }

  /**
   * Handle configuration changes by updating scene properties and redrawing
   */
  private onConfigChange(): void {
    if (!this.configManager) return

    const config = this.configManager.getConfig()
    
    // Update scene properties from config
    this.showRawMarchingSquares = config.showRawMarchingSquares
    this.showControlPoints = config.showControlPoints
    this.showBlurredField = config.showBlurredField
    this.interpolationMethod = config.interpolationMethod
    this.saddlePointResolution = config.saddlePointResolution
    this.threshold = config.threshold
    this.alignmentMode = config.alignmentMode
    this.clampToGrid = config.clampToGrid
    this.extendToBoundary = config.extendToBoundary
    this.snapDistance = config.snapDistance
    this.smoothingMethod = config.smoothingMethod
    this.smoothingIterations = config.smoothingIterations
    this.smoothingStrength = config.smoothingStrength
    this.edgeClamping = config.edgeClamping
    this.edgeClampStrength = config.edgeClampStrength
    this.edgeClampDistance = config.edgeClampDistance
    this.cornerTreatment = config.cornerTreatment
    this.scalarFieldMethod = config.scalarFieldMethod
    this.scalarFieldRadius = config.scalarFieldRadius
    this.collisionAvoidance = config.collisionAvoidance
    this.collisionMinDistance = config.collisionMinDistance
    this.collisionMethod = config.collisionMethod
    this.collisionIterations = config.collisionIterations

    // Update BeamRenderer configuration
    if (this.beamRenderer) {
      const renderConfig: Partial<BeamRenderConfig> = {
        showBinaryContour: this.showRawMarchingSquares,
        showRawContour: false,
        showSmoothedContour: !this.showRawMarchingSquares,
        showControlPoints: this.showControlPoints,
        showBlurredField: this.showBlurredField
      }
      this.beamRenderer.updateConfig(renderConfig)
    }
    
    // Redraw the scene
    this.redrawVisualization()
  }

  /**
   * Get the configuration manager for external access
   */
  public getConfigManager(): SceneConfigManager | undefined {
    return this.configManager
  }
  
  /**
   * Update scene configuration
   */
  public updateConfig(updates: any): void {
    if (this.configManager) {
      this.configManager.updateConfig(updates)
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    if (this.configManager) {
      this.configManager.resetToDefaults()
    }
  }
  
  /**
   * Debug method to force contour drawing
   */
  public debugDrawContours() {
    console.log('Debug: Forcing contour redraw', {
      editMode: this.editMode,
      appMode: this.appMode
    })
    
    // Force a redraw of the visualization
    this.redrawVisualization()
  }

  update() {
    // Update annotation manager effects
    if (this.annotationManager) {
      this.annotationManager.update()
    }
  }

  init(data: { 
    beamProfile: BeamProfile; 
    beamLength?: number; 
    editMode?: boolean; 
    showGrid?: boolean; 
    gridOrigin?: 'left' | 'right'; 
    showTopFlange?: boolean;
    gridCells?: GridCell[];
    elevationView?: 'N' | 'S' | 'E' | 'W';
    appMode?: AppMode;
    savedAnnotations?: any[];
    spanLength?: number;
    zoom?: number;
    selectedDefectType?: DefectType;
    onCellChange?: (cells: GridCell[]) => void 
  }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.editMode = data.editMode !== undefined ? data.editMode : true
    this.showGrid = data.showGrid !== undefined ? data.showGrid : true
    this.gridOrigin = data.gridOrigin || 'left'
    this.showTopFlange = data.showTopFlange !== undefined ? data.showTopFlange : true
    this.elevationView = data.elevationView || 'N'
    this.appMode = data.appMode || 'edit'
    this.storedCells = data.gridCells || []
    this.savedAnnotations = data.savedAnnotations || []
    this.onCellChange = data.onCellChange
    this.spanLength = data.spanLength || 96
    this.selectedDefectType = data.selectedDefectType || 'section-loss'
    
    console.log('Scene init complete:', {
      appMode: this.appMode,
      editMode: this.editMode,
      savedAnnotations: this.savedAnnotations?.length || 0,
      showGrid: this.showGrid,
      dataAppMode: data.appMode,
      dataShowGrid: data.showGrid
    })
    
    // Store cells for initialization of GridSystem
    // GridSystem will handle selected cells and defect types
    // No need to manage these directly in the scene
  }
  
  private getZoneFromCell(cell: GridCell): string {
    // Determine zone based on cell properties
    // This is a placeholder - we'll need to store zone info in GridCell
    return 'web'
  }

  create() {
    if (!this.beamProfile) return

    // Initialize configuration manager
    this.initializeConfigManager()

    // Initialize core modules
    this.gridSystem = new GridSystem(this)
    this.beamRenderer = new BeamRenderer(this)
    this.interactionController = new InteractionController(this)
    
    // Configure modules inline to avoid method call issues
    if (this.beamProfile && this.gridSystem && this.beamRenderer && this.interactionController) {
      // Configure GridSystem
      const gridConfig: Partial<GridSystemConfig> = {
        gridSize: this.gridSize,
        showGrid: this.showGrid,
        editMode: this.editMode,
        showTopFlange: this.showTopFlange,
        gridOrigin: this.gridOrigin,
        elevationView: this.elevationView
      }
      this.gridSystem.initialize(this.beamProfile, gridConfig)
      
      // Set up GridSystem callbacks
      this.gridSystem.onCellChange((cells) => {
        if (this.onCellChange) {
          this.onCellChange(cells)
        }
        this.redrawVisualization()
      })
      
      // Restore stored cells if any
      if (this.storedCells.length > 0) {
        this.gridSystem.setSelectedCells(this.storedCells)
      }
      
      // Configure BeamRenderer
      const renderConfig: Partial<BeamRenderConfig> = {
        gridSize: this.gridSize,
        showTopFlange: this.showTopFlange,
        showBinaryContour: this.showRawMarchingSquares,
        showRawContour: false,
        showSmoothedContour: !this.showRawMarchingSquares,
        showControlPoints: this.showControlPoints,
        showPixelOutline: false,
        showBlurredField: this.showBlurredField,
        editMode: this.editMode,
        contourOffsetX: this.contourOffsetX,
        contourOffsetY: this.contourOffsetY,
        contourGlobalOffsetX: this.contourGlobalOffsetX,
        contourGlobalOffsetY: this.contourGlobalOffsetY
      }
      this.beamRenderer.setBeamProfile(this.beamProfile)
      this.beamRenderer.updateConfig(renderConfig)
      
      // Configure InteractionController
      const interactionState: Partial<InteractionState> = {
        editMode: this.editMode,
        appMode: this.appMode,
        selectedDefectType: this.selectedDefectType,
        isMouseDown: false,
        isPainting: false,
        paintMode: null
      }
      this.interactionController.initialize()
      this.interactionController.updateConfig(interactionState)
      
      // Connect InteractionController to GridSystem
      this.interactionController.setCellCallbacks({
        onCellSelect: (key, defectType) => {
          if (this.gridSystem) {
            this.gridSystem.selectCell(key, defectType)
          }
        },
        onCellDeselect: (key) => {
          if (this.gridSystem) {
            this.gridSystem.deselectCell(key)
          }
        },
        onRedrawNeeded: () => {
          this.redrawVisualization()
        }
      })
      
      // Set up annotation manager if in annotation mode
      if (this.appMode === 'annotation' && this.annotationManager) {
        this.interactionController.setAnnotationManager(this.annotationManager)
      }
    }

    // Expose debug method globally for testing
    (window as any).debugDrawContours = () => this.debugDrawContours()

    console.log('Scene create() called with:', {
      editMode: this.editMode,
      appMode: this.appMode,
      showGrid: this.showGrid
    })

    const { webHeight, flangeThickness } = this.beamProfile
    
    // Mouse/touch handling now managed by InteractionController
    
    // Set up keyboard shortcuts for annotation mode
    if (this.appMode === 'annotation') {
      this.input.keyboard?.on('keydown-L', () => {
        this.currentAnnotationType = 'linear-dimension'
        this.annotationManager?.startCreatingAnnotation('linear-dimension')
      })
      this.input.keyboard?.on('keydown-O', () => {
        this.currentAnnotationType = 'ordinate-dimension'
        this.annotationManager?.startCreatingAnnotation('ordinate-dimension')
      })
      this.input.keyboard?.on('keydown-C', () => {
        this.currentAnnotationType = 'callout'
        this.annotationManager?.startCreatingAnnotation('callout')
      })
      this.input.keyboard?.on('keydown-ESC', () => {
        this.annotationManager?.cancelCreation()
      })
    }
    
    // Calculate scene dimensions
    const sceneWidth = this.cameras.main.width
    const sceneHeight = this.cameras.main.height
    const padding = 100 // Increased padding for labels and dimensions
    const startX = padding
    const endX = sceneWidth - padding
    const centerY = sceneHeight / 2

    // Calculate scale to fit beam height comfortably in available space
    const availableWidth = endX - startX
    const availableHeight = sceneHeight - 200 // Leave room for annotations (100px top, 100px bottom)
    
    // Calculate beam total height
    const beamTotalHeight = webHeight + 2 * flangeThickness
    
    // Calculate scale based on height to ensure comfortable fit
    const heightScale = availableHeight / beamTotalHeight
    
    // Use a reasonable scale that fits height-wise, cap at 40 pixels per inch
    this.gridSize = Math.min(heightScale, 40) // Fixed scale for consistent viewing
    
    // If beam is too long for viewport, allow horizontal scrolling
    const requiredWidth = this.beamLength * this.gridSize + padding * 2
    if (requiredWidth > sceneWidth) {
      // Canvas will be wider than viewport, enabling horizontal scroll
      this.cameras.main.setBounds(0, 0, requiredWidth, sceneHeight)
    }

    // Calculate actual beam width based on gridSize
    const beamWidth = this.beamLength * this.gridSize

    // Draw beam profile using BeamRenderer
    if (this.beamRenderer) {
      const dimensions: BeamDimensions = {
        startX,
        centerY,
        width: beamWidth,
        webHeight: this.beamProfile.webHeight * this.gridSize,
        flangeThickness: this.beamProfile.flangeThickness * this.gridSize,
        flangeWidth: this.beamProfile.flangeWidth * this.gridSize
      }
      this.beamRenderer.drawBeamProfile(dimensions)
      this.beamRenderer.drawSectionLoss(dimensions)
    }

    // Create grid using GridSystem
    if (this.gridSystem) {
      const gridDimensions = {
        startX,
        centerY,
        width: beamWidth,
        gridSize: this.gridSize, // Use the calculated grid size for proper alignment
        beamLength: this.beamLength
      }
      this.gridSystem.createGrid(gridDimensions)
      
      // Set up cell interaction through InteractionController
      const cells = this.gridSystem.getSnapPoints()
      cells.forEach(snapPoint => {
        // Get the actual cell object from GridSystem
        // This would need to be exposed from GridSystem
      })
    }
    
    // Always initialize annotation manager to display annotations in all modes
    console.log('Initializing AnnotationManager for all modes')
    // Calculate beam bottom position
    const totalHeight = this.beamProfile.webHeight + 2 * this.beamProfile.flangeThickness
    const beamBottom = centerY + (totalHeight * this.gridSize) / 2
    
    this.annotationManager = new AnnotationManager(
      this,
      this.gridSize,
      { x: startX, y: centerY },
      beamBottom,
      this.beamLength
    )
    
    // Only enable annotation creation in annotation mode
    if (this.appMode === 'annotation') {
      console.log('Annotation mode - enabling annotation creation')
      this.annotationManager.setInteractive(true)
      // Update snap points based on grid
      this.updateAnnotationSnapPoints()
      
    } else {
      console.log('Not in annotation mode - annotations read-only')
      this.annotationManager.setInteractive(false)
      
    }
    
    // Restore saved annotations if any
    if (this.savedAnnotations && this.savedAnnotations.length > 0) {
      console.log('Restoring', this.savedAnnotations.length, 'saved annotations')
      this.annotationManager.restoreAnnotations(this.savedAnnotations)
    }

    // Add dimension lines and labels
    this.addDimensions(startX, centerY, beamWidth)

    // Add title centered over the beam
    const elevationNames = {
      'N': 'North',
      'S': 'South',
      'E': 'East',
      'W': 'West'
    }
    const titleX = startX + beamWidth / 2
    this.add.text(titleX, 30, `${elevationNames[this.elevationView]} Beam Elevation`, {
      fontSize: '20px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // Add end labels based on elevation view
    // When looking at an elevation, the ends are perpendicular to the view direction
    let leftLabel: string, rightLabel: string
    switch (this.elevationView) {
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
    
    // Position labels above the beam ends
    const labelY = centerY - ((this.beamProfile!.webHeight + 2 * this.beamProfile!.flangeThickness) * this.gridSize) / 2 - 30
    
    this.add.text(startX, labelY, leftLabel, {
      fontSize: '14px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(startX + beamWidth, labelY, rightLabel, {
      fontSize: '14px', 
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Setup touch controls for mobile
    this.setupTouchControls()
  }

  
  
  
  
  
  
    
  
  

  

  

  

  private addDimensions(startX: number, centerY: number, width: number) {
    if (!this.beamProfile) return

    const { webHeight, flangeThickness } = this.beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    const topY = centerY - (totalHeight * this.gridSize) / 2
    const bottomY = centerY + (totalHeight * this.gridSize) / 2

    // Height dimension lines - position based on grid origin
    const graphics = this.add.graphics()
    
    // Dimension positions
    const dim1X = this.gridOrigin === 'left' ? startX - 20 : startX + width + 20  // Closest to beam
    const dim2X = this.gridOrigin === 'left' ? startX - 35 : startX + width + 35  // Middle
    const dim3X = this.gridOrigin === 'left' ? startX - 55 : startX + width + 55  // Farthest
    
    const webTop = centerY - (webHeight * this.gridSize) / 2
    const webBottom = centerY + (webHeight * this.gridSize) / 2
    const flangeTop = topY
    
    // Draw all dimension lines with consistent style
    graphics.lineStyle(1, 0x666666, 0.8)
    
    // Extension line offset from actual points
    const extOffset = 2 // pixels to stop short of vertices
    const beamEdgeX = this.gridOrigin === 'left' ? startX : startX + width
    const extDir = this.gridOrigin === 'left' ? -1 : 1
    
    // Top flange dimension (closest to beam)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, flangeTop)
    graphics.lineTo(dim1X + extDir * 5, flangeTop)
    graphics.moveTo(beamEdgeX - extDir * 5, webTop)
    graphics.lineTo(dim1X + extDir * 5, webTop)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim1X, flangeTop + extOffset)
    graphics.lineTo(dim1X, webTop - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim1X - 2, flangeTop + extOffset + 3)
    graphics.lineTo(dim1X, flangeTop + extOffset)
    graphics.lineTo(dim1X + 2, flangeTop + extOffset + 3)
    graphics.moveTo(dim1X - 2, webTop - extOffset - 3)
    graphics.lineTo(dim1X, webTop - extOffset)
    graphics.lineTo(dim1X + 2, webTop - extOffset - 3)
    graphics.strokePath()
    
    this.add.text(dim1X + (this.gridOrigin === 'left' ? -5 : 5), flangeTop + (webTop - flangeTop) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Web height dimension (middle)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, webTop)
    graphics.lineTo(dim2X + extDir * 5, webTop)
    graphics.moveTo(beamEdgeX - extDir * 5, webBottom)
    graphics.lineTo(dim2X + extDir * 5, webBottom)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim2X, webTop + extOffset)
    graphics.lineTo(dim2X, webBottom - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim2X - 2, webTop + extOffset + 3)
    graphics.lineTo(dim2X, webTop + extOffset)
    graphics.lineTo(dim2X + 2, webTop + extOffset + 3)
    graphics.moveTo(dim2X - 2, webBottom - extOffset - 3)
    graphics.lineTo(dim2X, webBottom - extOffset)
    graphics.lineTo(dim2X + 2, webBottom - extOffset - 3)
    graphics.strokePath()
    
    // Web height label - rotated vertically
    const webText = this.add.text(dim2X + (this.gridOrigin === 'left' ? -5 : 5), centerY, `${webHeight.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    })
    webText.setOrigin(0.5, this.gridOrigin === 'left' ? 1 : 0)
    webText.setRotation(this.gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)
    
    // Bottom flange dimension (closest to beam)
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, webBottom)
    graphics.lineTo(dim1X + extDir * 5, webBottom)
    graphics.moveTo(beamEdgeX - extDir * 5, bottomY)
    graphics.lineTo(dim1X + extDir * 5, bottomY)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim1X, webBottom + extOffset)
    graphics.lineTo(dim1X, bottomY - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim1X - 2, webBottom + extOffset + 3)
    graphics.lineTo(dim1X, webBottom + extOffset)
    graphics.lineTo(dim1X + 2, webBottom + extOffset + 3)
    graphics.moveTo(dim1X - 2, bottomY - extOffset - 3)
    graphics.lineTo(dim1X, bottomY - extOffset)
    graphics.lineTo(dim1X + 2, bottomY - extOffset - 3)
    graphics.strokePath()
    
    this.add.text(dim1X + (this.gridOrigin === 'left' ? -5 : 5), webBottom + (bottomY - webBottom) / 2, `${flangeThickness.toFixed(3)}"`, {
      fontSize: '11px',
      color: '#666'
    }).setOrigin(this.gridOrigin === 'left' ? 1 : 0, 0.5)
    
    // Overall height dimension (farthest)
    graphics.lineStyle(1, 0x333333)
    
    // Extension lines
    graphics.beginPath()
    graphics.moveTo(beamEdgeX - extDir * 5, topY)
    graphics.lineTo(dim3X + extDir * 5, topY)
    graphics.moveTo(beamEdgeX - extDir * 5, bottomY)
    graphics.lineTo(dim3X + extDir * 5, bottomY)
    graphics.strokePath()
    
    // Dimension line
    graphics.beginPath()
    graphics.moveTo(dim3X, topY + extOffset)
    graphics.lineTo(dim3X, bottomY - extOffset)
    graphics.strokePath()
    // Arrows
    graphics.moveTo(dim3X - 3, topY + extOffset + 4)
    graphics.lineTo(dim3X, topY + extOffset)
    graphics.lineTo(dim3X + 3, topY + extOffset + 4)
    graphics.moveTo(dim3X - 3, bottomY - extOffset - 4)
    graphics.lineTo(dim3X, bottomY - extOffset)
    graphics.lineTo(dim3X + 3, bottomY - extOffset - 4)
    graphics.strokePath()
    
    // Overall height label - rotated vertically
    const heightText = this.add.text(dim3X + (this.gridOrigin === 'left' ? -8 : 8), centerY, `${totalHeight.toFixed(3)}"`, {
      fontSize: '13px',
      color: '#333',
      fontStyle: 'bold'
    })
    heightText.setOrigin(0.5, this.gridOrigin === 'left' ? 1 : 0)
    heightText.setRotation(this.gridOrigin === 'left' ? -Math.PI/2 : Math.PI/2)

    // Length dimension markers at bottom
    const dimY = bottomY + 40
    
    // Draw inch markers every 12 inches based on grid origin
    for (let i = 0; i <= this.beamLength; i += 12) {
      const x = startX + i * this.gridSize
      
      graphics.beginPath()
      graphics.moveTo(x, dimY - 5)
      graphics.lineTo(x, dimY + 5)
      graphics.strokePath()
      
      const label = this.gridOrigin === 'left' ? i : this.beamLength - i
      this.add.text(x, dimY + 15, `${label}"`, {
        fontSize: '12px',
        color: '#333'
      }).setOrigin(0.5, 0)
    }
  }

  private notifyCellChange() {
    if (!this.onCellChange || !this.gridSystem) return
    
    // Delegate to GridSystem which now manages selected cells
    const cells = this.gridSystem.getSelectedCells()
    this.onCellChange(cells)
  }
  
  private redrawVisualization() {
    if (!this.beamProfile || !this.beamRenderer || !this.gridSystem) return
    
    // Update grid visualization
    if (this.gridSystem) {
      this.gridSystem.updateCellVisibility()
    }
    
    // Redraw beam and contours
    const padding = 100
    const startX = padding
    const beamWidth = this.beamLength * this.gridSize
    const centerY = this.cameras.main.height / 2
    
    const dimensions: BeamDimensions = {
      startX,
      centerY,
      width: beamWidth,
      webHeight: this.beamProfile.webHeight * this.gridSize,
      flangeThickness: this.beamProfile.flangeThickness * this.gridSize,
      flangeWidth: this.beamProfile.flangeWidth * this.gridSize
    }
    
    // Draw section loss using the renderer
    this.beamRenderer.drawSectionLoss(dimensions)
    
    // Generate and draw contours if needed
    const selectedCells = this.gridSystem.getSelectedCells()
    if (selectedCells.length > 0) {
      this.generateAndDrawContours(dimensions, selectedCells)
    }
  }
  
  /**
   * Generate and draw contours for selected cells using marching squares
   */
  private generateAndDrawContours(dimensions: BeamDimensions, selectedCells: GridCell[]) {
    if (!this.beamRenderer || !this.beamProfile) return
    
    // Separate web cells for contour generation
    const webCells = selectedCells.filter(cell => cell.zone === 'web')
    if (webCells.length === 0) return
    
    // Generate grid for marching squares
    const cols = Math.ceil(this.beamLength)
    const rows = Math.ceil(this.beamProfile.webHeight)
    const grid = this.generateGridFromCells(webCells, cols, rows)
    
    // Process grid using marching squares
    const config: MarchingSquaresConfig = {
      interpolationMethod: this.interpolationMethod,
      saddlePointResolution: this.saddlePointResolution,
      threshold: this.threshold,
      alignmentMode: this.alignmentMode,
      clampToGrid: this.clampToGrid,
      extendToBoundary: this.extendToBoundary,
      snapDistance: this.snapDistance,
      smoothingMethod: this.smoothingMethod,
      smoothingIterations: this.smoothingIterations,
      smoothingStrength: this.smoothingStrength,
      edgeClamping: this.edgeClamping,
      edgeClampStrength: this.edgeClampStrength,
      edgeClampDistance: this.edgeClampDistance,
      cornerTreatment: this.cornerTreatment,
      scalarFieldMethod: this.scalarFieldMethod,
      scalarFieldRadius: this.scalarFieldRadius,
      collisionAvoidance: this.collisionAvoidance,
      collisionMinDistance: this.collisionMinDistance,
      collisionMethod: this.collisionMethod,
      collisionIterations: this.collisionIterations
    }
    
    const result = processGrid(grid, config)
    
    // Create contour data for renderer
    const contourData: ContourData = {
      binaryContours: result.binaryContours,
      rawContours: result.rawContours,
      smoothedContours: result.smoothedContours,
      controlPoints: result.controlPoints,
      pixelOutline: [],
      blurredField: result.scalarField || []
    }
    
    // Draw contours using renderer
    this.beamRenderer.drawContours(contourData, dimensions)
  }
  
  /**
   * Generate a grid from selected cells for marching squares processing
   */
  private generateGridFromCells(cells: GridCell[], cols: number, rows: number): number[][] {
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    cells.forEach(cell => {
      if (cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows) {
        grid[cell.y][cell.x] = 1
      }
    })
    
    return grid
  }
  

  private getCurrentAnnotations(): any[] {
    // Always save current annotations before getting them
    if (this.annotationManager) {
      const annotations = this.annotationManager.getAnnotations()
      console.log('Getting current annotations from manager:', annotations.length)
      // Update savedAnnotations with current state
      this.savedAnnotations = annotations
      return annotations
    }
    console.log('No annotation manager, returning saved annotations:', this.savedAnnotations?.length || 0)
    return this.savedAnnotations || []
  }

  updateBeamProfile(profile: BeamProfile, length?: number, editMode?: boolean, showGrid?: boolean, gridOrigin?: 'left' | 'right', showTopFlange?: boolean, gridCells?: GridCell[], elevationView?: 'N' | 'S' | 'E' | 'W', appMode?: AppMode, spanLength?: number, zoom?: number, selectedDefectType?: DefectType) {
    console.log('updateBeamProfile called with:', {
      appMode,
      currentAppMode: this.appMode,
      editMode,
      currentEditMode: this.editMode,
      showGrid,
      currentShowGrid: this.showGrid
    })
    
    // IMPORTANT: Check app mode FIRST before other checks to ensure mode switching works
    // Check if we're changing app mode
    if (appMode !== undefined && appMode !== this.appMode) {
      console.log('App mode changing from', this.appMode, 'to', appMode, '- restarting scene')
      // Need to restart scene to initialize/destroy annotation manager
      this.appMode = appMode
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength || length || 120,
        editMode: editMode !== undefined ? editMode : this.editMode,
        showGrid: showGrid !== undefined ? showGrid : this.showGrid,
        gridOrigin: gridOrigin !== undefined ? gridOrigin : this.gridOrigin,
        showTopFlange: showTopFlange !== undefined ? showTopFlange : this.showTopFlange,
        gridCells: gridCells || this.storedCells,
        elevationView: elevationView || this.elevationView,
        appMode: this.appMode,
        savedAnnotations: this.getCurrentAnnotations(),
        spanLength: spanLength || this.spanLength,
        selectedDefectType: selectedDefectType || this.selectedDefectType,
        onCellChange: this.onCellChange 
      })
      return
    }
    
    // Check if we just need to toggle grid origin
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid === this.showGrid &&
        gridOrigin !== undefined && 
        gridOrigin !== this.gridOrigin) {
      
      this.gridOrigin = gridOrigin
      
      // Just need to update dimensions, not recreate the whole scene
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength,
        editMode: this.editMode,
        showGrid: this.showGrid,
        gridOrigin: this.gridOrigin,
        showTopFlange: this.showTopFlange,
        gridCells: gridCells || this.storedCells,
        elevationView: elevationView || this.elevationView,
        appMode: this.appMode,
        savedAnnotations: this.getCurrentAnnotations(),
        spanLength: this.spanLength,
        selectedDefectType: this.selectedDefectType,
        onCellChange: this.onCellChange 
      })
      
      return
    }
    
    // Check if we just need to toggle top flange
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid === this.showGrid &&
        showTopFlange !== undefined && 
        showTopFlange !== this.showTopFlange) {
      
      this.showTopFlange = showTopFlange
      
      // Need to recreate scene to update top flange visibility
      this.scene.restart({ 
        beamProfile: profile, 
        beamLength: this.beamLength,
        editMode: this.editMode,
        showGrid: this.showGrid,
        gridOrigin: this.gridOrigin,
        showTopFlange: this.showTopFlange,
        gridCells: gridCells || this.storedCells,
        elevationView: elevationView || this.elevationView,
        appMode: this.appMode,
        savedAnnotations: this.getCurrentAnnotations(),
        spanLength: this.spanLength,
        selectedDefectType: this.selectedDefectType,
        onCellChange: this.onCellChange 
      })
      
      return
    }
    
    // Check if we just need to toggle grid visibility
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode === this.editMode &&
        showGrid !== undefined && 
        showGrid !== this.showGrid) {
      
      this.showGrid = showGrid
      
      // Toggle grid visibility using GridSystem
      if (this.gridSystem) {
        const shouldShow = (this.editMode || this.appMode === 'annotation') && this.showGrid
        this.gridSystem.setVisible(shouldShow)
        this.gridSystem.updateConfig({ showGrid: this.showGrid })
      }
      
      // Redraw section loss with appropriate style
      // Redraw using extracted modules
      this.redrawVisualization()
      
      return
    }
    
    // Check if we just need to toggle edit mode
    if (profile.id === this.beamProfile?.id && 
        length === this.beamLength && 
        editMode !== undefined && 
        editMode !== this.editMode) {
      
      this.editMode = editMode
      
      // Toggle grid visibility using GridSystem
      if (this.gridSystem) {
        const shouldShow = (this.editMode || this.appMode === 'annotation') && this.showGrid
        this.gridSystem.setVisible(shouldShow)
        this.gridSystem.updateConfig({ editMode: this.editMode })
      }
      
      // Redraw section loss with appropriate style
      // Redraw using extracted modules
      this.redrawVisualization()
      
      return
    }
    
    // App mode check has been moved to the beginning of the method
    
    // Otherwise restart the scene
    this.beamProfile = profile
    this.beamLength = length || this.beamLength
    this.editMode = editMode !== undefined ? editMode : this.editMode
    this.showGrid = showGrid !== undefined ? showGrid : this.showGrid
    this.gridOrigin = gridOrigin !== undefined ? gridOrigin : this.gridOrigin
    this.showTopFlange = showTopFlange !== undefined ? showTopFlange : this.showTopFlange
    this.storedCells = gridCells || this.storedCells
    this.elevationView = elevationView || this.elevationView
    this.appMode = appMode || this.appMode
    this.spanLength = spanLength || this.spanLength
    this.selectedDefectType = selectedDefectType || this.selectedDefectType
    this.scene.restart({ 
      beamProfile: profile, 
      beamLength: this.beamLength,
      editMode: this.editMode,
      showGrid: this.showGrid,
      gridOrigin: this.gridOrigin,
      showTopFlange: this.showTopFlange,
      gridCells: this.storedCells,
      elevationView: this.elevationView,
      appMode: this.appMode,
      savedAnnotations: this.getCurrentAnnotations(),
      spanLength: this.spanLength,
      selectedDefectType: this.selectedDefectType,
      onCellChange: this.onCellChange 
    })
  }
  
  private updateAnnotationSnapPoints(): void {
    if (!this.annotationManager || !this.gridSystem) return
    
    // Get snap points from GridSystem
    const snapPoints = this.gridSystem.getSnapPoints()
    this.annotationManager.updateSnapPoints(snapPoints)
  }
  
  private setupTouchControls(): void {
    // Don't set up global touch controls in edit mode - they interfere with grid interaction
    if (this.editMode) {
      return
    }
    
    // Enable multi-touch
    this.input.addPointer(2)
    
    // Pan support - using local state instead of instance properties
    let isPanning = false
    let panStartX = 0
    let panStartY = 0
    let cameraStartX = 0
    let cameraStartY = 0
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't handle ANY pointer events in edit mode - let grid cells handle them
      if (this.editMode) {
        return
      }
      
      // Only allow panning in view mode, or annotation mode when not interacting with annotations
      const allowPanning = this.appMode === 'view' || 
        (this.appMode === 'annotation' && 
         !this.annotationManager?.isCreatingAnnotation && 
         !this.annotationManager?.isDragging())
      
      if (allowPanning) {
        isPanning = true
        panStartX = pointer.x
        panStartY = pointer.y
        cameraStartX = this.cameras.main.scrollX
        cameraStartY = this.cameras.main.scrollY
      }
    })
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isPanning && pointer.isDown) {
        const deltaX = panStartX - pointer.x
        const deltaY = panStartY - pointer.y
        this.cameras.main.scrollX = cameraStartX + deltaX
        this.cameras.main.scrollY = cameraStartY + deltaY
      }
    })
    
    this.input.on('pointerup', () => {
      isPanning = false
    })
    
    // Pinch to zoom
    let lastPinchDistance = 0
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const distance = Phaser.Math.Distance.Between(
          this.input.pointer1.x,
          this.input.pointer1.y,
          this.input.pointer2.x,
          this.input.pointer2.y
        )
        
        if (lastPinchDistance > 0) {
          const delta = distance - lastPinchDistance
          const zoomFactor = 1 + (delta * 0.01)
          const currentZoom = this.cameras.main.zoom
          const newZoom = Phaser.Math.Clamp(currentZoom * zoomFactor, 0.5, 2)
          this.cameras.main.setZoom(newZoom)
        }
        
        lastPinchDistance = distance
      } else {
        lastPinchDistance = 0
      }
    })
  }
  
  shutdown(): void {
    // Save annotations before destroying
    if (this.annotationManager) {
      this.savedAnnotations = this.annotationManager.getAnnotations()
      console.log('Saving', this.savedAnnotations.length, 'annotations before shutdown')
      this.annotationManager.destroy()
      this.annotationManager = undefined
    }
    
    // Clean up modules
    if (this.gridSystem) {
      this.gridSystem.destroy()
      this.gridSystem = undefined
    }
    
    if (this.beamRenderer) {
      this.beamRenderer.destroy()
      this.beamRenderer = undefined
    }
    
    if (this.interactionController) {
      this.interactionController.destroy()
      this.interactionController = undefined
    }
  }
}