'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { apiLogout } from './siws';
import { siwsLogin } from './siws-login';
import type { Adapter } from '@solana/wallet-adapter-base';
import { useSession } from './session';

export function useAutoSiws() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const lastAddress = useRef<string | null>(null);
  const running = useRef(false);
  const { refresh } = useSession();

  function adapterHasSignIn(
    adapter: Adapter | null | undefined
  ): adapter is Adapter & { signIn: () => Promise<void> } {
    return !!adapter && typeof (adapter as { signIn?: unknown }).signIn === 'function';
  }

  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    if (running.current) return;

    const address = publicKey.toBase58();
    if (lastAddress.current === address) return;
    lastAddress.current = address;
    running.current = true;

    (async () => {
      try {
        // Prefer Wallet Standard signIn if the adapter ever exposes it.
        const adapter = wallet?.adapter ?? null;
        if (adapterHasSignIn(adapter)) {
          await adapter.signIn();
          await refresh();
          return;
        }

        const result = await siwsLogin(publicKey, signMessage);
        if (!result.ok) {
          throw new Error(result.error);
        }
        await refresh();
      } catch (err) {
        console.error('Auto SIWS failed:', err);
        lastAddress.current = null;
      } finally {
        running.current = false;
      }
    })();
  }, [connected, publicKey, signMessage, wallet, refresh]);

  useEffect(() => {
    if (!connected && lastAddress.current) {
      lastAddress.current = null;
      apiLogout()
        .catch((err) => {
          console.error('Failed to log out:', err);
        })
        .finally(() => {
          refresh();
        });
    }
  }, [connected, refresh]);
}
