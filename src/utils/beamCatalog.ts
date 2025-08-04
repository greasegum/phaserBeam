import { BeamProfile } from '../types/beam'
import { comprehensiveBeamCatalog } from './comprehensiveBeamCatalog'

// Convert comprehensive catalog to BeamProfile format
export const beamCatalog: BeamProfile[] = comprehensiveBeamCatalog.map(beam => ({
  id: beam.id,
  name: beam.designation,
  webThickness: beam.webThickness,
  webHeight: beam.depth, // Note: webHeight is the total depth
  flangeWidth: beam.flangeWidth,
  flangeThickness: beam.flangeThickness,
  weight: beam.weight,
  filletRadius: beam.filletRadius
}))