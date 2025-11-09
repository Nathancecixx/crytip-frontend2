'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { clusterApiUrl } from '@solana/web3.js';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import type { Adapter } from '@solana/wallet-adapter-base';
import { SessionProvider } from '@/lib/session';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    clusterApiUrl((process.env.NEXT_PUBLIC_SOLANA_CLUSTER as any) || 'mainnet-beta');

  const standardAdapters = useStandardWalletAdapters([]);

  const wallets: any[] = [];

  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SessionProvider>
            {children}
          </SessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
