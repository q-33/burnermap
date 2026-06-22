<script setup lang="ts">
interface Msg { id: string, body: string, createdAt: string, fromMe: boolean }
interface Thread { other: { id: string, displayName: string | null, playaName: string | null }, messages: Msg[] }

const route = useRoute()
const userId = computed(() => String(route.params.userId))
const { loggedIn } = useUserSession()
const { refreshMe } = useMe()

const { data, refresh, error } = await useFetch<Thread>(() => `/api/messages/${userId.value}`)
// viewing the thread marked messages read — sync the inbox badge
onMounted(refreshMe)

const otherName = computed(() => data.value?.other.displayName || data.value?.other.playaName || 'Burner')

const body = ref('')
const sending = ref(false)
const sendError = ref('')

async function send() {
  const text = body.value.trim()
  if (!text || sending.value)
    return
  sending.value = true
  sendError.value = ''
  try {
    await $fetch('/api/messages', { method: 'POST', body: { recipientId: userId.value, body: text } })
    body.value = ''
    await refresh()
    await nextTick(scrollToEnd)
  }
  catch (e: any) {
    sendError.value = e?.data?.statusMessage ?? 'Could not send'
  }
  finally {
    sending.value = false
  }
}

const endRef = useTemplateRef<HTMLDivElement>('end')
function scrollToEnd() {
  endRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}
watch(() => data.value?.messages.length, () => nextTick(scrollToEnd))

function time(ts: string): string {
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

useHead({ title: () => `${otherName.value} — Messages` })
</script>

<template>
  <UContainer class="flex max-w-2xl flex-col py-6 sm:py-10" style="min-height: calc(100dvh - 4rem)">
    <div class="mb-4 flex items-center gap-3">
      <UButton to="/messages" size="xs" variant="ghost" icon="i-lucide-arrow-left" square />
      <h1 class="font-display text-xl font-bold uppercase tracking-tight">{{ otherName }}</h1>
    </div>

    <div v-if="error" class="rounded-xl border border-(--ui-border) p-6 text-center text-(--ui-text-muted)">
      <p v-if="!loggedIn">Please <NuxtLink to="/?login=1" class="text-primary underline">log in</NuxtLink> to message.</p>
      <p v-else>Conversation not available.</p>
    </div>

    <template v-else>
      <div class="flex-1 space-y-2 overflow-y-auto pb-4">
        <p v-if="!data?.messages.length" class="py-10 text-center text-sm text-(--ui-text-muted)">
          No messages yet — say hi 👋
        </p>
        <div v-for="m in data?.messages" :key="m.id" class="flex" :class="m.fromMe ? 'justify-end' : 'justify-start'">
          <div
            class="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm"
            :class="m.fromMe ? 'bg-primary text-white' : 'bg-(--ui-bg-muted) text-(--ui-text)'"
          >
            <p class="whitespace-pre-line break-words">{{ m.body }}</p>
            <p class="mt-1 text-[10px] opacity-60">{{ time(m.createdAt) }}</p>
          </div>
        </div>
        <div ref="end" />
      </div>

      <form class="sticky bottom-0 flex items-end gap-2 border-t border-(--ui-border) bg-(--ui-bg) pt-3" @submit.prevent="send">
        <UTextarea
          v-model="body"
          :rows="1"
          autoresize
          :maxrows="5"
          placeholder="Write a message…"
          class="flex-1"
          @keydown.enter.exact.prevent="send"
        />
        <UButton type="submit" icon="i-lucide-send" :loading="sending" :disabled="!body.trim()" square size="lg" />
      </form>
      <p v-if="sendError" class="mt-1 text-xs text-red-600">{{ sendError }}</p>
    </template>
  </UContainer>
</template>
