import { api } from '@/lib/api';

async function getPage(slug: string) {
  const res = await api(`/pages/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function TipPage({ params }: { params: { slug: string } }) {
  const data = await getPage(params.slug);
  if (!data) return <div className="card p-6">Page not found.</div>;
  const cfg = {
    template_key: data.template_key || 'base.minimal',
    theme: data.theme_json || { primary: '#6D28D9', bg: '#0b0b12', text: '#e7e3ff' },
    bio: data.bio || '',
    links: data.links || []
  };

  return (
    <div style={{ ['--tw-prose-body' as any]: cfg.theme.text as string }} className="mx-auto max-w-3xl space-y-6">
      <div className="card p-8" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <h1 className="text-3xl font-bold mb-2">{data.slug || params.slug}</h1>
        {cfg.bio && <p className="text-white/80">{cfg.bio}</p>}
      </div>
      <div className="grid gap-3">
        {(cfg.links || []).map((l: any, i: number) => (
          <a key={i} href={l.url} className="card p-4 hover:bg-white/10" target="_blank" rel="noreferrer">
            {l.label || l.url}
          </a>
        ))}
      </div>
      <div className="card p-6">
        <div className="font-semibold mb-2">Tip this creator</div>
        <p className="text-white/80">Use Phantom to send USDC to their wallet.</p>
      </div>
    </div>
  );
}
