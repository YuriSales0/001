import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export type AppRole = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'

// Fallback dev users (used only if DB is not reachable)
const devUsers: Array<{
  id: string
  name: string
  email: string
  role: AppRole
  language: string
}> = [
  { id: 'admin-1', name: 'Hostmaster Admin', email: 'admin@hostmaster.es', role: 'ADMIN', language: 'en' },
  { id: 'manager-1', name: 'Carlos Manager', email: 'manager@hostmaster.es', role: 'MANAGER', language: 'en' },
  { id: 'crew-1', name: 'Crew', email: 'crew@hostmaster.es', role: 'CREW', language: 'en' },
  { id: 'client-1', name: 'Thomas Weber', email: 'client@hostmaster.es', role: 'CLIENT', language: 'en' },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase().trim()

        // Try DB first
        try {
          if (prisma) {
            const user = await prisma.user.findUnique({ where: { email } })
            if (user?.password) {
              const ok = await bcrypt.compare(credentials.password, user.password)
              if (!ok) return null
              return {
                id: user.id,
                name: user.name ?? email,
                email: user.email,
                role: user.role as AppRole,
                language: user.language,
              }
            }
          }
        } catch {
          // fall through to dev fallback
        }

        // Dev fallback — only when not in production
        if (process.env.NODE_ENV !== 'production' && credentials.password === 'dev') {
          const devUser = devUsers.find(u => u.email === email)
          if (devUser) return devUser
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: AppRole }).role || 'CLIENT'
        token.language = (user as { language?: string }).language || 'en'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as AppRole
        session.user.language = (token.language as string) || 'en'
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-hostmaster-2026',
}
