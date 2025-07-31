import React from 'react'
import { BeamProfile } from '../types/beam'

interface BeamSelectorProps {
  beams: BeamProfile[]
  selectedBeam: BeamProfile | null
  onBeamSelect: (beam: BeamProfile) => void
}

export const BeamSelector: React.FC<BeamSelectorProps> = ({ beams, selectedBeam, onBeamSelect }) => {
  // Group beams by nominal depth
  const groupedBeams = beams.reduce((acc, beam) => {
    const depth = Math.floor(beam.webHeight)
    if (!acc[depth]) {
      acc[depth] = []
    }
    acc[depth].push(beam)
    return acc
  }, {} as Record<number, BeamProfile[]>)

  // Sort depths descending
  const sortedDepths = Object.keys(groupedBeams)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <select
      value={selectedBeam?.id || ''}
      onChange={(e) => {
        const beam = beams.find(b => b.id === e.target.value)
        if (beam) onBeamSelect(beam)
      }}
      style={{
        padding: '8px 12px',
        fontSize: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        minWidth: '200px'
      }}
    >
      <option value="">Select Beam Profile...</option>
      {sortedDepths.map(depth => (
        <optgroup key={depth} label={`${depth}" Deep`}>
          {groupedBeams[depth]
            .sort((a, b) => b.weight - a.weight)
            .map(beam => (
              <option key={beam.id} value={beam.id}>
                {beam.name}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}