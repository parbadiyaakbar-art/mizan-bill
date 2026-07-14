import { Plus, Search, Filter, Download, ShoppingCart, CheckCircle2, Clock, XCircle, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as db from '../services/FirebaseService';
import InvoiceForm from '../components/InvoiceForm';
import { TableSkeleton } from '../components/Skeleton';

export default function Purchases({ startCreating = false, shopId, userId }: { startCreating?: boolean, shopId: string, userId: string }) {
  const [isCreating, setIsCreating] = useState(startCreating);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await db.getPurchaseInvoices(shopId);
        if (data) {
          const formatted = data.map((b: any) => ({
            id: b.id,
            date: b.date || new Date().toISOString().split('T')[0],
            client: b.party_name || 'Generic Supplier',
            amount: b.totals?.invoiceTotal?.toFixed(2) || '0.00',
            status: b.payment_mode === 'Udhaar' ? 'Pending' : 'Paid',
            due: b.dueDate || '---'
          }));
          setInvoices(formatted);
        }
      } catch (err) {
        console.error('Error fetching purchase invoices:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!isCreating) {
      setIsLoading(true);
      fetchInvoices();
    }
  }, [isCreating, shopId]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Invoice #', 'Supplier', 'Amount', 'Status', 'Due Date'];
    const rows = invoices.map(inv => [
      inv.date,
      inv.id,
      `"${inv.client}"`,
      `"${inv.amount.replace(/,/g, '')}"`,
      inv.status,
      inv.due
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'purchase_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCreating) {
    return <InvoiceForm type="purchase" onBack={() => setIsCreating(false)} shopId={shopId} userId={userId} />;
  }

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-indigo-400 mb-2 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">Purchase Invoices</h1>
          <p className="text-zinc-400">Track and manage your inventory purchases.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center gap-2">
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-xl overflow-hidden flex flex-col shadow-[0_0_20px_rgba(99,102,241,0.05)]">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-900/60">
          <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
             <input type="text" placeholder="Search purchases..." className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-950/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-500" />
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
            <div className="p-12 text-center text-zinc-500">Loading purchases...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No purchase invoices found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/30 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold w-10"><input type="checkbox" className="rounded border-zinc-700 bg-zinc-900" /></th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Supplier</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
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
                      {inv.status === 'Paid' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] uppercase font-semibold">Paid</span>}
                      {inv.status === 'Pending' && <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase font-semibold">Pending</span>}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-zinc-500 hover:text-indigo-400 transition-colors"><MoreVertical size={18} /></button>
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
