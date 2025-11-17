'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { Section } from '@/components/Section';
import { useSession } from '@/lib/session';

type PageConfig = {
  slug?: string | null;
  template_key: string;
  theme: { primary: string; bg: string; text: string };
  bio?: string;
  links?: { label: string; url: string }[];
};

type MeResponse = {
  // Current backend shape
  userId?: string;
  wallet?: string | null;

  // Backward / forward compatible fields
  wallet_pubkey?: string | null;
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

// Normalize how we derive a slug/vanity from the profile
function deriveSlugFromProfile(me: MeResponse | null): string | null {
  if (!me) return null;

  if (me.handle && me.handle.trim()) return me.handle.trim();
  if (me.wallet && me.wallet.trim()) return me.wallet.trim();
  if (me.wallet_pubkey && me.wallet_pubkey.trim()) return me.wallet_pubkey.trim();

  return null;
}

export default function EditorClient() {
  const [cfg, setCfg] = useState<PageConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [pageMissing, setPageMissing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const {
    status: sessionStatus,
    entitlements: sessionEntitlements,
    error: sessionError,
  } = useSession();

  const entitlementSkus = useMemo(
    () => sessionEntitlements.map((e) => e.sku),
    [sessionEntitlements],
  );
  const hasPackA = entitlementSkus.includes('templates.packA');

  const entitlementError = useMemo(() => {
    if (sessionStatus === 'error') {
      return sessionError || 'Failed to load entitlements.';
    }
    return null;
  }, [sessionStatus, sessionError]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1. Load profile
      let meData: MeResponse;
      try {
        meData = await apiGet<MeResponse>('/api/me');
        if (cancelled) return;
        setMe(meData);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err ?? '');
        setPageError(message || 'Failed to load your profile.');
        setMe(null);
        setPageMissing(true);
        return;
      }

      const slugFromProfile = deriveSlugFromProfile(meData);

      // 2. Load page using /api/pages/me (auth-aware endpoint)
      try {
        const page = await apiGet<any>('/api/pages/me');
        if (cancelled) return;

        const theme = page?.theme || page?.theme_json || DEFAULT_CONFIG.theme;

        setCfg({
          ...DEFAULT_CONFIG,
          ...page,
          slug: page?.slug ?? slugFromProfile ?? null,
          theme,
          links: page?.links || [],
        });

        setPageMissing(false);
        setPageError(null);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 404) {
          // No page exists yet for this user — seed config with derived slug
          setCfg({
            ...DEFAULT_CONFIG,
            slug: slugFromProfile ?? null,
          });
          setPageMissing(true);
          setPageError(null);
          return;
        }

        const message = err instanceof Error ? err.message : String(err ?? '');
        console.warn('Failed to load page config', err);
        setPageError(message || 'Failed to load page config.');
        setPageMissing(false);
      }
    }

    loadRef.current = load;

    if (sessionStatus === 'authenticated') {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [sessionStatus]);

  async function createPage() {
    const slugFromProfile = deriveSlugFromProfile(me);
    const slug = (cfg.slug && cfg.slug.trim()) || slugFromProfile;

    if (!slug) {
      setCreateStatus('Load your profile before creating a page.');
      return;
    }

    setCreating(true);
    setCreateStatus('Creating your page...');

    try {
      await apiPost('/api/pages', {
        slug,
        // Start them on our default template; they can change it in the UI
        template_key: cfg.template_key || DEFAULT_CONFIG.template_key,
        theme_json: cfg.theme || DEFAULT_CONFIG.theme,
        bio: cfg.bio || '',
        links: cfg.links || [],
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
      const slugFromProfile = deriveSlugFromProfile(me);
      const slug = (cfg.slug && cfg.slug.trim()) || slugFromProfile || null;

      await apiPost('/api/pages', {
        slug,
        template_key: cfg.template_key,
        theme_json: cfg.theme,
        bio: cfg.bio || '',
        links: cfg.links || [],
      });

      setStatus('Saved!');
      // Keep cfg.slug in sync with what we actually send
      setCfg((prev) => ({ ...prev, slug }));
    } catch (e: any) {
      setStatus('Error: ' + (e?.message || 'Failed to save page.'));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Page Editor</h1>

      {entitlementError && (
        <div className="card p-4 text-amber-200">{entitlementError}</div>
      )}
      {pageError && (
        <div className="card p-4 text-red-300">{pageError}</div>
      )}

      {pageMissing && (
        <div className="card p-6 text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Create your page</h2>
            <p className="text-white/70">
              We couldn&apos;t find a page for your account yet. Create one to
              start customizing your public profile.
            </p>
          </div>
          <button className="btn" onClick={createPage} disabled={creating}>
            {creating ? 'Creating...' : 'Create Page'}
          </button>
          {createStatus && (
            <div className="text-white/70">{createStatus}</div>
          )}
        </div>
      )}

      {!pageMissing && (
        <>
          <Section title="Template">
            <div className="grid md:grid-cols-4 gap-3">
              {FREE_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() =>
                    setCfg({ ...cfg, template_key: t.key })
                  }
                  className={
                    'card p-4 text-left ' +
                    (cfg.template_key === t.key ? 'ring-2 ring-brand-500' : '')
                  }
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-white/60">{t.key}</div>
                </button>
              ))}
              {PREMIUM_TEMPLATES.map((t) => (
                <div
                  key={t.key}
                  className={
                    'card p-4 ' +
                    (cfg.template_key === t.key ? 'ring-2 ring-brand-500' : '')
                  }
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-white/60">{t.key}</div>
                  {!hasPackA && (
                    <div className="mt-2 text-amber-300 text-sm">
                      Requires Template Pack A
                    </div>
                  )}
                  {hasPackA && (
                    <button
                      className="btn mt-3"
                      onClick={() =>
                        setCfg({ ...cfg, template_key: t.key })
                      }
                    >
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
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      theme: { ...cfg.theme, primary: e.target.value },
                    })
                  }
                />
              </label>
              <label className="card p-4 flex items-center gap-3">
                <span className="w-28">Background</span>
                <input
                  type="color"
                  value={cfg.theme.bg}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      theme: { ...cfg.theme, bg: e.target.value },
                    })
                  }
                />
              </label>
              <label className="card p-4 flex items-center gap-3">
                <span className="w-28">Text</span>
                <input
                  type="color"
                  value={cfg.theme.text}
                  onChange={(e) =>
                    setCfg({
                      ...cfg,
                      theme: { ...cfg.theme, text: e.target.value },
                    })
                  }
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
                  onChange={(e) =>
                    setCfg({ ...cfg, slug: e.target.value })
                  }
                />
              </label>
              <label className="card p-4">
                <div className="mb-2">Bio</div>
                <textarea
                  className="w-full h-24 bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2"
                  value={cfg.bio || ''}
                  onChange={(e) =>
                    setCfg({ ...cfg, bio: e.target.value })
                  }
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
                    onClick={() =>
                      setCfg({
                        ...cfg,
                        links: [
                          ...(cfg.links || []),
                          { label: '', url: '' },
                        ],
                      })
                    }
                  >
                    Add link
                  </button>
                </div>
              </div>
            </div>
          </Section>

          <div className="flex gap-3">
            <button className="btn" onClick={save}>
              Save
            </button>
            {status && (
              <div className="self-center text-white/80">
                {status}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
