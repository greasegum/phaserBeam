import React, { useState, useEffect } from 'react'
import { UnifiedConfigManager } from '../../core/configuration/UnifiedConfigManager'
import { HelpTooltip } from '../HelpTooltip'

interface UnifiedAlgorithmPanelProps {
  configManager: UnifiedConfigManager
  onConfigChange?: (config: any) => void
}

export const UnifiedAlgorithmPanel: React.FC<UnifiedAlgorithmPanelProps> = ({
  configManager,
  onConfigChange
}) => {
  const [config, setConfig] = useState(configManager.getUIConfig())
  const [activeTab, setActiveTab] = useState<'algorithm' | 'interpolation' | 'smoothing' | 'performance'>('algorithm')

  useEffect(() => {
    const handleConfigChange = (newConfig: any) => {
      setConfig(configManager.getUIConfig())
      onConfigChange?.(newConfig)
    }

    configManager.addListener(handleConfigChange)
    return () => configManager.removeListener(handleConfigChange)
  }, [configManager, onConfigChange])

  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    configManager.updateFromUI(newConfig)
  }

  const renderTabButton = (id: string, label: string, icon: string) => (
    <button
      key={id}
      onClick={() => setActiveTab(id as any)}
      style={{
        padding: '8px 16px',
        border: 'none',
        background: activeTab === id ? '#3B82F6' : 'transparent',
        color: activeTab === id ? 'white' : '#666',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.2s ease'
      }}
    >
      {icon} {label}
    </button>
  )

  const renderSlider = (label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void, help?: string) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>
          {label}: {value}
        </label>
        {help && <HelpTooltip content={help} />}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )

  const renderSelect = (label: string, value: string, options: { value: string; label: string }[], onChange: (value: string) => void, help?: string) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: '#333', fontWeight: 500 }}>
          {label}
        </label>
        {help && <HelpTooltip content={help} />}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '12px'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const renderCheckbox = (label: string, checked: boolean, onChange: (checked: boolean) => void, help?: string) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginRight: '8px' }}
        />
        <label style={{ fontSize: '12px', color: '#333', cursor: 'pointer' }}>
          {label}
        </label>
        {help && <HelpTooltip content={help} />}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '16px' }}>
      <h4 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        fontWeight: 600,
        color: '#1F2937',
        borderBottom: '2px solid #3B82F6',
        paddingBottom: '8px'
      }}>
        🎛️ Algorithm Configuration
      </h4>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '12px'
      }}>
        {renderTabButton('algorithm', 'Core', '⚙️')}
        {renderTabButton('interpolation', 'Interpolation', '📊')}
        {renderTabButton('smoothing', 'Smoothing', '🔄')}
        {renderTabButton('performance', 'Performance', '⚡')}
      </div>

      {/* Algorithm Tab */}
      {activeTab === 'algorithm' && (
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
            Core Algorithm Settings
          </h5>
          
          {renderSlider(
            'Threshold',
            config.threshold,
            0,
            1,
            0.01,
            (value) => updateConfig({ threshold: value }),
            'Determines inside/outside boundary for contour extraction'
          )}

          {renderSelect(
            'Saddle Point Resolution',
            config.saddlePointResolution,
            [
              { value: 'center', label: 'Center' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'majority', label: 'Majority' }
            ],
            (value) => updateConfig({ saddlePointResolution: value }),
            'How to handle ambiguous saddle point cases'
          )}

          {renderSelect(
            'Alignment Mode',
            config.alignmentMode,
            [
              { value: 'edges', label: 'Edges' },
              { value: 'vertices', label: 'Vertices' },
              { value: 'center', label: 'Center' }
            ],
            (value) => updateConfig({ alignmentMode: value }),
            'How contours align to grid elements'
          )}

          {renderCheckbox(
            'Clamp to Grid',
            config.clampToGrid,
            (checked) => updateConfig({ clampToGrid: checked }),
            'Force contours to align with grid boundaries'
          )}

          {renderCheckbox(
            'Extend to Boundary',
            config.extendToBoundary,
            (checked) => updateConfig({ extendToBoundary: checked }),
            'Extend contours to grid boundaries'
          )}

          {renderSlider(
            'Snap Distance',
            config.snapDistance,
            0,
            1,
            0.01,
            (value) => updateConfig({ snapDistance: value }),
            'Distance threshold for snapping to grid'
          )}
        </div>
      )}

      {/* Interpolation Tab */}
      {activeTab === 'interpolation' && (
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
            Interpolation Settings
          </h5>

          {renderCheckbox(
            'Enable Interpolation',
            config.interpolationEnabled,
            (checked) => updateConfig({ interpolationEnabled: checked }),
            'Apply interpolation to enhance grid before contour extraction'
          )}

          {renderSelect(
            'Interpolation Method',
            config.interpolationMethod,
            [
              { value: 'linear', label: 'Linear' },
              { value: 'cubic', label: 'Cubic' },
              { value: 'none', label: 'None' }
            ],
            (value) => updateConfig({ interpolationMethod: value }),
            'Method for interpolating between grid points'
          )}

          {renderSelect(
            'Scalar Field Method',
            config.scalarFieldMethod,
            [
              { value: 'gaussian', label: 'Gaussian' },
              { value: 'distance', label: 'Distance' },
              { value: 'box', label: 'Box' },
              { value: 'edge-preserving', label: 'Edge Preserving' },
              { value: 'adaptive-edge-preserving', label: 'Adaptive Edge Preserving' },
              { value: 'edge-clamping', label: 'Edge Clamping' },
              { value: 'none', label: 'None' }
            ],
            (value) => updateConfig({ scalarFieldMethod: value }),
            'Method for generating scalar field from discrete values'
          )}

          {renderSlider(
            'Scalar Field Radius',
            config.scalarFieldRadius,
            0.1,
            5,
            0.1,
            (value) => updateConfig({ scalarFieldRadius: value }),
            'Radius of influence for scalar field generation'
          )}

          {renderCheckbox(
            'Edge Clamping',
            config.edgeClampingEnabled,
            (checked) => updateConfig({ edgeClampingEnabled: checked }),
            'Clamp values near edges to preserve features'
          )}

          {renderSlider(
            'Edge Clamp Strength',
            config.edgeClampStrength,
            0,
            1,
            0.01,
            (value) => updateConfig({ edgeClampStrength: value }),
            'Strength of edge clamping effect'
          )}

          {renderSlider(
            'Edge Clamp Distance',
            config.edgeClampDistance,
            0,
            2,
            0.1,
            (value) => updateConfig({ edgeClampDistance: value }),
            'Distance threshold for edge clamping'
          )}
        </div>
      )}

      {/* Smoothing Tab */}
      {activeTab === 'smoothing' && (
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
            Smoothing Settings
          </h5>

          {renderCheckbox(
            'Enable Smoothing',
            config.smoothingEnabled,
            (checked) => updateConfig({ smoothingEnabled: checked }),
            'Apply smoothing to refine extracted contours'
          )}

          {renderSelect(
            'Smoothing Algorithm',
            config.smoothingAlgorithm,
            [
              { value: 'basic', label: 'Basic' },
              { value: 'laplacian', label: 'Laplacian' },
              { value: 'chaikin', label: 'Chaikin' },
              { value: 'bilateral', label: 'Bilateral' },
              { value: 'catmull-rom', label: 'Catmull-Rom' },
              { value: 'edge-aware', label: 'Edge Aware' },
              { value: 'intelligent', label: 'Intelligent' },
              { value: 'selective', label: 'Selective' }
            ],
            (value) => updateConfig({ smoothingAlgorithm: value }),
            'Algorithm for smoothing contour curves'
          )}

          {renderSlider(
            'Smoothing Iterations',
            config.smoothingIterations,
            1,
            10,
            1,
            (value) => updateConfig({ smoothingIterations: value }),
            'Number of smoothing passes to apply'
          )}

          {renderSlider(
            'Smoothing Strength',
            config.smoothingStrength,
            0,
            1,
            0.01,
            (value) => updateConfig({ smoothingStrength: value }),
            'Strength of smoothing effect'
          )}

          {renderCheckbox(
            'Edge Preservation',
            config.edgePreservationEnabled,
            (checked) => updateConfig({ edgePreservationEnabled: checked }),
            'Preserve sharp edges during smoothing'
          )}

          {renderSlider(
            'Edge Buffer Distance',
            config.edgeBufferDistance,
            0,
            5,
            0.1,
            (value) => updateConfig({ edgeBufferDistance: value }),
            'Distance from edges to preserve'
          )}

          {renderCheckbox(
            'Preserve Straight Segments',
            config.preserveStraightSegments,
            (checked) => updateConfig({ preserveStraightSegments: checked }),
            'Preserve straight line segments during smoothing'
          )}

          {renderSlider(
            'Curvature Threshold',
            config.curvatureThreshold,
            0,
            1,
            0.01,
            (value) => updateConfig({ curvatureThreshold: value }),
            'Threshold for detecting corners and features'
          )}

          {renderCheckbox(
            'Collision Avoidance',
            config.collisionEnabled,
            (checked) => updateConfig({ collisionEnabled: checked }),
            'Prevent contour overlap'
          )}

          {renderSelect(
            'Collision Method',
            config.collisionMethod,
            [
              { value: 'repulsion', label: 'Repulsion' },
              { value: 'shrink', label: 'Shrink' },
              { value: 'hybrid', label: 'Hybrid' }
            ],
            (value) => updateConfig({ collisionMethod: value }),
            'Method for handling contour collisions'
          )}

          {renderSlider(
            'Collision Min Distance',
            config.collisionMinDistance,
            0,
            2,
            0.1,
            (value) => updateConfig({ collisionMinDistance: value }),
            'Minimum distance between contours'
          )}

          {renderSlider(
            'Collision Iterations',
            config.collisionIterations,
            1,
            20,
            1,
            (value) => updateConfig({ collisionIterations: value }),
            'Maximum iterations for collision resolution'
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
            Performance Settings
          </h5>

          {renderCheckbox(
            'Enable Caching',
            config.enableCaching,
            (checked) => updateConfig({ enableCaching: checked }),
            'Cache intermediate results for better performance'
          )}

          {renderCheckbox(
            'Interpolation Cache',
            config.interpolationCache,
            (checked) => updateConfig({ interpolationCache: checked }),
            'Cache interpolation results'
          )}

          {renderSelect(
            'Quality',
            config.quality,
            [
              { value: 'draft', label: 'Draft (Fast)' },
              { value: 'balanced', label: 'Balanced' },
              { value: 'high', label: 'High Quality (Slow)' }
            ],
            (value) => updateConfig({ quality: value }),
            'Quality vs performance trade-off'
          )}

          {renderSlider(
            'Max Grid Size',
            config.maxGridSize,
            100,
            2000,
            100,
            (value) => updateConfig({ maxGridSize: value }),
            'Maximum grid size for processing'
          )}

          {renderSlider(
            'Max Contour Points',
            config.maxContourPoints,
            1000,
            50000,
            1000,
            (value) => updateConfig({ maxContourPoints: value }),
            'Maximum number of contour points'
          )}
        </div>
      )}

      {/* Reset Button */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={() => configManager.resetToDefaults()}
          style={{
            padding: '8px 16px',
            border: '1px solid #DC2626',
            background: 'white',
            color: '#DC2626',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC2626'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = '#DC2626'
          }}
        >
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  )
} 