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

export interface GridCell {
  x: number
  y: number
  selected: boolean
  severity?: number
}

export interface SectionLoss {
  web: GridCell[]
  flange: GridCell[]
}