import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'

interface ConfigurationProps {
  scene?: BeamElevationScene
}

export const Configuration: React.FC<ConfigurationProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'rendering' | 'algorithm' | 'visualization'>('rendering')
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  
  // Core rendering parameters
  const [scalarFieldMethod, setScalarFieldMethod] = useState<'gaussian' | 'distance' | 'box' | 'none' | 'edge-preserving' | 'adaptive-edge-preserving' | 'edge-clamping'>('edge-clamping')
  const [smoothingMethod, setSmoothingMethod] = useState<'basic' | 'laplacian' | 'chaikin' | 'bilateral' | 'catmull-rom' | 'edge-aware' | 'intelligent' | 'selective'>('edge-aware')
  const [smoothingIterations, setSmoothingIterations] = useState(1)
  const [smoothingStrength, setSmoothingStrength] = useState(0.3)
  
  // Edge treatment
  const [edgeClamping, setEdgeClamping] = useState(true)
  const [edgeClampDistance, setEdgeClampDistance] = useState(0.8)
  const [cornerTreatment, setCornerTreatment] = useState<'trimmed' | 'flared' | 'square'>('flared')
  const [clampToGrid, setClampToGrid] = useState(true)
  
  // Algorithm parameters
  const [threshold, setThreshold] = useState(0.5)
  const [interpolationMethod, setInterpolationMethod] = useState<'linear' | 'cubic' | 'none'>('linear')
  const [scalarFieldRadius, setScalarFieldRadius] = useState(1)
  const [edgeClampStrength, setEdgeClampStrength] = useState(0.95)
  
  // Visualization options
  const [showRawMarchingSquares, setShowRawMarchingSquares] = useState(false)
  const [showControlPoints, setShowControlPoints] = useState(false)
  const [showBlurredField, setShowBlurredField] = useState(false)
  
  // Load settings from scene
  useEffect(() => {
    if (!scene) return
    const configManager = scene.getConfigManager?.()
    if (!configManager) return
    
    const config = configManager.getConfig()
    setScalarFieldMethod(config.scalarFieldMethod)
    setSmoothingMethod(config.smoothingMethod)
    setSmoothingIterations(config.smoothingIterations)
    setSmoothingStrength(config.smoothingStrength)
    setEdgeClamping(config.edgeClamping)
    setEdgeClampDistance(config.edgeClampDistance)
    setCornerTreatment(config.cornerTreatment)
    setClampToGrid(config.clampToGrid)
    setThreshold(config.threshold)
    setInterpolationMethod(config.interpolationMethod)
    setScalarFieldRadius(config.scalarFieldRadius)
    setEdgeClampStrength(config.edgeClampStrength)
    setShowRawMarchingSquares(config.showRawMarchingSquares)
    setShowControlPoints(config.showControlPoints)
    setShowBlurredField(config.showBlurredField)
  }, [scene])
  
  // Apply settings to scene
  const applySettings = () => {
    if (!scene) return
    const configManager = scene.getConfigManager?.()
    if (!configManager) return
    
    configManager.updateConfig({
      scalarFieldMethod,
      smoothingMethod,
      smoothingIterations,
      smoothingStrength,
      edgeClamping,
      edgeClampDistance,
      cornerTreatment,
      clampToGrid,
      threshold,
      interpolationMethod,
      scalarFieldRadius,
      edgeClampStrength,
      showRawMarchingSquares,
      showControlPoints,
      showBlurredField
    })
  }
  
  // Apply settings on change
  useEffect(() => {
    applySettings()
  }, [
    scalarFieldMethod, smoothingMethod, smoothingIterations, smoothingStrength,
    edgeClamping, edgeClampDistance, cornerTreatment, clampToGrid,
    threshold, interpolationMethod, scalarFieldRadius, edgeClampStrength,
    showRawMarchingSquares, showControlPoints, showBlurredField
  ])

  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true)
    }
  }, [isOpen])

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }

  const buttonStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '70px',
    right: '0',
    width: '380px',
    maxHeight: '600px',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    animation: isOpen ? 'slideUp 0.3s ease-out' : ''
  }

  const headerStyle: React.CSSProperties = {
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px 20px 0 0'
  }

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    padding: '0 24px 16px',
    background: 'white',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    background: isActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: isActive ? '#667eea' : '#64748b',
    fontWeight: isActive ? '600' : '500',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'capitalize'
  })

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px',
    background: 'white'
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '24px'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const controlGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '6px',
    display: 'block'
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    fontSize: '13px',
    color: '#334155',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none'
  }

  const sliderContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    background: '#e2e8f0',
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer'
  }

  const sliderValueStyle: React.CSSProperties = {
    minWidth: '45px',
    padding: '4px 8px',
    background: 'rgba(102, 126, 234, 0.1)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center'
  }

  const toggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: '#f8f9ff',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }

  const toggleSwitchStyle = (checked: boolean): React.CSSProperties => ({
    width: '44px',
    height: '24px',
    background: checked ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e1',
    borderRadius: '12px',
    position: 'relative',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  })

  const toggleKnobStyle = (checked: boolean): React.CSSProperties => ({
    width: '18px',
    height: '18px',
    background: 'white',
    borderRadius: '50%',
    position: 'absolute',
    top: '3px',
    left: checked ? '23px' : '3px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  })

  const renderRenderingTab = () => (
    <div style={contentStyle}>
      {/* Contour Generation */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>🎨</span>
          <span>Contour Generation</span>
        </div>
        <div style={controlGroupStyle}>
          <div>
            <label style={labelStyle}>Field Method</label>
            <select 
              value={scalarFieldMethod} 
              onChange={e => setScalarFieldMethod(e.target.value as any)}
              style={selectStyle}
            >
              <option value="edge-clamping">Edge Clamping (Recommended)</option>
              <option value="edge-preserving">Edge Preserving</option>
              <option value="adaptive-edge-preserving">Adaptive Edge</option>
              <option value="gaussian">Gaussian Blur</option>
              <option value="distance">Distance Field</option>
              <option value="box">Box Blur</option>
              <option value="none">None</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Smoothing Method</label>
            <select 
              value={smoothingMethod} 
              onChange={e => setSmoothingMethod(e.target.value as any)}
              style={selectStyle}
            >
              <option value="edge-aware">Edge Aware (Best)</option>
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
            <label style={labelStyle}>Smoothing Iterations</label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="0"
                max="5"
                value={smoothingIterations}
                onChange={e => setSmoothingIterations(parseInt(e.target.value))}
                style={sliderStyle}
              />
              <div style={sliderValueStyle}>{smoothingIterations}</div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Smoothing Strength</label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={smoothingStrength}
                onChange={e => setSmoothingStrength(parseFloat(e.target.value))}
                style={sliderStyle}
              />
              <div style={sliderValueStyle}>{smoothingStrength.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edge Treatment */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>📐</span>
          <span>Edge Treatment</span>
        </div>
        <div style={controlGroupStyle}>
          <div style={toggleStyle} onClick={() => setEdgeClamping(!edgeClamping)}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>Edge Clamping</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Snap contours to edges</div>
            </div>
            <div style={toggleSwitchStyle(edgeClamping)}>
              <div style={toggleKnobStyle(edgeClamping)} />
            </div>
          </div>

          {edgeClamping && (
            <div>
              <label style={labelStyle}>Clamp Distance</label>
              <div style={sliderContainerStyle}>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={edgeClampDistance}
                  onChange={e => setEdgeClampDistance(parseFloat(e.target.value))}
                  style={sliderStyle}
                />
                <div style={sliderValueStyle}>{edgeClampDistance.toFixed(1)}</div>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Corner Style</label>
            <select 
              value={cornerTreatment} 
              onChange={e => setCornerTreatment(e.target.value as any)}
              style={selectStyle}
            >
              <option value="flared">Flared (Natural)</option>
              <option value="trimmed">Trimmed (Clean)</option>
              <option value="square">Square (Sharp)</option>
            </select>
          </div>

          <div style={toggleStyle} onClick={() => setClampToGrid(!clampToGrid)}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>Grid Alignment</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Align to grid cells</div>
            </div>
            <div style={toggleSwitchStyle(clampToGrid)}>
              <div style={toggleKnobStyle(clampToGrid)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAlgorithmTab = () => (
    <div style={contentStyle}>
      {/* Marching Squares */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>🔧</span>
          <span>Marching Squares</span>
        </div>
        <div style={controlGroupStyle}>
          <div>
            <label style={labelStyle}>Threshold</label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={e => setThreshold(parseFloat(e.target.value))}
                style={sliderStyle}
              />
              <div style={sliderValueStyle}>{threshold.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Interpolation</label>
            <select 
              value={interpolationMethod} 
              onChange={e => setInterpolationMethod(e.target.value as any)}
              style={selectStyle}
            >
              <option value="linear">Linear (Smooth)</option>
              <option value="cubic">Cubic (Very Smooth)</option>
              <option value="none">None (Blocky)</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Field Radius</label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="0"
                max="5"
                value={scalarFieldRadius}
                onChange={e => setScalarFieldRadius(parseInt(e.target.value))}
                style={sliderStyle}
              />
              <div style={sliderValueStyle}>{scalarFieldRadius}</div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Edge Strength</label>
            <div style={sliderContainerStyle}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={edgeClampStrength}
                onChange={e => setEdgeClampStrength(parseFloat(e.target.value))}
                style={sliderStyle}
              />
              <div style={sliderValueStyle}>{edgeClampStrength.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVisualizationTab = () => (
    <div style={contentStyle}>
      {/* Debug Options */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          <span>👁️</span>
          <span>Visualization Layers</span>
        </div>
        <div style={controlGroupStyle}>
          <div style={toggleStyle} onClick={() => setShowRawMarchingSquares(!showRawMarchingSquares)}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>Raw Contours</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Show unsmoothed lines</div>
            </div>
            <div style={toggleSwitchStyle(showRawMarchingSquares)}>
              <div style={toggleKnobStyle(showRawMarchingSquares)} />
            </div>
          </div>

          <div style={toggleStyle} onClick={() => setShowControlPoints(!showControlPoints)}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>Control Points</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Show algorithm points</div>
            </div>
            <div style={toggleSwitchStyle(showControlPoints)}>
              <div style={toggleKnobStyle(showControlPoints)} />
            </div>
          </div>

          <div style={toggleStyle} onClick={() => setShowBlurredField(!showBlurredField)}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>Scalar Field</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Visualize field values</div>
            </div>
            <div style={toggleSwitchStyle(showBlurredField)}>
              <div style={toggleKnobStyle(showBlurredField)} />
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
          <strong style={{ color: '#667eea' }}>💡 Tip:</strong> Enable visualization layers to understand how the contour algorithm processes your section loss data.
        </div>
      </div>
    </div>
  )

  return (
    <div style={containerStyle}>
      {/* Floating button */}
      <button
        style={{
          ...buttonStyle,
          transform: isOpen ? 'rotate(45deg) scale(0.9)' : 'rotate(0deg) scale(1)'
        }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={e => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(102, 126, 234, 0.5)'
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)'
          }
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ 
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' 
        }}>
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z" fill="white"/>
        </svg>
        {!hasBeenOpened && (
          <div style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: '#ef4444',
            borderRadius: '50%',
            top: '8px',
            right: '8px',
            border: '2px solid white',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </button>

      {/* Configuration panel */}
      <div style={panelStyle}>
        <div style={headerStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Configuration</h2>
          <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>Fine-tune contour generation</p>
        </div>

        <div style={tabsStyle}>
          <button
            style={tabStyle(activeTab === 'rendering')}
            onClick={() => setActiveTab('rendering')}
            onMouseEnter={e => {
              if (activeTab !== 'rendering') {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'rendering') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Rendering
          </button>
          <button
            style={tabStyle(activeTab === 'algorithm')}
            onClick={() => setActiveTab('algorithm')}
            onMouseEnter={e => {
              if (activeTab !== 'algorithm') {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'algorithm') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Algorithm
          </button>
          <button
            style={tabStyle(activeTab === 'visualization')}
            onClick={() => setActiveTab('visualization')}
            onMouseEnter={e => {
              if (activeTab !== 'visualization') {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== 'visualization') {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            Layers
          </button>
        </div>

        {activeTab === 'rendering' && renderRenderingTab()}
        {activeTab === 'algorithm' && renderAlgorithmTab()}
        {activeTab === 'visualization' && renderVisualizationTab()}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
        }

        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
        }

        select:hover, select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* Custom scrollbar */
        div[style*="overflowY: auto"]::-webkit-scrollbar {
          width: 6px;
        }
        
        div[style*="overflowY: auto"]::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }
        
        div[style*="overflowY: auto"]::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b4299 100%);
        }
      `}</style>
    </div>
  )
}