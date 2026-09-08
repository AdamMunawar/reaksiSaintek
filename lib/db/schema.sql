-- ==============================================================================
-- LPM REAKSI PORTAL - POSTGRESQL DATABASE SCHEMA (DDL)
-- reaksisaintek.com / Portal Pers Mahasiswa FST UIN Sunan Gunung Djati Bandung
-- ==============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('superadmin', 'pemred', 'redaktur', 'pengurus', 'kontributor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'REVISION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE
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

-- 3. RUBRIKS TABLE
CREATE TABLE IF NOT EXISTS rubriks (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#2563EB',
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ARTICLES TABLE
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
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
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for blazing fast news feed queries & search
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_rubrik_status ON articles(rubrik, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);

-- 5. SITE PAGES TABLE (Tentang, Panduan Kirim Tulisan, Visi Misi)
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

-- 6. STAFF MEMBERS TABLE (Susunan Dewan Pengurus & Redaksi)
CREATE TABLE IF NOT EXISTS staff_members (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    division VARCHAR(100) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1,
    avatar TEXT,
    period VARCHAR(50) DEFAULT '2026-2027',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_sort_order ON staff_members(sort_order ASC);

-- 7. MEDIA ITEMS TABLE (Galeri Media & Foto Unggahan)
CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/webp',
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INITIAL SEED DATA (Pengurus Awal & Halaman Resmi)
-- ==============================================================================

-- Akun Redaksi Bawaan
INSERT INTO users (id, name, email, role, institution, bio)
VALUES 
    ('user-superadmin', 'Ahmad Fauzi (Superadmin)', 'superadmin@reaksi.id', 'superadmin', 'LPM Reaksi FST UIN SGD Bandung', 'Pengawas teknis sistem dan arsip portal LPM Reaksi.'),
    ('user-pemred', 'Fathir Muhammad (Pemred)', 'pemred@reaksi.id', 'pemred', 'Teknik Informatika 2023 - FST', 'Pemimpin Redaksi LPM Reaksi periode 2026-2027.'),
    ('user-redaktur', 'Siti Nurhaliza (Redaktur)', 'redaktur@reaksi.id', 'redaktur', 'Matematika 2024 - FST', 'Redaktur Pelaksana & Pengelola Konten LPM Reaksi.'),
    ('user-pengurus', 'Rafi Taufiq (Pengurus)', 'pengurus@reaksi.id', 'pengurus', 'Teknik Elektro 2024 - FST', 'Pengurus & Tim Liputan Kampus LPM Reaksi.'),
    ('user-kontributor', 'Budi Santoso (Kontributor)', 'kontributor@reaksi.id', 'kontributor', 'Biologi 2025 - FST UIN Bandung', 'Mahasiswa Biologi peminat sains populer dan penulisan opini lingkungan.')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email;

-- Halaman Institusi Resmi
INSERT INTO site_pages (id, slug, title, description, main_text, extra_content, updated_by)
VALUES 
    ('page-tentang', 'tentang', 'Tentang LPM Reaksi', 'Profil Lembaga Pers Mahasiswa Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung.', 
     'Lembaga Pers Mahasiswa (LPM) Reaksi adalah unit pers mahasiswa di lingkungan Fakultas Sains dan Teknologi Universitas Islam Negeri Sunan Gunung Djati Bandung. Berdiri sebagai ruang ekspresi intelektual, kritis, dan karya jurnalistik mahasiswa.\n\nSebagai pers mahasiswa, LPM Reaksi memegang teguh prinsip independensi, keberimbangan, dan kode etik jurnalistik. Kami menyajikan informasi berkualitas seputar dinamika kampus, perkembangan sains dan teknologi, serta wacana sosial kemasyarakatan.',
     '{"visi": "Menjadi lembaga pers mahasiswa yang independen, kritis, berwawasan iptek, dan berintegritas dalam mewujudkan masyarakat kampus yang literatif dan demokratis.", "misi": ["Mewujudkan jurnalisme mahasiswa yang kritis, solutif, dan berintegritas tinggi.", "Menjadi wadah literasi dan pengembangan kapasitas intelektual civitas akademika.", "Menyuarakan kebenaran serta mengawal transparansi kebijakan publik di lingkungan universitas."]}'::jsonb,
     'Superadmin'),
    ('page-kirim', 'kirim-tulisan', 'Panduan & Ketentuan Kirim Tulisan', 'Pedoman dan tata cara pengiriman opini dan karya tulisan ke LPM Reaksi FST UIN SGD Bandung.',
     'LPM Reaksi membuka ruang seluas-luasnya bagi mahasiswa, dosen, dan masyarakat umum untuk mengirimkan karya tulis berupa Opini, Esai, Karya Sastra (Puisi/Cerpen), maupun artikel ulasan sains dan teknologi.',
     '{"emailTarget": "redaksi@reaksisaintek.com", "whatsappTarget": "0812-3456-7890", "rules": ["Naskah bersifat orisinal, belum pernah dimuat di media cetak maupun daring mana pun, dan bebas dari unsur plagiarisme.", "Panjang naskah opini dan esai berkisar antara 600 s.d. 1.200 kata.", "Menggunakan bahasa Indonesia yang baik, lugas, santun, dan sesuai PUEBI / EYD.", "Sertakan biodata singkat (1–2 kalimat), foto diri, dan kontak WhatsApp aktif di akhir naskah."]}'::jsonb,
     'Superadmin')
ON CONFLICT (id) DO NOTHING;
