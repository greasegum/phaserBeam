import React, { useEffect, useRef, useState } from 'react'
import paper from 'paper'
import { BeamProfile, GridCell } from '../types/beam'
import { processGrid as marchingSquares } from '../core'

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
      // Clean up by manually removing all event listeners and references
      // This is safer than using the undocumented remove() method
      scope.view.detach()
      // @ts-expect-error Paper.js cleanup - documented in examples but not in types
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

    // Draw section loss overlay on cross-section
    if (sectionLossCells.length > 0 && beamProfile) {
      const totalHeight = webHeight + 2 * flangeThickness
      
      // Group cells by column (lengthwise position)
      const columnLosses = new Map<number, Set<number>>()
      sectionLossCells.forEach(cell => {
        if (!columnLosses.has(cell.x)) {
          columnLosses.set(cell.x, new Set())
        }
        columnLosses.get(cell.x)?.add(cell.y)
      })
      
      // For cross-section, show worst-case scenario
      let maxLossRows = 0
      let worstColumn = 0
      columnLosses.forEach((rows, col) => {
        if (rows.size > maxLossRows) {
          maxLossRows = rows.size
          worstColumn = col
        }
      })
      
      // Draw loss areas on cross-section for worst case
      if (maxLossRows > 0) {
        const worstRows = columnLosses.get(worstColumn)
        if (worstRows) {
          worstRows.forEach(row => {
            // Calculate position on cross-section
            const yOffset = (row / Math.ceil(totalHeight)) * totalHeight * scale
            const lossY = centerY - (totalHeight * scale) / 2 + yOffset
            
            // Draw loss indicator across the beam width
            new paperScope.Path.Rectangle({
              point: [centerX - (flangeWidth * scale) / 2, lossY],
              size: [flangeWidth * scale, scale],
              fillColor: new paperScope.Color(1, 0.4, 0.4, 0.6),
              strokeColor: new paperScope.Color(0.8, 0.2, 0.2),
              strokeWidth: 0.5
            })
          })
        }
        
        // Add loss percentage text
        const lossPercentage = (maxLossRows / Math.ceil(totalHeight)) * 100
        new paperScope.PointText({
          point: [centerX, centerY + (totalHeight * scale) / 2 + 50],
          content: `Max Section Loss: ${lossPercentage.toFixed(0)}%`,
          fontSize: 14,
          fillColor: new paperScope.Color(0.8, 0.2, 0.2),
          justification: 'center'
        })
      }
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