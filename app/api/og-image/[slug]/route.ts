import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let rawImage: string | null = null;

  // 1. Fetch from PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        'SELECT cover_image FROM articles WHERE slug = $1 OR id = $1 OR slug = $2 LIMIT 1;',
        [slug, decodedSlug]
      );
      if (res && res.rows.length > 0 && res.rows[0].cover_image) {
        rawImage = res.rows[0].cover_image;
      }
    }
  } catch (err) {
    console.warn('OG Image fetch from postgres failed:', err);
  }

  // 2. Fallback to repository
  if (!rawImage) {
    const art = db.getArticleBySlug(decodedSlug) || db.getArticleBySlug(slug) || db.getArticleById(slug);
    if (art && art.coverImage) {
      rawImage = art.coverImage;
    }
  }

  // If no article image found, redirect to default site logo
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://reaksi-saintek.vercel.app';

  if (!rawImage) {
    return NextResponse.redirect(new URL('/images/reaksi logos.png', siteUrl));
  }

  // 3. If it is an external URL, redirect directly
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
    return NextResponse.redirect(rawImage);
  }

  // 4. If it is a Base64 Data URL (data:image/...;base64,...)
  if (rawImage.startsWith('data:image/')) {
    const matches = rawImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const contentType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');

      return new Response(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': imageBuffer.length.toString(),
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
        },
      });
    }
  }

  // Fallback to logo
  return NextResponse.redirect(new URL('/images/reaksi logos.png', siteUrl));
}
