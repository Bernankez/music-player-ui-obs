"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | HTMLVideoElement | null
  isEnabled: boolean
  visualizerType: "bars" | "circular" | "waveform" | "particles"
  className?: string
}

let globalAudioContext: AudioContext | null = null
let globalSource: MediaElementAudioSourceNode | null = null
let globalAnalyser: AnalyserNode | null = null
let globalSourceElement: HTMLMediaElement | null = null

export function AudioVisualizer({
  audioElement,
  isEnabled,
  visualizerType = "bars",
  className = "",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([])
  const hasValidAudioRef = useRef<boolean>(false)
  let bufferLength = 0

  useEffect(() => {
    console.log(
      "[v0] AudioVisualizer mounted - audioElement:",
      !!audioElement,
      "isEnabled:",
      isEnabled,
      "visualizerType:",
      visualizerType,
    )
  }, [])

  useEffect(() => {
    console.log(
      "[v0] AudioVisualizer props changed - audioElement:",
      !!audioElement,
      "isEnabled:",
      isEnabled,
      "visualizerType:",
      visualizerType,
    )
    if (audioElement) {
      console.log("[v0] AudioVisualizer - audioElement readyState:", audioElement.readyState, "src:", audioElement.src)
    }
  }, [audioElement, isEnabled, visualizerType])

  const drawDefaultAnimation = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const time = Date.now() * 0.001

    switch (visualizerType) {
      case "bars":
        const barWidth = canvas.width / 20
        for (let i = 0; i < 20; i++) {
          const barHeight = (Math.sin(time * 2 + i * 0.5) * 0.5 + 0.5) * canvas.height * 0.3
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
          gradient.addColorStop(1, "rgba(255, 255, 255, 0.1)")
          ctx.fillStyle = gradient
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 2, barHeight)
        }
        break
      case "circular":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < canvas.width; i += 4) {
          const waveHeight = Math.sin(time * 3 + i * 0.02) * canvas.height * 0.15
          const y = canvas.height / 2 + waveHeight
          if (i === 0) {
            ctx.moveTo(i, y)
          } else {
            ctx.lineTo(i, y)
          }
        }
        ctx.stroke()
        break
      case "waveform":
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < canvas.width; i++) {
          const y = canvas.height / 2 + Math.sin(time * 4 + i * 0.02) * canvas.height * 0.1
          if (i === 0) {
            ctx.moveTo(i, y)
          } else {
            ctx.lineTo(i, y)
          }
        }
        ctx.stroke()
        break
      case "particles":
        if (Math.random() < 0.1) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 1.0,
          })
        }
        particlesRef.current = particlesRef.current.filter((particle) => {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vy += 0.05
          particle.life -= 0.01
          if (particle.life > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${particle.life * 0.3})`
            ctx.fillRect(particle.x, particle.y, 2, 2)
            return true
          }
          return false
        })
        break
    }
  }

  useEffect(() => {
    console.log("[v0] AudioVisualizer useEffect triggered - isEnabled:", isEnabled, "audioElement:", !!audioElement)

    if (!isEnabled) {
      console.log("[v0] AudioVisualizer disabled, clearing canvas")
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      hasValidAudioRef.current = false
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
      return
    }

    if (audioElement) {
      console.log("[v0] AudioVisualizer setting up audio context")
      try {
        if (!globalAudioContext) {
          globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          console.log("[v0] AudioVisualizer created new AudioContext")
        }

        // 尝试恢复被挂起的上下文（例如路由切换或首次交互前）
        if (globalAudioContext.state === "suspended") {
          globalAudioContext.resume().catch(() => {})
        }

        // 当 media element 变化时，重新建立连接，避免指向旧的元素
        if (globalSourceElement !== audioElement) {
          try {
            if (globalSource) {
              globalSource.disconnect()
            }
          } catch {}
          try {
            if (globalAnalyser) {
              globalAnalyser.disconnect()
            }
          } catch {}

          globalAnalyser = null
          globalSource = null

          try {
            globalSource = globalAudioContext.createMediaElementSource(audioElement)
            globalSource.connect(globalAudioContext.destination)
            console.log("[v0] AudioVisualizer created and connected audio source (new element)")
          } catch (error) {
            console.log("[v0] Failed to create media element source:", error)
          }

          globalSourceElement = audioElement
        }

        if (!globalAnalyser && globalSource) {
          globalAnalyser = globalAudioContext.createAnalyser()
          globalAnalyser.fftSize = 512
          try {
            globalSource.connect(globalAnalyser)
            console.log("[v0] AudioVisualizer created and connected analyser")
          } catch (error) {
            console.log("[v0] Analyser already connected:", error)
          }
        }

        if (globalAnalyser) {
          bufferLength = globalAnalyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          analyserRef.current = globalAnalyser
          dataArrayRef.current = dataArray
          hasValidAudioRef.current = true
          console.log("[v0] AudioVisualizer setup complete, bufferLength:", bufferLength)
        } else {
          hasValidAudioRef.current = false
        }
      } catch (error) {
        console.log("[v0] Audio context setup failed:", error)
        hasValidAudioRef.current = false
      }
    } else {
      hasValidAudioRef.current = false
    }

    const drawBars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (!analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      const barWidth = (canvas.width / bufferLength) * 3
      let x = 0

      for (let i = 0; i < bufferLength / 3; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * canvas.height * 0.9

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)")
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.2)")

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight)

        x += barWidth
      }
    }

    const drawCircular = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (!analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.beginPath()

      const sliceWidth = canvas.width / (bufferLength / 4)
      let x = 0

      for (let i = 0; i < bufferLength / 4; i++) {
        const amplitude = dataArrayRef.current[i] / 255
        const y = canvas.height / 2 + (amplitude - 0.5) * canvas.height * 0.4

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()
    }

    const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (!analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.beginPath()

      const sliceWidth = canvas.width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayRef.current[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()
    }

    const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      if (!analyserRef.current || !dataArrayRef.current) return

      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      for (let i = 0; i < bufferLength / 20; i++) {
        const intensity = dataArrayRef.current[i] / 255
        if (intensity > 0.3 && Math.random() < 0.3) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 6 - 2,
            life: 1.0,
          })
        }
      }

      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.1 // 重力
        particle.life -= 0.02

        if (particle.life > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.life * 0.8})`
          ctx.fillRect(particle.x, particle.y, 2, 2)
          return true
        }
        return false
      })
    }

    const draw = () => {
      if (!canvasRef.current || !isEnabled) {
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (
        hasValidAudioRef.current &&
        analyserRef.current &&
        dataArrayRef.current &&
        audioElement &&
        audioElement.readyState >= 1
      ) {
        switch (visualizerType) {
          case "bars":
            drawBars(ctx, canvas)
            break
          case "circular":
            drawCircular(ctx, canvas)
            break
          case "waveform":
            drawWaveform(ctx, canvas)
            break
          case "particles":
            drawParticles(ctx, canvas)
            break
        }
      } else {
        // 无有效音频时，持续绘制占位动画，避免闪烁
        drawDefaultAnimation(ctx, canvas)
      }

      if (isEnabled) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    if (animationRef.current === null) {
      draw()
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [audioElement, isEnabled, visualizerType])

  return <canvas ref={canvasRef} width={400} height={60} className={`w-full h-full ${className}`} />
}
