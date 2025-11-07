'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { txFromBase64 } from '@/lib/solana';

type CheckoutResp = { order_id: string; x402: { transaction?: string; [k:string]: any } };

async function sendFromAdapter(txB64: string, sendTx: any, connection: any) {
  const tx = txFromBase64(txB64);
  // Recent blockhash safety will rely on server prepared tx
  const sig = await sendTx(tx, connection, { skipPreflight: false });
  return sig;
}

export default function Store() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();

  async function checkout(sku: string) {
    setMsg(null);
    setBusy(sku);
    try {
      const { order_id, x402 } = await apiPost<CheckoutResp>('/api/store/checkout', { sku });
      if (x402.transaction) {
        const sig = await sendFromAdapter(x402.transaction, sendTransaction, connection);
        setMsg(`Submitted tx: ${sig}. x402 will webhook once finalized.`);
      } else {
        setMsg('Received checkout payload; please confirm in Phantom.');
      }
    } catch (e:any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {[
        { sku: 'vanity.monthly', name: 'Vanity Path (Monthly)', desc: 'cryptip.org/<custom-name>', price: '1 USDC / mo' },
        { sku: 'templates.packA', name: 'Template Pack A', desc: 'Unlock premium templates', price: '3 USDC one-time' },
        { sku: 'addon.halo.v1', name: 'Add‑on: Halo V1', desc: 'Limited visual add‑on', price: '5 USDC one-time' },
      ].map(p => (
        <div key={p.sku} className="card p-6 flex flex-col">
          <div className="font-semibold text-lg">{p.name}</div>
          <div className="text-white/80 text-sm mb-4">{p.desc}</div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-white/90">{p.price}</span>
            <button className="btn" onClick={() => checkout(p.sku)} disabled={busy === p.sku}>
              {busy === p.sku ? 'Processing...' : 'Buy'}
            </button>
          </div>
        </div>
      ))}
      {msg && <div className="md:col-span-3 card p-4">{msg}</div>}
    </div>
  );
}
