/**
 * Professional implementation example
 * Shows how to use the refactored marching squares with full geometric controls
 */

import React, { useRef, useEffect, useState } from 'react'
import Phaser from 'phaser'
import { ProfessionalBeamScene } from '../scenes/ProfessionalBeamScene'
import { MarchingSquaresControls } from '../components/MarchingSquaresControls'
import { MarchingSquaresConfig, CONFIG_PRESETS } from '../core/configuration/MarchingSquaresConfig'
import { BeamProfile, GridCell } from '../types/beam'

interface BeamVisualizationProps {
  beamProfile: BeamProfile
  beamLength?: number
  initialCells?: GridCell[]
  onCellsChange?: (cells: GridCell[]) => void
}

export const ProfessionalBeamVisualization: React.FC<BeamVisualizationProps> = ({
  beamProfile,
  beamLength = 120,
  initialCells = [],
  onCellsChange
}) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<ProfessionalBeamScene | null>(null)
  const [config, setConfig] = useState<MarchingSquaresConfig>(CONFIG_PRESETS.default as MarchingSquaresConfig)
  const [performanceMetrics, setPerformanceMetrics] = useState<Record<string, number>>({})
  const [showControls, setShowControls] = useState(true)
  
  useEffect(() => {
    // Initialize Phaser
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'beam-container',
      width: 1200,
      height: 600,
      backgroundColor: '#f5f5f5',
      scene: ProfessionalBeamScene,
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    }
    
    gameRef.current = new Phaser.Game(phaserConfig)
    
    // Start scene with configuration
    const sceneConfig = {
      beamProfile,
      beamLength,
      gridCells: initialCells,
      editMode: true,
      showGrid: true,
      marchingSquaresConfig: config,
      onCellChange: handleCellChange,
      onConfigChange: handleConfigChange
    }
    
    gameRef.current.scene.start('ProfessionalBeamScene', sceneConfig)
    sceneRef.current = gameRef.current.scene.getScene('ProfessionalBeamScene') as ProfessionalBeamScene
    
    return () => {
      gameRef.current?.destroy(true)
    }
  }, [])
  
  // Handle cell changes
  const handleCellChange = (cells: GridCell[]) => {
    onCellsChange?.(cells)
    
    // Update performance metrics
    if (sceneRef.current) {
      const metrics = sceneRef.current.getPerformanceMetrics()
      setPerformanceMetrics(metrics)
    }
  }
  
  // Handle configuration changes
  const handleConfigChange = (newConfig: MarchingSquaresConfig) => {
    setConfig(newConfig)
    sceneRef.current?.updateConfig(newConfig)
    
    // Update performance metrics
    if (sceneRef.current) {
      const metrics = sceneRef.current.getPerformanceMetrics()
      setPerformanceMetrics(metrics)
    }
  }
  
  // Handle preset changes
  const handlePresetChange = (preset: string) => {
    console.log(`Preset changed to: ${preset}`)
  }
  
  // Export contours
  const handleExport = () => {
    if (sceneRef.current) {
      const result = sceneRef.current.exportContours()
      if (result) {
        console.log('Exported contours:', result)
        // Could download as JSON, SVG, etc.
      }
    }
  }
  
  return (
    <div className="professional-beam-visualization">
      <div className="visualization-header">
        <h2>Beam Section Loss Visualization</h2>
        <div className="header-controls">
          <button onClick={() => setShowControls(!showControls)}>
            {showControls ? 'Hide' : 'Show'} Controls
          </button>
          <button onClick={handleExport}>
            Export Contours
          </button>
        </div>
      </div>
      
      <div className="visualization-body">
        <div id="beam-container" className="beam-canvas" />
        
        {showControls && (
          <div className="controls-panel">
            <MarchingSquaresControls
              config={config}
              onConfigChange={handleConfigChange}
              onPresetChange={handlePresetChange}
              showPerformanceMetrics={true}
              performanceMetrics={performanceMetrics}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        .professional-beam-visualization {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #f5f5f5;
        }
        
        .visualization-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .visualization-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #333;
        }
        
        .header-controls {
          display: flex;
          gap: 12px;
        }
        
        .header-controls button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .header-controls button:hover {
          background: #0056b3;
        }
        
        .visualization-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .beam-canvas {
          flex: 1;
          background: white;
          position: relative;
        }
        
        .controls-panel {
          width: 320px;
          background: #f8f9fa;
          border-left: 1px solid #e0e0e0;
          overflow-y: auto;
        }
        
        @media (max-width: 768px) {
          .visualization-body {
            flex-direction: column;
          }
          
          .controls-panel {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e0e0e0;
          }
        }
      `}</style>
    </div>
  )
}

// Example application
export const App: React.FC = () => {
  const [gridCells, setGridCells] = useState<GridCell[]>([
    // Example section loss pattern
    { x: 10, y: 5, zone: 'web' },
    { x: 11, y: 5, zone: 'web' },
    { x: 12, y: 5, zone: 'web' },
    { x: 10, y: 6, zone: 'web' },
    { x: 11, y: 6, zone: 'web' },
    { x: 12, y: 6, zone: 'web' },
    // More cells...
  ])
  
  const beamProfile: BeamProfile = {
    name: 'W24x68',
    webHeight: 24,
    flangeThickness: 0.585,
    webThickness: 0.415,
    flangeWidth: 8.97
  }
  
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ProfessionalBeamVisualization
        beamProfile={beamProfile}
        beamLength={120}
        initialCells={gridCells}
        onCellsChange={setGridCells}
      />
    </div>
  )
}