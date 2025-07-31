import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { GridScene } from '../scenes/GridScene'
import { BeamProfile, GridCell } from '../types/beam'

interface PhaserCanvasProps {
  beamProfile: BeamProfile | null
  onCellChange: (cells: GridCell[]) => void
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ beamProfile, onCellChange }) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !beamProfile) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#f0f0f0',
      scene: [GridScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }
        }
      }
    }

    gameRef.current = new Phaser.Game(config)
    
    // Wait for scene to be ready then pass data
    gameRef.current.events.on('ready', () => {
      const scene = gameRef.current?.scene.getScene('GridScene') as GridScene
      if (scene) {
        scene.scene.start('GridScene', { beamProfile, onCellChange })
      }
    })

    return () => {
      gameRef.current?.destroy(true)
    }
  }, [beamProfile])

  useEffect(() => {
    if (!gameRef.current || !beamProfile) return
    
    const scene = gameRef.current.scene.getScene('GridScene') as GridScene
    if (scene && scene.scene.isActive()) {
      scene.updateBeamProfile(beamProfile)
    }
  }, [beamProfile])

  if (!beamProfile) {
    return (
      <div style={{ 
        width: '800px', 
        height: '600px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '8px'
      }}>
        <p>Please select a beam profile to begin</p>
      </div>
    )
  }

  return <div ref={containerRef} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }} />
}