<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <!-- Aspect Ratio Container -->
    <div 
      class="relative bg-black/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
      :style="containerStyle"
    >
      <!-- Background Cover -->
      <div class="absolute inset-0 overflow-hidden">
        <div v-if="coverUrl" class="absolute inset-0">
          <img v-if="coverType === 'image'" 
               :src="coverUrl" 
               class="w-full h-full object-cover blur-3xl opacity-30" 
               alt="Background" />
          <video v-else-if="coverType === 'video'" 
                 :src="coverUrl" 
                 class="w-full h-full object-cover blur-3xl opacity-30" 
                 muted loop autoplay />
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 h-full flex flex-col justify-between p-8">
        <!-- Top Controls -->
        <div class="flex justify-between items-start">
          <div class="flex gap-4">
            <button @click="togglePlay" 
                    class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              <svg v-if="!isPlaying" class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            
            <!-- Aspect Ratio Selector -->
            <select v-model="selectedRatio" 
                    class="bg-white/20 backdrop-blur-md text-white rounded-lg px-3 py-2 text-sm border-none outline-none">
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
            </select>
          </div>

          <!-- Recording Button -->
          <button @click="toggleRecording" 
                  :class="[
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
                  ]">
            {{ isRecording ? '停止录制' : '开始录制' }}
          </button>
        </div>

        <!-- Center Content -->
        <div class="flex-1 flex flex-col items-center justify-center text-center">
          <!-- Cover Art -->
          <div class="w-48 h-48 mb-6 rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-md">
            <div v-if="!coverUrl" class="w-full h-full flex items-center justify-center">
              <svg class="w-16 h-16 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <img v-else-if="coverType === 'image'" 
                 :src="coverUrl" 
                 class="w-full h-full object-cover" 
                 alt="Cover" />
            <video v-else-if="coverType === 'video'" 
                   :src="coverUrl" 
                   class="w-full h-full object-cover" 
                   muted loop autoplay />
          </div>

          <!-- Song Info -->
          <h1 class="text-2xl font-bold text-white mb-2">{{ songTitle || '选择音乐文件' }}</h1>
          <p class="text-white/70 mb-6">{{ artist || '未知艺术家' }}</p>

          <!-- Current Lyrics -->
          <div class="min-h-[60px] flex items-center justify-center">
            <p class="text-xl text-white/90 font-medium text-center leading-relaxed max-w-md">
              {{ currentLyric || '暂无歌词' }}
            </p>
          </div>
        </div>

        <!-- Bottom Controls -->
        <div class="space-y-4">
          <!-- Progress Bar -->
          <div class="flex items-center gap-4 text-white/70 text-sm">
            <span>{{ formatTime(currentTime) }}</span>
            <div class="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white transition-all duration-300" 
                   :style="{ width: progressPercentage + '%' }"></div>
            </div>
            <span>{{ formatTime(duration) }}</span>
          </div>

          <!-- File Upload Controls -->
          <div class="flex gap-2 flex-wrap">
            <label class="px-3 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg text-sm cursor-pointer hover:bg-white/30 transition-all">
              选择音乐
              <input type="file" accept="audio/*" @change="handleAudioUpload" class="hidden" />
            </label>
            
            <label class="px-3 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg text-sm cursor-pointer hover:bg-white/30 transition-all">
              选择封面
              <input type="file" accept="image/*,video/*" @change="handleCoverUpload" class="hidden" />
            </label>
            
            <button @click="showLyricsEditor = !showLyricsEditor" 
                    class="px-3 py-2 bg-white/20 backdrop-blur-md text-white rounded-lg text-sm hover:bg-white/30 transition-all">
              {{ showLyricsEditor ? '隐藏歌词' : '编辑歌词' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Lyrics Editor -->
      <div v-if="showLyricsEditor" 
           class="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 flex items-center justify-center p-8">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md">
          <h3 class="text-white text-lg font-semibold mb-4">编辑歌词</h3>
          <textarea v-model="lyricsText" 
                    placeholder="输入歌词，支持时间戳格式：&#10;[00:15]第一句歌词&#10;[00:30]第二句歌词"
                    class="w-full h-64 bg-white/10 text-white rounded-lg p-3 resize-none border-none outline-none placeholder-white/50"
                    @input="parseLyrics"></textarea>
          <div class="flex gap-3 mt-4">
            <button @click="showLyricsEditor = false" 
                    class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
              确定
            </button>
            <button @click="clearLyrics" 
                    class="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all">
              清空
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio ref="audioRef" 
           @loadedmetadata="onAudioLoaded" 
           @timeupdate="onTimeUpdate" 
           @ended="onAudioEnded"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Reactive state
const audioRef = ref<HTMLAudioElement>()
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const songTitle = ref('')
const artist = ref('')
const coverUrl = ref('')
const coverType = ref<'image' | 'video'>('image')
const selectedRatio = ref('16:9')
const showLyricsEditor = ref(false)
const lyricsText = ref('')
const lyrics = ref<Array<{ time: number; text: string }>>([])
const isRecording = ref(false)
const mediaRecorder = ref<MediaRecorder>()
const recordedChunks = ref<Blob[]>([])

// Computed properties
const progressPercentage = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const currentLyric = computed(() => {
  if (lyrics.value.length === 0) return ''
  
  let currentLyricText = ''
  for (const lyric of lyrics.value) {
    if (currentTime.value >= lyric.time) {
      currentLyricText = lyric.text
    } else {
      break
    }
  }
  return currentLyricText
})

const containerStyle = computed(() => {
  const ratios = {
    '16:9': { width: '800px', height: '450px' },
    '4:3': { width: '600px', height: '450px' },
    '1:1': { width: '500px', height: '500px' },
    '9:16': { width: '400px', height: '711px' }
  }
  return ratios[selectedRatio.value as keyof typeof ratios]
})

// Methods
const togglePlay = () => {
  if (!audioRef.value) return
  
  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const handleAudioUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const url = URL.createObjectURL(file)
  if (audioRef.value) {
    audioRef.value.src = url
    songTitle.value = file.name.replace(/\.[^/.]+$/, '')
  }
}

const handleCoverUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  coverUrl.value = URL.createObjectURL(file)
  coverType.value = file.type.startsWith('video/') ? 'video' : 'image'
}

const parseLyrics = () => {
  const lines = lyricsText.value.split('\n')
  const parsedLyrics: Array<{ time: number; text: string }> = []
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\](.*)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const text = match[3].trim()
      const time = minutes * 60 + seconds
      parsedLyrics.push({ time, text })
    }
  }
  
  lyrics.value = parsedLyrics.sort((a, b) => a.time - b.time)
}

const clearLyrics = () => {
  lyricsText.value = ''
  lyrics.value = []
}

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const onAudioLoaded = () => {
  if (audioRef.value) {
    duration.value = audioRef.value.duration
  }
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = audioRef.value.currentTime
  }
}

const onAudioEnded = () => {
  isPlaying.value = false
}

const toggleRecording = async () => {
  if (isRecording.value) {
    // Stop recording
    if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.stop()
    }
  } else {
    // Start recording
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      })
      
      mediaRecorder.value = new MediaRecorder(stream)
      recordedChunks.value = []
      
      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.value.push(event.data)
        }
      }
      
      mediaRecorder.value.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `music-player-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        isRecording.value = false
      }
      
      mediaRecorder.value.start()
      isRecording.value = true
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('无法开始录制，请确保浏览器支持屏幕录制功能')
    }
  }
}

// Keyboard shortcuts
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.code === 'Space' && !showLyricsEditor.value) {
    event.preventDefault()
    togglePlay()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<style>
/* Custom scrollbar for lyrics editor */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
