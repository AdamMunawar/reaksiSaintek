import { User, Article, SitePageContent, StaffMember, MediaItem, RubrikItem, EPaperItem, MediaPartnerConfig } from './schema';

export const SEED_USERS: User[] = [];
export const SEED_ARTICLES: Article[] = [];
export const SEED_EPAPERS: EPaperItem[] = [];
export const SEED_PAGES: SitePageContent[] = [
  {
    id: 'page-tentang',
    slug: 'tentang',
    title: 'Tentang LPM Reaksi',
    description: 'Profil Lembaga Pers Mahasiswa Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung.',
    mainText: `Lembaga Pers Mahasiswa (LPM) Reaksi adalah unit pers mahasiswa di lingkungan Fakultas Sains dan Teknologi Universitas Islam Negeri Sunan Gunung Djati Bandung. Berdiri sebagai ruang ekspresi intelektual, kritis, dan karya jurnalistik mahasiswa.\n\nSebagai pers mahasiswa, LPM Reaksi memegang teguh prinsip independensi, keberimbangan, dan kode etik jurnalistik. Kami menyajikan informasi berkualitas seputar dinamika kampus, perkembangan sains dan teknologi, serta wacana sosial kemasyarakatan.`,
    extraContent: {
      visi: 'Menjadi lembaga pers mahasiswa yang independen, kritis, berwawasan iptek, dan berintegritas dalam mewujudkan masyarakat kampus yang literatif dan demokratis.',
      misi: [
        'Mewujudkan jurnalisme mahasiswa yang kritis, solutif, dan berintegritas tinggi.',
        'Menjadi wadah literasi dan pengembangan kapasitas intelektual civitas akademika.',
        'Menyuarakan kebenaran serta mengawal transparansi kebijakan publik di lingkungan universitas.'
      ]
    },
    updatedAt: '2026-09-08T10:00:00Z',
    updatedBy: 'Ahmad Fauzi (Superadmin)',
  },
  {
    id: 'page-kirim',
    slug: 'kirim-tulisan',
    title: 'Panduan & Ketentuan Kirim Tulisan',
    description: 'Pedoman dan tata cara pengiriman opini dan karya tulisan ke LPM Reaksi FST UIN SGD Bandung.',
    mainText: `LPM Reaksi membuka ruang seluas-luasnya bagi mahasiswa, dosen, dan masyarakat umum untuk mengirimkan karya tulis berupa Opini, Esai, Karya Sastra (Puisi/Cerpen), maupun artikel ulasan sains dan teknologi.`,
    extraContent: {
      emailTarget: 'redaksi@reaksisaintek.com',
      whatsappTarget: '0812-3456-7890',
      rules: [
        'Naskah bersifat orisinal, belum pernah dimuat di media cetak maupun daring mana pun, dan bebas dari unsur plagiarisme.',
        'Panjang naskah opini dan esai berkisar antara 600 s.d. 1.200 kata.',
        'Menggunakan bahasa Indonesia yang baik, lugas, santun, dan sesuai PUEBI / EYD.',
        'Sertakan biodata singkat (1–2 kalimat), foto diri, dan kontak WhatsApp aktif di akhir naskah.'
      ]
    },
    updatedAt: '2026-09-08T10:00:00Z',
    updatedBy: 'Ahmad Fauzi (Superadmin)',
  }
];

// Susunan pengurus dikelola dinamis per departemen melalui panel admin
export const SEED_STAFF: StaffMember[] = [];

export const SEED_MEDIA: MediaItem[] = [];

export const SEED_RUBRIKS: RubrikItem[] = [];

