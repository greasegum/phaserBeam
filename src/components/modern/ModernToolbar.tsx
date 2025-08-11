/**
 * Ultra-modern toolbar with glassmorphism and gesture controls
 */

import React from 'react'
import { useAppStore } from '../../stores/appStore'
import './ModernToolbar.css'

interface Tool {
  id: string
  name: string
  icon: string
  hotkey?: string
}

const tools: Tool[] = [
  { id: 'select', name: 'Select', icon: '↖️', hotkey: 'V' },
  { id: 'pan', name: 'Pan', icon: '✋', hotkey: 'Space' },
  { id: 'dimension', name: 'Dimension', icon: '📏', hotkey: 'D' },
  { id: 'text', name: 'Text', icon: '📝', hotkey: 'T' },
  { id: 'arrow', name: 'Arrow', icon: '↗️', hotkey: 'A' },
  { id: 'circle', name: 'Circle', icon: '⭕', hotkey: 'C' }
]

export const ModernToolbar: React.FC = () => {
  const [activeTool, setActiveTool] = React.useState('select')
  const { sidebarOpen, toggleSidebar } = useAppStore(state => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar
  }))

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const tool = tools.find(t => 
        t.hotkey?.toLowerCase() === event.key.toLowerCase() ||
        (t.hotkey === 'Space' && event.code === 'Space')
      )
      
      if (tool) {
        event.preventDefault()
        setActiveTool(tool.id)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <header className="modern-toolbar">
      <div className="toolbar-section toolbar-left">
        <div className="app-logo">
          <span className="logo-icon">🔧</span>
          <span className="logo-text">BeamAnalyzer</span>
        </div>
      </div>

      <div className="toolbar-section toolbar-center">
        <div className="tool-group">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              title={`${tool.name} (${tool.hotkey || ''})`}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section toolbar-right">
        <div className="toolbar-controls">
          <button className="control-btn">
            <span>💾</span>
            <span>Save</span>
          </button>
          
          <button className="control-btn">
            <span>📤</span>
            <span>Export</span>
          </button>
          
          <div className="control-separator" />
          
          <button 
            className="control-btn"
            onClick={toggleSidebar}
          >
            <span>{sidebarOpen ? '👁️' : '👁️‍🗨️'}</span>
            <span>{sidebarOpen ? 'Hide' : 'Show'} Panel</span>
          </button>
        </div>
      </div>
    </header>
  )
}