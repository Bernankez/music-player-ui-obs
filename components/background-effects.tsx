"use client"

import { useState } from "react"
import { AppleBackgroundShader } from "./apple-background-shader"

interface BackgroundEffectsProps {
  coverMedia: string | null
  backgroundKey: number
  overlayColor: string
  overlayOpacity: number
  blurAmount: number
  onOverlayColorChange: (color: string) => void
  onOverlayOpacityChange: (opacity: number) => void
  onBlurAmountChange: (blur: number) => void
}

type EffectType = "blur" | "liquid-glass" | "apple-shader"

export function BackgroundEffects({
  coverMedia,
  backgroundKey,
  overlayColor,
  overlayOpacity,
  blurAmount,
  onOverlayColorChange,
  onOverlayOpacityChange,
  onBlurAmountChange,
}: BackgroundEffectsProps) {
  const [effectType, setEffectType] = useState<EffectType>("blur")

  return (
    <>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {effectType === "apple-shader" ? (
          <AppleBackgroundShader coverMedia={coverMedia} />
        ) : (
          coverMedia && (
            <>
              {coverMedia.includes("video/") ? (
                <video
                  key={`bg-${backgroundKey}`}
                  src={coverMedia}
                  className="w-full h-full object-cover"
                  style={{
                    filter: effectType === "blur" ? `blur(${blurAmount}px)` : undefined,
                    backdropFilter: effectType === "liquid-glass" ? `blur(${blurAmount}px) saturate(180%)` : undefined,
                  }}
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  key={`bg-${backgroundKey}`}
                  src={coverMedia || "/placeholder.svg"}
                  alt="Background"
                  className="w-full h-full object-cover"
                  style={{
                    filter: effectType === "blur" ? `blur(${blurAmount}px)` : undefined,
                    backdropFilter: effectType === "liquid-glass" ? `blur(${blurAmount}px) saturate(180%)` : undefined,
                  }}
                />
              )}
            </>
          )
        )}

        {/* Overlay */}
        {effectType !== "apple-shader" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: effectType === "liquid-glass" ? "transparent" : overlayColor,
              opacity: effectType === "liquid-glass" ? 1 : overlayOpacity,
              background:
                effectType === "liquid-glass"
                  ? `linear-gradient(135deg, ${overlayColor}${Math.round(overlayOpacity * 255)
                      .toString(16)
                      .padStart(2, "0")}, rgba(255,255,255,0.1))`
                  : undefined,
              backdropFilter: effectType === "liquid-glass" ? `blur(${blurAmount}px) saturate(180%)` : undefined,
              border: effectType === "liquid-glass" ? "1px solid rgba(255,255,255,0.1)" : undefined,
              boxShadow: effectType === "liquid-glass" ? "0 8px 32px rgba(0,0,0,0.2)" : undefined,
            }}
          />
        )}
      </div>
    </>
  )
}
