// app/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Theme = {
  primary: string;
  bg: string;
  text: string;
};

type Link = {
  label: string;
  url: string;
};

type PageResponse = {
  slug?: string | null;
  template_key?: string | null;
  theme_json?: Theme | null;
  theme?: Theme | null;
  bio?: string | null;
  links?: Link[] | null;
};

const DEFAULT_THEME: Theme = {
  primary: '#6D28D9',
  bg: '#0b0b12',
  text: '#e7e3ff',
};

async function getPage(slug: string): Promise<PageResponse | null> {
  const res = await api(`/api/pages/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    // You could log this to an error service later
    throw new Error(`Failed to load page (${res.status})`);
  }

  return res.json();
}

export default async function TipPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  const data = await getPage(slug);

  if (!data) {
    // No page for this slug → show 404
    return (
      <div className="mx-auto max-w-3xl py-16 px-4">
        <div className="card p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
          <p className="text-white/70">
            This tip page doesn&apos;t exist yet. The creator may not have set it up.
          </p>
        </div>
      </div>
    );
    // Or: notFound(); if you prefer the global 404
  }

  const theme: Theme = data.theme_json || data.theme || DEFAULT_THEME;
  const links: Link[] = data.links || [];
  const bio = data.bio || '';
  const displaySlug = data.slug || slug;

  return (
    <div
      className="mx-auto max-w-3xl space-y-6 py-10 px-4"
      style={{
        // Background + text from theme
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      <div
        className="card p-8 border rounded-3xl shadow-xl"
        style={{
          background: 'rgba(15,15,35,0.85)',
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <h1 className="text-3xl font-bold mb-2">{displaySlug}</h1>
        {bio && <p className="text-white/80">{bio}</p>}
      </div>

      <div className="grid gap-3">
        {links.length > 0 ? (
          links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              className="card p-4 hover:bg-white/10 border rounded-2xl transition"
              target="_blank"
              rel="noreferrer"
            >
              {l.label || l.url}
            </a>
          ))
        ) : (
          <div className="card p-4 text-sm text-white/60">
            This creator hasn&apos;t added any links yet.
          </div>
        )}
      </div>

      <div className="card p-6 border rounded-2xl">
        <div className="font-semibold mb-2">Tip this creator</div>
        <p className="text-white/80">
          Use Phantom to send USDC to their wallet.
        </p>
      </div>
    </div>
  );
}
