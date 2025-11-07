'use client';

import { FC, PropsWithChildren, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { Adapter } from '@solana/wallet-adapter-base';
import '@solana/wallet-adapter-react-ui/styles.css';
import { getRpcUrl } from '@/lib/solana';

const WalletKit: FC<PropsWithChildren> = ({ children }) => {
  const endpoint = useMemo(() => getRpcUrl(), []);
  // Phantom now ships as a Wallet Standard implementation, so we do not need to
  // register a dedicated adapter – the wallet standard hook will expose it.
  const wallets = useMemo(() => [] as Adapter[], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletKit;
