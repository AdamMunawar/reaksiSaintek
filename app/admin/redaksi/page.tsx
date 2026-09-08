'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db/repository';
import { StaffMember } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Users,
  Layers,
  FolderTree,
  UserCheck
} from 'lucide-react';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

export const DEPARTMENTS_CONFIG = [
  {
    id: 'Pembina',
    title: '1. Pembina',
    shortName: 'Pembina',
    desc: 'Dewan pelindung dan pembina lembaga',
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
    shortName: 'Redaksi & Penerbitan',
    desc: 'Membawahi bidang Reporter, Redaktur, Layouter, dan FNV',
    bidang: ['Reporter', 'Redaktur', 'Layouter', 'FNV'],
  },
  {
    id: 'Departemen Penelitian dan Pengembangan',
    title: '4. Departemen Penelitian dan Pengembangan',
    shortName: 'Litbang',
    desc: 'Membawahi bidang PSDM dan Riset',
    bidang: ['PSDM', 'Riset'],
  },
  {
    id: 'Departemen Marketing dan Komunikasi',
    title: '5. Departemen Marketing dan Komunikasi',
    shortName: 'Markom',
    desc: 'Membawahi bidang Marketing dan bidang Komunikasi',
    bidang: ['Marketing', 'Komunikasi'],
  },
] as const;

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState<string>('Pembina');
  const [bidang, setBidang] = useState<string>('');
  const [period, setPeriod] = useState('2026-2027');

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    setStaffList(db.getStaff());
  };

  const currentDeptConfig = DEPARTMENTS_CONFIG.find((d) => d.id === department) || DEPARTMENTS_CONFIG[0];

  const handleOpenAdd = (defaultDept?: string, defaultBidang?: string) => {
    const targetDept = defaultDept || 'Pembina';
    const deptConf = DEPARTMENTS_CONFIG.find((d) => d.id === targetDept);
    setEditId(null);
    setName('');
    setRoleTitle('');
    setDepartment(targetDept);
    setBidang(defaultBidang || (deptConf && deptConf.bidang.length > 0 ? deptConf.bidang[0] : ''));
    setPeriod('2026-2027');
    setIsEditing(true);
  };

  const handleOpenEdit = (m: StaffMember) => {
    const dept = m.department || m.division || 'Pembina';
    setEditId(m.id);
    setName(m.name);
    setRoleTitle(m.roleTitle);
    setDepartment(dept);
    setBidang(m.bidang || '');
    setPeriod(m.period || '2026-2027');
    setIsEditing(true);
  };

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const conf = DEPARTMENTS_CONFIG.find((d) => d.id === newDept);
    if (conf && conf.bidang.length > 0) {
      setBidang(conf.bidang[0]);
    } else {
      setBidang('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleTitle.trim()) return;

    db.saveStaff({
      id: editId || undefined,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      department,
      division: department,
      bidang: currentDeptConfig.bidang.length > 0 ? bidang : undefined,
      period: period.trim(),
    });

    setNotification('Data pengurus departemen berhasil disimpan!');
    setIsEditing(false);
    loadStaff();
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      db.deleteStaff(staffToDelete.id);
      setNotification(`"${staffToDelete.name}" berhasil dihapus dari susunan pengurus.`);
      setStaffToDelete(null);
      loadStaff();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageTitle title="Kelola Susunan Pengurus" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
            <FolderTree size={13} />
            <span>Struktur Organisasi LPM Reaksi</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mt-0.5"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Susunan Pengurus per Departemen
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Kelola data pengurus secara dinamis berdasarkan 5 departemen dan bidang masing-masing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/redaksi"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase border hover:opacity-70"
            style={{ borderColor: 'var(--color-line)', color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
          >
            <span>Lihat Live di Web</span>
            <ExternalLink size={13} />
          </Link>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white"
            style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
          >
            <Plus size={14} />
            <span>Tambah Posisi Pengurus</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-none flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Form Dialog */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="p-6 rounded-sm space-y-4 animate-fade-in"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard-lg)',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              {editId ? 'Edit Posisi Pengurus' : 'Tambah Anggota / Jabatan Baru'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold uppercase hover:opacity-70"
              style={{ color: 'var(--color-muted)' }}
            >
              Batal
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Nama Lengkap / Instansi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Fathir Muhammad"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Nama Jabatan / Posisi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="misal: Kepala Departemen, Reporter Investigasi, dll."
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Departemen <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {DEPARTMENTS_CONFIG.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            {currentDeptConfig.bidang.length > 0 ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Bidang yang Dibawahi <span className="text-red-500">*</span>
                </label>
                <select
                  value={bidang}
                  onChange={(e) => setBidang(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {currentDeptConfig.bidang.map((b) => (
                    <option key={b} value={b}>
                      Bidang {b}
                    </option>
                  ))}
                  <option value="">Pimpinan Departemen / Non-Bidang</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Periode Kepengurusan
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>
            )}

            {currentDeptConfig.bidang.length > 0 && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Periode Kepengurusan
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border hover:opacity-70"
              style={{ borderColor: 'var(--color-line)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              {editId ? 'Simpan Perubahan' : 'Simpan Posisi'}
            </button>
          </div>
        </form>
      )}

      {/* Staff Grouping per 5 Departments */}
      <div className="space-y-6">
        {DEPARTMENTS_CONFIG.map((dept) => {
          const deptMembers = staffList.filter((s) => (s.department || s.division) === dept.id);

          return (
            <div
              key={dept.id}
              className="p-5 sm:p-6 rounded-sm"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '2px solid var(--color-keyline)',
                boxShadow: 'var(--shadow-hard)',
              }}
            >
              {/* Department Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-line)' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: 'var(--color-accent)' }} />
                    <h2
                      className="text-sm font-extrabold uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
                    >
                      {dept.title}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 border" style={{ borderColor: 'var(--color-line)' }}>
                      {deptMembers.length} Orang
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                    {dept.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdd(dept.id)}
                  className="px-3 py-1.5 text-[11px] font-bold uppercase border hover:bg-black/5 dark:hover:bg-white/5 self-start sm:self-auto inline-flex items-center gap-1"
                  style={{ borderColor: 'var(--color-line)' }}
                >
                  <Plus size={12} />
                  <span>Tambah di Departemen Ini</span>
                </button>
              </div>

              {/* Members Content */}
              {deptMembers.length > 0 ? (
                dept.bidang.length > 0 ? (
                  /* Grouped by Bidang */
                  <div className="space-y-4">
                    {dept.bidang.map((bidName) => {
                      const bidangMembers = deptMembers.filter((m) => m.bidang === bidName);
                      return (
                        <div key={bidName} className="p-3.5 rounded-sm border" style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}>
                          <div className="flex items-center justify-between pb-2 mb-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]" style={{ fontFamily: 'var(--font-display)' }}>
                              Bidang {bidName} ({bidangMembers.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAdd(dept.id, bidName)}
                              className="text-[10px] font-bold uppercase text-[var(--color-muted)] hover:underline inline-flex items-center gap-1"
                            >
                              <Plus size={11} />
                              <span>Tambah Anggota</span>
                            </button>
                          </div>

                          {bidangMembers.length > 0 ? (
                            <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                              {bidangMembers.map((m) => (
                                <div key={m.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <span className="font-bold text-xs block" style={{ color: 'var(--color-foreground)' }}>
                                      {m.name}
                                    </span>
                                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
                                      {m.roleTitle} {m.period && <span>&bull; Periode {m.period}</span>}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(m)}
                                      className="p-1.5 text-blue-600 hover:opacity-70"
                                      title="Edit"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStaffToDelete(m)}
                                      className="p-1.5 text-red-600 hover:opacity-70"
                                      title="Hapus"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-[var(--color-muted)] italic py-1">
                              Belum ada anggota yang ditugaskan di bidang {bidName}.
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Department Heads / General Staff outside specific bidang */}
                    {deptMembers.filter((m) => !m.bidang || !(dept.bidang as readonly string[]).includes(m.bidang || '')).length > 0 && (
                      <div className="p-3.5 rounded-sm border" style={{ backgroundColor: 'var(--color-wall)', borderColor: 'var(--color-line)' }}>
                        <span className="text-xs font-bold uppercase tracking-wider block pb-2 mb-2 border-b" style={{ borderColor: 'var(--color-line)', fontFamily: 'var(--font-display)' }}>
                          Pimpinan &amp; Pengurus Departemen
                        </span>
                        <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                          {deptMembers
                            .filter((m) => !m.bidang || !(dept.bidang as readonly string[]).includes(m.bidang || ''))
                            .map((m) => (
                              <div key={m.id} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="font-bold text-xs block" style={{ color: 'var(--color-foreground)' }}>
                                    {m.name}
                                  </span>
                                  <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
                                    {m.roleTitle} {m.period && <span>&bull; Periode {m.period}</span>}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(m)}
                                    className="p-1.5 text-blue-600 hover:opacity-70"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStaffToDelete(m)}
                                    className="p-1.5 text-red-600 hover:opacity-70"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard List without sub-bidang (Pembina, Ex-Officio) */
                  <div className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
                    {deptMembers.map((m) => (
                      <div key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs block" style={{ color: 'var(--color-foreground)' }}>
                            {m.name}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: 'var(--color-muted)' }}>
                            {m.roleTitle} {m.period && <span>&bull; Periode {m.period}</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 text-blue-600 hover:opacity-70"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToDelete(m)}
                            className="p-1.5 text-red-600 hover:opacity-70"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-[11px] text-[var(--color-muted)] italic py-2">
                  Belum ada data pengurus yang ditambahkan pada departemen ini.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(staffToDelete)}
        onClose={() => setStaffToDelete(null)}
        onConfirm={confirmDeleteStaff}
        title="Konfirmasi Hapus Anggota Pengurus"
        itemTitle={staffToDelete?.name}
        itemRubrik={staffToDelete?.roleTitle}
        warningMessage="Tindakan ini akan menghapus posisi kepengurusan anggota dari struktur organisasi portal LPM Reaksi."
        confirmButtonText="Ya, Hapus Pengurus"
      />
    </div>
  );
}