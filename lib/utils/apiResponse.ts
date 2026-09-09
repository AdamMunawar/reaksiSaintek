import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Smart Error Response Generator for LPM Reaksi.
 * Adheres strictly to the LPM Reaksi Editorial Bold design system:
 * - Color palette: #f4f4f0 (wall), #ffffff (surface), #1a1a1a (keyline), #1d4ed8 (blue accent)
 * - Sharp 2px-3px panel radii, hard offset shadows (3px 3px 0 0 #1d4ed8), uppercase stencil typography
 * - Serves rich branded HTML for browser requests (accept: text/html)
 * - Serves standard JSON { error: message } for API callers / fetch()
 */
export function apiErrorResponse(
  req: NextRequest | Request,
  message: string,
  status: number = 404,
  customTitle?: string
) {
  const accept = req.headers.get('accept') || '';
  const isBrowser = accept.includes('text/html');

  if (!isBrowser) {
    return NextResponse.json({ error: message }, { status });
  }

  const defaultTitles: Record<number, string> = {
    400: 'Permintaan Tidak Sesuai Format',
    401: 'Akses Ditolak — Sesi Diperlukan',
    403: 'Wewenang Terbatas Meja Redaksi',
    404: 'Naskah atau Halaman Tidak Ditemukan',
    405: 'Metode Permintaan Tidak Diizinkan',
    500: 'Gangguan Sistem Sementara',
  };

  const title = customTitle || defaultTitles[status] || 'Pemberitahuan Sistem';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status} — ${title} | LPM Reaksi</title>
  <link rel="icon" href="/icon.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-wall: #f4f4f0;
      --color-surface: #ffffff;
      --color-foreground: #0d0f0c;
      --color-muted: #6b7280;
      --color-line: #d1d5db;
      --color-keyline: #1a1a1a;
      --color-accent: #1d4ed8;
      --color-accent-hover: #1e40af;
      --color-accent-pale: #dbeafe;
      --shadow-offset: 4px 4px 0 0 #1d4ed8;
      --header-border: #1a1a1a;
      --logo-light-display: block;
      --logo-dark-display: none;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-wall: #0d0f0c;
        --color-surface: #161917;
        --color-foreground: #f4f4ef;
        --color-muted: #9ca3af;
        --color-line: #374151;
        --color-keyline: #f4f4ef;
        --color-accent: #3b82f6;
        --color-accent-hover: #2563eb;
        --color-accent-pale: #1e3a8a;
        --shadow-offset: 4px 4px 0 0 #3b82f6;
        --header-border: #374151;
        --logo-light-display: none;
        --logo-dark-display: block;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--color-wall);
      color: var(--color-foreground);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    
    /* Top Bar */
    .top-header {
      background-color: var(--color-surface);
      border-bottom: 2px solid var(--color-keyline);
      padding: 12px 20px;
    }
    .header-content {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
    }
    .brand-logo-light {
      display: var(--logo-light-display);
      height: 30px;
      width: auto;
    }
    .brand-logo-dark {
      display: var(--logo-dark-display);
      height: 30px;
      width: auto;
    }
    .brand-tagline {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      border-left: 2px solid var(--color-accent);
      padding-left: 10px;
      color: var(--color-muted);
      display: inline-block;
    }
    .header-nav-link {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-foreground);
      text-decoration: none;
      padding: 6px 12px;
      border: 1px solid var(--color-line);
      transition: all 0.15s ease;
    }
    .header-nav-link:hover {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    /* Main Area */
    .main-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
    }
    .editorial-card {
      max-width: 580px;
      width: 100%;
      background: var(--color-surface);
      border: 2px solid var(--color-keyline);
      box-shadow: var(--shadow-offset);
      border-radius: 2px;
      padding: 40px 32px;
      text-align: center;
      position: relative;
    }

    /* Registration Ticks (LPM Reaksi aesthetic) */
    .corner-tick {
      position: absolute;
      width: 8px;
      height: 8px;
      border-color: var(--color-keyline);
    }
    .tick-tl { top: -2px; left: -2px; border-top: 2px solid; border-left: 2px solid; }
    .tick-tr { top: -2px; right: -2px; border-top: 2px solid; border-right: 2px solid; }
    .tick-bl { bottom: -2px; left: -2px; border-bottom: 2px solid; border-left: 2px solid; }
    .tick-br { bottom: -2px; right: -2px; border-bottom: 2px solid; border-right: 2px solid; }

    .badge-stencil {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--color-accent);
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 2px;
      margin-bottom: 16px;
    }

    .error-code {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 68px;
      font-weight: 900;
      letter-spacing: -0.04em;
      line-height: 1;
      color: var(--color-foreground);
      margin-bottom: 8px;
    }

    .error-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 19px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      color: var(--color-foreground);
      margin-bottom: 12px;
    }

    .error-message {
      font-size: 13px;
      color: var(--color-muted);
      max-width: 440px;
      margin: 0 auto 28px auto;
      line-height: 1.6;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-bottom: 24px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 2px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .btn-primary {
      background-color: var(--color-accent);
      color: #ffffff;
      border: 1px solid var(--color-accent);
    }
    .btn-primary:hover {
      background-color: var(--color-accent-hover);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background-color: transparent;
      color: var(--color-foreground);
      border: 1px solid var(--color-line);
    }
    .btn-secondary:hover {
      border-color: var(--color-keyline);
      transform: translateY(-1px);
    }

    /* Tech details */
    details {
      border-top: 1px solid var(--color-line);
      margin-top: 20px;
      padding-top: 16px;
      text-align: left;
    }
    summary {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-muted);
      cursor: pointer;
      user-select: none;
      outline: none;
    }
    summary:hover {
      color: var(--color-accent);
    }
    pre {
      margin-top: 10px;
      background-color: var(--color-wall);
      border: 1px solid var(--color-line);
      padding: 12px;
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      color: var(--color-foreground);
      overflow-x: auto;
      border-radius: 2px;
    }

    /* Footer */
    .footer-bar {
      background-color: var(--color-surface);
      border-top: 1px solid var(--color-line);
      padding: 14px 20px;
      text-align: center;
      font-size: 11px;
      color: var(--color-muted);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    @media (max-width: 480px) {
      .editorial-card { padding: 32px 20px; }
      .brand-tagline { display: none; }
      .error-code { font-size: 54px; }
      .error-title { font-size: 16px; }
    }
  </style>
</head>
<body>
  <!-- Header Banner -->
  <header class="top-header">
    <div class="header-content">
      <a href="/" class="brand-group" aria-label="LPM Reaksi">
        <img src="/images/reaksi.png" alt="Logo LPM Reaksi" class="brand-logo-light" />
        <img src="/images/reaksi-dark.png" alt="Logo LPM Reaksi" class="brand-logo-dark" />
        <span class="brand-tagline">Tumbuh, Berkembang, Bersama</span>
      </a>
      <a href="/" class="header-nav-link">Beranda Portal</a>
    </div>
  </header>

  <!-- Main Card -->
  <main class="main-wrapper">
    <div class="editorial-card">
      <div class="corner-tick tick-tl"></div>
      <div class="corner-tick tick-tr"></div>
      <div class="corner-tick tick-bl"></div>
      <div class="corner-tick tick-br"></div>

      <div class="badge-stencil">
        <span>Warta Redaksi</span>
      </div>

      <div class="error-code">${status}</div>
      <h1 class="error-title">${title}</h1>
      <p class="error-message">${message}</p>

      <div class="button-group">
        <a href="/" class="btn btn-primary">
          ← Kembali ke Beranda
        </a>
        <a href="/cari" class="btn btn-secondary">
          Cari di Portal
        </a>
      </div>

      <details>
        <summary>Informasi Teknis Endpoint (JSON)</summary>
        <pre>HTTP/1.1 ${status}
Content-Type: application/json

${JSON.stringify({ error: message, status, timestamp: new Date().toISOString() }, null, 2)}</pre>
      </details>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer-bar">
    © 2026 LPM Reaksi Saintek · UIN Sunan Gunung Djati Bandung
  </footer>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
