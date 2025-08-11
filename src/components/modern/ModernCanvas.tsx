/**
 * Modern WebGL-powered canvas with performance optimizations
 */

import React, { useEffect, useRef, useState } from 'react'
import { useAppStore, useViewport } from '../../stores/appStore'
import { ModernCanvasRenderer } from '../../core/rendering/ModernCanvasRenderer'
import './ModernCanvas.css'

export const ModernCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<ModernCanvasRenderer | null>(null)
  const [fps, setFps] = useState(0)
  const [isWebGLSupported, setIsWebGLSupported] = useState(true)
  
  const { viewport, setViewport } = useViewport()
  const { currentBeam, processing, performanceMetrics, updatePerformanceMetrics } = useAppStore(state => ({
    currentBeam: state.currentBeam(),
    processing: state.processing,
    performanceMetrics: state.performanceMetrics,
    updatePerformanceMetrics: state.updatePerformanceMetrics
  }))

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      const renderer = new ModernCanvasRenderer(canvasRef.current)
      rendererRef.current = renderer
      
      // Set up performance monitoring
      let frameCount = 0
      let lastTime = performance.now()
      
      const updateFPS = () => {
        const currentTime = performance.now()
        frameCount++
        
        if (currentTime - lastTime >= 1000) {
          const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime))
          setFps(currentFPS)
          updatePerformanceMetrics({ fps: currentFPS })
          frameCount = 0
          lastTime = currentTime
        }
        
        requestAnimationFrame(updateFPS)
      }
      
      requestAnimationFrame(updateFPS)
      
    } catch (error) {
      console.error('Failed to initialize WebGL renderer:', error)
      setIsWebGLSupported(false)
    }

    return () => {
      rendererRef.current?.dispose()
    }
  }, [updatePerformanceMetrics])

  // Handle viewport updates
  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.setViewport(viewport)
  }, [viewport])

  // Handle beam updates
  useEffect(() => {
    if (!rendererRef.current || !currentBeam) return
    rendererRef.current.setBeamData(currentBeam)
  }, [currentBeam])

  // Mouse interaction handlers
  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const startX = event.clientX - rect.left
    const startY = event.clientY - rect.top
    let isDragging = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging && (
        Math.abs(moveEvent.clientX - event.clientX) > 3 ||
        Math.abs(moveEvent.clientY - event.clientY) > 3
      )) {
        isDragging = true
      }

      if (isDragging) {
        const deltaX = (moveEvent.clientX - rect.left - startX) / viewport.zoom
        const deltaY = (moveEvent.clientY - rect.top - startY) / viewport.zoom
        
        setViewport({
          pan: {
            x: viewport.pan.x + deltaX,
            y: viewport.pan.y + deltaY
          }
        })
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1
    const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * zoomFactor))
    
    // Zoom towards mouse position
    const worldX = (mouseX - viewport.pan.x) / viewport.zoom
    const worldY = (mouseY - viewport.pan.y) / viewport.zoom
    
    setViewport({
      zoom: newZoom,
      pan: {
        x: mouseX - worldX * newZoom,
        y: mouseY - worldY * newZoom
      }
    })
  }

  const handleCanvasResize = () => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    setViewport({
      bounds: {
        width: rect.width,
        height: rect.height
      }
    })
  }

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleCanvasResize)
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [])

  if (!isWebGLSupported) {
    return (
      <div className="canvas-fallback">
        <div className="fallback-message">
          <h3>WebGL Not Supported</h3>
          <p>Your browser doesn't support WebGL. Please use a modern browser for the best experience.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-canvas-container">
      <canvas
        ref={canvasRef}
        className="modern-canvas"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      />
      
      {/* Performance overlay */}
      <div className="canvas-overlay">
        <div className="performance-indicators">
          <div className="fps-indicator">
            <span className="indicator-label">FPS:</span>
            <span className={`fps-value ${fps < 30 ? 'fps-low' : fps < 50 ? 'fps-medium' : 'fps-high'}`}>
              {fps}
            </span>
          </div>
          
          <div className="zoom-indicator">
            <span className="indicator-label">Zoom:</span>
            <span className="zoom-value">{Math.round(viewport.zoom * 100)}%</span>
          </div>
        </div>
        
        {processing.isProcessing && (
          <div className="processing-overlay">
            <div className="processing-spinner"></div>
            <div className="processing-text">{processing.stage}</div>
          </div>
        )}
      </div>
      
      {/* Canvas controls */}
      <div className="canvas-controls">
        <button 
          className="control-button"
          onClick={() => setViewport({ zoom: 1, pan: { x: 0, y: 0 } })}
          title="Reset view"
        >
          🎯
        </button>
        <button 
          className="control-button"
          onClick={() => setViewport({ zoom: viewport.zoom * 1.2 })}
          title="Zoom in"
        >
          🔍+
        </button>
        <button 
          className="control-button"
          onClick={() => setViewport({ zoom: viewport.zoom / 1.2 })}
          title="Zoom out"
        >
          🔍−
        </button>
      </div>
    </div>
  )
}