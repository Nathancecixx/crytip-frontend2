import bs58 from 'bs58';
import { apiPost } from './api';

const textEncoder = new TextEncoder();

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
  return apiPost<SiwsStartResp>(
    '/bff/auth/siws/start',
    { address },
    { headers: { 'X-CSRF': '1' } }
  );
}

export async function siwsFinish(
  address: string,
  message: string,
  signatureInput: SignatureInput
) {
  const signatureBytes = signatureInputToBytes(signatureInput);

  await apiPost(
    '/bff/auth/siws/finish',
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
