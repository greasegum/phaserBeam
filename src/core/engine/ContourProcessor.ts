/**
 * Contour Processor Interface
 * This is a legacy wrapper for backward compatibility
 * It forwards requests to the new SmoothingAlgorithm implementation
 */

import { SmoothingAlgorithm } from '../../algorithms/SmoothingAlgorithm'
import { SmoothingConfig } from '../../configuration/SmoothingConfig'
import { Point, Contour } from '../geometry'
import { ConfigUtils } from '../../configuration/ConfigUtils'

export class ContourProcessor {
  private smoothingAlgorithm: SmoothingAlgorithm
  private config: SmoothingConfig
  
  constructor(config: SmoothingConfig) {
    this.config = ConfigUtils.validateConfig({ smoothing: config }).smoothing
    this.smoothingAlgorithm = new SmoothingAlgorithm(this.config)
  }
  
  /**
   * Process contours with the underlying smoothing algorithm
   */
  process(contours: Contour[]): Contour[] {
    return this.smoothingAlgorithm.smoothContours(contours)
  }
}
