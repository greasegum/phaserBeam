import React, { useState } from 'react'
import { VectorExportService, VectorExportOptions, VectorExportContext, VectorLayer } from '../services/VectorExportService'
import { BeamProfile, GridCell } from '../types/beam'

interface VectorExportDialogProps {
  isOpen: boolean
  onClose: () => void
  beamProfile: BeamProfile | null
  beamLength: number
  cells: GridCell[]
  gridSize: number
  annotations?: any[]
  initialFormat?: 'svg' | 'pdf' | 'dxf'
}

export const VectorExportDialog: React.FC<VectorExportDialogProps> = ({
  isOpen,
  onClose,
  beamProfile,
  beamLength,
  cells,
  gridSize,
  annotations,
  initialFormat = 'svg'
}) => {
  const [format, setFormat] = useState<'svg' | 'pdf' | 'dxf'>(initialFormat)
  
  // Update format when initialFormat changes (when dialog reopens)
  React.useEffect(() => {
    if (isOpen) {
      setFormat(initialFormat)
    }
  }, [isOpen, initialFormat])
  const [scale, setScale] = useState(1)
  const [includeGrid, setIncludeGrid] = useState(true)
  const [includeAnnotations, setIncludeAnnotations] = useState(true)
  const [includeDimensions, setIncludeDimensions] = useState(true)
  const [includeDefectPattern, setIncludeDefectPattern] = useState(true)
  const [includeLegend, setIncludeLegend] = useState(true)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [useTransparentBg, setUseTransparentBg] = useState(false)
  const [title, setTitle] = useState('Beam Inspection Report')
  const [isExporting, setIsExporting] = useState(false)
  
  const [layers, setLayers] = useState<VectorLayer[]>([
    { id: 'background', name: 'Background', visible: true, order: 0, opacity: 1 },
    { id: 'grid', name: 'Grid', visible: true, order: 1, opacity: 0.3 },
    { id: 'beam', name: 'Beam Profile', visible: true, order: 2, opacity: 1 },
    { id: 'defects', name: 'Defects', visible: true, order: 3, opacity: 0.8 },
    { id: 'annotations', name: 'Annotations', visible: true, order: 4, opacity: 1 },
    { id: 'dimensions', name: 'Dimensions', visible: true, order: 5, opacity: 1 },
    { id: 'legend', name: 'Legend', visible: true, order: 6, opacity: 1 }
  ])
  
  if (!isOpen || !beamProfile) return null
  
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exportService = new VectorExportService()
      
      // Calculate dimensions
      const padding = 50
      const width = beamLength * gridSize
      const height = (beamProfile.webHeight + beamProfile.flangeThickness * 2) * gridSize
      const centerY = height / 2
      
      const context: VectorExportContext = {
        beamProfile,
        beamLength,
        cells,
        gridSize,
        dimensions: {
          startX: padding,
          centerY,
          width,
          height
        },
        annotations
      }
      
      const options: VectorExportOptions = {
        format,
        scale,
        layers,
        backgroundColor: useTransparentBg ? 'transparent' : backgroundColor,
        includeGrid,
        includeAnnotations,
        includeDimensions,
        includeDefectPattern,
        includeLegend,
        title,
        metadata: {
          beamType: beamProfile.name,
          beamLength: `${beamLength}"`,
          defectCount: cells.length,
          exportDate: new Date().toISOString()
        }
      }
      
      let result
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const baseFileName = `beam-inspection-${timestamp}`
      
      switch (format) {
        case 'svg':
          result = await exportService.exportSVG(context, options)
          if (result.success && result.data) {
            downloadFile(result.data, `${baseFileName}.svg`, 'image/svg+xml')
          }
          break
          
        case 'pdf':
          result = await exportService.exportPDF(context, options)
          if (result.success && result.data) {
            downloadBlob(result.data, `${baseFileName}.pdf`)
          }
          break
          
        case 'dxf':
          result = await exportService.exportDXF(context, options)
          if (result.success && result.data) {
            downloadFile(result.data, `${baseFileName}.dxf`, 'application/dxf')
          }
          break
      }
      
      if (!result?.success) {
        alert(`Export failed: ${result?.error || 'Unknown error'}`)
      } else {
        onClose()
      }
    } catch (error) {
      alert(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }
  
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    downloadBlob(blob, fileName)
  }
  
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  const toggleLayer = (layerId: string) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }
  
  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(layers.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity }
        : layer
    ))
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Vector Export</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormat('svg')}
                className={`px-4 py-2 rounded border ${
                  format === 'svg' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">SVG</div>
                <div className="text-xs text-gray-600">Vector Graphics</div>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`px-4 py-2 rounded border ${
                  format === 'pdf' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-600">Document</div>
              </button>
              <button
                onClick={() => setFormat('dxf')}
                className={`px-4 py-2 rounded border ${
                  format === 'dxf' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">DXF</div>
                <div className="text-xs text-gray-600">CAD Format</div>
              </button>
            </div>
          </div>
          
          {/* Basic Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Export Options</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1 text-sm border rounded"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">
                  Scale: {scale}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium mb-1">Background</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={useTransparentBg}
                      onChange={(e) => setUseTransparentBg(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Transparent</span>
                  </label>
                  {!useTransparentBg && (
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-8 w-20"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Layer Management */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Layers</h3>
            <div className="space-y-2 bg-gray-50 p-3 rounded">
              {layers.map(layer => (
                <div key={layer.id} className="flex items-center justify-between bg-white p-2 rounded">
                  <label className="flex items-center flex-1">
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => toggleLayer(layer.id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{layer.name}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={layer.opacity}
                      onChange={(e) => updateLayerOpacity(layer.id, Number(e.target.value))}
                      className="w-20"
                      disabled={!layer.visible}
                    />
                    <span className="text-xs w-8">{layer.opacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Content Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Include Elements</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Grid Lines</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Annotations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDimensions}
                  onChange={(e) => setIncludeDimensions(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Dimensions</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeDefectPattern}
                  onChange={(e) => setIncludeDefectPattern(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Defect Patterns (SVG only)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeLegend}
                  onChange={(e) => setIncludeLegend(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Legend</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}