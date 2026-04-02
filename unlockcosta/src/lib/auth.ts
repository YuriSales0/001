import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

const isDev = process.env.NODE_ENV === 'development'

const devUsers = [
  {
    id: 'owner-1',
    name: 'Thomas Weber',
    email: 'owner@unlockcosta.com',
    role: 'OWNER' as const,
    language: 'en',
  },
  {
    id: 'manager-1',
    name: 'Carlos Manager',
    email: 'manager@unlockcosta.com',
    role: 'MANAGER' as const,
    language: 'en',
  },
]

export const authOptions: NextAuthOptions = {
  providers: [
    // Dev credentials provider — no database or email needed
    CredentialsProvider({
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'owner@unlockcosta.com' },
        password: { label: 'Password', type: 'password', placeholder: 'dev' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        // In dev mode, accept any password
        if (isDev) {
          const devUser = devUsers.find(u => u.email === credentials.email)
          if (devUser) return devUser
          // Allow any email in dev
          return {
            id: 'dev-user',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'OWNER' as const,
            language: 'en',
          }
        }

        return null
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as typeof devUsers[0]).role || 'OWNER'
        token.language = (user as typeof devUsers[0]).language || 'en'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'OWNER' | 'MANAGER'
        session.user.language = (token.language as string) || 'en'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-unlockcosta-2026',
}
