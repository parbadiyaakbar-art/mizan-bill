import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  FileText,
  Wallet,
  Settings,
  Users,
  Banknote,
  CreditCard,
  Calculator,
  PackageMinus,
  ChevronDown,
  ChevronRight,
  Package,
  Share2,
  Smartphone,
  Wifi,
  WifiOff,
  Cloud,
  HardDrive,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { View } from '../types';
import { getPlatformMode } from '../utils/platform';
import { onSnapshotsInSync } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onOpenExpensesModal?: () => void;
  userRole: 'Owner' | 'Staff' | 'Admin';
  expiryDate?: string;
}

export default function Sidebar({ currentView, onViewChange, onOpenExpensesModal, userRole, expiryDate }: SidebarProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const platformMode = getPlatformMode();

  const getDaysRemaining = () => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for Firestore sync events
    let unsubscribeSync: () => void;
    const timer = setTimeout(() => {
      unsubscribeSync = onSnapshotsInSync(db, () => {
        setIsSyncing(false);
      });
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
      if (unsubscribeSync) unsubscribeSync();
    };
  }, []);

  const [paymentsOpen, setPaymentsOpen] = useState(
    currentView === 'customer-payments' || currentView === 'supplier-payments'
  );

  const navItems = [
    { id: 'daily-cash', label: 'Daily Cash / Rojmel', icon: Calculator },
    { 
      id: 'payments-group', 
      label: 'નાણાકીય લેણ-દેણ (Payments)', 
      icon: Banknote,
      subItems: [
        { id: 'customer-payments', label: 'ઉઘરાણી આવી (Money In)' },
        { id: 'supplier-payments', label: 'ચૂકવણી કરી (Money Out)' }
      ]
    },
    { id: 'inventory', label: 'Inventory / Stock', icon: Package },
    { id: 'contacts', label: 'Contacts & Parties', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gst', label: 'GST Returns', icon: Wallet },
    { id: 'expenses-modal', label: 'Shop Expenses & Wastage', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'releases', label: 'Download Builds', icon: Smartphone },
    { id: 'admin', label: 'Admin Control', icon: ShieldAlert },
    { id: 'share-app', label: 'Refer a Friend', icon: Share2 },
  ].filter(item => {
    if (userRole === 'Staff') {
      const restricted = ['gst', 'users', 'settings', 'shop-profile', 'admin'];
      return !restricted.includes(item.id);
    }
    if (userRole !== 'Admin' && item.id === 'admin') {
      return false;
    }
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-20">
      <div 
        className="h-16 flex items-center px-6 border-b border-zinc-800 mb-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => onViewChange('shop-profile')}
      >
        <div className="w-8 h-8 rounded bg-indigo-500 text-white flex items-center justify-center mr-3 font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">M</div>
        <div>
          <div className="text-xl font-bold text-indigo-400">Mizan Bill</div>
          <div className="text-xs text-zinc-400">GST Management</div>
        </div>
      </div>

      {daysRemaining !== null && (
        <div className="px-4 mb-4">
          <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${daysRemaining <= 3 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-indigo-500/5 border-indigo-500/10 text-indigo-400'}`}>
            <div className="flex items-center gap-2">
              <CreditCard size={14} className={daysRemaining <= 3 ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {daysRemaining <= 0 ? 'Trial Expired' : `${daysRemaining} Days Left`}
              </span>
            </div>
            <button 
              onClick={() => onViewChange('settings')}
              className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
            >
              {daysRemaining <= 0 ? 'Renew' : 'Upgrade'}
            </button>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map((item) => {
          if (item.subItems) {
            const isGroupActive = item.subItems.some(sub => currentView === sub.id);
            const Icon = item.icon;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => setPaymentsOpen(!paymentsOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${
                    isGroupActive && !paymentsOpen
                      ? 'bg-indigo-500/5 text-indigo-300 font-bold border border-indigo-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isGroupActive && !paymentsOpen ? 'text-indigo-400' : ''} />
                    <span>{item.label}</span>
                  </div>
                  {paymentsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {paymentsOpen && (
                  <div className="pl-11 pr-2 space-y-1">
                    {item.subItems.map(sub => {
                      const isSubActive = currentView === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onViewChange(sub.id as View)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isSubActive
                              ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                          }`}
                        >
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = currentView === item.id || currentView === (item.id + '-new');
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'expenses-modal' && onOpenExpensesModal) {
                  onOpenExpensesModal();
                } else if (item.id === 'share-app') {
                  alert('Referral System: Coming Soon');
                } else {
                  onViewChange(item.id as View);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-400' : ''} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/20 space-y-2">
        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30`}>
          <div className="flex items-center gap-2 text-zinc-400">
            {platformMode === 'PC_LOCAL_FIRST' ? <HardDrive size={14} /> : <Cloud size={14} />}
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {platformMode === 'PC_LOCAL_FIRST' ? 'Local-First (PC)' : 'Cloud-Only (Mobile)'}
            </span>
          </div>
          {platformMode === 'PC_LOCAL_FIRST' && isOnline && (
            <RefreshCw size={12} className={`text-indigo-400 ${isSyncing ? 'animate-spin' : 'opacity-30'}`} />
          )}
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isOnline ? 'border-teal-500/20 bg-teal-500/5 text-teal-400' : 'border-rose-500/20 bg-rose-500/5 text-rose-400'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="text-[10px] uppercase font-bold tracking-wider">
            {isOnline ? 'Network Active' : 'Offline Engine'}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 mt-auto border-t border-zinc-800/80 bg-zinc-950/50">
        <div className="text-xs text-zinc-500 text-center leading-relaxed">
          <p className="font-semibold text-zinc-400 mb-1">Help & Support</p>
          <p>Developed & Powered by:</p>
          <p className="text-indigo-400 font-semibold mb-1">Parbadiya Infotech</p>
          <a 
            href="https://wa.me/918849183347?text=Hello%20Parbadiya%20Infotech%2C%20I%20want%20to%20Join%20Now%20and%20activate%20Mizan%20Bill%20for%20my%20shop." 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] block hover:text-indigo-400 transition-colors"
          >
            Support: +91 8849183347
          </a>
          <a 
            href="mailto:PARBADIYAINFOTECH@GMAIL.COM" 
            className="text-[10px] block hover:text-indigo-400 transition-colors"
          >
            Email: PARBADIYAINFOTECH@GMAIL.COM
          </a>
          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-zinc-800/50">
            <button 
              onClick={() => onViewChange('privacy-policy')}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => onViewChange('terms-of-service')}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
