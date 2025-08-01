import React, { useState } from 'react'
import { BeamProfile } from '../types/beam'
import { beamCatalog } from '../utils/beamCatalog'

interface SetupPopupProps {
  onComplete: (beam: BeamProfile, length: number) => void
}

export const SetupPopup: React.FC<SetupPopupProps> = ({ onComplete }) => {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [beamLengthFeet, setBeamLengthFeet] = useState<number>(10) // Default 10 feet

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBeam) {
      const lengthInches = Math.round(beamLengthFeet * 12) // Convert feet to inches
      onComplete(selectedBeam, lengthInches)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        minWidth: '400px'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
          Beam Inspection Setup
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#555'
            }}>
              Select Beam Profile:
            </label>
            <select
              value={selectedBeam?.id || ''}
              onChange={(e) => {
                const beam = beamCatalog.find(b => b.id === e.target.value)
                setSelectedBeam(beam || null)
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            >
              <option value="">-- Select a beam --</option>
              {beamCatalog.map(beam => (
                <option key={beam.id} value={beam.id}>
                  {beam.name} (Web: {beam.webHeight}" × {beam.webThickness}", 
                  Flange: {beam.flangeWidth}" × {beam.flangeThickness}")
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#555'
            }}>
              Beam Length (feet):
            </label>
            <input
              type="number"
              value={beamLengthFeet}
              onChange={(e) => setBeamLengthFeet(Math.max(1, Math.min(40, parseFloat(e.target.value) || 10)))}
              min="1"
              max="40"
              step="0.5"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            />
            <div style={{ 
              marginTop: '5px', 
              fontSize: '14px', 
              color: '#666' 
            }}>
              {Math.round(beamLengthFeet * 12)} inches
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedBeam}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: selectedBeam ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedBeam ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.3s'
            }}
          >
            Start Inspection
          </button>
        </form>
      </div>
    </div>
  )
}