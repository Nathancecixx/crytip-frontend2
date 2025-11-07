'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clsx } from 'clsx';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={clsx('px-3 py-2 rounded-lg', active ? 'bg-white/20' : 'hover:bg-white/10')}>
      {children}
    </Link>
  );
};

export default function NavBar() {
  return (
    <header className="sticky top-0 z-20 bg-black/30 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-white">Crypto Tip Jar</Link>
        <nav className="flex items-center gap-2 text-sm">
          <NavLink href="/store">Store</NavLink>
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/editor">Editor</NavLink>
          <NavLink href="/docs">Docs</NavLink>
        </nav>
        <WalletMultiButton className="!rounded-xl !bg-brand-600 hover:!bg-brand-500" />
      </div>
    </header>
  );
}
