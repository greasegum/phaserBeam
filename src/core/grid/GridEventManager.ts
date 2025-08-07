/**
 * GridEventManager - Centralized event handling for grid interactions
 * Implements a clean event-driven architecture for the click-to-contour pipeline
 */

import { EventEmitter } from 'events'
import type { GridCell } from '../../types/beam'
import type { DefectType } from '../../types/defects'

export interface GridClickEvent {
  cellKey: string
  col: number
  row: number
  zone: 'web' | 'flange-top' | 'flange-bottom'
  worldX: number
  worldY: number
  timestamp: number
}

export interface GridSelectionChangeEvent {
  added: GridCell[]
  removed: GridCell[]
  current: GridCell[]
  totalCount: number
}

export interface GridContourRequest {
  cells: GridCell[]
  cols: number
  rows: number
  threshold: number
}

export type GridEventType = 
  | 'cell:click'
  | 'cell:hover'
  | 'cell:leave'
  | 'selection:change'
  | 'selection:clear'
  | 'contour:request'
  | 'contour:generated'
  | 'grid:reset'

export class GridEventManager extends EventEmitter {
  private static instance: GridEventManager | null = null
  private eventLog: Array<{ type: GridEventType; data: any; timestamp: number }> = []
  private maxLogSize = 100

  private constructor() {
    super()
    this.setMaxListeners(50) // Increase max listeners for complex pipelines
  }

  /**
   * Get singleton instance
   */
  static getInstance(): GridEventManager {
    if (!GridEventManager.instance) {
      GridEventManager.instance = new GridEventManager()
    }
    return GridEventManager.instance
  }

  /**
   * Emit a grid event with logging
   */
  emitGridEvent(type: GridEventType, data: any): void {
    const timestamp = Date.now()
    
    // Log event for debugging
    this.logEvent(type, data, timestamp)
    
    // Emit the event
    this.emit(type, { ...data, timestamp })
    
    // Also emit a generic 'any' event for global listeners
    this.emit('grid:event', { type, data, timestamp })
  }

  /**
   * Register event handler with automatic cleanup
   */
  onGridEvent(type: GridEventType, handler: (data: any) => void): () => void {
    this.on(type, handler)
    
    // Return cleanup function
    return () => {
      this.off(type, handler)
    }
  }

  /**
   * Register one-time event handler
   */
  onceGridEvent(type: GridEventType, handler: (data: any) => void): void {
    this.once(type, handler)
  }

  /**
   * Log event for debugging
   */
  private logEvent(type: GridEventType, data: any, timestamp: number): void {
    this.eventLog.push({ type, data, timestamp })
    
    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[GridEvent] ${type}:`, data)
    }
  }

  /**
   * Get recent event history for debugging
   */
  getEventHistory(count?: number): Array<{ type: GridEventType; data: any; timestamp: number }> {
    const limit = count || 20
    return this.eventLog.slice(-limit)
  }

  /**
   * Clear all event listeners and reset
   */
  reset(): void {
    this.removeAllListeners()
    this.eventLog = []
  }

  /**
   * Get event statistics
   */
  getEventStats(): Record<GridEventType, number> {
    const stats: Partial<Record<GridEventType, number>> = {}
    
    for (const event of this.eventLog) {
      stats[event.type] = (stats[event.type] || 0) + 1
    }
    
    return stats as Record<GridEventType, number>
  }
}