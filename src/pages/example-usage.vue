<script setup lang="ts">
import { ref } from "vue";
import IntegratedPlayer from "@/components/player/IntegratedPlayer.vue";

// 示例播放列表
const playlist = ref([
  {
    id: "1",
    title: "示例歌曲 1",
    artist: "示例艺术家",
    cover: "/covers/song1.jpg",
    src: "/audio/song1.mp3",
    duration: 180000, // 3分钟，以毫秒为单位
  },
  {
    id: "2",
    title: "示例歌曲 2",
    artist: "另一个艺术家",
    cover: "/covers/song2.jpg",
    src: "/audio/song2.mp3",
    duration: 240000, // 4分钟
  },
  {
    id: "3",
    title: "第三首歌",
    artist: "第三个艺术家",
    cover: "/covers/song3.jpg",
    src: "/audio/song3.mp3",
    duration: 210000, // 3.5分钟
  },
]);

const playerRef = ref();

// 示例：程序控制播放器
function playSpecificSong(index: number) {
  playerRef.value?.setCurrentIndex(index);
  playerRef.value?.play();
}

function getCurrentPlayingInfo() {
  if (playerRef.value) {
    const info = {
      currentSong: playerRef.value.currentSong,
      isPlaying: playerRef.value.isPlaying,
      currentTime: playerRef.value.currentTime,
      progress: playerRef.value.progress,
    };
    // eslint-disable-next-line no-console
    console.log("当前播放信息:", info);
    return info;
  }
}
</script>

<template>
  <div class="example-page">
    <h1 class="mb-6 text-2xl font-bold">
      播放器使用示例
    </h1>

    <!-- 集成播放器 -->
    <div class="player-container">
      <IntegratedPlayer
        ref="playerRef"
        :playlist="playlist"
        :auto-play="true"
      />
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h2 class="mb-4 text-xl font-semibold">
        程序控制
      </h2>

      <div class="buttons">
        <button
          v-for="(song, index) in playlist"
          :key="song.id"
          class="btn"
          @click="playSpecificSong(index)"
        >
          播放: {{ song.title }}
        </button>

        <button class="btn btn-info" @click="getCurrentPlayingInfo">
          获取当前播放信息
        </button>
      </div>
    </div>

    <!-- 播放列表 -->
    <div class="playlist-section">
      <h2 class="mb-4 text-xl font-semibold">
        播放列表
      </h2>

      <div class="playlist">
        <div
          v-for="(song, index) in playlist"
          :key="song.id"
          class="playlist-item"
          @click="playSpecificSong(index)"
        >
          <img :src="song.cover" :alt="song.title" class="cover">
          <div class="info">
            <div class="title">
              {{ song.title }}
            </div>
            <div class="artist">
              {{ song.artist }}
            </div>
          </div>
          <div class="duration">
            {{ Math.floor(song.duration / 60000) }}:{{ String(Math.floor((song.duration % 60000) / 1000)).padStart(2, '0') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.example-page {
  @apply max-w-4xl mx-auto p-6 space-y-8;
}

.player-container {
  @apply bg-gray-900 rounded-lg p-6;
}

.control-panel {
  @apply bg-gray-100 rounded-lg p-6;
}

.buttons {
  @apply flex flex-wrap gap-2;
}

.btn {
  @apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors;
}

.btn-info {
  @apply bg-green-500 hover:bg-green-600;
}

.playlist-section {
  @apply bg-white rounded-lg p-6 shadow-md;
}

.playlist {
  @apply space-y-2;
}

.playlist-item {
  @apply flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors;
}

.cover {
  @apply w-12 h-12 rounded object-cover;
}

.info {
  @apply flex-1;
}

.title {
  @apply font-medium text-gray-900;
}

.artist {
  @apply text-sm text-gray-600;
}

.duration {
  @apply text-sm text-gray-500 font-mono;
}
</style>
