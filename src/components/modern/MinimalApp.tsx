/**
 * Professional engineering beam inspection app - matches reference drawing style
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
  
  // For debugging - you can set this to false to skip setup and show a default beam
  const DEBUG_SKIP_SETUP = true
  const [appMode, setAppMode] = useState<AppMode>('edit')
  const [gridOrigin, setGridOrigin] = useState<'left' | 'right'>('left')
  const [showTopFlange, setShowTopFlange] = useState<boolean>(true)
  const [elevationView, setElevationView] = useState<'N' | 'S' | 'E' | 'W'>('E')
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<AnnotationType>('linear-dimension')
  const [ordinateOriginSide, setOrdinateOriginSide] = useState<'left' | 'right'>('left')
  const [showBeamEndDimensions, setShowBeamEndDimensions] = useState(true)
  const [showBottomOrdinate, setShowBottomOrdinate] = useState(true)
  const [spanLength, setSpanLength] = useState<number>(96)
  const [currentZoom, setCurrentZoom] = useState<number>(1.0)
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType>('section-loss')

  const store = useAppStore()

  // Debug: Load a default beam on startup if DEBUG_SKIP_SETUP is true
  useEffect(() => {
    if (DEBUG_SKIP_SETUP && !selectedBeam) {
      // Import beam catalog and select first beam
      import('../../utils/beamCatalog').then(({ beamCatalog }) => {
        const defaultBeam = beamCatalog[0]
        if (defaultBeam) {
          setSelectedBeam(defaultBeam)
          setShowSetup(false)
        }
      })
    }
  }, [DEBUG_SKIP_SETUP, selectedBeam])

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
        background: 'white',
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
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Professional Engineering Drawing Header */}
      <header style={{
        background: 'white',
        borderBottom: '2px solid #000',
        padding: '20px 40px',
        color: '#000',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100
      }}>
        {/* Main Title - Centered like engineering drawing */}
        <div style={{
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <h1 style={{
            fontSize: '16px',
            margin: 0,
            fontWeight: 'bold',
            color: '#000',
            letterSpacing: '1px'
          }}>
            {selectedBeam ? `${selectedBeam.name}, ${elevationView} Elevation` : 'BEAM INSPECTION'}
          </h1>
        </div>

        {/* Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Mode Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>MODE:</span>
              <select
                value={appMode}
                onChange={(e) => setAppMode(e.target.value as AppMode)}
                style={{
                  border: '1px solid #333',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                <option value="edit">EDIT</option>
                <option value="view">VIEW</option>
                <option value="annotation">ANNOTATION</option>
              </select>
            </div>

            {/* Defect Type for Edit Mode */}
            {appMode === 'edit' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>DEFECT:</span>
                <select
                  value={selectedDefectType}
                  onChange={(e) => setSelectedDefectType(e.target.value as DefectType)}
                  style={{
                    border: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  <option value="section-loss">SECTION LOSS</option>
                  <option value="crack">CRACK</option>
                  <option value="corrosion">CORROSION</option>
                  <option value="deformation">DEFORMATION</option>
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button
              onClick={() => setGridCells([])}
              style={{
                border: '1px solid #333',
                background: 'white',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold'
              }}
            >
              CLEAR ALL
            </button>
            
            <button
              onClick={() => setShowSetup(true)}
              style={{
                border: '1px solid #333',
                background: 'white',
                padding: '4px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold'
              }}
            >
              NEW INSPECTION
            </button>
          </div>
        </div>
      </header>

      {/* Main Drawing Canvas Area - White background like engineering drawing */}
      <main style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'auto',
        background: 'white'
      }}>
        {selectedBeam ? (
          <div style={{ 
            width: '100%', 
            height: '100%',
            background: 'white',
            position: 'relative'
          }}>
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
            
            {/* Debug info overlay */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(255,255,255,0.9)',
              padding: '10px',
              border: '1px solid #333',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>
              <div>Beam: {selectedBeam.name}</div>
              <div>Length: {beamLength}"</div>
              <div>View: {elevationView}</div>
              <div>Mode: {appMode}</div>
              <div>Grid Cells: {gridCells.length}</div>
              <div>Canvas should show beam with grid</div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '16px',
            color: '#666'
          }}>
            No beam selected. Click "NEW INSPECTION" to start.
          </div>
        )}
      </main>

      {/* Professional Engineering Drawing Footer */}
      <footer style={{
        background: 'white',
        borderTop: '2px solid #000',
        padding: '12px 40px',
        color: '#000',
        fontSize: '11px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Left Side - Original Section Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Original Section Properties:</div>
          {selectedBeam && (
            <>
              <div>Profile = {selectedBeam.name}</div>
              <div>Web = {(selectedBeam.webThickness || 0.5).toFixed(2)}"</div>
              <div>Flange = {(selectedBeam.flangeThickness || 0.65).toFixed(2)}"</div>
              <div>Length = {(beamLength / 12).toFixed(0)}.00"</div>
            </>
          )}
        </div>

        {/* Center - Instructions */}
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          {appMode === 'edit' && (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Instructions:</div>
              <div>Click grid cells to mark {selectedDefectType.replace('-', ' ')} areas.</div>
              <div>Use CLEAR ALL to remove all markings.</div>
            </>
          )}
          {appMode === 'view' && (
            <div style={{ fontWeight: 'bold' }}>VIEW MODE - Ready for export and analysis</div>
          )}
        </div>

        {/* Right Side - Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Area of S.L.:</span>
          </div>
          <div>Marked cells: {gridCells.length}</div>
          <div>Total length: {beamLength}"</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Scale: {Math.round(currentZoom * 100)}%
          </div>
        </div>
      </footer>
    </div>
  )
}