'use client';

import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  clusterApiUrl(process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? 'mainnet-beta');

export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* NOTE: leave wallets empty to rely on Wallet Standard */}
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
