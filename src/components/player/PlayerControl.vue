<script setup lang="ts">
const emit = defineEmits<{
  play: [];
  pause: [];
}>();

const playing = defineModel<boolean>("playing");

watch(playing, (isPlaying) => {
  if (isPlaying) {
    emit("play");
  }
  else {
    emit("pause");
  }
});
</script>

<template>
  <div class="flex items-center justify-between text-card text-rate-1.5">
    <div class="i-ri-shuffle-fill"></div>
    <div class="i-ri-play-reverse-mini-fill text-rate-2.5"></div>
    <div class="text-rate-2.5" @click="playing = !playing">
      <div v-if="playing" class="i-ri-pause-fill"></div>
      <div v-else class="i-ri-play-large-fill"></div>
    </div>
    <div class="i-ri-play-mini-fill text-rate-2.5"></div>
    <div class="i-ri-repeat-one-fill"></div>
  </div>
</template>
