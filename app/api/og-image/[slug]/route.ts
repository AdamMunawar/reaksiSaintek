import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { getBaseUrl } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const trimmedSlug = decodedSlug.replace(/-+$/, '');
  const slugWithHyphen = `${trimmedSlug}-`;

  let rawImage: string | null = null;

  // 1. Fetch from PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      const res = await query(
        `SELECT cover_image FROM articles 
         WHERE slug = $1 OR slug = $2 OR slug = $3 OR slug = $4 OR id = $1 
         LIMIT 1;`,
        [slug, decodedSlug, trimmedSlug, slugWithHyphen]
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
    const art =
      db.getArticleBySlug(decodedSlug) ||
      db.getArticleBySlug(trimmedSlug) ||
      db.getArticleBySlug(slugWithHyphen) ||
      db.getArticleBySlug(slug) ||
      db.getArticleById(slug);
    if (art && art.coverImage) {
      rawImage = art.coverImage;
    }
  }

  const siteUrl = getBaseUrl();

  const defaultLogoResponse = () => {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'reaksi.png');
      if (fs.existsSync(logoPath)) {
        const buf = fs.readFileSync(logoPath);
        return new Response(new Uint8Array(buf), {
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': buf.length.toString(),
            'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          },
        });
      }
    } catch {
      // Fall through to redirect
    }
    return NextResponse.redirect(new URL('/images/reaksi.png', siteUrl));
  };

  if (!rawImage) {
    return defaultLogoResponse();
  }

  try {
    let inputBuffer: Buffer | null = null;
    let detectedMime = 'image/jpeg';

    if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
      const resp = await fetch(rawImage);
      if (!resp.ok) return defaultLogoResponse();
      inputBuffer = Buffer.from(await resp.arrayBuffer());
    } else if (rawImage.startsWith('data:image/')) {
      const mimeMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
      if (mimeMatch) {
        detectedMime = mimeMatch[1];
      }
      const commaIdx = rawImage.indexOf(',');
      if (commaIdx !== -1) {
        const base64Data = rawImage.slice(commaIdx + 1).replace(/\s+/g, '');
        inputBuffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!inputBuffer || inputBuffer.length === 0) {
      return defaultLogoResponse();
    }

    // Convert using sharp to standard 1200x630 JPEG (WhatsApp crawler standard)
    try {
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

      // Serve buffer directly if under 4MB
      if (inputBuffer.length <= 4000000) {
        return new Response(new Uint8Array(inputBuffer), {
          headers: {
            'Content-Type': detectedMime,
            'Content-Length': inputBuffer.length.toString(),
            'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable',
          },
        });
      }

      return defaultLogoResponse();
    }
  } catch (e) {
    console.error('OG image handler error:', e);
    return defaultLogoResponse();
  }
}
