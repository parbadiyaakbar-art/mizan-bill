import { useState, useEffect } from 'react';
import * as db from '../services/FirebaseService';
import { backupToDrive } from '../services/GoogleDriveService';
import { Product } from '../types';
import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, EyeOff, X, Package } from 'lucide-react';
import { BarChart, Bar, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BackupReminder from '../components/BackupReminder';
import { checkRateLimit } from '../services/SecurityService';
import { DashboardSkeleton } from '../components/Skeleton';

  const EXPENSE_COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

  const financialData = [
    { name: 'Jan', sales: 65, purchases: 45 },
    { name: 'Feb', sales: 59, purchases: 38 },
    { name: 'Mar', sales: 80, purchases: 55 },
    { name: 'Apr', sales: 81, purchases: 60 },
    { name: 'May', sales: 56, purchases: 40 },
    { name: 'Jun', sales: 55, purchases: 42 },
    { name: 'Jul', sales: 40, purchases: 30 },
    { name: 'Aug', sales: 70, purchases: 50 },
    { name: 'Sep', sales: 85, purchases: 65 },
    { name: 'Oct', sales: 90, purchases: 72 },
    { name: 'Nov', sales: 105, purchases: 80 },
    { name: 'Dec', sales: 124, purchases: 95 },
  ];

  const expenseCategoryData = [
    { name: 'Rent & Electricity', value: 1500 },
    { name: 'Fuel & Trans.', value: 800 },
    { name: 'Staff Salary', value: 12000 },
    { name: 'Office/Tea', value: 350 },
    { name: 'Others', value: 200 },
  ];

export default function Dashboard({ onViewChange, shopId, userId }: { onViewChange?: (view: string) => void, shopId: string, userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBillingDropdown, setShowBillingDropdown] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showDriveBackupReminder, setShowDriveBackupReminder] = useState(false);

  const handleBackupToDrive = async () => {
    try {
      const data = await db.exportAllData(userId);
      await backupToDrive(data);
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`last_backup_${shopId}`, today);
      setShowDriveBackupReminder(false);
      alert("Backup successfully saved to Google Drive.");
    } catch (err: any) {
      console.error('Drive backup failed:', err);
      alert(err.message || 'Failed to backup to Google Drive.');
    }
  };

  const handleBackupDownload = async () => {
    if (!checkRateLimit('DATA_EXPORT')) {
      alert('Too many export requests. Please wait a minute.');
      return;
    }
    try {
      const data = await db.exportAllData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mizan_bill_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Backup failed:', err);
      alert('Failed to generate backup file.');
    }
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    // Start subscription immediately to allow optimistic data fetching from cache
    unsubscribe = db.subscribeToProducts(shopId, (prods) => {
      setProducts(prods as Product[]);
      setLoading(false);
      
      // Show alert if there are critical issues
      const lowStockItems = prods.filter(p => p.currentStock <= (p.lowStockLimit || 5));
      const nearExpiryItems = prods.filter(p => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        const today = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 15;
      });

      if (lowStockItems.length > 0 || nearExpiryItems.length > 0) {
        setShowAlertModal(true);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [shopId]);

  useEffect(() => {
    const checkBackupStatus = () => {
      const lastBackup = localStorage.getItem(`last_backup_${shopId}`);
      const today = new Date().toISOString().split('T')[0];
      if (lastBackup !== today) {
        setShowDriveBackupReminder(true);
      }
    };
    
    const timer = setTimeout(checkBackupStatus, 2000);
    return () => clearTimeout(timer);
  }, [shopId]);

  const lowStockItems = products.filter(p => p.currentStock <= (p.lowStockLimit || 5));
  const nearExpiryItems = products.filter(p => {
    if (!p.expiryDate) return false;
    const expiryDate = new Date(p.expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 15;
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!isUnlocked) {
    return (
      <div className="max-w-[1440px] mx-auto h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-zinc-900/80 rounded-full flex items-center justify-center border border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <EyeOff size={32} className="text-zinc-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-400">Dashboard is Locked</h2>
          <p className="text-zinc-600 mt-2 max-w-md mx-auto">Sensitive financial matrices and GST data are hidden for privacy.</p>
        </div>
        <button
          onClick={() => setIsUnlocked(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          Unlock View
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8">
      <BackupReminder onDownload={handleBackupDownload} />
      
      {showDriveBackupReminder && (
        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative overflow-hidden group">
            <div className="shrink-0 p-3 bg-amber-500/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-1">
              <h4 className="font-semibold text-zinc-100">Daily Backup Suggestion</h4>
              <p className="text-sm text-zinc-400 max-w-2xl">
                You haven't backed up your data to Google Drive today. Keep your business data safe with a cloud backup.
              </p>
            </div>
    
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleBackupToDrive}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95"
              >
                Backup to Drive
              </button>
              <button
                onClick={() => setShowDriveBackupReminder(false)}
                className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">Overview</h2>
          <p className="text-zinc-400 mt-2">High-level financial performance and activity.</p>
        </div>
        <button
          onClick={() => setIsUnlocked(false)}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <EyeOff size={16} /> Hide Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-colors cursor-pointer" onClick={() => onViewChange && onViewChange("profit-loss")}>
          <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Total Revenue</span>
                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Banknote size={20} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-mono tracking-tight">$124,500</div>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp size={16} className="text-teal-400" />
                  <span className="text-sm font-medium text-teal-400">+12.5%</span>
                  <span className="text-sm text-zinc-500">vs last month</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-colors cursor-pointer" onClick={() => onViewChange && onViewChange("profit-loss")}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Net Profit</span>
                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <TrendingUp size={20} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-mono tracking-tight">$42,800</div>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp size={16} className="text-teal-400" />
                  <span className="text-sm font-medium text-teal-400">+8.2%</span>
                  <span className="text-sm text-zinc-500">vs last month</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-colors cursor-pointer" onClick={() => onViewChange && onViewChange("contacts")}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Contacts & Parties</span>
                <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Users size={20} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-mono tracking-tight">1,204</div>
                <div className="flex items-center gap-2 mt-3">
                  <TrendingUp size={16} className="text-teal-400" />
                  <span className="text-sm font-medium text-teal-400">+4.1%</span>
                  <span className="text-sm text-zinc-500">vs last month</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-rose-500/30 hover:border-rose-500/60 rounded-xl p-6 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Pending GST</span>
                <div className="bg-rose-500/10 p-2 rounded-lg text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-mono tracking-tight">$8,450</div>
                <div className="flex items-center gap-2 mt-3">
                  <Clock size={16} className="text-zinc-400" />
                  <span className="text-sm text-zinc-400">Due in 5 days</span>
                </div>
              </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/60 border border-indigo-500/10 rounded-xl p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-semibold">Sales vs Purchases</h3>
            <select className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                    formatter={(value, name) => [`₹${value}k`, name === 'sales' ? 'Sales' : 'Purchases']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="sales" name="Sales" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#c084fc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-indigo-500/10 rounded-xl p-6">
          <div className="mb-6 border-b border-zinc-800 pb-4">
            <h3 className="text-xl font-semibold">Expense Breakdown</h3>
            <p className="text-sm text-zinc-400 mt-1">This Month</p>
          </div>
          <div className="h-[300px] relative">
            {loading ? (
              <div className="h-full w-full bg-zinc-800/20 rounded-full animate-pulse" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }}
                      itemStyle={{ color: '#e4e4e7' }}
                      formatter={(value) => [`₹${value}`, 'Amount']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-bold">₹14.8k</span>
                  <span className="text-xs text-zinc-500">Total</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-indigo-500/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
          <h3 className="text-xl font-semibold">Recent Activity</h3>
          <button className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
        </div>
        <div className="divide-y divide-zinc-800/50">
          <div className="p-4 hover:bg-zinc-800/30 transition-colors flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]">
              <Receipt size={18} />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200"><span className="font-semibold text-indigo-400">INV-2023-001</span> generated for <span className="font-semibold">Acme Corp</span>.</p>
              <p className="text-sm text-zinc-500 mt-1">2 hours ago &middot; Amount: $1,250.00</p>
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">Paid</span>
            </div>
          </div>
          <div className="p-4 hover:bg-zinc-800/30 transition-colors flex items-start gap-4 bg-zinc-800/20">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
              <ShoppingCart size={18} />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200"><span className="font-semibold text-indigo-400">PUR-2023-045</span> recorded from <span className="font-semibold">Tech Supplies Ltd</span>.</p>
              <p className="text-sm text-zinc-500 mt-1">5 hours ago &middot; Amount: $450.00</p>
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Pending</span>
            </div>
          </div>
          <div className="p-4 hover:bg-zinc-800/30 transition-colors flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              <Wallet size={18} />
            </div>
            <div className="flex-1">
              <p className="text-zinc-200">GST Return <span className="font-semibold text-rose-400">Q3 2023</span> filing overdue.</p>
              <p className="text-sm text-zinc-500 mt-1">1 day ago</p>
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">Action Required</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Critical Alerts Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAlertModal(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30">
                  <AlertTriangle className="text-rose-500" size={20} />
                </div>
                <h3 className="text-xl font-bold text-zinc-100">Critical Stock Alerts</h3>
              </div>
              <button onClick={() => setShowAlertModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {nearExpiryItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} /> Near Expiry (Next 15 Days)
                  </h4>
                  <div className="space-y-2">
                    {nearExpiryItems.slice(0, 5).map(item => (
                      <div key={item.id} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                          <p className="text-xs text-zinc-500">Expires on: {item.expiryDate}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-500">Expiring soon</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lowStockItems.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <Package size={14} /> Low Stock Warning
                  </h4>
                  <div className="space-y-2">
                    {lowStockItems.slice(0, 5).map(item => (
                      <div key={item.id} className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                          <p className="text-xs text-zinc-500">Current Stock: {item.currentStock} {item.unit}</p>
                        </div>
                        <span className="text-xs font-bold text-rose-500">Stock Low</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-zinc-900/50 border-t border-zinc-800">
              <button
                onClick={() => {
                  setShowAlertModal(false);
                  onViewChange && onViewChange('inventory');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                Go to Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
