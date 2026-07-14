import { useState, useEffect } from 'react';
import { Search, Plus, CreditCard, Calendar, User, IndianRupee, FileText, Clock, AlertTriangle } from 'lucide-react';
import * as db from '../services/FirebaseService';


export default function CustomerPayments({ shopId, userId }: { shopId: string, userId: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newPayment, setNewPayment] = useState({ customer: '', amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchPayments = async () => {
    try {
      
      if (!userId) return;
      
      const allPayments = await db.getCustomerPayments(userId);
      setPayments(allPayments || []);
      
      const allInvoices = await db.getSalesInvoices(userId);
      setInvoices(allInvoices || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleSave = async () => {
    if (!newPayment.customer || !newPayment.amount) return;
    
    if (!userId) return;
    
    const paymentData = {
      type: 'CustomerPayment',
      date: newPayment.date,
      customer: newPayment.customer,
      amount: parseFloat(newPayment.amount),
      mode: newPayment.mode,
      notes: newPayment.notes,
    };
    
    await db.saveCustomerPayment(userId, paymentData);
    
    setIsCreating(false);
    setNewPayment({ customer: '', amount: '', mode: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });
    fetchPayments();
  };

  // Group ledger by customer
  const customerLedger = (() => {
    const ledger: Record<string, { totalPurchases: number; totalPaid: number; balance: number; oldestInvoiceDate: string | null }> = {};
    
    invoices.forEach(inv => {
      if (!inv.party_name || inv.party_name === 'Cash Sale') return;
      if (!ledger[inv.party_name]) ledger[inv.party_name] = { totalPurchases: 0, totalPaid: 0, balance: 0, oldestInvoiceDate: null };
      ledger[inv.party_name].totalPurchases += (inv.totals?.invoiceTotal || 0);
      
      // Track oldest invoice date if it's an Udhaar sale (or generally track first purchase)
      if (!ledger[inv.party_name].oldestInvoiceDate || new Date(inv.date || inv.created_at) < new Date(ledger[inv.party_name].oldestInvoiceDate)) {
        ledger[inv.party_name].oldestInvoiceDate = inv.date || inv.created_at;
      }
    });

    payments.forEach(p => {
      if (!p.customer) return;
      if (!ledger[p.customer]) ledger[p.customer] = { totalPurchases: 0, totalPaid: 0, balance: 0, oldestInvoiceDate: null };
      ledger[p.customer].totalPaid += (p.amount || 0);
    });

    Object.keys(ledger).forEach(key => {
      ledger[key].balance = ledger[key].totalPurchases - ledger[key].totalPaid;
    });

    return ledger;
  })();

  const currentCustomerLedger = newPayment.customer ? customerLedger[newPayment.customer] : null;

  const calculateDaysPending = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Customer Payments (ઉધરાણી આવી)</h2>
          <p className="text-zinc-400 text-sm mt-1">Log payments received from credit (Udhaar) customers</p>
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
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">New Payment Receipt</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Customer Name / Mobile Number</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text" 
                    list="customers-list"
                    value={newPayment.customer} 
                    onChange={(e) => setNewPayment({...newPayment, customer: e.target.value})} 
                    className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" 
                    placeholder="Search customer..." 
                  />
                  <datalist id="customers-list">
                    {Object.keys(customerLedger).map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              {currentCustomerLedger && currentCustomerLedger.balance > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle size={14} /> Outstanding Balance (બાકી રકમ)
                    </p>
                    <p className="text-2xl font-bold text-zinc-100 font-mono">₹{currentCustomerLedger.balance.toFixed(2)}</p>
                  </div>
                  {currentCustomerLedger.oldestInvoiceDate && (
                    <div className="bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      <p className="text-xs text-zinc-400 flex items-center gap-1">
                        <Clock size={12} /> Pending Since
                      </p>
                      <p className="text-sm font-medium text-zinc-200">
                        {calculateDaysPending(currentCustomerLedger.oldestInvoiceDate)} Days
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Amount Received (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="number" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
              </div>
            </div>

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

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="date" value={newPayment.date} onChange={(e) => setNewPayment({...newPayment, date: e.target.value})} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Remarks / Note</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-zinc-500" size={18} />
                <textarea 
                  value={newPayment.notes} 
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})} 
                  className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all min-h-[44px] resize-none" 
                  placeholder="Optional reference details..." 
                  rows={1}
                />
              </div>
            </div>

          </div>

          <div className="mt-8 flex gap-4">
            <button onClick={handleSave} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)]">Save Payment</button>
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
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Mode</th>
                  <th className="px-6 py-4 font-medium">Remarks</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                {payments.map((payment, idx) => (
                  <tr key={payment.id || idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">{payment.date}</td>
                    <td className="px-6 py-4 text-zinc-100 font-medium">{payment.customer}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${payment.mode === 'Cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {payment.mode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 italic max-w-xs truncate">{payment.notes || '-'}</td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400 font-medium">+{payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                      <button className="text-zinc-400 hover:text-emerald-400 transition-colors" title="Share via WhatsApp" onClick={() => window.open(`https://wa.me/?text=Payment receipt: Received ₹${payment.amount} on ${payment.date} via ${payment.mode}. Thank you!`, '_blank')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      </button>
                      <button className="text-zinc-400 hover:text-blue-400 transition-colors" title="Send SMS" onClick={() => window.open(`sms:?&body=Payment receipt: Received ₹${payment.amount} on ${payment.date} via ${payment.mode}. Thank you!`, '_blank')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">No payments found.</td>
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
