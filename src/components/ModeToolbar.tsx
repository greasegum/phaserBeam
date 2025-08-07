import React from 'react'
import { AppMode } from '../types/mode'
import { AnnotationType } from '../types/annotations'
import { DefectType, DEFECT_STYLES } from '../types/defects'

interface ModeToolbarProps {
  appMode: AppMode
  // For annotation mode
  selectedAnnotationTool?: AnnotationType
  onSelectAnnotationTool?: (tool: AnnotationType) => void
  ordinateOriginSide?: 'left' | 'right'
  onToggleOrdinateOrigin?: () => void
  showBeamEndDimensions?: boolean
  showBottomOrdinate?: boolean
  onToggleBeamEndDimensions?: () => void
  onToggleBottomOrdinate?: () => void
  // For edit mode
  selectedDefect?: DefectType
  onSelectDefect?: (defect: DefectType) => void
  // For view mode
  onExport?: (format: 'pdf' | 'png' | 'svg') => void
  // For debug
  showDebugVisualization?: boolean
  onToggleDebugVisualization?: () => void
}

const ANNOTATION_TOOLS: { type: AnnotationType; label: string; shortcut: string }[] = [
  { type: 'linear-dimension', label: 'Linear Dimension', shortcut: 'L' },
  { type: 'ordinate-dimension', label: 'Ordinate Dimension', shortcut: 'O' },
  { type: 'callout', label: 'Callout', shortcut: 'C' }
]

const DEFECT_INFO: Record<DefectType, { label: string, description: string }> = {
  'section-loss': { label: 'Section Loss', description: 'Material loss' },
  'hole': { label: 'Hole', description: 'Complete penetration' }
}

