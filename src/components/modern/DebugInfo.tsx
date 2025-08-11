/**
 * Debug info component to show app state
 */

import React from 'react'
import { useAppStore } from '../../stores/appStore'

export const DebugInfo: React.FC = () => {
  const store = useAppStore()

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>Beams: {store.beams.length}</div>
      <div>Current Beam: {store.currentBeamId || 'none'}</div>
      <div>Sidebar Open: {store.sidebarOpen ? 'yes' : 'no'}</div>
      <div>Active Panel: {store.activePanel || 'none'}</div>
      <div>Viewport Zoom: {store.viewport.zoom}</div>
    </div>
  )
}