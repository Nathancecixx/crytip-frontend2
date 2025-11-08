import { apiPost } from './api';

export type SiwsStartResponse = {
  message: string;
  nonce: string;
};

type SiwsFinishInput = {
  address: string;
  signature: string;
  nonce: string;
};

function requireWindowHost(): string {
  if (typeof window === 'undefined' || !window.location?.host) {
    throw new Error('Sign in with wallet is only available in the browser.');
  }
  return window.location.host;
}

function appendDomain(payload: Record<string, unknown>) {
  try {
    const domain = requireWindowHost();
    return { ...payload, domain };
  } catch {
    return payload;
  }
}

export async function siwsStart(address: string): Promise<SiwsStartResponse> {
  if (!address) {
    throw new Error('Wallet address is required to start SIWS.');
  }

  return apiPost<SiwsStartResponse>(
    '/api/auth/siws/start',
    appendDomain({ address }),
    { headers: { 'X-CSRF': '1' } }
  );
}

export async function siwsFinish(input: SiwsFinishInput): Promise<void> {
  const { address, signature, nonce } = input;
  if (!address || !signature || !nonce) {
    throw new Error('Address, signature and nonce are required to finish SIWS.');
  }

  await apiPost(
    '/api/auth/siws/finish',
    appendDomain({ address, signature, nonce }),
    { headers: { 'X-CSRF': '1' } }
  );
}

export async function apiLogout() {
  await apiPost('/api/auth/logout', {}, { headers: { 'X-CSRF': '1' } }).catch(() => {});
}
