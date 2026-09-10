'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import { UserRole } from '@/lib/db/schema';
import {
  LayoutDashboard,
  FileText,
  PenTool,
  CheckSquare,
  Image as ImageIcon,
  FileCode2,
  Users,
  Shield,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Tags,
  Loader2,
  Newspaper,
  Handshake,
} from 'lucide-react';

const ROLE_BADGES: Record<UserRole, { label: string; color: string; bg: string }> = {
  superadmin: { label: 'Superadmin', color: '#ffffff', bg: '#dc2626' },
  pemred: { label: 'Pemimpin Redaksi', color: '#ffffff', bg: '#7c3aed' },
  redaktur: { label: 'Redaktur', color: '#ffffff', bg: '#2563eb' },
  pengurus: { label: 'Pengurus', color: '#ffffff', bg: '#059669' },
  kontributor: { label: 'Kontributor', color: '#ffffff', bg: '#ea580c' },
  guest: { label: 'Tamu / Demo', color: '#ffffff', bg: '#475569' },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout, canManageUsers, canManagePages, canReview, canWriteArticle } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [publicSiteUrl, setPublicSiteUrl] = useState('/');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const mainOrigin = origin.replace('//cms.', '//').replace('//redaksi.', '//');
      setPublicSiteUrl(mainOrigin);
    }
  }, []);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      router.push('/login');
    }, 500);
  };

  // Active Role badge
  const currentRole = (role === 'guest' ? 'superadmin' : role) as UserRole;
  const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.superadmin;

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { href: '/admin/artikel', label: 'Semua Artikel', icon: FileText, show: true },
    { href: '/admin/artikel/tulis', label: 'Tulis Artikel', icon: PenTool, show: canWriteArticle },
    { href: '/admin/epaper', label: 'E-Paper & Tabloid', icon: Newspaper, show: true },
    { href: '/admin/rubrik', label: 'Kelola Rubrik', icon: Tags, show: canManagePages || role === 'guest' },
    { href: '/admin/review', label: 'Review & Approval', icon: CheckSquare, show: canReview || role === 'guest' },
    { href: '/admin/media', label: 'Media Library', icon: ImageIcon, show: true },
    { href: '/admin/halaman', label: 'Halaman Lembaga', icon: BookOpen, show: canManagePages || role === 'guest' },
    { href: '/admin/media-partner', label: 'Media Partner', icon: Handshake, show: canManagePages || role === 'guest' },
    { href: '/admin/redaksi', label: 'Susunan Redaksi', icon: Shield, show: canManagePages || role === 'guest' },
    { href: '/admin/pengguna', label: 'Kelola Pengguna', icon: Users, show: canManageUsers || role === 'guest' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row transition-colors"
      style={{ backgroundColor: 'var(--color-wall)', color: 'var(--color-foreground)' }}
    >
      {/* ── SIDEBAR (DESKTOP) ── */}
      <aside
        className="hidden md:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRight: '2px solid var(--color-keyline)',
        }}
      >
        {/* Brand */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-line)' }}>
          <Link href="/admin" className="inline-block" title="Dashboard Meja Redaksi">
            <Image
              src="/images/reaksi.png"
              alt="LPM Reaksi"
              width={120}
              height={30}
              className="h-7 w-auto object-contain dark:hidden"
            />
            <Image
              src="/images/reaksi-dark.png"
              alt="LPM Reaksi"
              width={120}
              height={30}
              className="h-7 w-auto object-contain hidden dark:block"
            />
          </Link>
          <span
            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5"
            style={{ backgroundColor: badge.bg, color: badge.color, fontFamily: 'var(--font-display)' }}
          >
            CMS
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.filter((i) => i.show).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'text-white'
                    : 'hover:opacity-70'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-foreground)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & quick role switch */}
        <div className="p-4" style={{ borderTop: '1px solid var(--color-line)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold block truncate" style={{ color: 'var(--color-foreground)' }}>
                {user?.name || 'Ahmad Fauzi (Superadmin)'}
              </span>
              <span
                className="text-[9px] font-bold uppercase px-1.5 py-0.2 inline-block"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-[var(--color-muted)] hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Keluar dari Meja Redaksi"
            >
              <LogOut size={16} />
            </button>
          </div>

          <a
            href={publicSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider py-1.5 px-2 hover:opacity-70 transition-opacity"
            style={{
              backgroundColor: 'var(--color-wall)',
              border: '1px solid var(--color-line)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-display)',
            }}
            title="Buka Website Utama LPM Reaksi di tab baru"
          >
            <span>Buka Web Publik</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </aside>

      {/* ── MOBILE HEADER ── */}
      <header
        className="md:hidden flex items-center justify-between p-4 sticky top-0 z-30"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '2px solid var(--color-keyline)',
        }}
      >
        <Link href="/admin" className="inline-block" title="Dashboard Meja Redaksi">
          <Image
            src="/images/reaksi.png"
            alt="LPM Reaksi"
            width={100}
            height={26}
            className="h-6 w-auto object-contain dark:hidden"
          />
          <Image
            src="/images/reaksi-dark.png"
            alt="LPM Reaksi"
            width={100}
            height={26}
            className="h-6 w-auto object-contain hidden dark:block"
          />
        </Link>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-extrabold uppercase px-1.5 py-0.5"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col p-4"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex justify-between items-center pb-4 mb-4" style={{ borderBottom: '1px solid var(--color-line)' }}>
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>Menu Admin Meja Redaksi</span>
            <button onClick={() => setMobileSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="space-y-2 flex-1 overflow-y-auto">
            {navItems.filter((i) => i.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: pathname === item.href ? 'var(--color-accent)' : 'var(--color-wall)',
                  color: pathname === item.href ? '#ffffff' : 'var(--color-foreground)',
                }}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Mobile drawer bottom user info & logout */}
          <div className="pt-4 mt-auto border-t space-y-2.5" style={{ borderColor: 'var(--color-line)' }}>
            <div className="flex items-center justify-between px-1">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold block truncate" style={{ color: 'var(--color-foreground)' }}>
                  {user?.name || 'Staf Redaksi'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {user?.email || 'admin@reaksi.id'}
                </span>
              </div>
              <span
                className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 text-white"
                style={{ backgroundColor: badge.bg }}
              >
                {badge.label}
              </span>
            </div>

            <a
              href={publicSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-wall)',
                border: '1px solid var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <ExternalLink size={13} />
              <span>Buka Web Publik</span>
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <LogOut size={15} />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with Active User Session Badge */}
        <div
          className="px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-semibold"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-line)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              Akun Masuk:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: 'var(--color-foreground)' }}>
                {user?.name || 'Staf Redaksi'}
              </span>
              <span
                className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white"
                style={{ backgroundColor: badge.bg, fontFamily: 'var(--font-display)' }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] hidden sm:inline" style={{ color: 'var(--color-muted)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <a
              href={publicSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-wall)',
                border: '1px solid var(--color-line)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-display)',
              }}
              title="Kunjungi Website Utama di tab baru"
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">Web Utama</span>
            </a>
          </div>
        </div>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Logout Loading Modal Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="p-6 max-w-sm w-full rounded-sm border shadow-2xl text-center space-y-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
          >
            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-600">
              <Loader2 size={26} className="animate-spin" />
            </div>
            <div>
              <h3
                className="text-sm font-extrabold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-foreground)' }}
              >
                Mengakhiri Sesi Redaksi...
              </h3>
              <p className="text-[11px] mt-1.5 text-[var(--color-muted)]">
                Membersihkan sesi kerja dan mengembalikan ke halaman masuk...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
