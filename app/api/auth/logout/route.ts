import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/backend/auth/security';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true, message: 'Logout berhasil.' });
}
