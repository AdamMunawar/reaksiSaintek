-- ==============================================================================
-- LPM REAKSI PORTAL - DATABASE MIGRATION & INITIAL SCHEMA FOR SUPABASE POSTGRESQL
-- Jalankan skrip ini langsung di menu: Supabase Dashboard > SQL Editor > New Query
-- ==============================================================================

-- 1. ENUM TYPES
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

-- 2. TABEL PENGGUNA (USERS)
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

-- 3. TABEL RUBRIK (RUBRIKS)
CREATE TABLE IF NOT EXISTS rubriks (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#2563EB',
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL ARTIKEL BERITA (ARTICLES)
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
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks performa pencarian dan filter
CREATE INDEX IF NOT EXISTS idx_articles_status_pub ON articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_rubrik ON articles(rubrik);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- 5. TABEL HALAMAN LEMBAGA (SITE PAGES)
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

-- 6. TABEL SUSUNAN PENGURUS (STAFF MEMBERS) - 5 DEPARTEMEN & SUB-BIDANG
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

-- 7. TABEL E-PAPER & TABLOID DIGITAL
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

-- 8. TABEL MEDIA LIBRARY
CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABEL KONFIGURASI MEDIA PARTNER & SOP KERJASAMA
CREATE TABLE IF NOT EXISTS media_partner_config (
    id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INJEKSI DATA AWAL RESMI (SEED DATA)
-- ==============================================================================

-- Bersihkan akun demo lama jika pernah ada
DELETE FROM users WHERE id IN ('user-pemred', 'user-redaktur', 'user-pengurus', 'user-kontributor');

-- Inisialisasi Akun Superadmin Resmi (admin@reaksi.id / reaksi2026)
-- Password hash di bawah adalah hasil hash bcrypt dari 'reaksi2026'
INSERT INTO users (id, name, email, password_hash, role, institution, bio)
VALUES (
    'user-superadmin',
    'Administrator Meja Redaksi',
    'admin@reaksi.id',
    '$2a$10$7Z8YQ4M7kS1xX2c9uFjOe.zM8K4wG4hKqLq7Y3vB9N2pX1rT5wZ9e',
    'superadmin',
    'LPM Reaksi FST UIN SGD Bandung',
    'Pengawas teknis sistem dan portal resmi LPM Reaksi.'
)
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email;

-- Seed Rubrik Resmi
INSERT INTO rubriks (id, slug, name, description, color, sort_order) VALUES
('rubrik-1', 'kabar-kampus', 'Kabar Kampus', 'Warta terkini dinamika kampus UIN Sunan Gunung Djati Bandung', '#2563EB', 1),
('rubrik-2', 'saintek', 'Saintek Update', 'Inovasi, riset, dan perkembangan teknologi sains terapan', '#0891B2', 2),
('rubrik-3', 'opini', 'Opini & Esai', 'Gagasan kritis, analisis sosial, dan perspektif mahasiswa', '#7C3AED', 3),
('rubrik-4', 'feature', 'Feature', 'Kisah humanis, profil tokoh inspiratif, dan laporan mendalam', '#059669', 4),
('rubrik-5', 'lensa-kata', 'Lensa Kata', 'Ruang apresiasi karya sastra, puisi, cerpen, dan prosa', '#DB2777', 5),
('rubrik-6', 'infografik', 'Infografik', 'Data dan fakta dalam visualisasi menarik', '#EA580C', 6),
('rubrik-7', 'regional', 'Regional', 'Berita daerah dan isu lokal Jawa Barat', '#D97706', 7),
('rubrik-8', 'selisik', 'Selisik', 'Investigasi dan liputan mendalam eksklusif', '#DC2626', 8)
ON CONFLICT (slug) DO NOTHING;

-- Seed Halaman Lembaga Resmi (Tentang Kami & Panduan Kirim Tulisan)
INSERT INTO site_pages (id, slug, title, description, main_text, extra_content, updated_by) VALUES
(
    'page-tentang',
    'tentang',
    'Tentang LPM Reaksi',
    'Profil Lembaga Pers Mahasiswa Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung.',
    'Lembaga Pers Mahasiswa (LPM) Reaksi adalah unit pers mahasiswa di lingkungan Fakultas Sains dan Teknologi Universitas Islam Negeri Sunan Gunung Djati Bandung. Berdiri sebagai ruang ekspresi intelektual, kritis, dan karya jurnalistik mahasiswa.\n\nSebagai pers mahasiswa, LPM Reaksi memegang teguh prinsip independensi, keberimbangan, dan kode etik jurnalistik. Kami menyajikan informasi berkualitas seputar dinamika kampus, perkembangan sains dan teknologi, serta wacana sosial kemasyarakatan.',
    '{"visi": "Menjadi lembaga pers mahasiswa yang independen, kritis, berwawasan iptek, dan berintegritas dalam mewujudkan masyarakat kampus yang literatif dan demokratis.", "misi": ["Mewujudkan jurnalisme mahasiswa yang kritis, solutif, dan berintegritas tinggi.", "Menjadi wadah literasi dan pengembangan kapasitas intelektual civitas akademika.", "Menyuarakan kebenaran serta mengawal transparansi kebijakan publik di lingkungan universitas."]}'::jsonb,
    'Administrator Meja Redaksi'
),
(
    'page-kirim',
    'kirim-tulisan',
    'Panduan & Ketentuan Kirim Tulisan',
    'Pedoman dan tata cara pengiriman opini dan karya tulisan ke LPM Reaksi FST UIN SGD Bandung.',
    'LPM Reaksi membuka ruang seluas-luasnya bagi mahasiswa, dosen, dan masyarakat umum untuk mengirimkan karya tulis berupa Opini, Esai, Karya Sastra (Puisi/Cerpen), maupun artikel ulasan sains dan teknologi.',
    '{"rules": ["Naskah bersifat orisinal, belum pernah dimuat di media cetak maupun daring mana pun, dan bebas dari unsur plagiarisme.", "Panjang naskah opini dan esai berkisar antara 600 s.d. 1.200 kata.", "Menggunakan bahasa Indonesia yang baik, lugas, santun, dan sesuai PUEBI / EYD.", "Sertakan biodata singkat (1–2 kalimat), foto diri, dan kontak WhatsApp aktif di akhir naskah."], "emailTarget": "redaksi@reaksi.id", "whatsappTarget": "6281234567890"}'::jsonb,
    'Administrator Meja Redaksi'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Pengaturan Media Partner & SOP Kerjasama
INSERT INTO media_partner_config (id, config) VALUES (
    'default',
    '{
        "heroTitle": "SOP Kerjasama Media Partner",
        "heroSubtitle": "LPM Reaksi Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung membuka ruang kolaborasi seluas-luasnya bagi organisasi kemahasiswaan, komunitas, lembaga kampus, dan instansi eksternal untuk memperluas jangkauan publikasi acara dan kegiatan positif.",
        "whatsappNumber": "6281234567890",
        "whatsappText": "Halo Humas LPM Reaksi, kami ingin mengajukan kerjasama media partner.",
        "contactEmail": "redaksi@reaksi.id",
        "metricAudience": "10.000+",
        "metricAudienceDesc": "Sivitas akademika FST, mahasiswa UIN SGD Bandung, dan pegiat sains nasional.",
        "metricChannels": "Website & Medsos",
        "metricChannelsDesc": "Portal Berita Resmi, Instagram (@lpmreaksi_), TikTok, dan YouTube.",
        "metricStandard": "Standar Pers",
        "metricStandardDesc": "Sesuai Pedoman Pemberitaan Media Siber Dewan Pers dan independensi pers mahasiswa.",
        "packages": [
            {
                "id": "pkg-1",
                "name": "Paket Publikasi Media",
                "badge": "Publikasi Poster",
                "description": "Cocok untuk publikasi poster webinar, seminar nasional, kompetisi kampus, dan festival mahasiswa.",
                "features": ["Penayangan poster di Instagram Story @lpmreaksi_", "Penyebaran informasi di kanal broadcast mahasiswa", "Tautan pendaftaran/registrasi acara di bio profil"],
                "contraprestasi": "Pencantuman Logo LPM Reaksi pada seluruh media promosi."
            },
            {
                "id": "pkg-2",
                "name": "Paket Liputan & Press Release",
                "badge": "Liputan Jurnalis",
                "highlighted": true,
                "description": "Penugasan reporter LPM Reaksi untuk meliput langsung jalannya acara serta menerbitkan artikel berita di portal.",
                "features": ["Delegasi 1-2 jurnalis/reporter ke lokasi acara", "Dokumentasi foto kegiatan jurnalistik", "Penerbitan 1 artikel liputan resmi di Portal LPM Reaksi", "Live report / story update selama acara berlangsung"],
                "contraprestasi": "ID Card Pers, Konsumsi Reporter, & Logo Sponsor/Medpart."
            },
            {
                "id": "pkg-3",
                "name": "Paket Kolaborasi Strategis",
                "badge": "Program Kemitraan",
                "description": "Kerjasama program berkelanjutan, sponsor resmi kompetisi, atau kemitraan seminar/workshop jurnalistik.",
                "features": ["Liputan komprehensif pra-acara, hari H, dan pasca-acara", "Banner publikasi di beranda portal LPM Reaksi", "Pemateri / narasumber pelatihan kepenulisan atau media"],
                "contraprestasi": "MoU Kemitraan resmi & penempatan logo utama."
            }
        ],
        "steps": [
            {"step": 1, "title": "Kirimkan Surat Permohonan & Proposal Acara", "description": "Panitia mengirimkan proposal kegiatan dan surat resmi permohonan media partner ke email redaksi@reaksi.id atau melalui WhatsApp Humas minimal H-7 sebelum tanggal pelaksanaan kegiatan."},
            {"step": 2, "title": "Verifikasi dan Konfirmasi Kemitraan (1x24 Jam)", "description": "Tim Divisi Humas & Redaksi akan meninjau kelayakan acara, ketersediaan jadwal tim liputan, serta memastikan kesesuaian nilai kegiatan dengan kode etik pers mahasiswa."},
            {"step": 3, "title": "Pencantuman Logo & Pengiriman Materi Promosi", "description": "Setelah disetujui, panitia wajib menyematkan logo resmi LPM Reaksi pada poster, banner, virtual background, atau ID card panitia sesuai kesepakatan paket kemitraan."},
            {"step": 4, "title": "Penayangan Publikasi & Bukti Tayang", "description": "LPM Reaksi mempublikasikan materi kegiatan sesuai jadwal yang disepakati dan mengirimkan laporan bukti publikasi (tangkapan layar penayangan / tautan artikel berita)."}
        ],
        "terms": [
            "Kegiatan tidak bermuatan pornografi, ujaran kebencian (SARA), diskriminasi, kekerasan, perjudian, atau politik praktis partai tertentu.",
            "Materi promosi (poster, caption, tautan) dikirimkan dalam format berkualitas tinggi siap tayang maksimal H-3 sebelum tanggal jadwal penayangan.",
            "Panitia dilarang memodifikasi rasio, warna utama, atau menambahkan efek yang merusak integritas logo resmi LPM Reaksi.",
            "Untuk paket liputan di lokasi, panitia wajib menyediakan akses pers (Press Pass) serta memfasilitasi kebutuhan peliputan secara wajar."
        ],
        "logoDownloadUrl": "/images/reaksi.png"
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
