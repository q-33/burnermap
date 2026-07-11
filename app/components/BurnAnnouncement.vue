<script setup lang="ts">
// Day-of announcement for a headline burn, in the muted red of the Events page's
// "Major Burns" section. The Man burn is skipped here — the countdown banner
// announces it in bright red instead.
const { burn } = useTonightBurn()
const announce = computed(() => (burn.value && !burn.value.isMan ? burn.value : null))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="announce"
      class="flex items-center justify-center gap-2 bg-red-700 px-4 py-1.5 text-center text-sm font-semibold text-white"
    >
      <UIcon name="i-lucide-flame" class="size-4" />
      <span class="font-display uppercase tracking-wide">{{ announce.name }} happens tonight at {{ announce.tonight }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active { transition: opacity 0.4s ease; }
.fade-enter-from { opacity: 0; }
</style>
