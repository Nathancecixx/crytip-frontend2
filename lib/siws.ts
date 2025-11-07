import bs58 from 'bs58';
import { apiPost } from './api';

export async function siwsStart(address: string): Promise<{ message: string; nonce: string }> {
  return apiPost<{ message: string; nonce: string }>('/api/auth/siws/start', { address, wallet: address });
}

export async function siwsFinish(address: string, message: string, signatureBytes: Uint8Array) {
  const signature = bs58.encode(signatureBytes);
  await apiPost('/api/auth/siws/finish', { address, wallet: address, message, signature });
}

export async function apiLogout() {
  await apiPost('/api/auth/logout', {}).catch(() => {});
}
