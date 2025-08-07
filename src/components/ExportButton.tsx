import React, { useState } from 'react'
import { ExportDialog } from './ExportDialog'
import { BeamProfile, GridCell } from '../types/beam'
import { DefectType } from '../types/defects'

interface ExportButtonProps {
  beamProfile: BeamProfile | null
  selectedCells: GridCell[]
  defectTypes: Map<string, DefectType>
  annotations?: any[]
  gridSize?: number
  scene?: any // BeamElevationScene
  style?: React.CSSProperties
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  beamProfile,
  selectedCells,
  defectTypes,
  annotations,
  gridSize = 30,
  scene,
  style
}) => {
  const [showDialog, setShowDialog] = useState(false)

  const handleClick = () => {
    if (!beamProfile) {
      alert('No beam profile loaded')
      return
    }
    
    if (selectedCells.length === 0) {
      const proceed = window.confirm('No defects selected. Export anyway?')
      if (!proceed) return
    }
    
    setShowDialog(true)
  }

  // Calculate dimensions from scene or use defaults
  const getDimensions = () => {
    if (scene && scene.cameras) {
      const width = scene.beamLength * gridSize
      const height = (beamProfile?.webHeight || 24) * gridSize + 
                    2 * (beamProfile?.flangeThickness || 1) * gridSize
      return {
        startX: 100,
        centerY: scene.cameras.main.height / 2,
        width,
        height
      }
    }
    
    // Default dimensions
    return {
      startX: 100,
      centerY: 400,
      width: 120 * gridSize,
      height: (beamProfile?.webHeight || 24) * gridSize + 
              2 * (beamProfile?.flangeThickness || 1) * gridSize
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!beamProfile}
        style={{
          padding: '10px 20px',
          backgroundColor: beamProfile ? '#2196F3' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: beamProfile ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          ...style
        }}
        title={beamProfile ? 'Export inspection data' : 'Load a beam profile first'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Export
      </button>

      {beamProfile && (
        <ExportDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          beamProfile={beamProfile}
          selectedCells={selectedCells}
          defectTypes={defectTypes}
          annotations={annotations}
          gridSize={gridSize}
          dimensions={getDimensions()}
        />
      )}
    </>
  )
}

/**
 * Quick export button for common formats
 */
export const QuickExportButtons: React.FC<ExportButtonProps> = (props) => {
  const [exporting, setExporting] = useState<string | null>(null)
  
  const quickExport = async (format: 'png' | 'svg' | 'dxf') => {
    if (!props.beamProfile) {
      alert('No beam profile loaded')
      return
    }
    
    setExporting(format)
    
    const { ExportService } = await import('../services/ExportService')
    const exportService = new ExportService()
    
    const context = {
      beamProfile: props.beamProfile,
      cells: props.selectedCells,
      defectTypes: props.defectTypes,
      annotations: props.annotations,
      gridSize: props.gridSize || 30,
      dimensions: {
        startX: 100,
        centerY: 400,
        width: 120 * (props.gridSize || 30),
        height: (props.beamProfile.webHeight * (props.gridSize || 30)) + 
                (2 * props.beamProfile.flangeThickness * (props.gridSize || 30))
      }
    }
    
    const result = await exportService.export(context, {
      format,
      scale: 2,
      includeGrid: false,
      includeAnnotations: true,
      includeDimensions: true
    })
    
    if (result.success) {
      ExportService.downloadFile(result)
    } else {
      alert(`Export failed: ${result.error}`)
    }
    
    setExporting(null)
  }
  
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      ...props.style
    }}>
      <button
        onClick={() => quickExport('png')}
        disabled={!props.beamProfile || exporting === 'png'}
        style={{
          padding: '8px 16px',
          backgroundColor: props.beamProfile && exporting !== 'png' ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: props.beamProfile && exporting !== 'png' ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
        title="Quick export as PNG"
      >
        {exporting === 'png' ? '...' : 'PNG'}
      </button>
      
      <button
        onClick={() => quickExport('svg')}
        disabled={!props.beamProfile || exporting === 'svg'}
        style={{
          padding: '8px 16px',
          backgroundColor: props.beamProfile && exporting !== 'svg' ? '#FF9800' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: props.beamProfile && exporting !== 'svg' ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
        title="Quick export as SVG"
      >
        {exporting === 'svg' ? '...' : 'SVG'}
      </button>
      
      <button
        onClick={() => quickExport('dxf')}
        disabled={!props.beamProfile || exporting === 'dxf'}
        style={{
          padding: '8px 16px',
          backgroundColor: props.beamProfile && exporting !== 'dxf' ? '#9C27B0' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: props.beamProfile && exporting !== 'dxf' ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
        title="Quick export as DXF for CAD"
      >
        {exporting === 'dxf' ? '...' : 'DXF'}
      </button>
    </div>
  )
}