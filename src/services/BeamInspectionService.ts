import { GridCell, BeamProfile } from '../types/beam'
import { DefectType } from '../types/defects'
import { processGrid } from '../core'
import { MarchingSquaresConfig } from '../core'
import type { ScalarFieldMethod } from '../core/ScalarField'

export interface InspectionData {
  beamProfile: BeamProfile
  selectedCells: GridCell[]
  defectTypes: Map<string, DefectType>
  timestamp: Date
  inspectorId?: string
  notes?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ContourResult {
  binaryContours: any[]
  rawContours: any[]
  smoothedContours: any[]
  controlPoints: any[]
  scalarField?: number[][]
}

export interface ProcessingConfig {
  interpolationMethod: 'linear' | 'cubic' | 'none'
  saddlePointResolution: 'center' | 'gradient' | 'majority'
  threshold: number
  alignmentMode: 'edges' | 'vertices' | 'center'
  clampToGrid: boolean
  extendToBoundary: boolean
  snapDistance: number
  smoothingMethod: 'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'
  smoothingIterations: number
  smoothingStrength: number
  edgeClamping: boolean
  edgeClampStrength: number
  edgeClampDistance: number
  cornerTreatment: 'trimmed' | 'flared' | 'square'
  scalarFieldMethod: ScalarFieldMethod
  scalarFieldRadius: number
  collisionAvoidance: boolean
  collisionMinDistance: number
  collisionMethod: 'repulsion' | 'shrink' | 'hybrid'
  collisionIterations: number
}

/**
 * Service class for beam inspection business logic
 * Handles inspection data processing, validation, and export
 */
export class BeamInspectionService {
  private beamProfile: BeamProfile | null = null
  private processingConfig: ProcessingConfig
  
  constructor(config?: Partial<ProcessingConfig>) {
    this.processingConfig = {
      interpolationMethod: 'linear',
      saddlePointResolution: 'center',
      threshold: 0.5,
      alignmentMode: 'edges',
      clampToGrid: true,
      extendToBoundary: false,
      snapDistance: 0.1,
      smoothingMethod: 'edge-aware',
      smoothingIterations: 1,
      smoothingStrength: 0.3,
      edgeClamping: true,
      edgeClampStrength: 0.95,
      edgeClampDistance: 0.8,
      cornerTreatment: 'flared',
      scalarFieldMethod: 'edge-preserving',
      scalarFieldRadius: 2,
      collisionAvoidance: false,
      collisionMinDistance: 0.5,
      collisionMethod: 'hybrid',
      collisionIterations: 10,
      ...config
    }
  }
  
  /**
   * Set the beam profile for inspection calculations
   */
  setBeamProfile(profile: BeamProfile): void {
    this.beamProfile = profile
  }
  
  /**
   * Update processing configuration
   */
  updateConfig(config: Partial<ProcessingConfig>): void {
    this.processingConfig = { ...this.processingConfig, ...config }
  }
  
  /**
   * Process selected cells to generate contours
   */
  processSelectedCells(cells: GridCell[], cols: number, rows: number): ContourResult {
    // Generate grid from cells
    const grid = this.generateGridFromCells(cells, cols, rows)
    
    // Create marching squares config
    const config: MarchingSquaresConfig = {
      interpolationMethod: this.processingConfig.interpolationMethod,
      saddlePointResolution: this.processingConfig.saddlePointResolution,
      threshold: this.processingConfig.threshold,
      alignmentMode: this.processingConfig.alignmentMode,
      clampToGrid: this.processingConfig.clampToGrid,
      extendToBoundary: this.processingConfig.extendToBoundary,
      snapDistance: this.processingConfig.snapDistance,
      smoothingMethod: this.processingConfig.smoothingMethod,
      smoothingIterations: this.processingConfig.smoothingIterations,
      smoothingStrength: this.processingConfig.smoothingStrength,
      edgeClamping: this.processingConfig.edgeClamping,
      edgeClampStrength: this.processingConfig.edgeClampStrength,
      edgeClampDistance: this.processingConfig.edgeClampDistance,
      cornerTreatment: this.processingConfig.cornerTreatment,
      scalarFieldMethod: this.processingConfig.scalarFieldMethod,
      scalarFieldRadius: this.processingConfig.scalarFieldRadius,
      collisionAvoidance: this.processingConfig.collisionAvoidance,
      collisionMinDistance: this.processingConfig.collisionMinDistance,
      collisionMethod: this.processingConfig.collisionMethod,
      collisionIterations: this.processingConfig.collisionIterations
    }
    
    // Process grid using marching squares
    const result = processGrid(grid, config)
    
    return {
      binaryContours: result.binaryContours || [],
      rawContours: result.rawContours || result.contours || [],
      smoothedContours: result.smoothedContours || [],
      controlPoints: result.controlPoints || [],
      scalarField: result.scalarField
    }
  }
  
  /**
   * Generate a grid from cells for processing
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
  
  /**
   * Calculate section loss percentage
   */
  calculateSectionLoss(cells: GridCell[]): number {
    if (!this.beamProfile) return 0
    
    const webCells = cells.filter(c => c.zone === 'web')
    const totalWebCells = Math.ceil(this.beamProfile.webHeight) * Math.ceil(this.beamProfile.length || 120)
    
    if (totalWebCells === 0) return 0
    
    return (webCells.length / totalWebCells) * 100
  }
  
