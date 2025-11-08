'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { clusterApiUrl } from '@solana/web3.js';
import { useAutoSiws } from '@/lib/useAutoSiws';
import type { Adapter } from '@solana/wallet-adapter-base';

function AutoSiwsHandler() {
  useAutoSiws();
  return null;
}

export default function WalletKit({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    clusterApiUrl((process.env.NEXT_PUBLIC_SOLANA_CLUSTER as any) || 'mainnet-beta');

  const wallets = useMemo<Adapter[]>(() => [], []);

  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AutoSiwsHandler />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
