/**
 * Enhancement Configuration Panel
 * Integrates the orphaned ScalarFieldEnhancements functionality into the UI
 */

import React from 'react'
import { EnhancementConfig, EnhancementAlgorithm, ENHANCEMENT_ALGORITHM_DESCRIPTIONS } from '../../core/configuration/EnhancementConfig'

interface EnhancementConfigPanelProps {
  config: EnhancementConfig
  onConfigChange: (config: Partial<EnhancementConfig>) => void
}

export const EnhancementConfigPanel: React.FC<EnhancementConfigPanelProps> = ({
  config,
  onConfigChange
}) => {
  
  const handleAlgorithmChange = (algorithm: EnhancementAlgorithm) => {
    onConfigChange({ 
      algorithm,
      enabled: algorithm !== 'none' // Auto-enable when selecting algorithm
    })
  }

  const handleParameterChange = (key: keyof EnhancementConfig, value: any) => {
    onConfigChange({ [key]: value })
  }

  const handleAdvancedParamChange = (algorithm: string, param: string, value: number) => {
    onConfigChange({
      algorithmParams: {
        ...config.algorithmParams,
        [algorithm]: {
          ...config.algorithmParams[algorithm as keyof typeof config.algorithmParams],
          [param]: value
        }
      }
    })
  }

  const currentAlgInfo = ENHANCEMENT_ALGORITHM_DESCRIPTIONS[config.algorithm]

  return (
    <div className="enhancement-config-panel" style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>🔬 Advanced Processing</h3>
        <div style={{
          fontSize: '12px',
          padding: '4px 8px',
          backgroundColor: config.enabled ? '#10b981' : '#6b7280',
          color: 'white',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {config.enabled ? 'ENABLED' : 'DISABLED'}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => handleParameterChange('enabled', e.target.checked)}
            style={{ transform: 'scale(1.2)' }}
          />
          Enable Advanced Processing
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          Applies sophisticated algorithms to improve contour quality
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Algorithm Selection */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px' 
            }}>
              Enhancement Algorithm
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {(Object.entries(ENHANCEMENT_ALGORITHM_DESCRIPTIONS) as Array<[EnhancementAlgorithm, typeof ENHANCEMENT_ALGORITHM_DESCRIPTIONS[EnhancementAlgorithm]]>).map(([alg, info]) => (
                <button
                  key={alg}
                  onClick={() => handleAlgorithmChange(alg)}
                  style={{
                    padding: '12px',
                    border: config.algorithm === alg ? '2px solid #3B82F6' : '1px solid #ddd',
                    backgroundColor: config.algorithm === alg ? '#eff6ff' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '16px' }}>{info.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{info.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                    {info.description}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '6px',
                    fontSize: '10px'
                  }}>
                    <span style={{ 
                      padding: '2px 6px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '3px'
                    }}>
                      {info.performance}
                    </span>
                    <span style={{ 
                      padding: '2px 6px',
                      backgroundColor: '#e7f3ff',
                      borderRadius: '3px'
                    }}>
                      {info.quality}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Current Algorithm Info */}
            {currentAlgInfo && (
              <div style={{
                padding: '12px',
                backgroundColor: '#e7f3ff',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <strong>{currentAlgInfo.icon} {currentAlgInfo.name}:</strong> {currentAlgInfo.description}
                <div style={{ marginTop: '4px', color: '#666' }}>
                  Performance: {currentAlgInfo.performance} | Quality: {currentAlgInfo.quality}
                </div>
              </div>
            )}
          </div>

          {/* Basic Parameters */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '12px' 
            }}>
              Processing Parameters
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Strength */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  marginBottom: '4px' 
                }}>
                  Enhancement Strength: {config.strength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.strength}
                  onChange={e => handleParameterChange('strength', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '10px', color: '#666' }}>
                  Higher values = stronger enhancement
                </div>
              </div>

              {/* Iterations */}
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  marginBottom: '4px' 
                }}>
                  Iterations: {config.iterations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={config.iterations}
                  onChange={e => handleParameterChange('iterations', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '10px', color: '#666' }}>
                  More iterations = better quality (slower)
                </div>
              </div>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={config.preserveEdges}
                  onChange={e => handleParameterChange('preserveEdges', e.target.checked)}
                />
                Preserve Edges
              </label>
              <div style={{ fontSize: '10px', color: '#666', marginLeft: '20px' }}>
                Maintains sharp structural boundaries during enhancement
              </div>
            </div>
          </div>

          {/* Algorithm-specific Parameters */}
          {config.algorithm === 'anisotropic' && (
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                marginBottom: '12px' 
              }}>
                🔧 Anisotropic Diffusion Parameters
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                    Kappa (Edge Threshold): {config.algorithmParams.anisotropic.kappa.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="1"
                    step="0.01"
                    value={config.algorithmParams.anisotropic.kappa}
                    onChange={e => handleAdvancedParamChange('anisotropic', 'kappa', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                    Lambda (Diffusion Rate): {config.algorithmParams.anisotropic.lambda.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.25"
                    step="0.01"
                    value={config.algorithmParams.anisotropic.lambda}
                    onChange={e => handleAdvancedParamChange('anisotropic', 'lambda', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Performance Impact Warning */}
          <div style={{
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '12px',
            marginTop: '16px'
          }}>
            <strong>⚡ Performance Impact:</strong> Advanced processing may increase computation time, 
            especially for large datasets. Consider reducing iterations for real-time interaction.
          </div>
        </>
      )}
    </div>
  )
}