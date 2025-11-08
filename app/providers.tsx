// app/providers.tsx
'use client';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import { clusterApiUrl } from '@solana/web3.js';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = clusterApiUrl('mainnet-beta');
  const wallets: any[] = []; // rely on Wallet Standard discovery
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
