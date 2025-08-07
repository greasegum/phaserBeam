import React, { useState, useEffect } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { SceneConfig } from '../core/config/SceneConfigManager'
import { HelpTooltip } from './HelpTooltip'

interface AdvancedSettingsProps {
  scene?: BeamElevationScene
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<SceneConfig | null>(null)

  // Load configuration from scene
  useEffect(() => {
    if (scene) {
      const currentConfig = scene.getConfig()
      setConfig(currentConfig)
    }
  }, [scene])

  // Apply configuration changes to scene
  const updateConfig = (updates: Partial<SceneConfig>) => {
    if (scene && config) {
      const newConfig = { ...config, ...updates }
      setConfig(newConfig)
      scene.updateConfig(updates)
    }
  }

  // Reset to defaults
  const resetToDefaults = () => {
    if (scene) {
      scene.resetConfig()
      const defaultConfig = scene.getConfig()
      setConfig(defaultConfig)
    }
  }

  // Validate configuration
  const validation = scene?.validateConfig() || { isValid: true, errors: [] }

  if (!config) {
    return <div>Loading configuration...</div>
  }

  return (
    <div className="advanced-settings">
      <button 
        className="toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        Advanced Settings {isOpen ? '▼' : '▶'}
      </button>
      
      {isOpen && (
        <div className="settings-panel">
          {/* Validation Errors */}
          {!validation.isValid && (
            <div className="validation-errors">
              <h4>Configuration Errors:</h4>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index} style={{ color: 'red' }}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Configuration Actions */}
          <div className="config-actions">
            <button onClick={resetToDefaults}>Reset to Defaults</button>
          </div>

          {/* Stage 1: Binary Marching Squares */}
          <div className="config-section">
            <h3>Binary Marching Squares</h3>
            
            <div className="config-item">
              <label>Threshold:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.threshold}
                onChange={(e) => updateConfig({ threshold: parseFloat(e.target.value) })}
              />
              <span>{config.threshold.toFixed(2)}</span>
              <HelpTooltip text="Controls the contour level. Higher values create smaller contours." />
            </div>

            <div className="config-item">
              <label>Saddle Point Resolution:</label>
              <select
                value={config.saddlePointResolution}
                onChange={(e) => updateConfig({ saddlePointResolution: e.target.value as 'center' | 'gradient' | 'majority' })}
              >
                <option value="center">Center</option>
                <option value="gradient">Gradient</option>
                <option value="majority">Majority</option>
              </select>
              <HelpTooltip text="How to handle ambiguous saddle point cases in marching squares." />
            </div>

            <div className="config-item">
              <label>Alignment Mode:</label>
              <select
                value={config.alignmentMode}
                onChange={(e) => updateConfig({ alignmentMode: e.target.value as 'edges' | 'vertices' | 'center' })}
              >
                <option value="edges">Edges</option>
                <option value="vertices">Vertices</option>
                <option value="center">Center</option>
              </select>
              <HelpTooltip text="How contours align with the grid." />
            </div>

            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.clampToGrid}
                  onChange={(e) => updateConfig({ clampToGrid: e.target.checked })}
                />
                Clamp to Grid
              </label>
              <HelpTooltip text="Force contours to align with grid boundaries." />
            </div>

            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.extendToBoundary}
                  onChange={(e) => updateConfig({ extendToBoundary: e.target.checked })}
                />
                Extend to Boundary
              </label>
              <HelpTooltip text="Extend contours to reach boundary edges." />
            </div>

