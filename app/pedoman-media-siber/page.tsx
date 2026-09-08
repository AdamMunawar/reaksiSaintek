'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ShieldCheck, FileText, CheckCircle, Scale, AlertCircle } from 'lucide-react';
import { PageTitle } from '@/components/ui/PageTitle';

const PEDOMAN_SECTIONS = [
  {
    number: '1',
    title: 'Ruang Lingkup',
    content: [
      'Media Siber adalah segala bentuk media yang menggunakan wahana internet dan melaksanakan kegiatan jurnalistik, serta memenuhi persyaratan Undang-Undang Pers dan Standar Perusahaan Pers yang ditetapkan Dewan Pers.',
      'Isi Buatan Pengguna (User Generated Content) adalah segala isi yang dibuat dan atau dipublikasikan oleh pengguna media siber, antara lain artikel opini, komentar, sanggahan, tanggapan, serta foto dan video.',
    ],
  },
  {
    number: '2',
    title: 'Verifikasi dan Keberimbangan Berita',
    content: [
      'Pada prinsipnya setiap berita harus melalui verifikasi kebenaran dan fakta sebelum dipublikasikan.',
      'Berita yang dapat merugikan pihak lain memerlukan verifikasi pada berita yang sama atau secara proporsional untuk memenuhi prinsip akurasi dan keberimbangan.',
      'Dalam kondisi mendesak/khusus, jika verifikasi belum dapat dipenuhi, berita dapat disiarkan dengan ketentuan: mencantumkan keterangan bahwa berita masih memerlukan verifikasi lebih lanjut dan menyertakan upaya verifikasi yang sedang dilakukan.',
    ],
  },
  {
    number: '3',
    title: 'Isi Buatan Pengguna (User Generated Content / Kontributor)',
    content: [
      'Media siber wajib mencantumkan syarat dan ketentuan mengenai Isi Buatan Pengguna yang tidak bertentangan dengan UU Pers dan Kode Etik Jurnalistik.',
      'Media siber mewajibkan setiap pengguna/kontributor melakukan registrasi identitas dan proses log-in sebelum dapat mempublikasikan karya atau opini.',
      'Media siber berhak mengedit atau menghapus isi buatan pengguna yang mengandung unsur SARA, fitnah, ujaran kebencian, pencemaran nama baik, atau pornografi.',
    ],
  },
  {
    number: '4',
    title: 'Ralat, Koreksi, dan Hak Jawab',
    content: [
      'Ralat, koreksi, dan hak jawab mengacu pada Undang-Undang Pers, Kode Etik Jurnalistik, dan Pedoman Hak Jawab yang ditetapkan Dewan Pers.',
      'Ralat, koreksi dan/atau hak jawab wajib ditautkan pada berita yang diralat, dikoreksi atau yang diberi hak jawab.',
      'Di setiap berita ralat, koreksi, dan hak jawab wajib dicantumkan waktu pemuatan ralat/koreksi/hak jawab tersebut.',
    ],
  },
  {
    number: '5',
    title: 'Pencabutan Berita',
    content: [
      'Berita yang sudah dipublikasikan tidak dapat dicabut karena alasan penyensoran dari pihak luar redaksi, kecuali terkait masalah SARA, kesusilaan, masa depan anak, pengalaman traumatik korban, atau pertimbangan khusus lain yang ditetapkan Dewan Pers.',
      'Pencabutan berita wajib disertai dengan alasan pencabutan dan diumumkan kepada publik.',
    ],
  },
  {
    number: '6',
    title: 'Hak Cipta dan Kutipan',
    content: [
      'Media siber wajib menghormati hak cipta sebagaimana diatur dalam peraturan perundang-undangan yang berlaku.',
      'Pengutipan berita media lain wajib menyebutkan sumber secara jelas dan mencantumkan tautan (link) ke sumber asli jika memungkinkan.',
    ],
  },
  {
    number: '7',
    title: 'Pencantuman Pedoman',
    content: [
      'Media siber wajib mencantumkan Pedoman Pemberitaan Media Siber ini di dalam medianya secara terang dan jelas agar dapat diakses oleh publik setiap saat.',
    ],
  },
  {
    number: '8',
    title: 'Sengketa Pemberitaan',
    content: [
      'Penilaian akhir atas sengketa mengenai pelaksanaan etika jurnalistik dan Pedoman Pemberitaan Media Siber ini diselesaikan oleh Dewan Pers.',
    ],
  },
];

export default function PedomanMediaSiberPage() {
  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Pedoman Media Siber" />
      <Header />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Pedoman Media Siber</span>
          </div>

          {/* Page Header */}
          <div
            className="pb-6 mb-8"
            style={{ borderBottom: '2px solid var(--color-keyline)' }}
          >
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 5,
                  height: 38,
                  backgroundColor: 'var(--color-accent)',
                  flexShrink: 0,
                  borderRadius: 1,
                }}
              />
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Pedoman Pemberitaan Media Siber
                </h1>
                <p
                  className="text-xs sm:text-sm font-medium mt-1.5"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
                >
                  Standar etik dan operasional jurnalisme siber Lembaga Pers Mahasiswa (LPM) Reaksi berpedoman pada Peraturan Dewan Pers No. 1/Peraturan-DP/III/2012.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice Banner */}
          <div
            className="p-5 mb-8 rounded-sm flex items-start gap-3.5"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderLeft: '4px solid var(--color-accent)',
              borderTop: '1px solid var(--color-line)',
              borderRight: '1px solid var(--color-line)',
              borderBottom: '1px solid var(--color-line)',
              boxShadow: 'var(--shadow-hard-sm)',
            }}
          >
            <Scale className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
            <div className="text-xs leading-relaxed" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}>
              <strong className="block text-xs uppercase font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Komitmen Etik LPM Reaksi
              </strong>
              Kemerdekaan berpendapat, berekspresi, dan kemerdekaan pers adalah hak asasi manusia yang dilindungi Pancasila, UUD 1945, dan Deklarasi Universal Hak Asasi Manusia PBB. Dalam mengelola portal berita digital kampus, LPM Reaksi FST UIN SGD Bandung berpedoman pada prinsip keterbukaan, akurasi, independensi, dan integritas pers mahasiswa.
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {PEDOMAN_SECTIONS.map((sec) => (
              <div
                key={sec.number}
                className="p-6 sm:p-7 rounded-sm transition-all"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                  boxShadow: 'var(--shadow-hard-sm)',
                }}
              >
                <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
                  <span
                    className="w-7 h-7 flex items-center justify-center text-xs font-black text-white rounded-none"
                    style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                  >
                    {sec.number}
                  </span>
                  <h2
                    className="text-base sm:text-lg font-bold uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                  >
                    {sec.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {sec.content.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }} />
                      <p
                        className="text-xs sm:text-sm leading-relaxed"
                        style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-body)' }}
                      >
                        {p}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div
            className="mt-10 p-5 text-center text-xs font-medium rounded-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px dashed var(--color-line)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Pedoman Pemberitaan Media Siber ini disahkan oleh Dewan Pers bersama organisasi pers dan pengelola media siber di Jakarta, 3 Februari 2012, serta diadopsi secara penuh sebagai pedoman operasional redaksi LPM Reaksi.
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}