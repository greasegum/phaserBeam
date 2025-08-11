import React, { useState } from 'react'
import { UnifiedAlgorithmPanel } from './panels/UnifiedAlgorithmPanel'
import { EnhancementConfigPanel } from './panels/EnhancementConfigPanel'
import { UnifiedConfigManager } from '../core/configuration/UnifiedConfigManager'

interface UnifiedSettingsPanelProps {
  configManager: UnifiedConfigManager
  onConfigChange?: (config: any) => void
  onClose?: () => void
}

export const UnifiedSettingsPanel: React.FC<UnifiedSettingsPanelProps> = ({
  configManager,
  onConfigChange,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<'algorithms' | 'enhancement' | 'rendering' | 'grid' | 'export'>('algorithms')

  const renderSectionButton = (id: string, label: string, icon: string) => (
    <button
      key={id}
      onClick={() => setActiveSection(id as any)}
      style={{
        padding: '12px 16px',
        border: 'none',
        background: activeSection === id ? '#3B82F6' : 'transparent',
        color: activeSection === id ? 'white' : '#666',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxHeight: '80vh',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #E5E7EB',
      zIndex: 1000,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#1F2937'
          }}>
            ⚙️ Advanced Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F3F4F6'
              e.currentTarget.style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = '#6B7280'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #E5E7EB',
        background: '#F9FAFB'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {renderSectionButton('algorithms', 'Algorithms', '🎛️')}
          {renderSectionButton('enhancement', 'Enhancement', '🔬')}
          {renderSectionButton('rendering', 'Rendering', '🎨')}
          {renderSectionButton('grid', 'Grid', '📐')}
          {renderSectionButton('export', 'Export', '📤')}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxHeight: '60vh',
        overflow: 'auto'
      }}>
        {activeSection === 'algorithms' && (
          <UnifiedAlgorithmPanel
            configManager={configManager}
            onConfigChange={onConfigChange}
          />
        )}

        {activeSection === 'enhancement' && (
          <div style={{ padding: '24px' }}>
            <EnhancementConfigPanel
              config={configManager.getConfig().enhancement}
              onConfigChange={(updates) => {
                configManager.updateEnhancementSettings(updates)
                onConfigChange?.(configManager.getConfig())
              }}
            />
          </div>
        )}

        {activeSection === 'rendering' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1F2937',
              borderBottom: '2px solid #3B82F6',
              paddingBottom: '8px'
            }}>
              🎨 Rendering Settings
            </h4>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Configure visual rendering options and display settings
            </p>
            
            <div style={{ color: '#6B7280', fontSize: '14px', fontStyle: 'italic' }}>
              Rendering settings panel coming soon...
            </div>
          </div>
        )}

        {activeSection === 'grid' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1F2937',
              borderBottom: '2px solid #3B82F6',
              paddingBottom: '8px'
            }}>
              📐 Grid Settings
            </h4>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Configure grid display and interaction settings
            </p>
            
            <div style={{ color: '#6B7280', fontSize: '14px', fontStyle: 'italic' }}>
              Grid settings panel coming soon...
            </div>
          </div>
        )}

        {activeSection === 'export' && (
          <div style={{ padding: '24px' }}>
            <h4 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1F2937',
              borderBottom: '2px solid #3B82F6',
              paddingBottom: '8px'
            }}>
              📤 Export Settings
            </h4>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>
              Configure export options and output settings
            </p>
            
            <div style={{ color: '#6B7280', fontSize: '14px', fontStyle: 'italic' }}>
              Export settings panel coming soon...
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #E5E7EB',
        background: '#F9FAFB',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            border: '1px solid #D1D5DB',
            background: 'white',
            color: '#374151',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white'
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfigChange?.(configManager.getConfig())
            onClose?.()
          }}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: '#3B82F6',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563EB'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3B82F6'
          }}
        >
          Apply Settings
        </button>
      </div>
    </div>
  )
}