// components/NavBar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import clsx from 'clsx';

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={clsx(
        'px-3 py-2 rounded-lg transition',
        active ? 'bg-white/20' : 'hover:bg-white/10'
      )}
    >
      {label}
    </Link>
  );
};

export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 bg-black/30 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-white tracking-wide">CrypTip</Link>
        <nav className="flex items-center gap-2 text-sm">
          <NavLink href="/store" label="Store" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/editor" label="Editor" />
          <NavLink href="/docs" label="Docs" />
        </nav>
        <WalletMultiButton className="!rounded-xl !bg-[#14F195] !text-black hover:!opacity-90" />
      </div>
    </header>
  );
}
