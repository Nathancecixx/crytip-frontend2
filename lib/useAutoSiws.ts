'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { siwsStart, siwsFinish, apiLogout } from './siws';
import { requestEntitlementsRefresh } from './entitlements';

export function useAutoSiws() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const lastAddress = useRef<string | null>(null);
  const running = useRef(false);

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    if (running.current) return;

    const address = publicKey.toBase58();
    if (lastAddress.current === address) return;
    lastAddress.current = address;
    running.current = true;

    (async () => {
      try {
        // Prefer Wallet Standard signIn if available; else signMessage flow.
        // @ts-expect-error signIn may exist on some adapters
        if (wallet?.adapter?.signIn) {
          // If adopting wallet-native signIn in the future, call it here and forward to backend as needed.
          // For now, fall back to signMessage below for compatibility.
        }
        const { message } = await siwsStart(address);
        const msgBytes = new TextEncoder().encode(message);
        const sig = await signMessage(msgBytes);
        await siwsFinish(address, message, sig);
        requestEntitlementsRefresh();
      } catch (err) {
        console.error('Auto SIWS failed:', err);
        lastAddress.current = null;
        // Optional: navigate to /login as manual fallback
      } finally {
        running.current = false;
      }
    })();
  }, [connected, publicKey, signMessage, wallet]);

  useEffect(() => {
    if (!connected && lastAddress.current) {
      lastAddress.current = null;
      apiLogout().finally(() => {
        requestEntitlementsRefresh();
      });
    }
  }, [connected]);
}
