'use client';

import { useEffect, useMemo, useState } from 'react';
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

const FREE_TEMPLATES = [
  { key: 'base.minimal', name: 'Minimal' },
  { key: 'base.card', name: 'Card' },
];
const PREMIUM_TEMPLATES = [
  { key: 'packA.flash', name: 'Flash (Pack A)', sku: 'templates.packA' },
  { key: 'packA.metro', name: 'Metro (Pack A)', sku: 'templates.packA' },
];

export default function Editor() {
  const [cfg, setCfg] = useState<PageConfig>({
    template_key: 'base.minimal',
    theme: { primary: '#6D28D9', bg: '#0b0b12', text: '#e7e3ff' },
    links: [{ label: 'Website', url: 'https://example.com' }]
  });
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const me = await apiGet<any>('/me/entitlements');
        if (cancelled) return;
        const keys = (me.entitlements || []).map((e: any) => e.sku);
        setEntitlements(keys);
        setLoadError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setEntitlements([]);
          setLoadError('Sign in with your wallet to load premium templates.');
        } else {
          const message = err instanceof Error ? err.message : String(err ?? '');
          setLoadError(message || 'Failed to load entitlements.');
        }
      }

      try {
        const page = await apiGet<any>('/pages/me');
        if (cancelled) return;
        if (page?.template_key) setCfg((c) => ({ ...c, ...page }));
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) return;
        console.warn('Failed to load page config', err);
      }
    }

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

  async function save() {
    setStatus('Saving...');
    try {
      await apiPost('/pages', {
        slug: cfg.slug || null,
        template_key: cfg.template_key,
        theme_json: cfg.theme,
        bio: cfg.bio || '',
        links: cfg.links || [],
      });
      setStatus('Saved!');
    } catch (e:any) {
      setStatus('Error: ' + e.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Page Editor</h1>

      {loadError && <div className="card p-4 text-amber-200">{loadError}</div>}

      <Section title="Template">
        <div className="grid md:grid-cols-4 gap-3">
          {FREE_TEMPLATES.map(t => (
            <button key={t.key}
              onClick={() => setCfg({ ...cfg, template_key: t.key })}
              className={"card p-4 text-left " + (cfg.template_key===t.key ? 'ring-2 ring-brand-500' : '')}>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-white/60">{t.key}</div>
            </button>
          ))}
          {PREMIUM_TEMPLATES.map(t => (
            <div key={t.key} className={"card p-4 " + (cfg.template_key===t.key ? 'ring-2 ring-brand-500' : '')}>
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
            <input type="color" value={cfg.theme.primary} onChange={e => setCfg({ ...cfg, theme: { ...cfg.theme, primary: e.target.value } })} />
          </label>
          <label className="card p-4 flex items-center gap-3">
            <span className="w-28">Background</span>
            <input type="color" value={cfg.theme.bg} onChange={e => setCfg({ ...cfg, theme: { ...cfg.theme, bg: e.target.value } })} />
          </label>
          <label className="card p-4 flex items-center gap-3">
            <span className="w-28">Text</span>
            <input type="color" value={cfg.theme.text} onChange={e => setCfg({ ...cfg, theme: { ...cfg.theme, text: e.target.value } })} />
          </label>
        </div>
      </Section>

      <Section title="Profile">
        <div className="grid gap-3">
          <label className="card p-4">
            <div className="mb-2">Slug / Vanity (optional)</div>
            <input className="w-full bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2" placeholder="yourname" value={cfg.slug || ''} onChange={e => setCfg({ ...cfg, slug: e.target.value })} />
          </label>
          <label className="card p-4">
            <div className="mb-2">Bio</div>
            <textarea className="w-full h-24 bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2" value={cfg.bio || ''} onChange={e => setCfg({ ...cfg, bio: e.target.value })} />
          </label>
          <div className="card p-4">
            <div className="mb-2">Links</div>
            <div className="space-y-2">
              {(cfg.links||[]).map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input className="flex-1 bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2" placeholder="Label" value={l.label} onChange={e => {
                    const arr = [...(cfg.links||[])]; arr[i] = { ...arr[i], label: e.target.value }; setCfg({ ...cfg, links: arr });
                  }} />
                  <input className="flex-[2] bg-transparent outline-none border rounded-xl border-white/20 px-3 py-2" placeholder="https://..." value={l.url} onChange={e => {
                    const arr = [...(cfg.links||[])]; arr[i] = { ...arr[i], url: e.target.value }; setCfg({ ...cfg, links: arr });
                  }} />
                </div>
              ))}
              <button className="btn-ghost mt-2" onClick={() => setCfg({ ...cfg, links: [...(cfg.links||[]), { label: '', url: '' }] })}>Add link</button>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex gap-3">
        <button className="btn" onClick={save}>Save</button>
        {status && <div className="self-center text-white/80">{status}</div>}
      </div>
    </div>
  );
}
