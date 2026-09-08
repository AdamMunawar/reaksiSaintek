'use client';

export function PageTitle({ title }: { title?: string }) {
  const fullTitle = title && title.trim()
    ? `${title} | LPM Reaksi`
    : 'Portal Berita LPM Reaksi — FST UIN SGD Bandung';

  return <title>{fullTitle}</title>;
}