export const ModeToolbar: React.FC<ModeToolbarProps> = ({
  appMode,
  selectedAnnotationTool = 'linear-dimension',
  onSelectAnnotationTool,
  ordinateOriginSide = 'left',
  onToggleOrdinateOrigin,
  showBeamEndDimensions = true,
  showBottomOrdinate = true,
  onToggleBeamEndDimensions,
  onToggleBottomOrdinate,
  selectedDefect = 'section-loss',
  onSelectDefect,
  onExport,
  showDebugVisualization = false,
  onToggleDebugVisualization
}) => {
  
  const renderPatternPreview = (defectType: DefectType) => {
    const style = DEFECT_STYLES[defectType]
    const size = 30
    
    return (
      <svg width={size} height={size} style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
        {/* Base fill */}
        <rect 
          width={size} 
          height={size} 
          fill={`#${style.fillColor.toString(16).padStart(6, '0')}`}
          fillOpacity={style.fillAlpha}
        />
        
        {/* Pattern overlay */}
        {style.pattern && (
          <>
            {style.pattern.type === 'dots' && (
              <g>
                {Array.from({ length: Math.ceil(size / style.pattern.spacing) }).map((_, i) =>
                  Array.from({ length: Math.ceil(size / style.pattern.spacing) }).map((_, j) => (
                    <circle
                      key={`${i}-${j}`}
                      cx={i * style.pattern.spacing + style.pattern.spacing / 2}
                      cy={j * style.pattern.spacing + style.pattern.spacing / 2}
                      r={style.pattern.size || 2}
                      fill={`#${style.pattern.color.toString(16).padStart(6, '0')}`}
                      fillOpacity={style.pattern.alpha}
                    />
                  ))
                )}
              </g>
            )}
            
            {style.pattern.type === 'diagonal-lines' && (
              <g>
                {Array.from({ length: Math.ceil(size * 2 / style.pattern.spacing) }).map((_, i) => {
                  const offset = i * style.pattern.spacing
                  const angle = style.pattern.angle || 45
                  const rad = (angle * Math.PI) / 180
                  const cos = Math.cos(rad)
                  const sin = Math.sin(rad)
                  
                  return (
                    <line
                      key={i}
                      x1={offset * cos}
                      y1={0}
                      x2={0}
                      y2={offset * sin}
                      stroke={`#${style.pattern.color.toString(16).padStart(6, '0')}`}
                      strokeOpacity={style.pattern.alpha}
                      strokeWidth={style.pattern.lineWidth || 1}
                    />
                  )
                })}
              </g>
            )}
          </>
        )}
      </svg>
    )
  }
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #ddd',
      padding: '10px 20px',
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
      flexWrap: 'wrap',
      minHeight: '60px'
    }}>
      {appMode === 'annotation' && (
        <>
          <span style={{ 
            fontWeight: 'bold', 
            marginRight: '10px',
            fontSize: '14px',
            color: '#333'
          }}>
            Annotation Tools:
          </span>
          
          {ANNOTATION_TOOLS.map(tool => (
            <button
              key={tool.type}
              onClick={() => onSelectAnnotationTool?.(tool.type)}
              style={{
                padding: '6px 12px',
                border: selectedAnnotationTool === tool.type ? '2px solid #2196F3' : '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: selectedAnnotationTool === tool.type ? '#E3F2FD' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
              title={`Keyboard shortcut: ${tool.shortcut}`}
            >
              {tool.label}
              <span style={{ 
                fontSize: '11px', 
                color: '#666',
                backgroundColor: '#f0f0f0',
                padding: '2px 5px',
                borderRadius: '3px'
              }}>
                {tool.shortcut}
              </span>
            </button>
          ))}
          
          <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd', margin: '0 10px' }} />
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ordinateOriginSide === 'right'}
              onChange={onToggleOrdinateOrigin}
              style={{ cursor: 'pointer' }}
            />
            Ordinate from {ordinateOriginSide === 'left' ? 'Left' : 'Right'}
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showBeamEndDimensions}
              onChange={onToggleBeamEndDimensions}
              style={{ cursor: 'pointer' }}
            />
            Show Beam End Dimensions
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showBottomOrdinate}
              onChange={onToggleBottomOrdinate}
              style={{ cursor: 'pointer' }}
            />
            Show Bottom Ordinate
          </label>
        </>
      )}
      
      {appMode === 'edit' && (
        <>
          <span style={{ 
            fontWeight: 'bold', 
            marginRight: '10px',
            fontSize: '14px',
            color: '#333'
          }}>
            Defect Type:
          </span>
          
          {(Object.keys(DEFECT_INFO) as DefectType[]).map(defectType => (
            <button
              key={defectType}
              onClick={() => onSelectDefect?.(defectType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                border: selectedDefect === defectType ? '2px solid #4CAF50' : '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: selectedDefect === defectType ? '#E8F5E9' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedDefect !== defectType) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedDefect !== defectType) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
              title={DEFECT_INFO[defectType].description}
            >
              {renderPatternPreview(defectType)}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {DEFECT_INFO[defectType].label}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {DEFECT_INFO[defectType].description}
                </div>
              </div>
            </button>
          ))}
          
          <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd', margin: '0 10px' }} />
          
          <button
            onClick={onToggleDebugVisualization}
            style={{
              padding: '6px 12px',
              border: showDebugVisualization ? '2px solid #FF6B6B' : '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: showDebugVisualization ? '#FFE3E3' : 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s ease'
            }}
            title="Show all three line types simultaneously for debugging"
          >
            <span style={{ fontSize: '16px' }}>🐛</span>
            Debug Lines
          </button>
        </>
      )}
      
      {appMode === 'view' && (
        <>
          <span style={{ 
            fontWeight: 'bold', 
            marginRight: '10px',
            fontSize: '14px',
            color: '#333'
          }}>
            Export:
          </span>
          
          <button
            onClick={() => onExport?.('png')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontSize: '16px' }}>🖼️</span>
            PNG
          </button>
          
          <button
            onClick={() => onExport?.('svg')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontSize: '16px' }}>📐</span>
            SVG
          </button>
          
          <button
            onClick={() => onExport?.('pdf')}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontSize: '16px' }}>📄</span>
            PDF
          </button>
          
          <div style={{ width: '1px', height: '30px', backgroundColor: '#ddd', margin: '0 10px' }} />
          
          {/* Stubbed future features */}
          <button
            disabled
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'not-allowed',
              fontSize: '14px',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Coming soon"
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            Report
          </button>
          
          <button
            disabled
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'not-allowed',
              fontSize: '14px',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Coming soon"
          >
            <span style={{ fontSize: '16px' }}>📤</span>
            Share
          </button>
          
          <button
            disabled
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'not-allowed',
              fontSize: '14px',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Coming soon"
          >
            <span style={{ fontSize: '16px' }}>🖨️</span>
            Print
          </button>
        </>
      )}
    </div>
  )
}