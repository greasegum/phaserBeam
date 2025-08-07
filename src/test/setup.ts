// Test setup file
import { beforeAll, vi } from 'vitest'

// Mock Phaser globally for tests
beforeAll(() => {
  // Mock window and global objects that Phaser expects
  Object.defineProperty(global, 'window', {
    value: {
      innerWidth: 800,
      innerHeight: 600,
      devicePixelRatio: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16)),
      cancelAnimationFrame: vi.fn(),
      location: { protocol: 'http:' }
    },
    writable: true
  })

  Object.defineProperty(global, 'document', {
    value: {
      createElement: vi.fn(() => ({
        getContext: vi.fn(() => ({
          fillRect: vi.fn(),
          clearRect: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 100 })),
          canvas: { width: 800, height: 600 }
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setAttribute: vi.fn(),
        style: {},
        width: 800,
        height: 600
      })),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    },
    writable: true
  })

  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'test',
      platform: 'test'
    },
    writable: true
  })

  global.Phaser = {
    Scene: class MockScene {
      input = {
        on: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        addPointer: vi.fn(),
        pointer1: { x: 0, y: 0, isDown: false },
        pointer2: { x: 0, y: 0, isDown: false },
        manager: { canvas: null }
      }
      cameras = {
        main: {
          scrollX: 0,
          scrollY: 0,
          zoom: 1,
          setZoom: vi.fn()
        }
      }
    },
    GameObjects: {
      Container: class MockContainer {
        setDepth = vi.fn(() => this)
        add = vi.fn(() => this)
        remove = vi.fn(() => this)
        setVisible = vi.fn(() => this)
        destroy = vi.fn(() => this)
      },
      Rectangle: class MockRectangle {
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
      },
      Graphics: class MockGraphics {
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
    },
    Math: {
      Distance: {
        Between: vi.fn((x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2))
      },
      Clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value)))
    },
    Input: {
      Pointer: class MockPointer {
        x = 0
        y = 0
        isDown = false
      }
    }
  } as any

  // Mock Canvas for tests that need it
  global.HTMLCanvasElement = class MockCanvas {
    width = 800
    height = 600
    getContext = vi.fn(() => ({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn()
    }))
  } as any
})
