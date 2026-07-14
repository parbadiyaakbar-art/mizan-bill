import { useState, useEffect } from 'react';
import { Calculator, Wallet, Banknote, Users, ShoppingCart, IndianRupee, RefreshCw, Printer, ArrowRightLeft, UserCircle2, Landmark, Check, Plus, ChevronDown, Receipt, FileText } from 'lucide-react';
import * as db from '../services/FirebaseService';
import { DashboardSkeleton } from '../components/Skeleton';

export default function DailyCash({ onViewChange, shopId, userId }: { onViewChange?: (view: string) => void, shopId: string, userId: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBillingDropdown, setShowBillingDropdown] = useState(false);
  
  const [cashDepositedToBank, setCashDepositedToBank] = useState(0);
  const [cashWithdrawnFromBank, setCashWithdrawnFromBank] = useState(0);
  const [ownerCapitalIn, setOwnerCapitalIn] = useState(0);
  const [ownerDrawingsOut, setOwnerDrawingsOut] = useState(0);
  const [upiSettled, setUpiSettled] = useState(0);

  const [draftCashDeposited, setDraftCashDeposited] = useState("");
  const [draftCashWithdrawn, setDraftCashWithdrawn] = useState("");
  const [draftCapitalIn, setDraftCapitalIn] = useState("");
  const [draftDrawingsOut, setDraftDrawingsOut] = useState("");
  const [draftUpiSettled, setDraftUpiSettled] = useState("");

  const [metrics, setMetrics] = useState({
    openingCash: 0,
    cashSales: 0,
    upiSales: 0,
    creditSales: 0,
    cashCollected: 0,
    cashPaid: 0,
    shopExpenses: 0,
  });

  const fetchMetrics = async (isInitial = false) => {
    if (!isInitial) setIsRefreshing(true);
    else setLoading(true);
    
    try {
      // 1. Fetch Today's Daily Cash State (for manual entries like cash deposited, etc.)
      const dailyStates: any[] = await db.getDailyCashStates(shopId);
      const todayState = dailyStates.find(s => s.date === selectedDate);
      
      const _cashDeposited = todayState?.cashDepositedToBank || 0;
      const _cashWithdrawn = todayState?.cashWithdrawnFromBank || 0;
      const _capitalIn = todayState?.ownerCapitalIn || 0;
      const _drawingsOut = todayState?.ownerDrawingsOut || 0;
      const _upiSettled = todayState?.upiSettled || 0;

      setCashDepositedToBank(_cashDeposited);
      setCashWithdrawnFromBank(_cashWithdrawn);
      setOwnerCapitalIn(_capitalIn);
      setOwnerDrawingsOut(_drawingsOut);
      setUpiSettled(_upiSettled);

      setDraftCashDeposited(_cashDeposited > 0 ? _cashDeposited.toString() : "");
      setDraftCashWithdrawn(_cashWithdrawn > 0 ? _cashWithdrawn.toString() : "");
      setDraftCapitalIn(_capitalIn > 0 ? _capitalIn.toString() : "");
      setDraftDrawingsOut(_drawingsOut > 0 ? _drawingsOut.toString() : "");
      setDraftUpiSettled(_upiSettled > 0 ? _upiSettled.toString() : "");

      // 2. Fetch all transactions to calculate historic opening cash & today's metrics
      const [salesResult, purchasesResult, customerPaymentsResult, supplierPaymentsResult, shopExpensesResult] = await Promise.all([
        db.getSalesInvoices(shopId),
        db.getPurchaseInvoices(shopId),
        db.getCustomerPayments(shopId),
        db.getSupplierPayments(shopId),
        db.getShopExpenses(shopId)
      ]);
      const sales: any[] = salesResult;
      const purchases: any[] = purchasesResult;
      const customerPayments: any[] = customerPaymentsResult;
      const supplierPayments: any[] = supplierPaymentsResult;
      const shopExpenses: any[] = shopExpensesResult;

      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      let historicCashIn = 0;
      let historicCashOut = 0;

      let todayCashSales = 0;
      let todayUpiSales = 0;
      let todayCreditSales = 0;
      let todayCashCollected = 0;
      let todayCashPaid = 0;
      let todayShopExpenses = 0;

      // Calculate Historic Cash from states
      dailyStates.forEach(state => {
         const sDate = new Date(state.date);
         sDate.setHours(0,0,0,0);
         if (sDate < selected) {
            historicCashIn += (state.cashWithdrawnFromBank || 0) + (state.ownerCapitalIn || 0);
            historicCashOut += (state.cashDepositedToBank || 0) + (state.ownerDrawingsOut || 0);
         }
      });

      const processTransaction = (itemDateStr: string, type: string, mode: string, amount: number) => {
         if (!itemDateStr) return;
         const itemDate = new Date(itemDateStr);
         itemDate.setHours(0,0,0,0);
         const isToday = itemDate.getTime() === selected.getTime();
         const isBefore = itemDate < selected;

         mode = mode.toLowerCase();
         const isCash = mode === 'cash';
         const isUpi = mode === 'upi' || mode === 'bank transfer' || mode === 'card';
         const isCredit = mode === 'credit' || mode === 'udhaar';

         if (type === 'Sale') {
            if (isToday) {
               if (isCash) todayCashSales += amount;
               else if (isUpi) todayUpiSales += amount;
               else if (isCredit) todayCreditSales += amount;
               else todayCashSales += amount;
            }
            if (isBefore && (isCash || (!isUpi && !isCredit))) historicCashIn += amount;
         } else if (type === 'Purchase') {
            if (isToday && isCash) todayCashPaid += amount;
            if (isBefore && isCash) historicCashOut += amount;
         } else if (type === 'CustomerPayment') {
            if (isToday && isCash) todayCashCollected += amount;
            if (isBefore && isCash) historicCashIn += amount;
         } else if (type === 'SupplierPayment') {
            if (isToday && isCash) todayCashPaid += amount;
            if (isBefore && isCash) historicCashOut += amount;
         } else if (type === 'Expense') {
            if (isToday && isCash) todayShopExpenses += amount;
            if (isBefore && isCash) historicCashOut += amount;
         }
      };

      sales.forEach(s => processTransaction(s.date, 'Sale', s.paymentMode || s.mode || 'cash', s.totals?.invoiceTotal || s.amount || 0));
      purchases.forEach(p => processTransaction(p.date, 'Purchase', p.paymentMode || p.mode || 'cash', p.totals?.invoiceTotal || p.amount || 0));
      customerPayments.forEach(c => processTransaction(c.date, 'CustomerPayment', c.mode || 'cash', c.amount || 0));
      supplierPayments.forEach(s => processTransaction(s.date, 'SupplierPayment', s.mode || 'cash', s.amount || 0));
      shopExpenses.forEach(e => processTransaction(e.date, 'Expense', e.payment_mode || e.paymentMode || e.mode || 'cash', e.amount || 0));

      setMetrics({
        openingCash: historicCashIn - historicCashOut,
        cashSales: todayCashSales,
        upiSales: todayUpiSales,
        creditSales: todayCreditSales,
        cashCollected: todayCashCollected,
        cashPaid: todayCashPaid,
        shopExpenses: todayShopExpenses
      });
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
    setIsRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics(true);
  }, [selectedDate, shopId]);

  const handleSaveField = async (field: 'cashDeposited' | 'cashWithdrawn' | 'capitalIn' | 'drawingsOut' | 'upiSettled') => {
    let value = 0;
    const newState = {
      cashDepositedToBank,
      cashWithdrawnFromBank,
      ownerCapitalIn,
      ownerDrawingsOut,
      upiSettled
    };

    if (field === 'cashDeposited') {
      value = parseFloat(draftCashDeposited) || 0;
      setCashDepositedToBank(value);
      newState.cashDepositedToBank = value;
    } else if (field === 'cashWithdrawn') {
      value = parseFloat(draftCashWithdrawn) || 0;
      setCashWithdrawnFromBank(value);
      newState.cashWithdrawnFromBank = value;
    } else if (field === 'capitalIn') {
      value = parseFloat(draftCapitalIn) || 0;
      setOwnerCapitalIn(value);
      newState.ownerCapitalIn = value;
    } else if (field === 'drawingsOut') {
      value = parseFloat(draftDrawingsOut) || 0;
      setOwnerDrawingsOut(value);
      newState.ownerDrawingsOut = value;
    } else if (field === 'upiSettled') {
      value = parseFloat(draftUpiSettled) || 0;
      setUpiSettled(value);
      newState.upiSettled = value;
    }

    try {
      await db.saveDailyCashState(shopId, selectedDate, newState);
    } catch (err) {
      console.error("Save failed", err);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const finalExpectedCash = 
    metrics.openingCash
    + metrics.cashSales 
    + metrics.cashCollected 
    + ownerCapitalIn
    + cashWithdrawnFromBank
    - metrics.cashPaid
    - metrics.shopExpenses
    - cashDepositedToBank
    - ownerDrawingsOut;

  const pendingUpi = metrics.upiSales - (upiSettled || 0);

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Calculator className="text-indigo-400" /> Daily Cash & Sales (રોજમેળ)
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time daily financial health and counter cash.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="relative shrink-0">
          <button
            onClick={() => setShowBillingDropdown(!showBillingDropdown)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          >
            <Plus size={18} />
            બિલિંગ વિભાગ (Invoices & Estimates)
            <ChevronDown size={16} className={`transition-transform ${showBillingDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showBillingDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowBillingDropdown(false);
                    if (onViewChange) onViewChange('sales-new');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg group-hover:bg-emerald-500/20">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">વેચાણ બિલ</div>
                    <div className="text-xs text-zinc-500">Sale Invoice</div>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setShowBillingDropdown(false);
                    if (onViewChange) onViewChange('purchases-new');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg group-hover:bg-blue-500/20">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">ખરીદી બિલ</div>
                    <div className="text-xs text-zinc-500">Purchase Invoice</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowBillingDropdown(false);
                    if (onViewChange) onViewChange('quotations-new');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <div className="bg-amber-500/10 text-amber-400 p-2 rounded-lg group-hover:bg-amber-500/20">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">અંદાજપત્ર</div>
                    <div className="text-xs text-zinc-500">Quotation / Estimate</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/50 rounded-lg px-2 py-1 shrink-0">
            <span className="text-xs text-zinc-400 font-semibold px-2">DATE</span>
            <input 
               type="date" 
               value={selectedDate} 
               onChange={(e) => setSelectedDate(e.target.value)} 
               className="bg-transparent border-none text-zinc-100 focus:outline-none text-sm [color-scheme:dark]"
            />
          </div>
          
          <button 
            onClick={() => fetchMetrics()}
            className={`bg-zinc-800 text-zinc-300 p-2 rounded-lg hover:bg-zinc-700 transition-colors shrink-0 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={handlePrint}
            className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0"
          >
            <Printer size={20} />
          </button>
        </div>
        </div>
      </div>
      
      <div className="hidden print:block mb-8 pb-4 border-b border-zinc-300">
         <h1 className="text-2xl font-bold text-black mb-2">Daily Cash & Sales (રોજમેળ)</h1>
         <p className="text-zinc-600">Date: {selectedDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 backdrop-blur-xl lg:col-span-2 print:border-zinc-300 print:bg-white print:text-black">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2 print:text-black">
            <Wallet size={18} className="text-indigo-400 print:text-black" /> Sales Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 print:bg-transparent print:border-zinc-300">
              <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 print:text-zinc-600">Cash Sales</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 print:text-black">₹ {metrics.cashSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 print:bg-transparent print:border-zinc-300">
              <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 print:text-zinc-600">UPI / Digital</div>
              <div className="text-2xl font-bold font-mono text-blue-400 print:text-black">₹ {metrics.upiSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
            <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 print:bg-transparent print:border-zinc-300">
              <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 print:text-zinc-600">Udhaar (Credit) Given</div>
              <div className="text-2xl font-bold font-mono text-rose-400 print:text-black">₹ {metrics.creditSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-zinc-800/50 flex justify-between items-center print:border-zinc-300">
            <span className="text-zinc-300 font-medium print:text-black">Total Billed</span>
            <span className="text-2xl font-bold font-mono text-zinc-100 print:text-black">₹ {(metrics.cashSales + metrics.upiSales + metrics.creditSales).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl flex flex-col relative overflow-hidden print:border-zinc-300 print:bg-white print:text-black">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2 print:text-black">
            <Banknote size={18} className="text-blue-400 print:text-black" /> Digital Settlements
          </h3>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm print:text-zinc-600">Total UPI / Digital</span>
              <span className="text-blue-400 font-mono text-sm print:text-black">₹ {metrics.upiSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm print:text-zinc-600">Settled to Bank</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 print:text-black">- ₹</span>
                <input
                    type="number"
                    value={draftUpiSettled}
                    onChange={(e) => setDraftUpiSettled(e.target.value)}
                    className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-indigo-500 font-mono print:bg-transparent print:border-none print:text-black"
                />
                <button
                    onClick={() => handleSaveField('upiSettled')}
                    className="p-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-colors print:hidden"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800 print:border-zinc-300">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1 print:text-zinc-600">Pending Settlement</div>
              </div>
              <div className="text-xl font-bold font-mono text-blue-400 print:text-black">
                ₹ {pendingUpi.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl lg:col-span-2 print:border-zinc-300 print:bg-white print:text-black">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2 print:text-black">
            <ArrowRightLeft size={18} className="text-purple-400 print:text-black" /> Inner Banking & Capital (અન્ય વ્યવહારો)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-300 font-medium pb-2 border-b border-zinc-800/50 print:text-black print:border-zinc-300">
                <Landmark size={16} className="text-indigo-400"/> Contra Entries (Cash ↔ Bank)
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm print:text-zinc-600">Cash Deposited to Bank</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 print:text-black">₹</span>
                  <input
                      type="number"
                      value={draftCashDeposited}
                      onChange={(e) => setDraftCashDeposited(e.target.value)}
                      className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-indigo-500 font-mono print:bg-transparent print:border-none print:text-black"
                  />
                  <button
                      onClick={() => handleSaveField('cashDeposited')}
                      className="p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 transition-colors print:hidden"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm print:text-zinc-600">Cash Withdrawn from Bank</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 print:text-black">₹</span>
                  <input
                      type="number"
                      value={draftCashWithdrawn}
                      onChange={(e) => setDraftCashWithdrawn(e.target.value)}
                      className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-indigo-500 font-mono print:bg-transparent print:border-none print:text-black"
                  />
                  <button
                      onClick={() => handleSaveField('cashWithdrawn')}
                      className="p-1 rounded bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/40 transition-colors print:hidden"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-300 font-medium pb-2 border-b border-zinc-800/50 print:text-black print:border-zinc-300">
                <UserCircle2 size={16} className="text-emerald-400"/> Owner Capital & Drawings
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm print:text-zinc-600">Capital Brought In</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 print:text-black">₹</span>
                  <input
                      type="number"
                      value={draftCapitalIn}
                      onChange={(e) => setDraftCapitalIn(e.target.value)}
                      className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-emerald-500 font-mono print:bg-transparent print:border-none print:text-black"
                  />
                  <button
                      onClick={() => handleSaveField('capitalIn')}
                      className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors print:hidden"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm print:text-zinc-600">Drawings / Upad (ઉપાડ)</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 print:text-black">₹</span>
                  <input
                      type="number"
                      value={draftDrawingsOut}
                      onChange={(e) => setDraftDrawingsOut(e.target.value)}
                      className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-rose-500 font-mono print:bg-transparent print:border-none print:text-black"
                  />
                  <button
                      onClick={() => handleSaveField('drawingsOut')}
                      className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 transition-colors print:hidden"
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl flex flex-col relative overflow-hidden print:border-zinc-300 print:bg-white print:text-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl print:hidden"></div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-6 flex items-center gap-2 print:text-black">
            <IndianRupee size={18} className="text-emerald-400 print:text-black" /> Counter Cash
          </h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm print:text-zinc-600">Opening Cash (Calculated)</span>
              <span className="text-zinc-300 font-mono text-sm print:text-black">₹ {metrics.openingCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm print:text-zinc-600">Cash Sales</span>
              <span className="text-emerald-400 font-mono text-sm print:text-black">+ ₹ {metrics.cashSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm flex items-center gap-1.5 print:text-zinc-600"><Users size={14}/> Customer Cash Receipts</span>
              <span className="text-emerald-400 font-mono text-sm print:text-black">+ ₹ {metrics.cashCollected.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            {(cashWithdrawnFromBank > 0 || ownerCapitalIn > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm flex items-center gap-1.5 print:text-zinc-600"><ArrowRightLeft size={14}/> Additions (Bank/Owner)</span>
                <span className="text-emerald-400 font-mono text-sm print:text-black">+ ₹ {((cashWithdrawnFromBank || 0) + (ownerCapitalIn || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm flex items-center gap-1.5 print:text-zinc-600"><ShoppingCart size={14}/> Supplier Cash Paid</span>
              <span className="text-rose-400 font-mono text-sm print:text-black">- ₹ {metrics.cashPaid.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            {metrics.shopExpenses > 0 && (
               <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm flex items-center gap-1.5 print:text-zinc-600"><ShoppingCart size={14}/> Shop Expenses</span>
                  <span className="text-rose-400 font-mono text-sm print:text-black">- ₹ {metrics.shopExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
               </div>
            )}

            {(cashDepositedToBank > 0 || ownerDrawingsOut > 0) && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm flex items-center gap-1.5 print:text-zinc-600"><ArrowRightLeft size={14}/> Deductions (Bank/Owner)</span>
                <span className="text-rose-400 font-mono text-sm print:text-black">- ₹ {((cashDepositedToBank || 0) + (ownerDrawingsOut || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
          </div>
          <div className="mt-6 pt-4 border-t border-zinc-800 print:border-zinc-300">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1 print:text-zinc-600">Final Expected Cash</div>
                <div className="text-zinc-500 text-xs print:text-zinc-500">Matching drawer total</div>
              </div>
              <div className="text-3xl font-bold font-mono text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)] print:drop-shadow-none print:text-black">
                ₹ {finalExpectedCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
