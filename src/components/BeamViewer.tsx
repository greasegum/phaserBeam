import React, { useEffect, useRef, useState } from 'react'
import paper from 'paper'
import { BeamProfile, GridCell } from '../types/beam'
import { marchingSquares } from '../utils/marchingSquares'

interface BeamViewerProps {
  beamProfile: BeamProfile
  sectionLossCells: GridCell[]
  showDimensions?: boolean
}

export const BeamViewer: React.FC<BeamViewerProps> = ({ 
  beamProfile, 
  sectionLossCells, 
  showDimensions = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paperScope, setPaperScope] = useState<paper.PaperScope | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const scope = new paper.PaperScope()
    scope.setup(canvasRef.current)
    setPaperScope(scope)

    return () => {
      scope.project.clear()
      // @ts-ignore - remove() method exists but not in types
      scope.remove()
    }
  }, [])

  useEffect(() => {
    if (!paperScope || !beamProfile) return

    paperScope.activate()
    paperScope.project.clear()

    const scale = 20 // pixels per inch
    const { webHeight, webThickness, flangeWidth, flangeThickness } = beamProfile
    
    // Draw cross-section
    const centerX = 200
    const centerY = 200

    // Web
    new paperScope.Path.Rectangle({
      point: [centerX - (webThickness * scale) / 2, centerY - (webHeight * scale) / 2],
      size: [webThickness * scale, webHeight * scale],
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: new paperScope.Color(0.95, 0.95, 0.95)
    })

    // Top flange
    new paperScope.Path.Rectangle({
      point: [centerX - (flangeWidth * scale) / 2, centerY - (webHeight * scale) / 2 - flangeThickness * scale],
      size: [flangeWidth * scale, flangeThickness * scale],
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: new paperScope.Color(0.95, 0.95, 0.95)
    })

    // Bottom flange
    new paperScope.Path.Rectangle({
      point: [centerX - (flangeWidth * scale) / 2, centerY + (webHeight * scale) / 2],
      size: [flangeWidth * scale, flangeThickness * scale],
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: new paperScope.Color(0.95, 0.95, 0.95)
    })

    // Add dimensions if enabled
    if (showDimensions) {
      // Web height dimension
      new paperScope.Path.Line({
        from: [centerX + (flangeWidth * scale) / 2 + 20, centerY - (webHeight * scale) / 2],
        to: [centerX + (flangeWidth * scale) / 2 + 20, centerY + (webHeight * scale) / 2],
        strokeColor: 'black',
        strokeWidth: 1
      })

      new paperScope.PointText({
        point: [centerX + (flangeWidth * scale) / 2 + 30, centerY],
        content: `${webHeight}"`,
        fontSize: 12,
        fillColor: 'black',
        justification: 'left'
      })

      // Flange width dimension
      new paperScope.Path.Line({
        from: [centerX - (flangeWidth * scale) / 2, centerY + (webHeight * scale) / 2 + flangeThickness * scale + 20],
        to: [centerX + (flangeWidth * scale) / 2, centerY + (webHeight * scale) / 2 + flangeThickness * scale + 20],
        strokeColor: 'black',
        strokeWidth: 1
      })

      new paperScope.PointText({
        point: [centerX, centerY + (webHeight * scale) / 2 + flangeThickness * scale + 30],
        content: `${flangeWidth}"`,
        fontSize: 12,
        fillColor: 'black',
        justification: 'center'
      })
    }

    // Draw section loss contours if any
    if (sectionLossCells.length > 0) {
      const contours = marchingSquares(sectionLossCells, 1, 1)
      contours.forEach(contour => {
        const path = new paperScope.Path({
          segments: contour.map(pt => [centerX + pt.x * scale, centerY + pt.y * scale]),
          closed: true,
          fillColor: new paperScope.Color(1, 0.4, 0.4, 0.5),
          strokeColor: new paperScope.Color(0.8, 0.2, 0.2),
          strokeWidth: 1
        })
        path.smooth()
      })
    }

    // Label
    new paperScope.PointText({
      point: [centerX, 50],
      content: beamProfile.name,
      fontSize: 18,
      fillColor: 'black',
      justification: 'center'
    })

    // @ts-ignore - draw() method exists but not in types
    paperScope.view.draw()
  }, [paperScope, beamProfile, sectionLossCells, showDimensions])

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400}
      style={{ backgroundColor: 'white', border: '1px solid #ccc' }}
    />
  )
}