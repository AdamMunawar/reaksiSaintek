'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Target, Compass, BookOpen, Sparkles } from 'lucide-react';
import { db } from '@/lib/db/repository';
import { SitePageContent } from '@/lib/db/schema';
import { SEED_PAGES } from '@/lib/db/seed';
import { PageTitle } from '@/components/ui/PageTitle';

export default function TentangPage() {
  const [pageData, setPageData] = useState<SitePageContent | null>(null);

  useEffect(() => {
    const data = db.getPageBySlug('tentang') || SEED_PAGES[0];
    setPageData(data);
  }, []);

  const visi = pageData?.extraContent?.visi || 'Menjadi lembaga pers mahasiswa yang independen, kritis, berwawasan iptek, dan berintegritas dalam mewujudkan masyarakat kampus yang literatif dan demokratis.';
  const misi: string[] = pageData?.extraContent?.misi || [
    'Mewujudkan jurnalisme mahasiswa yang kritis, solutif, dan berintegritas tinggi.',
    'Menjadi wadah literasi dan pengembangan kapasitas intelektual civitas akademika.',
    'Menyuarakan kebenaran serta mengawal transparansi kebijakan publik di lingkungan universitas.'
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Tentang Kami" />
      <Header />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Tentang Kami</span>
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
                  {pageData?.title || 'Tentang LPM Reaksi'}
                </h1>
                <p
                  className="text-xs sm:text-sm font-medium mt-1"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {pageData?.description || 'Profil Lembaga Pers Mahasiswa FST UIN Sunan Gunung Djati Bandung.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Profil */}
            <div
              className="p-6 sm:p-8 rounded-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                boxShadow: 'var(--shadow-hard-sm)',
              }}
            >
              <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--color-accent)' }}>
                <BookOpen size={20} />
                <h2
                  className="text-base font-bold uppercase tracking-wide"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Profil Lembaga
                </h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>
                {pageData?.mainText || (
                  <>
                    <p>
                      Lembaga Pers Mahasiswa (LPM) Reaksi adalah unit kegiatan pers mahasiswa di lingkungan Fakultas Sains dan Teknologi Universitas Islam Negeri Sunan Gunung Djati Bandung. Berdiri sebagai ruang ekspresi intelektual, kritis, dan karya jurnalistik mahasiswa.
                    </p>
                    <p>
                      Sebagai pers mahasiswa, LPM Reaksi memegang teguh prinsip independensi, keberimbangan, dan kode etik jurnalistik. Kami menyajikan informasi berkualitas seputar dinamika kampus, perkembangan sains dan teknologi, serta wacana sosial kemasyarakatan.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Visi & Misi */}
            <div
              className="p-6 sm:p-8 rounded-sm space-y-6"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                boxShadow: 'var(--shadow-hard-sm)',
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--color-accent)' }}>
                  <Target size={18} />
                  <h2
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                  >
                    Visi
                  </h2>
                </div>
                <p className="text-sm leading-relaxed font-medium pl-6" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>
                  {visi}
                </p>
              </div>

              <div className="pt-4" style={{ borderTop: '1px solid var(--color-line)' }}>
                <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--color-accent)' }}>
                  <Compass size={18} />
                  <h2
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                  >
                    Misi
                  </h2>
                </div>
                <ul className="space-y-2.5 text-sm pl-6" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>
                  {misi.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
