/**
 * Modern beam inspection app with original functionality restored
 */

import React, { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { PhaserCanvas } from '../PhaserCanvas'
import { SetupPopup } from '../SetupPopup'
import { BeamProfile, GridCell } from '../../types/beam'
import { AppMode } from '../../types/mode'
import { AnnotationType } from '../../types/annotations'
import { DefectType } from '../../types/defects'

export const MinimalApp: React.FC = () => {
  // Local state for beam inspection
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [beamLength, setBeamLength] = useState<number>(120)
  const [gridCells, setGridCells] = useState<GridCell[]>([])
  const [showSetup, setShowSetup] = useState<boolean>(true)
  const [appMode, setAppMode] = useState<AppMode>('edit')
  const [gridOrigin, setGridOrigin] = useState<'left' | 'right'>('left')
  const [showTopFlange, setShowTopFlange] = useState<boolean>(true)
  const [elevationView, setElevationView] = useState<'N' | 'S' | 'E' | 'W'>('N')
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<AnnotationType>('linear-dimension')
  const [ordinateOriginSide, setOrdinateOriginSide] = useState<'left' | 'right'>('left')
  const [showBeamEndDimensions, setShowBeamEndDimensions] = useState(true)
  const [showBottomOrdinate, setShowBottomOrdinate] = useState(true)
  const [spanLength, setSpanLength] = useState<number>(96)
  const [currentZoom, setCurrentZoom] = useState<number>(1.0)
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType>('section-loss')

  const store = useAppStore()

  const handleSetupComplete = (beam: BeamProfile, length: number, elevation: 'N' | 'S' | 'E' | 'W', span: number, topFlange: boolean) => {
    setSelectedBeam(beam)
    setBeamLength(length)
    setElevationView(elevation)
    setSpanLength(span)
    setShowTopFlange(topFlange)
    setShowSetup(false)
  }

  const handleCellChange = (cells: GridCell[]) => {
    setGridCells(cells)
  }

  // Show setup popup if no beam selected
  if (showSetup) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 50%, #1e1e2e 100%)',
        zIndex: 1000
      }}>
        <SetupPopup onComplete={handleSetupComplete} />
      </div>
    )
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Modern Header */}
      <header style={{
        background: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(205, 214, 244, 0.1)',
        padding: '12px 20px',
        color: '#cdd6f4',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{
            fontSize: '20px',
            margin: 0,
            background: 'linear-gradient(135deg, #74c7ec, #89b4fa)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            🔧 BeamAnalyzer
          </h1>
          {selectedBeam && (
            <span style={{ color: '#a6adc8', fontSize: '14px' }}>
              {selectedBeam.name} • {beamLength}" ({(beamLength/12).toFixed(1)} ft)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Mode Selector */}
          <select
            value={appMode}
            onChange={(e) => setAppMode(e.target.value as AppMode)}
            style={{
              background: 'rgba(49, 50, 68, 0.8)',
              border: '1px solid rgba(116, 199, 236, 0.3)',
              borderRadius: '8px',
              color: '#cdd6f4',
              padding: '6px 12px',
              fontSize: '14px'
            }}
          >
            <option value="edit">Edit Mode</option>
            <option value="view">View Mode</option>
            <option value="annotation">Annotation Mode</option>
          </select>

          {/* Defect Type for Edit Mode */}
          {appMode === 'edit' && (
            <select
              value={selectedDefectType}
              onChange={(e) => setSelectedDefectType(e.target.value as DefectType)}
              style={{
                background: 'rgba(49, 50, 68, 0.8)',
                border: '1px solid rgba(116, 199, 236, 0.3)',
                borderRadius: '8px',
                color: '#cdd6f4',
                padding: '6px 12px',
                fontSize: '14px'
              }}
            >
              <option value="section-loss">Section Loss</option>
              <option value="crack">Crack</option>
              <option value="corrosion">Corrosion</option>
              <option value="deformation">Deformation</option>
            </select>
          )}

          {/* Clear Button */}
          <button
            onClick={() => setGridCells([])}
            style={{
              background: 'rgba(243, 139, 168, 0.2)',
              border: '1px solid rgba(243, 139, 168, 0.4)',
              borderRadius: '8px',
              color: '#f38ba8',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>

          {/* New Inspection Button */}
          <button
            onClick={() => setShowSetup(true)}
            style={{
              background: 'rgba(116, 199, 236, 0.2)',
              border: '1px solid rgba(116, 199, 236, 0.4)',
              borderRadius: '8px',
              color: '#74c7ec',
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            New Inspection
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'auto',
        background: '#f0f0f0'
      }}>
        {selectedBeam && (
          <PhaserCanvas 
            beamProfile={selectedBeam}
            onCellChange={handleCellChange}
            editMode={appMode === 'edit'}
            beamLength={beamLength}
            showGrid={true}
            gridOrigin={gridOrigin}
            showTopFlange={showTopFlange}
            gridCells={gridCells}
            elevationView={elevationView}
            appMode={appMode}
            selectedAnnotationTool={selectedAnnotationTool}
            onSelectAnnotationTool={setSelectedAnnotationTool}
            ordinateOriginSide={ordinateOriginSide}
            onToggleOrdinateOrigin={() => setOrdinateOriginSide(ordinateOriginSide === 'left' ? 'right' : 'left')}
            showBeamEndDimensions={showBeamEndDimensions}
            showBottomOrdinate={showBottomOrdinate}
            spanLength={spanLength}
            zoom={currentZoom}
            selectedDefectType={selectedDefectType}
          />
        )}
      </main>

      {/* Modern Status Bar */}
      <footer style={{
        background: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(205, 214, 244, 0.1)',
        padding: '8px 20px',
        color: '#a6adc8',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <span>
          {appMode === 'edit' && `Click cells to mark ${selectedDefectType.replace('-', ' ')}`}
          {appMode === 'view' && 'View mode - Ready for export'}
          {appMode === 'annotation' && 'Click to add annotations'}
        </span>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>Marked cells: {gridCells.length}</span>
          <span>Zoom: {Math.round(currentZoom * 100)}%</span>
          <span style={{ color: '#74c7ec' }}>✅ Modern UI Active</span>
        </div>
      </footer>
    </div>
  )
}