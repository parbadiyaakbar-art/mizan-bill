import { Plus, Search, Filter, Download, FileText, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as db from '../services/FirebaseService';
import InvoiceForm from '../components/InvoiceForm';
import { TableSkeleton } from '../components/Skeleton';

export default function Sales({ startCreating = false, shopId, userId }: { startCreating?: boolean, shopId: string, userId: string }) {
  const [isCreating, setIsCreating] = useState(startCreating);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isCreating) return;

    setIsLoading(true);
    const unsubscribe = db.subscribeToSalesInvoices(shopId, (data) => {
      const formatted = data.map((b: any) => ({
        id: b.id,
        date: b.date || new Date().toISOString().split('T')[0],
        client: b.party_name || 'Cash Sale',
        amount: b.totals?.invoiceTotal?.toFixed(2) || '0.00',
        status: b.payment_mode === 'Udhaar' ? 'Pending' : 'Paid',
        due: b.dueDate || '---',
        phone: b.party_mobile || ''
      }));
      setInvoices(formatted);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isCreating, shopId]);

  const handleExportCSV = () => {
    // For detailed accounting, we export more comprehensive data
    const headers = ['Date', 'Invoice #', 'Client', 'Phone', 'Amount', 'Status', 'Due Date'];
    const rows = invoices.map(inv => {
      const escapedClient = (inv.client || '').replace(/"/g, '""');
      return [
        inv.date,
        inv.id,
        `"${escapedClient}"`,
        `"${inv.phone || ''}"`,
        `"${inv.amount.toString().replace(/,/g, '')}"`,
        inv.status,
        inv.due
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCreating) {
    return <InvoiceForm type="sales" onBack={() => setIsCreating(false)} shopId={shopId} userId={userId} />;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-indigo-400 mb-2 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">Sales Invoices</h1>
          <p className="text-zinc-400">Create, manage, and track your outward supplies.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center gap-2">
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/60 backdrop-blur-md border border-teal-500/20 rounded-xl p-6 hover:border-teal-500/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Total Paid (This Month)</span>
            <CheckCircle2 className="text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]" size={20} />
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-100">₹8,45,000</div>
            <div className="text-sm text-teal-400 mt-1 font-medium text-xs bg-teal-500/10 inline-block px-2 py-0.5 rounded border border-teal-500/20">+12.5% vs last month</div>
          </div>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Total Pending</span>
            <Clock className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]" size={20} />
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-100">₹2,12,000</div>
            <div className="text-sm text-zinc-400 mt-1">Across 18 invoices</div>
          </div>
        </div>
        <div className="bg-zinc-900/60 backdrop-blur-md border border-rose-500/20 rounded-xl p-6 hover:border-rose-500/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Overdue</span>
            <XCircle className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" size={20} />
          </div>
          <div>
            <div className="text-4xl font-bold text-rose-400">₹45,500</div>
            <div className="text-sm text-zinc-400 mt-1">Immediate action required</div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-xl overflow-hidden flex flex-col shadow-[0_0_20px_rgba(99,102,241,0.05)]">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/60">
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
             <input type="text" placeholder="Search invoices..." className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-500" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-zinc-400 border border-zinc-700/50 px-4 py-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm font-medium">
              <Filter size={16} /> Filter
            </button>
            <button onClick={handleExportCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-zinc-400 border border-zinc-700/50 px-4 py-2 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-sm font-medium">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-zinc-500">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No sales invoices found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/30 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold w-10"><input type="checkbox" className="rounded border-zinc-700 bg-zinc-900" /></th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoices.map((inv, i) => (
                  <tr key={i} className={`border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors`}>
                    <td className="py-4 px-4"><input type="checkbox" className="rounded border-zinc-700 bg-zinc-900" /></td>
                    <td className="py-4 px-4 text-zinc-300">{inv.date}</td>
                    <td className={`py-4 px-4 font-mono font-medium text-indigo-400`}>{inv.id}</td>
                    <td className="py-4 px-4 font-medium text-zinc-200">{inv.client}</td>
                    <td className="py-4 px-4 font-mono text-right text-zinc-300">{inv.amount}</td>
                    <td className="py-4 px-4 text-center">
                      {inv.status === 'Paid' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(45,212,191,0.2)]">Paid</span>}
                      {inv.status === 'Pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(99,102,241,0.15)]">Pending</span>}
                      {inv.status === 'Overdue' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(244,63,94,0.15)]">Overdue</span>}
                      {inv.status === 'Draft' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold border border-zinc-700">Draft</span>}
                    </td>
                    <td className={`py-4 px-4 ${inv.status === 'Overdue' ? 'text-rose-400 font-medium' : 'text-zinc-400'}`}>{inv.due}</td>
                    <td className="py-4 px-4 text-right flex justify-end gap-3 items-center">
                      <button className="text-zinc-400 hover:text-emerald-400 transition-colors" title="Share via WhatsApp" onClick={() => window.open(`https://wa.me/${inv.phone}?text=Here is your invoice ${inv.id} for amount ₹${inv.amount}.`, '_blank')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      </button>
                      <button className="text-zinc-400 hover:text-blue-400 transition-colors" title="Send SMS" onClick={() => window.open(`sms:${inv.phone}?body=Here is your invoice ${inv.id} for amount ₹${inv.amount}.`, '_blank')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      </button>
                      <button className="text-zinc-500 hover:text-indigo-400 transition-colors ml-2"><MoreVertical size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
