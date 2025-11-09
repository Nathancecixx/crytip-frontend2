// components/NavBar.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import clsx from 'clsx';
import logo from "content/CryptipLogo"

// Keep links only to routes that exist in your app.
const links: { href: Route; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/editor', label: 'Editor' },
  { href: '/store', label: 'Store' },
  { href: '/docs', label: 'Docs' },
];

function NavLink({ href, label }: { href: Route; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'group relative px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active
          ? 'text-white'
          : 'text-white/80 hover:text-white'
      )}
    >
      <span>{label}</span>
      {/* Animated gradient underline on hover/active */}
      <span
        className={clsx(
          'pointer-events-none absolute left-2 right-2 -bottom-[2px] h-[2px] rounded-full',
          'bg-[linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)] bg-[length:200%_100%]',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          active && 'opacity-100',
        )}
        style={{ animation: 'beam 6s linear infinite' }}
      />
    </Link>
  );
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 backdrop-blur-md border-b transition-colors',
        scrolled ? 'bg-black/50 border-white/10' : 'bg-black/30 border-white/5'
      )}
    >
      {/* Aurora / Solana gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-16 -left-24 h-44 w-72 blur-3xl opacity-40"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #9945FF55 0%, transparent 70%)', animation: 'float1 14s ease-in-out infinite' }} />
        <div className="absolute -bottom-20 left-1/3 h-48 w-80 blur-3xl opacity-40"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #00FFA355 0%, transparent 70%)', animation: 'float2 16s ease-in-out infinite 1.2s' }} />
        <div className="absolute -top-24 right-0 h-56 w-96 blur-3xl opacity-35"
             style={{ background: 'radial-gradient(60% 60% at 50% 50%, #14F19555 0%, transparent 75%)', animation: 'float1 18s ease-in-out infinite 0.6s' }} />
      </div>

      {/* Subtle animated 1px glow line */}
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

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7 rounded-lg overflow-hidden ring-1 ring-white/10">
            <Image
              src="/content/CrypTipLogo.png"
              alt="CrypTip"
              fill
              sizes="28px"
              className="object-cover"
              priority
            />
          </div>
          <span className="hidden sm:inline-block text-base font-semibold tracking-wide text-white">
            CrypTip
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </nav>

        {/* Wallet button (wrapped in a gradient ring for Solana vibe) */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[2px] rounded-xl"
            style={{
              background:
                'linear-gradient(90deg,#9945FF,#14F195,#00FFA3,#9945FF)',
              backgroundSize: '200% 100%',
              filter: 'blur(6px)',
              animation: 'beam 10s linear infinite',
              opacity: 0.4,
            }}
          />
          <WalletMultiButton className="relative !rounded-xl !bg-[#14F195] !text-black hover:!opacity-90 !h-10 !px-4 !text-sm !font-semibold" />
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 text-white/90 hover:text-white hover:border-white/20 transition-colors"
        >
          <svg
            className={clsx('h-5 w-5 transition-transform', open && 'rotate-90')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu sheet */}
      <div
        className={clsx(
          'md:hidden overflow-hidden transition-[max-height,opacity] duration-300',
          open ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="px-4 pb-3 pt-0 grid grid-cols-1 gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-white/90 hover:text-white hover:bg-white/10 transition"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Component-scoped animations */}
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
    </header>
  );
}
