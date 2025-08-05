import React, { useState } from 'react'

interface ZoomControlProps {
  currentZoom: number
  onZoomChange: (zoom: number) => void
}

const ZOOM_LEVELS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1.0 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2.0 },
]

export const ZoomControl: React.FC<ZoomControlProps> = ({ currentZoom, onZoomChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const currentZoomLevel = ZOOM_LEVELS.find(level => Math.abs(level.value - currentZoom) < 0.01) || { label: `${Math.round(currentZoom * 100)}%`, value: currentZoom }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '40px', // Position above footer
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      borderRadius: '10px',
      transition: 'all 0.3s ease',
      zIndex: 1000
    }}>
      {/* Pull tab */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 20px',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid #eee' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '14px', color: '#666' }}>
          Zoom: {currentZoomLevel.label}
        </span>
        <span style={{
          fontSize: '12px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          ▲
        </span>
      </div>
      
      {/* Zoom options */}
      {isOpen && (
        <div style={{
          padding: '10px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          maxWidth: '400px'
        }}>
          {ZOOM_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => {
                onZoomChange(level.value)
                setIsOpen(false)
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: Math.abs(level.value - currentZoom) < 0.01 ? '#4CAF50' : 'white',
                color: Math.abs(level.value - currentZoom) < 0.01 ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (Math.abs(level.value - currentZoom) >= 0.01) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }
              }}
              onMouseLeave={(e) => {
                if (Math.abs(level.value - currentZoom) >= 0.01) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
            >
              {level.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}