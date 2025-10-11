<script setup lang="ts">
import { useLyric } from "@/composables/useLyric";
import { usePlayer } from "@/composables/usePlayer";

const lyricText = `[ti:说爱你]
[ar:蔡依林]
[al:看我七十二变]
[by:]
[offset:500]
[02:51.48][00:20.93]我的世界变得奇妙更难以言喻
[02:51.48]<00:20.93>我 <00:22.43>的
[02:56.19][00:25.61]F: 还以为是从天而降的梦境
[03:00.85][00:30.24]M: 直到确定手的温度来自你心里
[03:05.60][00:34.94]D: 这一刻我终于勇敢说爱你`;

const { time } = usePlayer();
const { parsedLyric, currentLyric } = useLyric(lyricText, time);
</script>

<template>
  <div class="relative h-full overflow-y-auto">
    <div class="absolute whitespace-pre text-center text-card font-bold text-rate-1.5 leading-rate-4">
      {{ parsedLyric?.lyrics.map(lyric => lyric.text).join('\n') }}
    </div>
  </div>
</template>
