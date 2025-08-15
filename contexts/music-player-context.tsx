"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useEffect, useMemo, type ReactNode } from "react"

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

interface MusicPlayerState {
  audioFile: AudioFile | null
  coverMedia: CoverMedia | null
  currentTime: number
  duration: number
  isPlaying: boolean
  aspectRatio: string
  songTitle: string
  artistName: string
  backgroundKey: number
  blurOverlayColor: string
  blurOverlayOpacity: number
  blurIntensity: number
  audioVisualizerEnabled: boolean
  visualizerType: "bars" | "circular" | "waveform" | "particles"
}

interface MusicPlayerContextType extends MusicPlayerState {
  setAudioFile: (file: AudioFile | null) => void
  setCoverMedia: (media: CoverMedia | null) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  setAspectRatio: (ratio: string) => void
  setSongTitle: (title: string) => void
  setArtistName: (name: string) => void
  setBackgroundKey: React.Dispatch<React.SetStateAction<number>>
  setBlurOverlayColor: (color: string) => void
  setBlurOverlayOpacity: (opacity: number) => void
  setBlurIntensity: (intensity: number) => void
  setAudioVisualizerEnabled: (enabled: boolean) => void
  setVisualizerType: (type: "bars" | "circular" | "waveform" | "particles") => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  backgroundVideoRef: React.RefObject<HTMLVideoElement | null>
  playerRef: React.RefObject<HTMLDivElement | null>
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

let globalState: Partial<MusicPlayerState> = {}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [audioFile, setAudioFile] = useState<AudioFile | null>(globalState.audioFile || null)
  const [coverMedia, setCoverMedia] = useState<CoverMedia | null>(globalState.coverMedia || null)
  const [currentTime, setCurrentTime] = useState(globalState.currentTime || 0)
  const [duration, setDuration] = useState(globalState.duration || 0)
  const [isPlaying, setIsPlaying] = useState(globalState.isPlaying || false)
  const [aspectRatio, setAspectRatio] = useState(globalState.aspectRatio || "16:9")
  const [songTitle, setSongTitle] = useState(globalState.songTitle || "")
  const [artistName, setArtistName] = useState(globalState.artistName || "")
  const [backgroundKey, setBackgroundKey] = useState(globalState.backgroundKey || 0)
  const [blurOverlayColor, setBlurOverlayColor] = useState(globalState.blurOverlayColor || "#000000")
  const [blurOverlayOpacity, setBlurOverlayOpacity] = useState(globalState.blurOverlayOpacity || 0.7)
  const [blurIntensity, setBlurIntensity] = useState(globalState.blurIntensity || 20)
  const [audioVisualizerEnabled, setAudioVisualizerEnabled] = useState(
    globalState.audioVisualizerEnabled !== undefined ? globalState.audioVisualizerEnabled : true,
  )
  const [visualizerType, setVisualizerType] = useState<"bars" | "circular" | "waveform" | "particles">(
    globalState.visualizerType || "bars",
  )

  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const backgroundVideoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    globalState = {
      audioFile,
      coverMedia,
      currentTime,
      duration,
      isPlaying,
      aspectRatio,
      songTitle,
      artistName,
      backgroundKey,
      blurOverlayColor,
      blurOverlayOpacity,
      blurIntensity,
      audioVisualizerEnabled,
      visualizerType,
    }
  }, [
    audioFile,
    coverMedia,
    currentTime,
    duration,
    isPlaying,
    aspectRatio,
    songTitle,
    artistName,
    backgroundKey,
    blurOverlayColor,
    blurOverlayOpacity,
    blurIntensity,
    audioVisualizerEnabled,
    visualizerType,
  ])

  const wrappedSetAudioFile = (file: AudioFile | null) => {
    console.log("[v0] Context: Setting audioFile", file)
    setAudioFile(file)
  }

  const wrappedSetCoverMedia = (media: CoverMedia | null) => {
    console.log("[v0] Context: Setting coverMedia", media)
    setCoverMedia(media)
  }

  const wrappedSetSongTitle = (title: string) => {
    console.log("[v0] Context: Setting songTitle", title)
    setSongTitle(title)
  }

  const wrappedSetArtistName = (name: string) => {
    console.log("[v0] Context: Setting artistName", name)
    setArtistName(name)
  }

  const value: MusicPlayerContextType = useMemo(
    () => ({
      audioFile,
      coverMedia,
      currentTime,
      duration,
      isPlaying,
      aspectRatio,
      songTitle,
      artistName,
      backgroundKey,
      blurOverlayColor,
      blurOverlayOpacity,
      blurIntensity,
      audioVisualizerEnabled,
      visualizerType,
      setAudioFile: wrappedSetAudioFile,
      setCoverMedia: wrappedSetCoverMedia,
      setCurrentTime,
      setDuration,
      setIsPlaying,
      setAspectRatio,
      setSongTitle: wrappedSetSongTitle,
      setArtistName: wrappedSetArtistName,
      setBackgroundKey,
      setBlurOverlayColor,
      setBlurOverlayOpacity,
      setBlurIntensity,
      setAudioVisualizerEnabled,
      setVisualizerType,
      audioRef,
      videoRef,
      backgroundVideoRef,
      playerRef,
    }),
    [
      audioFile,
      coverMedia,
      currentTime,
      duration,
      isPlaying,
      aspectRatio,
      songTitle,
      artistName,
      backgroundKey,
      blurOverlayColor,
      blurOverlayOpacity,
      blurIntensity,
      audioVisualizerEnabled,
      visualizerType,
    ],
  )

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider")
  }
  return context
}
