import { useState, useEffect, useCallback, useRef } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { BeamProfile, GridCell } from '../types/beam'
import { AppMode } from '../types/mode'
import { DefectType } from '../types/defects'

export interface BeamSceneConfig {
  beamProfile: BeamProfile
  beamLength?: number
  editMode?: boolean
  showGrid?: boolean
  gridOrigin?: 'left' | 'right'
  showTopFlange?: boolean
  elevationView?: 'N' | 'S' | 'E' | 'W'
  appMode?: AppMode
  spanLength?: number
  selectedDefectType?: DefectType
}

export interface BeamSceneState {
  scene: BeamElevationScene | null
  selectedCells: GridCell[]
  isReady: boolean
  error: string | null
}

export interface BeamSceneActions {
  updateConfig: (config: Partial<BeamSceneConfig>) => void
  redraw: () => void
  clearSelection: () => void
  exportData: () => any
  setSelectedDefectType: (defectType: DefectType) => void
}

/**
 * Hook for managing Phaser BeamElevationScene from React
 */
export function useBeamScene(
  initialConfig: BeamSceneConfig,
  onCellChange?: (cells: GridCell[]) => void
): [BeamSceneState, BeamSceneActions] {
  const [scene, setScene] = useState<BeamElevationScene | null>(null)
  const [selectedCells, setSelectedCells] = useState<GridCell[]>([])
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const configRef = useRef(initialConfig)
  const sceneRef = useRef<BeamElevationScene | null>(null)
  
  // Initialize scene
  useEffect(() => {
    // This would be called when the Phaser game creates the scene
    // The actual scene instance would be passed from PhaserCanvas
    return () => {
      // Cleanup
      sceneRef.current = null
    }
  }, [])
  
  // Set scene instance (called from PhaserCanvas)
  const setSceneInstance = useCallback((sceneInstance: BeamElevationScene | null) => {
    sceneRef.current = sceneInstance
    setScene(sceneInstance)
    
    if (sceneInstance) {
      setIsReady(true)
      setError(null)
      
      // Set up cell change callback
      if (onCellChange) {
        // This would connect to the scene's cell change event
        // sceneInstance.onCellChange = onCellChange
      }
    } else {
      setIsReady(false)
    }
  }, [onCellChange])
  
  // Update configuration
  const updateConfig = useCallback((config: Partial<BeamSceneConfig>) => {
    configRef.current = { ...configRef.current, ...config }
    
    if (sceneRef.current) {
      try {
        // Update scene with new config
        sceneRef.current.updateBeamProfile(
          config.beamProfile || configRef.current.beamProfile,
          config.beamLength,
          config.editMode,
          config.showGrid,
          config.gridOrigin,
          config.showTopFlange,
          undefined, // gridCells
          config.elevationView,
          config.appMode,
          config.spanLength,
          undefined, // zoom
          config.selectedDefectType
        )
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update scene')
      }
    }
  }, [])
  
  // Force redraw
  const redraw = useCallback(() => {
    if (sceneRef.current) {
      try {
        // Call the scene's redraw method
        // sceneRef.current.redrawVisualization()
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to redraw scene')
      }
    }
  }, [])
  
  // Clear selection
  const clearSelection = useCallback(() => {
    if (sceneRef.current) {
      try {
        // Clear grid selection
        // if (sceneRef.current.gridSystem) {
        //   sceneRef.current.gridSystem.clearSelection()
        // }
        setSelectedCells([])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clear selection')
      }
    }
  }, [])
  
  // Export data
  const exportData = useCallback(() => {
    if (sceneRef.current) {
      try {
        // Export inspection data
        // const data = sceneRef.current.exportInspectionData()
        // return data
        return {
          beamProfile: configRef.current.beamProfile,
          selectedCells,
          timestamp: new Date()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export data')
        return null
      }
    }
    return null
  }, [selectedCells])
  
  // Set selected defect type
  const setSelectedDefectType = useCallback((defectType: DefectType) => {
    if (sceneRef.current) {
      try {
        // Update defect type in scene
        // sceneRef.current.setSelectedDefectType(defectType)
        configRef.current.selectedDefectType = defectType
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set defect type')
      }
    }
  }, [])
  
  const state: BeamSceneState = {
    scene,
    selectedCells,
    isReady,
    error
  }
  
  const actions: BeamSceneActions = {
    updateConfig,
    redraw,
    clearSelection,
    exportData,
    setSelectedDefectType
  }
  
  return [state, actions]
}

/**
 * Hook for managing scene configuration
 */
export function useSceneConfig(scene: BeamElevationScene | null) {
  const [config, setConfig] = useState<any>({})
  
  useEffect(() => {
    if (scene) {
      // Get initial config from scene
      // const initialConfig = scene.getConfig()
      // setConfig(initialConfig)
    }
  }, [scene])
  
  const updateConfig = useCallback((key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }))
    
    if (scene) {
      // Update scene config
      // scene.updateConfig({ [key]: value })
    }
  }, [scene])
  
  return { config, updateConfig }
}

/**
 * Hook for managing grid system
 */
export function useGridSystem(scene: BeamElevationScene | null) {
  const [gridInfo, setGridInfo] = useState({
    totalCells: 0,
    selectedCells: 0,
    zones: [] as string[]
  })
  
  useEffect(() => {
    if (scene) {
      // Get grid info from scene
      // const info = scene.gridSystem?.getGridInfo()
      // if (info) setGridInfo(info)
    }
  }, [scene])
  
  const selectCell = useCallback((key: string, defectType?: DefectType) => {
    if (scene) {
      // Select cell in grid system
      // scene.gridSystem?.selectCell(key, defectType)
    }
  }, [scene])
  
  const deselectCell = useCallback((key: string) => {
    if (scene) {
      // Deselect cell in grid system
      // scene.gridSystem?.deselectCell(key)
    }
  }, [scene])
  
  const clearSelection = useCallback(() => {
    if (scene) {
      // Clear grid selection
      // scene.gridSystem?.clearSelection()
    }
  }, [scene])
  
  return {
    gridInfo,
    selectCell,
    deselectCell,
    clearSelection
  }
}

/**
 * Hook for managing annotations
 */
export function useAnnotations(scene: BeamElevationScene | null) {
  const [annotations, setAnnotations] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  
  useEffect(() => {
    if (scene && scene.annotationManager) {
      // Get annotations from scene
      const sceneAnnotations = scene.annotationManager.getAnnotations()
      setAnnotations(sceneAnnotations)
    }
  }, [scene])
  
  const createAnnotation = useCallback((type: string) => {
    if (scene && scene.annotationManager) {
      scene.annotationManager.startCreatingAnnotation(type)
      setIsCreating(true)
    }
  }, [scene])
  
  const cancelCreation = useCallback(() => {
    if (scene && scene.annotationManager) {
      scene.annotationManager.cancelCreation()
      setIsCreating(false)
    }
  }, [scene])
  
  const deleteAnnotation = useCallback((id: string) => {
    if (scene && scene.annotationManager) {
      scene.annotationManager.deleteAnnotation(id)
      const updated = scene.annotationManager.getAnnotations()
      setAnnotations(updated)
    }
  }, [scene])
  
  return {
    annotations,
    isCreating,
    createAnnotation,
    cancelCreation,
    deleteAnnotation
  }
}