export type DefectType = 'hole' | 'pinholes' | 'surface-rust' | 'paper-thin' | 'section-loss' | 'pitting'

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
  'hole': {
    fillColor: 0xFFFFFF, // white
    fillAlpha: 1,
    strokeColor: 0x000000,
    strokeWidth: 1,
    strokeAlpha: 0.5
  },
  'pinholes': {
    fillColor: 0xFFB3D9, // pink
    fillAlpha: 1,
    strokeColor: 0xFF69B4,
    strokeWidth: 1,
    strokeAlpha: 0.5,
    pattern: {
      type: 'dots',
      color: 0xFFFFFF, // white dots
      alpha: 0.8,
      spacing: 6,
      size: 2
    }
  },
  'surface-rust': {
    fillColor: 0x90EE90, // light green
    fillAlpha: 0.7,
    strokeColor: 0x228B22,
    strokeWidth: 1,
    strokeAlpha: 0.5,
    pattern: {
      type: 'diagonal-lines',
      color: 0xFFB3D9, // pink
      alpha: 0.6,
      spacing: 8,
      angle: 45,
      lineWidth: 2
    }
  },
  'paper-thin': {
    fillColor: 0xFFB3D9, // pink
    fillAlpha: 1,
    strokeColor: 0xFF69B4,
    strokeWidth: 1,
    strokeAlpha: 0.5,
    pattern: {
      type: 'diagonal-lines',
      color: 0xFFFFFF, // white
      alpha: 0.7,
      spacing: 6,
      angle: -45,
      lineWidth: 2
    }
  },
  'section-loss': {
    fillColor: 0xFFB3D9, // pink
    fillAlpha: 1,
    strokeColor: 0xFF69B4,
    strokeWidth: 1,
    strokeAlpha: 0.5
  },
  'pitting': {
    fillColor: 0xFFB3D9, // pink
    fillAlpha: 1,
    strokeColor: 0xFF69B4,
    strokeWidth: 1,
    strokeAlpha: 0.5,
    pattern: {
      type: 'dots',
      color: 0x000000, // black dots
      alpha: 0.6,
      spacing: 8,
      size: 3
    }
  }
}