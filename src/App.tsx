import { useState, useEffect } from 'react'
import { SetupPopup } from './components/SetupPopup'
import { PhaserCanvas } from './components/PhaserCanvas'
import { BeamProfile, GridCell } from './types/beam'
import { AppMode, MODE_CONFIGS } from './types/mode'
import { AnnotationType } from './types/annotations'
import { AnnotationToolband } from './components/AnnotationToolband'

export default function App() {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [beamLength, setBeamLength] = useState<number>(120)
  const [gridCells, setGridCells] = useState<GridCell[]>([])
  const [showSetup, setShowSetup] = useState<boolean>(true)
  const [appMode, setAppMode] = useState<AppMode>('edit')
  const [gridOrigin, setGridOrigin] = useState<'left' | 'right'>('left')
  const [showTopFlange, setShowTopFlange] = useState<boolean>(true)
  const [elevationView, setElevationView] = useState<'N' | 'S' | 'E' | 'W'>('N')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<AnnotationType>('linear-dimension')
  const [ordinateOriginSide, setOrdinateOriginSide] = useState<'left' | 'right'>('left')
  const [showBeamEndDimensions, setShowBeamEndDimensions] = useState(true)
  const [showBottomOrdinate, setShowBottomOrdinate] = useState(true)
  const [spanLength, setSpanLength] = useState<number>(96) // Default 96" (8 ft)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSetupComplete = (beam: BeamProfile, length: number, elevation: 'N' | 'S' | 'E' | 'W', span: number) => {
    setSelectedBeam(beam)
    setBeamLength(length)
    setElevationView(elevation)
    setSpanLength(span)
    setShowSetup(false)
  }

  const handleCellChange = (cells: GridCell[]) => {
    setGridCells(cells)
  }

  if (showSetup) {
    return <SetupPopup onComplete={handleSetupComplete} />
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Minimal header */}
      <header style={{ 
        backgroundColor: 'white', 
        padding: '10px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ 
            color: '#333', 
            fontSize: '20px',
            margin: 0
          }}>Beam Inspection</h1>
          {selectedBeam && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              {selectedBeam.name} • {beamLength}" ({(beamLength/12).toFixed(1)} ft)
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={appMode}
            onChange={(e) => {
              console.log('App.tsx: Changing mode from', appMode, 'to', e.target.value)
              setAppMode(e.target.value as AppMode)
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <option value="edit">Edit Mode</option>
            <option value="view">View Mode</option>
            <option value="annotation">Annotation Mode</option>
          </select>
          <button
            onClick={() => setShowTopFlange(!showTopFlange)}
            disabled={appMode === 'view'}
            style={{
              padding: '6px 12px',
              backgroundColor: showTopFlange ? '#9C27B0' : '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: appMode !== 'view' ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              opacity: appMode !== 'view' ? 1 : 0.6
            }}
          >
            Top Flange: {showTopFlange ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setGridCells([])}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff9999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            New Inspection
          </button>
        </div>
      </header>
      
      {/* Annotation toolbar band */}
      <AnnotationToolband
        visible={appMode === 'annotation'}
        selectedTool={selectedAnnotationTool}
        onSelectTool={setSelectedAnnotationTool}
        ordinateOriginSide={gridOrigin}
        onToggleOrdinateOrigin={() => setGridOrigin(gridOrigin === 'left' ? 'right' : 'left')}
        showBeamEndDimensions={showBeamEndDimensions}
        showBottomOrdinate={showBottomOrdinate}
        onToggleBeamEndDimensions={() => setShowBeamEndDimensions(!showBeamEndDimensions)}
        onToggleBottomOrdinate={() => setShowBottomOrdinate(!showBottomOrdinate)}
      />

      {/* Main canvas area */}
      <main style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'auto'
      }}>
        <div style={{ position: 'relative', minWidth: '100%', height: '100%' }}>
          <PhaserCanvas 
            beamProfile={selectedBeam} 
            onCellChange={handleCellChange}
            editMode={MODE_CONFIGS[appMode].allowCellEditing}
            beamLength={beamLength}
            showGrid={MODE_CONFIGS[appMode].showGrid}
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
          />
        </div>
      </main>

      {/* Minimal footer */}
      <footer style={{ 
        backgroundColor: 'white', 
        padding: '8px 20px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {appMode === 'edit' && 'Click cells to mark section loss'}
          {appMode === 'view' && 'View mode - Smooth rendering'}
          {appMode === 'annotation' && 'Click to add annotations'}
        </span>
        <span>Total cells: {gridCells.length}</span>
      </footer>
    </div>
  )
}