import bs58 from 'bs58';
import { apiPost } from './api';

function encodeMessage(message: string): Uint8Array {
  try {
    // Some backends return the SIWS payload as base58-encoded bytes.
    return bs58.decode(message);
  } catch {
    // Fall back to treating the message as UTF-8 text.
    return new TextEncoder().encode(message);
  }
}

export type SiwsStartResp = { message: string; nonce: string };

export async function siwsStart(address: string): Promise<SiwsStartResp> {
  // Some backends accept both `address` and `wallet`; sending both is harmless.
  return apiPost<SiwsStartResp>('/api/auth/siws/start', {
    address,
    wallet: address,
    publicKey: address,
  });
}

export async function siwsFinish(
  address: string,
  message: string,
  signatureBytes: Uint8Array,
  nonce: string
) {
  const signature = bs58.encode(signatureBytes);
  // IMPORTANT: include nonce
  await apiPost('/api/auth/siws/finish', {
    address,
    wallet: address,
    publicKey: address,
    message,
    signature,
    nonce,
  });
}

export async function apiLogout() {
  await apiPost('/api/auth/logout', {}).catch(() => {});
}

export const siwsMessageToBytes = encodeMessage;
