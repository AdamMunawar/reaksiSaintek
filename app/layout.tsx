import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Lora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const defaultSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://reaksisaintek.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(defaultSiteUrl),
  title: {
    default: "Portal Berita Mahasiswa | LPM Reaksi FST UIN Bandung",
    template: "%s | LPM Reaksi",
  },
  description:
    "Portal berita mahasiswa LPM Reaksi, Fakultas Sains dan Teknologi UIN Sunan Gunung Djati Bandung. Jurnalisme mahasiswa yang kritis, independen, dan bertanggung jawab.",
  keywords: [
    "LPM Reaksi",
    "pers mahasiswa",
    "UIN SGD Bandung",
    "FST",
    "berita kampus",
    "jurnalisme mahasiswa",
  ],
  authors: [{ name: "LPM Reaksi" }],
  openGraph: {
    siteName: "LPM Reaksi",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: '/images/reaksi logos.png',
    shortcut: '/images/reaksi logos.png',
    apple: '/images/reaksi logos.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { AuthProvider } from "@/lib/auth/authContext";
import ConsoleErrorShield from "@/components/common/ConsoleErrorShield";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable} ${lora.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col antialiased">
        <ConsoleErrorShield />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem={false}
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
