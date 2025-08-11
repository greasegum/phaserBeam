/**
 * Modern status bar with performance metrics and context info
 */

import React from 'react'
import { useAppStore } from '../../stores/appStore'
import './ModernStatusBar.css'

export const ModernStatusBar: React.FC = () => {
  const { 
    currentBeam, 
    annotations, 
    processing, 
    viewport, 
    performanceMetrics 
  } = useAppStore(state => ({
    currentBeam: state.currentBeam(),
    annotations: state.annotations,
    processing: state.processing,
    viewport: state.viewport,
    performanceMetrics: state.performanceMetrics
  }))

  const formatNumber = (num: number, decimals = 1) => {
    return num.toFixed(decimals)
  }

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value >= thresholds[1]) return 'status-good'
    if (value >= thresholds[0]) return 'status-warning'
    return 'status-error'
  }

  return (
    <footer className="modern-status-bar">
      <div className="status-section status-left">
        <div className="status-item">
          <span className="status-icon">🔧</span>
          <span className="status-text">
            {currentBeam ? currentBeam.name : 'No beam selected'}
          </span>
        </div>
        
        {currentBeam && (
          <div className="status-item">
            <span className="status-icon">📐</span>
            <span className="status-text">
              {currentBeam.width} × {currentBeam.height}
            </span>
          </div>
        )}
        
        <div className="status-item">
          <span className="status-icon">📝</span>
          <span className="status-text">
            {annotations.length} annotations
          </span>
        </div>
      </div>

      <div className="status-section status-center">
        {processing.isProcessing && (
          <div className="status-item processing">
            <div className="processing-spinner-small"></div>
            <span className="status-text">{processing.stage}</span>
            <div className="progress-bar-small">
              <div 
                className="progress-fill-small"
                style={{ width: `${processing.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="status-section status-right">
        <div className="status-item">
          <span className="status-icon">🔍</span>
          <span className="status-text">
            {Math.round(viewport.zoom * 100)}%
          </span>
        </div>
        
        <div className="status-separator" />
        
        <div className="status-item">
          <span className="status-icon">⚡</span>
          <span className={`status-text ${getStatusColor(performanceMetrics.fps || 0, [30, 50])}`}>
            {performanceMetrics.fps ? `${formatNumber(performanceMetrics.fps, 0)} FPS` : 'N/A'}
          </span>
        </div>
        
        {performanceMetrics.memory && (
          <div className="status-item">
            <span className="status-icon">💾</span>
            <span className="status-text">
              {formatNumber(performanceMetrics.memory / 1024 / 1024)} MB
            </span>
          </div>
        )}
        
        <div className="status-separator" />
        
        <div className="status-item cursor-coords">
          <span className="status-icon">📍</span>
          <span className="status-text" id="cursor-position">
            (0, 0)
          </span>
        </div>
        
        <div className="status-item time">
          <Clock />
        </div>
      </div>
    </footer>
  )
}

const Clock: React.FC = () => {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <span className="status-icon">🕐</span>
      <span className="status-text">
        {time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </span>
    </>
  )
}