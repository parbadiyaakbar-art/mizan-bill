import { CheckCircle2, Info, Loader2, FileText, Shield, ExternalLink, HardDrive, FolderOpen, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

import { BUSINESS_TYPES } from './Onboarding';
import { BusinessType } from '../types';
import { getBusinessSettings, saveBusinessSettings, exportAllData, restoreAllData } from '../services/FirebaseService';
import { backupToDrive, restoreFromDrive } from '../services/GoogleDriveService';
import { getCachedAccessToken } from '../lib/firebase';
import LegalViewer from '../components/LegalViewer';

export default function Settings({ shopId, userId }: { shopId: string, userId: string }) {
  const [activeTab, setActiveTab] = useState('appSettings');
  const [showLegalViewer, setShowLegalViewer] = useState<'terms' | 'privacy' | null>(null);
  const [language, setLanguage] = useState(localStorage.getItem('mizan_lang') || 'English');
  const [theme, setTheme] = useState(localStorage.getItem('mizan_theme') || 'Dark Mode (Default)');
  const [waAlerts, setWaAlerts] = useState(localStorage.getItem('mizan_wa_alerts') !== 'false');
  const [smsAlerts, setSmsAlerts] = useState(localStorage.getItem('mizan_sms_alerts') !== 'false');
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [shopName, setShopName] = useState('');
  const [currency, setCurrency] = useState('INR');

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    localStorage.setItem('mizan_lang', e.target.value);
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    localStorage.setItem('mizan_theme', newTheme);
    if (newTheme === 'Light Mode') {
      document.documentElement.classList.remove('dark');
      // For tailwind class-based theming, this app currently forces dark mode everywhere with bg-zinc-950
      // We will just alert the user that light mode is a work-in-progress if they select it.
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleWaToggle = (e) => {
    setWaAlerts(e.target.checked);
    localStorage.setItem('mizan_wa_alerts', e.target.checked);
  };

  const handleSmsToggle = (e) => {
    setSmsAlerts(e.target.checked);
    localStorage.setItem('mizan_sms_alerts', e.target.checked);
  };
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
  const [isLocalDirSyncActive, setIsLocalDirSyncActive] = useState(localStorage.getItem('mizan_local_dir_sync') === 'true');
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleResetDemoData = async () => {
    if (!window.confirm('Are you sure you want to erase all demo transaction data? This will clear all invoices and reset your balance to zero, but keep your shop settings.')) return;
    
    setIsResetting(true);
    try {
      const { resetShopDemoData } = await import('../services/FirebaseService');
      await resetShopDemoData(shopId);
      alert('Demo data erased successfully.');
    } catch (err) {
      alert('Failed to reset demo data.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('REQUEST ACCOUNT DELETION: This will start a 15-day grace period. During this time, your account will be deactivated but data can be restored by contacting support. Proceed?')) return;
    
    setIsDeleting(true);
    try {
      await saveBusinessSettings(shopId, { 
        status: 'Pending_Deletion' as any, 
        deletionRequestedAt: new Date().toISOString() 
      });
      alert('Account deletion request submitted. Your account is now in a 15-day grace period.');
      window.location.reload(); 
    } catch (err) {
      alert('Failed to submit deletion request.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectLocalDir = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('Your browser does not support local directory access. Please use Chrome, Edge, or Brave on Desktop.');
        return;
      }
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      // Store handle in global for FirebaseService to use
      (window as any).mizanLocalDirHandle = handle;
      setIsLocalDirSyncActive(true);
      localStorage.setItem('mizan_local_dir_sync', 'true');
      alert('Local directory selected! PC Local-First Sync is now active. Invoices will be written directly to this folder.');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert('Failed to access directory: ' + err.message);
      }
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getBusinessSettings(shopId);
      if (settings) {
        if (settings.businessType) setBusinessType(settings.businessType as BusinessType);
        if (settings.allowNegativeStock !== undefined) setAllowNegativeStock(settings.allowNegativeStock);
        if (settings.timezone) setTimezone(settings.timezone);
        if (settings.shopName) setShopName(settings.shopName);
        if (settings.currency) setCurrency(settings.currency);
      }
    };
    fetchSettings();
  }, [shopId]);

  const handleSaveProfile = async () => {
    await saveBusinessSettings(shopId, { 
      businessType, 
      allowNegativeStock, 
      timezone, 
      shopName, 
      currency 
    });
    alert('Settings saved successfully.');
  };

  const handleForceBackup = async () => {
    const token = getCachedAccessToken();
    if (!token) {
       alert('Google Drive access token missing. Please sign out and sign in again with Google to authorize Google Drive backup.');
       return;
    }
    
    setIsBackingUp(true);
    setBackupStatus(null);
    try {
      const data = await exportAllData(userId);
      await backupToDrive(data);
      setBackupStatus("Backup to Google Drive successful!");
    } catch (error: any) {
      setBackupStatus(error.message || "Backup failed.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    const token = getCachedAccessToken();
    if (!token) {
       alert('Google Drive access token missing. Please sign out and sign in again with Google to authorize Google Drive backup.');
       return;
    }

    const confirmed = window.confirm('Are you sure you want to restore data from Google Drive? This will merge data into your current account.');
    if (!confirmed) return;

    setIsRestoring(true);
    setBackupStatus(null);
    try {
      const data = await restoreFromDrive();
      await restoreAllData(userId, data);
      setBackupStatus("Restore from Google Drive successful!");
      alert("Restore complete! Please refresh the page.");
    } catch (error: any) {
      setBackupStatus(error.message || "Restore failed.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">Settings</h2>
        <p className="text-zinc-400 mt-2">Manage your company profile, tax compliance, and billing preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex overflow-x-auto lg:flex-col gap-2 pb-4 lg:pb-0 hide-scrollbar">
            
            
            
            <button
              onClick={() => setActiveTab('business')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'business'
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              Business Settings
            </button>
            <button
              onClick={() => setActiveTab('appSettings')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'appSettings'
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              App Settings
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === 'account'
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              Account Settings
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'sync'
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              Sync & Backup
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'legal'
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium border-l-2 border-indigo-500 shadow-[inset_0_0_15px_rgba(99,102,241,0.05)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              Legal & Compliance
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`whitespace-nowrap px-4 py-3 text-left rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'danger'
                  ? 'bg-rose-500/10 text-rose-400 font-medium border-l-2 border-rose-500'
                  : 'text-rose-400/70 hover:bg-rose-900/10 hover:text-rose-400'
              }`}
            >
              <AlertTriangle size={16} />
              Danger Zone
            </button>
          </nav>
        </aside>

        <div className="flex-1 max-w-[800px] space-y-8">
          {activeTab === 'legal' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-semibold text-zinc-100">Legal & Compliance</h3>
                <p className="text-sm text-zinc-400 mt-1">Review legal agreements, privacy protocols, and compliance frameworks.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowLegalViewer('terms')}
                  className="group flex flex-col p-6 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-zinc-100 mb-1">Terms of Service</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Beta phase clauses, data loss disclaimers, and service availability terms.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
                    Read Document <ExternalLink className="w-3 h-3" />
                  </div>
                </button>

                <button 
                  onClick={() => setShowLegalViewer('privacy')}
                  className="group flex flex-col p-6 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left"
                >
                  <Shield className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-zinc-100 mb-1">Privacy Policy</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Data isolation protocols, encryption standards, and zero third-party sharing policies.
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
                    Read Document <ExternalLink className="w-3 h-3" />
                  </div>
                </button>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-xl">
                <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-indigo-400" />
                  Compliance Note
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  As we are in the Beta Phase, our legal framework is designed to provide maximum transparency regarding infrastructure migrations and data handling. We encourage all shop owners to maintain daily local JSON backups available in the Sync & Backup tab.
                </p>
              </div>
            </section>
          )}

          {activeTab === 'business' && (
            <section className="space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                 <h3 className="text-xl font-semibold text-zinc-100">Business Settings</h3>
                 <p className="text-sm text-zinc-400 mt-1">Configure shop-wide preferences and inventory rules.</p>
              </div>
              <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-8 backdrop-blur-xl">
                 <div className="space-y-6 max-w-md">
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop Name</label>
                     <input 
                       type="text" 
                       value={shopName} 
                       onChange={(e) => setShopName(e.target.value)} 
                       className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" 
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Business Type</label>
                     <select 
                       value={businessType} 
                       onChange={(e) => setBusinessType(e.target.value as BusinessType)} 
                       className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                     >
                       {BUSINESS_TYPES.map(type => (
                         <option key={type} value={type}>{type}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Timezone</label>
                     <select 
                       value={timezone} 
                       onChange={(e) => setTimezone(e.target.value)} 
                       className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                     >
                       <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                       <option value="UTC">UTC</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Currency</label>
                     <select 
                       value={currency} 
                       onChange={(e) => setCurrency(e.target.value)} 
                       className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                     >
                       <option value="INR">INR (₹)</option>
                       <option value="USD">USD ($)</option>
                     </select>
                   </div>
                   <div className="pt-4 border-t border-zinc-800">
                     <label className="flex items-center justify-between cursor-pointer">
                       <div>
                         <span className="text-sm font-medium text-zinc-300">Allow Negative Stock</span>
                         <p className="text-xs text-zinc-500 mt-0.5">Permit billing items even if current stock is zero.</p>
                       </div>
                       <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                         <input 
                           type="checkbox" 
                           checked={allowNegativeStock} 
                           onChange={(e) => setAllowNegativeStock(e.target.checked)} 
                           className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-indigo-500" 
                           style={{ right: allowNegativeStock ? 0 : 'auto', left: allowNegativeStock ? 'auto' : 0, borderColor: allowNegativeStock ? '#6366f1' : '#52525b' }} 
                         />
                         <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${allowNegativeStock ? 'bg-indigo-500' : 'bg-zinc-700'}`}></label>
                       </div>
                     </label>
                   </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-zinc-800">
                   <button 
                     onClick={handleSaveProfile}
                     className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
                   >
                     Save Business Settings
                   </button>
                 </div>
              </div>
            </section>
          )}

          {activeTab === 'appSettings' && (
            <section className="space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                 <h3 className="text-xl font-semibold text-zinc-100">App Settings</h3>
                 <p className="text-sm text-zinc-400 mt-1">Configure appearance and readability options.</p>
              </div>
              <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-8 backdrop-blur-xl">
                 <div className="space-y-6 max-w-md">
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Language Selection</label>
                     <select value={language} onChange={handleLanguageChange} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500">
                       <option>English</option>
                       <option>Gujarati (ગુજરાતી)</option>
                       <option>Hindi (हिन्दी)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Theme Mode</label>
                     <select value={theme} onChange={handleThemeChange} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500">
                       <option>Dark Mode (Default)</option>
                       <option>Light Mode</option>
                       <option>System Default</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Transaction Alerts</label>
                     <div className="space-y-3 mt-3">
                       <label className="flex items-center justify-between cursor-pointer">
                         <span className="text-sm font-medium text-zinc-300">WhatsApp Receipts (Intent Sharing)</span>
                         <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                           <input type="checkbox" checked={waAlerts} onChange={handleWaToggle} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-indigo-500" style={{ right: waAlerts ? 0 : 'auto', left: waAlerts ? 'auto' : 0, borderColor: waAlerts ? '#6366f1' : '#52525b' }} />
                           <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${waAlerts ? 'bg-indigo-500' : 'bg-zinc-700'}`}></label>
                         </div>
                       </label>
                       <label className="flex items-center justify-between cursor-pointer">
                         <span className="text-sm font-medium text-zinc-300">SMS Alerts (Intent Sharing)</span>
                         <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                           <input type="checkbox" checked={smsAlerts} onChange={handleSmsToggle} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-indigo-500" style={{ right: smsAlerts ? 0 : 'auto', left: smsAlerts ? 'auto' : 0, borderColor: smsAlerts ? '#6366f1' : '#52525b' }} />
                           <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${smsAlerts ? 'bg-indigo-500' : 'bg-zinc-700'}`}></label>
                         </div>
                       </label>
                     </div>
                   </div>
                 </div>
                 <div className="mt-8 pt-6 border-t border-zinc-800">
                   <button 
                     onClick={() => {
                       alert('Settings Saved! Applying changes...');
                       window.location.reload();
                     }}
                     className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors"
                   >
                     Save & Apply Settings
                   </button>
                 </div>
              </div>
            </section>
          )}

          {activeTab === 'account' && (
            <section className="space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-semibold text-zinc-100">Account Settings</h3>
                <p className="text-sm text-zinc-400 mt-1">Manage your user profile and security.</p>
              </div>
              <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-8 backdrop-blur-xl">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    AD
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-100 text-lg">Admin User</h4>
                    <p className="text-sm text-zinc-400">admin@enterprise.com</p>
                  </div>
                  <button className="ml-auto px-4 py-2 border border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-800 hover:border-indigo-500/50 transition-colors">
                    Change Avatar
                  </button>
                </div>
                <div className="space-y-8 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input type="text" defaultValue="Admin User" className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                  </div>
                  <hr className="border-zinc-800" />
                  <div className="space-y-6">
                    <h5 className="font-semibold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.3)]">Security</h5>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Current Password</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">New Password</label>
                      <input type="password" placeholder="Enter new password" className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <button className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-700 hover:border-indigo-500/50 transition-colors">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
          {activeTab === 'sync' && (
            <section className="space-y-6">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-semibold text-zinc-100">Hybrid Sync & Backup</h3>
                <p className="text-sm text-zinc-400 mt-1">Manage local storage, live cloud sync, and Google Drive backups.</p>
              </div>
              <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-8 backdrop-blur-xl">
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        Local Database (IndexedDB)
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Saves all data locally when offline.</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">Active</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        Export Data Backup (.json)
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Generate a backup file to share via Gmail or save to Google Drive manually.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          const data = await exportAllData(userId);
                          const jsonString = JSON.stringify(data, null, 2);
                          const blob = new Blob([jsonString], { type: 'application/json' });
                          
                          // Try native sharing if available (Android/iOS)
                          if (navigator.share) {
                            try {
                              const file = new File([blob], `mizan_bill_backup_${new Date().toISOString().split('T')[0]}.json`, { type: 'application/json' });
                              await navigator.share({
                                title: 'Mizan Bill Backup',
                                text: 'My database backup for Mizan Bill App',
                                files: [file]
                              });
                              return;
                            } catch (err) {
                              console.warn('Share failed, falling back to download:', err);
                            }
                          }
                          
                          // Fallback to direct download
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `mizan_bill_backup_${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors flex items-center gap-2"
                      >
                        <ExternalLink size={16} />
                        Export & Share
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        Import Data Backup
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Restore your database from a previously exported .json file.</p>
                    </div>
                    <label className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2">
                      <FolderOpen size={16} />
                      Import JSON
                      <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (!window.confirm('Are you sure you want to import this backup? Current data will be merged.')) return;
                          
                          setIsRestoring(true);
                          try {
                            const text = await file.text();
                            const data = JSON.parse(text);
                            await restoreAllData(userId, data);
                            alert('Data imported successfully! Refreshing...');
                            window.location.reload();
                          } catch (err) {
                            alert('Failed to import backup: ' + (err instanceof Error ? err.message : 'Unknown error'));
                          } finally {
                            setIsRestoring(false);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                    <div>
                      <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Live Cloud Sync (Firebase)
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Real-time sync to the cloud database when online.</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full border border-blue-500/20">Connected</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Google Drive Backup
                      </h4>
                      <p className="text-sm text-zinc-400 mt-1">Automatically uploads an encrypted backup file to Drive.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleRestoreBackup}
                        disabled={isRestoring || isBackingUp}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isRestoring ? 'Restoring...' : 'Restore Data'}
                      </button>
                      <button 
                        onClick={handleForceBackup}
                        disabled={isBackingUp || isRestoring}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-[0_0_10px_rgba(79,70,229,0.3)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isBackingUp ? 'Backing up...' : 'Sync & Backup Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'danger' && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-xl font-bold text-rose-400">Danger Zone</h3>
                <p className="text-sm text-zinc-400 mt-1">Critical account management and data purging tools.</p>
              </div>

              <div className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-xl">
                    <RefreshCw className="text-rose-500" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">Erase Demo Data</h4>
                    <p className="text-sm text-zinc-400 mt-1">
                      This will programmatically purge all transactional data (invoices, expenses, logs) created during your trial period.
                    </p>
                    <ul className="text-xs text-rose-300/60 mt-2 space-y-1 list-disc list-inside">
                      <li>Resets account balance to zero</li>
                      <li>Keeps shop profile and credentials</li>
                      <li>Deletes all transactional records permanently</li>
                    </ul>
                    <button 
                      onClick={handleResetDemoData}
                      disabled={isResetting}
                      className="mt-4 px-6 py-2.5 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      {isResetting ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                      {isResetting ? 'Purging Staging Data...' : 'Execute Demo Reset'}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-rose-500/10" />

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-xl">
                    <Trash2 className="text-rose-500" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white">Request Account Deletion</h4>
                    <p className="text-sm text-zinc-400 mt-1">
                      Initiate the 15-day grace period for account deletion.
                    </p>
                    <div className="bg-zinc-950/50 p-4 rounded-xl mt-3 border border-zinc-800">
                      <p className="text-xs text-zinc-500 leading-relaxed italic">
                        "Your account will enter a <span className="text-amber-500 font-bold">Pending_Deletion</span> state. You will have 15 days to retract this request. After the grace period, all data will be securely and irreversibly purged from our servers."
                      </p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="mt-4 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2"
                    >
                      {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      {isDeleting ? 'Submitting Request...' : 'Delete My Account'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      {showLegalViewer && (
        <LegalViewer 
          type={showLegalViewer} 
          onClose={() => setShowLegalViewer(null)} 
        />
      )}
    </div>
  );
}
