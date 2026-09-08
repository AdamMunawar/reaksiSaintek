'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { PageTitle } from '@/components/ui/PageTitle';
import { db } from '@/lib/db/repository';
import { DEFAULT_MEDIA_PARTNER } from '@/backend/db/seed';
import { MediaPartnerConfig } from '@/lib/db/schema';
import {
  Handshake,
  CheckCircle2,
  FileText,
  Clock,
  Send,
  Download,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Mail,
  ShieldCheck,
  Megaphone,
  Camera,
  Share2,
  ArrowRight,
  Check,
  Sparkles
} from 'lucide-react';

export default function MediaPartnerPage() {
  const [config, setConfig] = useState<MediaPartnerConfig>(DEFAULT_MEDIA_PARTNER);

  useEffect(() => {
    try {
      const data = db.getMediaPartnerConfig();
      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Error loading media partner config:', err);
    }
  }, []);

  const waHref = `https://wa.me/${config.whatsappNumber || '6281234567890'}?text=${encodeURIComponent(config.whatsappText || 'Halo Humas LPM Reaksi, kami ingin mengajukan kerjasama media partner.')}`;
  const mailHref = `mailto:${config.contactEmail || 'redaksi@reaksi.id'}?subject=${encodeURIComponent('Pengajuan Media Partner LPM Reaksi')}`;

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}>
      <PageTitle title="SOP Kerjasama & Media Partner" />
      <Header />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-6" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
          <Link href="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          <span style={{ color: 'var(--color-foreground)' }}>Media Partner &amp; SOP Kerjasama</span>
        </div>

        {/* Hero Section */}
        <div
          className="p-6 sm:p-10 rounded-sm mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white mb-3" style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
              <Handshake size={13} />
              <span>Kemitraan &amp; Publikasi Acara</span>
            </div>
            <h1
              className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
            >
              {config.heroTitle || 'SOP Kerjasama Media Partner'}
            </h1>
            <p className="text-xs sm:text-sm mt-3 leading-relaxed" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
              {config.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto flex-shrink-0">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white text-center flex items-center justify-center gap-2 shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: '#25D366', fontFamily: 'var(--font-display)' }}
            >
              <MessageCircle size={15} />
              <span>Hubungi Humas via WA</span>
            </a>
            <a
              href={mailHref}
              className="px-6 py-3 text-xs font-bold uppercase tracking-wider border text-center flex items-center justify-center gap-2 transition-opacity hover:opacity-75"
              style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
            >
              <Mail size={15} />
              <span>Kirim Email Proposal</span>
            </a>
          </div>
        </div>

        {/* Audience Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-sm border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
              Target Pembaca
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {config.metricAudience}
            </p>
            <p className="text-[11px] mt-1 text-[var(--color-muted)]">
              {config.metricAudienceDesc}
            </p>
          </div>

          <div className="p-5 rounded-sm border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
              Multi-Channel
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-1" style={{ fontFamily: 'var(--font-display)' }}>
              {config.metricChannels}
            </p>
            <p className="text-[11px] mt-1 text-[var(--color-muted)]">
              {config.metricChannelsDesc}
            </p>
          </div>

          <div className="p-5 rounded-sm border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>
              Kredibilitas
            </span>
            <p className="text-2xl sm:text-3xl font-black mt-1 text-emerald-600" style={{ fontFamily: 'var(--font-display)' }}>
              {config.metricStandard}
            </p>
            <p className="text-[11px] mt-1 text-[var(--color-muted)]">
              {config.metricStandardDesc}
            </p>
          </div>
        </div>

        {/* Paket Kerjasama */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold uppercase tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Pilihan Bentuk Kerjasama
            </h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Pilih bentuk kemitraan yang paling sesuai dengan kebutuhan kegiatan atau agenda organisasi Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-6 rounded-sm flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: pkg.highlighted ? '2px solid var(--color-keyline)' : '1px solid var(--color-line)',
                  boxShadow: pkg.highlighted ? 'var(--shadow-hard-sm)' : 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-[var(--color-accent)]">
                      {pkg.name.toLowerCase().includes('liputan') ? (
                        <Camera size={20} />
                      ) : pkg.name.toLowerCase().includes('strategis') ? (
                        <Share2 size={20} />
                      ) : (
                        <Megaphone size={20} />
                      )}
                    </div>
                    {pkg.badge && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-none border text-[var(--color-muted)]" style={{ borderColor: 'var(--color-line)' }}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-extrabold uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-4">
                    {pkg.description}
                  </p>

                  <ul className="space-y-2 text-xs">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t text-[11px] font-bold text-[var(--color-muted)]" style={{ borderColor: 'var(--color-line)' }}>
                  Kontraprestasi: {pkg.contraprestasi}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prosedur & Alur Pengajuan */}
        <div
          className="p-6 sm:p-8 rounded-sm mb-12"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard)',
          }}
        >
          <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Prosedur &amp; Alur Pengajuan Kerjasama
          </h2>

          <div className="space-y-6">
            {config.steps.map((st, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }}>
                  {st.step || i + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                    {st.title}
                  </h4>
                  <p className="text-xs mt-1 text-[var(--color-muted)] leading-relaxed">
                    {st.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Syarat & Ketentuan Umum */}
        <div className="p-6 rounded-sm border mb-12" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
            <AlertCircle size={18} />
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              Syarat &amp; Ketentuan Umum Kemitraan
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-[var(--color-muted)] leading-relaxed list-disc list-inside">
            {config.terms.map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ul>
        </div>

        {/* Download Logo Resmi */}
        <div className="p-6 rounded-sm border flex flex-col sm:flex-row items-center justify-between gap-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-line)' }}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-black/30 border" style={{ borderColor: 'var(--color-line)' }}>
              <Image
                src="/images/reaksi.png"
                alt="Logo LPM Reaksi"
                width={120}
                height={30}
                className="h-6 w-auto object-contain dark:hidden"
              />
              <Image
                src="/images/reaksi-dark.png"
                alt="Logo LPM Reaksi"
                width={120}
                height={30}
                className="h-6 w-auto object-contain hidden dark:block"
              />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
                Unduh Aset Logo Resmi LPM Reaksi
              </h4>
              <p className="text-[11px] text-[var(--color-muted)]">
                Format PNG Transparan resolusi tinggi untuk kebutuhan poster dan materi promosi kemitraan.
              </p>
            </div>
          </div>

          <a
            href={config.logoDownloadUrl || '/images/reaksi.png'}
            download="Logo-LPM-Reaksi.png"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <Download size={14} />
            <span>Unduh Logo (.PNG)</span>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
