import React, { useState } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'

interface ContourAlignmentControlsProps {
  scene?: BeamElevationScene
}

export const ContourAlignmentControls: React.FC<ContourAlignmentControlsProps> = ({ scene }) => {
  const [offsetX, setOffsetX] = useState(0.5)
  const [offsetY, setOffsetY] = useState(0.5)
  const [globalOffsetX, setGlobalOffsetX] = useState(0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0)

  const handleOffsetChange = (x: number, y: number) => {
    setOffsetX(x)
    setOffsetY(y)
    scene?.setContourOffsets(x, y)
  }

  const handleGlobalOffsetChange = (x: number, y: number) => {
    setGlobalOffsetX(x)
    setGlobalOffsetY(y)
    scene?.setContourGlobalOffsets(x, y)
  }

  if (!scene) return null

  return (
    <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
      <h3>Contour Alignment Controls</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Cell Offset X: {offsetX.toFixed(2)}
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={offsetX}
            onChange={(e) => handleOffsetChange(parseFloat(e.target.value), offsetY)}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Cell Offset Y: {offsetY.toFixed(2)}
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={offsetY}
            onChange={(e) => handleOffsetChange(offsetX, parseFloat(e.target.value))}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Global Offset X: {globalOffsetX.toFixed(1)}
          <input
            type="range"
            min="-5"
            max="5"
            step="0.5"
            value={globalOffsetX}
            onChange={(e) => handleGlobalOffsetChange(parseFloat(e.target.value), globalOffsetY)}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Global Offset Y: {globalOffsetY.toFixed(1)}
          <input
            type="range"
            min="-5"
            max="5"
            step="0.5"
            value={globalOffsetY}
            onChange={(e) => handleGlobalOffsetChange(globalOffsetX, parseFloat(e.target.value))}
            style={{ width: '200px', marginLeft: '10px' }}
          />
        </label>
      </div>
      
      <button
        onClick={() => {
          handleOffsetChange(0.5, 0.5)
          handleGlobalOffsetChange(0, 0)
        }}
        style={{ marginTop: '10px' }}
      >
        Reset to Defaults
      </button>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p><strong>Cell Offsets:</strong> Adjust contour position within grid cells (0.5 = centered)</p>
        <p><strong>Global Offsets:</strong> Shift entire contour in screen pixels</p>
      </div>
    </div>
  )
}