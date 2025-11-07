import { env } from './env';

const REST_BASE_URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
const SERVICE_HEADERS: HeadersInit = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
};

export interface PostgrestError {
  message: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  status: number;
}

async function supabaseRequest<T>(
  path: string,
  init: RequestInit & { headers?: HeadersInit } = {},
): Promise<SupabaseResponse<T>> {
  const headers: HeadersInit = {
    ...SERVICE_HEADERS,
    ...init.headers,
  };

  const response = await fetch(`${REST_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const raw = response.status === 204 ? null : await response.text();
  const payload = raw && isJson ? JSON.parse(raw) : raw;

  if (!response.ok) {
    const error = (Array.isArray(payload) ? payload[0] : payload) as PostgrestError | null;
    return {
      data: null,
      error: error ?? {
        message: response.statusText,
        details: typeof payload === 'string' ? payload : null,
      },
      status: response.status,
    };
  }

  return {
    data: (payload as T) ?? null,
    error: null,
    status: response.status,
  };
}

function normalizeWalletAddress(address: string): string {
  const normalized = address.trim();
  if (!normalized) {
    throw new Error('Wallet address is required');
  }
  return normalized;
}

export async function saveSiwsNonce(address: string, nonce: string): Promise<void> {
  const wallet = normalizeWalletAddress(address);
  const result = await supabaseRequest('/siws_nonces', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ wallet_pubkey: wallet, nonce }),
  });
  if (result.error) {
    throw new Error(`[db_error] saveSiwsNonce: ${result.error.message}`);
  }
}

export async function getSiwsNonce(address: string): Promise<string | null> {
  const wallet = normalizeWalletAddress(address);
  const result = await supabaseRequest<Array<{ nonce: string }>>(
    `/siws_nonces?wallet_pubkey=eq.${encodeURIComponent(wallet)}&select=nonce&limit=1`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  );
  if (result.error) {
    throw new Error(`[db_error] getSiwsNonce: ${result.error.message}`);
  }
  const record = result.data?.[0];
  return record?.nonce ?? null;
}

export async function clearSiwsNonce(address: string): Promise<void> {
  const wallet = normalizeWalletAddress(address);
  const result = await supabaseRequest<unknown>(
    `/siws_nonces?wallet_pubkey=eq.${encodeURIComponent(wallet)}`,
    {
      method: 'DELETE',
    },
  );
  if (result.error) {
    throw new Error(`[db_error] clearSiwsNonce: ${result.error.message}`);
  }
}

export interface UpsertUserResult {
  id: string;
}

export async function upsertUserByWallet(address: string): Promise<UpsertUserResult> {
  const wallet = normalizeWalletAddress(address);
  const result = await supabaseRequest<Array<{ id: string }>>('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({ wallet_pubkey: wallet }),
  });
  if (result.error) {
    throw new Error(`[db_error] upsertUserByWallet: ${result.error.message}`);
  }
  const record = result.data?.[0];
  if (!record?.id) {
    throw new Error('[db_error] upsertUserByWallet: missing id');
  }
  return { id: record.id };
}

export interface EntitlementRecord {
  id: string;
  user_id: string;
  product: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
}

export async function listEntitlements(userId: string): Promise<EntitlementRecord[]> {
  const result = await supabaseRequest<EntitlementRecord[]>(
    `/entitlements?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  );
  if (result.error) {
    throw new Error(`[db_error] listEntitlements: ${result.error.message}`);
  }
  return result.data ?? [];
}

export interface PageRecord {
  slug: string;
  title: string;
  content: string;
  summary?: string | null;
  published?: boolean | null;
  updated_at?: string | null;
}

export async function listPages(): Promise<PageRecord[]> {
  const result = await supabaseRequest<PageRecord[]>(
    '/pages?select=slug,title,content,summary,published,updated_at&order=slug',
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  );
  if (result.error) {
    throw new Error(`[db_error] listPages: ${result.error.message}`);
  }
  const pages = result.data ?? [];
  return pages.filter((page) => page.published !== false);
}

export async function getPageBySlug(slug: string): Promise<PageRecord | null> {
  const result = await supabaseRequest<PageRecord[]>(
    `/pages?slug=eq.${encodeURIComponent(slug)}&select=slug,title,content,summary,published,updated_at&limit=1`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    },
  );
  if (result.error) {
    throw new Error(`[db_error] getPageBySlug: ${result.error.message}`);
  }
  const record = result.data?.[0];
  if (!record || record.published === false) {
    return null;
  }
  return record;
}

export interface CheckoutPayload {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  userId: string,
  payload: CheckoutPayload,
): Promise<CheckoutSession> {
  const body = {
    p_user_id: userId,
    p_price_id: payload.priceId,
    p_success_url: payload.successUrl,
    p_cancel_url: payload.cancelUrl,
    p_metadata: payload.metadata ?? {},
  };
  const result = await supabaseRequest<Record<string, unknown>>('/rpc/create_checkout_session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (result.error) {
    throw new Error(`[db_error] createCheckoutSession: ${result.error.message}`);
  }
  const session = result.data as Record<string, unknown> | null;
  if (!session || typeof session.id !== 'string' || typeof session.url !== 'string') {
    throw new Error('[db_error] createCheckoutSession: invalid response');
  }
  return {
    id: session.id,
    url: session.url,
  };
}

export async function markPurchaseStatus(
  purchaseId: string,
  status: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const result = await supabaseRequest<unknown>(
    `/purchases?id=eq.${encodeURIComponent(purchaseId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, metadata }),
    },
  );
  if (result.error) {
    throw new Error(`[db_error] markPurchaseStatus: ${result.error.message}`);
  }
}
