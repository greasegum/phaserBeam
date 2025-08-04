import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { HelpTooltip } from './HelpTooltip'

interface AdvancedSettingsProps {
  scene?: BeamElevationScene
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  // Marching Squares Algorithm
  const [interpolationEnabled, setInterpolationEnabled] = useState(true)
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [saddlePointResolution, setSaddlePointResolution] = useState<'center' | 'gradient' | 'majority'>('center')
  const [threshold, setThreshold] = useState(0.5)
  // Geometry
  const [alignmentMode, setAlignmentMode] = useState<'edges' | 'vertices' | 'center'>('edges')
  const [globalOffsetX, setGlobalOffsetX] = useState(0.0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0.0)
  // Buffer size permanently set to 1 (minimum required for marching squares)
  // Buffer value removed - using edge-aware blurring instead
  const [clampToGrid, setClampToGrid] = useState(true)
  const [extendToBoundary, setExtendToBoundary] = useState(false)
  const [snapDistance, setSnapDistance] = useState(0.1)
  // View Mode
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  const [showBlurredField, setShowBlurredField] = useState(false)
  // Processing
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  const [collisionAvoidance, setCollisionAvoidance] = useState(false)
  const [collisionMinDistance, setCollisionMinDistance] = useState(0.5)
  const [collisionMethod, setCollisionMethod] = useState<'push' | 'shrink' | 'hybrid'>('hybrid')
  const [collisionIterations, setCollisionIterations] = useState(10)
  // Scalar Field settings
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'>('edge-clamping')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(1)
  const [edgeClampStrength, setEdgeClampStrength] = useState(0.95)
  // Advanced scalar field parameters
  const [anisotropicDiffusion, setAnisotropicDiffusion] = useState(false)
  const [diffusionIterations, setDiffusionIterations] = useState(3)
  const [diffusionKappa, setDiffusionKappa] = useState(0.15)
  const [multiScaleBlending, setMultiScaleBlending] = useState(false)
  const [morphologicalProcessing, setMorphologicalProcessing] = useState<'none' | 'open' | 'close'>('none')
  // Edge clamping settings
  const [edgeClamping, setEdgeClamping] = useState(true)  // Enable by default
  const [edgeClampDistance, setEdgeClampDistance] = useState(0.8)  // Slightly larger for more aggressive clamping
  const [cornerTreatment, setCornerTreatment] = useState<'trimmed' | 'flared' | 'square'>('flared')

  useEffect(() => {
    if (scene) {
      // Algorithm settings
      const currentInterpolationMethod = scene.getInterpolationMethod?.() || 'linear'
      setInterpolationMethod(currentInterpolationMethod)
      setInterpolationEnabled(currentInterpolationMethod !== 'none')
      setSaddlePointResolution(scene.getSaddlePointResolution?.() || 'center')
      setThreshold(scene.getThreshold?.() || 0.5)
      setAlignmentMode(scene.getAlignmentMode?.() || 'edges')
      setClampToGrid(scene.getClampToGrid?.() ?? true)
      setExtendToBoundary(scene.getExtendToBoundary?.() ?? false)
      setSnapDistance(scene.getSnapDistance?.() || 0.1)
      
      // View settings
      setShowRawMarchingSquares(scene.getShowRawMarchingSquares?.() || false)
      setShowControlPoints(scene.getShowControlPoints?.() || false)
      setShowBlurredField(scene.getShowBlurredField?.() || false)
      
      // Get offsets
      const offsets = scene.getContourOffsets?.()
      if (offsets) {
        setGlobalOffsetX(offsets.globalX)
        setGlobalOffsetY(offsets.globalY)
      }
      
      // Buffer size is now permanently 1 (no UI control needed)
      
      // Get smoothing
      const smoothing = scene.getSmoothingOptions?.()
      if (smoothing) {
        setSmoothingMethod(smoothing.smoothingMethod || 'basic')
        setSmoothingIterations(smoothing.smoothingIterations || 2)
        setSmoothingStrength(smoothing.smoothingStrength || 0.5)
      }
      
      // Get collision
      const collision = scene.getCollisionAvoidance?.()
      if (collision) {
        setCollisionAvoidance(collision.collisionAvoidance)
        setCollisionMinDistance(collision.collisionMinDistance)
        setCollisionMethod(collision.collisionMethod)
        setCollisionIterations(collision.collisionIterations)
      }
      
      // Get scalar field settings
      setScalarFieldMethod(scene.getScalarFieldMethod?.() || 'gaussian')
      setScalarFieldRadius(scene.getScalarFieldRadius?.() || 2)
      
      // Get edge clamping settings
      setEdgeClamping(scene.getEdgeClamping?.() ?? true)  // Default to true
      setEdgeClampDistance(scene.getEdgeClampDistance?.() || 0.8)
      setCornerTreatment(scene.getCornerTreatment?.() || 'flared')
    }
  }, [scene])

