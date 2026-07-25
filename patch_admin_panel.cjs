const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, Image as ImageIcon, Phone, Bell, Shield, LogOut, CheckCircle, Smartphone, Monitor, Save, RefreshCw, X, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { getAdminSettings, saveAdminSettings } from '../services/FirebaseService';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuth] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'users' | 'branding' | 'contact' | 'announcements' | 'settings'>('users');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [adminConfig, setAdminConfig] = useState<any>({
    credentials: {
      email: 'admin@mizanbill.com',
      password: 'MizanAdmin@2026'
    },
    branding: {
      logo: '',
      banner: '',
      tagline: 'Accuracy & Balance',
      hashtags: '#MizanBill #BillingApp',
      comingSoonFeatures: []
    },
    contact: {
      phone: '+91 98765 43210',
      email: 'support@mizanbill.com',
      address: '123 Business Avenue, Tech Hub, India'
    },
    announcement: {
      active: false,
      title: '',
      message: '',
      type: 'info'
    }
  });

  const [usersList, setUsersList] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminConfig();
    
    // Subscribe to users
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsersList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    return () => unsub();
  }, []);

  const fetchAdminConfig = async () => {
    const config = await getAdminSettings();
    if (config) {
      setAdminConfig(prev => ({
        ...prev,
        ...config
      }));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail === adminConfig.credentials.email && loginPassword === adminConfig.credentials.password) {
      setIsAuth(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials.');
    }
  };

  const handleSave = async (section: string) => {
    setIsSaving(true);
    try {
      await saveAdminSettings(adminConfig);
      alert(section + ' saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving data.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserStatus = async (userId: string, status: 'Active' | 'Blocked' | 'Suspended') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        alert('File size must be under 500KB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdminConfig({
          ...adminConfig,
          branding: {
            ...adminConfig.branding,
            [type]: e.target?.result
          }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Shield className="text-indigo-500 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Owner Control Panel</h1>
            <p className="text-sm text-zinc-400 mt-2">Enter secret credentials to access</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle size={16} />
                {loginError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Username / Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-colors"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 text-indigo-400 font-bold text-xl tracking-tight">
            <Shield size={24} />
            Mizan Owner
          </div>
        </div>
        
        <div className="p-4 space-y-1 flex-1 overflow-y-auto">
          {[
            { id: 'users', label: 'App & Users', icon: Users },
            { id: 'branding', label: 'Website & Brand', icon: ImageIcon },
            { id: 'contact', label: 'Contact Info', icon: Phone },
            { id: 'announcements', label: 'Announcements', icon: Bell },
            { id: 'settings', label: 'Admin Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors \${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }\`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={() => setIsAuth(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            Lock Panel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-2xl font-bold">App & User Management</h2>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role / Shop</th>
                        <th className="px-6 py-4">Devices</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {usersList.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-zinc-200">{user.email}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">ID: {user.id?.slice(0, 8)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium">{user.role}</div>
                            <div className="text-[10px] text-zinc-500">{user.shopId || 'No Shop'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 text-zinc-400">
                              {user.deviceType === 'desktop' ? <Monitor size={16} className="text-blue-400" /> : <Smartphone size={16} className="text-green-400" />}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase \${
                              user.status === 'Blocked' || user.status === 'Suspended' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                            }\`}>
                              {user.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <select 
                              value={user.status || 'Active'}
                              onChange={(e) => handleUserStatus(user.id, e.target.value as any)}
                              className="bg-zinc-950 border border-zinc-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                            >
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspended</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Website & Brand Manager</h2>
                <button 
                  onClick={() => handleSave('Branding Settings')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg border-b border-zinc-800 pb-2">Images & Assets</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Website Logo (Base64)</label>
                    {adminConfig.branding.logo && (
                      <img src={adminConfig.branding.logo} alt="Logo" className="h-12 object-contain bg-zinc-800 rounded p-1 mb-2" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
                  </div>

                  <div className="space-y-2 pt-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Hero Banner Image (Base64)</label>
                    {adminConfig.branding.banner && (
                      <img src={adminConfig.branding.banner} alt="Banner" className="h-24 w-full object-cover bg-zinc-800 rounded p-1 mb-2" />
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'banner')} className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" />
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-lg border-b border-zinc-800 pb-2">Text Content</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Tagline</label>
                    <input 
                      type="text" 
                      value={adminConfig.branding.tagline}
                      onChange={e => setAdminConfig({...adminConfig, branding: {...adminConfig.branding, tagline: e.target.value}})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Hashtags (comma separated)</label>
                    <input 
                      type="text" 
                      value={adminConfig.branding.hashtags}
                      onChange={e => setAdminConfig({...adminConfig, branding: {...adminConfig.branding, hashtags: e.target.value}})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Contact Info Sync</h2>
                <button 
                  onClick={() => handleSave('Contact Info')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Save & Sync
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Support Phone</label>
                  <input 
                    type="text" 
                    value={adminConfig.contact.phone}
                    onChange={e => setAdminConfig({...adminConfig, contact: {...adminConfig.contact, phone: e.target.value}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Support Email</label>
                  <input 
                    type="email" 
                    value={adminConfig.contact.email}
                    onChange={e => setAdminConfig({...adminConfig, contact: {...adminConfig.contact, email: e.target.value}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Office Address</label>
                  <textarea 
                    value={adminConfig.contact.address}
                    onChange={e => setAdminConfig({...adminConfig, contact: {...adminConfig.contact, address: e.target.value}})}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
               <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">In-App Announcements</h2>
                <button 
                  onClick={() => handleSave('Announcements')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Publish Update
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-2xl space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div>
                    <h3 className="font-bold text-white">Enable Global Pop-up</h3>
                    <p className="text-xs text-zinc-400">Shows on app launch for all users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={adminConfig.announcement.active}
                      onChange={e => setAdminConfig({...adminConfig, announcement: {...adminConfig.announcement, active: e.target.checked}})}
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Announcement Type</label>
                  <select 
                    value={adminConfig.announcement.type}
                    onChange={e => setAdminConfig({...adminConfig, announcement: {...adminConfig.announcement, type: e.target.value}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="info">General Info</option>
                    <option value="success">Feature / Good News (Festival)</option>
                    <option value="warning">Important Alert</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
                  <input 
                    type="text" 
                    value={adminConfig.announcement.title}
                    onChange={e => setAdminConfig({...adminConfig, announcement: {...adminConfig.announcement, title: e.target.value}})}
                    placeholder="e.g. Happy Diwali! or v1.1 Released"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Message</label>
                  <textarea 
                    value={adminConfig.announcement.message}
                    onChange={e => setAdminConfig({...adminConfig, announcement: {...adminConfig.announcement, message: e.target.value}})}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Admin Credentials</h2>
                <button 
                  onClick={() => handleSave('Credentials')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  Update Credentials
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xl space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm px-4 py-3 rounded-xl flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} />
                  If you change these, you must use the new credentials next time you access the Admin Panel.
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Admin Username / Email</label>
                  <input 
                    type="email" 
                    value={adminConfig.credentials.email}
                    onChange={e => setAdminConfig({...adminConfig, credentials: {...adminConfig.credentials, email: e.target.value}})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Admin Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={adminConfig.credentials.password}
                      onChange={e => setAdminConfig({...adminConfig, credentials: {...adminConfig.credentials, password: e.target.value}})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/views/AdminPanel.tsx', content);
console.log('AdminPanel updated successfully');
