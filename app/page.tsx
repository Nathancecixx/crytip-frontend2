import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-stretch">
      <div className="card p-8">
        <h1 className="text-3xl font-bold mb-4">Crypto Tip Jar</h1>
        <p className="text-white/80 mb-6">
          Publish a personalized tip page and get paid in USDC on Solana. Free page at <code>cryptip.org/&lt;wallet&gt;</code>. 
          Unlock vanity, custom domain, and premium templates via x402.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn">Get started</Link>
          <Link href="/store" className="btn-ghost">Browse Store</Link>
        </div>
      </div>
      <div className="card p-8">
        <h2 className="text-xl font-semibold mb-3">MVP Features</h2>
        <ul className="list-disc list-inside space-y-2 text-white/90">
          <li>SIWS (Sign in with Solana) using Phantom</li>
          <li>Dashboard & Editor with entitlement gating</li>
          <li>x402 checkout flow; on-chain entitlements</li>
          <li>SSR public tip pages: <code>/[walletOrSlug]</code></li>
        </ul>
      </div>
    </div>
  );
}
