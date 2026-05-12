'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, Calendar, LogOut } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';
import { cn } from '@/shared/lib/utils';

const nav = [
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/matches',     label: 'Live Matches', icon: Calendar },
];

export function AppSidebar() {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-56 bg-green-900 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-green-700">
        <h2 className="text-white font-bold text-lg">SCF Admin</h2>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              path.startsWith(href)
                ? 'bg-green-700 text-white'
                : 'text-green-100 hover:bg-green-800',
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-green-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-green-100 hover:bg-green-800 w-full rounded-md">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
