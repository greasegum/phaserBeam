import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'

interface PDFExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: PDFExportOptions) => void
  currentScene?: any
}

export interface PDFExportOptions {
  pageSize: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3'
  orientation: 'portrait' | 'landscape'
  includeAnnotations: boolean
  includeGrid: boolean
  includeDimensions: boolean
  includeMetadata: boolean
  includeBookmarks: boolean
  compression: boolean
  security: 'none' | 'password' | 'certificate'
  password?: string
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  currentScene
}) => {
  const [pageSize, setPageSize] = useState<'letter' | 'legal' | 'tabloid' | 'a4' | 'a3'>('letter')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeGrid, setIncludeGrid] = useState(false)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeBookmarks, setIncludeBookmarks] = useState(true)
  const [compression, setCompression] = useState(true)
  const [security, setSecurity] = useState<'none' | 'password' | 'certificate'>('none')
  const [password, setPassword] = useState('')

  const handleExport = () => {
    onExport({
      pageSize,
      orientation,
      includeAnnotations,
      includeGrid,
      includeDimensions,
      includeMetadata,
      includeBookmarks,
      compression,
      security,
      password: security === 'password' ? password : undefined
    })
    onClose()
  }

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export as PDF"
      icon="📄"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Page Setup */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Page Setup
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as typeof pageSize)}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="letter">Letter (8.5" × 11")</option>
              <option value="legal">Legal (8.5" × 14")</option>
              <option value="tabloid">Tabloid (11" × 17")</option>
              <option value="a4">A4</option>
              <option value="a3">A3</option>
            </select>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setOrientation('portrait')}
                style={{
                  padding: '10px 16px',
                  border: orientation === 'portrait' ? '2px solid #E91E63' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: orientation === 'portrait' ? '#FCE4EC' : 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
                title="Portrait"
              >
                📋
              </button>
              <button
                onClick={() => setOrientation('landscape')}
                style={{
                  padding: '10px 16px',
                  border: orientation === 'landscape' ? '2px solid #E91E63' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: orientation === 'landscape' ? '#FCE4EC' : 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
                title="Landscape"
              >
                📑
              </button>
            </div>
          </div>
        </div>

        {/* Content Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Content
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { key: 'annotations', label: 'Annotations', value: includeAnnotations, setter: setIncludeAnnotations },
              { key: 'grid', label: 'Grid', value: includeGrid, setter: setIncludeGrid },
              { key: 'dimensions', label: 'Dimensions', value: includeDimensions, setter: setIncludeDimensions },
              { key: 'metadata', label: 'Metadata', value: includeMetadata, setter: setIncludeMetadata }
            ].map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
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
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#333' }}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* PDF Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            PDF Options
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={includeBookmarks}
                onChange={(e) => setIncludeBookmarks(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Include Bookmarks</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={compression}
                onChange={(e) => setCompression(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Compress PDF</span>
            </label>
          </div>
        </div>

        {/* Security */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Security
          </label>
          <select
            value={security}
            onChange={(e) => setSecurity(e.target.value as typeof security)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="none">No Security</option>
            <option value="password">Password Protected</option>
            <option value="certificate">Certificate Security</option>
          </select>
          {security === 'password' && (
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          )}
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
              backgroundColor: '#E91E63',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C2185B'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E91E63'}
          >
            Export PDF
          </button>
        </div>
      </div>
    </BaseExportDialog>
  )
}