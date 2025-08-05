import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { HelpTooltip } from './HelpTooltip'

interface AdvancedSettingsProps {
  scene?: BeamElevationScene
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Stage 1: Binary Marching Squares
  const [threshold, setThreshold] = useState(0.5)
  const [saddlePointResolution, setSaddlePointResolution] = useState<'center' | 'gradient' | 'majority'>('center')
  const [alignmentMode, setAlignmentMode] = useState<'edges' | 'vertices' | 'center'>('edges')
  
  // Stage 2: Interpolated Marching Squares
  const [interpolationEnabled, setInterpolationEnabled] = useState(true)
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'>('edge-clamping')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(1)
  const [edgeClampStrength, setEdgeClampStrength] = useState(0.95)
  
  // Stage 3: Algorithmically Smoothed
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective' | 'intelligent-selective'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  const [edgeBufferDistance, setEdgeBufferDistance] = useState(2.0)
  const [preserveEdgeSegments, setPreserveEdgeSegments] = useState(true)
  const [transitionBlending, setTransitionBlending] = useState(true)
  const [curvatureThreshold, setCurvatureThreshold] = useState(0.1)
  const [preserveStraightSegments, setPreserveStraightSegments] = useState(true)
  
  // Post-processing options
  const [collisionAvoidance, setCollisionAvoidance] = useState(false)
  const [collisionMinDistance, setCollisionMinDistance] = useState(0.5)
  const [collisionMethod, setCollisionMethod] = useState<'push' | 'shrink' | 'hybrid'>('hybrid')
  const [collisionIterations, setCollisionIterations] = useState(10)
  
  // Edge Clamping (applies to all stages)
  const [edgeClamping, setEdgeClamping] = useState(true)
  const [edgeClampDistance, setEdgeClampDistance] = useState(0.8)
  const [cornerTreatment, setCornerTreatment] = useState<'trimmed' | 'flared' | 'square'>('flared')
  const [clampToGrid, setClampToGrid] = useState(true)
  const [extendToBoundary, setExtendToBoundary] = useState(false)
  const [snapDistance, setSnapDistance] = useState(0.1)
  
  // Global offsets
  const [globalOffsetX, setGlobalOffsetX] = useState(0.0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0.0)
  
  // View options
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
      setInterpolationEnabled(currentInterpolationMethod !== 'none')
      
      setScalarFieldMethod(scene.getScalarFieldMethod?.() || 'edge-clamping')
      setScalarFieldRadius(scene.getScalarFieldRadius?.() || 1)
      
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
    setInterpolationEnabled(true)
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
    setCurvatureThreshold(0.1)
    setPreserveStraightSegments(true)
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
    setGlobalOffsetX(-1.0)
    setGlobalOffsetY(-1.0)
    setShowRawMarchingSquares(false)
    setShowControlPoints(false)
    setShowBlurredField(false)
    
