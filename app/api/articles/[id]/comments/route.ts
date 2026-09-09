import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { ReviewComment, ReviewReply } from '@/backend/db/schema';

let hasEnsuredColumn = false;
async function ensureColumn() {
  if (hasEnsuredColumn || !process.env.DATABASE_URL) return;
  try {
    await query("ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_comments JSONB DEFAULT '[]'::jsonb;");
    hasEnsuredColumn = true;
  } catch (e) {
    console.warn('Could not auto-add review_comments column:', e);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureColumn();
    if (process.env.DATABASE_URL) {
      try {
        const res = await query(
          'SELECT * FROM articles WHERE id = $1 OR slug = $1 LIMIT 1;',
          [id]
        );
        if (res && res.rows.length > 0) {
          const comments: ReviewComment[] = res.rows[0].review_comments || [];
          return NextResponse.json({ comments });
        }
      } catch (dbErr) {
        console.warn('DB error fetching review comments, falling back to local store:', dbErr);
      }
    }
    const art = db.getArticleById(id) || db.getArticleBySlug(id);
    return NextResponse.json({ comments: art?.reviewComments || [] });
  } catch (error: any) {
    console.error('Error fetching review comments:', error);
    const art = db.getArticleById(id) || db.getArticleBySlug(id);
    return NextResponse.json({ comments: art?.reviewComments || [] });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role === 'guest') {
    return NextResponse.json(
      { error: 'Akses ditolak. Silakan login untuk memberi catatan review.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { highlightedText, content } = body;

    if (!highlightedText || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Teks yang ditandai dan catatan komentar wajib diisi.' },
        { status: 400 }
      );
    }

    await ensureColumn();
    const newComment: ReviewComment = {
      id: `rc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      articleId: id,
      highlightedText: highlightedText.trim(),
      authorId: session.id,
      authorName: session.name,
      authorRole: session.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    };

    let updatedComments: ReviewComment[] = [];

    if (process.env.DATABASE_URL) {
      try {
        const artRes = await query(
          'SELECT * FROM articles WHERE id = $1 OR slug = $1 LIMIT 1;',
          [id]
        );
        if (artRes && artRes.rows.length > 0) {
          const currentComments: ReviewComment[] = artRes.rows[0].review_comments || [];
          updatedComments = [...currentComments, newComment];
          await query(
            'UPDATE articles SET review_comments = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR slug = $2;',
            [JSON.stringify(updatedComments), id]
          );
        }
      } catch (dbErr) {
        console.warn('DB error adding review comment:', dbErr);
      }
    }

    // Memory fallback update
    const art = db.getArticleById(id) || db.getArticleBySlug(id);
    if (art) {
      const memComments = [...(art.reviewComments || []), newComment];
      db.saveArticle({ ...art, reviewComments: memComments });
      if (updatedComments.length === 0) updatedComments = memComments;
    }

    return NextResponse.json({ success: true, comment: newComment, comments: updatedComments });
  } catch (error: any) {
    console.error('Error adding review comment:', error);
    return NextResponse.json({ error: 'Gagal menambahkan catatan review.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();

  if (!session || session.role === 'guest') {
    return NextResponse.json(
      { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
      { status: 401 }
    );
  }

  try {
    await ensureColumn();
    const body = await req.json();
    const { action, commentId, replyContent, resolved } = body;

    if (!commentId) {
      return NextResponse.json({ error: 'commentId wajib diisi.' }, { status: 400 });
    }

    // Fetch existing comments
    let comments: ReviewComment[] = [];
    if (process.env.DATABASE_URL) {
      try {
        const artRes = await query(
          'SELECT * FROM articles WHERE id = $1 OR slug = $1 LIMIT 1;',
          [id]
        );
        if (artRes && artRes.rows.length > 0) {
          comments = artRes.rows[0].review_comments || [];
        }
      } catch (dbErr) {
        console.warn('DB error reading comments in PATCH:', dbErr);
      }
    }
    if (comments.length === 0) {
      const art = db.getArticleById(id) || db.getArticleBySlug(id);
      comments = art?.reviewComments || [];
    }

    const commentIdx = comments.findIndex((c) => c.id === commentId);
    if (commentIdx === -1) {
      return NextResponse.json({ error: 'Komentar catatan tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'reply') {
      if (!replyContent || !replyContent.trim()) {
        return NextResponse.json({ error: 'Isi balasan tidak boleh kosong.' }, { status: 400 });
      }
      const newReply: ReviewReply = {
        id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        authorId: session.id,
        authorName: session.name,
        authorRole: session.role,
        content: replyContent.trim(),
        createdAt: new Date().toISOString(),
      };

      const target = comments[commentIdx];
      const replies = [...(target.replies || []), newReply];
      comments[commentIdx] = { ...target, replies };
    } else if (action === 'toggle_resolve') {
      const target = comments[commentIdx];
      comments[commentIdx] = { ...target, resolved: resolved !== undefined ? resolved : !target.resolved };
    } else if (action === 'delete') {
      // Allow author of the comment or editors (pemred, redaktur, superadmin) to delete
      const target = comments[commentIdx];
      const canDelete =
        target.authorId === session.id ||
        session.role === 'superadmin' ||
        session.role === 'pemred' ||
        session.role === 'redaktur';

      if (!canDelete) {
        return NextResponse.json({ error: 'Anda tidak memiliki hak untuk menghapus catatan ini.' }, { status: 403 });
      }
      comments = comments.filter((c) => c.id !== commentId);
    } else {
      return NextResponse.json({ error: 'Aksi tidak dikenali.' }, { status: 400 });
    }

    // Save updated comments
    if (process.env.DATABASE_URL) {
      await query(
        'UPDATE articles SET review_comments = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 OR slug = $2;',
        [JSON.stringify(comments), id]
      );
    }

    const art = db.getArticleById(id) || db.getArticleBySlug(id);
    if (art) {
      db.saveArticle({ ...art, reviewComments: comments });
    }

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Error updating review comments:', error);
    return NextResponse.json({ error: 'Gagal memperbarui komentar review.' }, { status: 500 });
  }
}
