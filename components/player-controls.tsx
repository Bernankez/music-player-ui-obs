"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, SkipBack, SkipForward, Shuffle, Repeat, Pause } from "lucide-react"

interface PlayerControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  onTogglePlay: () => void
  onSeek: (time: number) => void
  disabled?: boolean
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  disabled = false,
}: PlayerControlsProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={([value]) => onSeek(value)}
            disabled={disabled}
            className="w-full [&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_.bg-primary]:bg-white [&_.bg-secondary]:bg-white/20 [&_[data-orientation=horizontal]]:h-0.5 [&_[data-orientation=horizontal]]:rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-white/60 font-normal">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
      </div>

      {/* Control Buttons - 彻底去掉所有hover效果 */}
      <div className="flex items-center justify-center space-x-6 pt-2">
        {/* Shuffle - 最小按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 p-0 hover:bg-transparent hover:text-white/70"
          style={{ width: "24px", height: "24px" }}
          disabled={disabled}
        >
          <Shuffle style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />
        </Button>

        {/* Previous - 中等按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white p-0 hover:bg-transparent hover:text-white"
          style={{ width: "40px", height: "40px" }}
          disabled={disabled}
        >
          <SkipBack style={{ width: "32px", height: "32px" }} fill="currentColor" strokeWidth={0} />
        </Button>

        {/* Play/Pause - 最大按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white p-0 hover:bg-transparent hover:text-white"
          style={{ width: "56px", height: "56px" }}
          onClick={onTogglePlay}
          disabled={disabled}
        >
          {isPlaying ? (
            <Pause style={{ width: "40px", height: "40px" }} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play style={{ width: "40px", height: "40px", marginLeft: "2px" }} fill="currentColor" strokeWidth={0} />
          )}
        </Button>

        {/* Next - 中等按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white p-0 hover:bg-transparent hover:text-white"
          style={{ width: "40px", height: "40px" }}
          disabled={disabled}
        >
          <SkipForward style={{ width: "32px", height: "32px" }} fill="currentColor" strokeWidth={0} />
        </Button>

        {/* Repeat - 最小按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 p-0 hover:bg-transparent hover:text-white/70"
          style={{ width: "24px", height: "24px" }}
          disabled={disabled}
        >
          <Repeat style={{ width: "18px", height: "18px" }} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  )
}
