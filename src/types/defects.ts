export type DefectType = 'section-loss' | 'hole'

export interface DefectStyle {
  fillColor: number
  fillAlpha: number
  strokeColor: number
  strokeWidth: number
  strokeAlpha: number
  pattern?: {
    type: 'dots' | 'diagonal-lines' | 'cross-hatch'
    color: number
    alpha: number
    spacing: number
    size?: number // for dots
    angle?: number // for lines (in degrees)
    lineWidth?: number // for lines
  }
}

export const DEFECT_STYLES: Record<DefectType, DefectStyle> = {
  'section-loss': {
    fillColor: 0xFFB3D9, // pink
    fillAlpha: 1,
    strokeColor: 0xFF69B4,
    strokeWidth: 1,
    strokeAlpha: 0.5
  },
  'hole': {
    fillColor: 0xFFFFFF, // white
    fillAlpha: 1,
    strokeColor: 0x000000,
    strokeWidth: 1,
    strokeAlpha: 0.5
  }
}