import { NextRequest, NextResponse } from 'next/server';
import { getSession, sanitizeArticleContent } from '@/backend/auth/security';
import { extractCleanExcerpt } from '@/lib/utils/cleanHtml';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const rubrikParam = searchParams.get('rubrik');
    const searchParam = searchParams.get('search');
    const includeContent = searchParams.get('includeContent') === 'true';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 200) : 100;
    const offsetParam = searchParams.get('offset');
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10) || 0, 0) : 0;

    // Server-side RBAC: Superadmin can ONLY query PUBLISHED articles
    // Server-side RBAC: Superadmin default query
    const effectiveStatus = (statusParam && statusParam !== 'ALL') ? statusParam : undefined;

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        let sql = `SELECT * FROM articles WHERE 1=1`;
        const params: any[] = [];
        let pIdx = 1;

        if (effectiveStatus) {
          sql += ` AND status = $${pIdx++}`;
          params.push(effectiveStatus);
        }
        if (rubrikParam && rubrikParam !== 'semua') {
          sql += ` AND rubrik = $${pIdx++}`;
          params.push(rubrikParam);
        }
        if (searchParam) {
          sql += ` AND (LOWER(title) LIKE $${pIdx} OR LOWER(excerpt) LIKE $${pIdx} OR LOWER(content) LIKE $${pIdx} OR LOWER(author_name) LIKE $${pIdx})`;
          params.push(`%${searchParam.toLowerCase()}%`);
          pIdx++;
        }

        sql += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT $${pIdx++} OFFSET $${pIdx++};`;
        params.push(limit, offset);

        const res = await query(sql, params);
        if (res && res.rows) {
          const mapped = res.rows.map((r: any) => ({
            id: r.id,
            slug: r.slug,
            title: r.title,
            excerpt: r.excerpt,
            ...(includeContent ? { content: r.content } : {}),
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
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));

          const headers: Record<string, string> = {};
          if (effectiveStatus === 'PUBLISHED' && !searchParam) {
            // Edge CDN caching: 30s fresh, 120s stale-while-revalidate
            headers['Cache-Control'] = 'public, s-maxage=30, stale-while-revalidate=120';
          }

          return NextResponse.json(mapped, { headers });
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

    const pagedList = list.slice(offset, offset + limit);
    const mappedList = includeContent
      ? pagedList
      : pagedList.map(({ content, ...rest }: any) => rest);

    const headers: Record<string, string> = {};
    if (effectiveStatus === 'PUBLISHED' && !searchParam) {
      headers['Cache-Control'] = 'public, s-maxage=30, stale-while-revalidate=120';
    }

    return NextResponse.json(mappedList, { headers });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Gagal mengambil data artikel.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === 'guest') {
      return NextResponse.json({ error: 'Akses ditolak. Anda harus masuk dengan akun redaksi untuk mengirim artikel.' }, { status: 401 });
    }

    const body = await req.json();
    const { title, slug, rubrik, subRubrik, excerpt, content, coverImage, coverCaption, authorName, status, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Judul dan konten artikel wajib diisi.' }, { status: 400 });
    }

    // Superadmin, Pemred, and Redaktur can directly set status to PUBLISHED
    let targetStatus = status || 'DRAFT';
    if (targetStatus === 'PUBLISHED' && session.role !== 'superadmin' && session.role !== 'pemred' && session.role !== 'redaktur') {
      targetStatus = 'PENDING_REVIEW';
    }

    // Anti-XSS Content Sanitization & Clean Sentence Excerpt
    const sanitizedContent = sanitizeArticleContent(content);
    const cleanExcerpt = extractCleanExcerpt(excerpt, content, 180);
    const sanitizedExcerpt = sanitizeArticleContent(cleanExcerpt);

    const articleData = {
      title: title.trim(),
      slug: slug ? slug.trim() : undefined,
      rubrik: rubrik || 'kabar-kampus',
      subRubrik: subRubrik ? subRubrik.trim() : undefined,
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
      coverImage: coverImage || '',
      coverCaption: coverCaption ? coverCaption.trim() : '',
      authorId: session.id,
      authorName: authorName ? authorName.trim() : session.name,
      authorRole: session.role,
      status: targetStatus,
      tags: tags || [],
    };

    // 1. Try PostgreSQL
    try {
      if (process.env.DATABASE_URL) {
        await query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sub_rubrik TEXT;`).catch(() => {});
        const id = body.id || `art-${Date.now()}`;
        const autoSlug = articleData.slug || articleData.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const publishedAt = articleData.status === 'PUBLISHED' ? new Date().toISOString() : null;

        const res = await query(
          `INSERT INTO articles (id, slug, title, excerpt, content, cover_image, cover_caption, rubrik, sub_rubrik, author_id, author_name, author_role, status, tags, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title,
               slug = EXCLUDED.slug,
               excerpt = EXCLUDED.excerpt,
               content = EXCLUDED.content,
               cover_image = EXCLUDED.cover_image,
               cover_caption = EXCLUDED.cover_caption,
               rubrik = EXCLUDED.rubrik,
               sub_rubrik = EXCLUDED.sub_rubrik,
               status = EXCLUDED.status,
               tags = EXCLUDED.tags,
               published_at = EXCLUDED.published_at,
               updated_at = CURRENT_TIMESTAMP
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
            articleData.subRubrik || null,
            articleData.authorId || null,
            articleData.authorName,
            articleData.authorRole,
            articleData.status,
            articleData.tags,
            publishedAt,
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
            subRubrik: r.sub_rubrik || articleData.subRubrik,
            authorId: r.author_id,
            authorName: r.author_name,
            authorRole: r.author_role,
            status: r.status,
            tags: Array.isArray(r.tags) ? r.tags : [],
            publishedAt: r.published_at,
            views: r.views || 0,
            readTime: r.read_time || 3,
            reviewNotes: r.review_notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
          db.saveArticle(mapped);
          return NextResponse.json(mapped, { status: 201 });
        }
      }
    } catch (pgError) {
      console.warn('PostgreSQL insert error, fallback to repository:', pgError);
    }

    // 2. Fallback to repository
    const saved = db.saveArticle(articleData);
    return NextResponse.json(saved, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Gagal membuat artikel.' }, { status: 500 });
  }
}
