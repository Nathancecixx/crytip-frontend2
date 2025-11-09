// app/page.tsx
import Image from 'next/image';
import Link from 'next/link';

function Section({
  id,
  title,
  eyebrow,
  children,
  className = '',
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative py-20 sm:py-28 ${className}`}>
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        {/* Subtle Solana aurora blobs */}
        <div className="absolute -top-20 -left-24 h-64 w-64 rounded-full blur-3xl opacity-30"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #9945FF66 0%, transparent 70%)', animation: 'float1 16s ease-in-out infinite' }} />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full blur-3xl opacity-25"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #00FFA366 0%, transparent 70%)', animation: 'float2 18s ease-in-out infinite 1.2s' }} />
        <div className="absolute -top-16 right-0 h-72 w-96 rounded-full blur-3xl opacity-25"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #14F19566 0%, transparent 75%)', animation: 'float1 20s ease-in-out infinite 0.6s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {eyebrow && (
          <p className="text-xs tracking-widest text-white/60 uppercase mb-3">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            'linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)',
          backgroundSize: '200% 100%',
          filter: 'blur(10px)',
          animation: 'beam 12s linear infinite',
        }}
      />
      <div className="relative">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         className="text-[#14F195]">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen text-white bg-black">
      {/* Top animated 1px beam */}
      <div
        aria-hidden
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg,#0000,#9945FF,#14F195,#00FFA3,#9945FF,#0000)',
          backgroundSize: '300% 100%',
          animation: 'beam 18s linear infinite',
          opacity: 0.35,
        }}
      />

      {/* HERO */}
      <section className="relative pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Large center glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30"
               style={{ background: 'radial-gradient(50% 50% at 50% 50%, #9945FF55 0%, transparent 70%)', animation: 'float1 22s ease-in-out infinite' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative h-9 w-9 rounded-xl overflow-hidden ring-1 ring-white/10">
                <Image
                  src="/content/CrypTipLogo.png"
                  alt="CrypTip"
                  fill
                  sizes="36px"
                  className="object-cover"
                  priority
                />
              </div>
              <span className="text-sm text-white/80">Crypto Tip Pages on Solana</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Launch your <span className="text-transparent bg-clip-text bg-[linear-gradient(90deg,#fff,#A6FFE6)]">non-custodial</span> tip page
              <br className="hidden sm:block" />
              in minutes—powered by Solana.
            </h1>
            <p className="mt-5 text-white/80 max-w-prose">
              Publish a personalized tip page and get paid in USDC on Solana.
              Free pages at <code className="text-white/90">cryptip.org/&lt;wallet&gt;</code>.
              Upgrade with x402 for vanity paths, custom domains, premium templates,
              and on-chain visual add-ons.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="relative inline-flex items-center gap-2 rounded-xl bg-[#14F195] px-5 py-3 text-black font-semibold hover:opacity-90 transition"
              >
                Get started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-white/15 px-5 py-3 text-white/90 hover:bg-white/10 transition"
              >
                Explore features
              </a>
            </div>

            <div className="mt-6 flex items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <CheckIcon /> Non-custodial
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon /> x402 upgrades
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon /> Token-2022 licenses
              </div>
            </div>
          </div>

          {/* Demo mock */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl opacity-40"
                 style={{
                   background: 'linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)',
                   backgroundSize: '200% 100%',
                   filter: 'blur(18px)',
                   animation: 'beam 10s linear infinite',
                 }}
            />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
              <div className="rounded-2xl bg-black/40 border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden ring-1 ring-white/10">
                    <Image src="/content/CrypTipLogo.png" alt="Logo" fill sizes="40px" className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">@creator.sol</p>
                    <p className="text-xs text-white/50">cryptip.org/creator.sol</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-white/60 mb-2">Balance</p>
                    <p className="text-lg font-semibold">USDC</p>
                    <p className="text-2xl font-extrabold tracking-tight">$0.00</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xs text-white/60 mb-2">Last tip</p>
                    <p className="text-lg font-semibold">3m ago</p>
                    <p className="text-sm text-white/70">+ 5.00 USDC</p>
                  </div>
                </div>

                <button className="mt-5 w-full rounded-xl bg-[#14F195] text-black font-semibold py-3 hover:opacity-90 transition">
                  Tip with Phantom
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-10 flex justify-center">
          <a href="#features" aria-label="Scroll to features" className="group inline-flex items-center gap-2 text-white/70 hover:text-white transition">
            Learn more
            <svg className="group-hover:translate-y-0.5 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <Section id="features" eyebrow="What you get" title="Professional pages. On-chain ownership. Real-time speed.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            title="Blazing-fast, low fees"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#00FFA3]"><path d="M13 3l-2 6h6l-6 12 2-8H7L13 3z" fill="currentColor"/></svg>}
          >
            Solana throughput and finality make tips instant and affordable—no
            waiting, no sticker shock.
          </FeatureCard>
          <FeatureCard
            title="Non-custodial by design"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#14F195]"><path d="M12 1l9 5v6c0 5-3.8 9.7-9 11-5.2-1.3-9-6-9-11V6l9-5z" fill="currentColor"/></svg>}
          >
            Funds go directly to your wallet. We never custody keys, ever.
          </FeatureCard>
          <FeatureCard
            title="x402 upgrades"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#9945FF]"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4-6.5 4 2-7L2 9h7l3-7z" fill="currentColor"/></svg>}
          >
            Unlock vanity slugs, custom domains, and premium packs through
            x402—purchases are verifiable, on-chain entitlements.
          </FeatureCard>
          <FeatureCard
            title="Token-2022 licenses"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#00FFA3]"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>}
          >
            Template packs ship as non-transferable Token-2022 licenses. Your
            editor reads licenses directly.
          </FeatureCard>
          <FeatureCard
            title="NFT visual add-ons"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#14F195]"><rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/></svg>}
          >
            Collection-verified NFTs grant special visual effects and badges,
            rendering right on your page.
          </FeatureCard>
          <FeatureCard
            title="Custom domains"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" className="text-[#9945FF]"><path d="M3 12a9 9 0 1018 0A9 9 0 003 12zm8 7.9V4.1a8 8 0 010 15.8z" fill="currentColor"/></svg>}
          >
            Keep your brand consistent: connect your own domain in minutes.
          </FeatureCard>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" eyebrow="How it works" title="Three steps. Zero headaches.">
        <ol className="relative grid gap-6 sm:grid-cols-3">
          {[
            ['Connect wallet', 'Sign in with Solana (SIWS) using Phantom. We create a session—no emails or passwords required.'],
            ['Customize & publish', 'Pick a template, add your links and socials, and press publish. You get cryptip.org/<wallet> instantly.'],
            ['Upgrade (optional)', 'Buy vanity, domains, or templates via x402. The backend verifies on-chain entitlements.'],
          ].map(([title, desc], i) => (
            <li key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{title}</h3>
              </div>
              <p className="text-sm text-white/80">{desc}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[#14F195] px-5 py-3 text-black font-semibold hover:opacity-90 transition">
            Start now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </Section>

      {/* TEMPLATE DEMO / SHOWCASE */}
      <Section id="templates" eyebrow="Templates" title="Beautiful templates that feel native to Solana.">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Showcase A */}
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="absolute -inset-2 -z-10 rounded-3xl opacity-30"
                 style={{
                   background: 'linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)',
                   backgroundSize: '200% 100%',
                   filter: 'blur(12px)',
                   animation: 'beam 14s linear infinite',
                 }}
            />
            <div className="rounded-2xl bg-black/40 border border-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8 rounded-lg overflow-hidden ring-1 ring-white/10">
                  <Image src="/content/CrypTipLogo.png" alt="logo" fill sizes="32px" className="object-cover" />
                </div>
                <div className="text-sm">
                  <p className="text-white/80">@gamer.sol</p>
                  <p className="text-white/50 text-xs">Streamer • Speedrunner</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {['Twitch', 'YouTube', 'X'].map((s) => (
                  <div key={s} className="rounded-xl bg-white/5 border border-white/10 p-3 text-center text-xs">
                    {s}
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full rounded-xl bg-[#14F195] text-black font-semibold py-2.5 hover:opacity-90 transition">
                Tip 2 USDC
              </button>
            </div>
          </div>

          {/* Showcase B */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="rounded-2xl bg-black/40 border border-white/10 p-5">
              <p className="text-sm text-white/70">“We shipped our tip page in under five minutes. Fees were pennies and tips showed up instantly.”</p>
              <p className="mt-3 text-xs text-white/50">— @designer.sol</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-white/60">Median tx time</p>
                  <p className="text-lg font-semibold">~<span className="tabular-nums">0.6s</span></p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-white/60">Typical fee</p>
                  <p className="text-lg font-semibold">&lt;$0.01</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing" eyebrow="Pricing" title="Free forever. Pay only for upgrades.">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-white/70 text-sm mt-1">Everything you need to publish and get paid.</p>
            <p className="mt-5 text-4xl font-extrabold tracking-tight">$0</p>
            <ul className="mt-5 space-y-2 text-sm">
              {[
                'Non-custodial Solana tips',
                'cryptip.org/<wallet> page',
                'Base templates',
                'Editor & analytics (basic)',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-white/80">
                  <CheckIcon /> {f}
                </li>
              ))}
            </ul>
            <Link href="/login" className="mt-6 inline-flex rounded-xl bg-white/10 px-4 py-2 border border-white/15 hover:bg-white/15 transition">
              Get started
            </Link>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-40"
              style={{
                background:
                  'linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)',
                backgroundSize: '200% 100%',
                filter: 'blur(10px)',
                animation: 'beam 12s linear infinite',
              }}
            />
            <div className="relative">
              <h3 className="text-xl font-semibold">Pro Upgrades</h3>
              <p className="text-white/70 text-sm mt-1">Buy once via x402, own on-chain.</p>
              <p className="mt-5 text-4xl font-extrabold tracking-tight">x402</p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  'Vanity path & custom domains',
                  'Premium template packs (Token-2022)',
                  'Collection-verified NFT add-ons',
                  'Advanced analytics',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-white/80">
                    <CheckIcon /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/store" className="mt-6 inline-flex rounded-xl bg-[#14F195] text-black font-semibold px-4 py-2 hover:opacity-90 transition">
                Browse store
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Answers to common questions.">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            ['Do you custody my funds?', 'No. Tips go directly to your wallet. We never custody keys.'],
            ['What wallets are supported?', 'Phantom is first-class; other Solana wallets coming next.'],
            ['Which currency do you support?', 'USDC on Solana for MVP. More assets later, guided by demand.'],
            ['How do upgrades work?', 'You purchase with x402. The backend verifies on-chain entitlements your editor reads at runtime.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-semibold">{q}</p>
              <p className="text-sm text-white/80 mt-2">{a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/docs" className="text-sm text-white/70 hover:text-white underline underline-offset-4">
            Read the docs
          </Link>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image src="/content/CrypTipLogo.png" alt="CrypTip" fill sizes="28px" className="object-cover" />
            </div>
            <p className="text-white/70 text-sm">© {new Date().getFullYear()} CrypTip • Built on Solana</p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-white/70">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#templates" className="hover:text-white">Templates</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <Link href="/login" className="rounded-lg border border-white/15 px-3 py-1.5 hover:bg-white/10 transition">Log in</Link>
          </nav>
        </div>

        {/* Scoped animations */}
        <style jsx>{`
          @keyframes beam {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
          }
          @keyframes float1 {
            0%, 100% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(10px,6px,0) scale(1.05); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(-12px,-8px,0) scale(1.06); }
          }
        `}</style>
      </footer>
    </main>
  );
}
