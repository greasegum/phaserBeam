/**
 * Example of using the refactored beam visualization
 * Shows how simple the API has become
 */

import React, { useRef, useEffect } from 'react'
import Phaser from 'phaser'
import { BeamElevationSceneRefactored } from '../scenes/BeamElevationSceneRefactored'
import { ContourSettings } from '../components/ContourSettings'
import { BeamProfile, GridCell } from '../types/beam'

interface BeamVisualizationProps {
  beamProfile: BeamProfile
  beamLength?: number
  gridCells?: GridCell[]
  onCellChange?: (cells: GridCell[]) => void
}

export const BeamVisualization: React.FC<BeamVisualizationProps> = ({
  beamProfile,
  beamLength = 120,
  gridCells = [],
  onCellChange
}) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<BeamElevationSceneRefactored | null>(null)
  
  useEffect(() => {
    // Simple Phaser configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'beam-container',
      width: 1200,
      height: 600,
      scene: BeamElevationSceneRefactored,
      backgroundColor: '#f5f5f5'
    }
    
    // Create game
    gameRef.current = new Phaser.Game(config)
    
    // Initialize scene
    gameRef.current.scene.start('BeamElevationSceneRefactored', {
      beamProfile,
      beamLength,
      gridCells,
      onCellChange
    })
    
    // Get scene reference
    sceneRef.current = gameRef.current.scene.getScene('BeamElevationSceneRefactored') as BeamElevationSceneRefactored
    
    return () => {
      gameRef.current?.destroy(true)
    }
  }, [])
  
  // Update beam profile when it changes
  useEffect(() => {
    if (sceneRef.current && beamProfile) {
      // In a real implementation, we'd add an updateBeamProfile method
      // For now, we'd restart the scene
      gameRef.current?.scene.stop('BeamElevationSceneRefactored')
      gameRef.current?.scene.start('BeamElevationSceneRefactored', {
        beamProfile,
        beamLength,
        gridCells,
        onCellChange
      })
      sceneRef.current = gameRef.current?.scene.getScene('BeamElevationSceneRefactored') as BeamElevationSceneRefactored
    }
  }, [beamProfile, beamLength])
  
  return (
    <div className="beam-visualization">
      <div id="beam-container" />
      <ContourSettings scene={sceneRef.current} />
      
      {/* Optional: Quick preset buttons */}
      <div className="preset-buttons">
        <button onClick={() => sceneRef.current?.setPreset('default')}>
          Default
        </button>
        <button onClick={() => sceneRef.current?.setPreset('sharp')}>
          Sharp
        </button>
        <button onClick={() => sceneRef.current?.setPreset('organic')}>
          Organic
        </button>
        <button onClick={() => sceneRef.current?.setPreset('technical')}>
          Technical
        </button>
      </div>
      
      <style jsx>{`
        .beam-visualization {
          position: relative;
          width: 100%;
          height: 600px;
        }
        
        .preset-buttons {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
        }
        
        .preset-buttons button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .preset-buttons button:hover {
          background: #f0f0f0;
          border-color: #bbb;
        }
      `}</style>
    </div>
  )
}

// Example usage in a parent component
export const ExampleApp: React.FC = () => {
  const [gridCells, setGridCells] = React.useState<GridCell[]>([
    { x: 10, y: 5, zone: 'web' },
    { x: 11, y: 5, zone: 'web' },
    { x: 12, y: 5, zone: 'web' },
    // ... more cells
  ])
  
  const beamProfile: BeamProfile = {
    name: 'W24x68',
    webHeight: 24,
    flangeThickness: 0.585,
    webThickness: 0.415,
    flangeWidth: 8.97
  }
  
  return (
    <div>
      <h1>Beam Section Loss Visualization</h1>
      <BeamVisualization
        beamProfile={beamProfile}
        beamLength={120}
        gridCells={gridCells}
        onCellChange={setGridCells}
      />
      <p>
        Click on the grid to mark section loss areas. 
        Use the settings button to adjust visualization style.
      </p>
    </div>
  )
}