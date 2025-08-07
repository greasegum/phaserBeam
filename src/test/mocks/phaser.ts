// Mock Phaser for testing without WebGL dependencies
import { vi } from 'vitest'

const mockPointer = {
  x: 0,
  y: 0,
  isDown: false
}

const mockInput = {
  on: vi.fn(),
  off: vi.fn(),
  removeAllListeners: vi.fn(),
  addPointer: vi.fn(),
  pointer1: { ...mockPointer },
  pointer2: { ...mockPointer },
  manager: { 
    canvas: {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  }
}

const mockCamera = {
  scrollX: 0,
  scrollY: 0,
  zoom: 1,
  setZoom: vi.fn()
}

const MockScene = class {
  input = mockInput
  cameras = { main: mockCamera }
}

const MockRectangle = class {
  x = 0
  y = 0
  width = 30
  height = 30
  
  setStrokeStyle = vi.fn(() => this)
  setInteractive = vi.fn(() => this)
  setDepth = vi.fn(() => this)
  setData = vi.fn(() => this)
  getData = vi.fn(() => null)
  setFillStyle = vi.fn(() => this)
  on = vi.fn(() => this)
  off = vi.fn(() => this)
  destroy = vi.fn(() => this)
}

const MockContainer = class {
  setDepth = vi.fn(() => this)
  add = vi.fn(() => this)
  remove = vi.fn(() => this)
  setVisible = vi.fn(() => this)
  destroy = vi.fn(() => this)
}

const MockGraphics = class {
  clear = vi.fn(() => this)
  lineStyle = vi.fn(() => this)
  fillStyle = vi.fn(() => this)
  beginPath = vi.fn(() => this)
  moveTo = vi.fn(() => this)
  lineTo = vi.fn(() => this)
  closePath = vi.fn(() => this)
  strokePath = vi.fn(() => this)
  fillPath = vi.fn(() => this)
  destroy = vi.fn(() => this)
  setDepth = vi.fn(() => this)
}

const Phaser = {
  Scene: MockScene,
  GameObjects: {
    Container: MockContainer,
    Rectangle: MockRectangle,
    Graphics: MockGraphics
  },
  Math: {
    Distance: {
      Between: vi.fn((x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
    },
    Clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
  },
  Input: {
    Pointer: class {
      x = 0
      y = 0
      isDown = false
    }
  }
}

export default Phaser
