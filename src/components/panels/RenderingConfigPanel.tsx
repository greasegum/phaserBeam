import React from 'react'
import { HelpTooltip } from '../HelpTooltip'

interface RenderingConfigPanelProps {
  showRawMarchingSquares: boolean
  showControlPoints: boolean
  showBlurredField: boolean
  interpolationEnabled: boolean
  interpolationMethod: 'linear' | 'cubic' | 'none'
  edgeClamping: boolean
  edgeClampDistance: number
  cornerTreatment: 'trimmed' | 'flared' | 'square'
  onShowRawMarchingSquaresChange: (value: boolean) => void
  onShowControlPointsChange: (value: boolean) => void
  onShowBlurredFieldChange: (value: boolean) => void
  onInterpolationEnabledChange: (value: boolean) => void
  onInterpolationMethodChange: (value: 'linear' | 'cubic' | 'none') => void
  onEdgeClampingChange: (value: boolean) => void
  onEdgeClampDistanceChange: (value: number) => void
  onCornerTreatmentChange: (value: 'trimmed' | 'flared' | 'square') => void
}

export const RenderingConfigPanel: React.FC<RenderingConfigPanelProps> = ({
  showRawMarchingSquares,
  showControlPoints,
  showBlurredField,
  interpolationEnabled,
  interpolationMethod,
  edgeClamping,
  edgeClampDistance,
  cornerTreatment,
  onShowRawMarchingSquaresChange,
  onShowControlPointsChange,
  onShowBlurredFieldChange,
  onInterpolationEnabledChange,
  onInterpolationMethodChange,
  onEdgeClampingChange,
  onEdgeClampDistanceChange,
  onCornerTreatmentChange
}) => {
  return (
    <div>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        fontWeight: 600,
        color: '#00AA00',
        borderBottom: '2px solid #00AA00',
        paddingBottom: '4px'
      }}>
        Rendering & Visualization
      </h4>
      
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Configure rendering options and visual display
      </p>

      {/* Visualization Options */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Visualization Layers
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showRawMarchingSquares}
              onChange={(e) => onShowRawMarchingSquaresChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Show Raw Marching Squares
              <HelpTooltip text="Display unsmoothed marching squares contours." />
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showControlPoints}
              onChange={(e) => onShowControlPointsChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Show Control Points
              <HelpTooltip text="Display control points used for contour generation." />
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showBlurredField}
              onChange={(e) => onShowBlurredFieldChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Show Blurred Field
              <HelpTooltip text="Display the scalar field visualization." />
            </span>
          </label>
        </div>
      </div>

      {/* Interpolation Settings */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Interpolation
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={interpolationEnabled}
              onChange={(e) => onInterpolationEnabledChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Enable Interpolation
              <HelpTooltip text="Use interpolation for smoother contours." />
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '12px', opacity: interpolationEnabled ? 1 : 0.5 }}>
          <label style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px'
          }}>
            Interpolation Method
          </label>
          <select
            value={interpolationMethod}
            onChange={(e) => onInterpolationMethodChange(e.target.value as any)}
            disabled={!interpolationEnabled}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '11px',
              borderRadius: '3px',
              border: '1px solid #ddd'
            }}
          >
            <option value="none">None</option>
            <option value="linear">Linear</option>
            <option value="cubic">Cubic</option>
          </select>
        </div>
      </div>

      {/* Edge Clamping */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Edge Processing
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={edgeClamping}
              onChange={(e) => onEdgeClampingChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Edge Clamping
              <HelpTooltip text="Clamp contours to edges for cleaner boundaries." />
            </span>
          </label>
        </div>

        <div style={{ marginBottom: '12px', opacity: edgeClamping ? 1 : 0.5 }}>
          <label style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Edge Clamp Distance
              <HelpTooltip text="Distance from edge to apply clamping." />
            </span>
            <span style={{ fontWeight: 'bold', color: edgeClamping ? '#333' : '#999' }}>
              {edgeClampDistance.toFixed(2)}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={edgeClampDistance}
            onChange={(e) => onEdgeClampDistanceChange(parseFloat(e.target.value))}
            disabled={!edgeClamping}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Corner Treatment
              <HelpTooltip text="How to handle corners in contours." />
            </span>
          </label>
          <select
            value={cornerTreatment}
            onChange={(e) => onCornerTreatmentChange(e.target.value as any)}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '11px',
              borderRadius: '3px',
              border: '1px solid #ddd'
            }}
          >
            <option value="trimmed">Trimmed</option>
            <option value="flared">Flared</option>
            <option value="square">Square</option>
          </select>
        </div>
      </div>
    </div>
  )
}