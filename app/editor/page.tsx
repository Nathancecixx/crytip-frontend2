'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { Section } from '@/components/Section';
import { ENTITLEMENTS_REFRESH_EVENT } from '@/lib/entitlements';

type PageConfig = {
  slug?: string | null;
  template_key: string;
  theme: { primary: string; bg: string; text: string };
  bio?: string;
  links?: { label: string; url: string }[];
};

type MeResponse = {
  wallet_pubkey: string;
  handle?: string | null;
};

const DEFAULT_CONFIG: PageConfig = {
  template_key: 'base.minimal',
  theme: { primary: '#6D28D9', bg: '#0b0b12', text: '#e7e3ff' },
  links: [{ label: 'Website', url: 'https://example.com' }],
};

const FREE_TEMPLATES = [
  { key: 'base.minimal', name: 'Minimal' },
  { key: 'base.card', name: 'Card' },
];
const PREMIUM_TEMPLATES = [
  { key: 'packA.flash', name: 'Flash (Pack A)', sku: 'templates.packA' },
  { key: 'packA.metro', name: 'Metro (Pack A)', sku: 'templates.packA' },
];

export default function Editor() {
  const [cfg, setCfg] = useState<PageConfig>(DEFAULT_CONFIG);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [entitlementError, setEntitlementError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [pageMissing, setPageMissing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let meData: MeResponse;
      try {
        meData = await apiGet<MeResponse>('/bff/me');
        if (cancelled) return;
        setMe(meData);
        setAuthPrompt(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setMe(null);
          setAuthPrompt('Sign in with your wallet to edit your page.');
          setEntitlements([]);
          setEntitlementError(null);
          setPageMissing(false);
          return;
        }
        const message = err instanceof Error ? err.message : String(err ?? '');
        setPageError(message || 'Failed to load your profile.');
        setMe(null);
        return;
      }

      try {
        const ent = await apiGet<{ entitlements: { sku: string }[] }>('/bff/me/entitlements');
        if (cancelled) return;
        const keys = (ent.entitlements || []).map((e) => e.sku);
        setEntitlements(keys);
        setEntitlementError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setEntitlements([]);
          setEntitlementError('Sign in with your wallet to load premium templates.');
        } else {
          const message = err instanceof Error ? err.message : String(err ?? '');
          setEntitlementError(message || 'Failed to load entitlements.');
        }
      }

      const slug = meData.handle || meData.wallet_pubkey;
      try {
        const page = await apiGet<any>(`/api/pages/${encodeURIComponent(slug)}`);
        if (cancelled) return;
        const theme = page?.theme || page?.theme_json || DEFAULT_CONFIG.theme;
        setCfg({
          ...DEFAULT_CONFIG,
          ...page,
          slug: page?.slug ?? slug,
          theme,
          links: page?.links || [],
        });
        setPageMissing(false);
        setPageError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setPageMissing(true);
            setCfg({ ...DEFAULT_CONFIG, slug });
            setPageError(null);
            return;
          }
          if (err.status === 401) {
            setAuthPrompt('Sign in with your wallet to edit your page.');
            return;
          }
        }
        const message = err instanceof Error ? err.message : String(err ?? '');
        console.warn('Failed to load page config', err);
        setPageError(message || 'Failed to load page config.');
      }
    }

    loadRef.current = load;

    load();

    function handleRefresh() {
      load();
    }

    window.addEventListener(ENTITLEMENTS_REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(ENTITLEMENTS_REFRESH_EVENT, handleRefresh);
    };
  }, []);

  const hasPackA = entitlements.includes('templates.packA');

  async function createPage() {
    if (!me) {
      setAuthPrompt('Sign in with your wallet to create your page.');
      return;
    }
    const slug = me.handle || me.wallet_pubkey;
    setCreating(true);
    setCreateStatus('Creating your page...');
    try {
      await apiPost('/api/pages', {
        slug,
        template_key: 'base.v1',
        theme_json: {},
        links: [],
      });
      setCreateStatus('Page created!');
      setPageMissing(false);
      await loadRef.current();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err ?? '');
      setCreateStatus(message || 'Failed to create page.');
    } finally {
      setCreating(false);
    }
  }

  async function save() {
    setStatus('Saving...');
    try {
      await apiPost('/api/pages', {
        slug: cfg.slug || null,
        template_key: cfg.template_key,
        theme_json: cfg.theme,
        bio: cfg.bio || '',
        links: cfg.links || [],
      });
      setStatus('Saved!');
    } catch (e: any) {
      setStatus('Error: ' + e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Page Editor</h1>

      {authPrompt && <div className="card p-4 text-amber-200">{authPrompt}</div>}
      {entitlementError && <div className="card p-4 text-amber-200">{entitlementError}</div>}
      {pageError && <div className="card p-4 text-red-300">{pageError}</div>}

      {pageMissing && !authPrompt && (
        <div className="card p-6 text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Create your page</h2>
            <p className="text-white/70">
              We couldn&apos;t find a page for your account yet. Create one to start customizing your public profile.
            </p>
          </div>
          <button className="btn" onClick={createPage} disabled={creating}>
            {creating ? 'Creating...' : 'Create Page'}
          </button>
          {createStatus && <div className="text-white/70">{createStatus}</div>}
        </div>
      )}

      {!pageMissing && (
        <>
          <Section title="Template">
            <div className="grid md:grid-cols-4 gap-3">
              {FREE_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setCfg({ ...cfg, template_key: t.key })}
                  className={
                    'card p-4 text-left ' + (cfg.template_key === t.key ? 'ring-2 ring-brand-500' : '')
                  }
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-white/60">{t.key}</div>
                </button>
              ))}
              {PREMIUM_TEMPLATES.map((t) => (
                <div key={t.key} className={'card p-4 ' + (cfg.template_key === t.key ? 'ring-2 ring-brand-500' : '')}>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-white/60">{t.key}</div>
                  {!hasPackA && <div className="mt-2 text-amber-300 text-sm">Requires Template Pack A</div>}
                  {hasPackA && (
                    <button className="btn mt-3" onClick={() => setCfg({ ...cfg, template_key: t.key })}>
                      Use Template
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Theme">
            <div className="grid md:grid-cols-3 gap-3">
              <label className="card p-4 flex items-center gap-3">
                <span className="w-28">Primary</span>
                <input
                  type="color"
                  value={cfg.theme.primary}
                  onChange={(e) => setCfg({ ...cfg, theme: { ...cfg.theme, primary: e.target.value } })}
                />
              </label>
              <label className="card p-4 flex items-center gap-3">
                <span className="w-28">Background</span>
                <input
                  type="color"
                  value={cfg.theme.bg}
                  onChange={(e) => setCfg({ ...cfg, theme: { ...cfg.theme, bg: e.target.value } })}
                />
              </label>
              <label className="card p-4 flex items-center gap-3">
                <span className="w-28">Text</span>
                <input
                  type="color"
                  value={cfg.theme.text}
                  onChange={(e) => setCfg({ ...cfg, theme: { ...cfg.theme, text: e.target.value } })}
                />
              </label>
            </div>
          </Section>

          <Section title="Profile">
            <div className="grid gap-3">
              <label className="card p-4">
                <div className="mb-2">Slug / Vanity (optional)</div>
                <input
                  className="w-full bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2"
                  placeholder="yourname"
                  value={cfg.slug || ''}
                  onChange={(e) => setCfg({ ...cfg, slug: e.target.value })}
                />
              </label>
              <label className="card p-4">
                <div className="mb-2">Bio</div>
                <textarea
                  className="w-full h-24 bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2"
                  value={cfg.bio || ''}
                  onChange={(e) => setCfg({ ...cfg, bio: e.target.value })}
                />
              </label>
              <div className="card p-4">
                <div className="mb-2">Links</div>
                <div className="space-y-2">
                  {(cfg.links || []).map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2"
                        placeholder="Label"
                        value={l.label}
                        onChange={(e) => {
                          const arr = [...(cfg.links || [])];
                          arr[i] = { ...arr[i], label: e.target.value };
                          setCfg({ ...cfg, links: arr });
                        }}
                      />
                      <input
                        className="flex-[2] bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2"
                        placeholder="https://..."
                        value={l.url}
                        onChange={(e) => {
                          const arr = [...(cfg.links || [])];
                          arr[i] = { ...arr[i], url: e.target.value };
                          setCfg({ ...cfg, links: arr });
                        }}
                      />
                    </div>
                  ))}
                  <button
                    className="btn-ghost mt-2"
                    onClick={() => setCfg({ ...cfg, links: [...(cfg.links || []), { label: '', url: '' }] })}
                  >
                    Add link
                  </button>
                </div>
              </div>
            </div>
          </Section>

          <div className="flex gap-3">
            <button className="btn" onClick={save}>Save</button>
            {status && <div className="self-center text-white/80">{status}</div>}
          </div>
        </>
      )}
    </div>
  );
}
