import { burnOn, pacificDateOf } from '~~/lib/burns'

// Which major burn (if any) is happening TODAY on the playa (Pacific date).
// null during SSR so there's no hydration mismatch; filled in on the client and
// re-checked hourly so it flips at playa midnight.
//
// Preview override for testing before the event: append ?burn=YYYY-MM-DD to any
// URL (e.g. ?burn=2026-09-05) to force that day's banner. Harmless — it only
// changes which banner shows.
export function useTonightBurn() {
  const route = useRoute()
  const now = ref<number | null>(null)
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => (now.value = Date.now()), 60 * 60 * 1000)
  })
  onBeforeUnmount(() => timer && clearInterval(timer))

  const burn = computed(() => {
    const preview = route.query.burn
    if (typeof preview === 'string' && preview)
      return burnOn(preview)
    return now.value == null ? null : burnOn(pacificDateOf(now.value))
  })

  return { burn }
}
