import React, { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { BeamProfile, GridCell } from '../types/beam'
import { Configuration } from './Configuration'
import { AppMode } from '../types/mode'
import { AnnotationType } from '../types/annotations'
import { DefectType } from '../types/defects'

interface PhaserCanvasProps {
  beamProfile: BeamProfile | null
  onCellChange: (cells: GridCell[]) => void
  editMode: boolean
  beamLength: number
  showGrid?: boolean
  gridOrigin?: 'left' | 'right'
  showTopFlange?: boolean
  gridCells?: GridCell[]
  elevationView?: 'N' | 'S' | 'E' | 'W'
  appMode?: AppMode
  selectedAnnotationTool?: AnnotationType
  onSelectAnnotationTool?: (tool: AnnotationType) => void
  ordinateOriginSide?: 'left' | 'right'
  onToggleOrdinateOrigin?: () => void
  showBeamEndDimensions?: boolean
  showBottomOrdinate?: boolean
  spanLength?: number
  zoom?: number
  selectedDefectType?: DefectType
  onSceneReady?: (scene: BeamElevationScene) => void
}

export const PhaserCanvas: React.FC<PhaserCanvasProps> = ({ 
  beamProfile, 
  onCellChange, 
  editMode,
  beamLength,
  showGrid = true,
  gridOrigin = 'left',
  showTopFlange = true,
  gridCells = [],
  elevationView = 'N',
  appMode = 'edit',
  selectedAnnotationTool = 'linear-dimension',
  onSelectAnnotationTool,
  ordinateOriginSide = 'left',
  onToggleOrdinateOrigin,
  showBeamEndDimensions = true,
  showBottomOrdinate = true,
  spanLength = 96,
  zoom = 1.0,
  selectedDefectType = 'section-loss',
  onSceneReady,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentScene, setCurrentScene] = useState<BeamElevationScene | undefined>(undefined)

  useEffect(() => {
    if (!containerRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight - 100, // Account for header and footer
      parent: containerRef.current,
      backgroundColor: '#f0f0f0',
      scene: [BeamElevationScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 }
        }
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.NO_CENTER
      }
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      gameRef.current?.destroy(true)
    }
  }, [])

  useEffect(() => {
    if (!gameRef.current || !beamProfile) return
    
    // Calculate required canvas width based on beam length
    const padding = 100
    const gridSize = 40 // Match the max grid size from BeamElevationScene
    const requiredWidth = beamLength * gridSize + padding * 2
    const canvasWidth = Math.max(window.innerWidth, requiredWidth)
    
    // Resize the game canvas if needed
    if (gameRef.current.scale.width !== canvasWidth) {
      gameRef.current.scale.resize(canvasWidth, window.innerHeight - 100)
    }
    
    // Update container div width to enable scrolling
    if (containerRef.current && containerRef.current.parentElement) {
      containerRef.current.style.width = `${canvasWidth}px`
    }
    
    // Start or restart scene with new data
    const scene = gameRef.current.scene.getScene('BeamElevationScene') as BeamElevationScene
    if (scene) {
      setCurrentScene(scene)
      onSceneReady?.(scene)
      if (scene.scene.isActive()) {
        scene.updateBeamProfile(beamProfile, beamLength, editMode, showGrid, gridOrigin, showTopFlange, gridCells, elevationView, appMode, spanLength, selectedDefectType)
      } else {
        scene.scene.start('BeamElevationScene', { 
          beamProfile, 
          beamLength,
          editMode,
          onCellChange,
          showGrid,
          gridOrigin,
          showTopFlange,
          gridCells,
          elevationView,
          appMode,
          spanLength,
          zoom,
          selectedDefectType,
          savedAnnotations: [],
        })
      }
    } else {
      // Wait for scene to be ready
      gameRef.current.events.once('ready', () => {
        const readyScene = gameRef.current?.scene.getScene('BeamElevationScene') as BeamElevationScene
        if (readyScene) {
          setCurrentScene(readyScene)
          onSceneReady?.(readyScene)
          readyScene.scene.start('BeamElevationScene', { 
            beamProfile, 
            beamLength,
            editMode,
            onCellChange,
            showGrid,
            gridOrigin,
            showTopFlange,
            gridCells,
            elevationView,
            appMode,
            spanLength,
            zoom,
            selectedDefectType,
            })
        }
      })
    }
  }, [beamProfile, beamLength, editMode, onCellChange, showGrid, gridOrigin, showTopFlange, gridCells, elevationView, appMode, spanLength, zoom, selectedDefectType])

  if (!beamProfile) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        fontSize: '18px',
        color: '#666'
      }}>
        <p>Please select a beam profile to begin</p>
      </div>
    )
  }

  // Add mouse wheel handler for horizontal scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (scrollContainerRef.current) {
        e.preventDefault()
        // Convert vertical scroll to horizontal
        scrollContainerRef.current.scrollLeft += e.deltaY
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      
      return () => {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [])
  
  // Handle annotation mode activation and tool switching
  useEffect(() => {
    if (appMode === 'annotation' && currentScene && selectedAnnotationTool) {
      // Start/switch annotation tool when mode changes OR tool changes
      setTimeout(() => {
        console.log('Starting annotation tool:', selectedAnnotationTool)
        currentScene.annotationManager?.startCreatingAnnotation(selectedAnnotationTool)
      }, 100)
    }
  }, [appMode, currentScene, selectedAnnotationTool])
  
  // Handle zoom changes
  useEffect(() => {
    if (currentScene && gameRef.current) {
      currentScene.cameras.main.setZoom(zoom)
    }
  }, [zoom, currentScene])

  // Tool switching is now handled by the useEffect above

  return (
    <>
      <div ref={scrollContainerRef} style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative' }}>
        <div ref={containerRef} style={{ minWidth: '100%', height: '100%' }} />
      </div>
      <Configuration scene={currentScene} />
    </>
  )
}