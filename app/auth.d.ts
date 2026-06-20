// Session user shape for the client (useUserSession). Merges with
// nuxt-auth-utils' #auth-utils module, which the client composable binds to.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    displayName: string | null
  }
}

export {}
