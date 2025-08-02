/**
 * Performance monitoring utility
 */

export class PerformanceMonitor {
  private timers: Map<string, number> = new Map()
  private metrics: Map<string, number> = new Map()
  
  start(label: string): void {
    this.timers.set(label, performance.now())
  }
  
  end(label: string): number {
    const startTime = this.timers.get(label)
    if (startTime === undefined) {
      console.warn(`Performance timer '${label}' was not started`)
      return 0
    }
    
    const duration = performance.now() - startTime
    this.metrics.set(label, duration)
    this.timers.delete(label)
    
    return duration
  }
  
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {}
    this.metrics.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
  
  reset(): void {
    this.timers.clear()
    this.metrics.clear()
  }
}