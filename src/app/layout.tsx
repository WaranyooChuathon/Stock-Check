import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { DemoBanner } from '@/components/DemoBanner';
import { BannerGate } from '@/components/BannerGate';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StockCheck — ตรวจนับสต็อก',
  description: 'ระบบตรวจนับ/ยืนยันทรัพย์สินรายตัว (generic asset tracker)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <BannerGate>
            <DemoBanner />
          </BannerGate>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
