import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

// PATCH /api/articles/:id/views — increment article view count safely
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // 1. Try PostgreSQL increment
    if (process.env.DATABASE_URL) {
      const res = await query(
        `UPDATE articles SET views = COALESCE(views, 0) + 1
         WHERE id = $1 OR slug = $1
         RETURNING views;`,
        [id]
      );
      if (res && res.rows.length > 0) {
        return NextResponse.json({ views: res.rows[0].views });
      }
    }
  } catch (err) {
    console.warn('PostgreSQL views increment error:', err);
  }

  // 2. Fallback to repository
  try {
    if (typeof db.incrementViews === 'function') {
      db.incrementViews(id);
    }
  } catch (_) {}

  return NextResponse.json({ views: null });
}
