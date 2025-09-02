<script setup lang="ts">
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

interface Props {
  // 0 - 100
  progress?: number;
  time?: number;
  totalTime?: number;
  onProgressChange?: (progress: number) => void;
}

const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  time: 0,
  totalTime: 0,
});

dayjs.extend(duration);

const progressBarRef = ref<HTMLDivElement>();
const isDragging = ref(false);
const tempProgress = ref(props.progress);

// 计算进度条位置
function calculateProgress(clientX: number): number {
  if (!progressBarRef.value)
    return props.progress;

  const rect = progressBarRef.value.getBoundingClientRect();
  const x = clientX - rect.left;
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
  return percentage;
}

// 鼠标按下事件
function handleMouseDown(event: MouseEvent) {
  isDragging.value = true;
  tempProgress.value = calculateProgress(event.clientX);

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  event.preventDefault();
}

// 鼠标移动事件
function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value)
    return;
  tempProgress.value = calculateProgress(event.clientX);
}

// 鼠标释放事件
function handleMouseUp() {
  if (isDragging.value) {
    props.onProgressChange?.(tempProgress.value);
    isDragging.value = false;
  }

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

// 点击进度条
function handleClick(event: MouseEvent) {
  if (!isDragging.value) {
    const newProgress = calculateProgress(event.clientX);
    props.onProgressChange?.(newProgress);
  }
}

// 显示的进度值
const displayProgress = computed(() => {
  return isDragging.value ? tempProgress.value : props.progress;
});

// 显示的时间（拖拽时预览）
const displayTime = computed(() => {
  if (isDragging.value && props.totalTime > 0) {
    return (tempProgress.value / 100) * props.totalTime;
  }
  return props.time;
});
</script>

<template>
  <div class="flex flex-col gap-rate-0.25">
    <!-- time -->
    <div class="flex items-center justify-between font-mono text-rate-1">
      <div class="text-card/50 text-shadow">
        {{ dayjs.duration(displayTime).format("mm:ss") }}
      </div>
      <div class="text-card/50 text-shadow">
        {{ dayjs.duration(totalTime).format("mm:ss") }}
      </div>
    </div>
    <!-- bar -->
    <div
      ref="progressBarRef"
      class="group relative w-full cursor-pointer h-rate-0.25"
      @mousedown="handleMouseDown"
      @click="handleClick"
    >
      <!-- 背景轨道 -->
      <div class="h-full w-full rounded-full bg-card/50"></div>
      <!-- 进度条 -->
      <div
        :style="{ width: `${displayProgress}%` }"
        class="absolute top-0 h-full rounded-full bg-card transition-all duration-75"
        :class="{ 'transition-none': isDragging }"
      ></div>
      <!-- 拖拽手柄 -->
      <div
        :style="{ left: `${displayProgress}%` }"
        class="absolute top-1/2 rounded-full bg-card shadow transition-all duration-75 w-rate-0.75 h-rate-0.75 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110"
        :class="{
          'transition-none scale-125': isDragging,
          'cursor-grab': !isDragging,
          'cursor-grabbing': isDragging,
        }"
      ></div>
    </div>
  </div>
</template>
