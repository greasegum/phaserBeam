import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true
    })
  ],
  
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: true
    }
  },
  
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand', 'immer', 'use-immer'],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 800,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn']
      }
    },
    sourcemap: true
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', '@tanstack/react-query']
  },
  
  esbuild: {
    target: 'es2022',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})