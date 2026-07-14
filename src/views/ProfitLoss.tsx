import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import * as db from '../services/FirebaseService';
import { auth } from '../lib/firebase';

export default function ProfitLoss({ onBack, shopId, userId }: { onBack?: () => void, shopId: string, userId: string }) {
  const [sales, setSales] = useState(0);
  const [purchases, setPurchases] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [wastage, setWastage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesInvoices: any[] = await db.getSalesInvoices(shopId);
        const purchaseInvoices: any[] = await db.getPurchaseInvoices(shopId);
        const shopExpenses: any[] = await db.getShopExpenses(shopId);
        const stockWastages: any[] = await db.getStockWastages(shopId);

        const totalSales = salesInvoices.reduce((acc, inv) => acc + (inv.totals?.invoiceTotal || 0), 0);
        const totalPurchases = purchaseInvoices.reduce((acc, inv) => acc + (inv.totals?.invoiceTotal || 0), 0);
        const totalExpenses = shopExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
        const totalWastage = stockWastages.reduce((acc, w) => acc + (w.lossAmount || 0), 0);

        setSales(totalSales);
        setPurchases(totalPurchases);
        setExpenses(totalExpenses);
        setWastage(totalWastage);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const netProfit = sales - purchases - expenses - wastage;
  const isProfitable = netProfit >= 0;

  if (loading) {
    return <div className="text-zinc-400">Loading Profit & Loss Summary...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft size={24} />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Profit & Loss Summary (નફા-નુકસાન ખાતું)</h2>
          <p className="text-zinc-400 text-sm mt-1">Calculate Net Profit by subtracting costs from revenue</p>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-8 backdrop-blur-xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
            <span className="text-zinc-300 font-medium text-lg">Total Sales (વેચાણ)</span>
            <span className="text-emerald-400 font-mono text-xl">+ ₹{sales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
            <span className="text-zinc-300 font-medium text-lg">Total Purchases (ખરીદી)</span>
            <span className="text-rose-400 font-mono text-xl">- ₹{purchases.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
            <span className="text-zinc-300 font-medium text-lg">Shop Expenses (દુકાન ખર્ચ)</span>
            <span className="text-rose-400 font-mono text-xl">- ₹{expenses.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
            <span className="text-zinc-300 font-medium text-lg">Damage/Wastage (નુકસાની)</span>
            <span className="text-rose-400 font-mono text-xl">- ₹{wastage.toFixed(2)}</span>
          </div>
        </div>

        <div className={`mt-8 p-6 rounded-xl border ${isProfitable ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            {isProfitable ? <TrendingUp size={32} className="text-emerald-400" /> : <TrendingDown size={32} className="text-rose-400" />}
            <div>
              <p className={`text-sm font-semibold uppercase tracking-wider ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isProfitable ? 'Net Profit' : 'Net Loss'} (ચોખ્ખો નફો/નુકસાન)
              </p>
            </div>
          </div>
          <div className={`text-4xl font-bold font-mono ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
            ₹{Math.abs(netProfit).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
