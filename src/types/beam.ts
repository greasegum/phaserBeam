export interface BeamProfile {
  id: string
  name: string
  webThickness: number
  webHeight: number
  flangeWidth: number
  flangeThickness: number
  weight: number
  filletRadius?: number
}

import { DefectType } from './defects'

export interface GridCell {
  x: number
  y: number
  selected: boolean
  severity?: number
  zone?: 'web' | 'flange-top' | 'flange-bottom'
  defectType?: DefectType
}

export interface SectionLoss {
  web: GridCell[]
  flange: GridCell[]
}