import 'next-auth'

type AppRole = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: AppRole
      language: string
    }
  }
}
