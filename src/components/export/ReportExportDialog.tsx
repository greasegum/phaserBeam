import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'
import type { GridCell } from '../../types/beam'

interface ReportExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onExport: (options: ReportExportOptions) => void
  currentScene?: any
  gridCells?: GridCell[]
  beamProfile?: any
}

export interface ReportExportOptions {
  format: 'matlab' | 'csv' | 'json'
  includeHeader: boolean
  includeBeamProperties: boolean
  includeSectionLossMatrix: boolean
  includeStatistics: boolean
  coordinateSystem: 'grid' | 'inches' | 'feet'
}

export const ReportExportDialog: React.FC<ReportExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  currentScene,
  gridCells = [],
  beamProfile
}) => {
  const [format, setFormat] = useState<'matlab' | 'csv' | 'json'>('matlab')
  const [includeHeader, setIncludeHeader] = useState(true)
  const [includeBeamProperties, setIncludeBeamProperties] = useState(true)
  const [includeSectionLossMatrix, setIncludeSectionLossMatrix] = useState(true)
  const [includeStatistics, setIncludeStatistics] = useState(true)
  const [coordinateSystem, setCoordinateSystem] = useState<'grid' | 'inches' | 'feet'>('inches')

  const handleExport = () => {
    onExport({
      format,
      includeHeader,
      includeBeamProperties,
      includeSectionLossMatrix,
      includeStatistics,
      coordinateSystem
    })
    onClose()
  }

  // Calculate statistics
  const webCells = gridCells.filter(cell => cell.zone === 'web')
  const sectionLossPercentage = beamProfile ? 
    ((webCells.length * 1 * 1) / (beamProfile.webHeight * beamProfile.webThickness * 120)) * 100 : 0

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Analysis Report"
      icon="📊"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Format Selection */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Export Format
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { value: 'matlab', label: 'MATLAB', desc: '.m file for LRFD analysis' },
              { value: 'csv', label: 'CSV', desc: 'Spreadsheet compatible' },
              { value: 'json', label: 'JSON', desc: 'Structured data' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value as typeof format)}
                style={{
                  padding: '12px',
                  border: format === option.value ? '2px solid #FF9800' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: format === option.value ? '#FFF3E0' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {option.label}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {option.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Coordinate System */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Coordinate System
          </label>
          <select
            value={coordinateSystem}
            onChange={(e) => setCoordinateSystem(e.target.value as typeof coordinateSystem)}
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
            <option value="grid">Grid Indices (0-based)</option>
            <option value="inches">Inches from Origin</option>
            <option value="feet">Feet from Origin</option>
          </select>
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
            Include in Report
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'header', label: 'File Header', value: includeHeader, setter: setIncludeHeader, desc: 'Timestamp and metadata' },
              { key: 'properties', label: 'Beam Properties', value: includeBeamProperties, setter: setIncludeBeamProperties, desc: 'Dimensions and material properties' },
              { key: 'matrix', label: 'Section Loss Matrix', value: includeSectionLossMatrix, setter: setIncludeSectionLossMatrix, desc: 'Grid-based loss data' },
              { key: 'statistics', label: 'Statistical Analysis', value: includeStatistics, setter: setIncludeStatistics, desc: 'Loss percentages and moment reduction' }
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
                  e.currentTarget.style.borderColor = '#FF9800'
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

        {/* Preview */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Data Preview
          </label>
          <div style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px solid #e0e0e0'
          }}>
            {format === 'matlab' && (
              <pre style={{ margin: 0 }}>
{`% Beam Section Loss Analysis
% Generated: ${new Date().toISOString()}
% Beam: ${beamProfile?.name || 'Unknown'}

% Section Loss Data (1 = loss, 0 = intact)
sectionLoss = [
  ${webCells.length > 0 ? '1 0 0 1 0;' : '0 0 0 0 0;'}
  ${webCells.length > 0 ? '0 1 1 0 0;' : '0 0 0 0 0;'}
  ${webCells.length > 0 ? '0 0 1 1 0;' : '0 0 0 0 0;'}
];

% Statistics
totalLoss = ${sectionLossPercentage.toFixed(2)}; % percent
criticalLocation = [${webCells.length > 0 ? '2, 3' : '0, 0'}];`}
              </pre>
            )}
            {format === 'csv' && (
              <pre style={{ margin: 0 }}>
{`x,y,zone,loss_type
${webCells.slice(0, 3).map(cell => `${cell.x},${cell.y},${cell.zone},section-loss`).join('\n')}`}
              </pre>
            )}
            {format === 'json' && (
              <pre style={{ margin: 0 }}>
{JSON.stringify({
  beam: beamProfile?.name,
  sectionLoss: webCells.slice(0, 2),
  statistics: { totalLoss: sectionLossPercentage }
}, null, 2).slice(0, 200) + '...'}
              </pre>
            )}
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
              backgroundColor: '#FF9800',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F57C00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
          >
            Export Report
          </button>
        </div>
      </div>
    </BaseExportDialog>
  )
}