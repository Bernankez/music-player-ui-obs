"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Music, ImageIcon } from "lucide-react"

interface AudioFile {
  file: File
  url: string
  name: string
}

interface CoverMedia {
  file: File
  url: string
  type: "image" | "video"
}

interface FileUploaderProps {
  onAudioSelect: (file: AudioFile) => void
  onCoverSelect: (media: CoverMedia) => void
}

export function FileUploader({ onAudioSelect, onCoverSelect }: FileUploaderProps) {
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] FileUploader: handleAudioSelect called, files:", event.target.files)
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file)
      const audioFile = {
        file,
        url,
        name: file.name,
      }
      console.log("[v0] FileUploader: About to call onAudioSelect with", audioFile)
      onAudioSelect(audioFile)
    } else {
      console.log("[v0] FileUploader: No valid audio file selected")
    }
  }

  const handleCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] FileUploader: handleCoverSelect called, files:", event.target.files)
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      const type = file.type.startsWith("image/") ? "image" : "video"
      const coverMedia = {
        file,
        url,
        type,
      }
      console.log("[v0] FileUploader: About to call onCoverSelect with", coverMedia)
      onCoverSelect(coverMedia)
    } else {
      console.log("[v0] FileUploader: No file selected")
    }
  }

  const handleAudioButtonClick = () => {
    console.log("[v0] FileUploader: Audio button clicked")
    audioInputRef.current?.click()
  }

  const handleCoverButtonClick = () => {
    console.log("[v0] FileUploader: Cover button clicked")
    coverInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAudioButtonClick}
          className="flex-1 bg-white border-gray-300 text-black hover:bg-gray-50 font-medium"
        >
          <Music className="w-4 h-4 mr-2" />
          音频
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCoverButtonClick}
          className="flex-1 bg-white border-gray-300 text-black hover:bg-gray-50 font-medium"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          封面
        </Button>
      </div>

      <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />

      <input ref={coverInputRef} type="file" accept="image/*,video/*" onChange={handleCoverSelect} className="hidden" />
    </div>
  )
}
