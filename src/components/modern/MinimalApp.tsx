/**
 * Minimal app to test basic functionality
 */

import React, { useState } from 'react'
import { useAppStore } from '../../stores/appStore'

export const MinimalApp: React.FC = () => {
  const [showFull, setShowFull] = useState(false)
  const store = useAppStore()

  if (showFull) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 50%, #1e1e2e 100%)',
        color: '#cdd6f4',
        fontFamily: 'Inter, sans-serif',
        display: 'flex'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '300px',
          background: 'rgba(30, 30, 46, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(205, 214, 244, 0.1)',
          padding: '1rem'
        }}>
          <h2>🔧 Beam Management</h2>
          <div style={{ marginTop: '1rem' }}>
            <p>Beams: {store.beams.length}</p>
            <p>Current: {store.currentBeamId || 'none'}</p>
            <button 
              onClick={() => {
                store.addBeam({
                  id: `beam-${Date.now()}`,
                  name: `New Beam ${store.beams.length + 1}`,
                  width: 100,
                  height: 50
                })
              }}
              style={{
                background: 'rgba(116, 199, 236, 0.2)',
                border: '1px solid rgba(116, 199, 236, 0.4)',
                borderRadius: '8px',
                color: '#74c7ec',
                padding: '8px 16px',
                marginTop: '1rem',
                cursor: 'pointer'
              }}
            >
              Add Beam
            </button>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{ flex: 1, padding: '2rem' }}>
          <h1>BeamAnalyzer - Modern Interface</h1>
          <p>Zustand state working! ✅</p>
          
          <button 
            onClick={() => setShowFull(false)}
            style={{
              background: 'rgba(243, 139, 168, 0.2)',
              border: '1px solid rgba(243, 139, 168, 0.4)',
              borderRadius: '8px',
              color: '#f38ba8',
              padding: '8px 16px',
              marginTop: '1rem',
              cursor: 'pointer'
            }}
          >
            ← Back to Simple
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 50%, #1e1e2e 100%)',
      color: '#cdd6f4',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        background: 'rgba(49, 50, 68, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(205, 214, 244, 0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔧 BeamAnalyzer</h1>
        <p style={{ fontSize: '1.2rem', color: '#a6adc8', marginBottom: '2rem' }}>
          Ultra-Modern Beam Inspection Tool
        </p>
        
        <div style={{ margin: '2rem 0' }}>
          <p style={{ color: '#74c7ec', fontSize: '1rem' }}>
            ✅ React 19 + TypeScript 5.9<br/>
            ✅ Zustand State Management<br/>
            ✅ Glassmorphism UI<br/>
            ✅ WebGL Ready
          </p>
        </div>
        
        <button 
          onClick={() => setShowFull(true)}
          style={{
            background: 'rgba(116, 199, 236, 0.2)',
            border: '1px solid rgba(116, 199, 236, 0.4)',
            borderRadius: '12px',
            color: '#74c7ec',
            padding: '12px 24px',
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginRight: '1rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(116, 199, 236, 0.3)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(116, 199, 236, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          Launch App
        </button>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#585b70' }}>
          Built with modern web technologies for maximum performance
        </div>
      </div>
    </div>
  )
}