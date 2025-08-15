"use client"

import { useMemo, useEffect, useRef } from "react"

interface LyricsDisplayProps {
  lyrics: string
  currentTime: number
}

interface LyricLine {
  time: number
  text: string
}

export function LyricsDisplay({ lyrics, currentTime }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const parsedLyrics = useMemo(() => {
    if (!lyrics) return []

    const lines = lyrics.split("\n")
    const parsed: LyricLine[] = []

    lines.forEach((line) => {
      const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g
      const matches = [...line.matchAll(timeRegex)]

      if (matches.length > 0) {
        // 提取歌词文本（去掉所有时间戳）
        const text = line.replace(timeRegex, "").trim()

        // 过滤掉元数据行（歌名、作词等）和网站信息
        if (
          text &&
          !text.includes("歌名：") &&
          !text.includes("作词：") &&
          !text.includes("作曲：") &&
          !text.includes("歌手：") &&
          !text.includes("专辑：") &&
          !text.includes("www.") &&
          !text.includes("音乐网")
        ) {
          // 为每个时间戳创建歌词行
          matches.forEach((match) => {
            const minutes = Number.parseInt(match[1])
            const seconds = Number.parseInt(match[2])
            const milliseconds = match[3] ? Number.parseInt(match[3]) : 0

            parsed.push({
              time: minutes * 60 + seconds + milliseconds / 1000,
              text,
            })
          })
        }
      } else if (
        line.trim() &&
        !line.includes("歌名：") &&
        !line.includes("作词：") &&
        !line.includes("作曲：") &&
        !line.includes("歌手：") &&
        !line.includes("专辑：") &&
        !line.includes("www.") &&
        !line.includes("音乐网")
      ) {
        // 没有时间戳的普通文本行
        parsed.push({
          time: 0,
          text: line.trim(),
        })
      }
    })

    return parsed.sort((a, b) => a.time - b.time)
  }, [lyrics])

  const currentLyricIndex = useMemo(() => {
    for (let i = parsedLyrics.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLyrics[i].time) {
        return i
      }
    }
    return -1
  }, [parsedLyrics, currentTime])

  useEffect(() => {
    if (containerRef.current && currentLyricIndex >= 0 && parsedLyrics.length > 0) {
      const container = containerRef.current
      const currentElement = container.children[0]?.children[currentLyricIndex] as HTMLElement
      if (currentElement) {
        const containerHeight = container.clientHeight
        const elementTop = currentElement.offsetTop
        const elementHeight = currentElement.clientHeight
        // 计算滚动位置，确保当前歌词在容器中心
        const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2

        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: "smooth",
        })
      }
    }
  }, [currentLyricIndex, parsedLyrics.length])

  if (!parsedLyrics.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-white/50 text-lg">暂无歌词</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-8"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div className="space-y-6 py-32">
          {parsedLyrics.map((line, index) => (
            <p
              key={index}
              className={`transition-all duration-700 leading-relaxed text-center ${
                index === currentLyricIndex
                  ? "text-white text-2xl font-bold transform scale-105 drop-shadow-lg"
                  : index === currentLyricIndex + 1
                    ? "text-white/80 text-lg"
                    : "text-white/40 text-base"
              }`}
              style={{
                textShadow: index === currentLyricIndex ? "0 0 20px rgba(255,255,255,0.5)" : "none",
              }}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
