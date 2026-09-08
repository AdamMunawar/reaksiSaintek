import { NextRequest, NextResponse } from 'next/server';
import { getSession, sanitizeArticleContent } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (process.env.DATABASE_URL) {
      const res = await query('SELECT * FROM articles WHERE id = $1 OR slug = $1 LIMIT 1;', [id]);
      if (res && res.rows.length > 0) {
        return NextResponse.json(res.rows[0]);
      }
    }
  } catch (err) {
    console.warn('PostgreSQL fetch single error:', err);
  }

  const art = db.getArticleById(id) || db.getArticleBySlug(id);
  if (!art) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
  }
  return NextResponse.json(art);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  // Server-side RBAC: Superadmin is strictly forbidden from editing
  if (session?.role === 'superadmin') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Superadmin tidak memiliki wewenang untuk mengubah naskah artikel.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { title, slug, rubrik, excerpt, content, coverImage, coverCaption, authorName, status, tags, reviewNotes } = body;

    const sanitizedContent = content ? sanitizeArticleContent(content) : undefined;
    const sanitizedExcerpt = excerpt ? sanitizeArticleContent(excerpt) : undefined;

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        const res = await query(
          `UPDATE articles
           SET title = COALESCE($1, title),
               slug = COALESCE($2, slug),
               rubrik = COALESCE($3, rubrik),
               excerpt = COALESCE($4, excerpt),
               content = COALESCE($5, content),
               cover_image = COALESCE($6, cover_image),
               cover_caption = COALESCE($7, cover_caption),
               author_name = COALESCE($8, author_name),
               status = COALESCE($9, status),
               tags = COALESCE($10, tags),
               review_notes = COALESCE($11, review_notes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $12
           RETURNING *;`,
          [
            title,
            slug,
            rubrik,
            sanitizedExcerpt,
            sanitizedContent,
            coverImage,
            coverCaption,
            authorName,
            status,
            tags,
            reviewNotes,
            id,
          ]
        );

        if (res && res.rows.length > 0) {
          return NextResponse.json(res.rows[0]);
        }
      }
    } catch (dbErr) {
      console.warn('PostgreSQL update error:', dbErr);
    }

    // 2. Fallback to repository
    const updated = db.saveArticle({
      id,
      title,
      slug,
      rubrik,
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
      coverImage,
      coverCaption,
      authorName,
      status,
      tags,
      reviewNotes,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'Gagal memperbarui artikel.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  // Server-side RBAC: Only Pemred and Redaktur can delete articles. Superadmin is strictly forbidden.
  if (session?.role !== 'pemred' && session?.role !== 'redaktur') {
    return NextResponse.json(
      { error: 'Akses Ditolak: Hanya Pemimpin Redaksi dan Redaktur yang memiliki izin menghapus artikel.' },
      { status: 403 }
    );
  }

  try {
    if (process.env.DATABASE_URL) {
      await query('DELETE FROM articles WHERE id = $1;', [id]);
    }
    db.deleteArticle(id);
    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus secara permanen.' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Gagal menghapus artikel.' }, { status: 500 });
  }
}
