import { Plus, DraftingCompass, Send, CheckCircle2, Filter, Eye, Mail, Edit2, Trash2, Copy, TrendingUp, Receipt } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as db from '../services/FirebaseService';
import InvoiceForm from '../components/InvoiceForm';
import { TableSkeleton } from '../components/Skeleton';

export default function Quotations({ startCreating = false, shopId, userId }: { startCreating?: boolean, shopId: string, userId: string }) {
  const [isCreating, setIsCreating] = useState(startCreating);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isCreating) return;
    
    setLoading(true);
    const unsubscribe = db.subscribeToQuotations(shopId, (data) => {
      setQuotations(data.map(q => ({
        date: q.date || new Date().toISOString().split('T')[0],
        id: `QT-${q.invoiceNumber || 'NEW'}`,
        client: q.party_name || 'Guest',
        gstin: q.party_gstin || '---',
        amount: q.totals?.invoiceTotal?.toFixed(2) || '0.00',
        status: q.status || 'Sent'
      })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isCreating, shopId]);

  if (isCreating) {
    return <InvoiceForm type="sales" onBack={() => setIsCreating(false)} shopId={shopId} userId={userId} isEstimate={true} />;
  }

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-indigo-400 mb-2 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">Quotations & Estimates</h1>
          <p className="text-zinc-400">Manage and track your proposals before converting them to invoices.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-indigo-400 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] flex items-center gap-2">
          <Plus size={18} />
          New Quotation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/60 backdrop-blur-md border border-indigo-500/20 rounded-xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Total Drafts</span>
            <DraftingCompass className="text-zinc-500" size={20} />
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-100">0</div>
            <div className="text-sm text-zinc-400 mt-1">Valued at ₹0</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-md border border-indigo-500/20 rounded-xl p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-zinc-400 uppercase font-semibold">Awaiting Response</span>
            <Send className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]" size={20} />
          </div>
          <div>
            <div className="text-4xl font-bold text-zinc-100">{quotations.length}</div>
            <div className="text-sm text-zinc-400 mt-1">Quotations active</div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-md border border-teal-500/30 border-l-4 border-l-teal-500 rounded-xl p-6 flex flex-col justify-between md:col-span-2 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-teal-400 uppercase font-semibold drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]">Accepted & Ready for Invoice</span>
            <CheckCircle2 className="text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" size={24} />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-4xl font-bold text-zinc-100">0</div>
              <div className="text-sm text-zinc-400 mt-1">Action required to convert</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-zinc-100 text-xl">₹0</div>
              <div className="text-sm text-teal-400 mt-1 flex items-center justify-end gap-1">
                <TrendingUp size={14} />
                +0% this month
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-xl overflow-hidden flex flex-col shadow-[0_0_20px_rgba(99,102,241,0.05)]">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
          <div className="flex gap-6">
            <button className="text-sm font-medium text-indigo-400 border-b-2 border-indigo-500 pb-1 drop-shadow-[0_0_5px_rgba(129,140,248,0.4)]">All Quotations</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors pb-1">Drafts</button>
            <button className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors pb-1">Sent</button>
          </div>
          <button className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors text-sm font-medium">
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          {quotations.length === 0 ? (
            <div className="p-20 text-center text-zinc-500">No quotations found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/30 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Quote #</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {quotations.map((q, i) => (
                  <tr key={i} className={`border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors ${q.status === 'Accepted' ? 'bg-teal-500/5' : ''}`}>
                    <td className="py-4 px-4 text-zinc-300">{q.date}</td>
                    <td className={`py-4 px-4 font-mono font-medium ${q.status === 'Accepted' ? 'text-indigo-400' : 'text-zinc-300'}`}>{q.id}</td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-zinc-200">{q.client}</div>
                      <div className="text-zinc-500 text-xs mt-0.5">GSTIN: {q.gstin}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-right text-zinc-300">{q.amount}</td>
                    <td className="py-4 px-4">
                      {q.status === 'Accepted' && <span className="inline-flex items-center px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(45,212,191,0.2)]">Accepted</span>}
                      {q.status === 'Sent' && <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(99,102,241,0.15)]">Sent</span>}
                      {q.status === 'Draft' && <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-semibold border border-zinc-700">Draft</span>}
                      {q.status === 'Expired' && <span className="inline-flex items-center px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-semibold shadow-[0_0_10px_rgba(244,63,94,0.15)]">Expired</span>}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {q.status === 'Accepted' ? (
                        <button className="bg-teal-500 text-teal-950 px-3 py-1.5 rounded text-xs font-semibold shadow-[0_0_15px_rgba(45,212,191,0.4)] hover:shadow-[0_0_20px_rgba(45,212,191,0.6)] hover:bg-teal-400 transition-colors inline-flex items-center gap-1 border-t border-white/20">
                          <Receipt size={14} /> Convert to Invoice
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-zinc-400">
                          {q.status === 'Sent' && (
                            <>
                              <button className="hover:text-indigo-400 transition-colors p-1"><Eye size={18} /></button>
                              <button className="hover:text-indigo-400 transition-colors p-1"><Mail size={18} /></button>
                            </>
                          )}
                          {q.status === 'Draft' && (
                            <>
                              <button className="hover:text-indigo-400 transition-colors p-1"><Edit2 size={18} /></button>
                              <button className="hover:text-rose-400 transition-colors p-1"><Trash2 size={18} /></button>
                            </>
                          )}
                          {q.status === 'Expired' && (
                            <button className="hover:text-indigo-400 transition-colors p-1"><Copy size={18} /></button>
                          )}
                        </div>
                      )}
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
