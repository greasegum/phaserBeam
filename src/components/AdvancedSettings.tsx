import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'

interface AdvancedSettingsProps {
  scene?: BeamElevationScene
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  // Marching Squares Algorithm
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [saddlePointResolution, setSaddlePointResolution] = useState<'center' | 'gradient' | 'majority'>('center')
  const [threshold, setThreshold] = useState(0.5)
  // Geometry
  const [alignmentMode, setAlignmentMode] = useState<'edges' | 'vertices' | 'center'>('edges')
  const [globalOffsetX, setGlobalOffsetX] = useState(0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0)
  const [bufferSize, setBufferSize] = useState(1)
  const [bufferValue, setBufferValue] = useState(0)
  const [clampToGrid, setClampToGrid] = useState(true)
  const [extendToBoundary, setExtendToBoundary] = useState(false)
  const [snapDistance, setSnapDistance] = useState(0.1)
  // View Mode
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  // Processing
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom' | 'edge-aware' | 'intelligent'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  const [collisionAvoidance, setCollisionAvoidance] = useState(false)
  const [collisionMinDistance, setCollisionMinDistance] = useState(0.5)
  const [collisionMethod, setCollisionMethod] = useState<'push' | 'shrink' | 'hybrid'>('hybrid')
  const [collisionIterations, setCollisionIterations] = useState(10)
  // Scalar Field settings
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none'>('gaussian')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(2)

  useEffect(() => {
    if (scene) {
      // Algorithm settings
      setInterpolationMethod(scene.getInterpolationMethod?.() || 'linear')
      setSaddlePointResolution(scene.getSaddlePointResolution?.() || 'center')
      setThreshold(scene.getThreshold?.() || 0.5)
      setAlignmentMode(scene.getAlignmentMode?.() || 'edges')
      setClampToGrid(scene.getClampToGrid?.() ?? true)
      setExtendToBoundary(scene.getExtendToBoundary?.() ?? false)
      setSnapDistance(scene.getSnapDistance?.() || 0.1)
      
      // View settings
      setShowRawMarchingSquares(scene.getShowRawMarchingSquares?.() || false)
      setShowControlPoints(scene.getShowControlPoints?.() || false)
      
      // Get offsets
      const offsets = scene.getContourOffsets?.()
      if (offsets) {
        // Convert from internal offset (-0.5 = 0 in UI)
        setGlobalOffsetX(offsets.globalX + 0.5)
        setGlobalOffsetY(offsets.globalY + 0.5)
      }
      
      // Get buffer
      const buffer = scene.getContourBuffer?.()
      if (buffer) {
        setBufferSize(buffer.size)
        setBufferValue(buffer.value)
      }
      
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
    }
  }, [scene])

  const handleGlobalOffsetChange = (axis: 'x' | 'y', value: number) => {
    if (!scene) return
    
    // Convert UI value to internal offset (0 in UI = -0.5 internal)
    const internalValue = value - 0.5
    
    if (axis === 'x') {
      setGlobalOffsetX(value)
      scene.setContourGlobalOffsets(internalValue, globalOffsetY - 0.5)
    } else {
      setGlobalOffsetY(value)
      scene.setContourGlobalOffsets(globalOffsetX - 0.5, internalValue)
    }
  }

  const handleBufferChange = (size: number, value: number) => {
    if (!scene) return
    setBufferSize(size)
    setBufferValue(value)
    scene.setContourBuffer(size, value)
  }

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


  const resetToDefaults = () => {
    // Algorithm (Classic settings)
    setInterpolationMethod('linear')
    setSaddlePointResolution('center')
    setThreshold(0.5)
    scene?.setInterpolationMethod?.('linear')
    scene?.setSaddlePointResolution?.('center')
    scene?.setThreshold?.(0.5)
    // Geometry
    setAlignmentMode('edges')
    setGlobalOffsetX(0) // 0 in UI = -0.5 internal
    setGlobalOffsetY(0) // 0 in UI = -0.5 internal
    setBufferSize(1)
    setBufferValue(0)
    setClampToGrid(true)
    setExtendToBoundary(false)
    setSnapDistance(0.1)
    scene?.setAlignmentMode?.('edges')
    scene?.setContourGlobalOffsets(-0.5, -0.5)
    scene?.setContourBuffer(1, 0)
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
    setScalarFieldMethod('gaussian')
    setScalarFieldRadius(2)
    scene?.setScalarFieldMethod?.('gaussian')
    scene?.setScalarFieldRadius?.(2)
  }

  if (!scene) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
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
      <div style={{
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
      }}>

