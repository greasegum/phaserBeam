import React, { useState } from 'react'
import { BeamElevationScene } from '../scenes/BeamElevationScene'
import { AppMode } from '../types/mode'

interface UnifiedSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  scene?: BeamElevationScene
  appMode: AppMode
  showTopFlange: boolean
  onToggleTopFlange: (show: boolean) => void
  gridOrigin: 'left' | 'right'
  onToggleGridOrigin: (origin: 'left' | 'right') => void
}

type TabType = 'general' | 'rendering' | 'debug'

const TAB_INFO: Record<TabType, { label: string; icon: string }> = {
  general: { label: 'General', icon: '⚙️' },
  rendering: { label: 'Rendering', icon: '🎨' },
  debug: { label: 'Debug', icon: '🐛' }
}

export const UnifiedSettingsPanel: React.FC<UnifiedSettingsPanelProps> = ({
  isOpen,
  onClose,
  scene,
  appMode,
  showTopFlange,
  onToggleTopFlange,
  gridOrigin,
  onToggleGridOrigin,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  
  // Rendering settings (simplified)
  const [smoothingLevel, setSmoothingLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [contourQuality, setContourQuality] = useState<'draft' | 'normal' | 'high'>('normal')
  
  if (!isOpen) return null
  
  const renderGeneralTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Grid Settings */}
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📐</span> Grid Settings
        </h3>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}>
            <span style={{ fontSize: '14px', color: '#4B5563' }}>Show Top Flange</span>
            <input
              type="checkbox"
              checked={showTopFlange}
              onChange={e => onToggleTopFlange(e.target.checked)}
              disabled={appMode === 'view'}
              style={{
                width: '20px',
                height: '20px',
                cursor: appMode === 'view' ? 'not-allowed' : 'pointer'
              }}
            />
          </label>
          
          <div>
            <label style={{
              fontSize: '14px',
              color: '#4B5563',
              display: 'block',
              marginBottom: '8px'
            }}>
              Grid Origin
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onToggleGridOrigin('left')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: gridOrigin === 'left' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  backgroundColor: gridOrigin === 'left' ? '#EFF6FF' : 'white',
                  color: gridOrigin === 'left' ? '#3B82F6' : '#6B7280',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Left
              </button>
              <button
                onClick={() => onToggleGridOrigin('right')}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: gridOrigin === 'right' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  borderRadius: '6px',
                  backgroundColor: gridOrigin === 'right' ? '#EFF6FF' : 'white',
                  color: gridOrigin === 'right' ? '#3B82F6' : '#6B7280',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Right
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mode-specific Settings */}
      {appMode === 'annotation' && (
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📏</span> Annotation Settings
          </h3>
          
          <div style={{
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '14px', color: '#4B5563' }}>Show Beam End Dimensions</span>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}>
              <span style={{ fontSize: '14px', color: '#4B5563' }}>Show Bottom Ordinate</span>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
  
  const renderRenderingTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>✨</span> Contour Quality
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {(['draft', 'normal', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => setContourQuality(level)}
              style={{
                padding: '12px',
                border: contourQuality === level ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: contourQuality === level ? '#EFF6FF' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                textTransform: 'capitalize'
              }}>
                {level}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                marginTop: '2px'
              }}>
                {level === 'draft' && 'Fast preview'}
                {level === 'normal' && 'Balanced'}
                {level === 'high' && 'Best quality'}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>〰️</span> Smoothing
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {(['low', 'medium', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => setSmoothingLevel(level)}
              style={{
                padding: '12px',
                border: smoothingLevel === level ? '2px solid #10B981' : '1px solid #E5E7EB',
                borderRadius: '8px',
                backgroundColor: smoothingLevel === level ? '#F0FDF4' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#111827',
                textTransform: 'capitalize'
              }}>
                {level}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                marginTop: '2px'
              }}>
                {level === 'low' && 'Sharp edges'}
                {level === 'medium' && 'Balanced'}
                {level === 'high' && 'Very smooth'}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div style={{
        padding: '12px',
        backgroundColor: '#FEF3C7',
        borderRadius: '8px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '14px' }}>💡</span>
        <p style={{
          fontSize: '13px',
          color: '#92400E',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Higher quality settings may affect performance on large inspections.
          Use draft mode for quick previews.
        </p>
      </div>
    </div>
  )
  
  const renderDebugTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🔍</span> Visualization Options
        </h3>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}>
            <div>
              <div style={{ fontSize: '14px', color: '#111827' }}>Contour Display</div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                Control how contours are shown
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#4B5563' }}>
              Always Enabled
            </div>
          </label>
          
          <div style={{
            paddingLeft: '24px',
            fontSize: '12px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            Marching squares contours are always displayed when defects are present.
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '12px',
        backgroundColor: '#F3F4F6',
        borderRadius: '8px',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '14px' }}>ℹ️</span>
        <p style={{
          fontSize: '13px',
          color: '#4B5563',
          margin: 0,
          lineHeight: '1.5'
        }}>
          Debug options help visualize how contours are generated.
          These are for troubleshooting and won't appear in exports.
        </p>
      </div>
    </div>
  )
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: isOpen ? 0 : '-400px',
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: isOpen ? '-4px 0 6px rgba(0, 0, 0, 0.05)' : 'none',
      transition: 'right 0.3s ease-out',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          Settings
        </h2>
        <button
          onClick={onClose}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: '#6B7280',
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          ×
        </button>
      </div>
      
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        {(Object.keys(TAB_INFO) as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? '#3B82F6' : '#6B7280'
            }}>
              <span>{TAB_INFO[tab].icon}</span>
              <span>{TAB_INFO[tab].label}</span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto'
      }}>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'rendering' && renderRenderingTab()}
        {activeTab === 'debug' && renderDebugTab()}
      </div>
      
      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        <button
          onClick={() => {
            // Apply settings
            if (scene) {
              // Apply rendering settings based on quality levels
              const smoothingMap = { low: 0, medium: 1, high: 2 }
              const qualityMap = { draft: 0.5, normal: 1, high: 1.5 }
              
              // These would need to be connected to actual scene methods
              console.log('Applying settings:', { smoothingLevel, contourQuality })
            }
            onClose()
          }}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          Apply Changes
        </button>
      </div>
    </div>
  )
}