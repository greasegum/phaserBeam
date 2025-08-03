import { marchingSquaresOptimized } from './src/utils/marchingSquaresOptimized.js'

// Create a simple test grid
const grid = [
  [0.0, 0.2, 0.4, 0.6, 0.8],
  [0.2, 0.3, 0.5, 0.7, 0.9],
  [0.4, 0.5, 0.6, 0.8, 1.0],
  [0.6, 0.7, 0.8, 0.9, 1.0],
  [0.8, 0.9, 1.0, 1.0, 1.0]
]

const threshold = 0.5

console.log('Testing interpolation methods with threshold:', threshold)

// Test each interpolation method
const methods = ['linear', 'cubic', 'none']

methods.forEach(method => {
  console.log(`\n--- Testing ${method} interpolation ---`)
  
  const options = {
    threshold,
    interpolationMethod: method,
    smoothing: false
  }
  
  const contours = marchingSquaresOptimized(grid, options)
  
  console.log(`Number of contours: ${contours.length}`)
  
  // Show first few points of first contour
  if (contours.length > 0) {
    console.log('First contour has', contours[0].length, 'points')
    console.log('First 5 points:')
    contours[0].slice(0, 5).forEach((point, i) => {
      console.log(`  ${i}: (${point.x.toFixed(3)}, ${point.y.toFixed(3)})`)
    })
  }
})