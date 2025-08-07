import { describe, it, expect, beforeEach, vi } from 'vitest'
import Phaser from 'phaser'
import { BeamRenderer, BeamDimensions, BeamRenderConfig, ContourData } from '../BeamRenderer'
import { BeamProfile } from '../../../types/beam'

// Mock Phaser Graphics class
const mockGraphics = {
  clear: vi.fn(),
  setDepth: vi.fn(),
  setVisible: vi.fn(),
  fillStyle: vi.fn(),
  lineStyle: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fillCircle: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  strokePath: vi.fn(),
  destroy: vi.fn()
}

const mockScene = {
  add: {
    graphics: vi.fn(() => ({ ...mockGraphics }))
  }
}

describe('BeamRenderer', () => {
  let beamRenderer: BeamRenderer
  let beamProfile: BeamProfile
  let beamDimensions: BeamDimensions

  beforeEach(() => {
    vi.clearAllMocks()
    
    beamRenderer = new BeamRenderer(mockScene as any)
    
    beamProfile = {
      id: 'test-beam',
      name: 'Test Beam',
      webThickness: 8,
      webHeight: 200,
      flangeWidth: 100,
      flangeThickness: 10,
      weight: 25.3
    }
    
    beamDimensions = {
      startX: 100,
      centerY: 200,
      width: 600,
      gridSize: 30
    }
  })

  describe('initialization', () => {
    it('should create all graphics layers on initialization', () => {
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(9)
    })

    it('should set proper layer depths', () => {
      // Each graphics object should have setDepth called
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(1) // beam and topFlange
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(2) // loss
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(3) // pixel outline and blurred field
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(4) // contours
      expect(mockGraphics.setDepth).toHaveBeenCalledWith(5) // control points
    })
  })

  describe('beam profile management', () => {
    it('should set beam profile', () => {
      beamRenderer.setBeamProfile(beamProfile)
      
      // Should not throw and profile should be internally stored
      expect(() => beamRenderer.drawBeamProfile(beamDimensions)).not.toThrow()
    })

    it('should handle missing beam profile gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      beamRenderer.drawBeamProfile(beamDimensions) // No beam profile set
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'BeamRenderer: Cannot draw beam profile without beam profile and graphics'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('configuration management', () => {
    it('should update configuration', () => {
      const newConfig: Partial<BeamRenderConfig> = {
        showTopFlange: false,
        gridSize: 25,
        showContours: false
      }
      
      beamRenderer.updateConfig(newConfig)
      
      const config = beamRenderer.getConfig()
      expect(config.showTopFlange).toBe(false)
      expect(config.gridSize).toBe(25)
      expect(config.showContours).toBe(false)
    })

    it('should return current configuration', () => {
      const config = beamRenderer.getConfig()
      
      expect(config).toHaveProperty('showTopFlange')
      expect(config).toHaveProperty('gridSize')
      expect(config).toHaveProperty('selectedCells')
      expect(typeof config.showTopFlange).toBe('boolean')
      expect(typeof config.gridSize).toBe('number')
    })
  })

  describe('beam profile drawing', () => {
    beforeEach(() => {
      beamRenderer.setBeamProfile(beamProfile)
    })

    it('should draw beam profile with web and flanges', () => {
      beamRenderer.drawBeamProfile(beamDimensions)
      
      // Should clear graphics first
      expect(mockGraphics.clear).toHaveBeenCalled()
      
      // Should set fill and line styles
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xB8E6B8) // Beam color
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x4A7C4A) // Beam outline
      
      // Should draw rectangles for beam sections
      expect(mockGraphics.fillRect).toHaveBeenCalled()
      expect(mockGraphics.strokeRect).toHaveBeenCalled()
    })

    it('should handle top flange visibility', () => {
      // Test with top flange visible
      beamRenderer.updateConfig({ showTopFlange: true })
      beamRenderer.drawBeamProfile(beamDimensions)
      
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xB8E6B8)
      
      // Test with top flange hidden (grayed out)
      vi.clearAllMocks()
      beamRenderer.updateConfig({ showTopFlange: false })
      beamRenderer.drawBeamProfile(beamDimensions)
      
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xCCCCCC) // Gray color
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x888888) // Gray outline
    })

    it('should use correct dimensions for drawing', () => {
      beamRenderer.drawBeamProfile(beamDimensions)
      
      // Should use the provided dimensions in drawing calls
      const fillRectCalls = mockGraphics.fillRect.mock.calls
      expect(fillRectCalls.some(call => call[0] === beamDimensions.startX)).toBe(true)
    })
  })

  describe('section loss drawing', () => {
    beforeEach(() => {
      beamRenderer.setBeamProfile(beamProfile)
    })

    it('should clear visualization layers before drawing', () => {
      beamRenderer.drawSectionLoss(beamDimensions)
      
      // Should clear all visualization graphics
      expect(mockGraphics.clear).toHaveBeenCalled()
    })

    it('should handle selected cells for section loss', () => {
      const selectedCells = new Set(['web_5_3', 'flange-bottom_10_0'])
      beamRenderer.updateConfig({ selectedCells })
      
      beamRenderer.drawSectionLoss(beamDimensions)
      
      // Should process and draw section loss areas
      expect(mockGraphics.fillStyle).toHaveBeenCalled()
      expect(mockGraphics.lineStyle).toHaveBeenCalled()
    })

    it('should handle empty selection gracefully', () => {
      beamRenderer.updateConfig({ selectedCells: new Set() })
      
      expect(() => beamRenderer.drawSectionLoss(beamDimensions)).not.toThrow()
    })

    it('should handle missing beam profile gracefully', () => {
      const renderer = new BeamRenderer(mockScene as any) // No beam profile set
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      renderer.drawSectionLoss(beamDimensions)
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'BeamRenderer: Cannot draw section loss without beam profile'
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('contour drawing', () => {
    beforeEach(() => {
      beamRenderer.setBeamProfile(beamProfile)
    })

    it('should draw binary contours when enabled', () => {
      const contourData: ContourData = {
        binaryContours: [
          [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
        ]
      }
      
      beamRenderer.updateConfig({ showBinaryContour: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      expect(mockGraphics.clear).toHaveBeenCalled()
      expect(mockGraphics.lineStyle).toHaveBeenCalled()
      expect(mockGraphics.beginPath).toHaveBeenCalled()
      expect(mockGraphics.moveTo).toHaveBeenCalled()
      expect(mockGraphics.lineTo).toHaveBeenCalled()
      expect(mockGraphics.strokePath).toHaveBeenCalled()
    })

    it('should draw smoothed contours with different style', () => {
      const contourData: ContourData = {
        smoothedContours: [
          [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
        ]
      }
      
      beamRenderer.updateConfig({ showSmoothedContour: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      // Should use different line style for smoothed contours
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(3, 0x4A90E2, 1.0)
    })

    it('should draw control points when enabled', () => {
      const contourData: ContourData = {
        controlPoints: [
          { x: 5, y: 5 },
          { x: 15, y: 15 }
        ]
      }
      
      beamRenderer.updateConfig({ showControlPoints: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0xFF0000, 0.8)
      expect(mockGraphics.fillCircle).toHaveBeenCalled()
    })

    it('should skip drawing when contour data is missing', () => {
      const contourData: ContourData = {}
      
      beamRenderer.updateConfig({ showBinaryContour: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      // Should not crash - no graphics operations expected for missing data
      expect(() => beamRenderer.drawContours(contourData, beamDimensions)).not.toThrow()
    })
  })

  describe('layer management', () => {
    it('should clear specific layers', () => {
      beamRenderer.clearLayers(['beam', 'sectionLoss', 'contours'])
      
      // Should call clear on appropriate graphics objects
      expect(mockGraphics.clear).toHaveBeenCalled()
    })

    it('should clear all visualization layers', () => {
      beamRenderer.clearVisualizationLayers()
      
      // Should clear all visualization graphics
      expect(mockGraphics.clear).toHaveBeenCalled()
    })

    it('should set layer visibility', () => {
      beamRenderer.setLayerVisibility('beam', false)
      beamRenderer.setLayerVisibility('controlPoints', true)
      
      expect(mockGraphics.setVisible).toHaveBeenCalledWith(false)
      expect(mockGraphics.setVisible).toHaveBeenCalledWith(true)
    })
  })

  describe('contour data processing', () => {
    it('should handle pixel outline data', () => {
      const contourData: ContourData = {
        pixelOutline: [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 5, y: 5 }
        ]
      }
      
      beamRenderer.updateConfig({ showPixelOutline: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(1, 0x00FF00, 0.6)
      expect(mockGraphics.moveTo).toHaveBeenCalled()
      expect(mockGraphics.lineTo).toHaveBeenCalled()
    })

    it('should handle blurred field data', () => {
      const contourData: ContourData = {
        blurredField: [
          [0.1, 0.5, 0.9],
          [0.3, 0.7, 0.2],
          [0.8, 0.4, 0.6]
        ]
      }
      
      beamRenderer.updateConfig({ showBlurredField: true })
      beamRenderer.drawContours(contourData, beamDimensions)
      
      // Should draw field visualization
      expect(mockGraphics.fillStyle).toHaveBeenCalled()
      expect(mockGraphics.fillRect).toHaveBeenCalled()
    })

    it('should handle empty contour arrays', () => {
      const contourData: ContourData = {
        binaryContours: [],
        rawContours: [],
        smoothedContours: []
      }
      
      beamRenderer.updateConfig({ 
        showBinaryContour: true,
        showRawContour: true,
        showSmoothedContour: true
      })
      
      expect(() => beamRenderer.drawContours(contourData, beamDimensions)).not.toThrow()
    })
  })

  describe('coordinate transformation', () => {
    it('should apply contour offsets correctly', () => {
      const contourData: ContourData = {
        binaryContours: [
          [{ x: 0, y: 0 }, { x: 1, y: 1 }]
        ]
      }
      
      beamRenderer.updateConfig({ 
        showBinaryContour: true,
        contourOffsetX: 50,
        contourOffsetY: 25
      })
      
      beamRenderer.drawContours(contourData, beamDimensions)
      
      // Should apply offsets in coordinate transformation
      expect(mockGraphics.moveTo).toHaveBeenCalled()
      expect(mockGraphics.lineTo).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should destroy all graphics objects', () => {
      beamRenderer.destroy()
      
      // Should call destroy on all graphics objects
      expect(mockGraphics.destroy).toHaveBeenCalled()
    })

    it('should clear all references after destroy', () => {
      beamRenderer.destroy()
      
      // Should handle subsequent operations gracefully
      expect(() => beamRenderer.drawBeamProfile(beamDimensions)).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle missing graphics objects gracefully', () => {
      const renderer = new BeamRenderer(mockScene as any)
      renderer.destroy() // Destroy graphics objects
      
      // Should not crash when calling methods on destroyed renderer
      expect(() => renderer.clearVisualizationLayers()).not.toThrow()
      expect(() => renderer.setLayerVisibility('beam', true)).not.toThrow()
    })

    it('should validate contour data types', () => {
      const invalidContourData = {
        binaryContours: 'invalid' // Should be array
      } as any
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      beamRenderer.updateConfig({ showBinaryContour: true })
      
      // Should handle invalid data gracefully and log warning
      expect(() => beamRenderer.drawContours(invalidContourData, beamDimensions)).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('BeamRenderer: Invalid contours data, expected array')
      
      consoleSpy.mockRestore()
    })
  })
})
