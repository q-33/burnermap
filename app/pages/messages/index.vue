<script setup lang="ts">
interface Conversation {
  userId: string
  displayName: string | null
  playaName: string | null
  lastBody: string
  lastAt: string
  lastFromMe: boolean
  unread: number
}

const { loggedIn } = useUserSession()
const { data: convos, status, refresh } = await useFetch<Conversation[]>('/api/messages', {
  default: () => [],
})

function name(c: Conversation): string {
  return c.displayName || c.playaName || 'Burner'
}
function rel(ts: string): string {
  const mins = Math.round((Date.now() - +new Date(ts)) / 60000)
  if (!Number.isFinite(mins))
    return ''
  if (mins < 1)
    return 'now'
  if (mins < 60)
    return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24)
    return `${hrs}h`
  return new Date(ts).toLocaleDateString()
}

useHead({ title: 'Messages — BurnerMap' })
</script>

<template>
  <UContainer class="max-w-2xl py-10 sm:py-14">
    <div class="mb-6 flex items-end justify-between gap-3">
      <h1 class="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Messages</h1>
      <UButton size="xs" variant="ghost" icon="i-lucide-refresh-cw" :loading="status === 'pending'" @click="refresh()">Refresh</UButton>
    </div>

    <div v-if="!loggedIn" class="rounded-xl border border-(--ui-border) p-6 text-center text-(--ui-text-muted)">
      <p>Please <NuxtLink to="/?login=1" class="text-primary underline">log in</NuxtLink> to see your messages.</p>
    </div>

    <div v-else-if="convos.length" class="divide-y divide-(--ui-border) overflow-hidden rounded-xl border border-(--ui-border)">
      <NuxtLink
        v-for="c in convos"
        :key="c.userId"
        :to="`/messages/${c.userId}`"
        class="flex items-center gap-3 px-4 py-3 transition hover:bg-(--ui-bg-muted)"
      >
        <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--ui-bg-muted) font-semibold uppercase">
          {{ name(c).charAt(0) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate font-medium" :class="c.unread ? 'text-(--ui-text-highlighted)' : ''">{{ name(c) }}</p>
            <span class="shrink-0 text-xs text-(--ui-text-muted)">{{ rel(c.lastAt) }}</span>
          </div>
          <p class="truncate text-sm text-(--ui-text-muted)">
            <span v-if="c.lastFromMe" class="text-(--ui-text-dimmed)">You: </span>{{ c.lastBody }}
          </p>
        </div>
        <UBadge v-if="c.unread" color="primary" variant="solid" size="sm" class="shrink-0">{{ c.unread }}</UBadge>
      </NuxtLink>
    </div>

    <div v-else-if="status !== 'pending'" class="py-16 text-center text-(--ui-text-muted)">
      <UIcon name="i-lucide-mail" class="mx-auto mb-3 size-10 opacity-40" />
      <p>No messages yet.</p>
      <p class="mt-1 text-sm">Open a camp or artwork and tap “Message the organizer” to start a conversation.</p>
    </div>
  </UContainer>
</template>
