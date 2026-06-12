import { useState, useRef, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { Layers, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  user: User;
  onNavigateSites: () => void;
  onNavigateHome: () => void;
}

export default function Header({ user, onNavigateSites, onNavigateHome }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-2.5 text-white hover:text-cyan-300 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center group-hover:bg-cyan-400 transition-colors">
          <Layers size={16} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide">SiteDrop</span>
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateSites}
          className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
        >
          My Sites
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
