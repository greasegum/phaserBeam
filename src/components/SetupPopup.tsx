import React, { useState } from 'react'
import { BeamProfile } from '../types/beam'
import { beamCatalog } from '../utils/beamCatalog'

interface SetupPopupProps {
  onComplete: (beam: BeamProfile, length: number, elevationView: 'N' | 'S' | 'E' | 'W', spanLength: number) => void
}

export const SetupPopup: React.FC<SetupPopupProps> = ({ onComplete }) => {
  // Reverse the beam catalog and set default to first item
  const reversedCatalog = [...beamCatalog].reverse()
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(reversedCatalog[0] || null)
  const [beamLengthFeet, setBeamLengthFeet] = useState<number>(10)
  const [beamLengthInches, setBeamLengthInches] = useState<number>(0)
  const [elevationView, setElevationView] = useState<'N' | 'S' | 'E' | 'W'>('N') // Default North
  const [spanLengthFeet, setSpanLengthFeet] = useState<number>(0)
  const [spanLengthInches, setSpanLengthInches] = useState<number>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBeam) {
      const totalLengthInches = beamLengthFeet * 12 + beamLengthInches
      let totalSpanLengthInches = spanLengthFeet * 12 + spanLengthInches
      
      // If span length is 0, default to beam length - 24"
      if (totalSpanLengthInches === 0) {
        totalSpanLengthInches = Math.max(0, totalLengthInches - 24)
      }
      
      onComplete(selectedBeam, totalLengthInches, elevationView, totalSpanLengthInches)
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
              {reversedCatalog.map(beam => (
                <option key={beam.id} value={beam.id}>
                  {beam.name} (Web: {beam.webHeight}" × {beam.webThickness}", 
                  Flange: {beam.flangeWidth}" × {beam.flangeThickness}")
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#555'
            }}>
              Beam Length:
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={beamLengthFeet}
                  onChange={(e) => setBeamLengthFeet(Math.max(0, Math.min(40, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="40"
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
                  fontSize: '12px', 
                  color: '#666',
                  textAlign: 'center'
                }}>
                  feet
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={beamLengthInches}
                  onChange={(e) => setBeamLengthInches(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="11"
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
                  fontSize: '12px', 
                  color: '#666',
                  textAlign: 'center'
                }}>
                  inches
                </div>
              </div>
            </div>
            <div style={{ 
              marginTop: '10px', 
              fontSize: '14px', 
              color: '#666',
              textAlign: 'center'
            }}>
              Total: {beamLengthFeet * 12 + beamLengthInches} inches ({beamLengthFeet}' {beamLengthInches}")
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#555'
            }}>
              Span Length (CL-to-CL of Bearings):
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={spanLengthFeet}
                  onChange={(e) => setSpanLengthFeet(Math.max(0, Math.min(40, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="40"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: '#666',
                  textAlign: 'center'
                }}>
                  feet
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="number"
                  value={spanLengthInches}
                  onChange={(e) => setSpanLengthInches(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="11"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '12px', 
                  color: '#666',
                  textAlign: 'center'
                }}>
                  inches
                </div>
              </div>
            </div>
            <div style={{ 
              marginTop: '10px', 
              fontSize: '14px', 
              color: '#666',
              textAlign: 'center'
            }}>
              {spanLengthFeet === 0 && spanLengthInches === 0 
                ? `Default: ${Math.max(0, beamLengthFeet * 12 + beamLengthInches - 24)} inches (beam length - 24")`
                : `Total: ${spanLengthFeet * 12 + spanLengthInches} inches (${spanLengthFeet}' ${spanLengthInches}")`
              }
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#555'
            }}>
              Elevation View:
            </label>
            <select
              value={elevationView}
              onChange={(e) => setElevationView(e.target.value as 'N' | 'S' | 'E' | 'W')}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              required
            >
              <option value="N">North Elevation</option>
              <option value="S">South Elevation</option>
              <option value="E">East Elevation</option>
              <option value="W">West Elevation</option>
            </select>
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