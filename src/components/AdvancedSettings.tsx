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
  const [offsetX, setOffsetX] = useState(0.5)
  const [offsetY, setOffsetY] = useState(0.5)
  const [globalOffsetX, setGlobalOffsetX] = useState(0)
  const [globalOffsetY, setGlobalOffsetY] = useState(0)
  const [bufferSize, setBufferSize] = useState(0)
  const [bufferValue, setBufferValue] = useState(0)
  const [clampToGrid, setClampToGrid] = useState(true)
  const [extendToBoundary, setExtendToBoundary] = useState(false)
  const [snapDistance, setSnapDistance] = useState(0.1)
  // View Mode
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  // Processing
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'savitzky-golay' | 'catmull-rom'>('basic')
  const [smoothingIterations, setSmoothingIterations] = useState(2)
  const [smoothingStrength, setSmoothingStrength] = useState(0.5)
  const [collisionAvoidance, setCollisionAvoidance] = useState(true)
  const [collisionMinDistance, setCollisionMinDistance] = useState(0.5)
  const [collisionMethod, setCollisionMethod] = useState<'push' | 'shrink' | 'hybrid'>('hybrid')
  const [collisionIterations, setCollisionIterations] = useState(10)

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
      
      // Offset settings
      const offsets = scene.getContourOffsets()
      setOffsetX(offsets.offsetX)
      setOffsetY(offsets.offsetY)
      setGlobalOffsetX(offsets.globalOffsetX)
      setGlobalOffsetY(offsets.globalOffsetY)
      
      const buffer = scene.getContourBuffer()
      setBufferSize(buffer.bufferSize)
      setBufferValue(buffer.bufferValue)
      
      const smoothing = scene.getSmoothingOptions()
      setSmoothingMethod(smoothing.smoothingMethod || 'basic')
      setSmoothingIterations(smoothing.smoothingIterations || 2)
      setSmoothingStrength(smoothing.smoothingStrength || 0.5)
      
      const collision = scene.getCollisionAvoidance()
      setCollisionAvoidance(collision.collisionAvoidance)
      setCollisionMinDistance(collision.collisionMinDistance)
      setCollisionMethod(collision.collisionMethod)
      setCollisionIterations(collision.collisionIterations)
    }
  }, [scene])

  const handleOffsetChange = (type: 'cell' | 'global', axis: 'x' | 'y', value: number) => {
    if (!scene) return

    if (type === 'cell') {
      if (axis === 'x') {
        setOffsetX(value)
        scene.setContourOffsets(value, offsetY)
      } else {
        setOffsetY(value)
        scene.setContourOffsets(offsetX, value)
      }
    } else {
      if (axis === 'x') {
        setGlobalOffsetX(value)
        scene.setContourGlobalOffsets(value, globalOffsetY)
      } else {
        setGlobalOffsetY(value)
        scene.setContourGlobalOffsets(globalOffsetX, value)
      }
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
    // Algorithm
    setInterpolationMethod('linear')
    setSaddlePointResolution('center')
    setThreshold(0.5)
    scene?.setInterpolationMethod?.('linear')
    scene?.setSaddlePointResolution?.('center')
    scene?.setThreshold?.(0.5)
    // Geometry
    setAlignmentMode('edges')
    setOffsetX(0.5)
    setOffsetY(0.5)
    setGlobalOffsetX(0)
    setGlobalOffsetY(0)
    setBufferSize(0)
    setBufferValue(0)
    setClampToGrid(true)
    setExtendToBoundary(false)
    setSnapDistance(0.1)
    scene?.setAlignmentMode?.('edges')
    scene?.setContourOffsets(0.5, 0.5)
    scene?.setContourGlobalOffsets(0, 0)
    scene?.setContourBuffer(0, 0)
    scene?.setClampToGrid?.(true)
    scene?.setExtendToBoundary?.(false)
    scene?.setSnapDistance?.(0.1)
    // View
    setShowRawMarchingSquares(false)
    setShowControlPoints(false)
    scene?.setShowRawMarchingSquares?.(false)
    scene?.setShowControlPoints?.(false)
    // Processing
    setSmoothingMethod('basic')
    setSmoothingIterations(2)
    setSmoothingStrength(0.5)
    scene?.setSmoothingOptions('basic', 2, 0.5)
    setCollisionAvoidance(true)
    setCollisionMinDistance(0.5)
    setCollisionMethod('hybrid')
    setCollisionIterations(10)
    scene?.setCollisionAvoidance(true, 0.5, 'hybrid', 10)
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
        width: '280px',
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
              Saddle Point Resolution
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
              Cell Offset X
              <span style={{ fontWeight: 'bold', color: '#333' }}>{offsetX.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="-0.5"
              max="1.5"
              step="0.05"
              value={offsetX}
              onChange={(e) => handleOffsetChange('cell', 'x', parseFloat(e.target.value))}
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
              Cell Offset Y
              <span style={{ fontWeight: 'bold', color: '#333' }}>{offsetY.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="-0.5"
              max="1.5"
              step="0.05"
              value={offsetY}
              onChange={(e) => handleOffsetChange('cell', 'y', parseFloat(e.target.value))}
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
              Global Offset X
              <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetX.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.25"
              value={globalOffsetX}
              onChange={(e) => handleOffsetChange('global', 'x', parseFloat(e.target.value))}
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
              <span style={{ fontWeight: 'bold', color: '#333' }}>{globalOffsetY.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.25"
              value={globalOffsetY}
              onChange={(e) => handleOffsetChange('global', 'y', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
            Edge Behavior
          </h5>
          
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
                checked={clampToGrid}
                onChange={(e) => {
                  setClampToGrid(e.target.checked)
                  scene?.setClampToGrid?.(e.target.checked)
                }}
                style={{ marginRight: '8px' }}
              />
              Clamp to Grid Edges
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
                checked={extendToBoundary}
                onChange={(e) => {
                  setExtendToBoundary(e.target.checked)
                  scene?.setExtendToBoundary?.(e.target.checked)
                }}
                style={{ marginRight: '8px' }}
              />
              Extend to Boundary
            </label>
          </div>

          <div style={{ marginBottom: '8px' }}>
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
              max="1"
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

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
            Grid Buffer
          </h5>
          
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
              onChange={(e) => handleBufferChange(parseInt(e.target.value), bufferValue)}
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
              Buffer Value
              <span style={{ fontWeight: 'bold', color: '#333' }}>{bufferValue.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={bufferValue}
              onChange={(e) => handleBufferChange(bufferSize, parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
            View Mode
          </h5>
          
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
                onChange={(e) => {
                  setShowRawMarchingSquares(e.target.checked)
                  scene?.setShowRawMarchingSquares?.(e.target.checked)
                }}
                style={{ marginRight: '8px' }}
              />
              Show Raw Marching Squares (No Smoothing)
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
                onChange={(e) => {
                  setShowControlPoints(e.target.checked)
                  scene?.setShowControlPoints?.(e.target.checked)
                }}
                style={{ marginRight: '8px' }}
              />
              Show Control Points
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
            Smoothing Options
          </h5>
          
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
              <option value="basic">Basic (Original)</option>
              <option value="laplacian">Laplacian (Organic)</option>
              <option value="chaikin">Chaikin (Smooth Corners)</option>
              <option value="bilateral">Bilateral (Edge-Preserving)</option>
              <option value="savitzky-golay">Savitzky-Golay (Shape-Preserving)</option>
              <option value="catmull-rom">Catmull-Rom (Spline)</option>
            </select>
          </div>

          {(smoothingMethod === 'laplacian' || smoothingMethod === 'chaikin' || smoothingMethod === 'bilateral') && (
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
                min="1"
                max="5"
                step="1"
                value={smoothingIterations}
                onChange={(e) => handleSmoothingChange(smoothingMethod, parseInt(e.target.value), smoothingStrength)}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          )}

          {(smoothingMethod === 'laplacian' || smoothingMethod === 'bilateral' || smoothingMethod === 'catmull-rom') && (
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
                min="0.1"
                max="1.0"
                step="0.05"
                value={smoothingStrength}
                onChange={(e) => handleSmoothingChange(smoothingMethod, smoothingIterations, parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#555' }}>
            Collision Avoidance
          </h5>
          
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
                onChange={(e) => handleCollisionChange(e.target.checked, collisionMinDistance, collisionMethod, collisionIterations)}
                style={{ marginRight: '8px' }}
              />
              Enable Collision Avoidance
            </label>
          </div>

          {collisionAvoidance && (
            <>
              <div style={{ marginBottom: '8px' }}>
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
                  min="0.1"
                  max="2.0"
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
                  Resolution Method
                </label>
                <select
                  value={collisionMethod}
                  onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, e.target.value as typeof collisionMethod, collisionIterations)}
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
                  <option value="push">Push Apart</option>
                  <option value="shrink">Shrink Contours</option>
                  <option value="hybrid">Hybrid (Auto)</option>
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
                  Max Iterations
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{collisionIterations}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={collisionIterations}
                  onChange={(e) => handleCollisionChange(collisionAvoidance, collisionMinDistance, collisionMethod, parseInt(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={resetToDefaults}
          style={{
            width: '100%',
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
          <strong>Cell offsets</strong> adjust contour position within grid cells.
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