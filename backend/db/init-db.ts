import bcrypt from 'bcryptjs';
import { query } from './postgres';
import { SEED_PAGES, SEED_RUBRIKS, SEED_STAFF, DEFAULT_MEDIA_PARTNER } from './seed';

export async function initPostgresDatabase() {
  console.log('🔄 Initializing PostgreSQL database tables for LPM Reaksi Portal...');

  // 1. Types & Enums
  await query(`
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('superadmin', 'pemred', 'redaktur', 'pengurus', 'kontributor');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
        CREATE TYPE article_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'REVISION');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `);

  // 2. Users Table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        role user_role NOT NULL DEFAULT 'pengurus',
        avatar TEXT,
        institution VARCHAR(255),
        phone VARCHAR(50),
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Rubriks Table
  await query(`
    CREATE TABLE IF NOT EXISTS rubriks (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#2563EB',
        sort_order INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Articles Table
  await query(`
    CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        cover_image TEXT NOT NULL,
        cover_caption TEXT,
        rubrik VARCHAR(100) NOT NULL,
        author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
        author_name VARCHAR(255) NOT NULL,
        author_role user_role NOT NULL DEFAULT 'pengurus',
        author_institution VARCHAR(255),
        author_phone VARCHAR(50),
        author_bio TEXT,
        status article_status NOT NULL DEFAULT 'DRAFT',
        views INTEGER DEFAULT 0,
        read_time INTEGER DEFAULT 3,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        review_notes TEXT,
        review_comments JSONB DEFAULT '[]'::jsonb,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover_caption TEXT;`);
  await query(`ALTER TABLE articles ADD COLUMN IF NOT EXISTS review_comments JSONB DEFAULT '[]'::jsonb;`).catch(() => {});
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_status_pub ON articles(status, published_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_rubrik ON articles(rubrik);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);`);

  // 5. Site Pages Table
  await query(`
    CREATE TABLE IF NOT EXISTS site_pages (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        main_text TEXT NOT NULL,
        extra_content JSONB DEFAULT '{}'::jsonb,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. Staff Members Table
  await query(`
    CREATE TABLE IF NOT EXISTS staff_members (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role_title VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        bidang VARCHAR(100),
        division VARCHAR(100),
        sort_order INTEGER NOT NULL DEFAULT 1,
        avatar TEXT,
        period VARCHAR(50) DEFAULT '2026-2027',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Ensure department and bidang columns exist if table already existed
  await query(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS department VARCHAR(100);`).catch(() => {});
  await query(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS bidang VARCHAR(100);`).catch(() => {});

  // 7. E-Papers (Buletin & Tabloid) Table
  await query(`
    CREATE TABLE IF NOT EXISTS epapers (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        edition VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT 'BULETIN',
        cover_image TEXT NOT NULL,
        pdf_url TEXT NOT NULL,
        description TEXT,
        page_count INTEGER DEFAULT 1,
        file_size VARCHAR(50),
        published_at DATE DEFAULT CURRENT_DATE,
        downloads INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Media Items (Library) Table
  await query(`
    CREATE TABLE IF NOT EXISTS media_items (
        id VARCHAR(64) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        mime_type VARCHAR(100),
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. Media Partner & SOP Config Table
  await query(`
    CREATE TABLE IF NOT EXISTS media_partner_config (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
        config JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Seed Initial Official Superadmin (Cleaned from old mock accounts)
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'reaksi2026';
  const defaultPasswordHash = await bcrypt.hash(defaultPassword, 10);

  // Clean old mock user accounts from database
  await query(`DELETE FROM users WHERE id IN ('user-pemred', 'user-redaktur', 'user-pengurus', 'user-kontributor');`).catch(() => {});

  // Official initial superadmin account
  await query(
    `INSERT INTO users (id, name, email, password_hash, role, institution, bio)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE 
     SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email;`,
    [
      'user-superadmin',
      'Administrator Meja Redaksi',
      'admin@reaksi.id',
      defaultPasswordHash,
      'superadmin',
      'LPM Reaksi FST UIN SGD Bandung',
      'Pengawas teknis sistem dan portal resmi LPM Reaksi.',
    ]
  );

  // 11. Seed Rubriks
  for (const r of SEED_RUBRIKS) {
    await query(
      `INSERT INTO rubriks (id, slug, name, description, color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING;`,
      [r.id, r.slug, r.name, r.description, r.color, r.order]
    );
  }

  // 12. Seed Pages
  for (const p of SEED_PAGES) {
    await query(
      `INSERT INTO site_pages (id, slug, title, description, main_text, extra_content, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slug) DO NOTHING;`,
      [p.id, p.slug, p.title, p.description, p.mainText, JSON.stringify(p.extraContent || {}), p.updatedBy]
    );
  }

  // 13. Seed Media Partner Config
  await query(
    `INSERT INTO media_partner_config (id, config)
     VALUES ('default', $1)
     ON CONFLICT (id) DO NOTHING;`,
    [JSON.stringify(DEFAULT_MEDIA_PARTNER)]
  );

  console.log('✅ PostgreSQL database initialized and seeded successfully.');
}
