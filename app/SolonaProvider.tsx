'use client';

import type { PropsWithChildren } from 'react';
import SolanaWalletProvider from '@/components/WalletProvider';

export default function SolanaProviders({ children }: PropsWithChildren) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
