import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'

interface SVGExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: SVGExportOptions) => void
  currentScene?: any
}

export interface SVGExportOptions {
  includeAnnotations: boolean
  includeGrid: boolean
  includeDimensions: boolean
  embedStyles: boolean
  preserveLayers: boolean
  optimizePaths: boolean
  precision: number
}

export const SVGExportDialog: React.FC<SVGExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  currentScene
}) => {
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeGrid, setIncludeGrid] = useState(false)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [embedStyles, setEmbedStyles] = useState(true)
  const [preserveLayers, setPreserveLayers] = useState(true)
  const [optimizePaths, setOptimizePaths] = useState(true)
  const [precision, setPrecision] = useState(2)

  const handleExport = () => {
    onExport({
      includeAnnotations,
      includeGrid,
      includeDimensions,
      embedStyles,
      preserveLayers,
      optimizePaths,
      precision
    })
    onClose()
  }

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export as SVG"
      icon="📐"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Include Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Include Elements
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'annotations', label: 'Annotations', value: includeAnnotations, setter: setIncludeAnnotations, desc: 'Include all annotation markups' },
              { key: 'grid', label: 'Grid Lines', value: includeGrid, setter: setIncludeGrid, desc: 'Include inspection grid overlay' },
              { key: 'dimensions', label: 'Dimensions', value: includeDimensions, setter: setIncludeDimensions, desc: 'Include dimensional information' }
            ].map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#4CAF50'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                <input
                  type="checkbox"
                  checked={option.value}
                  onChange={(e) => option.setter(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{option.label}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* SVG Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            SVG Options
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'embedStyles', label: 'Embed Styles', value: embedStyles, setter: setEmbedStyles, desc: 'Include CSS styles in SVG' },
              { key: 'preserveLayers', label: 'Preserve Layers', value: preserveLayers, setter: setPreserveLayers, desc: 'Maintain layer structure' },
              { key: 'optimizePaths', label: 'Optimize Paths', value: optimizePaths, setter: setOptimizePaths, desc: 'Reduce file size' }
            ].map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                  e.currentTarget.style.borderColor = '#4CAF50'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                <input
                  type="checkbox"
                  checked={option.value}
                  onChange={(e) => option.setter(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    marginTop: '2px'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>{option.label}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Precision */}
        <div>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            <span>Coordinate Precision</span>
            <span style={{ color: '#4CAF50', fontWeight: '600' }}>{precision} decimals</span>
          </label>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${precision * 25}%, #e0e0e0 ${precision * 25}%, #e0e0e0 100%)`
            }}
          />
          <div style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            Lower precision for smaller file size
          </div>
        </div>

        {/* Export Button */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '8px',
          paddingTop: '20px',
          borderTop: '1px solid #e0e0e0'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              flex: 2,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2196F3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
          >
            Export SVG
          </button>
        </div>
      </div>
    </BaseExportDialog>
  )
}