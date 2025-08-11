import React from 'react'
import { HelpTooltip } from '../HelpTooltip'

interface AlgorithmConfigPanelProps {
  scalarFieldMethod: string
  scalarFieldRadius: number
  edgeClampStrength: number
  smoothingMethod: string
  smoothingIterations: number
  smoothingStrength: number
  edgeBufferDistance: number
  preserveEdgeSegments: boolean
  transitionBlending: boolean
  curvatureThreshold: number
  preserveStraightSegments: boolean
  collisionAvoidance: boolean
  collisionMinDistance: number
  collisionMethod: 'repulsion' | 'shrink' | 'hybrid'
  collisionIterations: number
  onScalarFieldMethodChange: (value: string) => void
  onScalarFieldRadiusChange: (value: number) => void
  onEdgeClampStrengthChange: (value: number) => void
  onSmoothingMethodChange: (value: string) => void
  onSmoothingIterationsChange: (value: number) => void
  onSmoothingStrengthChange: (value: number) => void
  onEdgeBufferDistanceChange: (value: number) => void
  onPreserveEdgeSegmentsChange: (value: boolean) => void
  onTransitionBlendingChange: (value: boolean) => void
  onCurvatureThresholdChange: (value: number) => void
  onPreserveStraightSegmentsChange: (value: boolean) => void
  onCollisionAvoidanceChange: (value: boolean) => void
  onCollisionMinDistanceChange: (value: number) => void
  onCollisionMethodChange: (value: 'repulsion' | 'shrink' | 'hybrid') => void
  onCollisionIterationsChange: (value: number) => void
}

export const AlgorithmConfigPanel: React.FC<AlgorithmConfigPanelProps> = (props) => {
  const {
    scalarFieldMethod,
    scalarFieldRadius,
    edgeClampStrength,
    smoothingMethod,
    smoothingIterations,
    smoothingStrength,
    edgeBufferDistance,
    preserveEdgeSegments,
    transitionBlending,
    curvatureThreshold,
    preserveStraightSegments,
    collisionAvoidance,
    collisionMinDistance,
    collisionMethod,
    collisionIterations,
    onScalarFieldMethodChange,
    onScalarFieldRadiusChange,
    onEdgeClampStrengthChange,
    onSmoothingMethodChange,
    onSmoothingIterationsChange,
    onSmoothingStrengthChange,
    onEdgeBufferDistanceChange,
    onPreserveEdgeSegmentsChange,
    onTransitionBlendingChange,
    onCurvatureThresholdChange,
    onPreserveStraightSegmentsChange,
    onCollisionAvoidanceChange,
    onCollisionMinDistanceChange,
    onCollisionMethodChange,
    onCollisionIterationsChange
  } = props

  return (
    <div>
      <h4 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        fontWeight: 600,
        color: '#FF6600',
        borderBottom: '2px solid #FF6600',
        paddingBottom: '4px'
      }}>
        Processing Algorithms
      </h4>
      
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
        Configure processing and smoothing algorithms
      </p>

      {/* Scalar Field Settings */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Scalar Field Generation
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Scalar Field Method
              <HelpTooltip text="Algorithm for generating the scalar field from grid data." />
            </span>
          </label>
          <select
            value={scalarFieldMethod}
            onChange={(e) => onScalarFieldMethodChange(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '11px',
              borderRadius: '3px',
              border: '1px solid #ddd'
            }}
          >
            <option value="none">None (Binary)</option>
            <option value="gaussian">Gaussian Blur</option>
            <option value="edge-clamping">Edge Clamping</option>
            <option value="edge-preserving">Edge Preserving</option>
            <option value="bilateral">Bilateral Filter</option>
          </select>
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
              Field Radius
              <HelpTooltip text="Radius for scalar field generation." />
            </span>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{scalarFieldRadius}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={scalarFieldRadius}
            onChange={(e) => onScalarFieldRadiusChange(parseInt(e.target.value))}
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
              Edge Clamp Strength
              <HelpTooltip text="Strength of edge clamping effect." />
            </span>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{edgeClampStrength.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={edgeClampStrength}
            onChange={(e) => onEdgeClampStrengthChange(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>
      </div>

      {/* Smoothing Settings */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Contour Smoothing
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#666',
            marginBottom: '4px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Smoothing Method
              <HelpTooltip text="Algorithm for smoothing contours." />
            </span>
          </label>
          <select
            value={smoothingMethod}
            onChange={(e) => onSmoothingMethodChange(e.target.value)}
            style={{
              width: '100%',
              padding: '4px',
              fontSize: '11px',
              borderRadius: '3px',
              border: '1px solid #ddd'
            }}
          >
            <option value="none">None</option>
            <option value="basic">Basic</option>
            <option value="laplacian">Laplacian</option>
            <option value="chaikin">Chaikin</option>
            <option value="bilateral">Bilateral</option>
            <option value="catmull-rom">Catmull-Rom</option>
            <option value="edge-aware">Edge Aware</option>
            <option value="intelligent">Intelligent</option>
            <option value="selective">Selective</option>
          </select>
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
              Smoothing Iterations
              <HelpTooltip text="Number of smoothing passes." />
            </span>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingIterations}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={smoothingIterations}
            onChange={(e) => onSmoothingIterationsChange(parseInt(e.target.value))}
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
              Smoothing Strength
              <HelpTooltip text="Intensity of smoothing effect." />
            </span>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingStrength.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={smoothingStrength}
            onChange={(e) => onSmoothingStrengthChange(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>
      </div>

      {/* Edge Preservation */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Edge Preservation
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
              checked={preserveEdgeSegments}
              onChange={(e) => onPreserveEdgeSegmentsChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Preserve Edge Segments
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
              checked={preserveStraightSegments}
              onChange={(e) => onPreserveStraightSegmentsChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Preserve Straight Segments
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
              checked={transitionBlending}
              onChange={(e) => onTransitionBlendingChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Transition Blending
          </label>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>Edge Buffer Distance</span>
            <span style={{ fontWeight: 'bold', color: '#333' }}>{edgeBufferDistance.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={edgeBufferDistance}
            onChange={(e) => onEdgeBufferDistanceChange(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '4px' }}
          />
        </div>
      </div>

      {/* Collision Avoidance */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
          Collision Avoidance
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
              checked={collisionAvoidance}
              onChange={(e) => onCollisionAvoidanceChange(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Enable Collision Avoidance
              <HelpTooltip text="Prevent contours from overlapping." />
            </span>
          </label>
        </div>

        <div style={{ opacity: collisionAvoidance ? 1 : 0.5 }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#666'
            }}>
              <span>Min Distance</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{collisionMinDistance.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={collisionMinDistance}
              onChange={(e) => onCollisionMinDistanceChange(parseFloat(e.target.value))}
              disabled={!collisionAvoidance}
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
              Collision Method
            </label>
            <select
              value={collisionMethod}
              onChange={(e) => onCollisionMethodChange(e.target.value as any)}
              disabled={!collisionAvoidance}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '11px',
                borderRadius: '3px',
                border: '1px solid #ddd'
              }}
            >
              <option value="repulsion">Repulsion</option>
              <option value="shrink">Shrink</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#666'
            }}>
              <span>Iterations</span>
              <span style={{ fontWeight: 'bold', color: '#333' }}>{collisionIterations}</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={collisionIterations}
              onChange={(e) => onCollisionIterationsChange(parseInt(e.target.value))}
              disabled={!collisionAvoidance}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}