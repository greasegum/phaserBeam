import React, { useState } from 'react'
import { BeamSelector } from './components/BeamSelector'
import { BeamViewer } from './components/BeamViewer'
import { PhaserCanvas } from './components/PhaserCanvas'
import { BeamProfile, GridCell } from './types/beam'

export default function App() {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [sectionLossCells, setSectionLossCells] = useState<GridCell[]>([])

  const handleCellChange = (cells: GridCell[]) => {
    setSectionLossCells(cells)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px', gap: '20px' }}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>PhaserBeam - Beam Inspection Tool</h1>
        <p style={{ color: '#666' }}>Structural beam section loss documentation system</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
        <aside style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <BeamSelector selectedBeam={selectedBeam} onBeamSelect={setSelectedBeam} />
          
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Cross Section View</h3>
            <BeamViewer 
              beamProfile={selectedBeam || { 
                id: 'placeholder',
                name: 'Select a beam',
                webHeight: 12,
                webThickness: 0.5,
                flangeWidth: 8,
                flangeThickness: 0.75,
                weight: 0
              }} 
              sectionLossCells={sectionLossCells}
              showDimensions={true}
            />
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px', color: '#333' }}>Instructions</h3>
            <ul style={{ fontSize: '14px', color: '#666', paddingLeft: '20px' }}>
              <li>Select a beam profile from the dropdown</li>
              <li>Click on grid cells to mark section loss</li>
              <li>Web grid shows cross-sectional loss</li>
              <li>Flange grid shows lengthwise loss</li>
              <li>Red areas indicate section loss</li>
            </ul>
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px', color: '#333', textAlign: 'center' }}>Interactive Grid - Click to Mark Section Loss</h3>
            <PhaserCanvas beamProfile={selectedBeam} onCellChange={handleCellChange} />
          </div>
        </main>
      </div>
    </div>
  )
}