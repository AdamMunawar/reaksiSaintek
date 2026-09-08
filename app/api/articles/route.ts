import { NextRequest, NextResponse } from 'next/server';
import { getSession, sanitizeArticleContent } from '@/backend/auth/security';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const rubrikParam = searchParams.get('rubrik');
    const searchParam = searchParams.get('search');

    // Server-side RBAC: Superadmin can ONLY query PUBLISHED articles
    const isSuperadmin = session?.role === 'superadmin';
    const effectiveStatus = isSuperadmin ? 'PUBLISHED' : statusParam;

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        let sql = 'SELECT * FROM articles WHERE 1=1';
        const params: any[] = [];
        let pIdx = 1;

        if (effectiveStatus && effectiveStatus !== 'ALL') {
          sql += ` AND status = $${pIdx++}`;
          params.push(effectiveStatus);
        }
        if (rubrikParam && rubrikParam !== 'semua') {
          sql += ` AND rubrik = $${pIdx++}`;
          params.push(rubrikParam);
        }
        if (searchParam) {
          sql += ` AND (LOWER(title) LIKE $${pIdx} OR LOWER(excerpt) LIKE $${pIdx} OR LOWER(author_name) LIKE $${pIdx})`;
          params.push(`%${searchParam.toLowerCase()}%`);
          pIdx++;
        }

        sql += ' ORDER BY COALESCE(published_at, created_at) DESC;';

        const res = await query(sql, params);
        if (res) {
          return NextResponse.json(res.rows);
        }
      }
    } catch (dbErr) {
      console.warn('PostgreSQL query error, using repository store:', dbErr);
    }

    // 2. Fallback to repository
    const list = db.getArticles({
      status: (effectiveStatus as any) || undefined,
      rubrik: rubrikParam || undefined,
      search: searchParam || undefined,
    });

    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Gagal mengambil data artikel.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    // Server-side RBAC: Superadmin CANNOT write articles
    if (session?.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Akses Ditolak: Superadmin hanya dapat melihat naskah terbit dan tidak memiliki izin membuat artikel.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, slug, rubrik, excerpt, content, coverImage, coverCaption, authorName, status, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten artikel wajib diisi.' }, { status: 400 });
    }

    // Anti-XSS Content Sanitization
    const sanitizedContent = sanitizeArticleContent(content);
    const sanitizedExcerpt = sanitizeArticleContent(excerpt || content.slice(0, 160) + '...');

    const articleData = {
      title: title.trim(),
      slug: slug ? slug.trim() : undefined,
      rubrik: rubrik || 'kabar-kampus',
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
      coverImage: coverImage || '',
      coverCaption: coverCaption ? coverCaption.trim() : '',
      authorId: session?.id,
      authorName: authorName || session?.name || 'Redaksi LPM Reaksi',
      authorRole: session?.role || 'pengurus',
      status: status || 'DRAFT',
      tags: tags || [],
    };

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        const id = `art-${Date.now()}`;
        const autoSlug = articleData.slug || articleData.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const publishedAt = articleData.status === 'PUBLISHED' ? new Date().toISOString() : null;

        const res = await query(
          `INSERT INTO articles (id, slug, title, excerpt, content, cover_image, cover_caption, rubrik, author_id, author_name, author_role, status, tags, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           RETURNING *;`,
          [
            id,
            autoSlug,
            articleData.title,
            articleData.excerpt,
            articleData.content,
            articleData.coverImage,
            articleData.coverCaption,
            articleData.rubrik,
            articleData.authorId || null,
            articleData.authorName,
            articleData.authorRole,
            articleData.status,
            articleData.tags,
            publishedAt,
          ]
        );

        if (res && res.rows.length > 0) {
          return NextResponse.json(res.rows[0], { status: 201 });
        }
      }
    } catch (dbErr) {
      console.warn('PostgreSQL insert error, fallback to repository:', dbErr);
    }

    // 2. Fallback to repository
    const saved = db.saveArticle(articleData);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Gagal membuat artikel.' }, { status: 500 });
  }
}
