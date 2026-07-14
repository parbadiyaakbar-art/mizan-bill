import { Search, Bell, HelpCircle, LogOut, CloudOff, Database, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onLogout: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleDbWrite = () => {
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    };
    window.addEventListener('indexeddb-write', handleDbWrite);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('indexeddb-write', handleDbWrite);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-64 flex justify-between items-center px-8 z-10 h-16 w-[calc(100%-16rem)] border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex-1 max-w-md relative flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:bg-zinc-950 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-sm transition-all outline-none text-zinc-100"
          />
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
          !isOnline 
            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
            : isSyncing
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {!isOnline ? (
            <>
              <CloudOff size={14} />
              <span>Offline (Local)</span>
            </>
          ) : isSyncing ? (
            <>
              <Database size={14} className="animate-pulse" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>Synced</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-zinc-400">
        <button className="hover:text-indigo-400 transition-colors">
          <Bell size={20} />
        </button>
        <button className="hover:text-indigo-400 transition-colors">
          <HelpCircle size={20} />
        </button>
        <button 
          onClick={onLogout}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:border-red-500 transition-all hover:text-red-400"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
