/**
 * Simplified contour settings component
 * Focuses on presets and essential controls only
 */

import React, { useState } from 'react'
import { ContourConfig, ContourPreset, CONTOUR_PRESETS } from '../types/contourConfig'
import { BeamElevationSceneRefactored } from '../scenes/BeamElevationSceneRefactored'

interface ContourSettingsProps {
  scene?: BeamElevationSceneRefactored
}

export const ContourSettings: React.FC<ContourSettingsProps> = ({ scene }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [preset, setPreset] = useState<ContourPreset>('default')
  const [customConfig, setCustomConfig] = useState<ContourConfig>(CONTOUR_PRESETS.default)
  const [isCustom, setIsCustom] = useState(false)

  const handlePresetChange = (newPreset: ContourPreset) => {
    setPreset(newPreset)
    setIsCustom(false)
    scene?.setPreset(newPreset)
    setCustomConfig(CONTOUR_PRESETS[newPreset])
  }

  const handleCustomChange = (
    category: keyof ContourConfig,
    field: string,
    value: number | boolean
  ) => {
    const updated = {
      ...customConfig,
      [category]: {
        ...customConfig[category],
        [field]: value
      }
    }
    
    setCustomConfig(updated)
    setIsCustom(true)
    scene?.setContourConfig(updated)
  }

  if (!scene) return null

  return (
    <div className="contour-settings">
      {/* Compact toggle button */}
      <button
        className="settings-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle contour settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="settings-panel">
          <h3>Contour Settings</h3>
          
          {/* Preset selector */}
          <div className="setting-group">
            <label>Preset</label>
            <select
              value={isCustom ? 'custom' : preset}
              onChange={(e) => {
                const value = e.target.value
                if (value !== 'custom') {
                  handlePresetChange(value as ContourPreset)
                }
              }}
            >
              <option value="default">Default</option>
              <option value="sharp">Sharp</option>
              <option value="organic">Organic</option>
              <option value="technical">Technical</option>
              {isCustom && <option value="custom">Custom</option>}
            </select>
          </div>

          {/* Simplified custom controls */}
          <details className="advanced-settings">
            <summary>Fine-tune</summary>
            
            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={customConfig.smoothing.enabled}
                  onChange={(e) => 
                    handleCustomChange('smoothing', 'enabled', e.target.checked)
                  }
                />
                Enable Smoothing
              </label>
              
              {customConfig.smoothing.enabled && (
                <div className="slider-group">
                  <label>Smoothing Strength</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={customConfig.smoothing.strength}
                    onChange={(e) => 
                      handleCustomChange('smoothing', 'strength', parseFloat(e.target.value))
                    }
                  />
                  <span>{customConfig.smoothing.strength.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="setting-group">
              <label>
                <input
                  type="checkbox"
                  checked={customConfig.separation.enabled}
                  onChange={(e) => 
                    handleCustomChange('separation', 'enabled', e.target.checked)
                  }
                />
                Prevent Overlaps
              </label>
              
              {customConfig.separation.enabled && (
                <div className="slider-group">
                  <label>Min Distance</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={customConfig.separation.minDistance}
                    onChange={(e) => 
                      handleCustomChange('separation', 'minDistance', parseFloat(e.target.value))
                    }
                  />
                  <span>{customConfig.separation.minDistance.toFixed(1)}</span>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      <style jsx>{`
        .contour-settings {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .settings-toggle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #333;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }

        .settings-toggle:hover {
          background: #555;
          transform: scale(1.05);
        }

        .settings-panel {
          position: absolute;
          bottom: 50px;
          right: 0;
          width: 250px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 16px;
        }

        .settings-panel h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .setting-group {
          margin-bottom: 16px;
        }

        .setting-group label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }

        .setting-group select {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .setting-group input[type="checkbox"] {
          margin-right: 8px;
        }

        .slider-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .slider-group label {
          flex: 0 0 auto;
          font-size: 12px;
        }

        .slider-group input[type="range"] {
          flex: 1;
        }

        .slider-group span {
          flex: 0 0 40px;
          text-align: right;
          font-size: 12px;
          font-weight: 600;
        }

        .advanced-settings {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .advanced-settings summary {
          cursor: pointer;
          font-size: 14px;
          color: #666;
          outline: none;
        }

        .advanced-settings[open] summary {
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  )
}