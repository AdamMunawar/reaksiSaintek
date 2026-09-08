'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Users, Shield, Award, Sparkles, FolderTree } from 'lucide-react';
import { db } from '@/lib/db/repository';
import { StaffMember } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';

const DEPARTMENTS = [
  {
    id: 'Pembina',
    title: '1. Pembina',
    shortName: 'Pembina',
    desc: 'Dewan pelindung dan pembina organisasi',
    bidang: [] as string[],
  },
  {
    id: 'Ex-Officio',
    title: '2. Ex-Officio',
    shortName: 'Ex-Officio',
    desc: 'Pimpinan Umum dan jajaran Badan Pengurus Harian (BPH)',
    bidang: [] as string[],
  },
  {
    id: 'Departemen Redaksi dan Penerbitan',
    title: '3. Departemen Redaksi dan Penerbitan',
    shortName: 'Departemen Redaksi & Penerbitan',
    desc: 'Membawahi bidang Reporter, Redaktur, Layouter, dan FNV (Foto & Video)',
    bidang: ['Reporter', 'Redaktur', 'Layouter', 'FNV'],
  },
  {
    id: 'Departemen Penelitian dan Pengembangan',
    title: '4. Departemen Penelitian dan Pengembangan',
    shortName: 'Departemen Litbang',
    desc: 'Membawahi bidang PSDM dan Riset',
    bidang: ['PSDM', 'Riset'],
  },
  {
    id: 'Departemen Marketing dan Komunikasi',
    title: '5. Departemen Marketing dan Komunikasi',
    shortName: 'Departemen Markom',
    desc: 'Membawahi bidang Marketing dan bidang Komunikasi',
    bidang: ['Marketing', 'Komunikasi'],
  },
] as const;

export default function RedaksiPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  useEffect(() => {
    setStaffList(db.getStaff());
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      <PageTitle title="Susunan Pengurus & Redaksi" />
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
            <Link href="/" className="hover:underline">Beranda</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-accent)' }}>Susunan Redaksi</span>
          </div>

          {/* Header */}
          <div
            className="pb-6 mb-10"
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
                  className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                >
                  Susunan Pengurus &amp; Dewan Redaksi
                </h1>
                <p
                  className="text-xs sm:text-sm font-medium mt-1"
                  style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
                >
                  Struktur kepengurusan resmi Lembaga Pers Mahasiswa Reaksi Saintek UIN Sunan Gunung Djati Bandung.
                </p>
              </div>
            </div>
          </div>

          {/* Department Cards */}
          <div className="space-y-8">
            {DEPARTMENTS.map((dept) => {
              const deptMembers = staffList.filter((s) => (s.department || s.division) === dept.id);
              if (deptMembers.length === 0) return null;

              return (
                <div
                  key={dept.id}
                  className="p-6 sm:p-8 rounded-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid var(--color-keyline)',
                    boxShadow: 'var(--shadow-hard)',
                  }}
                >
                  {/* Department Title */}
                  <div className="flex items-center justify-between pb-3 mb-5 border-b" style={{ borderColor: 'var(--color-line)' }}>
                    <div className="flex items-center gap-2.5">
                      <Shield size={20} style={{ color: 'var(--color-accent)' }} />
                      <div>
                        <h2
                          className="text-sm sm:text-base font-extrabold uppercase tracking-wider"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                        >
                          {dept.title}
                        </h2>
                        <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                          {dept.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content grouped by Bidang or direct list */}
                  {dept.bidang.length > 0 ? (
                    <div className="space-y-6">
                      {/* Pimpinan / Non-bidang */}
                      {deptMembers.filter((m) => !m.bidang || !(dept.bidang as readonly string[]).includes(m.bidang || '')).length > 0 && (
                        <div className="p-4 rounded-sm border" style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] block mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                            Pimpinan Departemen
                          </span>
                          <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                            {deptMembers
                              .filter((m) => !m.bidang || !(dept.bidang as readonly string[]).includes(m.bidang || ''))
                              .map((m) => (
                                <div key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--color-foreground)' }}>
                                    {m.name}
                                  </span>
                                  <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                                    {m.roleTitle} {m.period && <span>({m.period})</span>}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Sub-Bidang Sections */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dept.bidang.map((bidName) => {
                          const members = deptMembers.filter((m) => m.bidang === bidName);
                          if (members.length === 0) return null;

                          return (
                            <div
                              key={bidName}
                              className="p-4 rounded-sm border"
                              style={{
                                backgroundColor: 'var(--color-wall)',
                                borderColor: 'var(--color-line)',
                              }}
                            >
                              <div className="flex items-center gap-2 pb-2 mb-3 border-b" style={{ borderColor: 'var(--color-line)' }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-foreground)]" style={{ fontFamily: 'var(--font-display)' }}>
                                  Bidang {bidName}
                                </h3>
                              </div>

                              <div className="space-y-2.5">
                                {members.map((m) => (
                                  <div key={m.id} className="flex flex-col">
                                    <span className="font-bold text-xs" style={{ color: 'var(--color-foreground)' }}>
                                      {m.name}
                                    </span>
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
                                      {m.roleTitle}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Direct List (Pembina & Ex-Officio) */
                    <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                      {deptMembers.map((m) => (
                        <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-sm" style={{ color: 'var(--color-foreground)' }}>
                            {m.name}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                            {m.roleTitle} {m.period && <span>({m.period})</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state when no staff members yet */}
            {staffList.length === 0 && (
              <div
                className="p-12 text-center rounded-sm space-y-3"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-line)',
                }}
              >
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-blue-500/10 text-blue-600">
                  <Users size={24} />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  Struktur Kepengurusan Sedang Disinkronkan
                </h3>
                <p className="text-xs text-[var(--color-muted)] max-w-md mx-auto leading-relaxed">
                  Data pengurus lama telah dibersihkan. Susunan pengurus periode aktif dapat dikelola secara dinamis per departemen melalui meja redaksi.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}