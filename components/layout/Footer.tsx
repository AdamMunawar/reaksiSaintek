import Link from 'next/link';
import Image from 'next/image';

const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.13 8.13 0 004.77 1.52V6.77a4.85 4.85 0 01-1-.08z" />
  </svg>
);

const SOCIAL_LINKS = [
  { Icon: InstagramIcon, href: 'https://instagram.com/lpmreaksi_', label: 'Instagram' },
  { Icon: YoutubeIcon, href: 'https://youtube.com/@lpmreaksi', label: 'YouTube' },
  { Icon: TikTokIcon, href: 'https://tiktok.com/@lpmreaksi', label: 'TikTok' },
];

const NAV_LINKS = [
  { href: '/tentang', label: 'Tentang Kami' },
  { href: '/redaksi', label: 'Susunan Redaksi' },
  { href: '/e-paper', label: 'E-Paper & Tabloid' },
  { href: '/kirim-tulisan', label: 'Kirim Tulisan' },
  { href: '/media-partner', label: 'Media Partner' },
];

const LEGAL_LINKS = [
  { href: '/pedoman-media-siber', label: 'Pedoman Media Siber' },
  { href: '/media-partner', label: 'SOP Kerjasama' },
];

export default function Footer() {
  return (
    <footer
      className="font-sans transition-colors"
      style={{
        background: 'var(--color-surface)',
        borderTop: '2px solid var(--color-keyline)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer row */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-8"
          style={{ borderBottom: '1px solid var(--color-line)' }}
        >
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="inline-block">
              <Image
                src="/images/reaksi.png"
                alt="Logo LPM Reaksi"
                width={120}
                height={30}
                className="h-7 w-auto object-contain dark:hidden"
              />
              <Image
                src="/images/reaksi-dark.png"
                alt="Logo LPM Reaksi"
                width={120}
                height={30}
                className="h-7 w-auto object-contain hidden dark:block"
              />
            </Link>
            <p
              className="text-[11px] font-semibold max-w-xs leading-relaxed"
              style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}
            >
              Lembaga Pers Mahasiswa Reaksi Saintek UIN Sunan Gunung Djati Bandung <br>
              </br>
              Tumbuh Berkembang Bersama
            </p>
          </div>

          {/* Nav + Social */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
            {/* Quick nav */}
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-[12px] font-bold uppercase tracking-[0.06em] transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-display)' }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center transition-all hover:translate-y-[-2px]"
                  style={{
                    border: '2px solid var(--color-keyline)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-foreground)',
                    boxShadow: 'var(--shadow-hard-sm)',
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 text-[11px]" style={{ color: 'var(--color-muted)' }}>
          <p style={{ fontFamily: 'var(--font-body)' }}>
            &copy; {new Date().getFullYear()} LPM Reaksi. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="font-semibold transition-opacity hover:opacity-60"
                style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
