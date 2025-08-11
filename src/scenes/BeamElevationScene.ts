import Phaser from 'phaser'
import { BeamProfile, GridCell } from '../types/beam'
import { AppMode } from '../types/mode'
import { AnnotationType } from '../types/annotations'
import { GridSystem, GridSystemConfig } from '../core/grid/GridSystem'
import { BeamRenderer, BeamRenderConfig, BeamDimensions } from '../core/rendering/BeamRenderer'
import { AnnotationManager } from '../annotations/AnnotationManager'
import { DefectType } from '../types/defects'
import { gridToScreen, screenToGrid, createGridToScreenTransform, beamToGrid, gridToBeam } from '../utils/coordinateTransform'
import { UnifiedConfigManager } from '../core/configuration/UnifiedConfigManager'
import { processGrid } from '../core'
import { BeamDimensionRenderer, createBeamDimensionRenderer, DimensionConfig } from '../utils/BeamDimensionRenderer'
import { Result, logger } from '../utils/Result'

export class BeamElevationScene extends Phaser.Scene {
  // Core modules
  private gridSystem?: GridSystem
  private beamRenderer?: BeamRenderer
  private dimensionRenderer?: BeamDimensionRenderer
  
  // Scene properties
  private beamProfile: BeamProfile | null = null
  private gridSize = 30
  private beamLength = 120
  private editMode = true
  private showGrid = true
  private gridOrigin: 'left' | 'right' = 'left'
  private showTopFlange = true
  private elevationView: 'N' | 'S' | 'E' | 'W' = 'N'
  private appMode: AppMode = 'edit'
  private selectedDefectType: DefectType = 'section-loss'
  private onCellChange?: (cells: GridCell[]) => void
  public annotationManager?: AnnotationManager
  
  // Missing properties we need to restore
  private spanLength = 96 // inches (8 feet default)
  private ordinateOriginSide: 'left' | 'right' = 'left'
  private showBeamEndDimensions = true
  private showBottomOrdinate = true
  private dimensionText: Phaser.GameObjects.Text[] = []
  private savedAnnotations: any[] = []
  
  // Coordinate transformation
  private gridTransform: { scale: number; offsetX: number; offsetY: number } | null = null

  // Unified configuration manager
  public configManager: UnifiedConfigManager

