import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/backend/db/postgres';
import { db } from '@/backend/db/repository';
import { getSession } from '@/backend/auth/security';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'superadmin' && session.role !== 'pemred' && session.role !== 'redaktur')) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan masuk dengan akun redaksi.' }, { status: 401 });
    }

    // 1. Try PostgreSQL
    try {
      const res = await query('SELECT id, name, email, role, institution, phone, bio, created_at FROM users ORDER BY created_at ASC;');
      if (res && res.rows.length > 0) {
        return NextResponse.json(res.rows);
      }
    } catch (e) {}

    // 2. Fallback to repository (sanitized without any credentials)
    const sanitized = db.getUsers().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      institution: u.institution,
      phone: u.phone,
      bio: u.bio,
      created_at: u.createdAt,
    }));
    return NextResponse.json(sanitized);
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'superadmin' && session.role !== 'pemred')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { id, name, email, role, password, institution, phone, bio } = await req.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Nama, email, dan role wajib diisi.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Format alamat email tidak valid.' }, { status: 400 });
    }

    if (password && password.trim().length < 6) {
      return NextResponse.json({ error: 'Kata sandi baru minimal harus 6 karakter.' }, { status: 400 });
    }

    let passwordHash: string | undefined = undefined;
    if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Save to PostgreSQL if connected
    try {
      if (id) {
        if (passwordHash) {
          await query(
            `UPDATE users SET name = $1, email = $2, role = $3, password_hash = $4, institution = $5, phone = $6, bio = $7 WHERE id = $8;`,
            [name.trim(), email.toLowerCase().trim(), role, passwordHash, institution || null, phone || null, bio || null, id]
          );
        } else {
          await query(
            `UPDATE users SET name = $1, email = $2, role = $3, institution = $4, phone = $5, bio = $6 WHERE id = $7;`,
            [name.trim(), email.toLowerCase().trim(), role, institution || null, phone || null, bio || null, id]
          );
        }
      } else {
        const newId = `user-${Date.now()}`;
        const defaultPwd = process.env.ADMIN_DEFAULT_PASSWORD || 'reaksi2026';
        const hashToUse = passwordHash || (await bcrypt.hash(defaultPwd, 10));
        await query(
          `INSERT INTO users (id, name, email, password_hash, role, institution, phone, bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [newId, name.trim(), email.toLowerCase().trim(), hashToUse, role, institution || null, phone || null, bio || null]
        );
      }
    } catch (dbErr) {
      // Handled silently
    }

    // Save to repository store
    const saved = db.saveUser({
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      password: password || undefined,
      passwordHash,
      institution,
      phone,
      bio,
    });

    // Strip sensitive password and hash fields from response
    const { password: _p, passwordHash: _ph, ...cleanUser } = saved as any;
    return NextResponse.json({ success: true, user: cleanUser });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menyimpan data pengguna.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Hanya Superadmin yang berhak menghapus akun.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID pengguna diperlukan.' }, { status: 400 });
    }

    try {
      await query('DELETE FROM users WHERE id = $1;', [id]);
    } catch (e) {}

    db.deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus pengguna.' }, { status: 500 });
  }
}
