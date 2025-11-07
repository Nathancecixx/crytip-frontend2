// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import NavBar from '@/components/NavBar';

const WalletKit = dynamic(() => import('@/components/WalletKit'), { ssr: false });

export const metadata: Metadata = {
  title: 'Crypto Tip Jar',
  description: 'Non-custodial Solana tip pages with on-chain entitlements',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletKit>
          <NavBar />
          <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">{children}</main>
        </WalletKit>
      </body>
    </html>
  );
}
