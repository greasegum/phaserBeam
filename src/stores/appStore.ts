/**
 * Modern unified app state using Zustand
 * Single source of truth for all application state
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { devtools } from 'zustand/middleware'
import type { MarchingSquaresConfig } from '../core/configuration/MarchingSquaresConfig'
import type { EnhancementConfig } from '../core/configuration/EnhancementConfig'

interface BeamData {
  id: string
  name: string
  width: number
  height: number
  imageUrl?: string
  scalarField?: number[][]
}

interface Annotation {
  id: string
  type: 'dimension' | 'text' | 'arrow' | 'circle'
  position: { x: number; y: number }
  data: any
}

interface ViewportState {
  zoom: number
  pan: { x: number; y: number }
  bounds: { width: number; height: number }
}

interface ProcessingState {
  isProcessing: boolean
  progress: number
  stage: string
}

interface AppState {
  // Core data
  beams: BeamData[]
  currentBeamId: string | null
  annotations: Annotation[]
  
  // UI state
  viewport: ViewportState
  processing: ProcessingState
  sidebarOpen: boolean
  activePanel: string | null
  
  // Configuration
  marchingSquaresConfig: MarchingSquaresConfig
  enhancementConfig: EnhancementConfig
  
  // Performance
  performanceMetrics: Record<string, number>
  
  // Actions
  setCurrentBeam: (beamId: string | null) => void
  addBeam: (beam: BeamData) => void
  updateBeam: (id: string, updates: Partial<BeamData>) => void
  removeBeam: (id: string) => void
  
  addAnnotation: (annotation: Annotation) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  removeAnnotation: (id: string) => void
  clearAnnotations: () => void
  
  setViewport: (viewport: Partial<ViewportState>) => void
  resetViewport: () => void
  
  setProcessing: (state: Partial<ProcessingState>) => void
  
  toggleSidebar: () => void
  setActivePanel: (panel: string | null) => void
  
  updateMarchingSquaresConfig: (config: Partial<MarchingSquaresConfig>) => void
  updateEnhancementConfig: (config: Partial<EnhancementConfig>) => void
  
  updatePerformanceMetrics: (metrics: Record<string, number>) => void
  
  // Computed
  currentBeam: () => BeamData | null
}

const defaultMarchingSquaresConfig: MarchingSquaresConfig = {
  algorithm: {
    threshold: 0.5,
    interpolationMethod: 'linear',
    saddlePointResolution: 'center'
  },
  geometry: {
    alignment: { mode: 'edges', offsetX: 0, offsetY: 0 },
    edges: { clampToGrid: false, snapDistance: 0.1 },
    buffer: { enabled: false, size: 1, value: 0.5 },
    transform: { globalOffsetX: 0, globalOffsetY: 0 }
  },
  processing: {
    smoothing: {
      enabled: true,
      algorithm: 'laplacian',
      iterations: 2,
      strength: 0.5,
      preserveCorners: true
    },
    simplification: {
      enabled: true,
      tolerance: 0.1,
      minVertices: 3
    },
    collision: {
      enabled: false,
      method: 'repulsion',
      minDistance: 1.0,
      maxIterations: 10
    },
    filtering: {
      minContourArea: 1.0,
      minContourLength: 3,
      maxContours: 100
    }
  },
  performance: {
    quality: 'balanced',
    enableCaching: true,
    interpolationCache: true
  }
}

const defaultEnhancementConfig: EnhancementConfig = {
  enabled: false,
  algorithm: 'anisotropic_diffusion',
  anisotropicDiffusion: {
    iterations: 10,
    kappa: 30,
    gamma: 0.1,
    option: 1
  },
  coherenceEnhancement: {
    sigma: 1.0,
    rho: 3.0,
    alpha: 0.01,
    iterations: 5
  },
  multiscaleProcessing: {
    scales: 3,
    sigma0: 1.0,
    factor: 2.0,
    iterations: 5
  },
  shockFilter: {
    iterations: 5,
    dt: 0.1,
    sigma: 1.0
  },
  unifiedPipeline: {
    enablePreprocessing: true,
    enablePostprocessing: true,
    adaptiveParameters: true
  }
}

export const useAppStore = create<AppState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      beams: [],
      currentBeamId: null,
      annotations: [],
      
      viewport: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        bounds: { width: 800, height: 600 }
      },
      
      processing: {
        isProcessing: false,
        progress: 0,
        stage: ''
      },
      
      sidebarOpen: true,
      activePanel: null,
      
      marchingSquaresConfig: defaultMarchingSquaresConfig,
      enhancementConfig: defaultEnhancementConfig,
      
      performanceMetrics: {},
      
      // Actions
      setCurrentBeam: (beamId) => set((state) => {
        state.currentBeamId = beamId
      }),
      
      addBeam: (beam) => set((state) => {
        state.beams.push(beam)
        if (!state.currentBeamId) {
          state.currentBeamId = beam.id
        }
      }),
      
      updateBeam: (id, updates) => set((state) => {
        const beam = state.beams.find(b => b.id === id)
        if (beam) {
          Object.assign(beam, updates)
        }
      }),
      
      removeBeam: (id) => set((state) => {
        state.beams = state.beams.filter(b => b.id !== id)
        if (state.currentBeamId === id) {
          state.currentBeamId = state.beams.length > 0 ? state.beams[0].id : null
        }
      }),
      
      addAnnotation: (annotation) => set((state) => {
        state.annotations.push(annotation)
      }),
      
      updateAnnotation: (id, updates) => set((state) => {
        const annotation = state.annotations.find(a => a.id === id)
        if (annotation) {
          Object.assign(annotation, updates)
        }
      }),
      
      removeAnnotation: (id) => set((state) => {
        state.annotations = state.annotations.filter(a => a.id !== id)
      }),
      
      clearAnnotations: () => set((state) => {
        state.annotations = []
      }),
      
      setViewport: (viewport) => set((state) => {
        Object.assign(state.viewport, viewport)
      }),
      
      resetViewport: () => set((state) => {
        state.viewport = {
          zoom: 1,
          pan: { x: 0, y: 0 },
          bounds: { width: 800, height: 600 }
        }
      }),
      
      setProcessing: (processingState) => set((state) => {
        Object.assign(state.processing, processingState)
      }),
      
      toggleSidebar: () => set((state) => {
        state.sidebarOpen = !state.sidebarOpen
      }),
      
      setActivePanel: (panel) => set((state) => {
        state.activePanel = panel
      }),
      
      updateMarchingSquaresConfig: (config) => set((state) => {
        Object.assign(state.marchingSquaresConfig, config)
      }),
      
      updateEnhancementConfig: (config) => set((state) => {
        Object.assign(state.enhancementConfig, config)
      }),
      
      updatePerformanceMetrics: (metrics) => set((state) => {
        Object.assign(state.performanceMetrics, metrics)
      }),
      
      // Computed
      currentBeam: () => {
        const state = get()
        return state.beams.find(b => b.id === state.currentBeamId) || null
      }
    })),
    { name: 'beam-app-store' }
  )
)

// Utility hooks for specific slices
export const useBeams = () => useAppStore(state => ({
  beams: state.beams,
  currentBeam: state.currentBeam(),
  setCurrentBeam: state.setCurrentBeam,
  addBeam: state.addBeam,
  updateBeam: state.updateBeam,
  removeBeam: state.removeBeam
}))

export const useAnnotations = () => useAppStore(state => ({
  annotations: state.annotations,
  addAnnotation: state.addAnnotation,
  updateAnnotation: state.updateAnnotation,
  removeAnnotation: state.removeAnnotation,
  clearAnnotations: state.clearAnnotations
}))

export const useViewport = () => useAppStore(state => ({
  viewport: state.viewport,
  setViewport: state.setViewport,
  resetViewport: state.resetViewport
}))

export const useConfig = () => useAppStore(state => ({
  marchingSquaresConfig: state.marchingSquaresConfig,
  enhancementConfig: state.enhancementConfig,
  updateMarchingSquaresConfig: state.updateMarchingSquaresConfig,
  updateEnhancementConfig: state.updateEnhancementConfig
}))