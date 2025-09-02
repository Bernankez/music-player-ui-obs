<script setup lang="ts">

</script>

<template>
  <PlayerBackground>
    <div class="h-full flex">
      <div class="w-full flex flex-col justify-evenly">
        <div class="mx-auto w-3/5">
          <PlayerCover />
        </div>
        <div class="flex flex-col items-center text-center">
          <PlayerTitle />
          <PlayerArtist />
        </div>
        <div class="mx-auto w-2/3 flex flex-col gap-rate-2">
          <PlayerProgressBar />
          <PlayerControl />
        </div>
      </div>
      <div class="w-full">
        <PlayerLyric />
      </div>
    </div>
  </PlayerBackground>
</template>
