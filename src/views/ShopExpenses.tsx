import { useState, useEffect } from 'react';

import * as db from '../services/FirebaseService';
import { Search, Plus, CreditCard, Calendar, FileText, IndianRupee, Tags } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Rent & Electricity (દુકાનનું ભાડું / લાઈટ બિલ)',
  'Fuel & Transportation (પેટ્રોલ / ટેમ્પો ભાડું)',
  'Staff Salary (સ્ટાફનો પગાર)',
  'Office & Hospitality / Tea-Water (પરચુરણ ખર્ચ / ચા-પાણી)',
  'Stock Damage / Wastage (માલ નુકસાની)',
  'Owner\'s Personal Drawing (અંગત ઉપાડ)',
  'Bad Debts Written-Off (ડૂબેલું નાણું)',
  'Cash-to-Bank Transfer (બેંક જમા)',
  'Others (અન્ય ખર્ચાઓ)'
];

export default function ShopExpenses({ shopId, userId }: { shopId: string, userId: string }) {
  const [expenses, setExpenses] = useState<any[]>([]);

  const fetchExpenses = async () => {
    
    
    try {
      const data = await db.getShopExpenses(userId);
      setExpenses(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchExpenses(); }, []);
  const [isCreating, setIsCreating] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: EXPENSE_CATEGORIES[3], name: '', amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0] });

  const handleSave = async () => {
    if (!newExpense.name || !newExpense.amount) return;
    
    
    await db.saveShopExpense(userId, {
      date: newExpense.date,
      category: newExpense.category,
      name: newExpense.name,
      amount: parseFloat(newExpense.amount),
      payment_mode: newExpense.mode,
    });
    setIsCreating(false);
    fetchExpenses();
    setNewExpense({ category: EXPENSE_CATEGORIES[3], name: '', amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Shop Expenses (પરચુરણ ખર્ચ)</h2>
          <p className="text-zinc-400 text-sm mt-1">Log daily shop expenses and other payouts</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            <Plus size={18} /> Record Expense
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">New Expense Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Category (ખર્ચનો પ્રકાર)</label>
              <div className="relative">
                <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <select value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Expense Name / Notes</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="text" value={newExpense.name} onChange={(e) => setNewExpense({...newExpense, name: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="e.g., Rent, Electricity, Tea" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Amount Paid (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Payment Mode</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <select value={newExpense.mode} onChange={(e) => setNewExpense({...newExpense, mode: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({...newExpense, date: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={handleSave} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-medium">Save Expense</button>
            <button onClick={() => setIsCreating(false)} className="bg-zinc-800 text-zinc-300 px-6 py-2 rounded-lg hover:bg-zinc-700 transition-colors font-medium">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-zinc-800/80 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Search expenses..." className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/40 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Expense ID</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Notes</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-500">{expense.id}</td>
                    <td className="px-6 py-4">{expense.date}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50 truncate max-w-[200px] inline-block">
                        {expense.category.split(' (')[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-100 truncate max-w-[150px]">{expense.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${expense.mode === 'Cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {expense.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-rose-400 font-medium">-{expense.amount.toFixed(2)}</td>
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
