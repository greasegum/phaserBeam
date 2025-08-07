import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'

interface PrintDialogProps {
  isOpen: boolean
  onClose: () => void
  onPrint?: (options: PrintOptions) => void
}

export interface PrintOptions {
  orientation: 'portrait' | 'landscape'
  paperSize: 'letter' | 'legal' | 'tabloid' | 'a4'
  scale: 'fit' | 'actual' | 'custom'
  customScale?: number
  margins: 'normal' | 'narrow' | 'wide'
  includeHeaders: boolean
  includePageNumbers: boolean
}

export const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  onClose,
  onPrint
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [paperSize, setPaperSize] = useState<'letter' | 'legal' | 'tabloid' | 'a4'>('letter')
  const [scale, setScale] = useState<'fit' | 'actual' | 'custom'>('fit')
  const [customScale, setCustomScale] = useState(100)
  const [margins, setMargins] = useState<'normal' | 'narrow' | 'wide'>('normal')
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [includePageNumbers, setIncludePageNumbers] = useState(true)

  const handlePrint = () => {
    onPrint?.({
      orientation,
      paperSize,
      scale,
      customScale: scale === 'custom' ? customScale : undefined,
      margins,
      includeHeaders,
      includePageNumbers
    })
    // For now, just use browser print
    window.print()
    onClose()
  }

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Print Settings"
      icon="🖨️"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Orientation */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Orientation
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { value: 'portrait', label: 'Portrait', icon: '📄' },
              { value: 'landscape', label: 'Landscape', icon: '📑' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setOrientation(option.value as typeof orientation)}
                style={{
                  padding: '12px',
                  border: orientation === option.value ? '2px solid #673AB7' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: orientation === option.value ? '#EDE7F6' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '20px' }}>{option.icon}</span>
                <span style={{ fontSize: '14px', fontWeight: orientation === option.value ? '600' : '400' }}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Paper Size */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Paper Size
          </label>
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as typeof paperSize)}
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
            <option value="letter">Letter (8.5" × 11")</option>
            <option value="legal">Legal (8.5" × 14")</option>
            <option value="tabloid">Tabloid (11" × 17")</option>
            <option value="a4">A4 (210mm × 297mm)</option>
          </select>
        </div>

        {/* Scale */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Scale
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'fit', label: 'Fit to Page' },
              { value: 'actual', label: 'Actual Size' },
              { value: 'custom', label: 'Custom' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setScale(option.value as typeof scale)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: scale === option.value ? '2px solid #673AB7' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: scale === option.value ? '#EDE7F6' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: scale === option.value ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {scale === 'custom' && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={customScale}
                onChange={(e) => setCustomScale(Number(e.target.value))}
                min="10"
                max="200"
                style={{
                  width: '80px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>%</span>
            </div>
          )}
        </div>

        {/* Margins */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Margins
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { value: 'narrow', label: 'Narrow' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setMargins(option.value as typeof margins)}
                style={{
                  padding: '10px',
                  border: margins === option.value ? '2px solid #673AB7' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: margins === option.value ? '#EDE7F6' : 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: margins === option.value ? '600' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Print Options
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'headers', label: 'Include Headers', value: includeHeaders, setter: setIncludeHeaders },
              { key: 'pageNumbers', label: 'Include Page Numbers', value: includePageNumbers, setter: setIncludePageNumbers }
            ].map(option => (
              <label
                key={option.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
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

        {/* Print Button */}
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
            onClick={handlePrint}
            style={{
              flex: 2,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#673AB7',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5E35B1'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#673AB7'}
          >
            Print
          </button>
        </div>
      </div>
    </BaseExportDialog>
  )
}