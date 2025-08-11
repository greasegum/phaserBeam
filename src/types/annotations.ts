import Phaser from 'phaser'

export type AnnotationType = 'linear-dimension' | 'ordinate-dimension' | 'callout' | 'text-block'

export interface AnnotationPoint {
  x: number
  y: number
  gridX?: number // Grid coordinates for snapping
  gridY?: number
}

export interface BaseAnnotation {
  id: string
  type: AnnotationType
  visible: boolean
  locked: boolean
  style: AnnotationStyle
}

export interface AnnotationStyle {
  color: number
  lineWidth: number
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor?: string
  borderColor?: string
  arrowStyle?: 'arrow' | 'dot' | 'none'
}

export interface LinearDimension extends BaseAnnotation {
  type: 'linear-dimension'
  startPoint: AnnotationPoint
  endPoint: AnnotationPoint
  offsetDistance: number // Distance from the measured edge
  text: string
  unit: 'in' | 'ft' | 'inches'
  showWitnessLines: boolean
  witnessLineExtension: number
  textPosition: 'center' | 'above' | 'below'
  autoText: boolean // Automatically calculate dimension text
  witnessLineStart?: number
  witnessLineEnd?: number
  dimensionOffset?: number
  showArrows?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export interface OrdinateDimension extends BaseAnnotation {
  type: 'ordinate-dimension'
  measurePoint: AnnotationPoint // Point along bottom edge of beam
  originSide: 'left' | 'right' // Which end to measure from
  jogOffset: number // Vertical offset below beam for dimension line
  text: string
  unit: 'in' | 'ft' | 'inches'
  autoText: boolean // Automatically calculate dimension text
  showArrow: boolean
  witnessLineHeight: number // Height of witness line from beam bottom
  beamLength: number // Total beam length for calculating distance
  beamBottom: number // Y coordinate of beam bottom edge
}

export interface Callout extends BaseAnnotation {
  type: 'callout'
  leaderPoints: AnnotationPoint[] // Can have multiple points for polyline leaders
  textBox: {
    x: number
    y: number
    width: number
    height: number
    text: string
    showBorder: boolean
    padding: number
    isEditing?: boolean
    decimalReading?: number // For UT meter readings
  }
  leaderStyle: 'straight' | 'curved' | 'polyline' | 'diagonal'
  endStyle: 'arrow' | 'dot' | 'none'
}

export interface TextBlock extends BaseAnnotation {
  type: 'text-block'
  position: AnnotationPoint
  text: string
  alignment: 'left' | 'center' | 'right'
  rotation: number // in radians
  maxWidth?: number // for text wrapping
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  padding?: number
  isSystemGenerated?: boolean // for titles and labels that shouldn't be editable
}

export type Annotation = LinearDimension | OrdinateDimension | Callout | TextBlock

export interface AnnotationInteraction {
  annotation: Annotation
  dragHandle?: string // Which part is being dragged
  isDragging: boolean
  startDragPoint?: AnnotationPoint
}

export interface SnapPoint {
  x: number
  y: number
  type: 'grid-vertex' | 'grid-center' | 'edge' | 'midpoint' | 'grid-edge'
  priority: number
}

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  color: 0x000000,  // Black for engineering drawings
  lineWidth: 1.5,   // Slightly thicker for clarity
  fontSize: 14,     // Standard engineering text size
  fontFamily: 'Arial, sans-serif',
  textColor: '#000000',
  arrowStyle: 'arrow'
}

export const SNAP_THRESHOLD = 20 // pixels for more aggressive snapping
export const GRID_SNAP_PRIORITY = 10 // pixels - always snap to grid within this distance
export const COLLISION_BUFFER = 5 // pixels
export const TEXT_PADDING = 8 // pixels