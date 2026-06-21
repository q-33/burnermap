<script setup lang="ts">
// The playa map is locked at bearing 45° (the city's 12:00 axis points up), so
// true north sits 45° counter-clockwise from screen-up. This rose is a static
// overlay rotated to match; `rotation` can override if the bearing ever changes.
withDefaults(defineProps<{ rotation?: number }>(), { rotation: -45 })
</script>

<template>
  <div class="pointer-events-none select-none drop-shadow-lg">
    <svg viewBox="0 0 80 80" class="size-16" :style="{ transform: `rotate(${rotation}deg)` }">
      <circle cx="40" cy="40" r="38" fill="#26211a" fill-opacity="0.85" />
      <circle cx="40" cy="40" r="38" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1" />
      <!-- cardinal star: N highlighted -->
      <!-- N -->
      <polygon points="40,7 44,40 40,40" fill="#d96a1e" />
      <polygon points="40,7 36,40 40,40" fill="#f0a868" />
      <!-- S -->
      <polygon points="40,73 44,40 40,40" fill="#ffffff" fill-opacity="0.55" />
      <polygon points="40,73 36,40 40,40" fill="#ffffff" fill-opacity="0.30" />
      <!-- E -->
      <polygon points="73,40 40,44 40,40" fill="#ffffff" fill-opacity="0.45" />
      <polygon points="73,40 40,36 40,40" fill="#ffffff" fill-opacity="0.25" />
      <!-- W -->
      <polygon points="7,40 40,44 40,40" fill="#ffffff" fill-opacity="0.45" />
      <polygon points="7,40 40,36 40,40" fill="#ffffff" fill-opacity="0.25" />
      <circle cx="40" cy="40" r="2.4" fill="#fff" />
      <!-- cardinal letters -->
      <text x="40" y="20" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="sans-serif">N</text>
      <text x="40" y="68" text-anchor="middle" font-size="7.5" fill="#fff" fill-opacity="0.75" font-family="sans-serif">S</text>
      <text x="66" y="43.5" text-anchor="middle" font-size="7.5" fill="#fff" fill-opacity="0.75" font-family="sans-serif">E</text>
      <text x="14" y="43.5" text-anchor="middle" font-size="7.5" fill="#fff" fill-opacity="0.75" font-family="sans-serif">W</text>
    </svg>
  </div>
</template>
