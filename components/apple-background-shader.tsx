"use client"

import { useEffect, useRef } from "react"

interface AppleBackgroundShaderProps {
  coverMedia: string | null
  className?: string
}

export function AppleBackgroundShader({ coverMedia, className = "" }: AppleBackgroundShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)

  const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `

  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    
    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      
      float time = u_time * 0.3;
      vec2 flow = vec2(
        sin(st.y * 4.0 + time) * 0.15,
        cos(st.x * 3.0 + time * 0.8) * 0.12
      );
      
      st += flow;
      
      vec3 color1 = vec3(0.15, 0.35, 0.85);
      vec3 color2 = vec3(0.85, 0.25, 0.65);
      vec3 color3 = vec3(0.25, 0.85, 0.55);
      vec3 color4 = vec3(0.95, 0.45, 0.25);
      
      float mixer1 = sin(st.x * 3.0 + time) * 0.5 + 0.5;
      float mixer2 = cos(st.y * 2.5 + time * 0.7) * 0.5 + 0.5;
      float mixer3 = sin((st.x + st.y) * 2.0 + time * 1.2) * 0.5 + 0.5;
      
      vec3 color = mix(color1, color2, mixer1);
      color = mix(color, color3, mixer2);
      color = mix(color, color4, mixer3 * 0.3);
      
      float n = noise(st * 8.0 + time) * 0.08;
      color += n;
      
      gl_FragColor = vec4(color, 0.4);
    }
  `

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const webgl = canvas.getContext("webgl")
    if (!webgl) return

    glRef.current = webgl

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type)
      if (!shader) return null

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }

      return shader
    }

    const vertexShader = createShader(webgl, webgl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(webgl, webgl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return

    const program = webgl.createProgram()
    if (!program) return

    webgl.attachShader(program, vertexShader)
    webgl.attachShader(program, fragmentShader)
    webgl.linkProgram(program)

    if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
      console.error("Program link error:", webgl.getProgramInfoLog(program))
      return
    }

    programRef.current = program

    const positionAttributeLocation = webgl.getAttribLocation(program, "a_position")
    const timeUniformLocation = webgl.getUniformLocation(program, "u_time")
    const resolutionUniformLocation = webgl.getUniformLocation(program, "u_resolution")

    const positionBuffer = webgl.createBuffer()
    webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer)

    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]
    webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(positions), webgl.STATIC_DRAW)

    webgl.enableVertexAttribArray(positionAttributeLocation)
    webgl.bindBuffer(webgl.ARRAY_BUFFER, positionBuffer)
    webgl.vertexAttribPointer(positionAttributeLocation, 2, webgl.FLOAT, false, 0, 0)

    function render(time: number) {
      const currentWebgl = glRef.current
      const currentProgram = programRef.current
      if (!currentWebgl || !canvas || !currentProgram) return

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      currentWebgl.viewport(0, 0, canvas.width, canvas.height)

      currentWebgl.clearColor(0, 0, 0, 0)
      currentWebgl.clear(currentWebgl.COLOR_BUFFER_BIT)

      currentWebgl.useProgram(currentProgram)
      currentWebgl.uniform1f(timeUniformLocation, time * 0.001)
      currentWebgl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height)

      currentWebgl.drawArrays(currentWebgl.TRIANGLES, 0, 6)

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [coverMedia])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ mixBlendMode: "overlay" }}
    />
  )
}
