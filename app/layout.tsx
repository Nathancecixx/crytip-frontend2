// app/layout.tsx
import type { Metadata } from 'next';
import Providers from './providers';
import NavBar from '@/components/NavBar';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrypTip',
  description: 'USDC tips on Solana. Personal pages, store, and editor.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[rgb(6,7,16)] text-white antialiased">
        <Providers>
          <NavBar />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