            <div className="config-item">
              <label>Snap Distance:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.snapDistance}
                onChange={(e) => updateConfig({ snapDistance: parseFloat(e.target.value) })}
              />
              <span>{config.snapDistance.toFixed(2)}</span>
              <HelpTooltip text="Distance threshold for snapping contours to grid points." />
            </div>
          </div>

          {/* Stage 2: Interpolation */}
          <div className="config-section">
            <h3>Interpolation</h3>
            
            <div className="config-item">
              <label>Interpolation Method:</label>
              <select
                value={config.interpolationMethod}
                onChange={(e) => updateConfig({ interpolationMethod: e.target.value as 'linear' | 'cubic' | 'none' })}
              >
                <option value="none">None</option>
                <option value="linear">Linear</option>
                <option value="cubic">Cubic</option>
              </select>
              <HelpTooltip text="Method for interpolating between grid points." />
            </div>

            <div className="config-item">
              <label>Scalar Field Method:</label>
              <select
                value={config.scalarFieldMethod}
                onChange={(e) => updateConfig({ scalarFieldMethod: e.target.value as any })}
              >
                <option value="edge-preserving">Edge Preserving</option>
                <option value="gaussian">Gaussian</option>
                <option value="edge-clamping">Edge Clamping</option>
                <option value="distance-weighted">Distance Weighted</option>
              </select>
              <HelpTooltip text="Method for generating the scalar field from selected cells." />
            </div>

            <div className="config-item">
              <label>Scalar Field Radius:</label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.scalarFieldRadius}
                onChange={(e) => updateConfig({ scalarFieldRadius: parseInt(e.target.value) })}
              />
              <span>{config.scalarFieldRadius}</span>
              <HelpTooltip text="Radius for scalar field generation." />
            </div>
          </div>

          {/* Stage 3: Smoothing */}
          <div className="config-section">
            <h3>Smoothing</h3>
            
            <div className="config-item">
              <label>Smoothing Method:</label>
              <select
                value={config.smoothingMethod}
                onChange={(e) => updateConfig({ smoothingMethod: e.target.value as any })}
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
              <HelpTooltip text="Algorithm for smoothing contour lines." />
            </div>

            <div className="config-item">
              <label>Smoothing Iterations:</label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={config.smoothingIterations}
                onChange={(e) => updateConfig({ smoothingIterations: parseInt(e.target.value) })}
              />
              <span>{config.smoothingIterations}</span>
              <HelpTooltip text="Number of smoothing passes to apply." />
            </div>

            <div className="config-item">
              <label>Smoothing Strength:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.smoothingStrength}
                onChange={(e) => updateConfig({ smoothingStrength: parseFloat(e.target.value) })}
              />
              <span>{config.smoothingStrength.toFixed(2)}</span>
              <HelpTooltip text="Strength of the smoothing effect." />
            </div>
          </div>

          {/* Edge Processing */}
          <div className="config-section">
            <h3>Edge Processing</h3>
            
            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.edgeClamping}
                  onChange={(e) => updateConfig({ edgeClamping: e.target.checked })}
                />
                Edge Clamping
              </label>
              <HelpTooltip text="Clamp contours to preserve sharp edges." />
            </div>

            <div className="config-item">
              <label>Edge Clamp Strength:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={config.edgeClampStrength}
                onChange={(e) => updateConfig({ edgeClampStrength: parseFloat(e.target.value) })}
              />
              <span>{config.edgeClampStrength.toFixed(2)}</span>
              <HelpTooltip text="Strength of edge preservation." />
            </div>

            <div className="config-item">
              <label>Edge Clamp Distance:</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.edgeClampDistance}
                onChange={(e) => updateConfig({ edgeClampDistance: parseFloat(e.target.value) })}
              />
              <span>{config.edgeClampDistance.toFixed(1)}</span>
              <HelpTooltip text="Distance threshold for edge detection." />
            </div>

            <div className="config-item">
              <label>Corner Treatment:</label>
              <select
                value={config.cornerTreatment}
                onChange={(e) => updateConfig({ cornerTreatment: e.target.value as 'trimmed' | 'flared' | 'square' })}
              >
                <option value="trimmed">Trimmed</option>
                <option value="flared">Flared</option>
                <option value="square">Square</option>
              </select>
              <HelpTooltip text="How to handle corner intersections." />
            </div>
          </div>

          {/* Collision Avoidance */}
          <div className="config-section">
            <h3>Collision Avoidance</h3>
            
            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.collisionAvoidance}
                  onChange={(e) => updateConfig({ collisionAvoidance: e.target.checked })}
                />
                Enable Collision Avoidance
              </label>
              <HelpTooltip text="Prevent contour lines from overlapping." />
            </div>

            {config.collisionAvoidance && (
              <>
                <div className="config-item">
                  <label>Minimum Distance:</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.collisionMinDistance}
                    onChange={(e) => updateConfig({ collisionMinDistance: parseFloat(e.target.value) })}
                  />
                  <span>{config.collisionMinDistance.toFixed(1)}</span>
                  <HelpTooltip text="Minimum distance between contour lines." />
                </div>

                <div className="config-item">
                  <label>Collision Method:</label>
                  <select
                    value={config.collisionMethod}
                    onChange={(e) => updateConfig({ collisionMethod: e.target.value as 'repulsion' | 'shrink' | 'hybrid' })}
                  >
                    <option value="repulsion">Repulsion</option>
                    <option value="shrink">Shrink</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  <HelpTooltip text="Method for resolving collisions." />
                </div>

                <div className="config-item">
                  <label>Collision Iterations:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={config.collisionIterations}
                    onChange={(e) => updateConfig({ collisionIterations: parseInt(e.target.value) })}
                  />
                  <span>{config.collisionIterations}</span>
                  <HelpTooltip text="Number of iterations for collision resolution." />
                </div>
              </>
            )}
          </div>

          {/* Debug Visualization */}
          <div className="config-section">
            <h3>Debug Visualization</h3>
            
            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.showRawMarchingSquares}
                  onChange={(e) => updateConfig({ showRawMarchingSquares: e.target.checked })}
                />
                Show Raw Marching Squares
              </label>
              <HelpTooltip text="Display the raw marching squares output without smoothing." />
            </div>

            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.showControlPoints}
                  onChange={(e) => updateConfig({ showControlPoints: e.target.checked })}
                />
                Show Control Points
              </label>
              <HelpTooltip text="Display the control points used for contour generation." />
            </div>

            <div className="config-item">
              <label>
                <input
                  type="checkbox"
                  checked={config.showBlurredField}
                  onChange={(e) => updateConfig({ showBlurredField: e.target.checked })}
                />
                Show Blurred Field
              </label>
              <HelpTooltip text="Display the blurred scalar field visualization." />
            </div>
          </div>

          {/* Configuration Import/Export */}
          <div className="config-section">
            <h3>Configuration Management</h3>
            
            <div className="config-item">
              <button 
                onClick={() => {
                  const configJson = scene?.getConfig()
                  if (configJson) {
                    navigator.clipboard.writeText(JSON.stringify(configJson, null, 2))
                    alert('Configuration copied to clipboard!')
                  }
                }}
              >
                Export Configuration
              </button>
              
              <button 
                onClick={() => {
                  const jsonString = prompt('Paste configuration JSON:')
                  if (jsonString && scene) {
                    try {
                      const importedConfig = JSON.parse(jsonString)
                      scene.updateConfig(importedConfig)
                      setConfig(scene.getConfig())
                      alert('Configuration imported successfully!')
                    } catch (error) {
                      alert('Invalid JSON format!')
                    }
                  }
                }}
              >
                Import Configuration
              </button>
            </div>
          </div>

          {/* Contour Alignment (Read-only) */}
          <div className="config-section">
            <h3>Contour Alignment (Read-only)</h3>
            <div className="config-item readonly">
              <label>Contour Offset X:</label>
              <span>{config.contourOffsetX}</span>
              <HelpTooltip text="Fixed offset for optimal grid alignment." />
            </div>
            <div className="config-item readonly">
              <label>Contour Offset Y:</label>
              <span>{config.contourOffsetY}</span>
              <HelpTooltip text="Fixed offset for optimal grid alignment." />
            </div>
            <div className="config-item readonly">
              <label>Global Offset X:</label>
              <span>{config.contourGlobalOffsetX}</span>
              <HelpTooltip text="Fixed global offset for proper alignment." />
            </div>
            <div className="config-item readonly">
              <label>Global Offset Y:</label>
              <span>{config.contourGlobalOffsetY}</span>
              <HelpTooltip text="Fixed global offset for proper alignment." />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
