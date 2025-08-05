export type AppMode = 'edit' | 'view' | 'annotation'

export interface ModeConfig {
  mode: AppMode
  showGrid: boolean
  allowCellEditing: boolean
  allowAnnotations: boolean
}

export const MODE_CONFIGS: Record<AppMode, ModeConfig> = {
  edit: {
    mode: 'edit',
    showGrid: true,
    allowCellEditing: true,
    allowAnnotations: false
  },
  view: {
    mode: 'view',
    showGrid: false,
    allowCellEditing: false,
    allowAnnotations: false
  },
  annotation: {
    mode: 'annotation',
    showGrid: true,
    allowCellEditing: false,
    allowAnnotations: true
  }
}