  constructor() {
    super({ key: 'BeamElevationScene' })
    this.configManager = new UnifiedConfigManager()
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
    selectedDefectType?: DefectType;
    onCellChange?: (cells: GridCell[]) => void 
  }) {
    this.beamProfile = data.beamProfile
    this.beamLength = data.beamLength || 120
    this.editMode = data.editMode ?? true
    this.showGrid = data.showGrid ?? true
    this.gridOrigin = data.gridOrigin || 'left'
    this.showTopFlange = data.showTopFlange ?? true
    this.elevationView = data.elevationView || 'N'
    this.appMode = data.appMode || 'edit'
    this.selectedDefectType = data.selectedDefectType || 'section-loss'
    this.onCellChange = data.onCellChange
    this.savedAnnotations = data.savedAnnotations || []
    this.spanLength = data.spanLength || 96
  }

  create() {
    logger.debug('BeamElevationScene created')
    if (!this.beamProfile) {
      console.error('[BeamElevationScene] No beam profile in create()')
      return
    }

    // Initialize core modules
    this.gridSystem = new GridSystem(this)
    this.beamRenderer = new BeamRenderer(this)
    
    // Configure GridSystem
    const gridConfig: GridSystemConfig = {
      showTopFlange: this.showTopFlange,
      editMode: this.editMode,
      appMode: this.appMode,
      showGrid: this.showGrid
    }
    this.gridSystem.initialize(this.beamProfile, gridConfig)
    
    // Set up GridSystem callbacks
    this.gridSystem.onCellChange((cells) => {
      if (this.onCellChange) {
        this.onCellChange(cells)
      }
      // Update renderer with selected cells
      this.updateRendererWithSelectedCells(cells)
      
      // Only redraw when cells actually change (not during drag)
      if (!this.gridSystem?.getIsDragging()) {
        this.redrawVisualization()
      }
    })
    
    // Configure BeamRenderer
    const renderConfig: Partial<BeamRenderConfig> = {
      gridSize: this.gridSize,
      showTopFlange: this.showTopFlange,
      showBinaryContour: false,
      showRawContour: false,
      showSmoothedContour: true,
      showControlPoints: false,
      showPixelOutline: false,
      showBlurredField: false,
      contourOffsetX: 0.5,
      contourOffsetY: 0.5,
      contourGlobalOffsetX: -1,
      contourGlobalOffsetY: -1
    }
    this.beamRenderer.setBeamProfile(this.beamProfile)
    this.beamRenderer.updateConfig(renderConfig)
    
    // Create the visualization
    this.createVisualization()
  }

  private createVisualization() {
    if (!this.beamProfile || !this.beamRenderer || !this.gridSystem) return
    
    const padding = 100
    const startX = padding
    const beamWidth = this.beamLength * this.gridSize
    const centerY = this.cameras.main.height / 2
    
    // Initialize coordinate transformation (same as annotations)
    this.gridTransform = createGridToScreenTransform(this.gridSize, startX, centerY)
    
    // Draw beam profile
    const dimensions: BeamDimensions = {
      startX,
      centerY,
      width: beamWidth,
      gridSize: this.gridSize
    }
    
    this.beamRenderer.drawBeamProfile(dimensions)
    this.beamRenderer.drawSectionLoss(dimensions)
    
    // Create grid
    const gridDimensions = {
      startX,
      centerY,
      width: beamWidth,
      gridSize: this.gridSize,
      beamLength: this.beamLength
    }
    this.gridSystem.createGrid(gridDimensions)
    
    // Initialize annotation manager with same coordinate system
    const totalHeight = this.beamProfile.webHeight + 2 * this.beamProfile.flangeThickness
    const beamBottom = centerY + (totalHeight * this.gridSize) / 2
    
    this.annotationManager = new AnnotationManager(
      this,
      this.gridSize,
      { x: startX, y: centerY }, // Same gridOrigin as annotations
      beamBottom,
      this.beamLength
    )
    
    if (this.appMode === 'annotation') {
      this.annotationManager.setInteractive(true)
    } else {
      this.annotationManager.setInteractive(false)
    }
    
    // Restore saved annotations if any
    if (this.savedAnnotations && this.savedAnnotations.length > 0) {
      logger.info('Restoring saved annotations', { count: this.savedAnnotations.length })
      this.annotationManager.restoreAnnotations(this.savedAnnotations)
    }
    
    // Add dimension lines and labels using same coordinate system
    this.addDimensions(startX, centerY, beamWidth)
    
    // Add title
    const elevationNames = { 'N': 'North', 'S': 'South', 'E': 'East', 'W': 'West' }
    const titleX = startX + beamWidth / 2
    this.add.text(titleX, 30, `${elevationNames[this.elevationView]} Beam Elevation`, {
      fontSize: '20px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Add end labels based on elevation view
    this.addEndLabels(startX, centerY, beamWidth)
  }

  private addDimensions(startX: number, centerY: number, width: number) {
    if (!this.beamProfile || !this.gridTransform) {
      logger.warn('Cannot add dimensions: missing beam profile or grid transform')
      return
    }

    // Initialize dimension renderer if not exists
    if (!this.dimensionRenderer) {
      this.dimensionRenderer = createBeamDimensionRenderer(this)
    }

    const config: DimensionConfig = {
      startX,
      centerY,
      width,
      beamLength: this.beamLength,
      gridOrigin: this.gridOrigin,
      beamProfile: this.beamProfile,
      gridTransform: this.gridTransform
    }

    const result = this.dimensionRenderer.renderDimensions(config)
    
    if (!Result.isSuccess(result)) {
      logger.error('Failed to render beam dimensions', result.error)
    }
  }

  private addEndLabels(startX: number, centerY: number, width: number) {
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
    
    // Position labels above the beam ends using same coordinate system
    const totalHeight = this.beamProfile!.webHeight + 2 * this.beamProfile!.flangeThickness
    const beamTopGrid = -totalHeight / 2
    const beamTop = gridToScreen({ x: 0, y: beamTopGrid }, this.gridTransform!).y
    const labelY = beamTop - 30
    
    this.add.text(startX, labelY, leftLabel, {
      fontSize: '14px',
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(startX + width, labelY, rightLabel, {
      fontSize: '14px', 
      color: '#333',
      fontStyle: 'bold'
    }).setOrigin(0.5)
  }

  private updateRendererWithSelectedCells(cells: GridCell[]): void {
    if (!this.beamRenderer) return
    
    // Convert GridCell array to selectedCells Set for the renderer
    const selectedCells = new Set<string>()
    cells.forEach(cell => {
      const key = `${cell.zone}_${cell.x}_${cell.y}`
      selectedCells.add(key)
    })
    
    // Update renderer config with selected cells
    this.beamRenderer.updateConfig({ selectedCells })
  }

  private redrawVisualization() {
    if (!this.beamProfile || !this.beamRenderer || !this.gridSystem) return
    
    logger.debug('Redrawing beam visualization')
    
    const padding = 100
    const startX = padding
    const beamWidth = this.beamLength * this.gridSize
    const centerY = this.cameras.main.height / 2
    
    const dimensions: BeamDimensions = {
      startX,
      centerY,
      width: beamWidth,
      gridSize: this.gridSize
    }
    
    // Only redraw section loss, not contours (contours are persistent)
    this.beamRenderer.drawSectionLoss(dimensions)
    
    // Generate and draw contours only when cells change
    const selectedCells = this.gridSystem.getSelectedCells()
    logger.debug('Processing selected cells', { count: selectedCells.length })
    if (selectedCells.length > 0) {
      logger.debug('Selected cell details', { cells: selectedCells.map(c => `${c.zone}_${c.x}_${c.y}`) })
      this.generateAndDrawContours(dimensions, selectedCells)
    } else {
      // Clear contours when no cells are selected
      logger.debug('No cells selected, clearing contours')
      this.beamRenderer.clearContours()
    }
  }

  private generateAndDrawContours(dimensions: BeamDimensions, selectedCells: GridCell[]) {
    if (!this.beamRenderer || !this.beamProfile) {
      console.error('[BeamElevationScene] Missing beamRenderer or beamProfile')
      return
    }
    
    logger.debug('Beam profile for contours', { profile: this.beamProfile })
    logger.debug('Beam length for contours', { length: this.beamLength })
    
    // Separate web cells for contour generation
    const webCells = selectedCells.filter(cell => cell.zone === 'web')
    logger.debug('Web cells prepared for contour generation', { count: webCells.length })
    
    if (webCells.length === 0) {
      console.log('[BeamElevationScene] No web cells, skipping contour generation')
      return
    }
    
    try {
      // Generate grid for marching squares - use larger grid for better contour generation
      const cols = Math.max(Math.ceil(this.beamLength), 20) // Minimum 20 columns
      const rows = Math.max(Math.ceil(this.beamProfile.webHeight), 10) // Minimum 10 rows
      console.log('[BeamElevationScene] Grid dimensions:', cols, 'x', rows)
      console.log('[BeamElevationScene] Beam web height:', this.beamProfile.webHeight)
      
      const grid = this.generateGridFromCells(webCells, cols, rows)
      console.log('[BeamElevationScene] Generated grid with cells:', webCells.map(c => `(${c.x},${c.y})`))
      
      // Process grid using unified configuration
      const config = this.configManager.getConfig()
      console.log('[BeamElevationScene] Using config:', config)
      const result = processGrid(grid, config)
      console.log('[BeamElevationScene] Process result contours:', result.contours.length)
      
      // Draw contours using the beam renderer
      if (result.contours.length > 0) {
        const contourData = {
          smoothedContours: result.contours.map(contour => contour.points),
          pixelOutline: [],
          blurredField: []
        }
        console.log('[BeamElevationScene] Drawing contours with data:', contourData)
        this.beamRenderer.drawContours(contourData, dimensions)
      } else {
        console.log('[BeamElevationScene] No contours to draw')
      }
      
    } catch (error) {
      console.error('[BeamElevationScene] Error generating contours:', error)
    }
  }

  private generateGridFromCells(cells: GridCell[], cols: number, rows: number): number[][] {
    const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0))
    
    console.log('[BeamElevationScene] Generating grid with dimensions:', cols, 'x', rows)
    console.log('[BeamElevationScene] Input cells:', cells.map(c => `(${c.x},${c.y})`))
    
    cells.forEach(cell => {
      if (cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows) {
        grid[cell.y][cell.x] = 1
        console.log(`[BeamElevationScene] Set grid[${cell.y}][${cell.x}] = 1`)
      } else {
        console.warn(`[BeamElevationScene] Cell (${cell.x},${cell.y}) out of bounds for grid ${cols}x${rows}`)
      }
    })
    
    // Count non-zero cells
    const nonZeroCount = grid.flat().filter(val => val === 1).length
    console.log(`[BeamElevationScene] Grid has ${nonZeroCount} non-zero cells`)
    
    return grid
  }

  updateBeamProfile(profile: BeamProfile, length?: number, editMode?: boolean, showGrid?: boolean, gridOrigin?: 'left' | 'right', showTopFlange?: boolean, gridCells?: GridCell[], elevationView?: 'N' | 'S' | 'E' | 'W', appMode?: AppMode, spanLength?: number, selectedDefectType?: DefectType) {
    this.beamProfile = profile
    this.beamLength = length || this.beamLength
    this.editMode = editMode ?? this.editMode
    this.showGrid = showGrid ?? this.showGrid
    this.gridOrigin = gridOrigin || this.gridOrigin
    this.showTopFlange = showTopFlange ?? this.showTopFlange
    this.elevationView = elevationView || this.elevationView
    this.appMode = appMode || this.appMode
    this.selectedDefectType = selectedDefectType || this.selectedDefectType
    this.spanLength = spanLength || this.spanLength
    
    if (this.gridSystem) {
      this.gridSystem.updateConfig({
        showTopFlange: this.showTopFlange,
        editMode: this.editMode,
        appMode: this.appMode,
        showGrid: this.showGrid
      })
    }
    
    if (this.beamRenderer) {
      this.beamRenderer.setBeamProfile(this.beamProfile)
    }
    
    // Recreate visualization
    this.createVisualization()
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

  shutdown() {
    // Save annotations before destroying
    if (this.annotationManager) {
      this.savedAnnotations = this.annotationManager.getAnnotations()
      logger.info('Saving annotations before shutdown', { count: this.savedAnnotations.length })
      this.annotationManager.destroy()
      this.annotationManager = undefined
    }
    
    if (this.gridSystem) {
      this.gridSystem.destroy()
    }
    if (this.beamRenderer) {
      this.beamRenderer.destroy()
    }
    
    if (this.dimensionRenderer) {
      this.dimensionRenderer.destroy()
      this.dimensionRenderer = undefined
    }
  }
}