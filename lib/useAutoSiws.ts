'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { siwsStart, siwsFinish, apiLogout, siwsMessageToBytes } from './siws';
import { requestEntitlementsRefresh } from './entitlements';

export function useAutoSiws() {
  const { connected, publicKey, signMessage, wallet } = useWallet();
  const lastAddress = useRef<string | null>(null);
  const running = useRef(false);

  function normalizeSignature(signature: unknown): Uint8Array | string {
    if (typeof signature === 'string') {
      return signature;
    }
    if (signature instanceof Uint8Array) {
      return signature;
    }
    if (signature instanceof ArrayBuffer) {
      return new Uint8Array(signature);
    }
    throw new Error('Unsupported signature type from signMessage');
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
        // @ts-expect-error signIn may exist on some adapters
        if (wallet?.adapter?.signIn) {
          await wallet.adapter.signIn();
          requestEntitlementsRefresh();
          return;
        }

        const { message, nonce } = await siwsStart(address); // ← capture nonce
        const msgBytes = siwsMessageToBytes(message);
        const rawSignature = await signMessage(msgBytes);
        const signature = normalizeSignature(rawSignature);
        console.debug('Auto SIWS breadcrumb', {
          stage: 'finish',
          sending: {
            address,
            hasNonce: !!nonce,
            messageLen: message.length,
          },
        });
        await siwsFinish(address, message, signature, nonce);      // ← send nonce
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
