import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { BeamProfile, GridCell } from '../types/beam'

interface PhaserCanvasProps {
  beamProfile: BeamProfile | null
  onCellChange: (cells: GridCell[]) => void
  editMode: boolean
  beamLength: number
  showGrid?: boolean
  gridOrigin?: 'left' | 'right'
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ 
  beamProfile, 
  onCellChange, 
  editMode,
  beamLength,
  showGrid = true,
  gridOrigin = 'left' 
}) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - 100, // Account for header and footer
      parent: containerRef.current,
      backgroundColor: '#f0f0f0',
      scene: [BeamElevationScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }
        }
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER
      }
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
    }
  }, [])

  useEffect(() => {
    if (!gameRef.current || !beamProfile) return
    
    // Calculate required canvas width based on beam length
    const padding = 100
    const gridSize = 40 // Match the max grid size from BeamElevationScene
    const requiredWidth = beamLength * gridSize + padding * 2
    const canvasWidth = Math.max(window.innerWidth, requiredWidth)
    
    // Resize the game canvas if needed
    if (gameRef.current.scale.width !== canvasWidth) {
      gameRef.current.scale.resize(canvasWidth, window.innerHeight - 100)
    }
    
    // Update container div width to enable scrolling
    if (containerRef.current && containerRef.current.parentElement) {
      containerRef.current.style.width = `${canvasWidth}px`
    }
    
    // Start or restart scene with new data
    const scene = gameRef.current.scene.getScene('BeamElevationScene') as BeamElevationScene
    if (scene) {
      if (scene.scene.isActive()) {
        scene.updateBeamProfile(beamProfile, beamLength, editMode, showGrid, gridOrigin)
      } else {
        scene.scene.start('BeamElevationScene', { 
          beamProfile, 
          beamLength,
          editMode,
          onCellChange,
          showGrid,
          gridOrigin 
        })
      }
    } else {
      // Wait for scene to be ready
      gameRef.current.events.once('ready', () => {
        const readyScene = gameRef.current?.scene.getScene('BeamElevationScene') as BeamElevationScene
        if (readyScene) {
          readyScene.scene.start('BeamElevationScene', { 
            beamProfile, 
            beamLength,
            editMode,
            onCellChange,
            showGrid,
            gridOrigin 
          })
        }
      })
    }
  }, [beamProfile, beamLength, editMode, onCellChange, showGrid, gridOrigin])

  if (!beamProfile) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontSize: '18px',
        color: '#666'
      }}>
        <p>Please select a beam profile to begin</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <div ref={containerRef} style={{ minWidth: '100%', height: '100%' }} />
    </div>
  )
}