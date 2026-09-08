import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'reaksi_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes at the server level
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    // 1. Missing cookie -> redirect to login immediately
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Validate token structure (JWT 3 segments)
    const parts = sessionCookie.split('.');
    if (parts.length !== 3) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    // 3. Inspect JWT payload for expiration & role integrity
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      // Verify expiration timestamp
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
      }

      // Verify user ID presence
      if (!payload.id || !payload.role) {
        const loginUrl = new URL('/login', request.url);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
      }

      // Role-specific server gate: only superadmin can access /admin/pengguna
      if (pathname.startsWith('/admin/pengguna') && payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch (err) {
      const loginUrl = new URL('/login', request.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
