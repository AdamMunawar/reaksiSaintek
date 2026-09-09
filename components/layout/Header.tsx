'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Menu, X, Sun, Moon, User as UserIcon, LogIn, LayoutDashboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';

import { db } from '@/lib/db/repository';

function HeaderAuthAction() {
  const { user, role, isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:opacity-75 flex-shrink-0"
        style={{
          border: '1px solid var(--color-line)',
          color: 'var(--color-foreground)',
          fontFamily: 'var(--font-display)',
        }}
        title="Masuk Meja Redaksi"
        suppressHydrationWarning
      >
        <LogIn size={13} />
        <span>Login</span>
      </Link>
    );
  }

  if (isLoggedIn && user) {
    const isKontributor = role === 'kontributor';
    const targetUrl = isKontributor ? '/kontributor' : '/admin';
    const label = isKontributor ? 'Portal Kontributor' : 'Meja Redaksi';

    return (
      <Link
        href={targetUrl}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white transition-opacity hover:opacity-90 flex-shrink-0"
        style={{
          backgroundColor: isKontributor ? '#ea580c' : 'var(--color-accent)',
          fontFamily: 'var(--font-display)',
        }}
        title={label}
        suppressHydrationWarning
      >
        <LayoutDashboard size={13} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:opacity-75 flex-shrink-0"
      style={{
        border: '1px solid var(--color-line)',
        color: 'var(--color-foreground)',
        fontFamily: 'var(--font-display)',
      }}
      title="Masuk Meja Redaksi"
      suppressHydrationWarning
    >
      <LogIn size={13} />
      <span>Login</span>
    </Link>
  );
}

const DEFAULT_NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/kabar-kampus', label: 'Kampusiana' },
  { href: '/selisik', label: 'Selisik' },
  { href: '/saintek', label: 'Saintek' },
  { href: '/opini', label: 'Opini' },
  { href: '/feature', label: 'Feature' },
  { href: '/lensa-kata', label: 'Lensa Kata' },
  { href: '/infografik', label: 'Data Visual' },
  { href: '/e-paper', label: 'E-Paper' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [navLinks, setNavLinks] = useState(DEFAULT_NAV_LINKS);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const syncNav = () => {
      const list = db.getRubriks();
      if (list && list.length > 0) {
        // Exclude epaper rubrik from dynamic rubrik list to avoid duplicate links
        const filteredRubriks = list.filter(
          (r) => r.slug !== 'epaper' && r.slug !== 'e-paper' && r.name.toLowerCase() !== 'e-paper'
        );

        setNavLinks([
          { href: '/', label: 'Beranda' },
          ...filteredRubriks.map((r) => ({ href: `/${r.slug}`, label: r.name })),
          { href: '/e-paper', label: 'E-Paper' },
        ]);
      }
    };
    syncNav();
    window.addEventListener('storage', syncNav);
    return () => window.removeEventListener('storage', syncNav);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 font-sans transition-colors"
      style={{ backgroundColor: 'var(--color-surface)', borderBottom: '2px solid var(--color-keyline)' }}
    >
      {/* ── TOP BAR: Logo + Tagline + Utilities ── */}
      <div style={{ borderBottom: '1px solid var(--color-line)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px] sm:h-[68px]">

            {/* Logo */}
            <Link href="/" aria-label="LPM Reaksi — Beranda" className="flex items-center gap-3 flex-shrink-0">
              <Image
                src="/images/reaksi.png"
                alt="Logo LPM Reaksi"
                width={130}
                height={34}
                className="h-7 sm:h-8 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/images/reaksi-dark.png"
                alt="Logo LPM Reaksi"
                width={130}
                height={34}
                className="h-7 sm:h-8 w-auto object-contain hidden dark:block"
                priority
              />
              {/* Tagline pill - hidden on mobile */}
              <span
                className="hidden sm:inline-flex items-center text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 border-l-2 ml-2 pl-3"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-muted)' }}
              >Tumbuh, Berkembang, Bersama
              </span>
            </Link>
            {/* Right: search + dark mode + hamburger */}
            <div className="flex items-center gap-2">
              {/* Desktop search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input
                  type="search"
                  placeholder="Cari artikel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-44 lg:w-52 h-8 pl-3 pr-8 text-[12px] font-medium"
                  style={{
                    border: '2px solid var(--color-keyline)',
                    background: 'var(--color-wall)',
                    color: 'var(--color-foreground)',
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                  }}
                />
                <button
                  type="submit"
                  aria-label="Cari"
                  className="absolute right-2 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <Search size={14} />
                </button>
              </form>

              {/* Login / Dashboard Link (Desktop/Tablet) */}
              <div className="hidden sm:flex items-center">
                <HeaderAuthAction />
              </div>

              {/* Theme toggle */}
              {mounted && (
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Ganti tema"
                  className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              )}

              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Cari"
                className="md:hidden w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
                style={{ color: 'var(--color-muted)' }}
              >
                <Search size={16} />
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
                className="lg:hidden w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
                style={{ color: 'var(--color-foreground)' }}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION BAR (desktop) ── */}
      <div className="hidden lg:block" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center overflow-x-auto no-scrollbar">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-shrink-0 px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-all whitespace-nowrap border-b-[3px] border-transparent hover:border-[var(--color-accent)]"
                style={{
                  color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 top-0 z-40 flex"
          style={{ background: 'rgba(13,15,12,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 h-full overflow-y-auto"
            style={{
              background: 'var(--color-surface)',
              borderRight: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '2px solid var(--color-keyline)' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>
                Menu &amp; Navigasi
              </span>
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--color-foreground)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Mobile Auth / Meja Redaksi Card */}
            <div className="p-3.5 border-b" style={{ borderColor: 'var(--color-line)', backgroundColor: 'var(--color-wall)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>
                Akses Redaksi &amp; Penulis
              </span>
              <HeaderAuthAction />
            </div>

            <div className="p-4">
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-3 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-all"
                  style={{
                    borderBottom: '1px solid var(--color-line)',
                    color: 'var(--color-foreground)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {item.label}
                </Link>
              ))}

              <div className="flex flex-wrap gap-2.5 pt-5 mt-2 text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>
                <Link href="/tentang" onClick={() => setMobileOpen(false)} className="hover:underline">Tentang</Link>
                <span>&bull;</span>
                <Link href="/redaksi" onClick={() => setMobileOpen(false)} className="hover:underline">Redaksi</Link>
                <span>&bull;</span>
                <Link href="/kirim-tulisan" onClick={() => setMobileOpen(false)} className="hover:underline">Kirim Tulisan</Link>
                <span>&bull;</span>
                <Link href="/media-partner" onClick={() => setMobileOpen(false)} className="hover:underline">Media Partner</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE SEARCH MODAL ── */}
      {searchOpen && (
        <div
          className="md:hidden fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4"
          style={{ background: 'rgba(13,15,12,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
        >
          <div
            className="w-full max-w-sm p-4"
            style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-keyline)',
              boxShadow: 'var(--shadow-hard-lg)',
            }}
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                type="search"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10 px-3 text-sm"
                style={{
                  border: '2px solid var(--color-keyline)',
                  background: 'var(--color-wall)',
                  color: 'var(--color-foreground)',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                style={{ color: 'var(--color-muted)' }}
              >
                <X size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
