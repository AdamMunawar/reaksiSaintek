'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Send, FileText, CheckCircle2, Mail, PenTool, ArrowRight } from 'lucide-react';
import { db } from '@/lib/db/repository';
import { SitePageContent } from '@/lib/db/schema';
import { SEED_PAGES } from '@/lib/db/seed';
import { PageTitle } from '@/components/ui/PageTitle';

export default function KirimTulisanPage() {
  const [pageData, setPageData] = useState<SitePageContent | null>(null);

  useEffect(() => {
    const data = db.getPageBySlug('kirim-tulisan') || SEED_PAGES[1];
    setPageData(data);
  }, []);

  const emailTarget = pageData?.extraContent?.emailTarget || 'redaksi@reaksisaintek.com';
  const whatsappTarget = pageData?.extraContent?.whatsappTarget || '0812-3456-7890';
  const rules: string[] = pageData?.extraContent?.rules || [
    'Naskah bersifat orisinal, belum pernah dimuat di media cetak maupun daring mana pun, dan bebas dari unsur plagiarisme.',
    'Panjang naskah opini dan esai berkisar antara 600 s.d. 1.200 kata.',
    'Menggunakan bahasa Indonesia yang baik, lugas, santun, dan sesuai PUEBI / EYD.',
    'Sertakan biodata singkat (1-2 kalimat), foto diri, dan kontak WhatsApp aktif di akhir naskah.'
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Kirim Tulisan" />
      <Header />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Kirim Tulisan</span>
          </div>

          {/* Header */}
          <div
            className="pb-5 mb-8"
            style={{ borderBottom: '2px solid var(--color-keyline)' }}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 5,
                  height: 34,
                  backgroundColor: 'var(--color-accent)',
                  flexShrink: 0,
                  borderRadius: 1,
                }}
              />
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  {pageData?.title || 'Kirim Tulisan'}
                </h1>
                <p
                  className="text-xs sm:text-sm font-medium mt-1"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {pageData?.description || 'Ruang partisipasi karya jurnalistik, opini, dan sastra civitas akademika.'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Primary Action Card: Portal Kontributor */}
            <div
              className="p-6 sm:p-8 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-keyline)',
                boxShadow: 'var(--shadow-hard-lg)',
              }}
            >
              <div>
                <span
                  className="text-[10px] font-extrabold uppercase px-2 py-0.5 text-white inline-block mb-2"
                  style={{ backgroundColor: '#ea580c', fontFamily: 'var(--font-display)' }}
                >
                  Form Pengajuan Naskah Online
                </span>
                <h3
                  className="text-lg font-extrabold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Kirim Naskah via Portal Kontributor
                </h3>
                <p className="text-xs mt-1 leading-relaxed max-w-md" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
                  Gunakan formulir online untuk mengisi data diri, naskah, cover foto, dan pantau status persetujuan redaksi secara real-time.
                </p>
              </div>

              <Link
                href="/kontributor/kirim"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md transition-transform hover:-translate-y-0.5 flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <PenTool size={15} />
                <span>Buka Form Kirim Naskah</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Syarat & Ketentuan */}
            <div
              className="p-6 sm:p-8 rounded-sm space-y-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                boxShadow: 'var(--shadow-hard-sm)',
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-accent)' }}>
                <CheckCircle2 size={20} />
                <h2
                  className="text-base font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Syarat &amp; Ketentuan Naskah
                </h2>
              </div>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>
                {rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Email Alternative */}
            <div
              className="p-6 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
              }}
            >
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Pengiriman Alternatif via Email
                </h4>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  Kirim lampiran dokumen (.docx) ke <strong>{emailTarget}</strong>
                </p>
              </div>

              <a
                href={`mailto:${emailTarget}?subject=Kirim%20Tulisan%20LPM%20Reaksi`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase border hover:opacity-70"
                style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}
              >
                <Mail size={13} />
                <span>Kirim Email</span>
              </a>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}