"use client"

import { useState, useEffect, useRef } from "react"
import { PlayerControls } from "./player-controls"
import { LyricsDisplay } from "./lyrics-display"
import { FileUploader } from "./file-uploader"
import { AspectRatioSelector } from "./aspect-ratio-selector"
import { AudioVisualizer } from "./audio-visualizer"
import { Button } from "@/components/ui/button"
// Dialog 不再用于导入二维码，已移除
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/contexts/music-player-context"
import QRCodeLib from "qrcode"
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string"
import QrScanner from "qr-scanner"

interface MusicPlayerProps {
  fullscreen?: boolean
  onBackToConfig?: () => void
}

export function MusicPlayer({ fullscreen = false, onBackToConfig }: MusicPlayerProps) {
  const [lyrics, setLyrics] = useState("")
  const router = useRouter()
  // 使用 useRef 保存文件输入引用
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const {
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
    setAudioFile,
    setCoverMedia,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setAspectRatio,
    setSongTitle,
    setArtistName,
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
  } = useMusicPlayer()

  const aspectRatioClasses = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  }

  useEffect(() => {
    try {
      const savedLyrics = localStorage.getItem("music-player-lyrics")
      if (savedLyrics) {
        setLyrics(savedLyrics)
      }
    } catch (error) {
      console.error("Failed to load lyrics from localStorage:", error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("music-player-lyrics", lyrics)
    } catch (error) {
      console.error("Failed to save lyrics to localStorage:", error)
    }
  }, [lyrics])

  useEffect(() => {
    if (coverMedia) {
      setBackgroundKey((prev) => prev + 1)
    }
  }, [coverMedia, setBackgroundKey])

  useEffect(() => {
    const audio = audioRef.current
    const video = videoRef.current
    const backgroundVideo = backgroundVideoRef.current

    if (video) {
      video.autoplay = false
    }

    const activeElement = audioFile ? audio : coverMedia?.type === "video" ? video : null

    if (!activeElement) return

    const updateTime = () => setCurrentTime(activeElement.currentTime)
    const updateDuration = () => setDuration(activeElement.duration || 0)
    const handleEnded = () => {
      setIsPlaying(false)
      if (video) {
        video.pause()
      }
      if (backgroundVideo) {
        backgroundVideo.pause()
      }
    }
    const handleCanPlay = () => {
      if (activeElement.duration) {
        setDuration(activeElement.duration)
      }
    }

    const syncVideoPlayback = () => {
      if (video && audioFile && audio) {
        if (Math.abs(video.currentTime - audio.currentTime) > 0.5) {
          video.currentTime = audio.currentTime
        }
        if (isPlaying && video.paused) {
          video.play().catch(() => {})
        } else if (!isPlaying && !video.paused) {
          video.pause()
        }
      }

      if (backgroundVideo && coverMedia?.type === "video") {
        const mainVideo = audioFile ? audio : video
        if (mainVideo && Math.abs(backgroundVideo.currentTime - mainVideo.currentTime) > 0.5) {
          backgroundVideo.currentTime = mainVideo.currentTime
        }
        if (isPlaying && backgroundVideo.paused) {
          backgroundVideo.play().catch(() => {})
        } else if (!isPlaying && !backgroundVideo.paused) {
          backgroundVideo.pause()
        }
      }
    }

    activeElement.addEventListener("timeupdate", updateTime)
    activeElement.addEventListener("timeupdate", syncVideoPlayback)
    activeElement.addEventListener("loadedmetadata", updateDuration)
    activeElement.addEventListener("canplay", handleCanPlay)
    activeElement.addEventListener("ended", handleEnded)

    return () => {
      activeElement.removeEventListener("timeupdate", updateTime)
      activeElement.removeEventListener("timeupdate", syncVideoPlayback)
      activeElement.removeEventListener("loadedmetadata", updateDuration)
      activeElement.removeEventListener("canplay", handleCanPlay)
      activeElement.removeEventListener("ended", handleEnded)
    }
  }, [audioFile, coverMedia, isPlaying, setCurrentTime, setDuration, setIsPlaying])

  const buildExportPayload = () => {
    const payload = {
      v: 1,
      songTitle,
      artistName,
      lyrics,
      aspectRatio,
      blurOverlayColor,
      blurOverlayOpacity,
      blurIntensity,
      audioVisualizerEnabled,
      visualizerType,
    }
    const json = JSON.stringify(payload)
    const packed = "MP1:" + compressToEncodedURIComponent(json)
    return packed
  }

  const handleExportImage = async () => {
    try {
      const data = buildExportPayload()
      const url = await QRCodeLib.toDataURL(data, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
      })
      const link = document.createElement("a")
      const safeTitle = (songTitle || "music-config").replace(/[^\w\-]+/g, "-")
      link.href = url
      link.download = `${safeTitle}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("导出二维码失败", e)
    }
  }

  const applyImportedData = (data: any) => {
    if (typeof data.songTitle === "string") setSongTitle(data.songTitle)
    if (typeof data.artistName === "string") setArtistName(data.artistName)
    if (typeof data.lyrics === "string") setLyrics(data.lyrics)
    if (typeof data.aspectRatio === "string") setAspectRatio(data.aspectRatio)
    if (typeof data.blurOverlayColor === "string") setBlurOverlayColor(data.blurOverlayColor)
    if (typeof data.blurOverlayOpacity === "number") setBlurOverlayOpacity(data.blurOverlayOpacity)
    if (typeof data.blurIntensity === "number") setBlurIntensity(data.blurIntensity)
    if (typeof data.audioVisualizerEnabled === "boolean") setAudioVisualizerEnabled(data.audioVisualizerEnabled)
    if (typeof data.visualizerType === "string") setVisualizerType(data.visualizerType)
  }

  const handleImportFromText = (text: string) => {
    try {
      const trimmed = text.trim()
      if (!trimmed.startsWith("MP1:")) throw new Error("数据格式不正确")
      const decompressed = decompressFromEncodedURIComponent(trimmed.slice(4))
      if (!decompressed) throw new Error("数据解压失败")
      const obj = JSON.parse(decompressed)
      applyImportedData(obj)
    } catch (err) {
      console.error("导入失败", err)
      alert("导入失败：二维码内容无效")
    }
  }

  const onQrImageSelected = async (file: File) => {
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      handleImportFromText(result.data)
    } catch (err) {
      console.error("二维码解析失败", err)
      alert("二维码解析失败，请更换清晰的二维码图片")
    }
  }

  const togglePlay = async () => {
    const audio = audioRef.current
    const video = videoRef.current
    const backgroundVideo = backgroundVideoRef.current

    const activeElement = audioFile ? audio : coverMedia?.type === "video" ? video : null

    if (!activeElement) return

    try {
      if (isPlaying) {
        activeElement.pause()
        if (video && audioFile) {
          video.pause()
        }
        if (backgroundVideo) {
          backgroundVideo.pause()
        }
        setIsPlaying(false)
      } else {
        await activeElement.play()
        if (video && audioFile) {
          video.currentTime = activeElement.currentTime
          await video.play().catch(() => {})
        }
        if (backgroundVideo && coverMedia?.type === "video") {
          backgroundVideo.currentTime = activeElement.currentTime
          await backgroundVideo.play().catch(() => {})
        }
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("播放失败:", error)
    }
  }

  const handleSeek = (time: number) => {
    const audio = audioRef.current
    const video = videoRef.current
    const backgroundVideo = backgroundVideoRef.current
    const activeElement = audioFile ? audio : coverMedia?.type === "video" ? video : null

    if (!activeElement) return

    activeElement.currentTime = time
    if (video && audioFile) {
      video.currentTime = time
      if (!isPlaying) {
        video.pause()
      }
    }
    if (backgroundVideo && coverMedia?.type === "video") {
      backgroundVideo.currentTime = time
      if (!isPlaying) {
        backgroundVideo.pause()
      }
    }
    setCurrentTime(time)
  }

  const handleAudioSelect = (file: { file: File; url: string; name: string }) => {
    console.log("[v0] MusicPlayer: handleAudioSelect called with", file)
    setAudioFile(file)
    if (!songTitle) {
      setSongTitle(file.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleCoverSelect = (media: { file: File; url: string; type: "image" | "video" }) => {
    console.log("[v0] MusicPlayer: handleCoverSelect called with", media)
    setCoverMedia(media)
    if (!songTitle && !audioFile) {
      setSongTitle(media.file.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleGoToPlayer = () => {
    router.push("/player")
  }

  const [mediaElement, setMediaElement] = useState<HTMLAudioElement | HTMLVideoElement | null>(null)

  useEffect(() => {
    let raf: number | null = null
    const update = () => {
      const el = audioFile ? audioRef.current : coverMedia?.type === "video" ? videoRef.current : null
      setMediaElement((prev) => (prev !== el ? (el ?? null) : prev))
      if (!el) {
        raf = requestAnimationFrame(update)
      }
    }
    update()
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [audioFile, coverMedia?.type])

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black">
        <div className="absolute top-4 left-4 z-50 group">
          <div className="w-16 h-16 flex items-center justify-center">
            <Button
              onClick={onBackToConfig}
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white hover:bg-white/10 rounded-full w-12 h-12 p-0"
            >
              ←
            </Button>
          </div>
        </div>

        <div className="w-full h-full">
          <div className="h-full flex relative">
            <div className="absolute inset-0 z-0 overflow-hidden">
              {coverMedia && (
                <>
                  {coverMedia.type === "video" ? (
                    <video
                      ref={backgroundVideoRef}
                      key={`bg-${backgroundKey}`}
                      src={coverMedia.url}
                      className="w-full h-full object-cover"
                      style={{ filter: `blur(${blurIntensity}px)` }}
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      key={`bg-${backgroundKey}`}
                      src={coverMedia.url || "/placeholder.svg"}
                      alt="Background"
                      className="w-full h-full object-cover"
                      style={{ filter: `blur(${blurIntensity}px)` }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: blurOverlayColor,
                      opacity: blurOverlayOpacity,
                    }}
                  />
                </>
              )}
            </div>

            <div className="relative z-10 w-[58%] flex flex-col items-center justify-center py-24 px-6 gap-16">
              <div className="relative group">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                  {coverMedia ? (
                    coverMedia.type === "image" ? (
                      <img
                        src={coverMedia.url || "/placeholder.svg"}
                        alt="Album Cover"
                        className="max-w-80 max-h-80 lg:max-w-[28rem] lg:max-h-[28rem] object-contain bg-black/20"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={coverMedia.url}
                        loop
                        muted={!!audioFile}
                        playsInline
                        className="max-w-80 max-h-80 lg:max-w-[28rem] lg:max-h-[28rem] object-contain bg-black/20"
                      />
                    )
                  ) : (
                    <div className="w-80 h-80 lg:w-[28rem] lg:h-[28rem] flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                      <div className="text-6xl md:text-8xl lg:text-[8rem] text-white/30">♪</div>
                    </div>
                  )}
                </div>

                <div className="absolute -inset-4 bg-gradient-to-br from-white/5 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
              </div>

              <div className="text-center w-full max-w-xl">
                <div className="text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 tracking-tight">
                  {songTitle || "歌曲名称"}
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl text-white/60 font-medium">{artistName || "艺术家"}</div>
              </div>

              <div className="w-full max-w-md">
                <PlayerControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onTogglePlay={togglePlay}
                  onSeek={handleSeek}
                  disabled={!audioFile && !(coverMedia?.type === "video")}
                />
              </div>
            </div>

            <div className="relative z-10 w-[42%] flex flex-col h-full py-14">
              <div className="flex-1 min-h-0 pb-2">
                <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
              </div>
              <div className="h-16 lg:h-20 xl:h-24 px-6 pb-2 flex-shrink-0">
                {audioVisualizerEnabled && (
                  <AudioVisualizer audioElement={mediaElement} isEnabled={true} visualizerType={visualizerType} />
                )}
              </div>
            </div>
          </div>
        </div>

        {audioFile && <audio ref={audioRef} src={audioFile.url} preload="metadata" />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300">
      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xl space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <h2 className="text-lg font-bold text-gray-800">基础设置</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExportImage}>导出二维码</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const input = importFileInputRef.current
                    if (input) input.click()
                  }}
                >
                  从二维码导入
                </Button>
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onQrImageSelected(f)
                    // 清空以便下一次选择同一文件也能触发
                    e.currentTarget.value = ""
                  }}
                />
                <Button
                  onClick={handleGoToPlayer}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!audioFile && !(coverMedia?.type === "video")}
                >
                  🎵 进入播放器页面
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  文件上传
                </h3>
                <FileUploader onAudioSelect={handleAudioSelect} onCoverSelect={handleCoverSelect} />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  画面比例
                </h3>
                <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  背景效果
                </h3>
                <Button
                  size="sm"
                  variant="default"
                  className="w-full text-sm h-9 font-medium text-white bg-gray-800 hover:bg-gray-700"
                >
                  传统模糊
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1">视觉效果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  背景调节
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">遮罩颜色</label>
                    <input
                      type="color"
                      value={blurOverlayColor}
                      onChange={(e) => setBlurOverlayColor(e.target.value)}
                      className="w-full h-8 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      透明度: {Math.round(blurOverlayOpacity * 100)}%
                    </label>
                    <Slider
                      value={[blurOverlayOpacity]}
                      onValueChange={([value]) => setBlurOverlayOpacity(value)}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">模糊强度: {blurIntensity}px</label>
                    <Slider
                      value={[blurIntensity]}
                      onValueChange={([value]) => setBlurIntensity(value)}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    音频可视化
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Switch checked={audioVisualizerEnabled} onCheckedChange={setAudioVisualizerEnabled} />
                    <span className="text-xs font-medium text-gray-600">
                      {audioVisualizerEnabled ? "开启" : "关闭"}
                    </span>
                  </div>
                </div>

                {audioVisualizerEnabled && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 block">可视化效果</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant={visualizerType === "bars" ? "default" : "outline"}
                        onClick={() => setVisualizerType("bars")}
                        className="text-xs h-8 font-medium"
                      >
                        频谱条
                      </Button>
                      <Button
                        size="sm"
                        variant={visualizerType === "circular" ? "default" : "outline"}
                        onClick={() => setVisualizerType("circular")}
                        className="text-xs h-8 font-medium"
                      >
                        横条波形
                      </Button>
                      <Button
                        size="sm"
                        variant={visualizerType === "waveform" ? "default" : "outline"}
                        onClick={() => setVisualizerType("waveform")}
                        className="text-xs h-8 font-medium"
                      >
                        波形图
                      </Button>
                      <Button
                        size="sm"
                        variant={visualizerType === "particles" ? "default" : "outline"}
                        onClick={() => setVisualizerType("particles")}
                        className="text-xs h-8 font-medium"
                      >
                        粒子效果
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-1">歌词编辑</h2>
            <div className="bg-gray-50 rounded-xl p-3">
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="输入歌词，支持时间戳格式：[00:15]这是歌词内容"
                className="w-full h-20 bg-white text-gray-800 placeholder-gray-400 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 text-sm leading-relaxed"
              />
            </div>
          </div>

          
        </div>
      </div>

      <div className="px-4 pb-4 flex justify-center">
        <div className="w-full max-w-6xl">
          <div
            ref={playerRef}
            className={`${aspectRatioClasses[aspectRatio as keyof typeof aspectRatioClasses]} w-full bg-gradient-to-br from-gray-600/60 via-gray-500/60 to-gray-700/60 backdrop-blur-2xl overflow-hidden shadow-2xl border border-white/30 rounded-none`}
          >
            <div className="h-full flex relative">
              <div className="absolute inset-0 z-0 overflow-hidden">
                {coverMedia && (
                  <>
                    {coverMedia.type === "video" ? (
                      <video
                        ref={backgroundVideoRef}
                        key={`bg-${backgroundKey}`}
                        src={coverMedia.url}
                        className="w-full h-full object-cover"
                        style={{ filter: `blur(${blurIntensity}px)` }}
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        key={`bg-${backgroundKey}`}
                        src={coverMedia.url || "/placeholder.svg"}
                        alt="Background"
                        className="w-full h-full object-cover"
                        style={{ filter: `blur(${blurIntensity}px)` }}
                      />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: blurOverlayColor,
                        opacity: blurOverlayOpacity,
                      }}
                    />
                  </>
                )}
              </div>

              <div className="relative z-10 w-1/2 flex flex-col items-center justify-center py-24 px-6 gap-16">
                <div className="relative group">
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                    {coverMedia ? (
                      coverMedia.type === "image" ? (
                        <img
                          src={coverMedia.url || "/placeholder.svg"}
                          alt="Album Cover"
                          className="max-w-80 max-h-80 lg:max-w-[28rem] lg:max-h-[28rem] object-contain bg-black/20"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          src={coverMedia.url}
                          loop
                          muted={!!audioFile}
                          playsInline
                          className="max-w-80 max-h-80 lg:max-w-[28rem] lg:max-h-[28rem] object-contain bg-black/20"
                        />
                      )
                    ) : (
                      <div className="w-80 h-80 lg:w-[28rem] lg:h-[28rem] flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                        <div className="text-6xl md:text-8xl lg:text-[8rem] text-white/30">♪</div>
                      </div>
                    )}
                  </div>

                  <div className="absolute -inset-4 bg-gradient-to-br from-white/5 to-transparent rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                </div>

                <div className="text-center mb-6 w-full max-w-md lg:max-w-xl">
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="歌曲名称"
                    className="text-xl md:text-2xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 tracking-tight bg-transparent border-none outline-none text-center w-full placeholder-white/40 focus:bg-white/5 rounded-lg px-2 py-1"
                  />
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="艺术家"
                    className="text-lg md:text-xl lg:text-2xl text-white/60 font-medium bg-transparent border-none outline-none text-center w-full placeholder-white/30 focus:bg-white/5 rounded-lg px-2 py-1"
                  />
                </div>

                <div className="w-full max-w-md">
                  <PlayerControls
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onTogglePlay={togglePlay}
                    onSeek={handleSeek}
                    disabled={!audioFile && !(coverMedia?.type === "video")}
                  />
                </div>
              </div>

              <div className="relative z-10 w-1/2 flex flex-col h-full py-16">
                <div className="flex-1 min-h-0 pb-2">
                  <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
                </div>
                <div className="h-8 md:h-10 lg:h-16 xl:h-20 px-6 pb-2 flex-shrink-0">
                  {audioVisualizerEnabled && (
                    <AudioVisualizer audioElement={mediaElement} isEnabled={true} visualizerType={visualizerType} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {audioFile && <audio ref={audioRef} src={audioFile.url} preload="metadata" />}
    </div>
  )
}
