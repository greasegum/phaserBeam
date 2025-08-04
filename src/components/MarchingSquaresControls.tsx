/**
 * Professional marching squares control panel
 * Organized, efficient, and maintains all advanced controls
 */

import React, { useState, useCallback, useMemo } from 'react'
import { MarchingSquaresConfig, ConfigBuilder } from '../core/configuration/MarchingSquaresConfig'
import './MarchingSquaresControls.css'

interface MarchingSquaresControlsProps {
  config: MarchingSquaresConfig
  onConfigChange: (config: MarchingSquaresConfig) => void
  showPerformanceMetrics?: boolean
  performanceMetrics?: Record<string, number>
}

interface ControlSection {
  id: string
  title: string
  icon: string
  component: React.ComponentType<SectionProps>
}

interface SectionProps {
  config: MarchingSquaresConfig
  onChange: (config: Partial<MarchingSquaresConfig>) => void
}

export const MarchingSquaresControls: React.FC<MarchingSquaresControlsProps> = ({
  config,
  onConfigChange,
  showPerformanceMetrics = false,
  performanceMetrics = {}
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['algorithm']))
  
  // Control sections
  const sections: ControlSection[] = useMemo(() => [
    { id: 'algorithm', title: 'Algorithm', icon: '⚙️', component: AlgorithmSection },
    { id: 'geometry', title: 'Geometry', icon: '📐', component: GeometrySection },
    { id: 'smoothing', title: 'Smoothing', icon: '〰️', component: SmoothingSection },
    { id: 'simplification', title: 'Simplification', icon: '✂️', component: SimplificationSection },
    { id: 'collision', title: 'Collision Avoidance', icon: '🔄', component: CollisionSection },
    { id: 'filtering', title: 'Filtering', icon: '🔍', component: FilteringSection },
    { id: 'performance', title: 'Performance', icon: '⚡', component: PerformanceSection }
  ], [])
  
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])
  
  const handleConfigChange = useCallback((partialConfig: Partial<MarchingSquaresConfig>) => {
    const newConfig = { ...config, ...partialConfig }
    onConfigChange(newConfig)
  }, [config, onConfigChange])
  
  
  return (
    <div 
      className="marching-squares-controls"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="controls-header">
        <h3>Marching Squares Controls</h3>
        {showPerformanceMetrics && (
          <div className="performance-badge">
            {performanceMetrics.total?.toFixed(1) || '0'}ms
          </div>
        )}
      </div>
      
      <div className="controls-sections">
        {sections.map(section => {
          const SectionComponent = section.component
          const isExpanded = expandedSections.has(section.id)
          
          return (
            <div key={section.id} className="control-section">
              <button
                className="section-header"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isExpanded}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-title">{section.title}</span>
                <span className="section-toggle">{isExpanded ? '−' : '+'}</span>
              </button>
              
              {isExpanded && (
                <div className="section-content">
                  <SectionComponent
                    config={config}
                    onChange={handleConfigChange}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Section Components

const AlgorithmSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>Threshold</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={config.algorithm.threshold}
        onChange={e => onChange({
          algorithm: { ...config.algorithm, threshold: parseFloat(e.target.value) }
        })}
      />
      <span className="value">{config.algorithm.threshold.toFixed(2)}</span>
    </div>
    
    <div className="control-row">
      <label>Interpolation</label>
      <select
        value={config.algorithm.interpolationMethod}
        onChange={e => onChange({
          algorithm: { ...config.algorithm, interpolationMethod: e.target.value as any }
        })}
      >
        <option value="linear">Linear</option>
        <option value="cubic">Cubic</option>
        <option value="none">None</option>
      </select>
    </div>
    
    <div className="control-row">
      <label>Saddle Points</label>
      <select
        value={config.algorithm.saddlePointResolution}
        onChange={e => onChange({
          algorithm: { ...config.algorithm, saddlePointResolution: e.target.value as any }
        })}
      >
        <option value="center">Center</option>
        <option value="gradient">Gradient</option>
        <option value="majority">Majority</option>
      </select>
    </div>
  </div>
)

const GeometrySection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <fieldset>
      <legend>Alignment</legend>
      <div className="control-row">
        <label>Mode</label>
        <select
          value={config.geometry.alignment.mode}
          onChange={e => onChange({
            geometry: {
              ...config.geometry,
              alignment: { ...config.geometry.alignment, mode: e.target.value as any }
            }
          })}
        >
          <option value="edges">Edges</option>
          <option value="vertices">Vertices</option>
          <option value="center">Center</option>
        </select>
      </div>
      
      <div className="control-row">
        <label>Offset X</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={config.geometry.alignment.offsetX}
          onChange={e => onChange({
            geometry: {
              ...config.geometry,
              alignment: { ...config.geometry.alignment, offsetX: parseFloat(e.target.value) }
            }
          })}
        />
        <span className="value">{config.geometry.alignment.offsetX.toFixed(2)}</span>
      </div>
      
      <div className="control-row">
        <label>Offset Y</label>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.05"
          value={config.geometry.alignment.offsetY}
          onChange={e => onChange({
            geometry: {
              ...config.geometry,
              alignment: { ...config.geometry.alignment, offsetY: parseFloat(e.target.value) }
            }
          })}
        />
        <span className="value">{config.geometry.alignment.offsetY.toFixed(2)}</span>
      </div>
    </fieldset>
    
    <fieldset>
      <legend>Edges</legend>
      <div className="control-row">
        <label>
          <input
            type="checkbox"
            checked={config.geometry.edges.clampToGrid}
            onChange={e => onChange({
              geometry: {
                ...config.geometry,
                edges: { ...config.geometry.edges, clampToGrid: e.target.checked }
              }
            })}
          />
          Clamp to Grid
        </label>
      </div>
      
      {config.geometry.edges.clampToGrid && (
        <div className="control-row">
          <label>Snap Distance</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.geometry.edges.snapDistance}
            onChange={e => onChange({
              geometry: {
                ...config.geometry,
                edges: { ...config.geometry.edges, snapDistance: parseFloat(e.target.value) }
              }
            })}
          />
          <span className="value">{config.geometry.edges.snapDistance.toFixed(2)}</span>
        </div>
      )}
    </fieldset>
    
    <fieldset>
      <legend>Buffer</legend>
      <div className="control-row">
        <label>
          <input
            type="checkbox"
            checked={config.geometry.buffer.enabled}
            onChange={e => onChange({
              geometry: {
                ...config.geometry,
                buffer: { ...config.geometry.buffer, enabled: e.target.checked }
              }
            })}
          />
          Enable Buffer
        </label>
      </div>
      
      {config.geometry.buffer.enabled && (
        <>
          <div className="control-row">
            <label>Size</label>
            <input
              type="number"
              min="0"
              max="10"
              value={config.geometry.buffer.size}
              onChange={e => onChange({
                geometry: {
                  ...config.geometry,
                  buffer: { ...config.geometry.buffer, size: parseInt(e.target.value) || 0 }
                }
              })}
            />
          </div>
          
          <div className="control-row">
            <label>Value</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.geometry.buffer.value}
              onChange={e => onChange({
                geometry: {
                  ...config.geometry,
                  buffer: { ...config.geometry.buffer, value: parseFloat(e.target.value) }
                }
              })}
            />
            <span className="value">{config.geometry.buffer.value.toFixed(1)}</span>
          </div>
        </>
      )}
    </fieldset>
    
    <fieldset>
      <legend>Transform</legend>
      <div className="control-row">
        <label>Global Offset X</label>
        <input
          type="number"
          step="0.1"
          value={config.geometry.transform.globalOffsetX}
          onChange={e => onChange({
            geometry: {
              ...config.geometry,
              transform: { ...config.geometry.transform, globalOffsetX: parseFloat(e.target.value) || 0 }
            }
          })}
        />
      </div>
      
      <div className="control-row">
        <label>Global Offset Y</label>
        <input
          type="number"
          step="0.1"
          value={config.geometry.transform.globalOffsetY}
          onChange={e => onChange({
            geometry: {
              ...config.geometry,
              transform: { ...config.geometry.transform, globalOffsetY: parseFloat(e.target.value) || 0 }
            }
          })}
        />
      </div>
    </fieldset>
  </div>
)

const SmoothingSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>
        <input
          type="checkbox"
          checked={config.processing.smoothing.enabled}
          onChange={e => onChange({
            processing: {
              ...config.processing,
              smoothing: { ...config.processing.smoothing, enabled: e.target.checked }
            }
          })}
        />
        Enable Smoothing
      </label>
    </div>
    
    {config.processing.smoothing.enabled && (
      <>
        <div className="control-row">
          <label>Algorithm</label>
          <select
            value={config.processing.smoothing.algorithm}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                smoothing: { ...config.processing.smoothing, algorithm: e.target.value as any }
              }
            })}
          >
            <option value="laplacian">Laplacian</option>
            <option value="chaikin">Chaikin</option>
            <option value="catmull-rom">Catmull-Rom</option>
            <option value="bezier">Bézier</option>
          </select>
        </div>
        
        <div className="control-row">
          <label>Iterations</label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.processing.smoothing.iterations}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                smoothing: { ...config.processing.smoothing, iterations: parseInt(e.target.value) }
              }
            })}
          />
          <span className="value">{config.processing.smoothing.iterations}</span>
        </div>
        
        <div className="control-row">
          <label>Strength</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.processing.smoothing.strength}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                smoothing: { ...config.processing.smoothing, strength: parseFloat(e.target.value) }
              }
            })}
          />
          <span className="value">{config.processing.smoothing.strength.toFixed(2)}</span>
        </div>
        
        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={config.processing.smoothing.preserveCorners}
              onChange={e => onChange({
                processing: {
                  ...config.processing,
                  smoothing: { ...config.processing.smoothing, preserveCorners: e.target.checked }
                }
              })}
            />
            Preserve Corners
          </label>
        </div>
      </>
    )}
  </div>
)

const SimplificationSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>
        <input
          type="checkbox"
          checked={config.processing.simplification.enabled}
          onChange={e => onChange({
            processing: {
              ...config.processing,
              simplification: { ...config.processing.simplification, enabled: e.target.checked }
            }
          })}
        />
        Enable Simplification
      </label>
    </div>
    
    {config.processing.simplification.enabled && (
      <>
        <div className="control-row">
          <label>Tolerance</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.processing.simplification.tolerance}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                simplification: { ...config.processing.simplification, tolerance: parseFloat(e.target.value) }
              }
            })}
          />
          <span className="value">{config.processing.simplification.tolerance.toFixed(2)}</span>
        </div>
        
        <div className="control-row">
          <label>Min Vertices</label>
          <input
            type="number"
            min="3"
            max="100"
            value={config.processing.simplification.minVertices}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                simplification: { ...config.processing.simplification, minVertices: parseInt(e.target.value) || 3 }
              }
            })}
          />
        </div>
      </>
    )}
  </div>
)

const CollisionSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>
        <input
          type="checkbox"
          checked={config.processing.collision.enabled}
          onChange={e => onChange({
            processing: {
              ...config.processing,
              collision: { ...config.processing.collision, enabled: e.target.checked }
            }
          })}
        />
        Enable Collision Avoidance
      </label>
    </div>
    
    {config.processing.collision.enabled && (
      <>
        <div className="control-row">
          <label>Method</label>
          <select
            value={config.processing.collision.method}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                collision: { ...config.processing.collision, method: e.target.value as any }
              }
            })}
          >
            <option value="repulsion">Repulsion</option>
            <option value="shrink">Shrink</option>
            <option value="morph">Morph</option>
          </select>
        </div>
        
        <div className="control-row">
          <label>Min Distance</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.processing.collision.minDistance}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                collision: { ...config.processing.collision, minDistance: parseFloat(e.target.value) }
              }
            })}
          />
          <span className="value">{config.processing.collision.minDistance.toFixed(1)}</span>
        </div>
        
        <div className="control-row">
          <label>Max Iterations</label>
          <input
            type="range"
            min="1"
            max="50"
            value={config.processing.collision.maxIterations}
            onChange={e => onChange({
              processing: {
                ...config.processing,
                collision: { ...config.processing.collision, maxIterations: parseInt(e.target.value) }
              }
            })}
          />
          <span className="value">{config.processing.collision.maxIterations}</span>
        </div>
      </>
    )}
  </div>
)

const FilteringSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>Min Area</label>
      <input
        type="number"
        min="0"
        step="0.1"
        value={config.processing.filtering.minContourArea}
        onChange={e => onChange({
          processing: {
            ...config.processing,
            filtering: { ...config.processing.filtering, minContourArea: parseFloat(e.target.value) || 0 }
          }
        })}
      />
    </div>
    
    <div className="control-row">
      <label>Min Length</label>
      <input
        type="number"
        min="3"
        value={config.processing.filtering.minContourLength}
        onChange={e => onChange({
          processing: {
            ...config.processing,
            filtering: { ...config.processing.filtering, minContourLength: parseInt(e.target.value) || 3 }
          }
        })}
      />
    </div>
    
    <div className="control-row">
      <label>Max Contours</label>
      <input
        type="number"
        min="1"
        max="100"
        value={config.processing.filtering.maxContours}
        onChange={e => onChange({
          processing: {
            ...config.processing,
            filtering: { ...config.processing.filtering, maxContours: parseInt(e.target.value) || 100 }
          }
        })}
      />
    </div>
  </div>
)

const PerformanceSection: React.FC<SectionProps> = ({ config, onChange }) => (
  <div className="control-group">
    <div className="control-row">
      <label>Quality</label>
      <select
        value={config.performance.quality}
        onChange={e => onChange({
          performance: { ...config.performance, quality: e.target.value as any }
        })}
      >
        <option value="draft">Draft</option>
        <option value="balanced">Balanced</option>
        <option value="high">High</option>
      </select>
    </div>
    
    <div className="control-row">
      <label>
        <input
          type="checkbox"
          checked={config.performance.enableCaching}
          onChange={e => onChange({
            performance: { ...config.performance, enableCaching: e.target.checked }
          })}
        />
        Enable Caching
      </label>
    </div>
    
    <div className="control-row">
      <label>
        <input
          type="checkbox"
          checked={config.performance.interpolationCache}
          onChange={e => onChange({
            performance: { ...config.performance, interpolationCache: e.target.checked }
          })}
        />
        Cache Interpolation
      </label>
    </div>
  </div>
)