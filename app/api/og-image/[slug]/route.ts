import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';

export const dynamic = 'force-dynamic';

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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'https://reaksi-saintek.vercel.app';

  const defaultLogoRedirect = () => {
    return NextResponse.redirect(new URL('/images/reaksi.png', siteUrl));
  };

  if (!rawImage) {
    return defaultLogoRedirect();
  }

  try {
    let inputBuffer: Buffer | null = null;

    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      const resp = await fetch(rawImage);
      if (!resp.ok) return defaultLogoRedirect();
      inputBuffer = Buffer.from(await resp.arrayBuffer());
    } else if (rawImage.startsWith('data:image/')) {
      const commaIdx = rawImage.indexOf(',');
      if (commaIdx !== -1) {
        const base64Data = rawImage.slice(commaIdx + 1).replace(/\s+/g, '');
        inputBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return defaultLogoRedirect();
    }

    // Try converting using sharp to standard 1200x630 JPEG (WhatsApp requirement)
    try {
      // Dynamic import sharp to allow graceful fallback if sharp isn't loaded
      const sharpModule = await import('sharp');
      const sharp = sharpModule.default || sharpModule;

      const outputJpeg = await sharp(inputBuffer)
        .resize(1200, 630, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 82,
          mozjpeg: true,
        })
        .toBuffer();

      return new Response(new Uint8Array(outputJpeg), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': outputJpeg.length.toString(),
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
        },
      });
    } catch (sharpErr) {
      console.warn('Sharp processing failed, serving buffer directly:', sharpErr);

      // If buffer is already under 300KB, serve directly
      if (inputBuffer.length <= 300000) {
        return new Response(new Uint8Array(inputBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': inputBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          },
        });
      }

      return defaultLogoRedirect();
    }
  } catch (e) {
    console.error('OG image handler error:', e);
    return defaultLogoRedirect();
  }
}