    // Apply to scene
    scene?.setThreshold?.(0.5)
    scene?.setSaddlePointResolution?.('center')
    scene?.setAlignmentMode?.('edges')
    scene?.setInterpolationMethod?.('linear')
    scene?.setScalarFieldMethod?.('edge-clamping')
    scene?.setScalarFieldRadius?.(1)
    scene?.setSmoothingOptions('edge-aware', 1, 0.3)
    scene?.setCollisionAvoidance(false, 0.5, 'hybrid', 10)
    scene?.setEdgeClamping?.(true)
    scene?.setEdgeClampDistance?.(0.8)
    scene?.setCornerTreatment?.('flared')
    scene?.setClampToGrid?.(true)
    scene?.setExtendToBoundary?.(false)
    scene?.setSnapDistance?.(0.1)
    scene?.setContourGlobalOffsets(-1.0, -1.0)
    scene?.setShowRawMarchingSquares?.(false)
    scene?.setShowControlPoints?.(false)
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
          width: '900px',
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
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Advanced Marching Squares Settings - Processing Pipeline
          </h3>
          <button
            onClick={resetToDefaults}
            style={{
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset to Defaults
          </button>
        </div>

        {/* Three Column Layout */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Column 1: Binary Marching Squares */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#0000FF',
              borderBottom: '2px solid #0000FF',
              paddingBottom: '4px'
            }}>
              Stage 1: Binary Marching Squares
            </h4>
            
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
              Raw pixelated contours from binary grid
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

            {/* Saddle Point Resolution */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>
                Saddle Point Resolution
                <HelpTooltip text="How ambiguous cases are resolved." />
              </label>
              <select
                value={saddlePointResolution}
                onChange={(e) => {
                  const resolution = e.target.value as 'center' | 'gradient' | 'majority'
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

            {/* Grid Alignment */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>
                Grid Alignment
                <HelpTooltip text="How contours align to the grid." />
              </label>
              <select
                value={alignmentMode}
                onChange={(e) => {
                  const mode = e.target.value as 'edges' | 'vertices' | 'center'
                  setAlignmentMode(mode)
                  scene?.setAlignmentMode?.(mode)
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
                <option value="vertices">Vertices (Pixelated)</option>
                <option value="edges">Edges (Smooth)</option>
                <option value="center">Center (Blended)</option>
              </select>
            </div>

            {/* Edge Behavior */}
            <h5 style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
              Edge Behavior
            </h5>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={clampToGrid}
                onChange={(e) => {
                  setClampToGrid(e.target.checked)
                  scene?.setClampToGrid?.(e.target.checked)
                }}
              />
              Clamp to Grid
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={extendToBoundary}
                onChange={(e) => {
                  setExtendToBoundary(e.target.checked)
                  scene?.setExtendToBoundary?.(e.target.checked)
                }}
              />
              Extend to Boundary
            </label>

            {/* Snap Distance */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>Snap Distance</span>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{snapDistance.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={snapDistance}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setSnapDistance(value)
                  scene?.setSnapDistance?.(value)
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Column 2: Interpolated Marching Squares */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#FF0000',
              borderBottom: '2px solid #FF0000',
              paddingBottom: '4px'
            }}>
              Stage 2: Interpolated Marching Squares
            </h4>
            
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
              Smooth contours with scalar field processing
            </p>

            {/* Enable Interpolation */}
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
                onChange={(e) => {
                  setInterpolationEnabled(e.target.checked)
                  if (e.target.checked) {
                    const method = interpolationMethod === 'none' ? 'linear' : interpolationMethod
                    setInterpolationMethod(method)
                    scene?.setInterpolationMethod?.(method)
                    const scalarMethod = scalarFieldMethod === 'none' ? 'edge-clamping' : scalarFieldMethod
                    setScalarFieldMethod(scalarMethod)
                    scene?.setScalarFieldMethod?.(scalarMethod)
                  } else {
                    setInterpolationMethod('none')
                    scene?.setInterpolationMethod?.('none')
                    setScalarFieldMethod('none')
                    scene?.setScalarFieldMethod?.('none')
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              Enable Interpolation
              <HelpTooltip text="Enables smooth interpolation and scalar field processing." />
            </label>

            {/* Interpolation Method */}
            <div style={{ marginBottom: '12px', opacity: interpolationEnabled ? 1 : 0.5 }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: interpolationEnabled ? '#666' : '#999',
                marginBottom: '4px'
              }}>
                Interpolation Method
                <HelpTooltip text="How contour points are positioned along edges." />
              </label>
              <select
                value={interpolationMethod}
                disabled={!interpolationEnabled}
                onChange={(e) => {
                  const method = e.target.value as 'linear' | 'cubic' | 'none'
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

            {/* Scalar Field Method */}
            <div style={{ marginBottom: '12px', opacity: interpolationEnabled ? 1 : 0.5 }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: interpolationEnabled ? '#666' : '#999',
                marginBottom: '4px'
              }}>
                Scalar Field Method
                <HelpTooltip text="Converts binary grid to continuous gradients." />
              </label>
              <select
                value={scalarFieldMethod}
                disabled={!interpolationEnabled}
                onChange={(e) => {
                  const method = e.target.value as typeof scalarFieldMethod
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
                <option value="edge-clamping">Edge-Clamping</option>
                <option value="adaptive-edge-preserving">Adaptive Edge</option>
                <option value="edge-preserving">Edge-Preserving</option>
                <option value="gaussian">Gaussian Blur</option>
                <option value="distance">Distance Field</option>
                <option value="box">Box Blur</option>
              </select>
            </div>

            {/* Scalar Field Radius */}
            <div style={{ marginBottom: '12px', opacity: interpolationEnabled && scalarFieldMethod !== 'none' ? 1 : 0.5 }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: interpolationEnabled && scalarFieldMethod !== 'none' ? '#666' : '#999'
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Scalar Field Radius
                  <HelpTooltip text="Size of the blur kernel in grid cells." />
                </span>
                <span style={{ fontWeight: 'bold', color: interpolationEnabled && scalarFieldMethod !== 'none' ? '#333' : '#999' }}>
                  {scalarFieldRadius.toFixed(1)}
                </span>
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
            
            {/* Edge Clamp Strength (for edge-clamping method) */}
            {scalarFieldMethod === 'edge-clamping' && (
              <div style={{ marginBottom: '12px', opacity: interpolationEnabled ? 1 : 0.5 }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: interpolationEnabled ? '#666' : '#999'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Edge Clamp Strength
                    <HelpTooltip text="How strongly edges are preserved during blurring." />
                  </span>
                  <span style={{ fontWeight: 'bold', color: interpolationEnabled ? '#333' : '#999' }}>
                    {edgeClampStrength.toFixed(2)}
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={edgeClampStrength}
                  disabled={!interpolationEnabled}
                  onChange={(e) => {
                    const strength = parseFloat(e.target.value)
                    setEdgeClampStrength(strength)
                    scene?.setEdgeClampStrength?.(strength)
                  }}
                  style={{ 
                    width: '100%', 
                    cursor: interpolationEnabled ? 'pointer' : 'not-allowed',
                    opacity: interpolationEnabled ? 1 : 0.5
                  }}
                />
              </div>
            )}

            {/* Edge Clamping */}
            <h5 style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
              Edge Clamping
            </h5>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={edgeClamping}
                onChange={(e) => {
                  setEdgeClamping(e.target.checked)
                  scene?.setEdgeClamping?.(e.target.checked)
                }}
              />
              Enable Edge Clamping
            </label>

            {/* Edge Clamp Distance */}
            <div style={{ marginBottom: '12px', opacity: edgeClamping ? 1 : 0.5 }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: edgeClamping ? '#666' : '#999'
              }}>
                <span>Edge Clamp Distance</span>
                <span style={{ fontWeight: 'bold', color: edgeClamping ? '#333' : '#999' }}>
                  {edgeClampDistance.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={edgeClampDistance}
                disabled={!edgeClamping}
                onChange={(e) => {
                  const distance = parseFloat(e.target.value)
                  setEdgeClampDistance(distance)
                  scene?.setEdgeClampDistance?.(distance)
                }}
                style={{ 
                  width: '100%', 
                  cursor: edgeClamping ? 'pointer' : 'not-allowed',
                  opacity: edgeClamping ? 1 : 0.5
                }}
              />
            </div>

            {/* Corner Treatment */}
            <div style={{ marginBottom: '12px', opacity: edgeClamping ? 1 : 0.5 }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: edgeClamping ? '#666' : '#999',
                marginBottom: '4px'
              }}>
                Corner Treatment
              </label>
              <select
                value={cornerTreatment}
                disabled={!edgeClamping}
                onChange={(e) => {
                  const treatment = e.target.value as 'trimmed' | 'flared' | 'square'
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
                <option value="trimmed">Trimmed</option>
                <option value="flared">Flared</option>
                <option value="square">Square</option>
              </select>
            </div>
          </div>

          {/* Column 3: Algorithmically Smoothed */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: 600,
              color: '#00FF00',
              borderBottom: '2px solid #00FF00',
              paddingBottom: '4px'
            }}>
              Stage 3: Algorithmically Smoothed
            </h4>
            
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '12px' }}>
              Post-processing smoothing algorithms
            </p>

            {/* Smoothing Method */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>
                Smoothing Method
                <HelpTooltip text="Algorithm used to smooth contours." />
              </label>
              <select
                value={smoothingMethod}
                onChange={(e) => {
                  const method = e.target.value as typeof smoothingMethod
                  setSmoothingMethod(method)
                  scene?.setSmoothingOptions(method, smoothingIterations, smoothingStrength)
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
                <option value="basic">Basic</option>
                <option value="laplacian">Laplacian</option>
                <option value="chaikin">Chaikin</option>
                <option value="bilateral">Bilateral</option>
                <option value="savitzky-golay">Savitzky-Golay</option>
                <option value="catmull-rom">Catmull-Rom</option>
                <option value="edge-aware">Edge-Aware</option>
                <option value="intelligent">Intelligent</option>
                <option value="selective">Selective</option>
                <option value="intelligent-selective">Intelligent Selective</option>
              </select>
            </div>

            {/* Smoothing Iterations */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>Smoothing Iterations</span>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingIterations}</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={smoothingIterations}
                onChange={(e) => {
                  const iterations = parseInt(e.target.value)
                  setSmoothingIterations(iterations)
                  scene?.setSmoothingOptions(smoothingMethod, iterations, smoothingStrength)
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Smoothing Strength */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#666'
              }}>
                <span>Smoothing Strength</span>
                <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingStrength.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={smoothingStrength}
                onChange={(e) => {
                  const strength = parseFloat(e.target.value)
                  setSmoothingStrength(strength)
                  scene?.setSmoothingOptions(smoothingMethod, smoothingIterations, strength)
                }}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Selective Smoothing Options */}
            {(smoothingMethod === 'selective' || smoothingMethod === 'intelligent-selective') && (
              <>
                <h5 style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
                  Selective Smoothing Options
                </h5>
                
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
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value)
                      setEdgeBufferDistance(distance)
                      scene?.setEdgeBufferDistance?.(distance)
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={preserveEdgeSegments}
                    onChange={(e) => {
                      setPreserveEdgeSegments(e.target.checked)
                      scene?.setPreserveEdgeSegments?.(e.target.checked)
                    }}
                  />
                  Preserve Edge Segments
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={transitionBlending}
                    onChange={(e) => {
                      setTransitionBlending(e.target.checked)
                      scene?.setTransitionBlending?.(e.target.checked)
                    }}
                  />
                  Transition Blending
                </label>
              </>
            )}

            {/* Collision Avoidance */}
            <h5 style={{ fontSize: '12px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
              Collision Avoidance
            </h5>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={collisionAvoidance}
                onChange={(e) => {
                  setCollisionAvoidance(e.target.checked)
                  scene?.setCollisionAvoidance(e.target.checked, collisionMinDistance, collisionMethod, collisionIterations)
                }}
              />
              Enable Collision Avoidance
            </label>

            {collisionAvoidance && (
              <>
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
                    onChange={(e) => {
                      const distance = parseFloat(e.target.value)
                      setCollisionMinDistance(distance)
                      scene?.setCollisionAvoidance(collisionAvoidance, distance, collisionMethod, collisionIterations)
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
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
                    onChange={(e) => {
                      const method = e.target.value as 'push' | 'shrink' | 'hybrid'
                      setCollisionMethod(method)
                      scene?.setCollisionAvoidance(collisionAvoidance, collisionMinDistance, method, collisionIterations)
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
                    <option value="push">Push</option>
                    <option value="shrink">Shrink</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Settings */}
        <div style={{ 
          marginTop: '24px', 
          paddingTop: '16px', 
          borderTop: '1px solid #ddd' 
        }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Global Settings
          </h4>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Global Offsets */}
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                Global Offsets
              </h5>
              
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <span>X Offset</span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetX.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={globalOffsetX}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setGlobalOffsetX(value)
                    scene?.setContourGlobalOffsets(value, globalOffsetY)
                  }}
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
                  <span>Y Offset</span>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetY.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="-0.5"
                  max="0.5"
                  step="0.05"
                  value={globalOffsetY}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setGlobalOffsetY(value)
                    scene?.setContourGlobalOffsets(globalOffsetX, value)
                  }}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* View Options */}
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                View Options
              </h5>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={showRawMarchingSquares}
                  onChange={(e) => {
                    setShowRawMarchingSquares(e.target.checked)
                    scene?.setShowRawMarchingSquares?.(e.target.checked)
                  }}
                />
                Show Raw Marching Squares
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={showControlPoints}
                  onChange={(e) => {
                    setShowControlPoints(e.target.checked)
                    scene?.setShowControlPoints?.(e.target.checked)
                  }}
                />
                Show Control Points
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={showBlurredField}
                  onChange={(e) => {
                    setShowBlurredField(e.target.checked)
                    scene?.setShowBlurredField?.(e.target.checked)
                  }}
                />
                Show Blurred Field
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}