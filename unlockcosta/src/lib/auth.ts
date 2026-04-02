import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

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
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Match dev users with password "dev"
        if (credentials.password === 'dev') {
          const devUser = devUsers.find(u => u.email === credentials.email)
          if (devUser) return devUser

          // Any email with password "dev" gets owner access
          return {
            id: 'dev-user',
            name: credentials.email.split('@')[0],
            email: credentials.email,
            role: 'OWNER' as const,
            language: 'en',
          }
        }

        // TODO: Add real password verification with bcrypt when DB is connected
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
