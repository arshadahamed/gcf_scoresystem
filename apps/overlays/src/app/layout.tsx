import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = { title: 'SCF Overlays' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: 'transparent' }}>{children}</body>
    </html>
  );
}
