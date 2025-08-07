import React, { useState } from 'react'
import { VectorExportService, VectorExportOptions, VectorExportContext } from '../services/VectorExportService'
import { BeamProfile, GridCell } from '../types/beam'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { exportCanvasAsPNG } from '../utils/canvasExport'

interface UnifiedExportDialogProps {
  isOpen: boolean
  onClose: () => void
  scene: BeamElevationScene | null
  beamProfile: BeamProfile | null
  beamLength: number
  cells: GridCell[]
  initialFormat?: 'png' | 'svg' | 'pdf' | 'dxf'
}

type ExportFormat = 'png' | 'svg' | 'pdf' | 'dxf'

const FORMAT_INFO: Record<ExportFormat, { 
  name: string
  icon: string
  description: string
  color: string
}> = {
  png: { 
    name: 'PNG Image', 
    icon: '🖼️', 
    description: 'Raster image for presentations',
    color: '#10B981'
  },
  svg: { 
    name: 'SVG Vector', 
    icon: '📐', 
    description: 'Scalable vector graphics',
    color: '#3B82F6'
  },
  pdf: { 
    name: 'PDF Document', 
    icon: '📄', 
    description: 'Professional report format',
    color: '#EF4444'
  },
  dxf: { 
    name: 'DXF CAD', 
    icon: '📏', 
    description: 'AutoCAD compatible',
    color: '#8B5CF6'
  }
}

export const UnifiedExportDialog: React.FC<UnifiedExportDialogProps> = ({
  isOpen,
  onClose,
  scene,
  beamProfile,
  beamLength,
  cells,
  initialFormat = 'png'
}) => {
  const [format, setFormat] = useState<ExportFormat>(initialFormat)
  const [isExporting, setIsExporting] = useState(false)
  
  // Common options
  const [includeGrid, setIncludeGrid] = useState(true)
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [useTransparentBg, setUseTransparentBg] = useState(false)
  
  // Advanced options (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [scale, setScale] = useState(1)
  const [quality, setQuality] = useState(95)
  const [includeLegend, setIncludeLegend] = useState(false)
  
  if (!isOpen) return null
  
  const handleExport = async () => {
    if (!beamProfile) {
      alert('No beam profile available')
      return
    }
    
    setIsExporting(true)
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const baseFileName = `beam-inspection-${timestamp}`
      
      if (format === 'png' && scene) {
        // Handle PNG export through canvas
        const fileName = `${baseFileName}.png`
        exportCanvasAsPNG(scene, fileName)
        onClose()
      } else {
        // Handle vector formats
        const exportService = new VectorExportService()
        const gridSize = scene?.gridSize || 30
        
        // Calculate dimensions
        const padding = 50
        const width = beamLength * gridSize
        const height = (beamProfile.webHeight + beamProfile.flangeThickness * 2) * gridSize
        const centerY = height / 2
        
        const context: VectorExportContext = {
          beamProfile,
          beamLength,
          cells,
          gridSize,
          dimensions: {
            startX: padding,
            centerY,
            width,
            height
          },
          annotations: scene?.getAnnotations?.() || []
        }
        
        const options: VectorExportOptions = {
          format: format as 'svg' | 'pdf' | 'dxf',
          scale,
          backgroundColor: useTransparentBg ? 'transparent' : backgroundColor,
          includeGrid,
          includeAnnotations,
          includeDimensions,
          includeLegend,
          title: `Beam Inspection - ${beamProfile.name}`
        }
        
        let result
        switch (format) {
          case 'svg':
            result = await exportService.exportSVG(context, options)
            if (result.success && result.data) {
              downloadFile(result.data, `${baseFileName}.svg`, 'image/svg+xml')
            }
            break
          case 'pdf':
            result = await exportService.exportPDF(context, options)
            if (result.success && result.data) {
              downloadBlob(result.data, `${baseFileName}.pdf`)
            }
            break
          case 'dxf':
            result = await exportService.exportDXF(context, options)
            if (result.success && result.data) {
              downloadFile(result.data, `${baseFileName}.dxf`, 'application/dxf')
            }
            break
        }
        
        if (!result?.success) {
          throw new Error(result?.error || 'Export failed')
        }
        
        onClose()
      }
    } catch (error) {
      alert(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }
  
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    downloadBlob(blob, fileName)
  }
  
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  React.useEffect(() => {
    if (isOpen) {
      setFormat(initialFormat)
    }
  }, [isOpen, initialFormat])
  
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '560px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Export Inspection
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              marginTop: '4px'
            }}>
              Choose format and options for your export
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflowY: 'auto'
        }}>
          {/* Format Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              display: 'block',
              marginBottom: '12px'
            }}>
              Export Format
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {(Object.keys(FORMAT_INFO) as ExportFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  style={{
                    padding: '16px',
                    border: format === fmt ? `2px solid ${FORMAT_INFO[fmt].color}` : '2px solid #E5E7EB',
                    borderRadius: '12px',
                    backgroundColor: format === fmt ? `${FORMAT_INFO[fmt].color}10` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    if (format !== fmt) {
                      e.currentTarget.style.borderColor = '#D1D5DB'
                      e.currentTarget.style.backgroundColor = '#F9FAFB'
                    }
                  }}
                  onMouseLeave={e => {
                    if (format !== fmt) {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{FORMAT_INFO[fmt].icon}</span>
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {FORMAT_INFO[fmt].name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        marginTop: '2px'
                      }}>
                        {FORMAT_INFO[fmt].description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Content Options */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              display: 'block',
              marginBottom: '12px'
            }}>
              Include in Export
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={e => setIncludeGrid(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4B5563' }}>Grid Lines</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={e => setIncludeAnnotations(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4B5563' }}>Annotations</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDimensions}
                  onChange={e => setIncludeDimensions(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4B5563' }}>Dimensions</span>
              </label>
            </div>
          </div>
          
          {/* Background Options */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              display: 'block',
              marginBottom: '12px'
            }}>
              Background
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useTransparentBg}
                  onChange={e => setUseTransparentBg(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '8px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4B5563' }}>Transparent</span>
              </label>
              {!useTransparentBg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    style={{
                      width: '40px',
                      height: '32px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    style={{
                      width: '80px',
                      padding: '6px 8px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6B7280',
                width: '100%',
                marginBottom: showAdvanced ? '16px' : '0',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            >
              <span style={{
                transform: showAdvanced ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s'
              }}>
                ▶
              </span>
              Advanced Options
            </button>
            
            {showAdvanced && (
              <div style={{
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {format !== 'png' && (
                  <div>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#6B7280',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Scale: {scale}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={scale}
                      onChange={e => setScale(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
                
                {format === 'png' && (
                  <div>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#6B7280',
                      display: 'block',
                      marginBottom: '8px'
                    }}>
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
                
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeLegend}
                    onChange={e => setIncludeLegend(e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '10px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#4B5563' }}>Include Legend</span>
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#F9FAFB'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: FORMAT_INFO[format].color,
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.5 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Exporting...
              </>
            ) : (
              <>
                Export as {FORMAT_INFO[format].name.split(' ')[0]}
              </>
            )}
          </button>
        </div>
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
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}