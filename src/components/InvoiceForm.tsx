import * as db from '../services/FirebaseService';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Barcode } from 'lucide-react';

import { BusinessType } from '../types';



import { calculateInvoiceTotals, LineItem } from '../utils/calculations';

interface InvoiceFormProps {
  type: 'sales' | 'purchase';
  onBack: () => void;
  shopId: string;
  userId: string;
  isEstimate?: boolean;
}

export default function InvoiceForm({ type, onBack, shopId, userId, isEstimate = false }: InvoiceFormProps) {
  const [items, setItems] = useState<LineItem[]>([
    { id: '1', item: '', category: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, discount: 0, gst: 18, warehouse: 'Main Godown', batchNo: '', expiryDate: '' }
  ]);
  
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [flatDiscount, setFlatDiscount] = useState(0);
  
  const [stateCode, setStateCode] = useState('24'); // Default state
  
  // Advanced Features
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [salesRep, setSalesRep] = useState('');
  const [linkedNote, setLinkedNote] = useState('');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
  const [allowNegativeStock, setAllowNegativeStock] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  // Logistics
  const [transportName, setTransportName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [freightCharges, setFreightCharges] = useState(0);

  // Customer Outstanding
  const [previousBalance, setPreviousBalance] = useState(0);

  // General Details
  const [partyName, setPartyName] = useState('');
  const [partyMobile, setPartyMobile] = useState('');
  const [allContacts, setAllContacts] = useState<any[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const contacts = await db.getContacts(shopId);
      setAllContacts(contacts);
    }
    const fetchSettings = async () => {
      const settings = await db.getBusinessSettings(shopId);
      if (settings) {
        if (settings.businessType) setBusinessType(settings.businessType as BusinessType);
        if (settings.currency) setCurrency(settings.currency);
        if (settings.stateCode) setStateCode(settings.stateCode);
        setAllowNegativeStock(settings.allowNegativeStock !== false);
      }
    };
    const fetchProducts = async () => {
      const products = await db.getProducts(shopId);
      setAllProducts(products);
    };
    fetchContacts();
    fetchSettings();
    fetchProducts();
  }, [shopId]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMobile = e.target.value;
    setPartyMobile(newMobile);
    if (newMobile.length >= 10) {
       const found = allContacts.find(c => c.phone === newMobile && c.type === (isSales ? 'Customer' : 'Supplier'));
       if (found) {
          if (found.name) setPartyName(found.name);
          if (found.address) setBillingAddress(found.address);
       }
    }
  };

  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  
  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Notes & Terms
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Enhancements
  const [linkedPO, setLinkedPO] = useState('');
  const [handlingCharges, setHandlingCharges] = useState(0);
  const [laborCharges, setLaborCharges] = useState(0);
  const [amountPaidUpfront, setAmountPaidUpfront] = useState(0);

  // Credit Limit Mock
  const mockCustomers = {
    'DesignStudio LLC': { balance: 45000, creditLimit: 50000 },
    'Acme Corp': { balance: 15000, creditLimit: 10000 },
  };

  const currentCustomer = mockCustomers[partyName as keyof typeof mockCustomers];
  const COMPANY_STATE_CODE = '29'; // Assuming company is registered in state 29
  const isSales = type === 'sales';
  const STORAGE_KEY = `mizan_invoice_draft_${type}`;

  const [showPreview, setShowPreview] = useState(false);
  const [printPaperSize, setPrintPaperSize] = useState<'A4'|'A5'|'Thermal'>('A4');
  
  useEffect(() => {
    if (userId) {
      db.getBusinessSettings(userId).then(settings => {
        if (settings?.businessType) setBusinessType(settings.businessType as BusinessType);
      });
      
      db.getDraft(userId, type).then(draft => {
        if (draft) {
          if (draft.items) setItems(draft.items);
          if (draft.partyName) setPartyName(draft.partyName);
          if (draft.paymentMode) setPaymentMode(draft.paymentMode);
          if (draft.invoiceDate) setInvoiceDate(draft.invoiceDate);
          if (draft.invoiceNumber) setInvoiceNumber(draft.invoiceNumber);
        }
      });
    }
  }, [type]);

  useEffect(() => {
    const initInvoice = async () => {
      const nextId = Math.floor(Math.random() * 1000);
      const prefix = isSales ? 'INV-' : 'BILL-';
      const formattedId = prefix + String(nextId).padStart(3, '0');
      
      setInvoiceNumber(prev => prev || formattedId);
      setInvoiceDate(prev => prev || new Date().toISOString().split('T')[0]);
    };
    initInvoice();
  }, [type]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userId && (items[0]?.item || partyName)) {
        db.saveDraft(userId, type, { items, partyName, paymentMode, invoiceDate, invoiceNumber });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [items, partyName, paymentMode, invoiceDate, invoiceNumber, type]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), item: '', category: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, discount: 0, gst: 18, warehouse: 'Main Godown', batchNo: '', expiryDate: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prevItems => {
      const updated = prevItems.map(i => i.id === id ? { ...i, [field]: value } : i);
      const isLast = updated[updated.length - 1].id === id;
      const lastItem = updated[updated.length - 1];
      if (isLast && lastItem.item && lastItem.rate > 0 && lastItem.qty > 0) {
        return [...updated, { id: Date.now().toString(), item: '', category: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, discount: 0, gst: 18, warehouse: 'Main Godown', batchNo: '', expiryDate: '' }];
      }
      return updated;
    });
  };

  const calculateTotals = () => {
    const isIntraState = !gstin || gstin.startsWith(stateCode);
    return calculateInvoiceTotals({
      items,
      isTaxInclusive,
      isIntraState,
      flatDiscount,
      freightCharges,
      handlingCharges,
      laborCharges,
      previousBalance,
      amountPaidUpfront,
      isSales: type === 'sales'
    });
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    if (paymentMode === 'Credit' || paymentMode === 'Credit/Udhaar' || paymentMode === 'Udhaar') {
      if (!partyName || !partyMobile || !billingAddress) {
        alert("Customer Name, Mobile Number, and Address are MANDATORY for Credit (ઉધાર) invoices.");
        return;
      }
    }

    // Negative Stock Check for Sales
    if (isSales && !allowNegativeStock) {
      for (const lineItem of items) {
        if (!lineItem.item) continue;
        const product = allProducts.find(p => p.name === lineItem.item || p.barcode === lineItem.item);
        if (product && product.currentStock < lineItem.qty) {
          alert(`Insufficient stock for ${lineItem.item}. Current stock: ${product.currentStock}`);
          return;
        }
      }
    }
    
    const user = userId;
    if (user && partyName && partyMobile) {
        await db.saveContact(shopId, {
            type: isSales ? 'Customer' : 'Supplier',
            name: partyName,
            phone: partyMobile,
            address: billingAddress,
        }).catch(err => console.error("Auto-save contact failed", err));
    }

    const invoiceData = {
      type: isSales ? 'Sales' : 'Purchase',
      date: invoiceDate,
      party_name: partyName,
      party_mobile: partyMobile,
      items,
      totals,
      payment_mode: paymentMode,
      notes
    };

    try {
      if (!userId) throw new Error('User not logged in');

      if (isEstimate) {
        const result = await db.saveQuotation(userId, shopId, { ...invoiceData, status: 'Sent' });
        setInvoiceNumber(`QT-${result.invoiceNumber.toString().padStart(4, '0')}`);
      } else if (isSales) {
        const result = await db.saveSalesInvoice(userId, shopId, invoiceData);
        setInvoiceNumber(`INV-${result.invoiceNumber.toString().padStart(4, '0')}`);
      } else {
        const result = await db.savePurchaseInvoice(userId, shopId, invoiceData);
        setInvoiceNumber(`BILL-${result.invoiceNumber.toString().padStart(4, '0')}`);
      }
      
      await db.clearDraft(userId, type);
      setShowPreview(true);
    } catch (err: any) {
      alert('Error saving invoice: ' + err.message);
    }
  };
  
  const handlePrint = (size: 'A4'|'A5'|'Thermal') => {
    setPrintPaperSize(size);
    // In a real app we would set a print style or open a print window with specific dimensions.
    // For now we rely on CSS media queries and window.print.
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const isMobileShop = businessType === 'Mobile & Accessories (મોબાઈલ અને એક્સેસરીઝ)';
  const isGroceryOrDairy = businessType === 'Grocery / Mini Mart (કરિયાણું અને નાના મોલ)' || businessType === 'Dairy & Bakery (ડેરી અને પાર્લર)';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]">
              Create {isEstimate ? 'Quotation' : isSales ? 'Sales' : 'Purchase'} Invoice
            </h2>
            <p className="text-zinc-400 mt-1 text-sm">Fill in the details below to generate a new invoice.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-zinc-900/60 border border-zinc-800/80 px-5 py-2.5 rounded-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500">
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div className="w-px h-6 bg-zinc-800 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-400 cursor-pointer" onClick={() => setIsTaxInclusive(!isTaxInclusive)}>Tax Inclusive</label>
            <button 
              onClick={() => setIsTaxInclusive(!isTaxInclusive)}
              className={`w-10 h-5 rounded-full relative transition-colors ${isTaxInclusive ? 'bg-indigo-500' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isTaxInclusive ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {isSales && currentCustomer && totals.totalDue > currentCustomer.creditLimit && (
        <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <div>
            <h4 className="text-rose-400 font-medium">Credit Limit Exceeded</h4>
            <p className="text-rose-400/80 text-sm mt-0.5">This customer's total pending balance (₹{totals.totalDue.toFixed(2)}) has crossed their approved credit limit of ₹{currentCustomer.creditLimit.toFixed(2)}.</p>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-zinc-100 mb-6">{isSales ? 'Customer' : 'Vendor'} Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{isSales ? 'Customer' : 'Vendor'} Name</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder={isSales ? "Customer Name" : "Vendor Name"} />
          </div>
          <div>
                      <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Mobile Number</label>
            <input type="tel" value={partyMobile} onChange={handleMobileChange} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="9876543210" />
          </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">GSTIN</label>
            <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="29XXXXX0000X0Z5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Previous Balance (₹)</label>
            <input type="number" value={previousBalance || ''} onChange={(e) => setPreviousBalance(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Billing Address</label>
            <textarea rows={2} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none" placeholder="Full address"></textarea>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-zinc-100">Invoice Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {!isSales && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Link PO</label>
              <select value={linkedPO} onChange={(e) => setLinkedPO(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
                <option value="">None</option>
                <option value="PO-2023-089">PO-2023-089</option>
                <option value="PO-2023-090">PO-2023-090</option>
              </select>
            </div>
          )}
          {isSales ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Sales Rep</label>
              <select value={salesRep} onChange={(e) => setSalesRep(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
                <option value="">None</option>
                <option value="John Doe">John Doe</option>
                <option value="Jane Smith">Jane Smith</option>
                <option value="Ali Khan">Ali Khan</option>
              </select>
            </div>
          ) : null}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Link {isSales ? 'Credit' : 'Debit'} Note</label>
            <select value={linkedNote} onChange={(e) => setLinkedNote(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
              <option value="">None</option>
              <option value="CN-001">CN-001 / DN-001</option>
              <option value="CN-002">CN-002 / DN-002</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{isSales ? 'Invoice' : 'Bill'} Number</label>
            <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder={isSales ? "INV-001" : "BILL-001"} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{isSales ? 'Invoice' : 'Bill'} Date</label>
            <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Payment Mode</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Credit">Credit/Udhaar</option>
            </select>
          </div>
          {paymentMode === 'Credit' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-zinc-100 mb-6">Line Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                <th className="pb-3 pr-4 font-semibold w-64">Item Name</th>
                {!isSales && <th className="pb-3 px-4 font-semibold w-32">Category</th>}
                <th className="pb-3 px-4 font-semibold w-24">HSN/SAC</th>
                {isSales && <th className="pb-3 px-4 font-semibold w-32">Warehouse</th>}
                {(!isSales && isGroceryOrDairy) && <th className="pb-3 px-4 font-semibold w-32">Batch No</th>}
                {(!isSales && isGroceryOrDairy) && <th className="pb-3 px-4 font-semibold w-36">Expiry</th>}
                {isMobileShop && <th className="pb-3 px-4 font-semibold w-36">IMEI / Serial</th>}
                <th className="pb-3 px-4 font-semibold w-40">Qty & Unit</th>
                <th className="pb-3 px-4 font-semibold w-32">Rate ({currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'})</th>
                <th className="pb-3 px-4 font-semibold w-24">Disc (%)</th>
                <th className="pb-3 px-4 font-semibold w-24">GST %</th>
                <th className="pb-3 px-4 font-semibold w-32 text-right">Amount</th>
                <th className="pb-3 pl-4 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody className="align-top">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4">
                    <input type="text" value={item.item} onChange={(e) => updateItem(item.id, 'item', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="Product or Service" />
                  </td>
                  {!isSales && (
                    <td className="py-3 px-4">
                      <select value={item.category || ''} onChange={(e) => updateItem(item.id, 'category', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
                        <option value="">Select...</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Software">Software</option>
                        <option value="Services">Services</option>
                        <option value="Office Supplies">Office Supplies</option>
                      </select>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <input type="text" value={item.hsn} onChange={(e) => updateItem(item.id, 'hsn', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="HSN" />
                  </td>
                  {isSales && (
                    <td className="py-3 px-4">
                      <select value={item.warehouse || ''} onChange={(e) => updateItem(item.id, 'warehouse', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all">
                        <option value="Main Godown">Main Godown</option>
                        <option value="Store 2">Store 2</option>
                        <option value="Warehouse B">Warehouse B</option>
                      </select>
                    </td>
                  )}
                  {(!isSales && isGroceryOrDairy) && (
                    <td className="py-3 px-4">
                      <input type="text" value={item.batchNo || ''} onChange={(e) => updateItem(item.id, 'batchNo', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="Batch No" />
                    </td>
                  )}
                  {(!isSales && isGroceryOrDairy) && (
                    <td className="py-3 px-4">
                      <input type="date" value={item.expiryDate || ''} onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all [color-scheme:dark]" />
                    </td>
                  )}
                  {isMobileShop && (
                    <td className="py-3 px-4">
                      <input type="text" value={item.imei || ''} onChange={(e) => updateItem(item.id, 'imei', e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="IMEI Number" />
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-20 bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" />
                      <select value={item.unit || 'Pcs'} onChange={(e) => updateItem(item.id, 'unit', e.target.value)} className="w-24 bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-2 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer">
                        {!isMobileShop && <option value="Kg">Kg</option>}
                        {!isMobileShop && <option value="Gms">Gms</option>}
                        <option value="Pcs">Pcs</option>
                        <option value="Box">Box</option>
                        {!isMobileShop && <option value="Ltr">Ltr</option>}
                        {!isMobileShop && <option value="Mtr">Mtr</option>}
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input type="number" min="0" value={item.rate} onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" />
                  </td>
                  <td className="py-3 px-4">
                    <input type="number" min="0" value={item.discount} onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" />
                  </td>
                  <td className="py-3 px-4">
                    <select value={item.gst} onChange={(e) => updateItem(item.id, 'gst', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer">
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="py-2 text-zinc-100 font-mono">
                      {isTaxInclusive 
                        ? (((item.qty * item.rate) - ((item.qty * item.rate) * (item.discount / 100))) / (1 + (item.gst / 100))).toFixed(2)
                        : (((item.qty * item.rate) - ((item.qty * item.rate) * (item.discount / 100)))).toFixed(2)
                      }
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button onClick={() => removeItem(item.id)} className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors mt-0.5" title="Remove Item">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addItem} className="mt-6 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors bg-indigo-500/10 px-4 py-2 rounded-lg hover:bg-indigo-500/20">
          <Plus size={16} /> Add New Row
        </button>
      </div>

        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Additional Charges & Logistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Courier / Transport Name</label>
              <input type="text" value={transportName} onChange={(e) => setTransportName(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all" placeholder="e.g. BlueDart, DTDC" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Vehicle / LR Number</label>
              <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="LR or Vehicle No." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Freight Charges (₹)</label>
              <input type="number" value={freightCharges || ''} onChange={(e) => setFreightCharges(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
            </div>
            {!isSales && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Handling Charges (₹)</label>
                  <input type="number" value={handlingCharges || ''} onChange={(e) => setHandlingCharges(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Labor Charges (₹)</label>
                  <input type="number" value={laborCharges || ''} onChange={(e) => setLaborCharges(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0.00" />
                </div>
              </>
            )}
          </div>
        </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="w-full md:w-1/2 space-y-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Terms & Conditions</label>
            <textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none text-sm" placeholder="Return policies, interest on late payments..."></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes for Internal Use</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none text-sm" placeholder="Internal notes..."></textarea>
          </div>
          <div className="pt-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Attachments (Scan / PDF)</label>
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${hasAttachment ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-700 hover:border-indigo-500/30 bg-zinc-950/50'}`} onClick={() => setHasAttachment(!hasAttachment)}>
              {hasAttachment ? (
                <div className="flex items-center justify-center gap-2 text-indigo-400">
                  <span className="text-sm font-medium">invoice_scan.pdf attached</span>
                  <button className="text-xs text-zinc-500 hover:text-rose-400 ml-4">Remove</button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <Plus size={24} className="mb-1" />
                  <span className="text-sm">Click to upload physical bill or scan</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 lg:max-w-md bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 space-y-4 backdrop-blur-xl ml-auto">
          <div className="flex justify-between items-center text-zinc-400 text-sm">
            <span>Subtotal</span>
            <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {totals.subtotal.toFixed(2)}</span>
          </div>
          {(!gstin || gstin.startsWith(COMPANY_STATE_CODE)) ? (
            <>
              <div className="flex justify-between items-center text-zinc-400 text-sm">
                <span>CGST</span>
                <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {totals.cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 text-sm">
                <span>SGST</span>
                <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {totals.sgst.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-zinc-400 text-sm">
              <span>IGST</span>
              <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {totals.igst.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-zinc-400 text-sm">
            <span>Freight Charges</span>
            <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {freightCharges.toFixed(2)}</span>
          </div>
          {!isSales && (handlingCharges > 0 || laborCharges > 0) && (
            <div className="flex justify-between items-center text-zinc-400 text-sm">
              <span>Landing Charges (Handling/Labor)</span>
              <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {(handlingCharges + laborCharges).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-zinc-400 text-sm">
            <span>Flat Discount</span>
            <div className="flex items-center gap-2 max-w-[120px]">
              <span className="text-zinc-500">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'}</span>
              <input type="number" value={flatDiscount || ''} onChange={(e) => setFlatDiscount(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0" />
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
            <span className="font-semibold text-zinc-100">Current {isSales ? 'Invoice' : 'Landing'} Total</span>
            <span className="font-mono text-xl font-bold text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {totals.invoiceTotal.toFixed(2)}</span>
          </div>
          
          <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-zinc-400 text-sm">
            <span>Previous Balance</span>
            <span className="font-mono text-zinc-100">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {previousBalance.toFixed(2)}</span>
          </div>
          {!isSales && (
            <div className="flex justify-between items-center text-zinc-400 text-sm">
              <span>Amount Paid Upfront</span>
              <div className="flex items-center gap-2 max-w-[120px]">
                <span className="text-zinc-500">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'}</span>
                <input type="number" value={amountPaidUpfront || ''} onChange={(e) => setAmountPaidUpfront(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950/50 border border-zinc-700/50 rounded px-2 py-1 text-zinc-100 text-right text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono" placeholder="0" />
              </div>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-zinc-100">{!isSales ? 'Accounts Payable' : 'Total Due Amount'}</span>
            <span className="font-mono text-2xl font-bold text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]">{currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'} {(!isSales ? totals.balanceDue : totals.totalDue).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-zinc-800">
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-emerald-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-emerald-500/30 px-3 py-2 rounded-lg transition-colors" onClick={() => window.open(`https://wa.me/${partyMobile}?text=Here is your ${isSales ? 'Sales Invoice' : 'Bill'} ${invoiceNumber} for amount ₹${totals.invoiceTotal.toFixed(2)}.`, '_blank')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-blue-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-blue-500/30 px-3 py-2 rounded-lg transition-colors" onClick={() => window.open(`sms:${partyMobile || ''}?body=Here is your ${isSales ? 'Sales Invoice' : 'Bill'} ${invoiceNumber} for amount ₹${totals.invoiceTotal.toFixed(2)}.`, '_blank')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            SMS
          </button>
          <div className="w-px h-8 bg-zinc-800 mx-1 hidden sm:block"></div>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-indigo-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-indigo-500/30 px-3 py-2 rounded-lg transition-colors" title="Print A4 Size" onClick={() => handlePrint('A4')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            A4
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-indigo-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-indigo-500/30 px-3 py-2 rounded-lg transition-colors" title="Print A5 Size" onClick={() => handlePrint('A5')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            A5
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-indigo-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-indigo-500/30 px-3 py-2 rounded-lg transition-colors" title="Print Thermal Size" onClick={() => handlePrint('Thermal')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Thermal
          </button>
          <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-indigo-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-indigo-500/30 px-3 py-2 rounded-lg transition-colors" title="Thermal 3-inch receipt" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2z"></path><path d="M16 8h-6"></path><path d="M16 12h-6"></path><path d="M16 16h-6"></path></svg>
            Thermal
          </button>
          {!isSales && (
            <button className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-emerald-400 bg-zinc-900/60 border border-zinc-700/50 hover:border-emerald-500/30 px-3 py-2 rounded-lg transition-colors" title="Print Barcode Stickers" onClick={() => window.print()}>
              <Barcode size={16} />
              Print Barcodes
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-700">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">
            <Save size={18} /> Save {isSales ? 'Sales' : 'Purchase'} Invoice
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-transparent print:static print:p-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl print:bg-transparent print:border-none print:shadow-none print:max-w-none">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 print:hidden">
              <h3 className="font-semibold text-zinc-100">Print Preview ({printPaperSize})</h3>
              <div className="flex items-center gap-3">
                <button onClick={() => handlePrint('A4')} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-indigo-600 rounded-lg text-zinc-200 transition-colors">A4</button>
                <button onClick={() => handlePrint('A5')} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-indigo-600 rounded-lg text-zinc-200 transition-colors">A5</button>
                <button onClick={() => handlePrint('Thermal')} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-indigo-600 rounded-lg text-zinc-200 transition-colors">Thermal</button>
                <div className="w-px h-4 bg-zinc-700"></div>
                <button onClick={() => { setShowPreview(false); onBack(); }} className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            </div>
            
            <div className="p-8 bg-white text-black overflow-y-auto max-h-[70vh] flex flex-col items-center print:max-h-none print:overflow-visible print:p-0" id="print-area">
              <div className="w-full" style={{ maxWidth: printPaperSize === 'Thermal' ? '80mm' : printPaperSize === 'A5' ? '148mm' : '210mm' }}>
                <div className="text-center border-b pb-4 mb-4">
                  <h2 className="text-2xl font-bold">{isSales ? 'TAX INVOICE' : 'PURCHASE BILL'}</h2>
                  <p className="text-sm mt-1">{invoiceNumber} | {invoiceDate}</p>
                </div>
                
                <div className="flex justify-between text-sm mb-6">
                  <div>
                    <p className="font-semibold text-gray-500 text-xs uppercase mb-1">Billed To</p>
                    <p className="font-bold">{partyName || 'Cash Sale'}</p>
                    {gstin && <p>GSTIN: {gstin}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-500 text-xs uppercase mb-1">Total Amount</p>
                    <p className="font-bold text-xl">₹{totals.invoiceTotal.toFixed(2)}</p>
                  </div>
                </div>
                
                <table className="w-full text-left text-sm mb-6 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-2">Item</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Rate</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(i => i.item).map(item => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-2">{item.item}</td>
                        <td className="py-2 text-right">{item.qty} {item.unit}</td>
                        <td className="py-2 text-right">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2 text-right">₹{(item.qty * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="flex justify-end text-sm">
                  <div className="w-48 space-y-2">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span> <span>₹{totals.subtotal.toFixed(2)}</span></div>
                    {totals.totalTax > 0 && <div className="flex justify-between"><span className="text-gray-600">Tax</span> <span>₹{totals.totalTax.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-base pt-2 border-t border-black">
                      <span>Total</span> <span>₹{totals.invoiceTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
                  <p>Powered by Mizan Bill | Tech Partner: Parbadiya Infotech</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
