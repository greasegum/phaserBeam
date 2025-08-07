import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.url, './src'),
      '@types': path.resolve(import.meta.url, './src/types'),
      '@core': path.resolve(import.meta.url, './src/core'),
      '@components': path.resolve(import.meta.url, './src/components'),
      '@utils': path.resolve(import.meta.url, './src/utils'),
      // Mock Phaser to avoid WebGL issues in tests
      'phaser': path.resolve(import.meta.url, './src/test/mocks/phaser.ts')
    }
  }
})
