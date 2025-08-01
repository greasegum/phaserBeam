import React, { useEffect, useRef } from 'react'
import paper from 'paper'
import { GridCell, BeamProfile } from '../types/beam'
import { marchingSquares } from '../utils/marchingSquaresNew'

interface SectionLossOverlayProps {
  cells: GridCell[]
  beamProfile: BeamProfile | null
  beamLength: number
  gridSize: number
  startX: number
  centerY: number
  showGrid: boolean
}

export const SectionLossOverlay: React.FC<SectionLossOverlayProps> = ({
  cells,
  beamProfile,
  beamLength,
  gridSize,
  startX,
  centerY,
  showGrid
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [paperScope, setPaperScope] = React.useState<paper.PaperScope | null>(null)

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
    if (!paperScope || !beamProfile || cells.length === 0) return

    paperScope.activate()
    paperScope.project.clear()

    const { webHeight, flangeThickness } = beamProfile
    const totalHeight = webHeight + 2 * flangeThickness
    
    // Create a grid of values for marching squares
    const cols = Math.ceil(beamLength)
    const rows = Math.ceil(totalHeight)
    
    // Initialize grid with 0s
    const grid: number[][] = Array(rows + 2).fill(null).map(() => Array(cols + 2).fill(0))
    
    // Fill grid with 1s where cells are selected
    cells.forEach(cell => {
      if (cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows) {
        // Add padding around selected cells for smoother shapes
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = cell.y + dy + 1
            const nx = cell.x + dx + 1
            if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              const value = distance === 0 ? 1 : (distance <= 1 ? 0.7 : 0.3)
              grid[ny][nx] = Math.max(grid[ny][nx], value)
            }
          }
        }
      }
    })
    
    // Apply smoothing to the grid
    for (let i = 0; i < 2; i++) {
      const smoothed = grid.map(row => [...row])
      for (let y = 1; y < grid.length - 1; y++) {
        for (let x = 1; x < grid[0].length - 1; x++) {
          let sum = 0
          let count = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += grid[y + dy][x + dx]
              count++
            }
          }
          smoothed[y][x] = sum / count
        }
      }
      grid.forEach((row, y) => row.forEach((_, x) => grid[y][x] = smoothed[y][x]))
    }
    
    // Generate contours using marching squares
    const threshold = 0.5
    const contours = marchingSquares(grid, threshold)
    
    // Transform contours to canvas coordinates
    const gridTop = centerY - (totalHeight * gridSize) / 2
    
    // Draw the contours
    contours.forEach(contour => {
      if (contour.length < 3) return
      
      const path = new paperScope.Path()
      path.strokeColor = new paperScope.Color('#FF6B6B')
      path.strokeWidth = 2
      path.fillColor = new paperScope.Color('#FFB3BA')
      path.opacity = 0.8
      path.closed = true
      
      contour.forEach((point, index) => {
        const x = startX + (point[0] - 1) * gridSize
        const y = gridTop + (point[1] - 1) * gridSize
        
        if (index === 0) {
          path.moveTo(new paperScope.Point(x, y))
        } else {
          path.lineTo(new paperScope.Point(x, y))
        }
      })
      
      // Smooth the path
      path.smooth({ type: 'continuous', factor: 0.5 })
    })
    
    // @ts-ignore - draw() method exists but not in types
    paperScope.view.draw()
  }, [paperScope, cells, beamProfile, beamLength, gridSize, startX, centerY])

  if (!beamProfile) return null

  // Calculate canvas dimensions
  const padding = 100
  const canvasWidth = Math.max(window.innerWidth, beamLength * gridSize + padding * 2)
  const canvasHeight = window.innerHeight - 100

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  )
}