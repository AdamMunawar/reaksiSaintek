import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const res = await query('SELECT * FROM rubriks ORDER BY sort_order ASC, created_at ASC;');
      if (res && res.rows) {
        const mapped = res.rows.map((r: any) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          description: r.description || '',
          color: r.color || '#2563EB',
          emoji: r.emoji || '',
          order: r.sort_order ?? 1,
          subRubriks: Array.isArray(r.sub_rubriks) ? r.sub_rubriks : [],
        }));
        return NextResponse.json(mapped);
      }
    }
  } catch (err) {
    console.warn('PostgreSQL rubriks query error:', err);
  }

  return NextResponse.json(db.getRubriks());
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  // Server-side RBAC: Only Pemred, Redaktur, and Superadmin can manage rubriks
  if (!session || (session.role !== 'pemred' && session.role !== 'redaktur' && session.role !== 'superadmin')) {
    return NextResponse.json({ error: 'Akses Ditolak: Anda tidak memiliki wewenang kelola rubrik.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, slug, description, color, subRubriks } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nama dan slug rubrik wajib diisi.' }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      try {
        await query(`ALTER TABLE rubriks ADD COLUMN IF NOT EXISTS sub_rubriks JSONB DEFAULT '[]'::jsonb;`);
      } catch (_) {}

      const rubrikId = id || `rubrik-${Date.now()}`;
      const subJson = JSON.stringify(Array.isArray(subRubriks) ? subRubriks : []);
      const res = await query(
        `INSERT INTO rubriks (id, slug, name, description, color, sub_rubriks)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, color = EXCLUDED.color, sub_rubriks = EXCLUDED.sub_rubriks
         RETURNING *;`,
        [rubrikId, slug.toLowerCase().trim(), name.trim(), description || '', color || '#2563EB', subJson]
      );
      if (res && res.rows.length > 0) {
        const r = res.rows[0];
        return NextResponse.json({
          ...r,
          subRubriks: Array.isArray(r.sub_rubriks) ? r.sub_rubriks : [],
        });
      }
    }

    const saved = db.saveRubrik({ id, name, slug, description, color, emoji: '', subRubriks });
    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error saving rubrik:', error);
    return NextResponse.json({ error: 'Gagal menyimpan rubrik.' }, { status: 500 });
  }
}
