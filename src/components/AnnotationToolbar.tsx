import React from 'react'
import { AnnotationType } from '../types/annotations'

interface AnnotationToolbarProps {
  onSelectTool: (type: AnnotationType) => void
  selectedTool: AnnotationType
  visible: boolean
  ordinateOriginSide: 'left' | 'right'
  onToggleOrdinateOrigin: () => void
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  onSelectTool,
  selectedTool,
  visible,
  ordinateOriginSide,
  onToggleOrdinateOrigin
}) => {
  if (!visible) return null

  const tools = [
    {
      type: 'linear-dimension' as AnnotationType,
      label: 'Linear Dimension',
      icon: '↔',
      shortcut: 'L'
    },
    {
      type: 'ordinate-dimension' as AnnotationType,
      label: 'Ordinate Dimension',
      icon: '↕',
      shortcut: 'O'
    },
    {
      type: 'callout' as AnnotationType,
      label: 'Callout',
      icon: '💬',
      shortcut: 'C'
    }
  ]

  return (
    <div style={{
      position: 'absolute',
      top: '70px',
      left: '20px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      zIndex: 1000
    }}>
      <h3 style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#333'
      }}>Annotation Tools</h3>
      
      {tools.map(tool => (
        <button
          key={tool.type}
          onClick={() => onSelectTool(tool.type)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: selectedTool === tool.type ? '#4CAF50' : '#f5f5f5',
            color: selectedTool === tool.type ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          title={`${tool.label} (${tool.shortcut})`}
        >
          <span style={{ fontSize: '18px' }}>{tool.icon}</span>
          <span>{tool.label}</span>
          <span style={{
            marginLeft: 'auto',
            fontSize: '12px',
            opacity: 0.7
          }}>({tool.shortcut})</span>
        </button>
      ))}
      
      {selectedTool === 'ordinate-dimension' && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={onToggleOrdinateOrigin}
            style={{
              width: '100%',
              padding: '6px 12px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Origin: {ordinateOriginSide === 'left' ? 'Left End' : 'Right End'}</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>Click to toggle</span>
          </button>
        </div>
      )}
      
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #eee',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>Click to place annotations</div>
        <div>ESC to cancel</div>
      </div>
    </div>
  )
}