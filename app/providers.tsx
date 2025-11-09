// app/providers.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { useStandardWalletAdapters } from '@solana/wallet-standard-wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import type { Adapter } from '@solana/wallet-adapter-base';
import '@solana/wallet-adapter-react-ui/styles.css';
import { SessionProvider } from '@/lib/session';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const endpoint = useMemo(() => {
    const env = process.env.NEXT_PUBLIC_SOLANA_RPC?.trim();
    if (env) return env;
    const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta') as
      | 'devnet' | 'testnet' | 'mainnet-beta';
    return clusterApiUrl(cluster);
  }, []);

  const standardAdapters = useStandardWalletAdapters([]); // auto-detect (Phantom, etc.)
  const wallets = useMemo(() => standardAdapters as Adapter[], [standardAdapters]);

  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SessionProvider>{children}</SessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
