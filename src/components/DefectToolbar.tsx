import React from 'react'
import { DefectType, DEFECT_STYLES } from '../types/defects'

interface DefectToolbarProps {
  visible: boolean
  selectedDefect: DefectType
  onSelectDefect: (defect: DefectType) => void
}

const DEFECT_INFO: Record<DefectType, { label: string, description: string }> = {
  'section-loss': { label: 'Section Loss', description: 'Material loss' },
  'hole': { label: 'Hole', description: 'Complete penetration' }
}

export const DefectToolbar: React.FC<DefectToolbarProps> = ({ visible, selectedDefect, onSelectDefect }) => {
  if (!visible) return null
  
  const renderPatternPreview = (defectType: DefectType) => {
    const style = DEFECT_STYLES[defectType]
    if (!style) {
      console.warn(`No style found for defect type: ${defectType}`)
      return <div style={{ width: 30, height: 30, backgroundColor: '#ccc' }} />
    }
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
      flexWrap: 'wrap'
    }}>
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
          onClick={() => onSelectDefect(defectType)}
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
    </div>
  )
}