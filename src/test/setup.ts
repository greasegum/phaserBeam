// Test setup file
import { beforeAll } from 'vitest'

// Mock Phaser globally for tests
beforeAll(() => {
  global.Phaser = {
    Scene: class MockScene {},
    GameObjects: {
      Container: class MockContainer {
        setDepth = () => this
        add = () => this
        remove = () => this
        setVisible = () => this
        destroy = () => this
      },
      Rectangle: class MockRectangle {
        x = 0
        y = 0
        width = 30
        height = 30
        setStrokeStyle = () => this
        setInteractive = () => this
        setDepth = () => this
        setData = () => this
        getData = () => null
        setFillStyle = () => this
        on = () => this
        destroy = () => this
      }
    }
  } as any
})
