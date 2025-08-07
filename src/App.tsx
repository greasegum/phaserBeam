import { useState, useEffect } from 'react'
import { SetupPopup } from './components/SetupPopup'
import { PhaserCanvas } from './components/PhaserCanvas'
import { BeamProfile, GridCell } from './types/beam'
import { AppMode, MODE_CONFIGS } from './types/mode'
import { AnnotationType } from './types/annotations'
import { ModeToolbar } from './components/ModeToolbar'
import { ZoomControl } from './components/ZoomControl'
import { DefectType } from './types/defects'
import { exportCanvasAsPNG, exportCanvasAsSVG } from './utils/canvasExport'
import { BeamElevationScene } from './scenes/BeamElevationScene'
import { VectorExportDialog } from './components/VectorExportDialog'
import { PNGExportDialog } from './components/export/PNGExportDialog'
import { SVGExportDialog } from './components/export/SVGExportDialog'
import { PDFExportDialog } from './components/export/PDFExportDialog'
import { ReportExportDialog } from './components/export/ReportExportDialog'
import { ShareDialog } from './components/export/ShareDialog'
import { PrintDialog } from './components/export/PrintDialog'

export default function App() {
  const [selectedBeam, setSelectedBeam] = useState<BeamProfile | null>(null)
  const [beamLength, setBeamLength] = useState<number>(120)
  const [gridCells, setGridCells] = useState<GridCell[]>([])
  const [showSetup, setShowSetup] = useState<boolean>(true)
  const [appMode, setAppMode] = useState<AppMode>('edit')
  const [gridOrigin, setGridOrigin] = useState<'left' | 'right'>('left')
  const [showTopFlange, setShowTopFlange] = useState<boolean>(true)
  const [elevationView, setElevationView] = useState<'N' | 'S' | 'E' | 'W'>('N')
  const [isMobile, setIsMobile] = useState(false)
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<AnnotationType>('linear-dimension')
  const [ordinateOriginSide, setOrdinateOriginSide] = useState<'left' | 'right'>('left')
  const [showBeamEndDimensions, setShowBeamEndDimensions] = useState(true)
  const [showBottomOrdinate, setShowBottomOrdinate] = useState(true)
  const [spanLength, setSpanLength] = useState<number>(96) // Default 96" (8 ft)
  const [currentZoom, setCurrentZoom] = useState<number>(1.0)
  const [selectedDefectType, setSelectedDefectType] = useState<DefectType>('section-loss')
  const [currentScene, setCurrentScene] = useState<BeamElevationScene | null>(null)
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false)
  const [selectedExportFormat, setSelectedExportFormat] = useState<'svg' | 'pdf' | 'dxf'>('svg')
  
  // Individual export dialog states
  const [showPNGDialog, setShowPNGDialog] = useState<boolean>(false)
  const [showSVGDialog, setShowSVGDialog] = useState<boolean>(false)
  const [showPDFDialog, setShowPDFDialog] = useState<boolean>(false)
  const [showReportDialog, setShowReportDialog] = useState<boolean>(false)
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false)
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSetupComplete = (beam: BeamProfile, length: number, elevation: 'N' | 'S' | 'E' | 'W', span: number, topFlange: boolean) => {
    setSelectedBeam(beam)
    setBeamLength(length)
    setElevationView(elevation)
    setSpanLength(span)
    setShowTopFlange(topFlange)
    setShowSetup(false)
  }

  const handleCellChange = (cells: GridCell[]) => {
    setGridCells(cells)
  }
  
  // Individual export handlers
  const handleExportPNG = (options: any) => {
    if (!currentScene || !selectedBeam) return
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const beamName = selectedBeam.name.replace(/\s+/g, '-')
    
    // Apply options like scale, background color, etc.
    // For now, use simple export
    exportCanvasAsPNG(currentScene, `${beamName}-inspection-${timestamp}.png`)
  }
  
  const handleExportSVG = (options: any) => {
    if (!currentScene || !selectedBeam) return
    
    // Use the existing VectorExportDialog for SVG
    setSelectedExportFormat('svg')
    setShowExportDialog(true)
    setShowSVGDialog(false)
  }
  
  const handleExportPDF = (options: any) => {
    if (!currentScene || !selectedBeam) return
    
    // Use the existing VectorExportDialog for PDF
    setSelectedExportFormat('pdf')
    setShowExportDialog(true)
    setShowPDFDialog(false)
  }
  
  const handleExportReport = (options: any) => {
    if (!selectedBeam) return
    
    const { format, includeHeader, includeBeamProperties, includeSectionLossMatrix, includeStatistics, coordinateSystem } = options
    
    // Generate report content based on format
    let content = ''
    const timestamp = new Date().toISOString()
    const beamName = selectedBeam.name
    
    if (format === 'matlab') {
      content = `% Beam Section Loss Analysis\n`
      content += `% Generated: ${timestamp}\n`
      content += `% Beam: ${beamName}\n`
      content += `% Length: ${beamLength}" (${(beamLength/12).toFixed(1)} ft)\n\n`
      
      if (includeBeamProperties) {
        content += `% Beam Properties\n`
        content += `webHeight = ${selectedBeam.webHeight}; % inches\n`
        content += `webThickness = ${selectedBeam.webThickness}; % inches\n`
        content += `flangeWidth = ${selectedBeam.flangeWidth}; % inches\n`
        content += `flangeThickness = ${selectedBeam.flangeThickness}; % inches\n\n`
      }
      
      if (includeSectionLossMatrix) {
        content += `% Section Loss Matrix\n`
        content += `% Coordinates: ${coordinateSystem}\n`
        content += `sectionLoss = [\n`
        
        // Group cells by row for matrix representation
        const cellsByRow = new Map<number, GridCell[]>()
        gridCells.forEach(cell => {
          const row = cell.y
          if (!cellsByRow.has(row)) cellsByRow.set(row, [])
          cellsByRow.get(row)!.push(cell)
        })
        
        // Create matrix representation
        const sortedRows = Array.from(cellsByRow.keys()).sort((a, b) => a - b)
        sortedRows.forEach(row => {
          const cells = cellsByRow.get(row)!.sort((a, b) => a.x - b.x)
          content += `  % Row ${row}: `
          cells.forEach(cell => {
            content += `[${cell.x},${cell.y}] `
          })
          content += `\n`
        })
        content += `];\n\n`
      }
      
      if (includeStatistics) {
        const totalCells = gridCells.length
        const webCells = gridCells.filter(c => c.zone === 'web').length
        const flangeCells = gridCells.filter(c => c.zone === 'flange').length
        
        content += `% Statistics\n`
        content += `totalDefects = ${totalCells};\n`
        content += `webDefects = ${webCells};\n`
        content += `flangeDefects = ${flangeCells};\n`
        content += `sectionLossPercentage = ${((totalCells * 1 * 1) / (selectedBeam.webHeight * beamLength) * 100).toFixed(2)}; % percent\n`
      }
    }
    
    // Download the file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${beamName.replace(/\s+/g, '-')}-analysis-${timestamp.slice(0,10)}.${format === 'matlab' ? 'm' : format}`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleShare = (method: string) => {
    console.log('Share via:', method)
    // Implement sharing functionality based on method
  }
  
  const handlePrint = (options: any) => {
    console.log('Print with options:', options)
    // Print functionality is handled by the dialog itself
  }

  if (showSetup) {
    return <SetupPopup onComplete={handleSetupComplete} />
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Minimal header */}
      <header style={{ 
        backgroundColor: 'white', 
        padding: '10px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ 
            color: '#333', 
            fontSize: '20px',
            margin: 0
          }}>Beam Inspection</h1>
          {selectedBeam && (
            <span style={{ color: '#666', fontSize: '14px' }}>
              {selectedBeam.name} • {beamLength}" ({(beamLength/12).toFixed(1)} ft)
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={appMode}
            onChange={(e) => {
              console.log('App.tsx: Changing mode from', appMode, 'to', e.target.value)
              setAppMode(e.target.value as AppMode)
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <option value="edit">Edit Mode</option>
            <option value="view">View Mode</option>
            <option value="annotation">Annotation Mode</option>
          </select>
          <button
            onClick={() => setGridCells([])}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff9999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            New Inspection
          </button>
        </div>
      </header>
      
      {/* Mode-specific toolbar band (2nd from top) */}
      <ModeToolbar
        appMode={appMode}
        // Annotation mode props
        selectedAnnotationTool={selectedAnnotationTool}
        onSelectAnnotationTool={setSelectedAnnotationTool}
        ordinateOriginSide={gridOrigin}
        onToggleOrdinateOrigin={() => setGridOrigin(gridOrigin === 'left' ? 'right' : 'left')}
        showBeamEndDimensions={showBeamEndDimensions}
        showBottomOrdinate={showBottomOrdinate}
        onToggleBeamEndDimensions={() => setShowBeamEndDimensions(!showBeamEndDimensions)}
        onToggleBottomOrdinate={() => setShowBottomOrdinate(!showBottomOrdinate)}
        // Edit mode props
        selectedDefect={selectedDefectType}
        onSelectDefect={setSelectedDefectType}
        // View mode props - individual export handlers
        onExportPNG={() => setShowPNGDialog(true)}
        onExportSVG={() => setShowSVGDialog(true)}
        onExportPDF={() => setShowPDFDialog(true)}
        onExportReport={() => setShowReportDialog(true)}
        onShare={() => setShowShareDialog(true)}
        onPrint={() => setShowPrintDialog(true)}
      />

      {/* Main canvas area */}
      <main style={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'auto'
      }}>
        <div style={{ position: 'relative', minWidth: '100%', height: '100%' }}>
          <PhaserCanvas 
            beamProfile={selectedBeam} 
            onCellChange={handleCellChange}
            editMode={MODE_CONFIGS[appMode].allowCellEditing}
            beamLength={beamLength}
            showGrid={MODE_CONFIGS[appMode].showGrid}
            gridOrigin={gridOrigin}
            showTopFlange={showTopFlange}
            gridCells={gridCells}
            elevationView={elevationView}
            appMode={appMode}
            selectedAnnotationTool={selectedAnnotationTool}
            onSelectAnnotationTool={setSelectedAnnotationTool}
            ordinateOriginSide={ordinateOriginSide}
            onToggleOrdinateOrigin={() => setOrdinateOriginSide(ordinateOriginSide === 'left' ? 'right' : 'left')}
            showBeamEndDimensions={showBeamEndDimensions}
            showBottomOrdinate={showBottomOrdinate}
            spanLength={spanLength}
            zoom={currentZoom}
            selectedDefectType={selectedDefectType}
            onSceneReady={setCurrentScene}
          />
        </div>
      </main>

      {/* Minimal footer */}
      <footer style={{ 
        backgroundColor: 'white', 
        padding: '8px 20px',
        boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        fontSize: '12px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {appMode === 'edit' && `Click cells to mark ${selectedDefectType.replace('-', ' ')}`}
          {appMode === 'view' && 'View mode - Export ready'}
          {appMode === 'annotation' && 'Click to add annotations'}
        </span>
        <span>Total cells: {gridCells.length}</span>
      </footer>
      
      {/* Zoom control */}
      <ZoomControl
        currentZoom={currentZoom}
        onZoomChange={setCurrentZoom}
      />
      
      {/* Export Dialog */}
      <VectorExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        beamProfile={selectedBeam}
        beamLength={beamLength}
        cells={gridCells}
        gridSize={currentScene?.gridSize || 30}
        annotations={currentScene?.getAnnotations?.() || []}
        initialFormat={selectedExportFormat}
      />
      
      {/* Individual Export Dialogs */}
      <PNGExportDialog
        isOpen={showPNGDialog}
        onClose={() => setShowPNGDialog(false)}
        onExport={handleExportPNG}
        currentScene={currentScene}
      />
      
      <SVGExportDialog
        isOpen={showSVGDialog}
        onClose={() => setShowSVGDialog(false)}
        onExport={handleExportSVG}
        currentScene={currentScene}
      />
      
      <PDFExportDialog
        isOpen={showPDFDialog}
        onClose={() => setShowPDFDialog(false)}
        onExport={handleExportPDF}
        currentScene={currentScene}
      />
      
      <ReportExportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        onExport={handleExportReport}
        currentScene={currentScene}
        gridCells={gridCells}
        beamProfile={selectedBeam}
      />
      
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onShare={handleShare}
      />
      
      <PrintDialog
        isOpen={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        onPrint={handlePrint}
      />
    </div>
  )
}