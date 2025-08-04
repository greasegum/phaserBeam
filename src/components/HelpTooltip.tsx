import React, { useState } from 'react'

interface HelpTooltipProps {
  text: string
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <div 
      style={{ 
        display: 'inline-block', 
        position: 'relative',
        marginLeft: '4px',
        verticalAlign: 'middle'
      }}
    >
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#e0e0e0',
          color: '#666',
          fontSize: '10px',
          fontWeight: 'bold',
          cursor: 'help',
          userSelect: 'none',
          transition: 'background-color 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#d0d0d0'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#e0e0e0'
        }}
      >
        ?
      </span>
      
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            fontSize: '11px',
            lineHeight: '1.4',
            borderRadius: '4px',
            whiteSpace: 'normal',
            width: '200px',
            maxWidth: '200px',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid rgba(0, 0, 0, 0.9)'
            }}
          />
        </div>
      )}
    </div>
  )
}