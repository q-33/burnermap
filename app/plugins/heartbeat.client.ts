// Presence heartbeat: while signed in and the tab is visible, refresh /api/me
// every minute. That keeps the live role/badges current AND updates last_seen_at
// so the admin "Online" view stays accurate for users idling with the app open.
export default defineNuxtPlugin(() => {
  const { loggedIn } = useUserSession()
  const { refreshMe } = useMe()

  const ping = () => {
    if (loggedIn.value && document.visibilityState === 'visible') {
      refreshMe() // refresh role/badges
      $fetch('/api/presence', { method: 'POST' }).catch(() => {}) // record presence
    }
  }

  ping() // register presence shortly after load
  const timer = window.setInterval(ping, 60_000)
  document.addEventListener('visibilitychange', ping)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', ping)
    })
  }
})
