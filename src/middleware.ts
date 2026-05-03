import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/onboarding', '/pricing', '/careers', '/beta', '/partner', '/partner/login'];

// ── In-memory rate limiting (per-instance, resets on deploy) ──────────
// For production at scale, replace with Redis/Upstash. For pilot this is sufficient.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth/callback/credentials': { max: 10, windowMs: 60_000 },    // login: 10/min
  '/api/register':                  { max: 5,  windowMs: 60_000 },    // register: 5/min
  '/api/leads/public':              { max: 10, windowMs: 60_000 },    // contact form: 10/min
  '/api/feedback':                  { max: 20, windowMs: 60_000 },    // feedback: 20/min
  '/api/guest-stay':                { max: 30, windowMs: 60_000 },    // guest chat: 30/min
  '/api/auth/resend-verification':  { max: 3,  windowMs: 60_000 },    // resend: 3/min
  '/api/auth/forgot-password':      { max: 3,  windowMs: 60_000 },    // forgot pw: 3/min
  '/api/auth/check-email-status':   { max: 5,  windowMs: 60_000 },    // email check: 5/min
  '/api/partner/auth':              { max: 5,  windowMs: 60_000 },    // partner login: 5/min
}

function checkRateLimit(ip: string, path: string): boolean {
  const config = Object.entries(RATE_LIMITS).find(([prefix]) => path.startsWith(prefix))
  if (!config) return true // no limit configured

  const [, { max, windowMs }] = config
  const key = `${ip}:${config[0]}`
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  if (entry.count > max) return false
  return true
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  })
}, 5 * 60_000)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limiting on sensitive endpoints ──
  if (pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      )
    }
  }

  // Clear referral cookie on signout to prevent cross-user attribution
  if (pathname === '/api/auth/signout') {
    const response = NextResponse.next()
    response.cookies.set('hm_ref', '', { maxAge: 0, path: '/' })
    response.cookies.set('hm_view_as', '', { maxAge: 0, path: '/' })
    return response
  }

  // Allow public paths, API routes, static assets, and partner portal (separate auth)
  if (
    publicPaths.some(p => pathname === p || pathname === p + '/') ||
    pathname.startsWith('/partner') ||
    pathname.startsWith('/stay/') ||         // Guest stay chat — token-based auth
    pathname.startsWith('/feedback/') ||     // Guest feedback web form — token-based auth
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth JWT session token
  const token =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
