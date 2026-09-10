'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Menu, X, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/repository';

export interface NavLinkItem {
  href: string;
  label: string;
  slug?: string;
  subRubriks?: string[];
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { href: '/', label: 'Beranda' },
  { href: '/e-paper', label: 'E-Paper', slug: 'e-paper' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [navLinks, setNavLinks] = useState<NavLinkItem[]>(DEFAULT_NAV_LINKS);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [expandedMobileRubrik, setExpandedMobileRubrik] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const parseSubList = (raw: any): string[] => {
      if (Array.isArray(raw)) return raw.filter((s) => typeof s === 'string' && s.trim());
      if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === 'string' && s.trim());
        } catch (_) {}
      }
      return [];
    };

    const buildNav = (items: any[]) => {
      const filtered = items.filter(
        (r: any) => r && r.slug !== 'epaper' && r.slug !== 'e-paper' && r.name?.toLowerCase() !== 'e-paper'
      );
      return [
        { href: '/', label: 'Beranda' },
        ...filtered.map((r: any) => ({
          href: `/${r.slug}`,
          label: r.name,
          slug: r.slug,
          subRubriks: parseSubList(r.subRubriks || r.sub_rubriks),
        })),
        { href: '/e-paper', label: 'E-Paper', slug: 'e-paper' },
      ];
    };

    // 1. Immediately hydrate from cache to prevent navbar disappearing into 2 links
    try {
      const cached = localStorage.getItem('reaksi_nav_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 2) {
          setNavLinks(parsed);
        }
      }
    } catch (_) {}

    // 2. Hydrate from db repository if available
    const localRubriks = db.getRubriks() || [];
    if (localRubriks.length > 0) {
      const built = buildNav(localRubriks);
      setNavLinks(built);
      try {
        localStorage.setItem('reaksi_nav_cache', JSON.stringify(built));
      } catch (_) {}
    }

    const syncNav = () => {
      const list = db.getRubriks() || [];
      if (list.length > 0) {
        const built = buildNav(list);
        setNavLinks(built);
        try {
          localStorage.setItem('reaksi_nav_cache', JSON.stringify(built));
        } catch (_) {}
      }
    };

    // 3. Live sync from backend API
    fetch('/api/rubriks')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const built = buildNav(data);
          setNavLinks(built);
          try {
            localStorage.setItem('reaksi_nav_cache', JSON.stringify(built));
          } catch (_) {}
          db.syncRubriksFromRemote(data);
        }
      })
      .catch(() => {});

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
                  type="text"
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
      <div className="hidden lg:block relative z-40" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center flex-wrap overflow-visible relative">
            {navLinks.map((item) => {
              const hasSubs = item.subRubriks && item.subRubriks.length > 0;
              const isOpen = activeDropdown === (item.slug || item.href);
              if (hasSubs) {
                return (
                  <div
                    key={item.href}
                    className="relative group flex-shrink-0"
                    onMouseEnter={() => setActiveDropdown(item.slug || item.href)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.08em] transition-all whitespace-nowrap border-b-[3px] border-transparent group-hover:border-[var(--color-accent)]"
                      style={{
                        color: 'var(--color-foreground)',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={12}
                        className={`ml-1 opacity-70 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-[var(--color-accent)]' : 'group-hover:rotate-180'
                        }`}
                      />
                    </Link>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute top-full left-0 z-50 min-w-[210px] py-1.5 transition-all duration-150 ${
                        isOpen
                          ? 'opacity-100 visible pointer-events-auto'
                          : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto'
                      }`}
                      style={{
                        background: 'var(--color-surface)',
                        border: '2px solid var(--color-keyline)',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--color-muted)' }}>
                        Kategori {item.label}
                      </div>
                      {item.subRubriks!.map((sub) => (
                        <Link
                          key={sub}
                          href={`/${item.slug || item.href.replace('/', '')}?sub=${encodeURIComponent(sub)}`}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3 py-2 text-[12px] font-semibold hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)] transition-colors"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {sub}
                        </Link>
                      ))}
                      <div className="my-1" style={{ borderTop: '1px solid var(--color-line)' }} />
                      <Link
                        href={item.href}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] hover:text-[var(--color-accent)] transition-colors"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        Semua Berita {item.label} &rarr;
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
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
              );
            })}
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

            <div className="p-4">
              {navLinks.map((item) => {
                const hasSubs = item.subRubriks && item.subRubriks.length > 0;
                const isExpanded = expandedMobileRubrik === item.slug;

                if (hasSubs) {
                  return (
                    <div key={item.href} style={{ borderBottom: '1px solid var(--color-line)' }}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex-1 py-3 text-[13px] font-bold uppercase tracking-[0.06em]"
                          style={{
                            color: 'var(--color-foreground)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedMobileRubrik(isExpanded ? null : (item.slug || null))}
                          className="p-3 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          aria-label={`Toggle sub ${item.label}`}
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pl-3 pb-2 space-y-1">
                          {item.subRubriks!.map((sub) => (
                            <Link
                              key={sub}
                              href={`/${item.slug || item.href.replace('/', '')}?sub=${encodeURIComponent(sub)}`}
                              onClick={() => setMobileOpen(false)}
                              className="block py-1.5 text-[12px] font-medium transition-colors hover:text-[var(--color-accent)]"
                              style={{ color: 'var(--color-muted)' }}
                            >
                              &bull; {sub}
                            </Link>
                          ))}
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block py-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--color-accent)]"
                          >
                            Semua {item.label} &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-1 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-all"
                    style={{
                      borderBottom: '1px solid var(--color-line)',
                      color: 'var(--color-foreground)',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}

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
                type="text"
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
