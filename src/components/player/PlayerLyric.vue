<script setup lang="ts">
import { parseLyric } from "@/lib/lyric";

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

// 使用解析函数
const parsedLyric = parseLyric(lyricText);
// eslint-disable-next-line no-console
console.log(parsedLyric);

// 格式化时间显示
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((milliseconds % 1000) / 10);

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

// TODO
</script>

<template>
  <div class="lyric-display">
    <div class="metadata">
      <h3>{{ parsedLyric.metadata.title }}</h3>
      <p>艺术家: {{ parsedLyric.metadata.artist }}</p>
      <p>专辑: {{ parsedLyric.metadata.album }}</p>
      <p>偏移: {{ parsedLyric.metadata.offset }}ms</p>
    </div>

    <div class="lyrics">
      <div v-for="line in parsedLyric.lyrics" :key="line.id" class="lyric-line">
        <div class="time">
          {{ formatTime(line.time) }}
        </div>
        <div class="text">
          {{ line.text }}
        </div>
        <div v-if="line.segments && line.segments.length > 1" class="segments">
          <span
            v-for="(segment, segmentIndex) in line.segments" :key="segmentIndex"
            class="segment" :style="{ animationDelay: `${segment.time}ms` }"
          >
            {{ segment.text }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyric-display {
  padding: 20px;
  font-family: Arial, sans-serif;
}

.metadata {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.metadata h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.metadata p {
  margin: 5px 0;
  color: #666;
}

.lyrics {
  line-height: 1.6;
}

.lyric-line {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.time {
  color: #999;
  font-size: 0.9em;
  min-width: 60px;
  text-align: right;
}

.text {
  flex: 1;
  color: #333;
}

.segments {
  margin-left: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.segment {
  background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
