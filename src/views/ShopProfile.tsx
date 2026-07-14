import { useState, useEffect } from 'react';
import { Store, ShieldCheck, Printer, Camera } from 'lucide-react';

import * as db from '../services/FirebaseService';

export default function ShopProfile({ shopId, userId }: { shopId: string, userId: string }) {
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<any>(db.getCachedBusinessSettings() || {});
  const [isLoading, setIsLoading] = useState(!db.getCachedBusinessSettings());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (userId) {
        const data = await db.getBusinessSettings(userId);
        if (data) {
          setSettings(data);
        }
      }
      setIsLoading(false);
    };
    if (!db.getCachedBusinessSettings()) {
      fetchSettings();
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      
      if (userId) {
        await db.saveBusinessSettings(userId, settings);
        alert('Shop profile saved successfully.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-zinc-400">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Shop Profile & Preferences</h2>
        <p className="text-zinc-400 text-sm mt-1">Manage your legal identity, tax compliance, and billing configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('company')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'company' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <Store size={18} /> Company Profile
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tax' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <ShieldCheck size={18} /> Tax & Compliance
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
          >
            <Printer size={18} /> Billing Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 lg:p-8 backdrop-blur-xl">
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-semibold text-zinc-100">Company Profile</h3>
                  <p className="text-sm text-zinc-400 mt-1">Your primary business information used on invoices.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop Name</label>
                    <input 
                      type="text" 
                      value={settings.shopName || ''} 
                      onChange={e => setSettings({...settings, shopName: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Shop Address</label>
                    <textarea 
                      rows={3}
                      value={settings.address || ''} 
                      onChange={e => setSettings({...settings, address: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" 
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Primary Contact Number</label>
                    <input 
                      type="text" 
                      value={settings.contactNumber || ''} 
                      onChange={e => setSettings({...settings, contactNumber: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={settings.email || ''} 
                      onChange={e => setSettings({...settings, email: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tax' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-semibold text-zinc-100">Tax & Compliance</h3>
                  <p className="text-sm text-zinc-400 mt-1">Configure your GST registration and default tax slabs.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">GSTIN (Optional)</label>
                    <input 
                      type="text" 
                      value={settings.gstin || ''} 
                      onChange={e => setSettings({...settings, gstin: e.target.value})}
                      placeholder="e.g. 24AAAAA1234A1Z1"
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 font-mono uppercase focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Default Tax Slab (%)</label>
                    <select
                      value={settings.defaultTaxSlab || '0'}
                      onChange={e => setSettings({...settings, defaultTaxSlab: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="0">0% (GST Exempt / Composite)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-semibold text-zinc-100">Billing Preferences</h3>
                  <p className="text-sm text-zinc-400 mt-1">Customize your invoice appearance and print settings.</p>
                </div>
                
                <div className="space-y-8 max-w-2xl">
                  <div className="flex items-start gap-6">
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/50 hover:border-indigo-500/50 hover:text-indigo-400 transition-colors cursor-pointer">
                      <Camera size={24} className="mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Logo</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h4 className="font-semibold text-zinc-200">Shop Logo</h4>
                      <p className="text-xs text-zinc-500 mt-1 mb-3">Upload your store logo to display on printed invoices. (Max 2MB)</p>
                      <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded border border-zinc-700 transition-colors">Choose File</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Print Paper Size</label>
                      <select 
                        value={settings.printPaperSize || 'A4'} 
                        onChange={e => setSettings({...settings, printPaperSize: e.target.value})}
                        className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="A4">A4 (Standard Printer)</option>
                        <option value="A5">A5 (Half Letter)</option>
                        <option value="Thermal">Thermal (2-inch / 3-inch POS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Invoice Layout Template</label>
                      <select 
                        value={settings.invoiceLayout || 'Professional'} 
                        onChange={e => setSettings({...settings, invoiceLayout: e.target.value})}
                        className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Professional">Professional (Clean & Modern)</option>
                        <option value="Classic">Classic (Traditional Table)</option>
                        <option value="Compact">Compact (Space Saving)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Terms & Conditions (Printed on Bill)</label>
                    <textarea 
                      rows={3}
                      value={settings.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.'} 
                      onChange={e => setSettings({...settings, termsAndConditions: e.target.value})}
                      className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 text-sm" 
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
