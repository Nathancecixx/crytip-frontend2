'use client';

import { clusterApiUrl, Connection, Transaction } from '@solana/web3.js';

export function getRpcUrl() {
  const custom = process.env.NEXT_PUBLIC_SOLANA_RPC;
  if (custom) return custom;
  const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'mainnet-beta';
  return clusterApiUrl(cluster as any);
}

export function getConnection() {
  return new Connection(getRpcUrl(), 'confirmed');
}

export function txFromBase64(b64: string) {
  const buf = Buffer.from(b64, 'base64');
  return Transaction.from(buf);
}
