import React from 'react'
import { AnnotationType } from '../types/annotations'

interface AnnotationToolbandProps {
  visible: boolean
  selectedTool: AnnotationType
  onSelectTool: (type: AnnotationType) => void
  ordinateOriginSide: 'left' | 'right'
  onToggleOrdinateOrigin: () => void
  showBeamEndDimensions: boolean
  showBottomOrdinate: boolean
  onToggleBeamEndDimensions: () => void
  onToggleBottomOrdinate: () => void
}

export const AnnotationToolband: React.FC<AnnotationToolbandProps> = ({
  visible,
  selectedTool,
  onSelectTool,
  ordinateOriginSide,
  onToggleOrdinateOrigin,
  showBeamEndDimensions,
  showBottomOrdinate,
  onToggleBeamEndDimensions,
  onToggleBottomOrdinate
}) => {
  if (!visible) return null

  const tools = [
    {
      type: 'linear-dimension' as AnnotationType,
      label: 'Linear',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10 L5 7 M2 10 L5 13 M18 10 L15 7 M18 10 L15 13 M2 10 L18 10" 
                stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
      ),
      shortcut: 'L'
    },
    {
      type: 'ordinate-dimension' as AnnotationType,
      label: 'Ordinate',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 2 L5 18 M5 5 L10 5 M5 10 L12 10 M5 15 L8 15" 
                stroke="currentColor" fill="none" strokeWidth="1.5"/>
          <text x="11" y="6" fontSize="8">0</text>
          <text x="13" y="11" fontSize="8">5</text>
          <text x="9" y="16" fontSize="8">10</text>
        </svg>
      ),
      shortcut: 'O'
    },
    {
      type: 'callout' as AnnotationType,
      label: 'Callout',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 8 L10 8 L10 4 L18 4 L18 10 L10 10 L10 8" 
                stroke="currentColor" fill="none" strokeWidth="1.5"/>
          <circle cx="3" cy="8" r="2" fill="currentColor"/>
        </svg>
      ),
      shortcut: 'C'
    }
  ]

  return (
    <div style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #e0e0e0',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      height: '48px'
    }}>
      {/* Annotation Tools */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>TOOLS:</span>
        {tools.map(tool => (
          <button
            key={tool.type}
            onClick={() => onSelectTool(tool.type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: selectedTool === tool.type ? '#4CAF50' : '#f5f5f5',
              color: selectedTool === tool.type ? 'white' : '#333',
              border: selectedTool === tool.type ? 'none' : '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
              height: '32px'
            }}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Separator */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0' }} />

      {/* Origin Control */}
      <button
        onClick={onToggleOrdinateOrigin}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: '#f5f5f5',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          height: '32px'
        }}
        title="Toggle ordinate origin"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d={ordinateOriginSide === 'left' 
            ? "M2 8 L14 8 M2 5 L2 11 M4 6 L4 10 M6 7 L6 9" 
            : "M2 8 L14 8 M14 5 L14 11 M12 6 L12 10 M10 7 L10 9"} 
            stroke="currentColor" fill="none" strokeWidth="1.5"/>
        </svg>
        <span>Origin: {ordinateOriginSide === 'left' ? 'Left' : 'Right'}</span>
      </button>

      {/* Separator */}
      <div style={{ width: '1px', height: '24px', backgroundColor: '#e0e0e0' }} />

      {/* Dimension Toggles */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>SHOW:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showBeamEndDimensions}
            onChange={onToggleBeamEndDimensions}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px' }}>End Dimensions</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showBottomOrdinate}
            onChange={onToggleBottomOrdinate}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px' }}>Bottom Ordinate</span>
        </label>
      </div>

      {/* Help text */}
      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>
        Click to place • Double-click to edit • ESC to cancel
      </div>
    </div>
  )
}