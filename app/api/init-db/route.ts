import { NextRequest, NextResponse } from 'next/server';
import { initPostgresDatabase } from '@/backend/db/init-db';
import { getSession } from '@/backend/auth/security';

async function handleInit(req: NextRequest) {
  try {
    const session = await getSession();
    const isSuperadmin = session?.role === 'superadmin';

    const secretHeader = req.headers.get('x-init-secret');
    const hasValidSecret = Boolean(process.env.ADMIN_INIT_SECRET && secretHeader === process.env.ADMIN_INIT_SECRET);

    if (!isSuperadmin && !hasValidSecret) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Superadmin atau request dengan token x-init-secret valid yang diizinkan menginisialisasi database.' },
        { status: 403 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not configured in .env.local' },
        { status: 400 }
      );
    }

    await initPostgresDatabase();
    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database initialized and seeded successfully.',
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        error: 'Gagal menginisialisasi database.',
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleInit(req);
}

export async function POST(req: NextRequest) {
  return handleInit(req);
}
