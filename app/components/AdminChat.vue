<script setup lang="ts">
// Floating "Message the Admin" chat bubble. Reuses the messaging system: it DMs
// the primary admin. Hidden for the admin themselves (they use their inbox).
interface Msg { id: string, body: string, createdAt: string, fromMe: boolean }

const { loggedIn } = useUserSession()
const { isAdmin, refreshMe } = useMe()

const open = ref(false)
const admin = ref<{ id: string, displayName: string | null } | null>(null)
const messages = ref<Msg[]>([])
const loading = ref(false)
const body = ref('')
const sending = ref(false)
const err = ref('')
const scroller = useTemplateRef<HTMLDivElement>('scroller')

function scrollEnd() {
  const el = scroller.value
  if (el)
    el.scrollTop = el.scrollHeight
}

async function loadThread() {
  if (!admin.value)
    return
  const t = await $fetch<{ messages: Msg[] }>(`/api/messages/${admin.value.id}`)
  messages.value = t.messages
  await refreshMe() // viewing marks the thread read → unread badge syncs
  await nextTick(scrollEnd)
}

async function loadAdmin() {
  loading.value = true
  err.value = ''
  try {
    const s = await $fetch<{ admin: { id: string, displayName: string | null } | null }>('/api/support')
    admin.value = s.admin
    if (admin.value)
      await loadThread()
  }
  catch {
    err.value = 'Could not load chat'
  }
  finally {
    loading.value = false
  }
}

async function toggle() {
  open.value = !open.value
  if (open.value && loggedIn.value && !admin.value)
    await loadAdmin()
}

async function send() {
  const text = body.value.trim()
  if (!text || !admin.value || sending.value)
    return
  sending.value = true
  err.value = ''
  try {
    await $fetch('/api/messages', { method: 'POST', body: { recipientId: admin.value.id, body: text } })
    body.value = ''
    await loadThread()
  }
  catch (e: any) {
    err.value = e?.data?.statusMessage ?? 'Could not send'
  }
  finally {
    sending.value = false
  }
}

function time(ts: string): string {
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <!-- the admin doesn't message themselves -->
  <div v-if="!isAdmin" class="pointer-events-auto relative flex justify-end">
    <!-- chat window -->
    <div
      v-if="open"
      class="absolute bottom-16 right-0 flex h-96 w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-(--ui-bg) shadow-2xl"
    >
      <div class="flex items-center justify-between gap-2 bg-[#26211a] px-3 py-2 text-white">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-shield" class="size-4 text-primary" />
          <span class="font-display text-sm font-semibold uppercase tracking-wide">Message the Admin</span>
        </div>
        <button type="button" class="text-white/60 hover:text-white" @click="open = false">
          <UIcon name="i-lucide-x" class="size-4" />
        </button>
      </div>

      <template v-if="!loggedIn">
        <div class="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-(--ui-text-muted)">
          <UIcon name="i-lucide-lock" class="size-6 opacity-50" />
          <p><NuxtLink to="/?login=1" class="text-primary underline">Log in</NuxtLink> to message the admin.</p>
        </div>
      </template>
      <template v-else>
        <div ref="scroller" class="flex-1 space-y-2 overflow-y-auto p-3">
          <p v-if="loading" class="py-6 text-center text-sm text-(--ui-text-muted)">Loading…</p>
          <p v-else-if="!messages.length" class="py-6 text-center text-sm text-(--ui-text-muted)">
            Questions, problems, or feedback? Send the admin a message.
          </p>
          <div v-for="m in messages" :key="m.id" class="flex" :class="m.fromMe ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[80%] rounded-2xl px-3 py-1.5 text-sm"
              :class="m.fromMe ? 'bg-primary text-white' : 'bg-(--ui-bg-muted) text-(--ui-text)'"
            >
              <p class="whitespace-pre-line break-words">{{ m.body }}</p>
              <p class="mt-0.5 text-[10px] opacity-60">{{ time(m.createdAt) }}</p>
            </div>
          </div>
          <p v-if="err" class="text-center text-xs text-red-600">{{ err }}</p>
        </div>
        <form class="flex items-end gap-2 border-t border-(--ui-border) p-2" @submit.prevent="send">
          <UTextarea
            v-model="body"
            :rows="1"
            autoresize
            :maxrows="4"
            placeholder="Write a message…"
            class="flex-1"
            @keydown.enter.exact.prevent="send"
          />
          <UButton type="submit" icon="i-lucide-send" :loading="sending" :disabled="!body.trim()" square />
        </form>
      </template>
    </div>

    <!-- launcher button -->
    <UButton
      :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-message-circle'"
      color="neutral"
      class="bg-[#26211a]/90 text-white shadow-lg backdrop-blur-xl hover:bg-[#26211a]"
      @click="toggle"
    >
      Message the Admin
    </UButton>
  </div>
</template>
