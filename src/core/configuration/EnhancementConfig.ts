/**
 * Configuration for advanced scalar field enhancement algorithms
 * Enables integration of orphaned ScalarFieldEnhancements functionality
 */

export type EnhancementAlgorithm = 'none' | 'anisotropic' | 'coherence' | 'multiscale' | 'shock'

export interface EnhancementConfig {
  /** Enable/disable enhancement processing */
  enabled: boolean
  
  /** Algorithm to use for enhancement */
  algorithm: EnhancementAlgorithm
  
  /** Enhancement strength (0-1) */
  strength: number
  
  /** Number of enhancement iterations */
  iterations: number
  
  /** Preserve edges during enhancement */
  preserveEdges: boolean
  
  /** Advanced algorithm-specific parameters */
  algorithmParams: {
    /** Anisotropic diffusion parameters */
    anisotropic: {
      kappa: number
      lambda: number
    }
    
    /** Coherence enhancing diffusion parameters */
    coherence: {
      alpha: number
      C: number
      m: number
      sigma: number
    }
    
    /** Multi-scale enhancement parameters */
    multiscale: {
      scales: number[]
      weights: number[]
      blendMode: 'weighted' | 'max' | 'adaptive'
    }
    
    /** Shock filter parameters */
    shock: {
      dt: number
      threshold: number
    }
  }
}

export const DEFAULT_ENHANCEMENT_CONFIG: EnhancementConfig = {
  enabled: false,
  algorithm: 'anisotropic',
  strength: 0.5,
  iterations: 5,
  preserveEdges: true,
  algorithmParams: {
    anisotropic: {
      kappa: 0.1,
      lambda: 0.15
    },
    coherence: {
      alpha: 0.001,
      C: 1.0,
      m: 1,
      sigma: 0.5
    },
    multiscale: {
      scales: [1, 2, 4],
      weights: [0.5, 0.3, 0.2],
      blendMode: 'weighted'
    },
    shock: {
      dt: 0.125,
      threshold: 0.1
    }
  }
}

/**
 * Algorithm descriptions for UI display
 */
export const ENHANCEMENT_ALGORITHM_DESCRIPTIONS = {
  none: {
    name: 'No Enhancement',
    description: 'Use basic processing without enhancement',
    icon: '⚡',
    performance: 'Fast',
    quality: 'Standard'
  },
  anisotropic: {
    name: 'Anisotropic Diffusion',
    description: 'Edge-preserving smoothing that maintains structural details',
    icon: '🔧',
    performance: 'Medium',
    quality: 'High'
  },
  coherence: {
    name: 'Coherence Enhancement', 
    description: 'Structure-preserving filtering that enhances linear features',
    icon: '📐',
    performance: 'Slow',
    quality: 'Very High'
  },
  multiscale: {
    name: 'Multi-Scale Processing',
    description: 'Multi-resolution enhancement for complex structures',
    icon: '🔍',
    performance: 'Medium',
    quality: 'High'
  },
  shock: {
    name: 'Edge Sharpening',
    description: 'Enhances edges and boundaries for crisp contours',
    icon: '⚡',
    performance: 'Fast',
    quality: 'Medium'
  }
} as const

/**
 * Validate enhancement configuration
 */
export function validateEnhancementConfig(config: Partial<EnhancementConfig>): EnhancementConfig {
  return {
    enabled: config.enabled ?? DEFAULT_ENHANCEMENT_CONFIG.enabled,
    algorithm: config.algorithm ?? DEFAULT_ENHANCEMENT_CONFIG.algorithm,
    strength: Math.max(0, Math.min(1, config.strength ?? DEFAULT_ENHANCEMENT_CONFIG.strength)),
    iterations: Math.max(1, Math.min(20, config.iterations ?? DEFAULT_ENHANCEMENT_CONFIG.iterations)),
    preserveEdges: config.preserveEdges ?? DEFAULT_ENHANCEMENT_CONFIG.preserveEdges,
    algorithmParams: {
      anisotropic: {
        kappa: Math.max(0.01, Math.min(1, 
          config.algorithmParams?.anisotropic?.kappa ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.anisotropic.kappa
        )),
        lambda: Math.max(0.01, Math.min(0.25, 
          config.algorithmParams?.anisotropic?.lambda ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.anisotropic.lambda
        ))
      },
      coherence: {
        alpha: Math.max(0.0001, Math.min(0.01,
          config.algorithmParams?.coherence?.alpha ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.coherence.alpha
        )),
        C: Math.max(0.1, Math.min(10,
          config.algorithmParams?.coherence?.C ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.coherence.C
        )),
        m: Math.max(1, Math.min(4,
          config.algorithmParams?.coherence?.m ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.coherence.m
        )),
        sigma: Math.max(0.1, Math.min(2,
          config.algorithmParams?.coherence?.sigma ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.coherence.sigma
        ))
      },
      multiscale: {
        scales: config.algorithmParams?.multiscale?.scales ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.multiscale.scales,
        weights: config.algorithmParams?.multiscale?.weights ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.multiscale.weights,
        blendMode: config.algorithmParams?.multiscale?.blendMode ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.multiscale.blendMode
      },
      shock: {
        dt: Math.max(0.01, Math.min(0.5,
          config.algorithmParams?.shock?.dt ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.shock.dt
        )),
        threshold: Math.max(0.01, Math.min(1,
          config.algorithmParams?.shock?.threshold ?? DEFAULT_ENHANCEMENT_CONFIG.algorithmParams.shock.threshold
        ))
      }
    }
  }
}