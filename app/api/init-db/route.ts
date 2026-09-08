import { NextResponse } from 'next/server';
import { initPostgresDatabase } from '@/backend/db/init-db';

async function handleInit() {
  try {
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

export async function GET() {
  return handleInit();
}

export async function POST() {
  return handleInit();
}
