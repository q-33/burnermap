<script setup lang="ts">
const { label } = useManCountdown()
const { burn } = useTonightBurn()

// On the day of the Man burn the banner turns bright red and announces it
// directly (the other burns get their own muted-red announcement below).
const isManNight = computed(() => burn.value?.isMan === true)
const text = computed(() => (isManNight.value ? 'The Man burns tonight!' : label.value))
</script>

<template>
  <Transition name="fade">
    <div
      v-if="text"
      class="flex items-center justify-center gap-2 px-4 py-1.5 text-center text-sm font-semibold text-white"
      :class="isManNight ? 'bg-red-600' : 'bg-primary'"
    >
      <UIcon name="i-lucide-flame" class="size-4" />
      <span class="font-display uppercase tracking-wide">{{ text }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active { transition: opacity 0.4s ease; }
.fade-enter-from { opacity: 0; }
</style>
