import React, { useState } from 'react'
import { BaseExportDialog } from './BaseExportDialog'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  onShare?: (method: string) => void
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  onShare
}) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <BaseExportDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Share Inspection"
      icon="🔗"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Share Options */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { icon: '📧', label: 'Email', desc: 'Send via email', action: 'email' },
            { icon: '💬', label: 'Teams', desc: 'Share to MS Teams', action: 'teams' },
            { icon: '📱', label: 'QR Code', desc: 'Generate QR code', action: 'qr' },
            { icon: '☁️', label: 'Cloud', desc: 'Save to cloud', action: 'cloud' }
          ].map(option => (
            <button
              key={option.action}
              onClick={() => onShare?.(option.action)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
                e.currentTarget.style.borderColor = '#9C27B0'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{option.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{option.label}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{option.desc}</div>
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#333'
          }}>
            Direct Link
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={window.location.href}
              readOnly
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace',
                backgroundColor: '#f5f5f5'
              }}
            />
            <button
              onClick={handleCopyLink}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: copySuccess ? '#4CAF50' : 'white',
                color: copySuccess ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                minWidth: '80px'
              }}
            >
              {copySuccess ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Note */}
        <div style={{
          padding: '12px',
          backgroundColor: '#E1F5FE',
          borderRadius: '8px',
          border: '1px solid #81D4FA'
        }}>
          <div style={{ fontSize: '13px', color: '#0277BD' }}>
            ℹ️ Sharing features are currently in development. The link above can be used to bookmark this inspection.
          </div>
        </div>
      </div>
    </BaseExportDialog>
  )
}