  const handleGlobalOffsetChange = (axis: 'x' | 'y', value: number) => {
    if (!scene) return
    
    if (axis === 'x') {
      setGlobalOffsetX(value)
      scene.setContourGlobalOffsets(value, globalOffsetY)
    } else {
      setGlobalOffsetY(value)
      scene.setContourGlobalOffsets(globalOffsetX, value)
    }
  }

  // Buffer size is now permanently 1 - no UI control needed

  const handleSmoothingChange = (method: typeof smoothingMethod, iterations: number, strength: number) => {
    if (!scene) return
    setSmoothingMethod(method)
    setSmoothingIterations(iterations)
    setSmoothingStrength(strength)
    scene.setSmoothingOptions(method, iterations, strength)
  }

  const handleCollisionChange = (enabled: boolean, minDistance: number, method: typeof collisionMethod, iterations: number) => {
    if (!scene) return
    setCollisionAvoidance(enabled)
    setCollisionMinDistance(minDistance)
    setCollisionMethod(method)
    setCollisionIterations(iterations)
    scene.setCollisionAvoidance(enabled, minDistance, method, iterations)
  }

  const handleInterpolationEnabledChange = (enabled: boolean) => {
    if (!scene) return
    setInterpolationEnabled(enabled)
    
    if (enabled) {
      // Re-enable interpolation with previous method, defaulting to linear
      const method = interpolationMethod === 'none' ? 'linear' : interpolationMethod
      setInterpolationMethod(method)
      scene.setInterpolationMethod(method)
      
      // Re-enable scalar field with previous method, defaulting to gaussian
      const scalarMethod = scalarFieldMethod === 'none' ? 'gaussian' : scalarFieldMethod
      setScalarFieldMethod(scalarMethod)
      scene.setScalarFieldMethod(scalarMethod)
    } else {
      // Disable interpolation
      setInterpolationMethod('none')
      scene.setInterpolationMethod('none')
      
      // Disable scalar field
      setScalarFieldMethod('none')
      scene.setScalarFieldMethod('none')
    }
  }


