import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import ProfitLoss from './views/ProfitLoss';
import { subscribeToAuth, signOut, getCurrentUser } from './services/AuthService';
import { 
  getBusinessSettings, 
  saveBusinessSettings, 
  restoreAllData, 
  logError, 
  getUserProfile,
  subscribeToAdminConfig 
} from './services/FirebaseService';
import { restoreFromDrive } from './services/GoogleDriveService';
import { getCachedAccessToken } from './lib/firebase';
import { View, BusinessType, User as AppUser, AdminConfig } from './types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

// Lazy load views
const Login = lazy(() => import('./views/Login'));
const Onboarding = lazy(() => import('./views/Onboarding'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Settings = lazy(() => import('./views/Settings'));
const ShopProfile = lazy(() => import('./views/ShopProfile'));
const Releases = lazy(() => import('./views/Releases'));
const GSTReturns = lazy(() => import('./views/GSTReturns'));
const Quotations = lazy(() => import('./views/Quotations'));
const Users = lazy(() => import('./views/Users'));
const Sales = lazy(() => import('./views/Sales'));
const Purchases = lazy(() => import('./views/Purchases'));
const CustomerPayments = lazy(() => import('./views/CustomerPayments'));
const SupplierPayments = lazy(() => import('./views/SupplierPayments'));
const ShopExpenses = lazy(() => import('./views/ShopExpenses'));
const StockWastage = lazy(() => import('./views/StockWastage'));
const DailyCash = lazy(() => import('./views/DailyCash'));
const Contacts = lazy(() => import('./views/Contacts'));
const Inventory = lazy(() => import('./views/Inventory'));
const AdminPanel = lazy(() => import('./views/AdminPanel'));
const About = lazy(() => import('./views/About'));
const Subscription = lazy(() => import('./views/Subscription'));
const LegalPage = lazy(() => import('./views/LegalPage'));

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LandingPage from './views/LandingPage';
import { getGlobalConfig } from './services/FirebaseService';
import ExpensesWastageModal from './components/ExpensesWastageModal';

import { isNative } from './utils/platform';

import { SyncService, SyncStatus } from './services/SyncService';
import { ShieldAlert, Wifi, Lock as LockIcon, AlertTriangle, LogOut } from 'lucide-react';

export default function App() {
  const getInitialView = (): View => {
    if (isNative()) return 'login';
    const path = window.location.pathname;
    if (path === '/login') return 'login';
    if (path === '/releases') return 'releases';
    if (path === '/privacy-policy') return 'privacy-policy';
    if (path === '/terms-of-service') return 'terms-of-service';
    if (path === '/about') return 'about';
    if (window.location.hostname === 'app.mizanbill.com') return 'login';
    return 'landing';
  };

  const [currentView, setCurrentView] = useState<View>(getInitialView());
  const [showExpensesModal, setShowExpensesModal] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [shopStatus, setShopStatus] = useState<'Active' | 'Pending_Deletion'>('Active');
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<'Active' | 'Suspended' | 'Blocked'>('Active');
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Use a ref to track currentView for the auth listener closure
  const viewRef = useRef<View>(currentView);
  useEffect(() => {
    viewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    // Apply theme on load
    const savedTheme = localStorage.getItem('mizan_theme') || 'Dark Mode (Default)';
    if (savedTheme === 'Light Mode') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    setLoading(true);

    // Initial Sync Check
    const status = SyncService.getSyncStatus();
    setSyncStatus(status);

    // Safety timeout: If auth takes too long, stop loading to show the landing page
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = subscribeToAuth((mappedUser) => {
      clearTimeout(safetyTimeout);
      const currentViewAtTime = viewRef.current;
      
      if (mappedUser) {
        // SECURITY: Super Admin check
        const isAdminRoute = window.location.pathname === '/mizan-admin';
        if (isAdminRoute && mappedUser.email !== 'parbadiyaakbar@gmail.com') {
          signOut().then(() => {
            setUser(null);
            setCurrentView('login');
            window.history.pushState({}, '', '/');
            setLoading(false);
          });
          return;
        }

        setUser(mappedUser);
        
        // Update sync timestamp if online after login
        if (navigator.onLine) {
          SyncService.updateSyncTimestamp();
          setSyncStatus(SyncService.getSyncStatus());
        }
        
        // Instant view transition for auto-login (from Landing only)
        if (currentViewAtTime === 'landing' || currentViewAtTime === 'login') {
          setCurrentView('dashboard');
        }
        
        // Background tasks
        setTimeout(() => checkOnboarding(mappedUser), 0);
      } else {
        setUser(null);
        if (currentViewAtTime !== 'releases' && currentViewAtTime !== 'login' && currentViewAtTime !== 'privacy-policy' && currentViewAtTime !== 'terms-of-service') {
          setCurrentView(window.location.hostname === 'app.mizanbill.com' || isNative() ? 'login' : 'landing');
        }
      }
      setLoading(false);
    });

    // Admin Config Listener
    const unsubAdmin = subscribeToAdminConfig((config) => {
      setAdminConfig(config);
    });

    return () => {
      unsubscribe();
      unsubAdmin();
    };
  }, []);

  useEffect(() => {
    if (!user || isNative()) return;

    // Listen to user status changes (Blocked/Suspended)
    const unsubStatus = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.status) {
          setUserStatus(data.status);
        }
      }
    });

    return () => unsubStatus();
  }, [user]);

  useEffect(() => {
    // Universal Router: Path detection
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/mizan-admin') {
        setCurrentView('admin');
      } else if (path === '/releases') {
        setCurrentView('releases');
      } else if (path === '/login') {
        setCurrentView('login');
      } else if (path === '/privacy-policy') {
        setCurrentView('privacy-policy');
      } else if (path === '/terms-of-service') {
        setCurrentView('terms-of-service');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logError(user?.id, user?.shopId, event.error?.message || 'Unknown error', event.error?.stack);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      logError(user?.id, user?.shopId, `Unhandled Rejection: ${event.reason}`, event.reason?.stack);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [user]);

  const checkOnboarding = async (currentUser: AppUser) => {
    const settings = await getBusinessSettings(currentUser.shopId);
    if (settings) {
      if (settings.status === 'Pending_Deletion') {
        setShopStatus('Pending_Deletion');
        setDeletionDate(settings.deletionRequestedAt || null);
      } else {
        setShopStatus('Active');
      }
    }

    if (!settings || !settings.onboardingCompleted) {
      if (currentUser.role === 'Staff') {
        setShowOnboarding(false);
        return;
      }
      // Try to auto-restore from Google Drive if token exists
      const token = getCachedAccessToken();
      if (token) {
        try {
          const data = await restoreFromDrive();
          if (data && Object.keys(data).length > 0) {
            await restoreAllData(currentUser.id, data);
            setShowOnboarding(false);
            return;
          }
        } catch (err) {
          console.log('No backup found or error restoring:', err);
        }
      }
      setShowOnboarding(true);
    } else {
      // If onboarding is completed, check subscription status
      // We'll trust the user object's expiryDate (mapped from Firestore profile)
      setUser(prev => prev ? ({ ...prev, expiryDate: settings.expiryDate || prev.expiryDate }) : null);
    }
  };

  const handleLogin = (userData: AppUser) => {
    setUser(userData);
    setCurrentView('dashboard');
    checkOnboarding(userData).catch(err => console.error('Onboarding check failed:', err));
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentView('login');
  };

  const handleOnboardingComplete = async (businessType: BusinessType | '', shopName: string, stateCode: string) => {
    if (user) {
      const globalConfig = await getGlobalConfig();
      const trialDays = globalConfig.trialDays || 15;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + trialDays);

      const settingsData: any = { 
        onboardingCompleted: true,
        businessType: businessType || '',
        shopName: shopName,
        stateCode: stateCode,
        expiryDate: expiryDate.toISOString(),
        defaultInvoiceFormat: 'Tax Invoice',
        printPaperSize: 'A4',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        allowNegativeStock: true,
        nextSalesNo: 1,
        nextPurchaseNo: 1,
        nextQuotationNo: 1,
        updated_at: new Date().toISOString()
      };
      await saveBusinessSettings(user.shopId, settingsData);
      setUser(prev => prev ? ({ ...prev, expiryDate: settingsData.expiryDate }) : null);
    }
    setShowOnboarding(false);
    setCurrentView('dashboard');
  };

  if (syncStatus?.isLocked && user?.email !== 'parbadiyaakbar@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20 animate-pulse">
            <LockIcon className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Sync Required</h2>
            <p className="text-zinc-400">
              Internet connection required. You have been offline for more than 7 days. 
              Please connect to the internet to verify your subscription and continue using the app.
            </p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3 text-left">
            <Wifi className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Last Verified Sync</p>
              <p className="text-white font-mono text-sm">{new Date(syncStatus.lastSync).toLocaleString()}</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
          >
            <Wifi className="w-5 h-5" />
            Check Connection
          </button>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="space-y-3 w-full max-w-md">
          <div className="h-4 bg-zinc-900 rounded-full w-3/4 mx-auto animate-pulse"></div>
          <div className="h-3 bg-zinc-900/50 rounded-full w-1/2 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentView === 'admin') {
      return (
        <Suspense fallback={<div>Loading Admin...</div>}>
          <AdminPanel />
        </Suspense>
      );
    }
    if (currentView === 'login') {
      return <Login onLogin={handleLogin} />;
    }
    if (currentView === 'releases') {
      return (
        <div className="bg-zinc-950 min-h-screen">
          <nav className="border-b border-zinc-800 bg-zinc-950 p-6 flex justify-between items-center">
            <button onClick={() => {
              setCurrentView('landing');
              window.history.pushState({}, '', '/');
            }} className="text-zinc-100 font-bold text-xl tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm italic">M</span>
              </div>
              Mizan Bill
            </button>
            <button onClick={() => {
              setCurrentView('login');
              window.history.pushState({}, '', '/login');
            }} className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold">Login</button>
          </nav>
          <Releases />
        </div>
      );
    }
    if (currentView === 'privacy-policy') {
      return <LegalPage type="privacy" onBack={() => {
        setCurrentView('landing');
        window.history.pushState({}, '', '/');
      }} />;
    }
    if (currentView === 'terms-of-service') {
      return <LegalPage type="terms" onBack={() => {
        setCurrentView('landing');
        window.history.pushState({}, '', '/');
      }} />;
    }
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <LandingPage 
          onLogin={() => {
            setCurrentView('login');
            window.history.pushState({}, '', '/login');
          }} 
          onViewReleases={() => {
            setCurrentView('releases');
            window.history.pushState({}, '', '/releases');
          }} 
          onViewPrivacy={() => {
            setCurrentView('privacy-policy');
            window.history.pushState({}, '', '/privacy-policy');
          }}
          onViewTerms={() => {
            setCurrentView('terms-of-service');
            window.history.pushState({}, '', '/terms-of-service');
          }}
        />
      </Suspense>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (userStatus !== 'Active' && user.email !== 'parbadiyaakbar@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border-2 ${userStatus === 'Blocked' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            <span className="text-3xl">{userStatus === 'Blocked' ? '🚫' : '⏳'}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Account {userStatus}</h2>
            <p className="text-zinc-400">
              {userStatus === 'Blocked' 
                ? 'Your account has been blocked by the administrator due to a violation of beta terms.' 
                : 'Your beta trial has been suspended. Please contact the admin to extend your trial.'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (shopStatus === 'Pending_Deletion' && user.email !== 'parbadiyaakbar@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-rose-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Deactivation Pending</h2>
            <p className="text-zinc-400">This account is currently in a 15-day grace period for deletion.</p>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Request Date</p>
            <p className="text-white font-mono">{deletionDate ? new Date(deletionDate).toLocaleDateString() : 'Unknown'}</p>
          </div>
          <p className="text-sm text-zinc-500">
            All billing and workflows are frozen. To retract this request and restore your data, please contact our support team immediately.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    // SUBSCRIPTION ENFORCEMENT
    // Super Admin bypass
    const isSuperAdmin = user.email === 'parbadiyaakbar@gmail.com';
    const isExpired = user.expiryDate && new Date(user.expiryDate) < new Date();

    const viewContent = (() => {
      if (isExpired && !isSuperAdmin && currentView !== 'shop-profile') {
        return <Subscription user={user} />;
      }

      switch (currentView) {
        case 'dashboard':
          return <Dashboard onViewChange={setCurrentView} shopId={user.shopId} userId={user.id} />;
        case 'inventory':
          return <Inventory shopId={user.shopId} userId={user.id} />;
        case 'settings':
          return <Settings shopId={user.shopId} userId={user.id} />;
        case 'about':
          return <About />;
        case 'shop-profile':
          return <ShopProfile shopId={user.shopId} userId={user.id} />;
        case 'releases':
          return <Releases />;
        case 'gst':
          return <GSTReturns shopId={user.shopId} userId={user.id} />;
        case 'quotations':
          return <Quotations startCreating={false} shopId={user.shopId} userId={user.id} />;
        case 'quotations-new':
          return <Quotations startCreating={true} shopId={user.shopId} userId={user.id} />;

        case 'users':
          return <Users shopId={user.shopId} userId={user.id} />;
        case 'sales':
          return <Sales startCreating={false} shopId={user.shopId} userId={user.id} />;
        case 'sales-new':
          return <Sales startCreating={true} shopId={user.shopId} userId={user.id} />;

        case 'purchases':
          return <Purchases startCreating={false} shopId={user.shopId} userId={user.id} />;
        case 'purchases-new':
          return <Purchases startCreating={true} shopId={user.shopId} userId={user.id} />;

        case 'customer-payments':
          return <CustomerPayments shopId={user.shopId} userId={user.id} />;
        case 'supplier-payments':
          return <SupplierPayments shopId={user.shopId} userId={user.id} />;
        case 'daily-cash':
          return <DailyCash onViewChange={setCurrentView} shopId={user.shopId} userId={user.id} />;
        case 'shop-expenses':
          return <ShopExpenses shopId={user.shopId} userId={user.id} />;
        case 'profit-loss': return <ProfitLoss onBack={() => setCurrentView('dashboard')} shopId={user.shopId} userId={user.id} />;
        case 'stock-wastage':
          return <StockWastage shopId={user.shopId} userId={user.id} />;
        case 'contacts':
          return <Contacts shopId={user.shopId} userId={user.id} />;
        case 'admin':
          if (user.email !== 'parbadiyaakbar@gmail.com') {
            setCurrentView('dashboard');
            return <Dashboard onViewChange={setCurrentView} shopId={user.shopId} userId={user.id} />;
          }
          return <AdminPanel />;
        case 'privacy-policy':
          return <LegalPage type="privacy" onBack={() => {
            setCurrentView(user ? 'dashboard' : 'login');
            window.history.pushState({}, '', '/');
          }} />;
        case 'terms-of-service':
          return <LegalPage type="terms" onBack={() => {
            setCurrentView(user ? 'dashboard' : 'login');
            window.history.pushState({}, '', '/');
          }} />;
        default:
          return <Dashboard onViewChange={setCurrentView} shopId={user.shopId} userId={user.id} />;
      }
    })();

    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm animate-pulse">Loading module...</p>
        </div>
      }>
        {viewContent}
      </Suspense>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setSidebarOpen(false);
        }} 
        onOpenExpensesModal={() => {
          setShowExpensesModal(true);
          setSidebarOpen(false);
        }} 
        userRole={user.role}
        expiryDate={user.expiryDate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header onLogout={handleLogout} onMenuClick={() => setSidebarOpen(true)} />
      {syncStatus?.isWarning && !syncStatus.isLocked && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 animate-in slide-in-from-top duration-500">
          <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-500">Sync Required</p>
              <p className="text-xs text-zinc-400">
                You've been offline for {Math.floor(syncStatus.daysSinceLastSync)} days. 
                Sync online within <b>{syncStatus.daysRemaining} days</b> to avoid locking.
              </p>
            </div>
          </div>
        </div>
      )}
      {adminConfig && adminConfig.updateMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right duration-500">
          <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-md border border-indigo-400/30">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl">📢</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Message from Admin</p>
              <p className="text-sm font-medium leading-relaxed">{adminConfig.updateMessage}</p>
            </div>
            <button 
              onClick={() => setAdminConfig(null)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <main className="pt-16 min-h-screen">
        <div className="p-4 sm:p-8">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-zinc-500 text-sm animate-pulse">Loading view...</p>
            </div>
          }>
            {renderView()}
          </Suspense>
        </div>
      </main>
      {showExpensesModal && (
        <ExpensesWastageModal 
          onClose={() => setShowExpensesModal(false)} 
          shopId={user.shopId} 
          userId={user.id} 
        />
      )}
    </div>
  );
}
