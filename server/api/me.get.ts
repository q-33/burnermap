// The current user with LIVE role + feature flags (vs. the session snapshot from
// login). The client fetches this on load so role/feature grants apply without
// requiring a re-login. Returns null when not signed in.
export default defineEventHandler(async (event) => {
  return (await getFreshUser(event)) ?? null
})
