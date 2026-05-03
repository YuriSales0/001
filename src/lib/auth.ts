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
        code: { label: '2FA code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email.toLowerCase().trim()
        const code = (credentials.code || '').trim()

        try {
          if (prisma) {
            const user = await prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                email: true,
                name: true,
                password: true,
                emailVerified: true,
                role: true,
                language: true,
                isSuperUser: true,
                isCaptain: true,
                twoFactorEnabled: true,
              },
            })
            if (user?.password) {
              const ok = await bcrypt.compare(credentials.password, user.password)
              if (!ok) return null
              if (!user.emailVerified) {
                throw new Error('EMAIL_NOT_VERIFIED')
              }

              // 2FA enforcement: if enabled, code must be valid
              if (user.twoFactorEnabled) {
                if (!code) {
                  throw new Error('TWO_FA_REQUIRED')
                }
                const record = await prisma.verificationToken.findUnique({
                  where: { token: code },
                })
                if (!record || record.identifier !== `2fa:${user.id}`) {
                  throw new Error('TWO_FA_INVALID')
                }
                if (record.expires < new Date()) {
                  await prisma.verificationToken.delete({ where: { token: code } }).catch(() => {})
                  throw new Error('TWO_FA_EXPIRED')
                }
                // Single-use: consume the code on successful match
                await prisma.verificationToken.delete({ where: { token: code } }).catch(() => {})
              }

              return {
                id: user.id,
                name: user.name ?? email,
                email: user.email,
                role: user.role as AppRole,
                language: user.language,
                isSuperUser: user.isSuperUser ?? false,
                isCaptain: user.isCaptain ?? false,
              }
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            const propagated = ['EMAIL_NOT_VERIFIED', 'TWO_FA_REQUIRED', 'TWO_FA_INVALID', 'TWO_FA_EXPIRED']
            if (propagated.includes(err.message)) throw err
          }
          // fall through on infra errors
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
