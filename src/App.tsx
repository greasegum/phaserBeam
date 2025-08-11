/**
 * Ultra-modern App component with Zustand state management
 */

import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ModernLayout } from './components/modern/ModernLayout'
import { useAppStore } from './stores/appStore'
import './App.css'

// Create query client with modern defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && 'status' in error && typeof error.status === 'number') {
          return error.status >= 500 && failureCount < 3
        }
        return failureCount < 3
      }
    }
  }
})

const AppContent: React.FC = () => {
  const { addBeam } = useAppStore()

  // Initialize with sample data for demo
  useEffect(() => {
    const sampleBeam = {
      id: 'demo-beam-1',
      name: 'W12x26 Demo Beam',
      width: 120,
      height: 50,
      imageUrl: undefined,
      scalarField: generateSampleScalarField(120, 50)
    }
    
    addBeam(sampleBeam)
  }, [addBeam])

  return <ModernLayout />
}

// Generate sample scalar field data for demo
function generateSampleScalarField(width: number, height: number): number[][] {
  const field: number[][] = []
  
  for (let y = 0; y < height; y++) {
    field[y] = []
    for (let x = 0; x < width; x++) {
      // Create interesting patterns for demo
      const centerX = width / 2
      const centerY = height / 2
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
      
      // Combine multiple patterns
      const wave1 = Math.sin(x * 0.1) * Math.cos(y * 0.1)
      const wave2 = Math.sin(distance * 0.2)
      const gradient = 1 - (distance / maxDistance)
      
      field[y][x] = (wave1 * 0.3 + wave2 * 0.4 + gradient * 0.3 + 1) / 2
    }
  }
  
  return field
}

export default function App() {
  // Handle global error boundaries and setup
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      // Could integrate with error reporting service here
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      // Could integrate with error reporting service here
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <AppContent />
      </div>
    </QueryClientProvider>
  )
}