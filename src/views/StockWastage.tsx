import { useState, useEffect } from 'react';

import * as db from '../services/FirebaseService';
import { Search, Plus, PackageMinus, Calendar, FileText, Package } from 'lucide-react';

export default function StockWastage({ shopId, userId }: { shopId: string, userId: string }) {
  const [wastages, setWastages] = useState<any[]>([]);

  const fetchWastages = async () => {
    
    
    try {
      const data = await db.getStockWastages(userId);
      setWastages(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchWastages(); }, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newWastage, setNewWastage] = useState({ item: '', qty: '', reason: 'Damaged', cost: '', date: new Date().toISOString().split('T')[0] });

  const handleSave = async () => {
    if (!newWastage.item || !newWastage.cost) return;
    
    
    await db.saveStockWastage(userId, {
      date: newWastage.date,
      item: newWastage.item,
      reason: newWastage.reason,
      qty: Number(newWastage.qty),
      cost: parseFloat(newWastage.cost)
    });
    setIsCreating(false);
    fetchWastages();
    setNewWastage({ item: '', qty: '', reason: 'Damaged', cost: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Stock Damage & Wastage (માલ બગાડ / નુકસાની)</h2>
          <p className="text-zinc-400 text-sm mt-1">Log expired, broken, or damaged inventory items</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            <Plus size={18} /> Record Damage
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            <PackageMinus size={20} className="text-rose-400" /> New Stock Adjustment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Item Name</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="text" value={newWastage.item} onChange={(e) => setNewWastage({...newWastage, item: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="Search item..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Quantity Wasted</label>
              <input type="number" value={newWastage.qty} onChange={(e) => setNewWastage({...newWastage, qty: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Reason</label>
              <select value={newWastage.reason} onChange={(e) => setNewWastage({...newWastage, reason: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                <option>Damaged</option>
                <option>Expired</option>
                <option>Lost/Stolen</option>
                <option>Spoiled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Estimated Value Loss (₹)</label>
              <input type="number" value={newWastage.cost} onChange={(e) => setNewWastage({...newWastage, cost: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="date" value={newWastage.date} onChange={(e) => setNewWastage({...newWastage, date: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={handleSave} className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-500 transition-colors font-medium">Record Loss</button>
            <button onClick={() => setIsCreating(false)} className="bg-zinc-800 text-zinc-300 px-6 py-2 rounded-lg hover:bg-zinc-700 transition-colors font-medium">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-zinc-800/80 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Search damage logs..." className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/40 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Entry ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Item Name</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium text-right">Qty</th>
                  <th className="px-6 py-4 font-medium text-right">Value Loss (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {wastages.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-500">{entry.id}</td>
                    <td className="px-6 py-4">{entry.date}</td>
                    <td className="px-6 py-4 text-zinc-100">{entry.item}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-rose-500/10 text-rose-400">
                        {entry.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-300 font-medium">{entry.qty}</td>
                    <td className="px-6 py-4 text-right font-mono text-rose-400">{(entry.cost || entry.lossAmount || entry.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
