import React from 'react'
import { AppMode } from '../types/mode'
import { AnnotationType } from '../types/annotations'
import { DefectType, DEFECT_STYLES } from '../types/defects'

interface StreamlinedToolbarProps {
  appMode: AppMode
  // Edit mode
  selectedDefect?: DefectType
  onSelectDefect?: (defect: DefectType) => void
  // Annotation mode
  selectedAnnotationTool?: AnnotationType
  onSelectAnnotationTool?: (tool: AnnotationType) => void
  // View mode
  onExport?: () => void
  onOpenSettings?: () => void
}

const TOOLS = {
  edit: [
    { id: 'section-loss', label: 'Section Loss', icon: '🔴', description: 'Mark material loss' },
    { id: 'hole', label: 'Hole', icon: '🔵', description: 'Mark complete penetration' }
  ],
  annotation: [
    { id: 'linear-dimension', label: 'Linear', icon: '📏', shortcut: 'L' },
    { id: 'ordinate-dimension', label: 'Ordinate', icon: '📐', shortcut: 'O' },
    { id: 'callout', label: 'Callout', icon: '💬', shortcut: 'C' }
  ]
}

export const StreamlinedToolbar: React.FC<StreamlinedToolbarProps> = ({
  appMode,
  selectedDefect = 'section-loss',
  onSelectDefect,
  selectedAnnotationTool = 'linear-dimension',
  onSelectAnnotationTool,
  onExport,
  onOpenSettings
}) => {
  const renderEditMode = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Defect Type
      </span>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {TOOLS.edit.map(tool => (
          <button
            key={tool.id}
            onClick={() => onSelectDefect?.(tool.id as DefectType)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              border: selectedDefect === tool.id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: selectedDefect === tool.id ? '#EFF6FF' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (selectedDefect !== tool.id) {
                e.currentTarget.style.backgroundColor = '#F9FAFB'
              }
            }}
            onMouseLeave={e => {
              if (selectedDefect !== tool.id) {
                e.currentTarget.style.backgroundColor = 'white'
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{tool.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                {tool.label}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                {tool.description}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#6B7280',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
        >
          ⚙️ Settings
        </button>
      </div>
    </div>
  )
  
  const renderAnnotationMode = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 20px',
      backgroundColor: 'white',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Annotation Tool
      </span>
      
      <div style={{ display: 'flex', gap: '4px' }}>
        {TOOLS.annotation.map(tool => (
          <button
            key={tool.id}
            onClick={() => onSelectAnnotationTool?.(tool.id as AnnotationType)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: selectedAnnotationTool === tool.id ? '2px solid #10B981' : '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: selectedAnnotationTool === tool.id ? '#F0FDF4' : 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (selectedAnnotationTool !== tool.id) {
                e.currentTarget.style.backgroundColor = '#F9FAFB'
              }
            }}
            onMouseLeave={e => {
              if (selectedAnnotationTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'white'
              }
            }}
            title={`Press ${tool.shortcut} key`}
          >
            <span style={{ fontSize: '16px' }}>{tool.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
              {tool.label}
            </span>
            <kbd style={{
              padding: '2px 6px',
              backgroundColor: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#6B7280'
            }}>
              {tool.shortcut}
            </kbd>
          </button>
        ))}
      </div>
      
      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#6B7280',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
        >
          ⚙️ Settings
        </button>
      </div>
    </div>
  )
  
  const renderViewMode = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '16px 20px',
      backgroundColor: '#F9FAFB',
      borderBottom: '1px solid #E5E7EB'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: '#6B7280'
      }}>
        <span style={{ fontSize: '16px' }}>✅</span>
        <span>Ready for export</span>
      </div>
      
      <button
        onClick={onExport}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          backgroundColor: '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#059669'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#10B981'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
        Export Inspection
      </button>
      
      <button
        onClick={onOpenSettings}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: '#6B7280',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
      >
        ⚙️ Settings
      </button>
    </div>
  )
  
  switch (appMode) {
    case 'edit':
      return renderEditMode()
    case 'annotation':
      return renderAnnotationMode()
    case 'view':
      return renderViewMode()
    default:
      return null
  }
}