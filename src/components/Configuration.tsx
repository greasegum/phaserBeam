import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { HelpTooltip } from './HelpTooltip'

interface ConfigurationProps {
  scene?: BeamElevationScene
}

export const Configuration: React.FC<ConfigurationProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'rendering' | 'algorithm' | 'visualization'>('rendering')
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  
  // Core rendering parameters (most commonly adjusted)
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'>('edge-clamping')
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  
  // Edge treatment
  const [edgeClamping, setEdgeClamping] = useState(true)
  const [edgeClampDistance, setEdgeClampDistance] = useState(0.8)
  const [cornerTreatment, setCornerTreatment] = useState<'trimmed' | 'flared' | 'square'>('flared')
  const [clampToGrid, setClampToGrid] = useState(true)
  
  // Algorithm parameters (advanced)
  const [threshold, setThreshold] = useState(0.5)
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(1)
  const [edgeClampStrength, setEdgeClampStrength] = useState(0.95)
  
  // Visualization options
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  const [showBlurredField, setShowBlurredField] = useState(false)
  
  // Load settings from scene - simplified for now
  useEffect(() => {
    if (!scene) return
    // Settings will be loaded from scene configuration when available
  }, [scene])
  
  // Apply settings to scene - simplified for now
  const applySettings = () => {
    if (!scene) return
    // Settings will be applied when scene methods are available
    // For now, trigger a redraw if available
    if (typeof scene.redrawVisualization === 'function') {
      scene.redrawVisualization()
    }
  }
  
  // Apply settings on change
  useEffect(() => {
    applySettings()
  }, [
    scalarFieldMethod, smoothingMethod, smoothingIterations, smoothingStrength,
    edgeClamping, edgeClampDistance, cornerTreatment, clampToGrid,
    threshold, interpolationMethod, scalarFieldRadius,
    showRawMarchingSquares, showControlPoints, showBlurredField
  ])
  
  const renderRenderingTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Contour Rendering</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Scalar Field Method
              <HelpTooltip content="Determines how the grid is converted to a continuous field for smooth contours" />
            </label>
            <select
              value={scalarFieldMethod}
              onChange={(e) => setScalarFieldMethod(e.target.value as any)}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="edge-clamping">Edge Clamping (Recommended)</option>
              <option value="adaptive-edge-preserving">Adaptive Edge Preserving</option>
              <option value="edge-preserving">Edge Preserving</option>
              <option value="gaussian">Gaussian Blur</option>
              <option value="distance">Distance Field</option>
              <option value="box">Box Blur</option>
              <option value="none">None</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">
              Smoothing Method
              <HelpTooltip content="Algorithm for smoothing contour lines" />
            </label>
            <select
              value={smoothingMethod}
              onChange={(e) => setSmoothingMethod(e.target.value as any)}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="edge-aware">Edge Aware (Recommended)</option>
              <option value="intelligent">Intelligent</option>
              <option value="selective">Selective</option>
              <option value="catmull-rom">Catmull-Rom</option>
              <option value="bilateral">Bilateral</option>
              <option value="chaikin">Chaikin</option>
              <option value="laplacian">Laplacian</option>
              <option value="basic">Basic</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">
              Smoothing Iterations
              <HelpTooltip content="Number of smoothing passes (1-5)" />
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={smoothingIterations}
              onChange={(e) => setSmoothingIterations(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{smoothingIterations}</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">
              Smoothing Strength
              <HelpTooltip content="How much smoothing to apply (0-1)" />
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={smoothingStrength}
              onChange={(e) => setSmoothingStrength(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{smoothingStrength.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-2">Edge Treatment</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={edgeClamping}
                onChange={(e) => setEdgeClamping(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable Edge Clamping</span>
              <HelpTooltip content="Prevents contours from extending beyond grid boundaries" />
            </label>
          </div>
          
          {edgeClamping && (
            <>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Clamp Distance
                  <HelpTooltip content="How close to keep contours to edges (0-1)" />
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={edgeClampDistance}
                  onChange={(e) => setEdgeClampDistance(Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-600">{edgeClampDistance.toFixed(2)}</span>
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Corner Treatment
                  <HelpTooltip content="How to handle contours at corners" />
                </label>
                <select
                  value={cornerTreatment}
                  onChange={(e) => setCornerTreatment(e.target.value as any)}
                  className="w-full px-2 py-1 text-sm border rounded"
                >
                  <option value="flared">Flared</option>
                  <option value="trimmed">Trimmed</option>
                  <option value="square">Square</option>
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={clampToGrid}
                    onChange={(e) => setClampToGrid(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Clamp to Grid Boundaries</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
  
  const renderAlgorithmTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Marching Squares Algorithm</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Threshold
              <HelpTooltip content="Contour threshold value (0-1)" />
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{threshold.toFixed(2)}</span>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">
              Interpolation Method
              <HelpTooltip content="How to interpolate contour positions" />
            </label>
            <select
              value={interpolationMethod}
              onChange={(e) => setInterpolationMethod(e.target.value as any)}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              <option value="linear">Linear</option>
              <option value="cubic">Cubic</option>
              <option value="none">None</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium mb-1">
              Scalar Field Radius
              <HelpTooltip content="Blur radius for scalar field (1-5)" />
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={scalarFieldRadius}
              onChange={(e) => setScalarFieldRadius(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{scalarFieldRadius.toFixed(1)}</span>
          </div>
          
          {scalarFieldMethod === 'edge-clamping' && (
            <div>
              <label className="block text-xs font-medium mb-1">
                Edge Clamp Strength
                <HelpTooltip content="Strength of edge clamping effect (0-1)" />
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={edgeClampStrength}
                onChange={(e) => setEdgeClampStrength(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-600">{edgeClampStrength.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
  
  const renderVisualizationTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Debug Visualization</h3>
        
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRawMarchingSquares}
              onChange={(e) => setShowRawMarchingSquares(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Raw Marching Squares</span>
            <HelpTooltip content="Display unprocessed marching squares contours" />
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showControlPoints}
              onChange={(e) => setShowControlPoints(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Control Points</span>
            <HelpTooltip content="Display contour control points" />
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showBlurredField}
              onChange={(e) => setShowBlurredField(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show Blurred Field</span>
            <HelpTooltip content="Display the scalar field visualization" />
          </label>
        </div>
      </div>
    </div>
  )
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      zIndex: 1000 
    }}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!hasBeenOpened) setHasBeenOpened(true)
        }}
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1d4ed8'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
        }}
        title="Open Configuration Panel"
      >
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {isOpen ? 'Close' : 'Configuration'}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 w-[500px] max-h-[600px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('rendering')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'rendering'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Rendering
            </button>
            <button
              onClick={() => setActiveTab('algorithm')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'algorithm'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Algorithm
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'visualization'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Visualization
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[480px]">
            {activeTab === 'rendering' && renderRenderingTab()}
            {activeTab === 'algorithm' && renderAlgorithmTab()}
            {activeTab === 'visualization' && renderVisualizationTab()}
          </div>
        </div>
      )}
    </div>
  )
}