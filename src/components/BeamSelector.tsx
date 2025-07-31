import React from 'react'
import { BeamProfile } from '../types/beam'
import { beamCatalog } from '../utils/beamCatalog'

interface BeamSelectorProps {
  selectedBeam: BeamProfile | null
  onBeamSelect: (beam: BeamProfile) => void
}

export const BeamSelector: React.FC<BeamSelectorProps> = ({ selectedBeam, onBeamSelect }) => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginBottom: '10px', color: '#333' }}>Select Beam Profile</h3>
      <select 
        value={selectedBeam?.id || ''} 
        onChange={(e) => {
          const beam = beamCatalog.find(b => b.id === e.target.value)
          if (beam) onBeamSelect(beam)
        }}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      >
        <option value="">Choose a beam profile...</option>
        {beamCatalog.map(beam => (
          <option key={beam.id} value={beam.id}>
            {beam.name} - {beam.weight} lb/ft
          </option>
        ))}
      </select>
      
      {selectedBeam && (
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <div>Web: {selectedBeam.webHeight}" × {selectedBeam.webThickness}"</div>
          <div>Flange: {selectedBeam.flangeWidth}" × {selectedBeam.flangeThickness}"</div>
        </div>
      )}
    </div>
  )
}