'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { siwsStart, siwsFinish, apiLogout, siwsMessageToBytes } from './siws';
import type { Adapter } from '@solana/wallet-adapter-base';
import { requestEntitlementsRefresh } from './entitlements';

export function useAutoSiws() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const lastAddress = useRef<string | null>(null);
  const running = useRef(false);

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
          requestEntitlementsRefresh();
          return;
        }

        const { message } = await siwsStart(address);
        const msgBytes = siwsMessageToBytes(message);
        const rawSignature = await signMessage(msgBytes);
        console.debug('Auto SIWS breadcrumb', {
          stage: 'finish',
          sending: {
            address,
            messageLen: message.length,
          },
        });
        await siwsFinish(address, message, rawSignature);
        requestEntitlementsRefresh();
      } catch (err) {
        console.error('Auto SIWS failed:', err);
        lastAddress.current = null;
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
