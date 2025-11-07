'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { siwsStart, siwsFinish, apiLogout } from './siws';

export function useAutoSiws() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const lastAddress = useRef<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) return;

    const address = publicKey.toBase58();
    if (lastAddress.current === address) return;
    lastAddress.current = address;

    (async () => {
      try {
        // Prefer Wallet Standard signIn if available; else signMessage flow.
        // @ts-expect-error signIn may exist on some adapters
        if (wallet?.adapter?.signIn) {
          // If adopting wallet-native signIn in the future, call it here and forward to backend as needed.
          // For now, fall back to signMessage below for compatibility.
        }
        if (!signMessage) throw new Error('signMessage not available on this wallet');
        const { message } = await siwsStart(address);
        const msgBytes = new TextEncoder().encode(message);
        const sig = await signMessage(msgBytes);
        await siwsFinish(address, message, sig);
      } catch (err) {
        console.error('Auto SIWS failed:', err);
        // Optional: navigate to /login as manual fallback
      }
    })();
  }, [connected, publicKey, signMessage, wallet]);

  useEffect(() => {
    if (!connected && lastAddress.current) {
      lastAddress.current = null;
      apiLogout();
    }
  }, [connected]);
}
