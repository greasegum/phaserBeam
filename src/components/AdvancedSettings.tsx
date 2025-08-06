import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { HelpTooltip } from './HelpTooltip'

interface AdvancedSettingsProps {
  scene?: BeamElevationScene
}

// Shared styles for consistency
const styles = {
  section: {
    marginBottom: '20px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  subsectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    marginTop: '16px',
    marginBottom: '8px',
    color: '#555'
  },
  control: {
    marginBottom: '12px'
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  select: {
    width: '100%',
    padding: '6px 10px',
    fontSize: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#666',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  button: {
    padding: '6px 12px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Core Algorithm Settings
  const [threshold, setThreshold] = useState(0.5)
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [saddlePointResolution, setSaddlePointResolution] = useState<'center' | 'gradient' | 'majority'>('center')
  
  // Scalar Field Settings
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'>('edge-clamping')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(1)
  const [edgeClampStrength, setEdgeClampStrength] = useState(0.95)
  
  // Grid Alignment & Edge Behavior
  const [alignmentMode, setAlignmentMode] = useState<'edges' | 'vertices' | 'center'>('edges')
  const [clampToGrid, setClampToGrid] = useState(true)
  const [extendToBoundary, setExtendToBoundary] = useState(false)
  const [snapDistance, setSnapDistance] = useState(0.1)
  
  // Edge Clamping
  const [edgeClamping, setEdgeClamping] = useState(true)
  const [edgeClampDistance, setEdgeClampDistance] = useState(0.8)
  const [cornerTreatment, setCornerTreatment] = useState<'trimmed' | 'flared' | 'square'>('flared')
  
  // Smoothing
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  
  // Selective Smoothing Options
  const [edgeBufferDistance, setEdgeBufferDistance] = useState(2.0)
  const [preserveEdgeSegments, setPreserveEdgeSegments] = useState(true)
  const [transitionBlending, setTransitionBlending] = useState(true)
  
  // Collision Avoidance
  const [collisionAvoidance, setCollisionAvoidance] = useState(false)
  const [collisionMinDistance, setCollisionMinDistance] = useState(0.5)
  const [collisionMethod, setCollisionMethod] = useState<'repulsion' | 'shrink' | 'hybrid'>('hybrid')
  const [collisionIterations, setCollisionIterations] = useState(10)
  
  // Global Offsets
  const [globalOffsetX, setGlobalOffsetX] = useState(0.0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0.0)
  
  // View Options
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  const [showBlurredField, setShowBlurredField] = useState(false)

  useEffect(() => {
    if (scene) {
      // Load current settings from scene
      setThreshold(scene.getThreshold?.() || 0.5)
      setSaddlePointResolution(scene.getSaddlePointResolution?.() || 'center')
      setAlignmentMode(scene.getAlignmentMode?.() || 'edges')
      
      const currentInterpolationMethod = scene.getInterpolationMethod?.() || 'linear'
      setInterpolationMethod(currentInterpolationMethod)
      
      setScalarFieldMethod(scene.getScalarFieldMethod?.() || 'edge-clamping')
      setScalarFieldRadius(scene.getScalarFieldRadius?.() || 1)
      setEdgeClampStrength(scene.getEdgeClampStrength?.() || 0.95)
      
      const smoothing = scene.getSmoothingOptions?.()
      if (smoothing) {
        setSmoothingMethod(smoothing.smoothingMethod || 'edge-aware')
        setSmoothingIterations(smoothing.smoothingIterations || 1)
        setSmoothingStrength(smoothing.smoothingStrength || 0.3)
      }
      
      setEdgeClamping(scene.getEdgeClamping?.() ?? true)
      setEdgeClampDistance(scene.getEdgeClampDistance?.() || 0.8)
      setCornerTreatment(scene.getCornerTreatment?.() || 'flared')
      setClampToGrid(scene.getClampToGrid?.() ?? true)
      setExtendToBoundary(scene.getExtendToBoundary?.() ?? false)
      setSnapDistance(scene.getSnapDistance?.() || 0.1)
      
      const offsets = scene.getContourOffsets?.()
      if (offsets) {
        setGlobalOffsetX(offsets.globalX)
        setGlobalOffsetY(offsets.globalY)
      }
      
      setShowRawMarchingSquares(scene.getShowRawMarchingSquares?.() || false)
      setShowControlPoints(scene.getShowControlPoints?.() || false)
      setShowBlurredField(scene.getShowBlurredField?.() || false)
      
      const collision = scene.getCollisionAvoidance?.()
      if (collision) {
        setCollisionAvoidance(collision.collisionAvoidance)
        setCollisionMinDistance(collision.collisionMinDistance)
        setCollisionMethod(collision.collisionMethod)
        setCollisionIterations(collision.collisionIterations)
      }
    }
  }, [scene])

  const resetToDefaults = () => {
    // Reset all settings to defaults
    setThreshold(0.5)
    setSaddlePointResolution('center')
    setAlignmentMode('edges')
    setInterpolationMethod('linear')
    setScalarFieldMethod('edge-clamping')
    setScalarFieldRadius(1)
    setEdgeClampStrength(0.95)
    setSmoothingMethod('edge-aware')
    setSmoothingIterations(1)
    setSmoothingStrength(0.3)
    setEdgeBufferDistance(2.0)
    setPreserveEdgeSegments(true)
    setTransitionBlending(true)
    setCollisionAvoidance(false)
    setCollisionMinDistance(0.5)
    setCollisionMethod('hybrid')
    setCollisionIterations(10)
    setEdgeClamping(true)
    setEdgeClampDistance(0.8)
    setCornerTreatment('flared')
    setClampToGrid(true)
    setExtendToBoundary(false)
    setSnapDistance(0.1)
    setGlobalOffsetX(0.0)
    setGlobalOffsetY(0.0)
    setShowRawMarchingSquares(false)
    setShowControlPoints(false)
    setShowBlurredField(false)
    
    // Apply to scene
    applyAllSettings()
  }
  
  const zeroOffsets = () => {
    setGlobalOffsetX(0.0)
    setGlobalOffsetY(0.0)
    scene?.setContourGlobalOffsets(0.0, 0.0)
  }

  const applyAllSettings = () => {
    if (!scene) return
    
    scene.setThreshold?.(threshold)
    scene.setSaddlePointResolution?.(saddlePointResolution)
    scene.setAlignmentMode?.(alignmentMode)
    scene.setInterpolationMethod?.(interpolationMethod)
    scene.setScalarFieldMethod?.(scalarFieldMethod)
    scene.setScalarFieldRadius?.(scalarFieldRadius)
    scene.setEdgeClampStrength?.(edgeClampStrength)
    scene.setSmoothingOptions(smoothingMethod, smoothingIterations, smoothingStrength)
    scene.setCollisionAvoidance(collisionAvoidance, collisionMinDistance, collisionMethod, collisionIterations)
    scene.setEdgeClamping?.(edgeClamping)
    scene.setEdgeClampDistance?.(edgeClampDistance)
    scene.setCornerTreatment?.(cornerTreatment)
    scene.setClampToGrid?.(clampToGrid)
    scene.setExtendToBoundary?.(extendToBoundary)
    scene.setSnapDistance?.(snapDistance)
    scene.setContourGlobalOffsets(globalOffsetX, globalOffsetY)
    scene.setShowRawMarchingSquares?.(showRawMarchingSquares)
    scene.setShowControlPoints?.(showControlPoints)
    scene.setShowBlurredField?.(showBlurredField)
  }

  const renderSlider = (
    label: string, 
    value: number, 
    onChange: (value: number) => void,
    min: number,
    max: number,
    step: number,
    disabled?: boolean,
    tooltip?: string
  ) => (
    <div style={{ ...styles.control, opacity: disabled ? 0.5 : 1 }}>
      <label style={styles.label}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {label}
          {tooltip && <HelpTooltip text={tooltip} />}
        </span>
        <span style={{ fontWeight: 'bold', color: disabled ? '#999' : '#333' }}>
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ 
          width: '100%', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
      />
    </div>
  )

  if (!scene) return null

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.button,
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: '#333',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ 
          transform: `rotate(${isOpen ? 180 : 0}deg)`,
          transition: 'transform 0.3s ease',
          display: 'inline-block',
          marginRight: '6px'
        }}>⚙️</span>
        Advanced
      </button>

      {/* Settings Panel */}
      <div 
        style={{
          position: 'absolute',
          bottom: '50px',
          right: 0,
          width: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '20px',
          transform: `translateY(${isOpen ? 0 : 'calc(100% + 60px)'})`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Marching Squares Settings
          </h3>
          <button
            onClick={resetToDefaults}
            style={{
              ...styles.button,
              backgroundColor: '#f44336',
              color: 'white'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f44336'}
          >
            Reset All
          </button>
        </div>

        {/* 1. Core Algorithm */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#2196F3' }}>◆</span>
            Core Algorithm
          </h4>
          
          {renderSlider('Threshold', threshold, (v) => {
            setThreshold(v)
            scene.setThreshold?.(v)
          }, 0, 1, 0.05, false, 'The value that determines the contour boundary')}
          
          <div style={styles.control}>
            <label style={{ ...styles.label, marginBottom: '6px' }}>
              Interpolation Method
              <HelpTooltip text="How contour points are positioned along edges" />
            </label>
            <select
              value={interpolationMethod}
              onChange={(e) => {
                const method = e.target.value as typeof interpolationMethod
                setInterpolationMethod(method)
                scene.setInterpolationMethod?.(method)
              }}
              style={styles.select}
            >
              <option value="none">None (Pixelated)</option>
              <option value="linear">Linear</option>
              <option value="cubic">Cubic</option>
            </select>
          </div>
          
          <div style={styles.control}>
            <label style={{ ...styles.label, marginBottom: '6px' }}>
              Saddle Point Resolution
              <HelpTooltip text="How ambiguous cases are resolved" />
            </label>
            <select
              value={saddlePointResolution}
              onChange={(e) => {
                const resolution = e.target.value as typeof saddlePointResolution
                setSaddlePointResolution(resolution)
                scene.setSaddlePointResolution?.(resolution)
              }}
              style={styles.select}
            >
              <option value="center">Center</option>
              <option value="gradient">Gradient</option>
              <option value="majority">Majority</option>
            </select>
          </div>
        </div>

        {/* 2. Scalar Field */}
        {interpolationMethod !== 'none' && (
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <span style={{ color: '#FF9800' }}>◆</span>
              Scalar Field
            </h4>
            
            <div style={styles.control}>
              <label style={{ ...styles.label, marginBottom: '6px' }}>
                Method
                <HelpTooltip text="Converts binary grid to continuous gradients" />
              </label>
              <select
                value={scalarFieldMethod}
                onChange={(e) => {
                  const method = e.target.value as typeof scalarFieldMethod
                  setScalarFieldMethod(method)
                  scene.setScalarFieldMethod?.(method)
                }}
                style={styles.select}
              >
                <option value="none">None</option>
                <option value="edge-clamping">Edge Clamping</option>
                <option value="adaptive-edge-preserving">Adaptive Edge</option>
                <option value="edge-preserving">Edge Preserving</option>
                <option value="gaussian">Gaussian</option>
                <option value="distance">Distance Field</option>
                <option value="box">Box Blur</option>
              </select>
            </div>
            
            {scalarFieldMethod !== 'none' && (
              <>
                {renderSlider('Field Radius', scalarFieldRadius, (v) => {
                  setScalarFieldRadius(v)
                  scene.setScalarFieldRadius?.(v)
                }, 0.5, 3, 0.1, false, 'Size of the blur kernel in grid cells')}
                
                {scalarFieldMethod === 'edge-clamping' && (
                  renderSlider('Edge Clamp Strength', edgeClampStrength, (v) => {
                    setEdgeClampStrength(v)
                    scene.setEdgeClampStrength?.(v)
                  }, 0, 1, 0.05, false, 'How strongly edges are preserved')
                )}
              </>
            )}
          </div>
        )}

        {/* 3. Grid & Edge Behavior */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#4CAF50' }}>◆</span>
            Grid & Edge Behavior
          </h4>
          
          <div style={styles.control}>
            <label style={{ ...styles.label, marginBottom: '6px' }}>
              Grid Alignment
              <HelpTooltip text="How contours align to the grid" />
            </label>
            <select
              value={alignmentMode}
              onChange={(e) => {
                const mode = e.target.value as typeof alignmentMode
                setAlignmentMode(mode)
                scene.setAlignmentMode?.(mode)
              }}
              style={styles.select}
            >
              <option value="vertices">Vertices</option>
              <option value="edges">Edges</option>
              <option value="center">Center</option>
            </select>
          </div>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={clampToGrid}
              onChange={(e) => {
                setClampToGrid(e.target.checked)
                scene.setClampToGrid?.(e.target.checked)
              }}
            />
            Clamp to Grid
          </label>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={extendToBoundary}
              onChange={(e) => {
                setExtendToBoundary(e.target.checked)
                scene.setExtendToBoundary?.(e.target.checked)
              }}
            />
            Extend to Boundary
          </label>
          
          {renderSlider('Snap Distance', snapDistance, (v) => {
            setSnapDistance(v)
            scene.setSnapDistance?.(v)
          }, 0, 0.5, 0.05)}
          
          <h5 style={styles.subsectionTitle}>Edge Clamping</h5>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={edgeClamping}
              onChange={(e) => {
                setEdgeClamping(e.target.checked)
                scene.setEdgeClamping?.(e.target.checked)
              }}
            />
            Enable Edge Clamping
          </label>
          
          {edgeClamping && (
            <>
              {renderSlider('Edge Distance', edgeClampDistance, (v) => {
                setEdgeClampDistance(v)
                scene.setEdgeClampDistance?.(v)
              }, 0.1, 2.0, 0.1)}
              
              <div style={styles.control}>
                <label style={{ ...styles.label, marginBottom: '6px' }}>
                  Corner Treatment
                </label>
                <select
                  value={cornerTreatment}
                  onChange={(e) => {
                    const treatment = e.target.value as typeof cornerTreatment
                    setCornerTreatment(treatment)
                    scene.setCornerTreatment?.(treatment)
                  }}
                  style={styles.select}
                >
                  <option value="trimmed">Trimmed</option>
                  <option value="flared">Flared</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* 4. Smoothing */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#9C27B0' }}>◆</span>
            Smoothing
          </h4>
          
          <div style={styles.control}>
            <label style={{ ...styles.label, marginBottom: '6px' }}>
              Method
              <HelpTooltip text="Algorithm used to smooth contours" />
            </label>
            <select
              value={smoothingMethod}
              onChange={(e) => {
                const method = e.target.value as typeof smoothingMethod
                setSmoothingMethod(method)
                scene.setSmoothingOptions(method, smoothingIterations, smoothingStrength)
              }}
              style={styles.select}
            >
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
          
          {renderSlider('Iterations', smoothingIterations, (v) => {
            setSmoothingIterations(v)
            scene.setSmoothingOptions(smoothingMethod, v, smoothingStrength)
          }, 0, 5, 1)}
          
          {renderSlider('Strength', smoothingStrength, (v) => {
            setSmoothingStrength(v)
            scene.setSmoothingOptions(smoothingMethod, smoothingIterations, v)
          }, 0, 1, 0.05)}
          
          {smoothingMethod === 'selective' && (
            <>
              <h5 style={styles.subsectionTitle}>Selective Options</h5>
              
              {renderSlider('Edge Buffer', edgeBufferDistance, (v) => {
                setEdgeBufferDistance(v)
                // scene.setEdgeBufferDistance?.(v)
              }, 0, 5, 0.5)}
              
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={preserveEdgeSegments}
                  onChange={(e) => {
                    setPreserveEdgeSegments(e.target.checked)
                    // scene.setPreserveEdgeSegments?.(e.target.checked)
                  }}
                />
                Preserve Edge Segments
              </label>
              
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={transitionBlending}
                  onChange={(e) => {
                    setTransitionBlending(e.target.checked)
                    // scene.setTransitionBlending?.(e.target.checked)
                  }}
                />
                Transition Blending
              </label>
            </>
          )}
        </div>

        {/* 5. Post-Processing */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#E91E63' }}>◆</span>
            Post-Processing
          </h4>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={collisionAvoidance}
              onChange={(e) => {
                setCollisionAvoidance(e.target.checked)
                scene.setCollisionAvoidance(e.target.checked, collisionMinDistance, collisionMethod, collisionIterations)
              }}
            />
            Collision Avoidance
          </label>
          
          {collisionAvoidance && (
            <>
              {renderSlider('Min Distance', collisionMinDistance, (v) => {
                setCollisionMinDistance(v)
                scene.setCollisionAvoidance(true, v, collisionMethod, collisionIterations)
              }, 0.1, 2, 0.1)}
              
              <div style={styles.control}>
                <label style={{ ...styles.label, marginBottom: '6px' }}>
                  Method
                </label>
                <select
                  value={collisionMethod}
                  onChange={(e) => {
                    const method = e.target.value as typeof collisionMethod
                    setCollisionMethod(method)
                    scene.setCollisionAvoidance(true, collisionMinDistance, method, collisionIterations)
                  }}
                  style={styles.select}
                >
                  <option value="repulsion">Repulsion</option>
                  <option value="shrink">Shrink</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              {renderSlider('Iterations', collisionIterations, (v) => {
                setCollisionIterations(v)
                scene.setCollisionAvoidance(true, collisionMinDistance, collisionMethod, v)
              }, 1, 20, 1)}
            </>
          )}
        </div>

        {/* 6. Global Offsets */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#607D8B' }}>◆</span>
            Global Offsets
            <button
              onClick={zeroOffsets}
              style={{
                ...styles.button,
                marginLeft: 'auto',
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: '#607D8B',
                color: 'white'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#455A64'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#607D8B'}
            >
              Zero
            </button>
          </h4>
          
          {renderSlider('X Offset', globalOffsetX, (v) => {
            setGlobalOffsetX(v)
            scene.setContourGlobalOffsets(v, globalOffsetY)
          }, -0.5, 0.5, 0.05)}
          
          {renderSlider('Y Offset', globalOffsetY, (v) => {
            setGlobalOffsetY(v)
            scene.setContourGlobalOffsets(globalOffsetX, v)
          }, -0.5, 0.5, 0.05)}
        </div>

        {/* 7. Debug View */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>
            <span style={{ color: '#795548' }}>◆</span>
            Debug View
          </h4>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showRawMarchingSquares}
              onChange={(e) => {
                setShowRawMarchingSquares(e.target.checked)
                scene.setShowRawMarchingSquares?.(e.target.checked)
              }}
            />
            Show Raw Marching Squares
          </label>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showControlPoints}
              onChange={(e) => {
                setShowControlPoints(e.target.checked)
                scene.setShowControlPoints?.(e.target.checked)
              }}
            />
            Show Control Points
          </label>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showBlurredField}
              onChange={(e) => {
                setShowBlurredField(e.target.checked)
                scene.setShowBlurredField?.(e.target.checked)
              }}
            />
            Show Blurred Field
          </label>
        </div>
      </div>
    </div>
  )
}