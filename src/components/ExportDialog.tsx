import React, { useState } from 'react'
import { ExportService, ExportFormat, ExportOptions } from '../services/ExportService'
import { BeamProfile, GridCell } from '../types/beam'
import { DefectType } from '../types/defects'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  beamProfile: BeamProfile
  selectedCells: GridCell[]
  defectTypes: Map<string, DefectType>
  annotations?: any[]
  gridSize: number
  dimensions: {
    startX: number
    centerY: number
    width: number
    height: number
  }
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  beamProfile,
  selectedCells,
  defectTypes,
  annotations,
  gridSize,
  dimensions
}) => {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState(2)
  const [quality, setQuality] = useState(0.92)
  const [background, setBackground] = useState('#ffffff')
  const [includeGrid, setIncludeGrid] = useState(false)
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)

    const exportService = new ExportService()
    
    const context = {
      beamProfile,
      cells: selectedCells,
      defectTypes,
      annotations,
      gridSize,
      dimensions
    }

    const options: ExportOptions = {
      format,
      scale,
      quality: format === 'jpeg' ? quality : undefined,
      background: format !== 'svg' ? background : undefined,
      includeGrid,
      includeAnnotations,
      includeDimensions,
      includeMetadata,
      fileName: `beam-inspection-${beamProfile.name.replace(/\s+/g, '-')}-${Date.now()}.${format}`
    }

    try {
      const result = await exportService.export(context, options)
      
      if (result.success) {
        ExportService.downloadFile(result)
        onClose()
      } else {
        setError(result.error || 'Export failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Export Inspection Data</h2>

        {/* Format Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Export Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="png">PNG Image (Raster)</option>
            <option value="jpeg">JPEG Image (Raster)</option>
            <option value="svg">SVG Vector Graphics</option>
            <option value="dxf">DXF (CAD Format)</option>
            <option value="json">JSON Data</option>
          </select>
        </div>

        {/* Scale (for image formats) */}
        {(format === 'png' || format === 'jpeg' || format === 'svg') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Export Scale: {scale}x
            </label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Quality (for JPEG) */}
        {format === 'jpeg' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              JPEG Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Background Color (for raster formats) */}
        {(format === 'png' || format === 'jpeg') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Background Color
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                style={{ width: '50px', height: '30px' }}
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
          </div>
        )}

        {/* Include Options */}
        {format !== 'json' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Include in Export
            </label>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Grid Lines
              </label>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Annotations
              </label>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeDimensions}
                  onChange={(e) => setIncludeDimensions(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Dimensions
              </label>
            </div>
          </div>
        )}

        {/* Export Info */}
        <div style={{
          backgroundColor: '#f0f0f0',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Export Info:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Beam: {beamProfile.name}</li>
            <li>Selected Cells: {selectedCells.length}</li>
            {annotations && <li>Annotations: {annotations.length}</li>}
            <li>Grid Size: {gridSize}px per inch</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            Error: {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: isExporting ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}