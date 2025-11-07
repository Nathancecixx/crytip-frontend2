import bs58 from 'bs58';
import { ApiError, apiPost } from './api';

const textEncoder = new TextEncoder();

const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

function requireBackendUrl(path: string): string {
  if (!BACKEND_API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_API_BASE_URL}${suffix}`;
}

function requireFrontendHost(): string {
  if (typeof window === 'undefined' || !window.location?.host) {
    throw new Error('SIWS requires a browser environment with window.location.host');
  }
  return window.location.host;
}

function ensureMessageDomain(message: string, domain: string): string {
  let updated = message;

  const wantsYouToSignIn = /^[^\n\r]+ wants you to sign in with your Solana account:/;
  if (wantsYouToSignIn.test(updated)) {
    updated = updated.replace(wantsYouToSignIn, `${domain} wants you to sign in with your Solana account:`);
  }

  const domainLine = /^(domain|Domain):\s*.*$/m;
  if (domainLine.test(updated)) {
    updated = updated.replace(domainLine, (_substring: string, captured: string) => `${captured}: ${domain}`);
  }

  const jsonDomain = /("domain"\s*:\s*")[^"]*(")/i;
  if (jsonDomain.test(updated)) {
    updated = updated.replace(jsonDomain, `$1${domain}$2`);
  }

  return updated;
}

type SignatureInput = Uint8Array | ArrayBuffer | string;

function hasBase64Encoder(): boolean {
  return typeof globalThis.btoa === 'function';
}

function bytesToBase64(bytes: Uint8Array): string {
  if (hasBase64Encoder()) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return globalThis.btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

function hasBase64Decoder(): boolean {
  return typeof globalThis.atob === 'function';
}

function decodeBase64(value: string): Uint8Array {
  if (hasBase64Decoder()) {
    const binary = globalThis.atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  return Uint8Array.from(Buffer.from(value, 'base64'));
}

function signatureInputToBytes(signature: SignatureInput): Uint8Array {
  if (signature instanceof Uint8Array) {
    return signature;
  }
  if (signature instanceof ArrayBuffer) {
    return new Uint8Array(signature);
  }
  if (typeof signature === 'string') {
    try {
      return decodeBase64(signature);
    } catch {
      try {
        return bs58.decode(signature);
      } catch {
        throw new Error('Unsupported string encoding for signature');
      }
    }
  }

  throw new Error('Unsupported signature type from signMessage');
}

export function siwsMessageToBytes(message: string): Uint8Array {
  return textEncoder.encode(message);
}

export type SiwsStartResp = { message: string; nonce: string };

export async function siwsStart(address: string): Promise<SiwsStartResp> {
  const domain = requireFrontendHost();
  const startUrl = requireBackendUrl('/api/auth/siws/start');

  const response = await apiPost<SiwsStartResp>(
    startUrl,
    { address, domain },
    { headers: { 'X-CSRF': '1' } }
  ).catch((err) => {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError('Failed to start SIWS', 500, err);
  });

  if (!response?.message) {
    return response;
  }

  return {
    ...response,
    message: ensureMessageDomain(response.message, domain),
  };
}

export async function siwsFinish(
  address: string,
  message: string,
  signatureInput: SignatureInput
) {
  const signatureBytes = signatureInputToBytes(signatureInput);

  const finishUrl = requireBackendUrl('/api/auth/siws/finish');

  await apiPost(
    finishUrl,
    {
      address,
      message,
      signature: bytesToBase64(signatureBytes),
    },
    { headers: { 'X-CSRF': '1' } }
  );
}

export async function apiLogout() {
  await apiPost('/api/auth/logout', {}, { headers: { 'X-CSRF': '1' } }).catch(() => {});
}
