"use client"

import { useEffect, useRef } from "react"

interface AppleMusicBackgroundProps {
  coverMedia?: string
  isVideo?: boolean
}

export function AppleMusicBackground({ coverMedia, isVideo }: AppleMusicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let time = 0
    const colors = [
      [53, 195, 243], // #35C3F3
      [139, 159, 232], // #8b9fe8
      [230, 129, 216], // #e681d8
      [255, 169, 164], // #ffa9a4
      [254, 210, 206], // #FED2CE
    ]

    const animate = () => {
      time += 0.005

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 创建渐变
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)

      // 动态渐变色
      colors.forEach((color, index) => {
        const offset = (index / (colors.length - 1) + Math.sin(time + index) * 0.1) % 1
        const alpha = 0.3 + Math.sin(time * 2 + index) * 0.1
        gradient.addColorStop(Math.max(0, Math.min(1, offset)), `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`)
      })

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 添加流动效果
      for (let i = 0; i < 3; i++) {
        const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width
        const y = (Math.cos(time * 0.7 + i) * 0.5 + 0.5) * canvas.height
        const radius = 200 + Math.sin(time * 2 + i) * 100

        const radialGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        const color = colors[i % colors.length]
        radialGradient.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.4)`)
        radialGradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`)

        ctx.fillStyle = radialGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ filter: "blur(60px)" }} />
      {coverMedia && (
        <div className="absolute inset-0 w-full h-full opacity-20">
          {isVideo ? (
            <video src={coverMedia} className="w-full h-full object-cover" muted loop playsInline />
          ) : (
            <img src={coverMedia || "/placeholder.svg"} alt="Background" className="w-full h-full object-cover" />
          )}
        </div>
      )}
    </>
  )
}