  /**
   * Calculate defect statistics
   */
  calculateDefectStatistics(cells: GridCell[], defectTypes: Map<string, DefectType>): {
    totalDefects: number
    defectsByType: Map<DefectType, number>
    defectsByZone: Map<string, number>
    criticalDefects: number
  } {
    const defectsByType = new Map<DefectType, number>()
    const defectsByZone = new Map<string, number>()
    let criticalDefects = 0
    
    cells.forEach(cell => {
      const key = `${cell.zone || 'web'}_${cell.x}_${cell.y}`
      const defectType = defectTypes.get(key) || 'section-loss'
      
      // Count by type
      defectsByType.set(defectType, (defectsByType.get(defectType) || 0) + 1)
      
      // Count by zone
      const zone = cell.zone || 'web'
      defectsByZone.set(zone, (defectsByZone.get(zone) || 0) + 1)
      
      // Count critical defects (holes only)
      if (defectType === 'hole') {
        criticalDefects++
      }
    })
    
    return {
      totalDefects: cells.length,
      defectsByType,
      defectsByZone,
      criticalDefects
    }
  }
  
  /**
   * Export inspection data for reporting
   */
  exportInspectionData(
    cells: GridCell[],
    defectTypes: Map<string, DefectType>,
    annotations: any[] = [],
    metadata?: any
  ): InspectionData {
    if (!this.beamProfile) {
      throw new Error('Beam profile not set')
    }
    
    return {
      beamProfile: this.beamProfile,
      selectedCells: cells,
      defectTypes,
      timestamp: new Date(),
      inspectorId: metadata?.inspectorId,
      notes: metadata?.notes
    }
  }
  
  /**
   * Validate inspection data
   */
  validateInspection(data: InspectionData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Check for required fields
    if (!data.beamProfile) {
      errors.push('Beam profile is required')
    }
    
    if (!data.selectedCells || data.selectedCells.length === 0) {
      warnings.push('No defects recorded')
    }
    
    // Check for critical defects
    const stats = this.calculateDefectStatistics(data.selectedCells, data.defectTypes)
    if (stats.criticalDefects > 0) {
      warnings.push(`${stats.criticalDefects} critical defects found`)
    }
    
    // Check section loss percentage
    const sectionLoss = this.calculateSectionLoss(data.selectedCells)
    if (sectionLoss > 20) {
      warnings.push(`High section loss: ${sectionLoss.toFixed(1)}%`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Generate inspection report summary
   */
  generateReportSummary(
    cells: GridCell[],
    defectTypes: Map<string, DefectType>,
    annotations: any[] = []
  ): string {
    if (!this.beamProfile) return 'No beam profile set'
    
    const stats = this.calculateDefectStatistics(cells, defectTypes)
    const sectionLoss = this.calculateSectionLoss(cells)
    
    const summary = [
      `Beam Inspection Report`,
      `=====================`,
      ``,
      `Beam Profile: ${this.beamProfile.name}`,
      `Dimensions: ${this.beamProfile.webHeight}" × ${this.beamProfile.flangeWidth}"`,
      `Length: ${this.beamProfile.length || 120}"`,
      ``,
      `Defects Summary:`,
      `- Total Defects: ${stats.totalDefects}`,
      `- Critical Defects: ${stats.criticalDefects}`,
      `- Section Loss: ${sectionLoss.toFixed(1)}%`,
      ``,
      `Defects by Type:`
    ]
    
    stats.defectsByType.forEach((count, type) => {
      summary.push(`- ${type}: ${count}`)
    })
    
    summary.push(``, `Defects by Zone:`)
    stats.defectsByZone.forEach((count, zone) => {
      summary.push(`- ${zone}: ${count}`)
    })
    
    if (annotations.length > 0) {
      summary.push(``, `Annotations: ${annotations.length}`)
    }
    
    return summary.join('\n')
  }
  
  /**
   * Apply defect pattern to cells
   */
  applyDefectPattern(
    cells: GridCell[],
    pattern: 'uniform' | 'random' | 'clustered',
    intensity: number = 0.5
  ): GridCell[] {
    // This would apply various defect patterns for testing or simulation
    // Implementation would depend on specific requirements
    return cells
  }
  
  /**
   * Estimate repair requirements
   */
  estimateRepairRequirements(
    cells: GridCell[],
    defectTypes: Map<string, DefectType>
  ): {
    plateArea: number // sq inches
    weldLength: number // inches
    laborHours: number
    priority: 'low' | 'medium' | 'high' | 'critical'
  } {
    if (!this.beamProfile) {
      return { plateArea: 0, weldLength: 0, laborHours: 0, priority: 'low' }
    }
    
    const stats = this.calculateDefectStatistics(cells, defectTypes)
    
    // Calculate plate area needed (assuming 1" grid cells)
    const plateArea = cells.filter(c => c.zone === 'web').length
    
    // Estimate weld length (perimeter of defect areas)
    // Simplified calculation - would need contour processing for accuracy
    const weldLength = Math.sqrt(plateArea) * 4
    
    // Estimate labor hours (rough approximation)
    const laborHours = (plateArea / 100) * 2 + (weldLength / 50)
    
    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const sectionLoss = this.calculateSectionLoss(cells)
    
    if (stats.criticalDefects > 0 || sectionLoss > 30) {
      priority = 'critical'
    } else if (sectionLoss > 20) {
      priority = 'high'
    } else if (sectionLoss > 10) {
      priority = 'medium'
    }
    
    return {
      plateArea,
      weldLength,
      laborHours: Math.ceil(laborHours),
      priority
    }
  }
}