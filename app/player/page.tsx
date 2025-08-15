"use client"

import { useRouter } from "next/navigation"
import { MusicPlayer } from "@/components/music-player"

export default function PlayerPage() {
  const router = useRouter()

  const handleBackToConfig = () => {
    router.push("/")
  }

  return <MusicPlayer fullscreen onBackToConfig={handleBackToConfig} />
}
