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
        // DEBUG MODE: throw errors with descriptive codes so they appear in URL
        if (!credentials?.email) throw new Error('DBG_NO_EMAIL')
        if (!credentials?.password) throw new Error('DBG_NO_PASSWORD')

        const email = credentials.email.toLowerCase().trim()

        if (!prisma) throw new Error('DBG_PRISMA_NULL')

        let user
        try {
          user = await prisma.user.findUnique({ where: { email } })
        } catch (e) {
          throw new Error('DBG_DB_ERROR_' + (e instanceof Error ? e.message.slice(0, 50) : 'unknown'))
        }

        if (!user) throw new Error('DBG_USER_NOT_FOUND_' + email)
        if (!user.password) throw new Error('DBG_NO_PASSWORD_IN_DB')

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) throw new Error('DBG_BCRYPT_MISMATCH')

        if (!user.emailVerified) throw new Error('EMAIL_NOT_VERIFIED')

        return {
          id: user.id,
          name: user.name ?? email,
          email: user.email,
          role: user.role as AppRole,
          language: user.language,
          isSuperUser: (user as unknown as { isSuperUser?: boolean }).isSuperUser ?? false,
          isCaptain: (user as unknown as { isCaptain?: boolean }).isCaptain ?? false,
        }
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
