/// <reference types="vite/client" />
export interface User {
  id: string;
  email: string;
  role: 'Owner' | 'Staff' | 'Admin';
  shopId: string;
  user_metadata?: {
    full_name?: string;
  };
}

export type BetaUserStatus = 'Active' | 'Suspended' | 'Blocked';

export interface BetaUser {
  id: string;
  email: string;
  fullName?: string;
  status: BetaUserStatus;
  activationDate: string;
  trialExpiryDate: string;
  lastActive?: string;
  deviceInfo?: string;
}

export interface AdminConfig {
  latestVersion: string;
  updateMessage: string;
  criticalUpdate: boolean;
  notificationTitle: string;
  notificationBody: string;
}

export interface BugReport {
  id: string;
  userId: string;
  error: string;
  stack?: string;
  timestamp: string;
  deviceInfo: string;
  resolved: boolean;
}

export type View = 'landing' | 'login' | 'dashboard' | 'sales' | 'purchases' | 'quotations' | 'gst' | 'users' | 'inventory' | 'settings' | 'customer-payments' | 'supplier-payments' | 'daily-cash' | 'shop-expenses' | 'stock-wastage' | 'contacts' | 'shop-profile' | 'releases' | 'admin' | 'privacy-policy' | 'terms-of-service' | 'about';

// --- Database Schema Types ---

export type BusinessType = 
  | 'Grocery / Mini Mart (કરિયાણું અને નાના મોલ)'
  | 'Dairy & Bakery (ડેરી અને પાર્લર)'
  | 'Garments & Footwear (કપડાં અને રેડીમેડ)'
  | 'Electrical & Hardware (ઇલેક્ટ્રોનિક્સ અને હાર્ડવેર)'
  | 'Mobile & Accessories (મોબાઈલ અને એક્સેસરીઝ)'
  | 'Small Wholesale / FMCG Distributor (નાના હોલસેલ વેપારીઓ)'
  | '';

export interface ShopSettings {
  id: string; // Usually shop/user ID
  shopName: string;
  businessType?: BusinessType;
  gstin?: string;
  defaultInvoiceFormat: 'Tax Invoice' | 'Bill of Supply';
  printPaperSize: 'A4' | 'A5' | 'Thermal';
  currency: string;
  timezone: string;
  allowNegativeStock: boolean;
  nextSalesNo: number;
  nextPurchaseNo: number;
  nextQuotationNo: number;
}

export interface Party {
  id: string;
  type: 'Customer' | 'Supplier'; // party_type
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
  creditLimit: number; // credit_limit
  openingBalance: number; // opening_balance
  currentBalance: number;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  hsnCode?: string;
  category?: string; // Serves as Product Group
  brandCompany?: string;
  modelNumber?: string;
  serialImei?: string;
  expiryDate?: string;
  mfgDate?: string;
  unit?: string;
  size?: string;
  color?: string;
  bulkUnit?: string;
  piecesPerBulkUnit?: number;
  storageLocation?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockLimit?: number;
  gstRate: number;
  taxType?: 'Inclusive' | 'Exclusive';
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  type: 'Sales' | 'Purchase' | 'Quotation';
  partyId: string;
  date: string;
  dueDate?: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Udhaar'; // Payment Mode
  subtotal: number;
  totalTax: number;
  flatDiscount: number; // Discounts
  roundOff: number; // Round-Off
  freightCharges: number;
  totalAmount: number;
  amountPaid: number;
  status: 'Draft' | 'Paid' | 'Unpaid' | 'Partial' | 'Overdue';
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  itemName: string;
  qty: number;
  unit?: string;
  rate: number;
  discountPercent: number; // Discounts
  gstPercent: number;
  total: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Expense' | 'Customer Payment' | 'Supplier Payment' | 'Stock Wastage' | 'Opening Balance'; // unified log
  partyId?: string; // For payments
  expenseName?: string; // For shop expenses
  expenseCategory?: string; // e.g. Rent & Electricity, Fuel & Transportation
  itemId?: string; // For stock wastage
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card';
  notes?: string;
}
