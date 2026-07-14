import { Link2Off, RefreshCw, CheckCircle2, UploadCloud, Download, Clock, AlertTriangle, Zap } from 'lucide-react';

export default function GSTReturns({ shopId, userId }: { shopId: string, userId: string }) {
  const handleExportCSV = () => {
    const headers = ['Tax Head', 'Liability (INR)', 'ITC Set-off (INR)', 'Cash Payable (INR)'];
    const rows = [
      ['IGST', '40000.00', '-35000.00', '5000.00'],
      ['CGST', '20500.00', '-15000.00', '5500.00'],
      ['SGST', '20500.00', '-15000.00', '5500.00'],
      ['Total', '81000.00', '-65000.00', '16000.00']
    ];
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'gst_summary_transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">GST Returns</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(45,212,191,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              Auto-Sync Active
            </span>
          </div>
          <p className="text-zinc-400 mt-2">Manage and file your GSTR-1 and GSTR-3B for October 2023</p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur-xl">
          <Clock className="text-indigo-400" size={20} />
          <select className="bg-transparent border-none text-zinc-100 font-medium focus:outline-none cursor-pointer">
            <option>October 2023</option>
            <option>September 2023</option>
            <option>August 2023</option>
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Link2Off size={18} />
          </div>
          <div>
            <p className="font-semibold text-indigo-300">GST Portal Connection</p>
            <p className="text-sm text-zinc-500">Disconnected &middot; Connect to sync data directly with GSTN</p>
          </div>
        </div>
        <button className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all">
          Connect GSTIN
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/60 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl transition-colors">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-indigo-300 mb-1">GSTR-1</h3>
                <p className="text-sm text-zinc-400">Details of outward supplies of goods or services.</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 size={14} /> Filed
              </span>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Total Invoices</span>
                <span className="font-mono text-indigo-300">142</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Total Taxable Value</span>
                <span className="font-mono text-indigo-300">₹ 4,50,000.00</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-400">Total Tax (IGST+CGST+SGST)</span>
                <span className="font-mono text-indigo-300">₹ 81,000.00</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800 pt-4 mt-auto gap-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={16} />
              <span className="text-sm">Due: 11 Nov 2023</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none text-sm bg-teal-500 text-teal-950 px-4 py-2 rounded-xl font-medium shadow-[0_0_15px_rgba(45,212,191,0.4)] flex items-center justify-center gap-2">
                <UploadCloud size={16} /> File Directly
              </button>
              <button onClick={handleExportCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm text-indigo-400 border border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
                <Download size={16} /> Export CSV
              </button>
              <button disabled className="flex-1 sm:flex-none text-sm text-indigo-400 border border-zinc-700 px-4 py-2 rounded-xl opacity-50 cursor-not-allowed hidden sm:block">
                Download JSON
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none blur-xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-indigo-300 mb-1">GSTR-3B</h3>
                <p className="text-sm text-zinc-400">Monthly return summarizing outward & inward supplies.</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider">
                <AlertTriangle size={14} /> Pending
              </span>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-zinc-800 -z-10 -translate-y-1/2"></div>
                <div className="absolute left-4 right-1/2 top-1/2 h-[2px] bg-indigo-500 -z-10 -translate-y-1/2 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                    <CheckCircle2 size={16} />
                  </div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">Summary</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-zinc-950 text-indigo-400 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                    <span className="font-semibold text-sm">2</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">Offset</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-900/50 text-zinc-500 flex items-center justify-center">
                    <span className="font-semibold text-sm">3</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">File</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-zinc-800 pt-4 gap-4 relative z-10 mt-auto">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">Due in 2 days (20 Nov)</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none text-sm text-indigo-400 border border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-800 transition-colors">
                Review
              </button>
              <button className="flex-1 sm:flex-none text-sm border border-teal-500 text-teal-400 px-4 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex items-center justify-center gap-2">
                <Zap size={16} /> File Directly
              </button>
              <button className="flex-1 sm:flex-none text-sm bg-gradient-to-r from-teal-400 to-emerald-500 text-teal-950 px-6 py-2 rounded-xl font-medium shadow-[0_0_15px_rgba(45,212,191,0.4)]">
                File Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-2xl font-bold text-indigo-300 mb-6">Tax Liability vs. Input Tax Credit (ITC)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-800/30 rounded-xl p-5 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <span className="text-sm font-medium">Total Tax Liability</span>
            </div>
            <div className="text-3xl font-bold text-indigo-300">₹ 81,000</div>
            <div className="mt-3 flex gap-4 text-xs text-zinc-400 font-mono">
              <span>IGST: ₹40K</span>
              <span>CGST: ₹20.5K</span>
              <span>SGST: ₹20.5K</span>
            </div>
          </div>
          <div className="bg-zinc-800/30 rounded-xl p-5 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <span className="text-sm font-medium">Total Eligible ITC</span>
            </div>
            <div className="text-3xl font-bold text-teal-400">₹ 65,000</div>
            <div className="mt-3 flex gap-4 text-xs text-zinc-400 font-mono">
              <span>IGST: ₹35K</span>
              <span>CGST: ₹15K</span>
              <span>SGST: ₹15K</span>
            </div>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-5 border border-rose-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-2 text-rose-400 mb-3 relative z-10">
              <span className="text-sm font-semibold">Net Tax Payable (Cash)</span>
            </div>
            <div className="text-3xl font-bold text-rose-400 relative z-10 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">₹ 16,000</div>
            <div className="mt-3 flex gap-4 text-xs text-zinc-400 font-mono relative z-10">
              <span>IGST: ₹5K</span>
              <span>CGST: ₹5.5K</span>
              <span>SGST: ₹5.5K</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-800/50">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tax Head</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Liability (₹)</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">ITC Set-off (₹)</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Cash Payable (₹)</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm text-zinc-300">
              <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-sans font-medium text-indigo-300">IGST</td>
                <td className="p-4 text-right">40,000.00</td>
                <td className="p-4 text-right text-teal-400">-35,000.00</td>
                <td className="p-4 text-right">5,000.00</td>
              </tr>
              <tr className="border-b border-zinc-800/50 bg-zinc-800/10 hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-sans font-medium text-indigo-300">CGST</td>
                <td className="p-4 text-right">20,500.00</td>
                <td className="p-4 text-right text-teal-400">-15,000.00</td>
                <td className="p-4 text-right">5,500.00</td>
              </tr>
              <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="p-4 font-sans font-medium text-indigo-300">SGST</td>
                <td className="p-4 text-right">20,500.00</td>
                <td className="p-4 text-right text-teal-400">-15,000.00</td>
                <td className="p-4 text-right">5,500.00</td>
              </tr>
              <tr className="bg-indigo-500/5 font-bold border-t border-indigo-500/20">
                <td className="p-4 font-sans text-indigo-300">Total</td>
                <td className="p-4 text-right text-indigo-300">81,000.00</td>
                <td className="p-4 text-right text-teal-400">-65,000.00</td>
                <td className="p-4 text-right text-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]">16,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
