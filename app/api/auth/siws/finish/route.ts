import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { NextRequest, NextResponse } from 'next/server';
import {
  guardOrigin,
  handleCorsOptions,
  withCORS,
} from '@/src/lib/cors';
import { issueSessionJWT, setSessionCookie } from '@/src/lib/auth';
import {
  clearSiwsNonce,
  getSiwsNonce,
  upsertUserByWallet,
} from '@/src/lib/db';

export const OPTIONS = handleCorsOptions;

interface FinishPayload {
  address: string;
  message: string;
  signature: string;
}

interface ParsedMessage {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}

function parseFinishPayload(body: unknown): FinishPayload | null {
  if (!body || typeof body !== 'object') return null;
  const { address, message, signature } = body as Record<string, unknown>;
  if (typeof address !== 'string' || typeof message !== 'string' || typeof signature !== 'string') {
    return null;
  }
  return {
    address: address.trim(),
    message: message.trim(),
    signature: signature.trim(),
  };
}

function parseSiwsMessage(message: string): ParsedMessage | null {
  const lines = message.split('\n');
  if (lines.length < 7) return null;
  const header = lines[0] ?? '';
  const addressLine = lines[1] ?? '';
  const nonceLine = lines[5] ?? '';
  const issuedAtLine = lines[6] ?? '';

  const headerMatch = header.match(/^(.*) wants you to sign in with your Solana account:$/);
  if (!headerMatch) return null;
  const domain = headerMatch[1];
  const address = addressLine?.trim();
  const nonceMatch = nonceLine.match(/^Nonce:\s*(.+)$/);
  const issuedAtMatch = issuedAtLine.match(/^Issued At:\s*(.+)$/);

  if (!address || !nonceMatch || !issuedAtMatch) return null;

  return {
    domain,
    address,
    nonce: nonceMatch[1],
    issuedAt: issuedAtMatch[1],
  };
}

function verifySignature(payload: FinishPayload): boolean {
  try {
    const signatureBytes = bs58.decode(payload.signature);
    const publicKeyBytes = bs58.decode(payload.address);
    const messageBytes = new TextEncoder().encode(payload.message);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const guard = guardOrigin(req);
  if (!guard.ok) {
    return withCORS(req, guard.response);
  }

  let payload: FinishPayload | null = null;
  try {
    payload = parseFinishPayload(await req.json());
  } catch {
    const res = NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    return withCORS(req, res);
  }

  if (!payload || !payload.address) {
    const res = NextResponse.json({ error: 'Address, message, and signature are required' }, { status: 400 });
    return withCORS(req, res);
  }

  const parsedMessage = parseSiwsMessage(payload.message);
  if (!parsedMessage || parsedMessage.address !== payload.address) {
    const res = NextResponse.json({ error: 'Invalid SIWS message' }, { status: 400 });
    return withCORS(req, res);
  }

  let storedNonce: string | null;
  try {
    storedNonce = await getSiwsNonce(payload.address);
  } catch {
    const res = NextResponse.json({ error: 'Failed to verify nonce' }, { status: 500 });
    return withCORS(req, res);
  }
  if (!storedNonce) {
    const res = NextResponse.json({ error: 'Nonce not found' }, { status: 400 });
    return withCORS(req, res);
  }

  if (storedNonce !== parsedMessage.nonce) {
    const res = NextResponse.json({ error: 'Nonce mismatch' }, { status: 400 });
    return withCORS(req, res);
  }

  if (!verifySignature(payload)) {
    const res = NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    return withCORS(req, res);
  }

  try {
    await clearSiwsNonce(payload.address);
  } catch {
    const res = NextResponse.json({ error: 'Failed to clear nonce' }, { status: 500 });
    return withCORS(req, res);
  }

  try {
    const { id: userId } = await upsertUserByWallet(payload.address);
    const token = issueSessionJWT(userId);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, token);
    return withCORS(req, res);
  } catch {
    const res = NextResponse.json({ error: 'Failed to establish session' }, { status: 500 });
    return withCORS(req, res);
  }
}
