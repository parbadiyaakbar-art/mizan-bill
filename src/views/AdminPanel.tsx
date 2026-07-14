import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Bell, 
  ShieldAlert, 
  RefreshCw, 
  Ban, 
  UserCheck, 
  Clock, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  Smartphone, 
  Monitor,
  Send,
  Save,
  Trash2
} from 'lucide-react';
import { 
  subscribeToBetaUsers, 
  updateBetaUserStatus, 
  pushAdminConfig, 
  getAdminConfig, 
  subscribeToBugReports
} from '../services/FirebaseService';
import { BetaUser, AdminConfig, BugReport, BetaUserStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'updates' | 'bugs' | 'maintenance'>('users');
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [config, setConfig] = useState<AdminConfig>({
    latestVersion: '1.0.4',
    updateMessage: 'A new version is available with stability improvements.',
    criticalUpdate: false,
    notificationTitle: 'Welcome to Mizan Bill Beta',
    notificationBody: 'Thank you for testing our app. Please report any bugs.'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubUsers = subscribeToBetaUsers((data) => {
      setUsers(data as any);
    });
    const unsubBugs = subscribeToBugReports((data) => {
      setBugs(data as any);
    });
    
    getAdminConfig().then(data => {
      if (data) setConfig(data as any);
    });

    return () => {
      unsubUsers();
      unsubBugs();
    };
  }, []);

  const handleStatusChange = async (userId: string, status: BetaUserStatus) => {
    await updateBetaUserStatus(userId, status);
  };

  const handleExtendTrial = async (userId: string, days: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const currentExpiry = new Date(user.trialExpiryDate || new Date());
    currentExpiry.setDate(currentExpiry.getDate() + days);
    await updateBetaUserStatus(userId, user.status, currentExpiry.toISOString());
  };

  const handlePushConfig = async () => {
    setLoading(true);
    try {
      await pushAdminConfig(config);
      alert('Config pushed successfully');
    } catch (err) {
      alert('Failed to push config');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Center</h1>
            <p className="text-zinc-400 mt-1">Manage beta users, deployments, and system health.</p>
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Users size={16} className="inline mr-2" />
              Users
            </button>
            <button 
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'updates' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <Bell size={16} className="inline mr-2" />
              Updates
            </button>
            <button 
              onClick={() => setActiveTab('bugs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'bugs' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <ShieldAlert size={16} className="inline mr-2" />
              Bug Logs
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input
                  type="text"
                  placeholder="Search beta users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-800/50 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Trial Info</th>
                      <th className="px-6 py-4">Last Active</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium">{user.fullName || 'Anonymous User'}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                          <div className="text-[10px] text-zinc-600 mt-1 flex items-center gap-1">
                            {user.deviceInfo?.includes('Android') ? <Smartphone size={10} /> : <Monitor size={10} />}
                            {user.deviceInfo || 'Unknown Device'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                            user.status === 'Suspended' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {user.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">Expires: {user.trialExpiryDate ? new Date(user.trialExpiryDate).toLocaleDateString() : 'N/A'}</div>
                          <div className="text-[10px] text-zinc-500">Joined: {user.activationDate ? new Date(user.activationDate).toLocaleDateString() : 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleStatusChange(user.id, 'Active')}
                              className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"
                              title="Activate"
                            >
                              <UserCheck size={16} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(user.id, 'Suspended')}
                              className="p-2 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20"
                              title="Suspend"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(user.id, 'Blocked')}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                              title="Block"
                            >
                              <Ban size={16} />
                            </button>
                            <button 
                              onClick={() => handleExtendTrial(user.id, 7)}
                              className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded hover:bg-indigo-500/20"
                            >
                              +7 Days
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'updates' && (
            <motion.div 
              key="updates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-xl">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <RefreshCw className="text-indigo-500" size={20} />
                  App Deployment Controls
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Latest Version Code</label>
                    <input 
                      type="text"
                      value={config.latestVersion}
                      onChange={(e) => setConfig({...config, latestVersion: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input 
                      type="checkbox"
                      id="critical"
                      checked={config.criticalUpdate}
                      onChange={(e) => setConfig({...config, criticalUpdate: e.target.checked})}
                      className="w-5 h-5 rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="critical" className="text-sm font-medium text-zinc-300">Force Critical Update</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Update Banner Message</label>
                  <textarea 
                    value={config.updateMessage}
                    onChange={(e) => setConfig({...config, updateMessage: e.target.value})}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <hr className="border-zinc-800" />

                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="text-indigo-500" size={20} />
                  Push Notification
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Notification Title</label>
                    <input 
                      type="text"
                      value={config.notificationTitle}
                      onChange={(e) => setConfig({...config, notificationTitle: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Notification Body</label>
                    <textarea 
                      value={config.notificationBody}
                      onChange={(e) => setConfig({...config, notificationBody: e.target.value})}
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handlePushConfig}
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                  Push Global Update
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'bugs' && (
            <motion.div 
              key="bugs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {bugs.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                  No critical errors reported recently.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {bugs.map(bug => (
                    <div key={bug.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-red-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-200">{bug.error}</h4>
                            <p className="text-xs text-zinc-500">{new Date(bug.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${bug.resolved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {bug.resolved ? 'Resolved' : 'Critical'}
                        </span>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs text-red-400 overflow-x-auto max-h-40">
                        {bug.stack || 'No stack trace available'}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                        <div className="flex gap-4">
                          <span>User ID: {bug.userId}</span>
                          <span>Device: {bug.deviceInfo}</span>
                        </div>
                        <button className="text-indigo-400 hover:text-indigo-300">Mark as Resolved</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
