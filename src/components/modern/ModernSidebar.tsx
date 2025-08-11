/**
 * Ultra-modern collapsible sidebar with glassmorphism
 */

import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { ModernPanelContainer } from './ModernPanelContainer'
import './ModernSidebar.css'

interface PanelConfig {
  id: string
  title: string
  icon: string
  component: React.ComponentType
}

const panels: PanelConfig[] = [
  { id: 'beams', title: 'Beams', icon: '🔧', component: BeamPanel },
  { id: 'processing', title: 'Processing', icon: '⚡', component: ProcessingPanel },
  { id: 'annotations', title: 'Annotations', icon: '📝', component: AnnotationPanel },
  { id: 'export', title: 'Export', icon: '📤', component: ExportPanel }
]

export const ModernSidebar: React.FC = () => {
  const { sidebarOpen, activePanel, setActivePanel, toggleSidebar } = useAppStore(state => ({
    sidebarOpen: state.sidebarOpen,
    activePanel: state.activePanel,
    setActivePanel: state.setActivePanel,
    toggleSidebar: state.toggleSidebar
  }))

  const handlePanelClick = (panelId: string) => {
    if (activePanel === panelId) {
      setActivePanel(null)
    } else {
      setActivePanel(panelId)
      if (!sidebarOpen) {
        toggleSidebar()
      }
    }
  }

  return (
    <aside className={`modern-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-tabs">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className={`toggle-icon ${sidebarOpen ? 'expanded' : ''}`}>
            ←
          </span>
        </button>
        
        {panels.map(panel => (
          <button
            key={panel.id}
            className={`sidebar-tab ${activePanel === panel.id ? 'active' : ''}`}
            onClick={() => handlePanelClick(panel.id)}
            title={panel.title}
          >
            <span className="tab-icon">{panel.icon}</span>
            {sidebarOpen && <span className="tab-label">{panel.title}</span>}
          </button>
        ))}
      </div>

      {sidebarOpen && activePanel && (
        <div className="sidebar-content">
          <ModernPanelContainer>
            {(() => {
              const panel = panels.find(p => p.id === activePanel)
              if (!panel) return null
              const Component = panel.component
              return <Component />
            })()}
          </ModernPanelContainer>
        </div>
      )}
    </aside>
  )
}

// Panel Components
const BeamPanel: React.FC = () => {
  const { beams, currentBeam, setCurrentBeam, addBeam } = useAppStore(state => ({
    beams: state.beams,
    currentBeam: state.currentBeam(),
    setCurrentBeam: state.setCurrentBeam,
    addBeam: state.addBeam
  }))

  const handleAddBeam = () => {
    const newBeam = {
      id: `beam-${Date.now()}`,
      name: `Beam ${beams.length + 1}`,
      width: 100,
      height: 50
    }
    addBeam(newBeam)
  }

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3>🔧 Beam Management</h3>
        <button className="glass-button" onClick={handleAddBeam}>
          Add Beam
        </button>
      </div>
      
      <div className="beam-list">
        {beams.map(beam => (
          <div
            key={beam.id}
            className={`beam-item ${currentBeam?.id === beam.id ? 'active' : ''}`}
            onClick={() => setCurrentBeam(beam.id)}
          >
            <div className="beam-icon">🔧</div>
            <div className="beam-info">
              <div className="beam-name">{beam.name}</div>
              <div className="beam-size">{beam.width} × {beam.height}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ProcessingPanel: React.FC = () => {
  const { processing } = useAppStore(state => ({
    processing: state.processing
  }))

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3>⚡ Processing</h3>
      </div>
      
      {processing.isProcessing && (
        <div className="processing-status">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${processing.progress}%` }}
            />
          </div>
          <div className="processing-stage">{processing.stage}</div>
        </div>
      )}
      
      <div className="processing-controls">
        <button className="glass-button">Generate Contours</button>
        <button className="glass-button">Apply Enhancement</button>
        <button className="glass-button">Optimize</button>
      </div>
    </div>
  )
}

const AnnotationPanel: React.FC = () => {
  const { annotations, clearAnnotations } = useAppStore(state => ({
    annotations: state.annotations,
    clearAnnotations: state.clearAnnotations
  }))

  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3>📝 Annotations</h3>
        <button className="glass-button" onClick={clearAnnotations}>
          Clear All
        </button>
      </div>
      
      <div className="annotation-list">
        {annotations.map(annotation => (
          <div key={annotation.id} className="annotation-item">
            <div className="annotation-type">{annotation.type}</div>
            <div className="annotation-position">
              ({Math.round(annotation.position.x)}, {Math.round(annotation.position.y)})
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ExportPanel: React.FC = () => {
  return (
    <div className="panel-content">
      <div className="panel-header">
        <h3>📤 Export</h3>
      </div>
      
      <div className="export-options">
        <button className="glass-button">Export PNG</button>
        <button className="glass-button">Export SVG</button>
        <button className="glass-button">Export PDF</button>
        <button className="glass-button">Export JSON</button>
      </div>
    </div>
  )
}