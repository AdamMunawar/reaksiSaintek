import jwt from 'jsonwebtoken';
import sanitizeHtml from 'sanitize-html';
import { cookies } from 'next/headers';
import { UserRole } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'lpm-reaksi-super-secret-jwt-key-2026-production';
export const AUTH_COOKIE_NAME = 'reaksi_session';

export interface AuthSessionPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
}

export function signToken(payload: AuthSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): AuthSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<AuthSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(payload: AuthSessionPayload): Promise<void> {
  const token = signToken(payload);
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction || process.env.NEXTAUTH_URL?.startsWith('https') || false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Sanitize rich text HTML to eliminate XSS vectors
 */
export function sanitizeArticleContent(rawHtml: string): string {
  if (!rawHtml) return '';
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 's', 'blockquote',
      'ul', 'ol', 'li', 'a', 'img', 'iframe', 'figure', 'figcaption', 'span', 'div', 'hr', 'br',
      'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'title', 'class'],
      img: ['src', 'alt', 'width', 'height', 'class', 'loading'],
      iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class'],
      div: ['class', 'style'],
      span: ['class', 'style'],
      p: ['class', 'style'],
      blockquote: ['class'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com', 'player.vimeo.com', 'open.spotify.com'],
  });
}
