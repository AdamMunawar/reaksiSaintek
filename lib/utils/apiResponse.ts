import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Smart Error Response Generator for LPM Reaksi.
 * - If called from a web browser (accept: text/html), renders a beautiful, styled error UI.
 * - If called from API fetch/curl (accept: application/json or non-html), returns clean JSON.
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
    400: 'Permintaan Tidak Valid',
    401: 'Akses Ditolak (Perlu Login)',
    403: 'Wewenang Terbatas',
    404: 'Halaman atau Data Tidak Ditemukan',
    405: 'Metode Tidak Diizinkan',
    500: 'Terjadi Kesalahan Server',
  };

  const title = customTitle || defaultTitles[status] || 'Terjadi Kendala';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status} — ${title} | LPM Reaksi</title>
  <link rel="icon" href="/icon.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f2937;
      --text: #f3f4f6;
      --muted: #9ca3af;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --gradient-status: linear-gradient(135deg, #f59e0b, #d97706);
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card: #ffffff;
        --border: #e2e8f0;
        --text: #0f172a;
        --muted: #64748b;
        --accent: #2563eb;
        --accent-hover: #1d4ed8;
        --gradient-status: linear-gradient(135deg, #d97706, #b45309);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      line-height: 1.6;
    }
    .container {
      max-width: 540px;
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 44px 32px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      animation: fadeIn 0.35s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .brand-header {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      padding: 6px 16px;
      background: rgba(37, 99, 235, 0.08);
      border: 1px solid rgba(37, 99, 235, 0.2);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .status-badge {
      font-size: 76px;
      font-weight: 900;
      letter-spacing: -0.05em;
      line-height: 1;
      margin-bottom: 12px;
      background: var(--gradient-status);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 10px;
    }
    .message {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 28px;
      max-width: 440px;
      margin-left: auto;
      margin-right: auto;
    }
    .actions {
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
      padding: 11px 22px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border: 1px solid var(--accent);
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--muted);
      transform: translateY(-2px);
    }
    details {
      text-align: left;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      font-size: 12px;
    }
    summary {
      color: var(--muted);
      cursor: pointer;
      font-weight: 600;
      user-select: none;
      outline: none;
    }
    summary:hover {
      color: var(--text);
    }
    pre {
      margin-top: 12px;
      background: rgba(0, 0, 0, 0.35);
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: #38bdf8;
      border: 1px solid var(--border);
    }
    .footer-note {
      margin-top: 24px;
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <span>Portal Berita LPM Reaksi</span>
    </div>
    <div class="status-badge">${status}</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    <div class="actions">
      <a href="/" class="btn btn-primary">
        ← Kembali ke Beranda
      </a>
      <a href="/cari" class="btn btn-secondary">
         Cari Berita
      </a>
    </div>
    <details>
      <summary>Lihat Respon Teknis (JSON Raw)</summary>
      <pre>HTTP/1.1 ${status}
Content-Type: application/json

${JSON.stringify({ error: message, status, timestamp: new Date().toISOString() }, null, 2)}</pre>
    </details>
    <div class="footer-note">
      Lembaga Pers Mahasiswa Reaksi FST UIN SGD Bandung
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
