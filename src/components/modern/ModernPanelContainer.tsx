/**
 * Modern panel container with glassmorphism and smooth animations
 */

import React from 'react'
import './ModernPanelContainer.css'

interface ModernPanelContainerProps {
  children: React.ReactNode
  className?: string
}

export const ModernPanelContainer: React.FC<ModernPanelContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`modern-panel-container ${className}`}>
      <div className="panel-inner">
        {children}
      </div>
    </div>
  )
}