  const resetToDefaults = () => {
    // Algorithm (Classic settings)
    setInterpolationEnabled(true)
    setInterpolationMethod('linear')
    setSaddlePointResolution('center')
    setThreshold(0.5)
    scene?.setInterpolationMethod?.('linear')
    scene?.setSaddlePointResolution?.('center')
    scene?.setThreshold?.(0.5)
    // Geometry
    setAlignmentMode('edges')
    setGlobalOffsetX(0.0) // 0 = centered alignment
    setGlobalOffsetY(0.0) // 0 = centered alignment
    // Buffer size permanently set to 1
    setClampToGrid(true)
    setExtendToBoundary(false)
    setSnapDistance(0.1)
    scene?.setAlignmentMode?.('edges')
    scene?.setContourGlobalOffsets(0.0, 0.0)
    scene?.setContourBuffer(1, 0) // Always use 0 for buffer value
    scene?.setClampToGrid?.(true)
    scene?.setExtendToBoundary?.(false)
    scene?.setSnapDistance?.(0.1)
    // View
    setShowRawMarchingSquares(false)
    setShowControlPoints(false)
    scene?.setShowRawMarchingSquares?.(false)
    scene?.setShowControlPoints?.(false)
    // Processing (Classic settings)
    setSmoothingMethod('edge-aware')
    setSmoothingIterations(1)
    setSmoothingStrength(0.3)
    scene?.setSmoothingOptions('edge-aware', 1, 0.3)
    setCollisionAvoidance(false)
    setCollisionMinDistance(0.5)
    setCollisionMethod('hybrid')
    setCollisionIterations(10)
    scene?.setCollisionAvoidance(false, 0.5, 'hybrid', 10)
    // Scalar Field
    setScalarFieldMethod('edge-clamping')
    setScalarFieldRadius(1)
    scene?.setScalarFieldMethod?.('edge-clamping')
    scene?.setScalarFieldRadius?.(1)
    // Edge Clamping
    setEdgeClamping(true)  // Enable by default for proper web visualization
    setEdgeClampDistance(0.8)
    setCornerTreatment('flared')
    scene?.setEdgeClamping?.(true)
    scene?.setEdgeClampDistance?.(0.8)
    scene?.setCornerTreatment?.('flared')
  }

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
          position: 'absolute',
          bottom: 0,
          right: 0,
          padding: '8px 12px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ 
          transform: `rotate(${isOpen ? 180 : 0}deg)`,
          transition: 'transform 0.3s ease'
        }}>⚙️</span>
        Advanced
      </button>

      {/* Settings Panel */}
      <div 
        style={{
          position: 'absolute',
          bottom: '40px',
          right: 0,
          width: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '16px',
          transform: `translateY(${isOpen ? 0 : 'calc(100% + 50px)'})`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Basic Algorithm Settings
            </h4>

            {/* Basic Algorithm Settings */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Threshold
                    <HelpTooltip text="The value that determines the contour boundary. Values above this threshold are considered inside the shape." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{threshold.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setThreshold(value)
                    scene?.setThreshold?.(value)
                  }}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Saddle Point Resolution
                  <HelpTooltip text="Determines how ambiguous marching squares cases are resolved. Center uses the cell center value, Gradient follows the steepest gradient, Majority uses the most common corner value." />
                </label>
                <select
                  value={saddlePointResolution}
                  onChange={(e) => {
                    const resolution = e.target.value as 'center' | 'gradient' | 'majority'
                    setSaddlePointResolution(resolution)
                    scene?.setSaddlePointResolution?.(resolution)
                  }}
                  onInput={(e) => {
                    const resolution = (e.target as HTMLSelectElement).value as 'center' | 'gradient' | 'majority'
                    setSaddlePointResolution(resolution)
                    scene?.setSaddlePointResolution?.(resolution)
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="center">Center (Balanced)</option>
                  <option value="gradient">Gradient (Smooth)</option>
                  <option value="majority">Majority (Sharp)</option>
                </select>
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Interpolation Settings
            </h4>

            {/* Interpolation Settings */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginBottom: '12px'
              }}>
                <input
                  type="checkbox"
                  checked={interpolationEnabled}
                  onChange={(e) => handleInterpolationEnabledChange(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Enable Interpolation
                <HelpTooltip text="Enables smooth interpolation of contour points and scalar field processing. When disabled, contours use raw pixelated edges." />
              </label>

              <div style={{ marginBottom: '8px', opacity: interpolationEnabled ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: interpolationEnabled ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  Interpolation Method
                  <HelpTooltip text="Controls how contour points are positioned along cell edges. Linear gives smooth curves, Cubic provides smoother S-curves." />
                </label>
                <select
                  value={interpolationMethod}
                  disabled={!interpolationEnabled}
                  onChange={(e) => {
                    const method = e.target.value as 'linear' | 'cubic' | 'none'
                    setInterpolationMethod(method)
                    scene?.setInterpolationMethod?.(method)
                  }}
                  onInput={(e) => {
                    const method = (e.target as HTMLSelectElement).value as 'linear' | 'cubic' | 'none'
                    setInterpolationMethod(method)
                    scene?.setInterpolationMethod?.(method)
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: interpolationEnabled ? 'white' : '#f5f5f5',
                    cursor: interpolationEnabled ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="linear">Linear (Smooth)</option>
                  <option value="cubic">Cubic (Smoother)</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px', opacity: interpolationEnabled ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: interpolationEnabled ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  Scalar Field Method
                  <HelpTooltip text="Converts binary grid data to continuous gradients. Edge-Clamping blur ensures contours snap to grid boundaries while maintaining smooth interiors. This replaces the need for buffer values." />
                </label>
                <select
                  value={scalarFieldMethod}
                  disabled={!interpolationEnabled}
                  onChange={(e) => {
                    const method = e.target.value as 'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'
                    setScalarFieldMethod(method)
                    scene?.setScalarFieldMethod?.(method)
                  }}
                  onInput={(e) => {
                    const method = (e.target as HTMLSelectElement).value as 'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'
                    setScalarFieldMethod(method)
                    scene?.setScalarFieldMethod?.(method)
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: interpolationEnabled ? 'white' : '#f5f5f5',
                    cursor: interpolationEnabled ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="edge-clamping">Edge-Clamping Blur (Recommended)</option>
                  <option value="adaptive-edge-preserving">Adaptive Edge-Preserving</option>
                  <option value="edge-preserving">Edge-Preserving</option>
                  <option value="gaussian">Gaussian Blur</option>
                  <option value="distance">Distance Field</option>
                  <option value="box">Box Blur</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px', opacity: interpolationEnabled && scalarFieldMethod !== 'none' ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: interpolationEnabled && scalarFieldMethod !== 'none' ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Scalar Field Radius
                    <HelpTooltip text="The size of the blur kernel in grid cells. Larger values create smoother gradients but may round corners more." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: interpolationEnabled && scalarFieldMethod !== 'none' ? '#333' : '#999' }}>{scalarFieldRadius.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scalarFieldRadius}
                  disabled={!interpolationEnabled || scalarFieldMethod === 'none'}
                  onChange={(e) => {
                    const radius = parseFloat(e.target.value)
                    setScalarFieldRadius(radius)
                    scene?.setScalarFieldRadius?.(radius)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: interpolationEnabled && scalarFieldMethod !== 'none' ? 'pointer' : 'not-allowed',
                    opacity: interpolationEnabled && scalarFieldMethod !== 'none' ? 1 : 0.5
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '8px', opacity: interpolationEnabled && scalarFieldMethod === 'edge-clamping' ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: interpolationEnabled && scalarFieldMethod === 'edge-clamping' ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Edge Clamp Strength
                    <HelpTooltip text="How strongly to enforce edge clamping (0.5-1.0). Higher values create tighter grid alignment." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: interpolationEnabled && scalarFieldMethod === 'edge-clamping' ? '#333' : '#999' }}>{edgeClampStrength.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={edgeClampStrength}
                  disabled={!interpolationEnabled || scalarFieldMethod !== 'edge-clamping'}
                  onChange={(e) => {
                    const strength = parseFloat(e.target.value)
                    setEdgeClampStrength(strength)
                    scene?.setEdgeClampStrength?.(strength)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: interpolationEnabled && scalarFieldMethod === 'edge-clamping' ? 'pointer' : 'not-allowed',
                    opacity: interpolationEnabled && scalarFieldMethod === 'edge-clamping' ? 1 : 0.5
                  }}
                />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Contour Geometry
            </h4>



            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Global Offset X
                    <HelpTooltip text="Shifts the entire contour horizontally in grid units. 0 = no offset." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetX.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={globalOffsetX}
                  onChange={(e) => handleGlobalOffsetChange('x', parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Global Offset Y
                    <HelpTooltip text="Shifts the entire contour vertically in grid units. 0 = no offset." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetY.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={globalOffsetY}
                  onChange={(e) => handleGlobalOffsetChange('y', parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Buffer size permanently set to 1 - no UI control needed */}

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Edge Clamping
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={edgeClamping}
                  onChange={(e) => {
                    setEdgeClamping(e.target.checked)
                    scene?.setEdgeClamping?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Enable Edge Clamping
                <HelpTooltip text="Strongly clamps contours to grid boundaries, preventing them from extending beyond edges. Essential for proper web section visualization." />
              </label>

              <div style={{ marginTop: '8px', marginBottom: '8px', opacity: edgeClamping ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: edgeClamping ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Clamp Distance
                    <HelpTooltip text="Distance from edge where clamping begins. Smaller values create tighter edge adherence." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: edgeClamping ? '#333' : '#999' }}>{edgeClampDistance.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={edgeClampDistance}
                  disabled={!edgeClamping}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setEdgeClampDistance(value)
                    scene?.setEdgeClampDistance?.(value)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: edgeClamping ? 'pointer' : 'not-allowed',
                    opacity: edgeClamping ? 1 : 0.5
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px', opacity: edgeClamping ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: edgeClamping ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  Corner Treatment
                  <HelpTooltip text="How corners are handled. Flared: contours hug edges (default). Trimmed: 45° cut corners. Square: sharp rectangular corners." />
                </label>
                <select
                  value={cornerTreatment}
                  disabled={!edgeClamping}
                  onChange={(e) => {
                    const treatment = e.target.value as 'trimmed' | 'flared' | 'square'
                    setCornerTreatment(treatment)
                    scene?.setCornerTreatment?.(treatment)
                  }}
                  onInput={(e) => {
                    const treatment = (e.target as HTMLSelectElement).value as 'trimmed' | 'flared' | 'square'
                    setCornerTreatment(treatment)
                    scene?.setCornerTreatment?.(treatment)
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: edgeClamping ? 'white' : '#f5f5f5',
                    cursor: edgeClamping ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="flared">Flared (Default)</option>
                  <option value="trimmed">Trimmed</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            {/* These settings are not implemented in the algorithm
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={clampToGrid}
                  onChange={(e) => {
                    setClampToGrid(e.target.checked)
                    scene?.setClampToGrid?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Clamp to Grid (Edge Clamping)
              </label>

              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginTop: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={extendToBoundary}
                  onChange={(e) => {
                    setExtendToBoundary(e.target.checked)
                    scene?.setExtendToBoundary?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Extend to Boundary
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                Snap Distance
                <span style={{ fontWeight: 'bold', color: '#333' }}>{snapDistance.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={snapDistance}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setSnapDistance(value)
                  scene?.setSnapDistance?.(value)
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            */}
          </div>

          {/* Right Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              View Options
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={!showRawMarchingSquares}
                  onChange={(e) => {
                    setShowRawMarchingSquares(!e.target.checked)
                    scene?.setShowRawMarchingSquares?.(!e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Smoothing
                <HelpTooltip text="Enables post-processing smoothing algorithms on the contours. Turn off to see raw marching squares output." />
              </label>

              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginTop: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={showControlPoints}
                  onChange={(e) => {
                    setShowControlPoints(e.target.checked)
                    scene?.setShowControlPoints?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Show Control Points
                <HelpTooltip text="Displays the actual points generated by marching squares. Useful for debugging and understanding the algorithm." />
              </label>
              
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginTop: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={showBlurredField}
                  onChange={(e) => {
                    setShowBlurredField(e.target.checked)
                    scene?.setShowBlurredField?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Show Blurred Field
                <HelpTooltip text="Displays a gradient visualization of the scalar field. Only visible in edit mode." />
              </label>
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Smoothing Options
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px', opacity: !showRawMarchingSquares ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: !showRawMarchingSquares ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  Smoothing Method
                  <HelpTooltip text="Post-processing to smooth contours. Basic averages points, Laplacian preserves edges, Chaikin subdivides curves, Bilateral preserves features, Edge-aware handles transitions intelligently." />
                </label>
                <select
                  value={smoothingMethod}
                  disabled={showRawMarchingSquares}
                  onChange={(e) => handleSmoothingChange(e.target.value as typeof smoothingMethod, smoothingIterations, smoothingStrength)}
                  onInput={(e) => handleSmoothingChange((e.target as HTMLSelectElement).value as typeof smoothingMethod, smoothingIterations, smoothingStrength)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: !showRawMarchingSquares ? 'white' : '#f5f5f5',
                    cursor: !showRawMarchingSquares ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="basic">Basic (Simple averaging)</option>
                  <option value="laplacian">Laplacian (Edge-preserving)</option>
                  <option value="chaikin">Chaikin (Subdivision)</option>
                  <option value="bilateral">Bilateral (Feature-preserving)</option>
                  <option value="savitzky-golay">Savitzky-Golay (Polynomial)</option>
                  <option value="catmull-rom">Catmull-Rom (Spline)</option>
                  <option value="edge-aware">Edge-Aware (Smart transitions)</option>
                  <option value="intelligent">Intelligent (Feature detection)</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px', opacity: !showRawMarchingSquares ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: !showRawMarchingSquares ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Smoothing Iterations
                    <HelpTooltip text="Number of times to apply the smoothing algorithm. More iterations create smoother curves but may lose detail." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: !showRawMarchingSquares ? '#333' : '#999' }}>{smoothingIterations}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={smoothingIterations}
                  disabled={showRawMarchingSquares}
                  onChange={(e) => handleSmoothingChange(smoothingMethod, parseInt(e.target.value), smoothingStrength)}
                  style={{ 
                    width: '100%', 
                    cursor: !showRawMarchingSquares ? 'pointer' : 'not-allowed',
                    opacity: !showRawMarchingSquares ? 1 : 0.5
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px', opacity: !showRawMarchingSquares ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: !showRawMarchingSquares ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Smoothing Strength
                    <HelpTooltip text="How much to smooth each iteration. 0 is no smoothing, 1 is maximum smoothing." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: !showRawMarchingSquares ? '#333' : '#999' }}>{smoothingStrength.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={smoothingStrength}
                  disabled={showRawMarchingSquares}
                  onChange={(e) => handleSmoothingChange(smoothingMethod, smoothingIterations, parseFloat(e.target.value))}
                  style={{ 
                    width: '100%', 
                    cursor: !showRawMarchingSquares ? 'pointer' : 'not-allowed',
                    opacity: !showRawMarchingSquares ? 1 : 0.5
                  }}
                />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Collision Avoidance
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={collisionAvoidance}
                  onChange={(e) => handleCollisionChange(e.target.checked, collisionMinDistance, collisionMethod, collisionIterations)}
                  style={{ cursor: 'pointer' }}
                />
                Enable Collision Avoidance
                <HelpTooltip text="Prevents contours from overlapping by pushing them apart or shrinking them. Useful when multiple regions are close together." />
              </label>

              <div style={{ marginTop: '8px', marginBottom: '8px', opacity: collisionAvoidance ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: collisionAvoidance ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Min Distance
                    <HelpTooltip text="Minimum allowed distance between contours in grid units. Contours closer than this will be pushed apart." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: collisionAvoidance ? '#333' : '#999' }}>{collisionMinDistance.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={collisionMinDistance}
                  disabled={!collisionAvoidance}
                  onChange={(e) => handleCollisionChange(collisionAvoidance, parseFloat(e.target.value), collisionMethod, collisionIterations)}
                  style={{ 
                    width: '100%', 
                    cursor: collisionAvoidance ? 'pointer' : 'not-allowed',
                    opacity: collisionAvoidance ? 1 : 0.5
                  }}
                />
              </div>

              <div style={{ marginBottom: '8px', opacity: collisionAvoidance ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: collisionAvoidance ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  Method
                  <HelpTooltip text="How to resolve collisions. Push moves contours apart, Shrink reduces their size, Hybrid combines both approaches." />
                </label>
                <select
                  value={collisionMethod}
                  disabled={!collisionAvoidance}
                  onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, e.target.value as typeof collisionMethod, collisionIterations)}
                  onInput={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, (e.target as HTMLSelectElement).value as typeof collisionMethod, collisionIterations)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: collisionAvoidance ? 'white' : '#f5f5f5',
                    cursor: collisionAvoidance ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="push">Push (Move apart)</option>
                  <option value="shrink">Shrink (Scale down)</option>
                  <option value="hybrid">Hybrid (Push + Shrink)</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px', opacity: collisionAvoidance ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: collisionAvoidance ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Iterations
                    <HelpTooltip text="Maximum number of iterations to resolve collisions. More iterations ensure better separation but take longer." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: collisionAvoidance ? '#333' : '#999' }}>{collisionIterations}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={collisionIterations}
                  disabled={!collisionAvoidance}
                  onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, collisionMethod, parseInt(e.target.value))}
                  style={{ 
                    width: '100%', 
                    cursor: collisionAvoidance ? 'pointer' : 'not-allowed',
                    opacity: collisionAvoidance ? 1 : 0.5
                  }}
                />
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Advanced Scalar Field
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginBottom: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={anisotropicDiffusion}
                  onChange={(e) => {
                    setAnisotropicDiffusion(e.target.checked)
                    scene?.setAnisotropicDiffusion?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Anisotropic Diffusion
                <HelpTooltip text="Advanced edge-preserving smoothing that maintains sharp features while smoothing uniform areas." />
              </label>

              <div style={{ opacity: anisotropicDiffusion ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: anisotropicDiffusion ? '#666' : '#999',
                  marginBottom: '4px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Diffusion Iterations
                    <HelpTooltip text="Number of diffusion steps. More iterations create smoother results." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: anisotropicDiffusion ? '#333' : '#999' }}>{diffusionIterations}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={diffusionIterations}
                  disabled={!anisotropicDiffusion}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setDiffusionIterations(value)
                    scene?.setDiffusionIterations?.(value)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: anisotropicDiffusion ? 'pointer' : 'not-allowed',
                    opacity: anisotropicDiffusion ? 1 : 0.5,
                    marginBottom: '8px'
                  }}
                />

                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: anisotropicDiffusion ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Edge Sensitivity
                    <HelpTooltip text="Controls how sensitive the diffusion is to edges. Lower values preserve more edges." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: anisotropicDiffusion ? '#333' : '#999' }}>{diffusionKappa.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={diffusionKappa}
                  disabled={!anisotropicDiffusion}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setDiffusionKappa(value)
                    scene?.setDiffusionKappa?.(value)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: anisotropicDiffusion ? 'pointer' : 'not-allowed',
                    opacity: anisotropicDiffusion ? 1 : 0.5
                  }}
                />
              </div>

              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#666',
                cursor: 'pointer',
                marginTop: '12px',
                marginBottom: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={multiScaleBlending}
                  onChange={(e) => {
                    setMultiScaleBlending(e.target.checked)
                    scene?.setMultiScaleBlending?.(e.target.checked)
                  }}
                  style={{ cursor: 'pointer' }}
                />
                Multi-Scale Blending
                <HelpTooltip text="Blends scalar fields at multiple scales for smoother transitions between detail levels." />
              </label>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Morphological Processing
                  <HelpTooltip text="Shape processing operations. Opening removes small features, Closing fills gaps." />
                </label>
                <select
                  value={morphologicalProcessing}
                  onChange={(e) => {
                    const method = e.target.value as 'none' | 'open' | 'close'
                    setMorphologicalProcessing(method)
                    scene?.setMorphologicalProcessing?.(method)
                  }}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="none">None</option>
                  <option value="open">Opening (Remove noise)</option>
                  <option value="close">Closing (Fill gaps)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button - Full Width */}
        <button
          onClick={resetToDefaults}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '6px 12px',
            background: '#f0f0f0',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
        >
          Reset to Defaults
        </button>

      </div>
    </div>
  )
}