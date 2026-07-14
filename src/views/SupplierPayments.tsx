import { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, Calendar, User, IndianRupee, FileText } from 'lucide-react';
import * as db from '../services/FirebaseService';


export default function SupplierPayments({ shopId, userId }: { shopId: string, userId: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPayment, setNewPayment] = useState({ supplier: '', amount: '', mode: 'Bank Transfer', type: 'Payment', date: new Date().toISOString().split('T')[0] });

  const fetchPayments = async () => {
    try {
      
      
      const allPayments = await db.getSupplierPayments(userId);
      setPayments(allPayments);
      const allPurchases = await db.getPurchaseInvoices(userId);
      setPurchases(allPurchases);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSave = async () => {
    if (!newPayment.supplier || !newPayment.amount) return;
    
    
    
    const paymentData = {
      type: 'SupplierPayment',
      date: newPayment.date,
      supplier: newPayment.supplier,
      amount: parseFloat(newPayment.amount),
      mode: newPayment.type === 'Discount Received' ? 'Adjustment' : newPayment.mode,
      paymentType: newPayment.type,
    };
    
    await db.saveSupplierPayment(userId, paymentData);
    setIsCreating(false);
    setNewPayment({ supplier: '', amount: '', mode: 'Bank Transfer', type: 'Payment', date: new Date().toISOString().split('T')[0] });
    fetchPayments();
  };

  // Group ledger by supplier
  const supplierLedger = (() => {
    const ledger: Record<string, { totalPurchases: number; totalPaid: number; balance: number }> = {};
    
    purchases.forEach(p => {
      if (!p.party_name) return;
      if (!ledger[p.party_name]) ledger[p.party_name] = { totalPurchases: 0, totalPaid: 0, balance: 0 };
      ledger[p.party_name].totalPurchases += (p.totals?.invoiceTotal || 0);
    });

    payments.forEach(p => {
      if (!p.supplier) return;
      if (!ledger[p.supplier]) ledger[p.supplier] = { totalPurchases: 0, totalPaid: 0, balance: 0 };
      ledger[p.supplier].totalPaid += (p.amount || 0);
    });

    Object.keys(ledger).forEach(key => {
      ledger[key].balance = ledger[key].totalPurchases - ledger[key].totalPaid;
    });

    return ledger;
  })();

  const totalOutstanding = Object.values(supplierLedger).reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Supplier Payments (ઉધાર ચુકવણી)</h2>
          <p className="text-zinc-400 text-sm mt-1">Log payments made to distributors and wholesalers</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            <Plus size={18} /> Record Payment
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">New Payment / Adjustment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Supplier Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="text" value={newPayment.supplier} onChange={(e) => setNewPayment({...newPayment, supplier: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="Enter supplier name..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Transaction Type</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <select value={newPayment.type} onChange={(e) => setNewPayment({...newPayment, type: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                  <option value="Payment">Payment Paid</option>
                  <option value="Discount Received">Discount Received / Cost Correction</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
              </div>
            </div>
            {newPayment.type === 'Payment' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Payment Mode</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <select value={newPayment.mode} onChange={(e) => setNewPayment({...newPayment, mode: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="date" value={newPayment.date} onChange={(e) => setNewPayment({...newPayment, date: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <button onClick={handleSave} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-medium">Save Payment</button>
            <button onClick={() => setIsCreating(false)} className="bg-zinc-800 text-zinc-300 px-6 py-2 rounded-lg hover:bg-zinc-700 transition-colors font-medium">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-zinc-800/80 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="text" placeholder="Search payments..." className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/40 text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium text-right">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {payments.map((payment, idx) => (
                  <tr key={payment.id || idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">{payment.date}</td>
                    <td className="px-6 py-4 text-zinc-100">{payment.supplier}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${payment.mode === 'Cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                        {payment.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-rose-400 font-medium">-{payment.amount.toFixed(2)}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No payments found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
