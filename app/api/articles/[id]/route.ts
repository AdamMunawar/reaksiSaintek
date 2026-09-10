import { NextRequest, NextResponse } from 'next/server';
import { getSession, sanitizeArticleContent } from '@/backend/auth/security';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { apiErrorResponse } from '@/lib/utils/apiResponse';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (process.env.DATABASE_URL) {
      const res = await query('SELECT * FROM articles WHERE id = $1 OR slug = $1 LIMIT 1;', [id]);
      if (res && res.rows.length > 0) {
        const r = res.rows[0];
        const mapped = {
          id: r.id,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          content: r.content,
          coverImage: r.cover_image,
          cover_image: r.cover_image,
          coverCaption: r.cover_caption,
          cover_caption: r.cover_caption,
          rubrik: r.rubrik,
          subRubrik: r.sub_rubrik || r.subRubrik,
          authorId: r.author_id,
          authorName: r.author_name,
          author_name: r.author_name,
          authorRole: r.author_role,
          status: r.status,
          tags: Array.isArray(r.tags) ? r.tags : [],
          publishedAt: r.published_at || r.created_at,
          published_at: r.published_at || r.created_at,
          views: r.views || 0,
          readTime: r.read_time || 3,
          read_time: r.read_time || 3,
          reviewNotes: r.review_notes,
          reviewComments: r.review_comments || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
        return NextResponse.json(mapped);
      }
    }
  } catch (err) {
    console.warn('PostgreSQL fetch single error:', err);
  }

  const art = db.getArticleById(id) || db.getArticleBySlug(id);
  if (!art) {
    return apiErrorResponse(req, 'Artikel tidak ditemukan dalam database atau arsip redaksi.', 404, 'Artikel Tidak Ditemukan');
  }
  return NextResponse.json(art);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role === 'guest') {
    return apiErrorResponse(req, 'Akses ditolak. Silakan login dengan akun redaksi untuk memperbarui artikel.', 401, 'Akses Ditolak');
  }
  try {
    const body = await req.json();
    const { title, slug, rubrik, subRubrik, excerpt, content, coverImage, coverCaption, authorName, status, tags, reviewNotes } = body;

    // Only Pemred, Redaktur, and Superadmin can publish or update status to PUBLISHED
    let targetStatus = status;
    if (targetStatus === 'PUBLISHED' && session.role !== 'pemred' && session.role !== 'redaktur' && session.role !== 'superadmin') {
      targetStatus = undefined; // Retain current or leave to review
    }

    const sanitizedContent = content ? sanitizeArticleContent(content) : undefined;
    const cleanExcerpt = (excerpt || content) ? extractCleanExcerpt(excerpt, content, 180) : undefined;
    const sanitizedExcerpt = cleanExcerpt ? sanitizeArticleContent(cleanExcerpt) : undefined;

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        await query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sub_rubrik TEXT;`).catch(() => {});
        const publishedAtClause = status === 'PUBLISHED' ? ', published_at = COALESCE(published_at, CURRENT_TIMESTAMP)' : '';
        const res = await query(
          `UPDATE articles
           SET title = COALESCE($1, title),
               slug = COALESCE($2, slug),
               rubrik = COALESCE($3, rubrik),
               sub_rubrik = COALESCE($4, sub_rubrik),
               excerpt = COALESCE($5, excerpt),
               content = COALESCE($6, content),
               cover_image = COALESCE($7, cover_image),
               cover_caption = COALESCE($8, cover_caption),
               author_name = COALESCE($9, author_name),
               status = COALESCE($10, status),
               tags = COALESCE($11, tags),
               review_notes = COALESCE($12, review_notes),
               updated_at = CURRENT_TIMESTAMP
               ${publishedAtClause}
           WHERE id = $13 OR slug = $13
           RETURNING *;`,
          [
            title,
            slug,
            rubrik,
            subRubrik !== undefined ? (subRubrik || null) : null,
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
          const r = res.rows[0];
          const mapped = {
            id: r.id,
            slug: r.slug,
            title: r.title,
            excerpt: r.excerpt,
            content: r.content,
            coverImage: r.cover_image,
            cover_image: r.cover_image,
            coverCaption: r.cover_caption,
            rubrik: r.rubrik,
            subRubrik: r.sub_rubrik || subRubrik,
            authorId: r.author_id,
            authorName: r.author_name,
            authorRole: r.author_role,
            status: r.status,
            tags: Array.isArray(r.tags) ? r.tags : [],
            publishedAt: r.published_at,
            views: r.views || 0,
            readTime: r.read_time || 3,
            reviewNotes: r.review_notes,
            reviewComments: r.review_comments || [],
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
          db.saveArticle(mapped as any);
          return NextResponse.json(mapped);
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
      subRubrik,
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
    return apiErrorResponse(req, 'Gagal memperbarui artikel.', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session || (session.role !== 'pemred' && session.role !== 'redaktur' && session.role !== 'superadmin')) {
    return apiErrorResponse(req, 'Akses ditolak. Hanya Pemred, Redaktur, atau Superadmin yang berhak menghapus artikel.', 403, 'Wewenang Terbatas');
  }

  try {
    if (process.env.DATABASE_URL) {
      await query('DELETE FROM articles WHERE id = $1 OR slug = $1;', [id]);
    }
    db.deleteArticle(id);
    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus secara permanen.' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return apiErrorResponse(req, 'Gagal menghapus artikel.', 500);
  }
}
