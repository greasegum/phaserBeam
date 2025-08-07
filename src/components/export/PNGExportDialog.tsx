import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'

interface PNGExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: PNGExportOptions) => void
  currentScene?: any
}

export interface PNGExportOptions {
  scale: number
  backgroundColor: string
  includeAnnotations: boolean
  includeGrid: boolean
  includeDimensions: boolean
  quality: number
}

export const PNGExportDialog: React.FC<PNGExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  currentScene
}) => {
  const [scale, setScale] = useState(2)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeGrid, setIncludeGrid] = useState(false)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [quality, setQuality] = useState(95)

  const handleExport = () => {
    onExport({
      scale,
      backgroundColor,
      includeAnnotations,
      includeGrid,
      includeDimensions,
      quality
    })
    onClose()
  }

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export as PNG"
      icon="🖼️"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Resolution Scale */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Resolution Scale
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4].map(value => (
              <button
                key={value}
                onClick={() => setScale(value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: scale === value ? '2px solid #4CAF50' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: scale === value ? '#E8F5E9' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: scale === value ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                {value}x
              </button>
            ))}
          </div>
          <div style={{
            marginTop: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            Higher scale for better quality, larger file size
          </div>
        </div>

        {/* Quality Slider */}
        <div>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            <span>Quality</span>
            <span style={{ color: '#4CAF50', fontWeight: '600' }}>{quality}%</span>
          </label>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #4CAF50 0%, #4CAF50 ${(quality - 50) * 2}%, #e0e0e0 ${(quality - 50) * 2}%, #e0e0e0 100%)`
            }}
          />
        </div>

        {/* Background Color */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Background Color
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{
                width: '50px',
                height: '40px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={() => setBackgroundColor('transparent')}
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Transparent
            </button>
          </div>
        </div>

        {/* Include Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Include in Export
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'annotations', label: 'Annotations', value: includeAnnotations, setter: setIncludeAnnotations },
              { key: 'grid', label: 'Grid Lines', value: includeGrid, setter: setIncludeGrid },
              { key: 'dimensions', label: 'Dimensions', value: includeDimensions, setter: setIncludeDimensions }
            ].map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={option.value}
                  onChange={(e) => option.setter(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>{option.label}</span>
              </label>
            ))}
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
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            Export PNG
          </button>
        </div>
      </div>
    </BaseExportDialog>
  )
}