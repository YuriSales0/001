import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export type AppRole = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'

const secret = process.env.NEXTAUTH_SECRET
if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_SECRET must be set in production')
}

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
              if (!user.emailVerified) {
                throw new Error('EMAIL_NOT_VERIFIED')
              }
              return {
                id: user.id,
                name: user.name ?? email,
                email: user.email,
                role: user.role as AppRole,
                language: user.language,
                isSuperUser: (user as unknown as { isSuperUser?: boolean }).isSuperUser ?? false,
                isCaptain: (user as unknown as { isCaptain?: boolean }).isCaptain ?? false,
              }
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message === 'EMAIL_NOT_VERIFIED') {
            throw err
          }
          // fall through to dev fallback on infra errors
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
        token.isSuperUser = (user as { isSuperUser?: boolean }).isSuperUser ?? false
        token.isCaptain = (user as { isCaptain?: boolean }).isCaptain ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as AppRole
        session.user.language = (token.language as string) || 'en'
        session.user.isSuperUser = token.isSuperUser as boolean
        session.user.isCaptain = token.isCaptain as boolean
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret,
}
