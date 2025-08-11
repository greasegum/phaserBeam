/**
 * Ultra-modern layout with glassmorphism and contemporary design
 */

import React from 'react'
import { useAppStore } from '../../stores/appStore'
import { ModernSidebar } from './ModernSidebar'
import { ModernCanvas } from './ModernCanvas'
import { ModernStatusBar } from './ModernStatusBar'
import { ModernToolbar } from './ModernToolbar'
import { DebugInfo } from './DebugInfo'
import './ModernLayout.css'

export const ModernLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppStore(state => ({
    sidebarOpen: state.sidebarOpen,
    toggleSidebar: state.toggleSidebar
  }))

  return (
    <div className="modern-layout">
      <DebugInfo />
      
      <div className="layout-header">
        <ModernToolbar />
      </div>
      
      <div className="layout-body">
        <ModernSidebar />
        
        <main className={`layout-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <ModernCanvas />
        </main>
      </div>
      
      <div className="layout-footer">
        <ModernStatusBar />
      </div>
    </div>
  )
}