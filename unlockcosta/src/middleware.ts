import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/onboarding'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths, API routes, and static assets
  if (
    publicPaths.some(p => pathname === p) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Check for NextAuth JWT session token
  const token =
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'],
};
