import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { EPaperItem } from '@/backend/db/schema';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        let sql = `SELECT * FROM epapers`;
        const params: any[] = [];
        if (category && category !== 'ALL') {
          sql += ` WHERE category = $1`;
          params.push(category);
        }
        sql += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT $${params.length + 1};`;
        params.push(limit);

        const res = await query(sql, params);
        if (res && res.rows) {
          const mapped: EPaperItem[] = res.rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            edition: r.edition,
            category: r.category || 'BULETIN',
            coverImage: r.cover_image,
            pdfUrl: r.pdf_url,
            description: r.description || '',
            pageCount: r.page_count || 1,
            fileSize: r.file_size || '',
            publishedAt: r.published_at ? new Date(r.published_at).toISOString().split('T')[0] : '',
            downloads: r.downloads || 0,
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
          }));

          return NextResponse.json(mapped);
        }
      }
    } catch (pgErr) {
      console.warn('[API epapers] PostgreSQL query fallback:', pgErr);
    }

    // 2. Fallback to Local Repository
    const local = db.getEPapers(category ? { category } : undefined);
    return NextResponse.json(local.slice(0, limit));
  } catch (err: any) {
    console.error('Error fetching epapers:', err);
    return NextResponse.json({ error: 'Gagal memuat data e-paper.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['superadmin', 'pemred', 'redaktur'].includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Redaksi yang berwenang mengelola E-Paper.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, edition, category, coverImage, pdfUrl, description, pageCount, fileSize, publishedAt } = body;

    if (!title || !edition || !coverImage || !pdfUrl) {
      return NextResponse.json({ error: 'Judul, nomor edisi, cover thumbnail, dan berkas PDF wajib diisi.' }, { status: 400 });
    }

    const epaperId = id || `epaper-${Date.now()}`;
    const pubDate = publishedAt || new Date().toISOString().split('T')[0];
    const cat = category || 'BULETIN';

    let savedItem: EPaperItem = {
      id: epaperId,
      title: title.trim(),
      edition: edition.trim(),
      category: cat,
      coverImage: coverImage.trim(),
      pdfUrl: pdfUrl.trim(),
      description: description ? description.trim() : '',
      pageCount: parseInt(pageCount, 10) || 1,
      fileSize: fileSize || '',
      publishedAt: pubDate,
      downloads: body.downloads || 0,
    };

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        const res = await query(
          `INSERT INTO epapers (id, title, edition, category, cover_image, pdf_url, description, page_count, file_size, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title,
               edition = EXCLUDED.edition,
               category = EXCLUDED.category,
               cover_image = EXCLUDED.cover_image,
               pdf_url = EXCLUDED.pdf_url,
               description = EXCLUDED.description,
               page_count = EXCLUDED.page_count,
               file_size = EXCLUDED.file_size,
               published_at = EXCLUDED.published_at
           RETURNING *;`,
          [
            savedItem.id,
            savedItem.title,
            savedItem.edition,
            savedItem.category,
            savedItem.coverImage,
            savedItem.pdfUrl,
            savedItem.description,
            savedItem.pageCount,
            savedItem.fileSize,
            savedItem.publishedAt,
          ]
        );

        if (res && res.rows && res.rows[0]) {
          const r = res.rows[0];
          savedItem = {
            id: r.id,
            title: r.title,
            edition: r.edition,
            category: r.category,
            coverImage: r.cover_image,
            pdfUrl: r.pdf_url,
            description: r.description,
            pageCount: r.page_count,
            fileSize: r.file_size,
            publishedAt: r.published_at ? new Date(r.published_at).toISOString().split('T')[0] : pubDate,
            downloads: r.downloads,
            createdAt: r.created_at,
          };
        }
      }
    } catch (pgErr) {
      console.warn('[API epapers] PostgreSQL save fallback:', pgErr);
    }

    // 2. Also sync to local DB repository
    db.saveEPaper(savedItem);

    return NextResponse.json({ success: true, item: savedItem });
  } catch (err: any) {
    console.error('Error saving epaper:', err);
    return NextResponse.json({ error: 'Gagal menyimpan e-paper.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['superadmin', 'pemred', 'redaktur'].includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Parameter id e-paper diperlukan.' }, { status: 400 });
    }

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        await query(`DELETE FROM epapers WHERE id = $1;`, [id]);
      }
    } catch (pgErr) {
      console.warn('[API epapers] PostgreSQL delete fallback:', pgErr);
    }

    // 2. Local DB
    db.deleteEPaper(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting epaper:', err);
    return NextResponse.json({ error: 'Gagal menghapus e-paper.' }, { status: 500 });
  }
}
