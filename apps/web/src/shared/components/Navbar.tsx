import Link from 'next/link';

export function Navbar() {
  return (
    <header className="bg-brand-dark shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          Cricket Fiesta
        </Link>
        <nav className="flex gap-4 text-sm text-green-200">
          <Link href="/" className="hover:text-white transition-colors">Tournaments</Link>
        </nav>
      </div>
    </header>
  );
}
