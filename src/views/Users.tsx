import { Search, Calendar, Layers, Download, Edit2, ShieldAlert, History, Plus, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export default function Users({ shopId, userId }: { shopId: string, userId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'users'), where('shopId', '==', shopId));
        const snapshot = await getDocs(q);
        setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching staff:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [shopId]);

  const handleAddStaff = async () => {
    if (!newStaffEmail || !newStaffName) return;
    try {
      // For demonstration, we create a record in the 'users' collection.
      // In a real app, this would be an invitation or a Firebase Function call.
      // We use the email as a temporary ID or a specific invite code.
      const staffId = `pending_${Date.now()}`;
      await setDoc(doc(db, 'users', staffId), {
        email: newStaffEmail,
        name: newStaffName,
        role: 'Staff',
        shopId,
        status: 'Pending'
      });
      setStaff([...staff, { email: newStaffEmail, name: newStaffName, role: 'Staff', status: 'Pending' }]);
      setShowAddModal(false);
      setNewStaffEmail('');
      setNewStaffName('');
      alert('Staff record created. They will be linked when they sign up with this email.');
    } catch (err) {
      console.error('Error adding staff:', err);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-indigo-400 mb-2 tracking-tight drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]">Staff Management</h2>
          <p className="text-sm text-zinc-400">Manage your shop staff, roles, and permissions.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-400 mb-4 text-center">Add New Staff Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100" 
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100" 
                  placeholder="staff@example.com"
                />
              </div>
              <p className="text-[10px] text-zinc-500 italic">Note: Staff must sign up with this email to access your shop data.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStaff}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)]"
              >
                Create Staff
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/40 backdrop-blur-xl rounded-xl overflow-hidden flex flex-col shadow-2xl border border-indigo-500/10">
        <div className="p-4 border-b border-indigo-500/10 bg-zinc-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/70" size={16} />
              <input type="text" placeholder="Search users..." className="w-full pl-9 pr-4 py-1.5 text-sm bg-zinc-900/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-zinc-100 placeholder-zinc-500" />
            </div>
            <select className="text-sm border-zinc-700/50 rounded-lg bg-zinc-900/50 py-1.5 px-3 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-300">
              <option>All Roles</option>
              <option>Super Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
            <select className="text-sm border-zinc-700/50 rounded-lg bg-zinc-900/50 py-1.5 px-3 focus:ring-indigo-500/50 focus:border-indigo-500 text-zinc-300">
              <option>All Plans</option>
              <option>Premium</option>
              <option>Standard</option>
              <option>Custom</option>
            </select>
            <button className="border border-zinc-700/50 text-zinc-400 px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-800 hover:text-indigo-400 transition-colors flex items-center gap-2">
              <Calendar size={16} /> Last Active
            </button>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="bg-zinc-800/50 text-zinc-500 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-zinc-800 cursor-not-allowed">
              <Layers size={16} /> Bulk Actions
            </button>
            <button className="border border-zinc-700/50 text-zinc-400 px-3 py-1.5 rounded-lg text-sm hover:bg-zinc-800 hover:text-indigo-400 transition-colors flex items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-indigo-500/10 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                <th className="p-4 w-10">
                  <input type="checkbox" className="rounded border-zinc-700/50 bg-zinc-950/50 text-indigo-500 focus:ring-indigo-500/50" />
                </th>
                <th className="p-4 whitespace-nowrap">User Details</th>
                <th className="p-4 whitespace-nowrap">Business</th>
                <th className="p-4 whitespace-nowrap">Role</th>
                <th className="p-4 whitespace-nowrap text-center">Sub Status</th>
                <th className="p-4 whitespace-nowrap text-center">Last Login</th>
                <th className="p-4 whitespace-nowrap text-center">Status</th>
                <th className="p-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-indigo-500/10">
              {staff.map((u, i) => (
                <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 text-center">
                    <input type="checkbox" className="rounded border-zinc-700/50 bg-zinc-950/50 text-indigo-500 focus:ring-indigo-500/50" />
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-zinc-200">{u.name || u.email}</div>
                    <div className="text-xs text-indigo-400/70 font-mono mt-0.5">{u.email}</div>
                  </td>
                  <td className="p-4 text-zinc-400">{u.shopId === u.id ? 'Self' : 'Linked Staff'}</td>
                  <td className="p-4">
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border shadow-[0_0_8px_rgba(129,140,248,0.2)] ${u.role === 'Owner' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                      {u.role || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${u.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'}`}>
                      {u.status || 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-xs text-zinc-400">{u.login || '---'}</td>
                  <td className="p-4 text-center">
                    <div className="relative inline-block w-10 align-middle select-none">
                      <input 
                        type="checkbox" 
                        checked={u.status !== 'Inactive'} 
                        readOnly
                        className={`absolute block w-5 h-5 rounded-full bg-white border-2 appearance-none cursor-pointer z-10 transition-all ${u.status !== 'Inactive' ? 'right-0 border-indigo-500' : 'left-0 border-rose-500/70'}`} 
                      />
                      <label className={`block overflow-hidden h-5 rounded-full cursor-pointer transition-colors ${u.status !== 'Inactive' ? 'bg-indigo-500/30 border border-indigo-500/50' : 'bg-rose-500/20 border border-rose-500/30'}`}></label>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded p-1.5 transition-colors" title="Edit"><Edit2 size={16} /></button>
                      <button className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded p-1.5 transition-colors" title="Remove"><ShieldAlert size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">No staff members found for this shop.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-indigo-500/10 bg-zinc-900/40 flex items-center justify-between text-sm text-zinc-400">
          <div>Showing 1 to 3 of 1,248 entries</div>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1.5 border border-zinc-700/50 rounded-lg text-zinc-600 bg-zinc-900/50 cursor-not-allowed">Prev</button>
            <button className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg shadow-[0_0_10px_rgba(99,102,241,0.3)] border border-indigo-500/20">1</button>
            <button className="px-3.5 py-1.5 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 hover:text-indigo-400 transition-colors">2</button>
            <button className="px-3.5 py-1.5 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 hover:text-indigo-400 transition-colors">3</button>
            <span className="px-2 py-1.5">...</span>
            <button className="px-3 py-1.5 border border-zinc-700/50 rounded-lg hover:bg-zinc-800 hover:text-indigo-400 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
