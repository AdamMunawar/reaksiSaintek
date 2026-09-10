import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiErrorResponse } from '@/lib/utils/apiResponse';

export const AUTH_COOKIE_NAME = 'reaksi_session';

function inspectSession(cookieValue?: string): { valid: boolean; payload?: any } {
  if (!cookieValue) return { valid: false };
  const parts = cookieValue.split('.');
  if (parts.length !== 3) return { valid: false };

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // Verify expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    // Verify user ID and role
    if (!payload.id || !payload.role) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const isCmsSubdomain = host.startsWith('cms.') || host.startsWith('redaksi.');
  const isRawIp = /^\d+\.\d+\.\d+\.\d+/.test(host);

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { valid: isAuthenticated, payload } = inspectSession(sessionCookie);

  // ── 1. PROTECT SENSITIVE ADMINISTRATIVE API ROUTES ──
  if (pathname.startsWith('/api/users') || pathname.startsWith('/api/upload')) {
    if (!sessionCookie) {
      return apiErrorResponse(request, 'Akses ditolak. Sesi login diperlukan untuk mengakses endpoint ini.', 401, 'Akses Ditolak');
    }
    if (!isAuthenticated) {
      return apiErrorResponse(request, 'Sesi login tidak valid atau telah kedaluwarsa.', 401, 'Sesi Tidak Valid');
    }
    return NextResponse.next();
  }

  // Let other APIs proceed normally
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // ── 2. SUBDOMAIN CMS (cms.lpmreaksi.com / cms.localhost:3000) ──
  if (isCmsSubdomain) {
    // Root URL on CMS subdomain -> automatically route to /admin or /login
    if (pathname === '/') {
      if (isAuthenticated) {
        const dest = payload?.role === 'kontributor' ? '/kontributor' : '/admin';
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is on /login but already authenticated -> redirect to /admin
    if (pathname === '/login') {
      if (isAuthenticated) {
        const dest = payload?.role === 'kontributor' ? '/kontributor' : '/admin';
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.next();
    }

    // Protect /admin routes on CMS subdomain
    if (pathname.startsWith('/admin')) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const res = NextResponse.redirect(loginUrl);
        if (sessionCookie) res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
      }

      // Role-specific gate: only superadmin can access /admin/pengguna
      if (pathname.startsWith('/admin/pengguna') && payload.role !== 'superadmin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      return NextResponse.next();
    }

    // Protect /kontributor routes on CMS subdomain
    if (pathname.startsWith('/kontributor')) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const res = NextResponse.redirect(loginUrl);
        if (sessionCookie) res.cookies.delete(AUTH_COOKIE_NAME);
        return res;
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // ── 3. MAIN DOMAIN (lpmreaksi.com / localhost:3000) ──
  // If user accesses /admin or /login from the main domain, redirect to CMS subdomain
  if ((pathname.startsWith('/admin') || pathname === '/login') && !isRawIp) {
    const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
    const targetUrl = new URL(pathname + search, `${proto}://cms.${host}`);
    return NextResponse.redirect(targetUrl);
  }

  // Fallback check for raw IP testing (e.g. 127.0.0.1 or LAN IP)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const res = NextResponse.redirect(loginUrl);
      if (sessionCookie) res.cookies.delete(AUTH_COOKIE_NAME);
      return res;
    }

    if (pathname.startsWith('/admin/pengguna') && payload.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon.ico|images|apple-icon.png|icon.png|robots.txt|sitemap.xml).*)',
  ],
};
