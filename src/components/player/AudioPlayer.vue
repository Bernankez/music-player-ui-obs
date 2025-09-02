<script setup lang="ts">
import type { Player } from "@/composables/usePlayer";
import { onMounted, ref, watch } from "vue";

interface Props {
  src: string;
  player: Player;
}

const props = defineProps<Props>();

const audioRef = ref<HTMLAudioElement>();
let isManualSeek = false;

onMounted(() => {
  if (!audioRef.value)
    return;

  const audio = audioRef.value;

  // 监听音频元数据加载完成
  audio.addEventListener("loadedmetadata", () => {
    const duration = audio.duration * 1000; // 转换为毫秒
    props.player.setTotalTime(duration);
  });

  // 监听音频播放状态变化
  audio.addEventListener("play", () => {
    if (!isManualSeek) {
      props.player.start();
    }
  });

  audio.addEventListener("pause", () => {
    if (!isManualSeek) {
      props.player.pause();
    }
  });

  // 监听音频时间更新（用于同步）
  audio.addEventListener("timeupdate", () => {
    if (!isManualSeek) {
      const currentTime = audio.currentTime * 1000; // 转换为毫秒
      // 检查是否与Player时间差异过大（超过100ms），如果是则同步
      const playerTime = props.player.getCurrentTime();
      if (Math.abs(currentTime - playerTime) > 100) {
        props.player.setCurrentTime(currentTime);
      }
    }
  });

  // 监听播放结束
  audio.addEventListener("ended", () => {
    props.player.reset();
  });

  // 监听Player的事件，控制音频播放
  props.player.addEventListener("play", () => {
    if (audio.paused) {
      audio.play().catch(console.error);
    }
  });

  props.player.addEventListener("pause", () => {
    if (!audio.paused) {
      audio.pause();
    }
  });

  props.player.addEventListener("reset", () => {
    audio.currentTime = 0;
    if (!audio.paused) {
      audio.pause();
    }
  });

  // 监听Player的时间设置（用于进度条拖拽）
  props.player.addEventListener("timeupdate", (data) => {
    const audioTime = audio.currentTime * 1000;
    const playerTime = data.time;

    // 如果时间差异较大，说明是手动设置的时间，需要同步到音频
    if (Math.abs(audioTime - playerTime) > 100) {
      isManualSeek = true;
      audio.currentTime = playerTime / 1000;
      // 延迟重置标志，避免触发其他事件
      setTimeout(() => {
        isManualSeek = false;
      }, 100);
    }
  });
});

// 监听src变化，加载新音频
watch(() => props.src, (newSrc) => {
  if (audioRef.value && newSrc) {
    props.player.reset();
    audioRef.value.src = newSrc;
    audioRef.value.load();
  }
});
</script>

<template>
  <audio
    ref="audioRef"
    :src="src"
    preload="metadata"
    class="hidden"
  ></audio>
</template>
