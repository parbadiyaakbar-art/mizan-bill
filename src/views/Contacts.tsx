import { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, MapPin, Building2, Wallet, ArrowRightLeft, X } from 'lucide-react';

import * as db from '../services/FirebaseService';

export default function Contacts({ shopId, userId }: { shopId: string, userId: string }) {
  const [activeTab, setActiveTab] = useState<'Customer' | 'Supplier'>('Customer');
  const [contacts, setContacts] = useState<any[]>([]);
  const [customerBalances, setCustomerBalances] = useState<Record<string, number>>({});
  const [supplierBalances, setSupplierBalances] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [contraModal, setContraModal] = useState<{ isOpen: boolean; contactName: string; cBalance: number; sBalance: number } | null>(null);
  const [contraAmount, setContraAmount] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    
    if (userId) {
      const [contactsData, sales, purchases, cPayments, sPayments] = await Promise.all([
        db.getContacts(userId),
        db.getSalesInvoices(userId),
        db.getPurchaseInvoices(userId),
        db.getCustomerPayments(userId),
        db.getSupplierPayments(userId)
      ]);
      setContacts(contactsData || []);

      const cLedger: Record<string, number> = {};
      sales?.forEach((inv: any) => {
         if (inv.party_name && inv.party_name !== 'Cash Sale') {
            cLedger[inv.party_name] = (cLedger[inv.party_name] || 0) + (inv.totals?.invoiceTotal || 0);
         }
      });
      cPayments?.forEach((p: any) => {
         if (p.customer) cLedger[p.customer] = (cLedger[p.customer] || 0) - (p.amount || 0);
      });
      setCustomerBalances(cLedger);

      const sLedger: Record<string, number> = {};
      purchases?.forEach((inv: any) => {
         if (inv.party_name) {
            sLedger[inv.party_name] = (sLedger[inv.party_name] || 0) + (inv.totals?.invoiceTotal || 0);
         }
      });
      sPayments?.forEach((p: any) => {
         if (p.supplier) sLedger[p.supplier] = (sLedger[p.supplier] || 0) - (p.amount || 0);
      });
      setSupplierBalances(sLedger);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleContraSubmit = async () => {
    if (!contraModal || !contraAmount) return;
    const amount = parseFloat(contraAmount);
    if (isNaN(amount) || amount <= 0) return;

    
    

    const dateStr = new Date().toISOString().split('T')[0];

    // Create Customer Payment (Reduces Customer Balance)
    const cPayment = {
      type: 'CustomerPayment',
      date: dateStr,
      customer: contraModal.contactName,
      amount: amount,
      mode: 'Contra Adjustment',
      notes: 'Offset against Supplier Balance',
    };

    // Create Supplier Payment (Reduces Supplier Balance)
    const sPayment = {
      type: 'SupplierPayment',
      date: dateStr,
      supplier: contraModal.contactName,
      amount: amount,
      mode: 'Contra Adjustment',
      paymentType: 'Payment',
      notes: 'Offset against Customer Balance',
    };

    await Promise.all([
      db.saveCustomerPayment(userId, cPayment),
      db.saveSupplierPayment(userId, sPayment)
    ]);

    setContraModal(null);
    setContraAmount('');
    fetchData();
  };

  // We should also list contacts that appear in our ledgers but might not be formally saved in 'contacts' collection
  const allKnownNames = new Set([
    ...contacts.map(c => c.name),
    ...Object.keys(customerBalances),
    ...Object.keys(supplierBalances)
  ]);

  const virtualContacts = Array.from(allKnownNames).filter(Boolean).map(name => {
    const c = contacts.find(contact => contact.name === name) || {};
    const cBal = customerBalances[name] || 0;
    const sBal = supplierBalances[name] || 0;
    
    // Determine primary type based on balances if not explicitly set
    let computedType = c.type;
    if (!computedType) {
       computedType = sBal > cBal ? 'Supplier' : 'Customer';
    }

    return {
      ...c,
      id: c.id || name,
      name,
      computedType,
      cBalance: cBal,
      sBalance: sBal
    };
  });

  const filteredContacts = virtualContacts.filter(
    (c) =>
      c.computedType === activeTab &&
      ((c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <Users className="text-indigo-400" /> ખાતાઓની યાદી (Contacts & Parties)
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Manage your customers and suppliers, track their outstanding balances.</p>
      </div>

      {contraModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <ArrowRightLeft className="text-indigo-400" /> Contra Adjustment
              </h3>
              <button onClick={() => setContraModal(null)} className="text-zinc-500 hover:text-zinc-300"><X size={20}/></button>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6">
              Offset outstanding balances for <strong className="text-zinc-200">{contraModal.contactName}</strong> who acts as both a customer and supplier.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                <span className="text-sm text-zinc-400">Customer Balance (ઉધરાણી)</span>
                <span className="text-emerald-400 font-mono font-bold">₹{contraModal.cBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                <span className="text-sm text-zinc-400">Supplier Balance (દેવું)</span>
                <span className="text-rose-400 font-mono font-bold">₹{contraModal.sBalance.toFixed(2)}</span>
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Amount to Adjust (₹)</label>
                <input 
                  type="number" 
                  value={contraAmount} 
                  onChange={(e) => setContraAmount(e.target.value)} 
                  className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 font-mono" 
                  placeholder={`Max: ${Math.min(contraModal.cBalance, contraModal.sBalance).toFixed(2)}`} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setContraModal(null)} className="px-4 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium">Cancel</button>
              <button onClick={handleContraSubmit} className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                Execute Offset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-xl flex flex-col min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('Customer')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'Customer'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            ગ્રાહકો (Customers List)
          </button>
          <button
            onClick={() => setActiveTab('Supplier')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'Supplier'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            વેપારીઓ (Suppliers List)
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <button className="flex items-center gap-2 bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors cursor-not-allowed opacity-50" title="Adding manually is currently disabled. Contacts auto-create on invoice.">
            <Plus size={18} />
            <span>Add {activeTab === 'Customer' ? 'Customer' : 'Supplier'}</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No {activeTab.toLowerCase()}s found. Try searching.
              <br />
              (Contacts will automatically appear here when you create an invoice.)
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Mobile & Details</th>
                  <th className="px-6 py-4 font-semibold text-right">Outstanding Balance</th>
                  <th className="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredContacts.map((contact) => {
                  const bal = activeTab === 'Customer' ? contact.cBalance : contact.sBalance;
                  const canContra = contact.cBalance > 0 && contact.sBalance > 0;
                  
                  return (
                  <tr key={contact.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                          {(contact.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-200">{contact.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-400 text-sm">
                      {contact.phone && (
                        <div className="flex items-center gap-2 mb-1">
                          <Phone size={14} className="text-zinc-600" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.address && (
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <MapPin size={12} className="text-zinc-600" />
                          {contact.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bal > 0 ? (
                        <span className={`font-mono font-bold ${activeTab === 'Customer' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{bal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-mono">₹0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canContra ? (
                        <button 
                          onClick={() => setContraModal({ 
                            isOpen: true, 
                            contactName: contact.name, 
                            cBalance: contact.cBalance, 
                            sBalance: contact.sBalance 
                          })}
                          className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-500/20 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <ArrowRightLeft size={14} /> Contra Adjust
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
