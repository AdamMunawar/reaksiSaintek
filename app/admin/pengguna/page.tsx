'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db/repository';
import { User, UserRole } from '@/lib/db/schema';
import { PageTitle } from '@/components/ui/PageTitle';
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import DeleteConfirmModal from '@/components/ui/DeleteConfirmModal';

const ROLES: UserRole[] = ['superadmin', 'pemred', 'redaktur', 'pengurus', 'kontributor'];

const ROLE_BADGES: Record<UserRole, { label: string; bg: string }> = {
  superadmin: { label: 'Superadmin', bg: '#dc2626' },
  pemred: { label: 'Pemimpin Redaksi', bg: '#7c3aed' },
  redaktur: { label: 'Redaktur', bg: '#2563eb' },
  pengurus: { label: 'Pengurus', bg: '#059669' },
  kontributor: { label: 'Kontributor', bg: '#ea580c' },
  guest: { label: 'Tamu / Demo', bg: '#475569' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('pengurus');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          return;
        }
      }
    } catch (e) {}
    setUsers(db.getUsers());
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('pengurus');
    setInstitution('UIN SGD Bandung');
    setPhone('');
    setBio('');
    setIsEditing(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setShowPassword(false);
    setRole(u.role);
    setInstitution(u.institution || '');
    setPhone(u.phone || '');
    setBio(u.bio || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (!editId && (!password.trim() || password.trim().length < 6)) {
      setNotification({ type: 'error', message: 'Kata sandi akun baru wajib diisi minimal 6 karakter.' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (editId && password.trim() && password.trim().length < 6) {
      setNotification({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setIsSaving(true);

    try {
      // 1. Sync to Supabase PostgreSQL via API
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId || undefined,
          name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim() || undefined,
          institution: institution.trim() || undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyimpan data ke server.');
      }
    } catch (apiErr: any) {
      console.warn('API User save notice:', apiErr.message);
    }

    // 2. Save locally in repository store
    db.saveUser({
      id: editId || undefined,
      name: name.trim(),
      email: email.trim(),
      role,
      password: password.trim() || undefined,
      institution: institution.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
    });

    setIsSaving(false);
    setNotification({ type: 'success', message: 'Akun pengguna / staf redaksi berhasil disimpan!' });
    setIsEditing(false);
    loadUsers();
    setTimeout(() => setNotification(null), 3000);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      try {
        await fetch(`/api/users?id=${encodeURIComponent(userToDelete.id)}`, { method: 'DELETE' });
      } catch (e) {}

      db.deleteUser(userToDelete.id);
      setNotification({ type: 'success', message: `Akun "${userToDelete.name}" berhasil dihapus.` });
      setUserToDelete(null);
      loadUsers();
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle title="Kelola Pengguna" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
          >
            Kelola Pengguna &amp; Akses Staf
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
            Manajemen akun, penugasan role (*Superadmin, Pemred, Redaktur, Pengurus, Kontributor*).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white w-full sm:w-auto"
          style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
        >
          <UserPlus size={14} />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 border text-xs font-bold rounded-none flex items-center gap-2 ${
            notification.type === 'error'
              ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Form Dialog */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="p-6 rounded-sm space-y-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-keyline)',
            boxShadow: 'var(--shadow-hard-lg)',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-line)' }}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <KeyRound size={16} style={{ color: 'var(--color-accent)' }} />
              <span>{editId ? 'Edit Akun Pengguna & Kredensial' : 'Buat Akun Staf / Kontributor Baru'}</span>
            </h3>
            <span className="text-[10px] font-semibold text-[var(--color-muted)]">
              Tersambung ke Supabase Auth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Siti Nurhaliza"
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
                Email Login *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@reaksi.id"
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
                {editId ? 'Ubah Kata Sandi (Opsional)' : 'Kata Sandi Akun *'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editId ? 'Kosongkan jika tetap...' : 'Minimal 6 karakter...'}
                  minLength={editId && !password ? undefined : 6}
                  required={!editId}
                  className="w-full pl-3 pr-10 py-2 text-xs font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    border: '1px solid var(--color-line)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--color-muted)' }}>
                {editId ? 'Kosongkan jika tidak ingin mengubah kata sandi akun ini.' : 'Kata sandi akun terenkripsi bcrypt (min. 6 karakter).'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Hak Akses (Role) *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs font-bold uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_BADGES[r].label} ({r})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Institusi / Jurusan
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Teknik Informatika 2024 - FST"
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
                Nomor Telepon / WA (Opsional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  border: '1px solid var(--color-line)',
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-line)' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border hover:opacity-70 disabled:opacity-50"
              style={{ borderColor: 'var(--color-line)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Akun'}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div
        className="p-5 rounded-sm"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '2px solid var(--color-keyline)',
          boxShadow: 'var(--shadow-hard)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-xs border-collapse">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-keyline)', fontFamily: 'var(--font-display)' }}>
                <th className="p-3 uppercase font-bold tracking-wider">Pengguna</th>
                <th className="p-3 uppercase font-bold tracking-wider">Email</th>
                <th className="p-3 uppercase font-bold tracking-wider">Role</th>
                <th className="p-3 uppercase font-bold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-line)' }}>
              {users.map((u) => {
                const badge = ROLE_BADGES[u.role] || ROLE_BADGES.redaktur;
                return (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3">
                      <span className="font-bold block" style={{ color: 'var(--color-foreground)' }}>
                        {u.name}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        {u.institution || 'FST UIN SGD'}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px]" style={{ color: 'var(--color-foreground)' }}>
                      {u.email}
                    </td>

                    <td className="p-3">
                      <span
                        className="text-[9px] font-extrabold uppercase px-2 py-0.5 text-white"
                        style={{ backgroundColor: badge.bg, fontFamily: 'var(--font-display)' }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1 text-blue-600 hover:opacity-70"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="p-1 text-red-600 hover:opacity-70"
                        title="Hapus Akun Pengguna"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Konfirmasi Hapus Akun Pengguna"
        itemTitle={userToDelete?.name}
        itemRubrik={userToDelete?.role ? ROLE_BADGES[userToDelete.role]?.label || userToDelete.role : undefined}
        itemAuthor={userToDelete?.email}
        warningMessage={`Akun "${userToDelete?.name}" (${userToDelete?.email}) akan dihapus secara permanen dari sistem. Pengguna tidak dapat lagi masuk ke Meja Redaksi.`}
        confirmButtonText="Ya, Hapus Akun"
      />
    </div>
  );
}