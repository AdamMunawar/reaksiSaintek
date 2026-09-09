import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/backend/auth/security';

export const runtime = 'nodejs';

// Konfigurasi ukuran maksimal (setelah dikompresi browser, rata-rata hanya 50-150KB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max payload

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role === 'guest') {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Silakan login untuk mengunggah media.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const author = session.name || (formData.get('author') as string) || 'Redaksi';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file melebihi batas maksimal (5MB).' },
        { status: 400 }
      );
    }

    // Validasi tipe file (hanya gambar yang diizinkan)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (file.type && !allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Format file tidak diizinkan. Hanya file gambar (JPG, PNG, WebP, GIF) yang diperbolehkan.' },
        { status: 400 }
      );
    }

    // Ekstrak buffer file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitasi nama file & buat timestamp unik
    const rawName = file.name || 'image.webp';
    const ext = path.extname(rawName) || '.webp';
    const safeBaseName = path
      .basename(rawName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 40);

    const uniqueFilename = `reaksi_${Date.now()}_${safeBaseName}${ext}`;

    // Direktori target di public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${uniqueFilename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.type || 'image/webp',
        uploadedBy: author,
      });
    } catch (fsErr) {
      console.warn('Local filesystem write failed, using data URL fallback:', fsErr);
      // Fallback untuk runtime read-only (misal serverless)
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type || 'image/webp'};base64,${base64}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.type || 'image/webp',
        uploadedBy: author,
      });
    }
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses unggahan file. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
