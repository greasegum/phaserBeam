import Phaser from 'phaser'

export type AnnotationType = 'linear-dimension' | 'ordinate-dimension' | 'callout'

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
  unit: 'in' | 'ft'
  showWitnessLines: boolean
  witnessLineExtension: number
  textPosition: 'center' | 'above' | 'below'
  autoText: boolean // Automatically calculate dimension text
}

export interface OrdinateDimension extends BaseAnnotation {
  type: 'ordinate-dimension'
  originPoint: AnnotationPoint
  measurePoint: AnnotationPoint
  isVertical: boolean
  joggedLine: boolean
  jogOffset: number
  text: string
  unit: 'in' | 'ft'
  showArrow: boolean
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
  }
  leaderStyle: 'straight' | 'curved' | 'polyline'
  endStyle: 'arrow' | 'dot' | 'none'
}

export type Annotation = LinearDimension | OrdinateDimension | Callout

export interface AnnotationInteraction {
  annotation: Annotation
  dragHandle?: string // Which part is being dragged
  isDragging: boolean
  startDragPoint?: AnnotationPoint
}

export interface SnapPoint {
  x: number
  y: number
  type: 'grid-vertex' | 'grid-center' | 'edge' | 'midpoint'
  priority: number
}

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  color: 0x333333,
  lineWidth: 1,
  fontSize: 12,
  fontFamily: 'Arial',
  textColor: '#333333',
  arrowStyle: 'arrow'
}

export const SNAP_THRESHOLD = 10 // pixels
export const COLLISION_BUFFER = 5 // pixels
export const TEXT_PADDING = 8 // pixels