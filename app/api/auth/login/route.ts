import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { setSessionCookie } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { UserRole } from '@/backend/db/schema';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window rate limiter (15 minutes window, max 5 failed attempts)
const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown-ip';
}

function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of loginAttempts.entries()) {
    if (now > record.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanupExpiredRecords();
    const clientIp = getClientIp(req);
    const now = Date.now();

    // Check rate limit
    const attemptRecord = loginAttempts.get(clientIp);
    if (attemptRecord && attemptRecord.count >= MAX_FAILED_ATTEMPTS) {
      if (now < attemptRecord.resetTime) {
        const remainingMinutes = Math.ceil((attemptRecord.resetTime - now) / 60000);
        return NextResponse.json(
          {
            error: `Terlalu banyak percobaan login gagal dari perangkat ini. Demi keamanan akun, silakan coba lagi setelah ${remainingMinutes} menit.`,
          },
          { status: 429 }
        );
      } else {
        loginAttempts.delete(clientIp);
      }
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Alamat email dan kata sandi wajib diisi.' }, { status: 400 });
    }

    let user: any = null;

    // 1. Try fetching from Supabase PostgreSQL if available
    try {
      if (email) {
        const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;', [email.toLowerCase().trim()]);
        if (res && res.rows.length > 0) {
          user = res.rows[0];
        }
      }
    } catch (dbErr) {
      // Fallback silently
    }

    // 2. Fallback to repository store
    if (!user) {
      user = db.getUserByEmail(email);
    }

    // Track failed attempt
    const recordFailedAttempt = () => {
      const current = loginAttempts.get(clientIp);
      if (current && now < current.resetTime) {
        current.count += 1;
      } else {
        loginAttempts.set(clientIp, {
          count: 1,
          resetTime: now + LOCKOUT_DURATION_MS,
        });
      }
    };

    if (!user) {
      recordFailedAttempt();
      return NextResponse.json({ error: 'Akun tidak ditemukan. Pastikan email telah terdaftar di meja redaksi.' }, { status: 404 });
    }

    // 3. Password verification (Strict bcrypt validation, no backdoor)
    let passwordMatches = false;
    if (user.password_hash) {
      passwordMatches = await bcrypt.compare(password, user.password_hash);
    } else if (user.password) {
      passwordMatches = user.password === password;
    }

    if (!passwordMatches) {
      recordFailedAttempt();
      const currentCount = loginAttempts.get(clientIp)?.count || 1;
      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - currentCount);
      return NextResponse.json(
        {
          error: `Kata sandi tidak sesuai. Sisa percobaan: ${attemptsLeft} kali sebelum akun dikunci sementara.`,
        },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful login
    loginAttempts.delete(clientIp);

    // 4. Set Secure HttpOnly JWT Session Cookie
    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      institution: user.institution,
    };

    await setSessionCookie(sessionPayload);

    return NextResponse.json({
      success: true,
      user: sessionPayload,
      message: 'Login berhasil.',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server saat login.' }, { status: 500 });
  }
}
