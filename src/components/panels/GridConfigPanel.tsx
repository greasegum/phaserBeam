import React from 'react'
import { HelpTooltip } from '../HelpTooltip'

interface GridConfigPanelProps {
  threshold: number
  saddlePointResolution: 'center' | 'gradient' | 'majority'
  alignmentMode: 'edges' | 'vertices' | 'center'
  clampToGrid: boolean
  extendToBoundary: boolean
  snapDistance: number
  globalOffsetX: number
  globalOffsetY: number
  onThresholdChange: (value: number) => void
  onSaddlePointResolutionChange: (value: 'center' | 'gradient' | 'majority') => void
  onAlignmentModeChange: (value: 'edges' | 'vertices' | 'center') => void
  onClampToGridChange: (value: boolean) => void
  onExtendToBoundaryChange: (value: boolean) => void
  onSnapDistanceChange: (value: number) => void
  onGlobalOffsetXChange: (value: number) => void
  onGlobalOffsetYChange: (value: number) => void
}

export const GridConfigPanel: React.FC<GridConfigPanelProps> = ({
  threshold,
  saddlePointResolution,
  alignmentMode,
  clampToGrid,
  extendToBoundary,
  snapDistance,
  globalOffsetX,
  globalOffsetY,
  onThresholdChange,
  onSaddlePointResolutionChange,
  onAlignmentModeChange,
  onClampToGridChange,
  onExtendToBoundaryChange,
  onSnapDistanceChange,
  onGlobalOffsetXChange,
  onGlobalOffsetYChange
}) => {
  return (
    <div>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        fontWeight: 600,
        color: '#0000FF',
        borderBottom: '2px solid #0000FF',
        paddingBottom: '4px'
      }}>
        Grid & Marching Squares Configuration
      </h4>
      
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Configure grid generation and marching squares algorithm
      </p>

      {/* Threshold */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Threshold
            <HelpTooltip text="The value that determines the contour boundary." />
          </span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.1"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      {/* Saddle Point Resolution */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '12px',
          color: '#666',
          marginBottom: '4px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Saddle Point Resolution
            <HelpTooltip text="How to resolve ambiguous cases in marching squares." />
          </span>
        </label>
        <select
          value={saddlePointResolution}
          onChange={(e) => onSaddlePointResolutionChange(e.target.value as any)}
          style={{
            width: '100%',
            padding: '4px',
            fontSize: '11px',
            borderRadius: '3px',
            border: '1px solid #ddd'
          }}
        >
          <option value="center">Center (Average)</option>
          <option value="gradient">Gradient-based</option>
          <option value="majority">Majority Vote</option>
        </select>
      </div>

      {/* Alignment Mode */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'block',
          fontSize: '12px',
          color: '#666',
          marginBottom: '4px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Alignment Mode
            <HelpTooltip text="How contours align with grid cells." />
          </span>
        </label>
        <select
          value={alignmentMode}
          onChange={(e) => onAlignmentModeChange(e.target.value as any)}
          style={{
            width: '100%',
            padding: '4px',
            fontSize: '11px',
            borderRadius: '3px',
            border: '1px solid #ddd'
          }}
        >
          <option value="edges">Edges (Smooth)</option>
          <option value="vertices">Vertices (Sharp)</option>
          <option value="center">Center</option>
        </select>
      </div>

      {/* Grid Options */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={clampToGrid}
            onChange={(e) => onClampToGridChange(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Clamp to Grid
            <HelpTooltip text="Force contour points to align with grid lines." />
          </span>
        </label>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={extendToBoundary}
            onChange={(e) => onExtendToBoundaryChange(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Extend to Boundary
            <HelpTooltip text="Extend contours to grid boundaries." />
          </span>
        </label>
      </div>

      {/* Snap Distance */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Snap Distance
            <HelpTooltip text="Distance threshold for snapping points together." />
          </span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{snapDistance.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={snapDistance}
          onChange={(e) => onSnapDistanceChange(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      {/* Global Offsets */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Global Offset X
            <HelpTooltip text="Horizontal offset for all contours." />
          </span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetX.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={globalOffsetX}
          onChange={(e) => onGlobalOffsetXChange(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            Global Offset Y
            <HelpTooltip text="Vertical offset for all contours." />
          </span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetY.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={globalOffsetY}
          onChange={(e) => onGlobalOffsetYChange(parseFloat(e.target.value))}
          style={{ width: '100%', marginTop: '4px' }}
        />
      </div>
    </div>
  )
}