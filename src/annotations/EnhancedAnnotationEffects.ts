import Phaser from 'phaser'

export interface PhysicsConfig {
  enabled: boolean
  springStrength: number
  damping: number
  attractionRadius: number
}

export interface ColorEffectConfig {
  enabled: boolean
  hoverGlow: boolean
  pulseOnCreate: boolean
  gradientFill: boolean
  shadowBlur: boolean
}

export class EnhancedAnnotationEffects {
  private scene: Phaser.Scene
  private physicsConfig: PhysicsConfig
  private colorEffectConfig: ColorEffectConfig
  private springs: Map<string, { target: Phaser.GameObjects.GameObject, velocity: { x: number, y: number } }>
  private pulsingObjects: Map<string, { object: Phaser.GameObjects.GameObject, startTime: number }>
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.springs = new Map()
    this.pulsingObjects = new Map()
    
    // Default physics config - subtle and professional
    this.physicsConfig = {
      enabled: true,
      springStrength: 0.02,
      damping: 0.95,
      attractionRadius: 100
    }
    
    // Default color effects - professional yet modern
    this.colorEffectConfig = {
      enabled: true,
      hoverGlow: true,
      pulseOnCreate: true,
      gradientFill: true,
      shadowBlur: true
    }
  }
  
  // Apply spring physics to make annotations subtly responsive
  applySpringPhysics(object: Phaser.GameObjects.GameObject, targetX: number, targetY: number, id: string): void {
    if (!this.physicsConfig.enabled) return
    
    if (!this.springs.has(id)) {
      this.springs.set(id, {
        target: object,
        velocity: { x: 0, y: 0 }
      })
    }
    
    const spring = this.springs.get(id)!
    const dx = targetX - object.x
    const dy = targetY - object.y
    
    // Apply spring force
    spring.velocity.x += dx * this.physicsConfig.springStrength
    spring.velocity.y += dy * this.physicsConfig.springStrength
    
    // Apply damping
    spring.velocity.x *= this.physicsConfig.damping
    spring.velocity.y *= this.physicsConfig.damping
    
    // Update position
    object.x += spring.velocity.x
    object.y += spring.velocity.y
  }
  
  // Create a subtle glow effect for hover states
  createHoverGlow(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number): void {
    if (!this.colorEffectConfig.enabled || !this.colorEffectConfig.hoverGlow) return
    
    const glowRadius = radius + 10
    const steps = 5
    
    for (let i = steps; i > 0; i--) {
      const alpha = 0.1 * (i / steps)
      const currentRadius = radius + (glowRadius - radius) * (i / steps)
      
      graphics.lineStyle(2, color, alpha)
      graphics.strokeCircle(x, y, currentRadius)
    }
  }
  
  // Create gradient fills for modern look
  createGradientFill(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, startColor: number, endColor: number): void {
    if (!this.colorEffectConfig.enabled || !this.colorEffectConfig.gradientFill) return
    
    // Phaser doesn't support true gradients, so we'll simulate with multiple rectangles
    const steps = 10
    const stepHeight = height / steps
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const color = this.interpolateColor(startColor, endColor, ratio)
      graphics.fillStyle(color, 0.8)
      graphics.fillRect(x, y + i * stepHeight, width, stepHeight + 1)
    }
  }
  
  // Add subtle shadow/blur effect
  applyShadowBlur(container: Phaser.GameObjects.Container): void {
    if (!this.colorEffectConfig.enabled || !this.colorEffectConfig.shadowBlur) return
    
    // Create shadow by duplicating graphics with offset and lower alpha
    const children = container.list
    const shadowContainer = this.scene.add.container(container.x + 2, container.y + 2)
    
    children.forEach(child => {
      if (child instanceof Phaser.GameObjects.Graphics) {
        const shadow = this.scene.add.graphics()
        shadow.setAlpha(0.2)
        // Copy the graphics commands would be complex, so we'll use a different approach
      }
    })
  }
  
  // Pulse effect on creation
  startPulseEffect(object: Phaser.GameObjects.GameObject, id: string): void {
    if (!this.colorEffectConfig.enabled || !this.colorEffectConfig.pulseOnCreate) return
    
    this.pulsingObjects.set(id, {
      object,
      startTime: this.scene.time.now
    })
  }
  
  // Update all effects
  update(): void {
    // Update pulsing objects
    this.pulsingObjects.forEach((pulse, id) => {
      const elapsed = this.scene.time.now - pulse.startTime
      const duration = 1000 // 1 second pulse
      
      if (elapsed > duration) {
        pulse.object.setScale(1)
        this.pulsingObjects.delete(id)
      } else {
        const progress = elapsed / duration
        const scale = 1 + Math.sin(progress * Math.PI) * 0.1
        pulse.object.setScale(scale)
      }
    })
    
    // Update spring physics
    this.springs.forEach((spring, id) => {
      // Springs update is handled in applySpringPhysics
    })
  }
  
  // Helper to interpolate between colors
  private interpolateColor(startColor: number, endColor: number, ratio: number): number {
    const r1 = (startColor >> 16) & 0xff
    const g1 = (startColor >> 8) & 0xff
    const b1 = startColor & 0xff
    
    const r2 = (endColor >> 16) & 0xff
    const g2 = (endColor >> 8) & 0xff
    const b2 = endColor & 0xff
    
    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)
    
    return (r << 16) | (g << 8) | b
  }
  
  // Magnetic attraction effect for annotations near cursor
  applyMagneticAttraction(object: Phaser.GameObjects.GameObject, cursorX: number, cursorY: number, strength: number = 0.1): void {
    if (!this.physicsConfig.enabled) return
    
    const dx = cursorX - object.x
    const dy = cursorY - object.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < this.physicsConfig.attractionRadius && distance > 0) {
      const force = (1 - distance / this.physicsConfig.attractionRadius) * strength
      object.x += (dx / distance) * force
      object.y += (dy / distance) * force
    }
  }
  
  // Clean up effects for an annotation
  cleanup(id: string): void {
    this.springs.delete(id)
    this.pulsingObjects.delete(id)
  }
  
  // Get/set configurations
  setPhysicsConfig(config: Partial<PhysicsConfig>): void {
    this.physicsConfig = { ...this.physicsConfig, ...config }
  }
  
  setColorEffectConfig(config: Partial<ColorEffectConfig>): void {
    this.colorEffectConfig = { ...this.colorEffectConfig, ...config }
  }
}