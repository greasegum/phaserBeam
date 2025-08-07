/**
 * GridCellStateManager - Manages the state of grid cells
 * Handles selection, deselection, and state persistence
 */

import type { GridCell } from '../../types/beam'
import type { DefectType } from '../../types/defects'
import { GridEventManager } from './GridEventManager'

export interface CellState {
  key: string
  selected: boolean
  defectType: DefectType
  col: number
  row: number
  zone: 'web' | 'flange-top' | 'flange-bottom'
  isLinear: boolean
  timestamp: number
}

export class GridCellStateManager {
  private cellStates: Map<string, CellState> = new Map()
  private selectedCells: Set<string> = new Set()
  private eventManager: GridEventManager
  private maxSelections = 1000 // Prevent memory issues

  constructor() {
    this.eventManager = GridEventManager.getInstance()
  }

  /**
   * Initialize or update a cell's state
   */
  initializeCell(
    key: string,
    col: number,
    row: number,
    zone: 'web' | 'flange-top' | 'flange-bottom',
    isLinear: boolean = false
  ): void {
    // Preserve existing selection state if cell already exists
    const existingState = this.cellStates.get(key)
    
    this.cellStates.set(key, {
      key,
      selected: existingState?.selected || false,
      defectType: existingState?.defectType || 'section-loss',
      col,
      row,
      zone,
      isLinear,
      timestamp: Date.now()
    })

    // If cell was previously selected, ensure it's in the selected set
    if (existingState?.selected) {
      this.selectedCells.add(key)
    }
  }

  /**
   * Toggle cell selection state
   */
  toggleCell(key: string, defectType: DefectType = 'section-loss'): boolean {
    const state = this.cellStates.get(key)
    if (!state) {
      console.warn(`[CellStateManager] Cell ${key} not found`)
      return false
    }

    if (state.selected) {
      return this.deselectCell(key)
    } else {
      return this.selectCell(key, defectType)
    }
  }

  /**
   * Select a cell
   */
  selectCell(key: string, defectType: DefectType = 'section-loss'): boolean {
    const state = this.cellStates.get(key)
    if (!state) {
      console.warn(`[CellStateManager] Cell ${key} not found`)
      return false
    }

    // Check max selections
    if (this.selectedCells.size >= this.maxSelections) {
      console.warn(`[CellStateManager] Maximum selections (${this.maxSelections}) reached`)
      return false
    }

    // Update state
    state.selected = true
    state.defectType = defectType
    state.timestamp = Date.now()
    this.selectedCells.add(key)

    // Emit selection change event
    this.emitSelectionChange([this.cellToGridCell(state)], [])

    console.log(`[CellStateManager] Selected cell ${key}, total: ${this.selectedCells.size}`)
    return true
  }

  /**
   * Deselect a cell
   */
  deselectCell(key: string): boolean {
    const state = this.cellStates.get(key)
    if (!state || !state.selected) {
      return false
    }

    // Update state
    state.selected = false
    state.timestamp = Date.now()
    this.selectedCells.delete(key)

    // Emit selection change event
    this.emitSelectionChange([], [this.cellToGridCell(state)])

    console.log(`[CellStateManager] Deselected cell ${key}, total: ${this.selectedCells.size}`)
    return true
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    const removed: GridCell[] = []
    
    for (const key of this.selectedCells) {
      const state = this.cellStates.get(key)
      if (state) {
        state.selected = false
        state.timestamp = Date.now()
        removed.push(this.cellToGridCell(state))
      }
    }

    this.selectedCells.clear()
    
    // Emit selection change event
    this.emitSelectionChange([], removed)
    
    console.log('[CellStateManager] Cleared all selections')
  }

  /**
   * Get all selected cells as GridCell array
   */
  getSelectedCells(): GridCell[] {
    const cells: GridCell[] = []
    
    for (const key of this.selectedCells) {
      const state = this.cellStates.get(key)
      if (state) {
        cells.push(this.cellToGridCell(state))
      }
    }

    return cells
  }

  /**
   * Get selected cells for a specific zone
   */
  getSelectedCellsByZone(zone: 'web' | 'flange-top' | 'flange-bottom'): GridCell[] {
    return this.getSelectedCells().filter(cell => cell.zone === zone)
  }

  /**
   * Get cell state
   */
  getCellState(key: string): CellState | undefined {
    return this.cellStates.get(key)
  }

  /**
   * Check if a cell is selected
   */
  isCellSelected(key: string): boolean {
    return this.selectedCells.has(key)
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectedCells.size
  }

  /**
   * Batch select cells
   */
  batchSelectCells(keys: string[], defectType: DefectType = 'section-loss'): void {
    const added: GridCell[] = []
    
    for (const key of keys) {
      const state = this.cellStates.get(key)
      if (state && !state.selected) {
        state.selected = true
        state.defectType = defectType
        state.timestamp = Date.now()
        this.selectedCells.add(key)
        added.push(this.cellToGridCell(state))
      }
    }

    if (added.length > 0) {
      this.emitSelectionChange(added, [])
    }
  }

  /**
   * Restore selections from saved state
   */
  restoreSelections(cells: GridCell[]): void {
    this.clearAllSelections()
    
    const keys = cells.map(cell => {
      const key = `${cell.zone}_${cell.x}_${cell.y}`
      // Initialize cell if it doesn't exist
      if (!this.cellStates.has(key)) {
        this.initializeCell(key, cell.x, cell.y, cell.zone, cell.isLinear)
      }
      return key
    })

    this.batchSelectCells(keys)
    console.log(`[CellStateManager] Restored ${cells.length} selections`)
  }

  /**
   * Convert internal state to GridCell
   */
  private cellToGridCell(state: CellState): GridCell {
    return {
      x: state.col,
      y: state.row,
      zone: state.zone,
      isLinear: state.isLinear,
      defectType: state.defectType
    }
  }

  /**
   * Emit selection change event
   */
  private emitSelectionChange(added: GridCell[], removed: GridCell[]): void {
    const current = this.getSelectedCells()
    
    this.eventManager.emitGridEvent('selection:change', {
      added,
      removed,
      current,
      totalCount: current.length
    })
  }

  /**
   * Reset the state manager
   */
  reset(): void {
    this.cellStates.clear()
    this.selectedCells.clear()
    console.log('[CellStateManager] Reset complete')
  }

  /**
   * Get statistics about cell states
   */
  getStatistics(): {
    totalCells: number
    selectedCells: number
    webCells: number
    flangeCells: number
    defectTypes: Record<DefectType, number>
  } {
    const stats = {
      totalCells: this.cellStates.size,
      selectedCells: this.selectedCells.size,
      webCells: 0,
      flangeCells: 0,
      defectTypes: {} as Record<DefectType, number>
    }

    for (const state of this.cellStates.values()) {
      if (state.zone === 'web') {
        stats.webCells++
      } else {
        stats.flangeCells++
      }

      if (state.selected) {
        const type = state.defectType
        stats.defectTypes[type] = (stats.defectTypes[type] || 0) + 1
      }
    }

    return stats
  }
}