import { useState } from 'react'
import { SetupPopup } from './components/SetupPopup'
import { PhaserCanvas } from './components/PhaserCanvas'
import { BeamProfile, GridCell } from './types/beam'

export default function App() {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [beamLength, setBeamLength] = useState<number>(120)
  const [gridCells, setGridCells] = useState<GridCell[]>([])
  const [showSetup, setShowSetup] = useState<boolean>(true)
  const [showGrid, setShowGrid] = useState<boolean>(true)
  const [gridOrigin, setGridOrigin] = useState<'left' | 'right'>('left')
  const [showTopFlange, setShowTopFlange] = useState<boolean>(true)
  const [beamDirection, setBeamDirection] = useState<'NS' | 'SN' | 'EW' | 'WE'>('NS')

  const handleSetupComplete = (beam: BeamProfile, length: number) => {
    setSelectedBeam(beam)
    setBeamLength(length)
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
            value={beamDirection}
            onChange={(e) => setBeamDirection(e.target.value as 'NS' | 'SN' | 'EW' | 'WE')}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="NS">N→S</option>
            <option value="SN">S→N</option>
            <option value="EW">E→W</option>
            <option value="WE">W→E</option>
          </select>
          <button
            onClick={() => setShowGrid(!showGrid)}
            style={{
              padding: '6px 12px',
              backgroundColor: showGrid ? '#4CAF50' : '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Grid: {showGrid ? 'ON' : 'OFF'}
          </button>
          {showGrid && (
            <>
              <button
                onClick={() => setGridOrigin(gridOrigin === 'left' ? 'right' : 'left')}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Origin: {gridOrigin === 'left' ? 'Left' : 'Right'}
              </button>
              <button
                onClick={() => setShowTopFlange(!showTopFlange)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: showTopFlange ? '#9C27B0' : '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Top Flange: {showTopFlange ? 'ON' : 'OFF'}
              </button>
            </>
          )}
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
            editMode={true}
            beamLength={beamLength}
            showGrid={showGrid}
            gridOrigin={gridOrigin}
            showTopFlange={showTopFlange}
            gridCells={gridCells}
            beamDirection={beamDirection}
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
        <span>Click cells to mark section loss</span>
        <span>Total cells: {gridCells.length}</span>
      </footer>
    </div>
  )
}