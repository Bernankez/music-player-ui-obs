<script setup lang="ts">
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

const { time: _time = 0, totalTime = 0 } = defineProps<{
  time?: number;
  totalTime?: number;
}>();

// 0 - 100
const _progress = defineModel("progress", {
  default: 0,
});

dayjs.extend(duration);

const progressBarRef = useTemplateRef("progressBarRef");
const isDragging = ref(false);
const previewProgress = ref(0);
const progress = computed(() => isDragging.value ? previewProgress.value : _progress.value);

const previewTime = ref(0);
const time = computed(() => isDragging.value ? previewTime.value : _time);

function onMouseDown(event: MouseEvent) {
  isDragging.value = true;
  previewProgress.value = calculateProgress(event);
  previewTime.value = calculateTime(event);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  event.preventDefault();
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging.value)
    return;
  previewProgress.value = calculateProgress(event);
  previewTime.value = calculateTime(event);
}

function onMouseUp(event: MouseEvent) {
  isDragging.value = false;
  _progress.value = calculateProgress(event);
  previewProgress.value = 0;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

function calculateProgress(event: MouseEvent) {
  if (!progressBarRef.value)
    return 0;
  const rect = progressBarRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  return Math.max(0, Math.min(x / rect.width * 100, 100));
}

function calculateTime(event: MouseEvent) {
  if (!progressBarRef.value)
    return 0;
  const rect = progressBarRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  return Math.max(0, Math.min(x / rect.width * totalTime, totalTime));
}
</script>

<template>
  <div class="flex flex-col select-none gap-rate-0.25">
    <!-- time -->
    <div class="flex items-center justify-between font-mono text-rate-1">
      <div class="text-card/50 text-shadow">
        {{ dayjs.duration(time).format("mm:ss") }}
      </div>
      <div class="text-card/50 text-shadow">
        {{ dayjs.duration(totalTime).format("mm:ss") }}
      </div>
    </div>
    <!-- bar -->
    <div ref="progressBarRef" class="relative w-full h-rate-0.25" @mousedown="onMouseDown">
      <!-- track -->
      <div class="h-full w-full rounded-full bg-card/50"></div>
      <!-- progress -->
      <div
        :style="{ width: `${progress}%` }"
        class="absolute top-0 h-full rounded-full bg-card duration-75"
      ></div>
      <!-- handle -->
      <div
        :style="{ left: `${progress}%` }"
        class="absolute top-1/2 rounded-full bg-card shadow duration-75 w-rate-0.75 h-rate-0.75 -translate-x-1/2 -translate-y-1/2"
      ></div>
    </div>
  </div>
</template>
