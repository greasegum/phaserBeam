import { useState } from 'react'
import { BeamViewer } from './components/BeamViewer'
import { PhaserCanvas } from './components/PhaserCanvas'
import { BeamProfile, GridCell } from './types/beam'
import { beamCatalog } from './utils/beamCatalog'

export default function App() {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [sectionLossCells, setSectionLossCells] = useState<GridCell[]>([])
  const [editMode, setEditMode] = useState<boolean>(true)
  const [beamLength, setBeamLength] = useState<number>(120) // 10 feet default
  const [showCrossSection, setShowCrossSection] = useState<boolean>(true)

  const handleCellChange = (cells: GridCell[]) => {
    setSectionLossCells(cells)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Top Control Band */}
      <header style={{ 
        backgroundColor: 'white', 
        padding: '15px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h1 style={{ 
              color: '#333', 
              fontSize: '24px',
              margin: 0
            }}>PhaserBeam</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <select 
                value={selectedBeam?.id || ''} 
                onChange={(e) => {
                  const beam = beamCatalog.find(b => b.id === e.target.value)
                  if (beam) setSelectedBeam(beam)
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select Beam Profile...</option>
                {beamCatalog.map(beam => (
                  <option key={beam.id} value={beam.id}>
                    {beam.name} - {beam.weight} lb/ft
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ color: '#666' }}>Length:</label>
                <input
                  type="number"
                  value={beamLength}
                  onChange={(e) => setBeamLength(Math.max(12, Math.min(240, parseInt(e.target.value) || 120)))}
                  style={{
                    width: '80px',
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  min="12"
                  max="240"
                  step="12"
                />
                <span style={{ color: '#666' }}>inches</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                padding: '8px 16px',
                backgroundColor: editMode ? '#4CAF50' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {editMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}
            </button>

            <button
              onClick={() => setShowCrossSection(!showCrossSection)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {showCrossSection ? 'Hide' : 'Show'} Cross Section
            </button>

            <button
              onClick={() => setSectionLossCells([])}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <PhaserCanvas 
          beamProfile={selectedBeam} 
          onCellChange={handleCellChange}
          editMode={editMode}
          beamLength={beamLength}
        />

        {/* Floating Cross Section View */}
        {showCrossSection && selectedBeam && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 5
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              fontSize: '16px',
              color: '#333',
              textAlign: 'center'
            }}>Cross Section</h3>
            <BeamViewer 
              beamProfile={selectedBeam} 
              sectionLossCells={sectionLossCells}
              showDimensions={true}
            />
            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              {selectedBeam.name}<br/>
              Web: {selectedBeam.webHeight}" × {selectedBeam.webThickness}"<br/>
              Flange: {selectedBeam.flangeWidth}" × {selectedBeam.flangeThickness}"
            </div>
          </div>
        )}
      </main>

      {/* Bottom Status Band */}
      <footer style={{ 
        backgroundColor: 'white', 
        padding: '15px 20px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', gap: '30px' }}>
            <span style={{ color: '#666' }}>
              <strong>Mode:</strong> {editMode ? 'Editing' : 'Viewing'}
            </span>
            <span style={{ color: '#666' }}>
              <strong>Cells Selected:</strong> {sectionLossCells.length}
            </span>
            {selectedBeam && (
              <span style={{ color: '#666' }}>
                <strong>Profile:</strong> {selectedBeam.name}
              </span>
            )}
          </div>
          
          <div style={{ fontSize: '14px', color: '#999' }}>
            Click grid cells to mark section loss • Grid shows 1" × 1" intervals
          </div>
        </div>
      </footer>
    </div>
  )
}