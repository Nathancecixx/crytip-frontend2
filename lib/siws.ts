import bs58 from 'bs58';
import { apiPost } from './api';

export type SiwsStartResp = { message: string; nonce: string };

export async function siwsStart(address: string): Promise<SiwsStartResp> {
  // Some backends accept both `address` and `wallet`; sending both is harmless.
  return apiPost<SiwsStartResp>('/api/auth/siws/start', { address, wallet: address });
}

export async function siwsFinish(
  address: string,
  message: string,
  signatureBytes: Uint8Array,
  nonce: string
) {
  const signature = bs58.encode(signatureBytes);
  // IMPORTANT: include nonce
  await apiPost('/api/auth/siws/finish', { address, wallet: address, message, signature, nonce });
}

export async function apiLogout() {
  await apiPost('/api/auth/logout', {}).catch(() => {});
}
