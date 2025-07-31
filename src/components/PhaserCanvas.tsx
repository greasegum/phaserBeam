import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { BeamProfile, GridCell } from '../types/beam'

interface PhaserCanvasProps {
  beamProfile: BeamProfile | null
  onCellChange: (cells: GridCell[]) => void
  editMode: boolean
  beamLength: number
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ 
  beamProfile, 
  onCellChange, 
  editMode,
  beamLength 
}) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - 140, // Account for header and footer
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
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    }

    gameRef.current = new Phaser.Game(config)
    
    // Handle window resize
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight - 140)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      gameRef.current?.destroy(true)
    }
  }, [])

  useEffect(() => {
    if (!gameRef.current || !beamProfile) return
    
    // Start or restart scene with new data
    const scene = gameRef.current.scene.getScene('BeamElevationScene') as BeamElevationScene
    if (scene) {
      if (scene.scene.isActive()) {
        scene.updateBeamProfile(beamProfile, beamLength, editMode)
      } else {
        scene.scene.start('BeamElevationScene', { 
          beamProfile, 
          beamLength,
          editMode,
          onCellChange 
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
            onCellChange 
          })
        }
      })
    }
  }, [beamProfile, beamLength, editMode, onCellChange])

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

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}