<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayer } from "@/composables/usePlayer";
import AudioPlayer from "./AudioPlayer.vue";
import PlayerArtist from "./PlayerArtist.vue";
import PlayerControl from "./PlayerControl.vue";
import PlayerCover from "./PlayerCover.vue";
import PlayerProgressBar from "./PlayerProgressBar.vue";
import PlayerTitle from "./PlayerTitle.vue";

interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  duration?: number;
}

interface Props {
  playlist?: Song[];
  autoPlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  playlist: () => [],
  autoPlay: false,
});

// 播放列表状态
const currentIndex = ref(0);
const shuffleMode = ref(false);
const repeatMode = ref<"none" | "one" | "all">("none");

// 当前歌曲
const currentSong = computed(() => {
  return props.playlist[currentIndex.value] || null;
});

// 初始化播放器
const totalTime = computed(() => currentSong.value?.duration || 0);
const {
  player,
  isPlaying,
  currentTime,
  progress,
  start,
  pause,
  reset,
  setProgress,
} = usePlayer(totalTime.value);

// 播放控制
function handlePlay() {
  start();
}

function handlePause() {
  pause();
}

function handlePrevious() {
  if (shuffleMode.value) {
    // 随机模式：随机选择一首歌
    const randomIndex = Math.floor(Math.random() * props.playlist.length);
    currentIndex.value = randomIndex;
  }
  else {
    // 正常模式：上一首
    currentIndex.value = currentIndex.value > 0
      ? currentIndex.value - 1
      : props.playlist.length - 1;
  }
  reset();
  if (isPlaying.value && props.autoPlay) {
    start();
  }
}

function handleNext() {
  if (shuffleMode.value) {
    // 随机模式：随机选择一首歌
    const randomIndex = Math.floor(Math.random() * props.playlist.length);
    currentIndex.value = randomIndex;
  }
  else {
    // 正常模式：下一首
    currentIndex.value = currentIndex.value < props.playlist.length - 1
      ? currentIndex.value + 1
      : 0;
  }
  reset();
  if (isPlaying.value && props.autoPlay) {
    start();
  }
}

function handleShuffle() {
  shuffleMode.value = !shuffleMode.value;
}

function handleRepeat() {
  const modes: Array<"none" | "one" | "all"> = ["none", "one", "all"];
  const currentModeIndex = modes.indexOf(repeatMode.value);
  repeatMode.value = modes[(currentModeIndex + 1) % modes.length];
}

function handleProgressChange(newProgress: number) {
  setProgress(newProgress);
}

// 监听播放结束事件
player.addEventListener("ended", () => {
  switch (repeatMode.value) {
    case "one":
      // 单曲循环
      reset();
      start();
      break;
    case "all":
      // 列表循环
      handleNext();
      break;
    case "none":
    default:
      // 不循环，播放下一首（如果有的话）
      if (currentIndex.value < props.playlist.length - 1) {
        handleNext();
      }
      break;
  }
});

// 监听歌曲变化，更新总时间
watch(currentSong, (newSong) => {
  if (newSong?.duration) {
    player.setTotalTime(newSong.duration);
  }
});

// 导出给父组件使用的方法
defineExpose({
  player,
  currentSong,
  currentIndex,
  isPlaying,
  currentTime,
  progress,
  play: handlePlay,
  pause: handlePause,
  next: handleNext,
  previous: handlePrevious,
  setCurrentIndex: (index: number) => {
    if (index >= 0 && index < props.playlist.length) {
      currentIndex.value = index;
      reset();
    }
  },
});
</script>

<template>
  <div class="integrated-player">
    <!-- 音频播放器组件（隐藏） -->
    <AudioPlayer
      v-if="currentSong"
      :src="currentSong.src"
      :player="player"
    />

    <!-- 播放器UI -->
    <div class="player-ui">
      <!-- 封面区域 -->
      <div class="cover-section">
        <PlayerCover :src="currentSong?.cover" />
      </div>

      <!-- 信息区域 -->
      <div class="info-section">
        <PlayerTitle :title="currentSong?.title || '未知歌曲'" />
        <PlayerArtist :artist="currentSong?.artist || '未知艺术家'" />
      </div>

      <!-- 控制区域 -->
      <div class="control-section">
        <PlayerProgressBar
          :progress="progress"
          :time="currentTime"
          :total-time="totalTime"
          :on-progress-change="handleProgressChange"
        />

        <PlayerControl
          :is-playing="isPlaying"
          :shuffle-mode="shuffleMode"
          :repeat-mode="repeatMode"
          :on-play="handlePlay"
          :on-pause="handlePause"
          :on-previous="handlePrevious"
          :on-next="handleNext"
          :on-shuffle="handleShuffle"
          :on-repeat="handleRepeat"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.integrated-player {
  @apply flex flex-col gap-4;
}

.player-ui {
  @apply flex flex-col gap-4;
}

.cover-section {
  @apply flex justify-center;
}

.info-section {
  @apply flex flex-col items-center text-center gap-2;
}

.control-section {
  @apply flex flex-col gap-4;
}
</style>
