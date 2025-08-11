/**
 * Ultra-modern WebGL renderer with performance optimizations
 */

export class ModernCanvasRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null = null
  private buffers: Map<string, WebGLBuffer> = new Map()
  private textures: Map<string, WebGLTexture> = new Map()
  private viewport = { zoom: 1, pan: { x: 0, y: 0 }, bounds: { width: 800, height: 600 } }
  private beamData: any = null
  private animationId: number = 0
  private lastFrameTime = 0
  private frameCount = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    this.gl = gl

    this.initializeRenderer()
    this.startRenderLoop()
  }

  private initializeRenderer() {
    const gl = this.gl

    // Enable important WebGL features
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    // Set up viewport
    this.updateCanvasSize()

    // Initialize shaders
    this.initializeShaders()

    // Set clear color (dark theme)
    gl.clearColor(0.117, 0.117, 0.180, 1.0) // #1e1e2e
  }

  private initializeShaders() {
    const gl = this.gl

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute vec4 a_color;
      
      uniform mat3 u_transform;
      uniform vec2 u_resolution;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      void main() {
        vec3 position = u_transform * vec3(a_position, 1.0);
        
        vec2 clipSpace = ((position.xy / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_texCoord;
      varying vec4 v_color;
      
      uniform sampler2D u_texture;
      uniform bool u_useTexture;
      uniform float u_time;
      
      void main() {
        vec4 color = v_color;
        
        if (u_useTexture) {
          color *= texture2D(u_texture, v_texCoord);
        }
        
        // Add subtle glow effect
        float glow = 0.02 * sin(u_time * 2.0);
        color.rgb += glow;
        
        gl_FragColor = color;
      }
    `

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders')
    }

    this.program = this.createProgram(vertexShader, fragmentShader)
    if (!this.program) {
      throw new Error('Failed to create shader program')
    }

    gl.useProgram(this.program)
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const gl = this.gl
    const program = gl.createProgram()
    if (!program) return null

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }

    return program
  }

  private updateCanvasSize() {
    const gl = this.gl
    const rect = this.canvas.getBoundingClientRect()
    const devicePixelRatio = window.devicePixelRatio || 1

    this.canvas.width = rect.width * devicePixelRatio
    this.canvas.height = rect.height * devicePixelRatio
    this.canvas.style.width = rect.width + 'px'
    this.canvas.style.height = rect.height + 'px'

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    
    this.viewport.bounds = { width: rect.width, height: rect.height }
  }

  private startRenderLoop() {
    const render = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime
      this.lastFrameTime = currentTime
      this.frameCount++

      this.render(deltaTime)
      this.animationId = requestAnimationFrame(render)
    }

    this.animationId = requestAnimationFrame(render)
  }

  private render(deltaTime: number) {
    const gl = this.gl
    if (!this.program) return

    // Update canvas size if needed
    this.updateCanvasSize()

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Set up transformation matrix
    const transform = this.createTransformMatrix()
    const transformLocation = gl.getUniformLocation(this.program, 'u_transform')
    gl.uniformMatrix3fv(transformLocation, false, transform)

    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution')
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height)

    const timeLocation = gl.getUniformLocation(this.program, 'u_time')
    gl.uniform1f(timeLocation, this.lastFrameTime * 0.001)

    // Render beam data if available
    if (this.beamData) {
      this.renderBeam()
    }

    // Render grid
    this.renderGrid()

    // Render UI elements
    this.renderUI()
  }

  private createTransformMatrix(): Float32Array {
    const { zoom, pan } = this.viewport
    const { width, height } = this.viewport.bounds

    // Create transformation matrix (translation * scale)
    return new Float32Array([
      zoom, 0, pan.x,
      0, zoom, pan.y,
      0, 0, 1
    ])
  }

  private renderBeam() {
    if (!this.beamData || !this.program) return

    // Render beam outline
    this.renderBeamOutline()

    // Render scalar field if available
    if (this.beamData.scalarField) {
      this.renderScalarField()
    }
  }

  private renderBeamOutline() {
    if (!this.beamData || !this.program) return

    const gl = this.gl
    const { width, height } = this.beamData

    // Create beam outline vertices
    const vertices = new Float32Array([
      0, 0,           // Bottom-left
      width, 0,       // Bottom-right
      width, height,  // Top-right
      0, height       // Top-left
    ])

    const colors = new Float32Array([
      0.458, 0.780, 0.925, 1.0, // #74c7ec (blue)
      0.458, 0.780, 0.925, 1.0,
      0.458, 0.780, 0.925, 1.0,
      0.458, 0.780, 0.925, 1.0
    ])

    this.drawLineLoop(vertices, colors)
  }

  private renderScalarField() {
    // TODO: Implement scalar field rendering with contours
    // This would involve marching squares algorithm on GPU
  }

  private renderGrid() {
    if (!this.program) return

    const gl = this.gl
    const { bounds, zoom } = this.viewport

    // Only render grid if zoomed in enough
    if (zoom < 0.5) return

    const gridSpacing = this.calculateGridSpacing(zoom)
    const lines = this.generateGridLines(bounds, gridSpacing)

    if (lines.length === 0) return

    const vertices = new Float32Array(lines)
    const colors = new Float32Array(lines.length / 2 * 4)

    // Set grid color (subtle)
    const gridColor = [0.205, 0.205, 0.278, 0.3] // #343446 with alpha
    for (let i = 0; i < colors.length; i += 4) {
      colors[i] = gridColor[0]
      colors[i + 1] = gridColor[1] 
      colors[i + 2] = gridColor[2]
      colors[i + 3] = gridColor[3]
    }

    this.drawLines(vertices, colors)
  }

  private calculateGridSpacing(zoom: number): number {
    // Dynamic grid spacing based on zoom level
    const baseSpacing = 50
    const scales = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50]
    
    for (const scale of scales) {
      if (baseSpacing * scale * zoom >= 20) {
        return baseSpacing * scale
      }
    }
    
    return baseSpacing * scales[scales.length - 1]
  }

  private generateGridLines(bounds: { width: number; height: number }, spacing: number): number[] {
    const lines: number[] = []
    const { pan, zoom } = this.viewport

    // Calculate visible area in world coordinates
    const left = -pan.x / zoom
    const right = (bounds.width - pan.x) / zoom
    const top = -pan.y / zoom
    const bottom = (bounds.height - pan.y) / zoom

    // Vertical lines
    const startX = Math.floor(left / spacing) * spacing
    const endX = Math.ceil(right / spacing) * spacing
    
    for (let x = startX; x <= endX; x += spacing) {
      lines.push(x, top, x, bottom)
    }

    // Horizontal lines
    const startY = Math.floor(top / spacing) * spacing
    const endY = Math.ceil(bottom / spacing) * spacing
    
    for (let y = startY; y <= endY; y += spacing) {
      lines.push(left, y, right, y)
    }

    return lines
  }

  private renderUI() {
    // TODO: Render annotations and other UI elements
  }

  private drawLineLoop(vertices: Float32Array, colors: Float32Array) {
    if (!this.program) return

    const gl = this.gl

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

    const colorLocation = gl.getAttribLocation(this.program, 'a_color')
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)

    // Disable texture
    const useTextureLocation = gl.getUniformLocation(this.program, 'u_useTexture')
    gl.uniform1i(useTextureLocation, 0)

    // Draw
    gl.drawArrays(gl.LINE_LOOP, 0, vertices.length / 2)

    // Cleanup
    gl.deleteBuffer(vertexBuffer)
    gl.deleteBuffer(colorBuffer)
  }

  private drawLines(vertices: Float32Array, colors: Float32Array) {
    if (!this.program) return

    const gl = this.gl

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(this.program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Create and bind color buffer
    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

    const colorLocation = gl.getAttribLocation(this.program, 'a_color')
    gl.enableVertexAttribArray(colorLocation)
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)

    // Disable texture
    const useTextureLocation = gl.getUniformLocation(this.program, 'u_useTexture')
    gl.uniform1i(useTextureLocation, 0)

    // Draw
    gl.drawArrays(gl.LINES, 0, vertices.length / 2)

    // Cleanup
    gl.deleteBuffer(vertexBuffer)
    gl.deleteBuffer(colorBuffer)
  }

  public setViewport(viewport: Partial<typeof this.viewport>) {
    Object.assign(this.viewport, viewport)
  }

  public setBeamData(beamData: any) {
    this.beamData = beamData
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    const gl = this.gl
    
    // Cleanup WebGL resources
    this.buffers.forEach(buffer => gl.deleteBuffer(buffer))
    this.textures.forEach(texture => gl.deleteTexture(texture))
    
    if (this.program) {
      gl.deleteProgram(this.program)
    }
  }
}