export const DEFAULT_MEDIA_PARTNER: MediaPartnerConfig = {
  heroTitle: 'SOP Kerjasama Media Partner',
  heroSubtitle: 'LPM Reaksi Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung membuka ruang kolaborasi seluas-luasnya bagi organisasi kemahasiswaan, komunitas, lembaga kampus, dan instansi eksternal untuk memperluas jangkauan publikasi acara dan kegiatan positif.',
  whatsappNumber: '6281234567890',
  whatsappText: 'Halo LPM Reaksi, kami ingin mengajukan kerjasama media partner.',
  contactEmail: 'redaksi@reaksi.id',
  metricAudience: '10.000+',
  metricAudienceDesc: 'Sivitas akademika FST, mahasiswa UIN SGD Bandung, dan pegiat sains nasional.',
  metricChannels: 'Website & Medsos',
  metricChannelsDesc: 'Portal Berita Resmi, Instagram (@lpmreaksi_), TikTok, dan YouTube.',
  metricStandard: 'Standar Pers',
  metricStandardDesc: 'Sesuai Pedoman Pemberitaan Media Siber Dewan Pers dan independensi pers mahasiswa.',
  packages: [
    {
      id: 'pkg-1',
      name: 'Paket Publikasi Media',
      badge: 'Publikasi Poster',
      description: 'Cocok untuk publikasi poster webinar, seminar nasional, kompetisi kampus, dan festival mahasiswa.',
      features: [
        'Penayangan poster di Instagram Story @lpmreaksi_',
        'Penyebaran informasi di kanal broadcast mahasiswa',
        'Tautan pendaftaran/registrasi acara di bio profil'
      ],
      contraprestasi: 'Pencantuman Logo LPM Reaksi pada seluruh media promosi.'
    },
    {
      id: 'pkg-2',
      name: 'Paket Liputan & Press Release',
      badge: 'Liputan Jurnalis',
      highlighted: true,
      description: 'Penugasan reporter LPM Reaksi untuk meliput langsung jalannya acara serta menerbitkan artikel berita di portal.',
      features: [
        'Delegasi 1-2 jurnalis/reporter ke lokasi acara',
        'Dokumentasi foto kegiatan jurnalistik',
        'Penerbitan 1 artikel liputan resmi di Portal LPM Reaksi',
        'Live report / story update selama acara berlangsung'
      ],
      contraprestasi: 'ID Card Pers, Konsumsi Reporter, & Logo Sponsor/Medpart.'
    },
    {
      id: 'pkg-3',
      name: 'Paket Kolaborasi Strategis',
      badge: 'Program Kemitraan',
      description: 'Kerjasama program berkelanjutan, sponsor resmi kompetisi, atau kemitraan seminar/workshop jurnalistik.',
      features: [
        'Liputan komprehensif pra-acara, hari H, dan pasca-acara',
        'Banner publikasi di beranda portal LPM Reaksi',
        'Pemateri / narasumber pelatihan kepenulisan atau media'
      ],
      contraprestasi: 'MoU Kemitraan resmi & penempatan logo utama.'
    }
  ],
  steps: [
    {
      step: 1,
      title: 'Kirimkan Surat Permohonan & Proposal Acara',
      description: 'Panitia mengirimkan proposal kegiatan dan surat resmi permohonan media partner ke email redaksi@reaksi.id atau melalui WhatsApp Humas minimal H-7 sebelum tanggal pelaksanaan kegiatan.'
    },
    {
      step: 2,
      title: 'Verifikasi dan Konfirmasi Kemitraan (1x24 Jam)',
      description: 'Tim Divisi Humas & Redaksi akan meninjau kelayakan acara, ketersediaan jadwal tim liputan, serta memastikan kesesuaian nilai kegiatan dengan kode etik pers mahasiswa.'
    },
    {
      step: 3,
      title: 'Pencantuman Logo & Pengiriman Materi Promosi',
      description: 'Setelah disetujui, panitia wajib menyematkan logo resmi LPM Reaksi pada poster, banner, virtual background, atau ID card panitia sesuai kesepakatan paket kemitraan.'
    },
    {
      step: 4,
      title: 'Penayangan Publikasi & Bukti Tayang',
      description: 'LPM Reaksi mempublikasikan materi kegiatan sesuai jadwal yang disepakati dan mengirimkan laporan bukti publikasi (tangkapan layar penayangan / tautan artikel berita).'
    }
  ],
  terms: [
    'Kegiatan tidak bermuatan pornografi, ujaran kebencian (SARA), diskriminasi, kekerasan, perjudian, atau politik praktis partai tertentu.',
    'Materi promosi (poster, caption, tautan) dikirimkan dalam format berkualitas tinggi siap tayang maksimal H-3 sebelum tanggal jadwal penayangan.',
    'Panitia dilarang memodifikasi rasio, warna utama, atau menambahkan efek yang merusak integritas logo resmi LPM Reaksi.',
    'Untuk paket liputan di lokasi, panitia wajib menyediakan akses pers (Press Pass) serta memfasilitasi kebutuhan peliputan secara wajar.'
  ],
  logoDownloadUrl: '/images/reaksi.png'
};