        {/* Two Column Layout */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {/* Left Column */}
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Marching Squares Algorithm
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
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
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="linear">Linear (Smooth)</option>
                  <option value="cubic">Cubic (Smoother)</option>
                  <option value="none">None (Pixelated)</option>
                </select>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Scalar Field Method
                </label>
                <select
                  value={scalarFieldMethod}
                  onChange={(e) => {
                    const method = e.target.value as 'gaussian' | 'distance' | 'box' | 'none'
                    setScalarFieldMethod(method)
                    scene?.setScalarFieldMethod?.(method)
                  }}
                  onInput={(e) => {
                    const method = (e.target as HTMLSelectElement).value as 'gaussian' | 'distance' | 'box' | 'none'
                    setScalarFieldMethod(method)
                    scene?.setScalarFieldMethod?.(method)
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
                  <option value="gaussian">Gaussian Blur</option>
                  <option value="distance">Distance Field</option>
                  <option value="box">Box Blur</option>
                  <option value="none">None (Binary)</option>
                </select>
              </div>

              {scalarFieldMethod !== 'none' && (
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    Blur Radius
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{scalarFieldRadius}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={scalarFieldRadius}
                    onChange={(e) => {
                      const radius = parseInt(e.target.value)
                      setScalarFieldRadius(radius)
                      scene?.setScalarFieldRadius?.(radius)
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Saddle Point Resolution
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

              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Threshold
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
            </div>

            <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
              Contour Alignment
            </h4>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Alignment Mode
                </label>
                <select
                  value={alignmentMode}
                  onChange={(e) => {
                    const mode = e.target.value as 'edges' | 'vertices' | 'center'
                    setAlignmentMode(mode)
                    scene?.setAlignmentMode?.(mode)
                  }}
                  onInput={(e) => {
                    const mode = (e.target as HTMLSelectElement).value as 'edges' | 'vertices' | 'center'
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
                  <option value="edges">Edge Aligned</option>
                  <option value="vertices">Vertex Aligned</option>
                  <option value="center">Center Aligned</option>
                </select>
              </div>
            </div>


            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Global Offset X
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
                  Global Offset Y
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

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Buffer Size
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{bufferSize}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={bufferSize}
                  onChange={(e) => {
                    const size = parseInt(e.target.value)
                    handleBufferChange(size, bufferValue)
                  }}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {bufferSize > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    Buffer Value
                    <span style={{ fontWeight: 'bold', color: bufferValue > threshold ? '#ff6b6b' : '#333' }}>
                      {bufferValue.toFixed(2)}
                    </span>
                  </label>
                  {bufferValue > threshold && (
                    <div style={{
                      fontSize: '10px',
                      color: '#ff6b6b',
                      marginTop: '4px',
                      marginBottom: '4px'
                    }}>
                      ⚠️ Values above threshold ({threshold}) will invert contours
                    </div>
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bufferValue}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      handleBufferChange(bufferSize, value)
                    }}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              )}
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
              View Mode
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
              </label>
            </div>

            {!showRawMarchingSquares && (
              <>
                <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
                  Smoothing Options
                </h4>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ 
                      display: 'block',
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '4px'
                    }}>
                      Smoothing Method
                    </label>
                    <select
                      value={smoothingMethod}
                      onChange={(e) => handleSmoothingChange(e.target.value as typeof smoothingMethod, smoothingIterations, smoothingStrength)}
                      onInput={(e) => handleSmoothingChange((e.target as HTMLSelectElement).value as typeof smoothingMethod, smoothingIterations, smoothingStrength)}
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

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Smoothing Iterations
                      <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingIterations}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={smoothingIterations}
                      onChange={(e) => handleSmoothingChange(smoothingMethod, parseInt(e.target.value), smoothingStrength)}
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
                      Smoothing Strength
                      <span style={{ fontWeight: 'bold', color: '#333' }}>{smoothingStrength.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={smoothingStrength}
                      onChange={(e) => handleSmoothingChange(smoothingMethod, smoothingIterations, parseFloat(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </>
            )}

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
              </label>

              {collisionAvoidance && (
                <>
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Min Distance
                      <span style={{ fontWeight: 'bold', color: '#333' }}>{collisionMinDistance.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={collisionMinDistance}
                      onChange={(e) => handleCollisionChange(collisionAvoidance, parseFloat(e.target.value), collisionMethod, collisionIterations)}
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
                      Method
                    </label>
                    <select
                      value={collisionMethod}
                      onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, e.target.value as typeof collisionMethod, collisionIterations)}
                      onInput={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, (e.target as HTMLSelectElement).value as typeof collisionMethod, collisionIterations)}
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
                      <option value="push">Push (Move apart)</option>
                      <option value="shrink">Shrink (Scale down)</option>
                      <option value="hybrid">Hybrid (Push + Shrink)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      Iterations
                      <span style={{ fontWeight: 'bold', color: '#333' }}>{collisionIterations}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={collisionIterations}
                      onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, collisionMethod, parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                </>
              )}
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

        {/* Help Text - Full Width */}
        <div style={{
          marginTop: '12px',
          padding: '8px',
          background: '#f9f9f9',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          <strong>Algorithm</strong> controls how marching squares generates contours.
          <br />
          <strong>Scalar field</strong> converts binary data to gradients, enabling interpolation methods to show differences.
          <br />
          <strong>Global offsets</strong> shift the entire contour in grid units.
          <br />
          <strong>Edge behavior</strong> controls boundary handling.
          <br />
          <strong>View mode</strong> toggles visual debugging options.
          <br />
          <strong>Smoothing</strong> applies post-processing to create smoother contours.
          <br />
          <strong>Collision</strong> prevents neighboring regions from overlapping.
        </div>
      </div>
    </div>
  )
}