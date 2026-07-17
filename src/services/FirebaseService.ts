import { db } from '../lib/firebase';
import { productMapper, invoiceMapper, expenseMapper, contactMapper } from './Mappers';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromCache, 
  deleteDoc, 
  writeBatch,
  limit,
  Timestamp,
  enableNetwork,
  waitForPendingWrites,
  increment
} from 'firebase/firestore';
import { getPlatformMode } from '../utils/platform';
import { SyncService } from './SyncService';

const PLATFORM_MODE = getPlatformMode();

/**
 * Ensures data integrity based on platform mode.
 * For Mobile: Checks connectivity and waits for online confirmation.
 * For PC: Operates normally (Firestore handles background sync).
 */
const prepareStorageAction = async () => {
  if (PLATFORM_MODE === 'MOBILE_DIRECT_ONLINE') {
    if (!navigator.onLine) {
      throw new Error('MOBILE_DIRECT_ONLINE: Action blocked. Internet connection required for mobile operations.');
    }
    // For mobile, we want to ensure we are actually connected to the server
    await enableNetwork(db);
    SyncService.updateSyncTimestamp();
  }
};

async function writeToLocalFile(collectionName: string, id: string, data: any) {
  const handle = (window as any).mizanLocalDirHandle;
  if (!handle) return;
  try {
    const fileName = `${collectionName}_${id}.json`;
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    console.log(`Local backup written: ${fileName}`);
  } catch (err) {
    console.error('Failed to write local backup', err);
  }
}

/**
 * Handles post-action synchronization.
 * For PC: Triggers a silent check for pending writes and writes to local disk if configured.
 */
const finalizeStorageAction = async (collectionName: string, id: string, data: any) => {
  // Dispatch a custom event to update the UI indicator for IndexedDB activity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('indexeddb-write'));
  }

  if (navigator.onLine) {
    SyncService.updateSyncTimestamp();
  }

  if (PLATFORM_MODE === 'PC_LOCAL_FIRST') {
    // Write to local directory if configured
    await writeToLocalFile(collectionName, id, data);
    
    // For PC, we just wait for the background sync to finish if it's currently online
    // but we don't block the UI for too long.
    if (navigator.onLine) {
      waitForPendingWrites(db).catch(err => {
        console.warn('Background sync encountered a delay:', err);
      });
    }
  }
};

export const subscribeToSalesInvoices = (userId: string, callback: (invoices: any[]) => void) => {
  const q = query(collection(db, 'sales_invoices'), where('userId', '==', userId), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => invoiceMapper.toDomain({ id: doc.id, ...doc.data(), type: 'Sales' })));
  }, (err) => {
    console.warn('Real-time sync error (Sales):', err);
  });
};

export const subscribeToQuotations = (userId: string, callback: (quotations: any[]) => void) => {
  const q = query(collection(db, 'quotations'), where('userId', '==', userId), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => {
    console.warn('Real-time sync error (Quotations):', err);
  });
};

export const subscribeToPurchaseInvoices = (userId: string, callback: (invoices: any[]) => void) => {
  const q = query(collection(db, 'purchase_invoices'), where('userId', '==', userId), orderBy('created_at', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => invoiceMapper.toDomain({ id: doc.id, ...doc.data(), type: 'Purchase' })));
  }, (err) => {
    console.warn('Real-time sync error (Purchases):', err);
  });
};

export const subscribeToProducts = (userId: string, callback: (products: any[]) => void) => {
  const q = query(collection(db, 'products'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => productMapper.toDomain({ id: doc.id, ...doc.data() })));
  }, (err) => {
    console.warn('Real-time sync error (Products):', err);
  });
};

export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, 'users', userId);
  
  // Try cache first for instant response
  try {
    const cachedSnap = await getDocFromCache(docRef);
    if (cachedSnap.exists()) {
      // Return cached immediately, then sync in background (Firebase does this automatically if we call getDoc later)
      return cachedSnap.data();
    }
  } catch (e) {
    // Cache miss or error, proceed to network
  }

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Default for new users is Owner, but parbadiyaakbar@gmail.com is Admin
    const isAdmin = userId === 'XQY6N8NfG8fW9rK1vW7S3o1Jp6k2' || // Assuming UID or check by email if possible
                    // Better to check by email if we had it here, but we pass userId. 
                    // I'll add an email check in subscribeToAuth and login instead.
                    // However, we can use the role mapping in AuthService which is more reliable.
                    false;
    
    // We'll trust the caller (AuthService) to handle the initial role mapping.
    const defaultProfile = { role: 'Owner', shopId: userId };
    try {
      await setDoc(docRef, defaultProfile);
    } catch (sErr) {
      console.warn('Could not save default profile (offline?), continuing...');
    }
    return defaultProfile;
  } catch (err: any) {
    const isOffline = err.code === 'unavailable' || !navigator.onLine || (err.message && err.message.toLowerCase().includes('offline'));
    if (isOffline) {
      console.warn('Network unavailable, profile not in cache. Using defaults.');
    } else {
      console.error('Failed to fetch user profile:', err);
    }
    return { role: 'Owner', shopId: userId };
  }
};

export const saveUserProfile = async (userId: string, profile: any) => {
  try {
    await setDoc(doc(db, 'users', userId), profile, { merge: true });
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }
};

/**
 * ADMIN SERVICE METHODS
 */

export const subscribeToBetaUsers = (callback: (users: any[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('email'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => {
    console.error('Admin: Failed to subscribe to users:', err);
  });
};

export const updateBetaUserStatus = async (userId: string, status: string, trialExpiryDate?: string) => {
  const updates: any = { status };
  if (trialExpiryDate) {
    updates.trialExpiryDate = trialExpiryDate;
  }
  await setDoc(doc(db, 'users', userId), updates, { merge: true });
};

export const pushAdminConfig = async (config: any) => {
  await setDoc(doc(db, 'admin_configs', 'global'), {
    ...config,
    updated_at: new Date().toISOString()
  });
};

export const getAdminConfig = async () => {
  const snap = await getDoc(doc(db, 'admin_configs', 'global'));
  return snap.exists() ? snap.data() : null;
};

export const subscribeToAdminConfig = (callback: (config: any) => void) => {
  return onSnapshot(doc(db, 'admin_configs', 'global'), (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    }
  });
};

export const subscribeToBugReports = (callback: (reports: any[]) => void) => {
  const q = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => {
    console.error('Admin: Failed to subscribe to bug reports:', err);
  });
};

export const getNextInvoiceNumber = async (shopId: string, type: 'Sales' | 'Purchase' | 'Quotation') => {
  const settingsRef = doc(db, 'business_settings', shopId);
  const field = type === 'Sales' ? 'nextSalesNo' : type === 'Purchase' ? 'nextPurchaseNo' : 'nextQuotationNo';
  
  try {
    const docSnap = await getDoc(settingsRef);
    let nextNo = 1;
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      nextNo = data[field] || 1;
    }
    
    // Increment for next time
    await setDoc(settingsRef, { [field]: nextNo + 1 }, { merge: true });
    return nextNo;
  } catch (err) {
    console.error('Failed to get next invoice number:', err);
    return Date.now(); // Fallback to timestamp if counter fails
  }
};

export const logActivity = async (userId: string, shopId: string, action: string, details: any) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId,
      shopId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Silent fail for logs to prevent issues if logging itself fails
  }
};

export const logError = async (userId: string | undefined, shopId: string | undefined, error: string, stack?: string) => {
  const errorData = {
    userId: userId || 'anonymous',
    shopId: shopId || 'unknown',
    error,
    stack: stack || '',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, 'error_logs'), errorData);
  } catch (err) {
    console.error('Emergency error logging failed:', err);
  }

  // Backup log to localStorage
  try {
    const logs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
    logs.push(errorData);
    localStorage.setItem('app_error_logs', JSON.stringify(logs.slice(-20)));
  } catch (e) {
    // Ignore
  }
};

export const saveSalesInvoice = async (userId: string, shopId: string, invoice: any) => {
  await prepareStorageAction();
  try {
    const invoiceNumber = await getNextInvoiceNumber(shopId, 'Sales');
    const docRef = await addDoc(collection(db, 'sales_invoices'), {
      ...invoice,
      userId: shopId, // Store under shop owner ID for shared access
      createdBy: userId,
      invoiceNumber,
      created_at: invoice.created_at || new Date().toISOString()
    });
    
    await logActivity(userId, shopId, 'CREATE_SALES_INVOICE', { 
      invoiceNumber, 
      party: invoice.party_name,
      amount: invoice.totals?.invoiceTotal 
    });
    
    await finalizeStorageAction('sales_invoices', docRef.id, { ...invoice, invoiceNumber });
    return { id: docRef.id, invoiceNumber };
  } catch (err: any) {
    logError(userId, shopId, err.message, err.stack);
    console.error('Failed to save sales invoice:', err);
    throw err;
  }
};

export const savePurchaseInvoice = async (userId: string, shopId: string, invoice: any) => {
  await prepareStorageAction();
  try {
    const invoiceNumber = await getNextInvoiceNumber(shopId, 'Purchase');
    const docRef = await addDoc(collection(db, 'purchase_invoices'), {
      ...invoice,
      userId: shopId,
      createdBy: userId,
      invoiceNumber,
      created_at: invoice.created_at || new Date().toISOString()
    });
    
    await logActivity(userId, shopId, 'CREATE_PURCHASE_BILL', { 
      invoiceNumber, 
      party: invoice.party_name,
      amount: invoice.totals?.invoiceTotal 
    });
    
    await finalizeStorageAction('purchase_invoices', docRef.id, { ...invoice, invoiceNumber });
    return { id: docRef.id, invoiceNumber };
  } catch (err: any) {
    logError(userId, shopId, err.message, err.stack);
    console.error('Failed to save purchase invoice:', err);
    throw err;
  }
};

export const saveQuotation = async (userId: string, shopId: string, quotation: any) => {
  await prepareStorageAction();
  try {
    const invoiceNumber = await getNextInvoiceNumber(shopId, 'Quotation');
    const docRef = await addDoc(collection(db, 'quotations'), {
      ...quotation,
      userId: shopId,
      createdBy: userId,
      invoiceNumber,
      created_at: quotation.created_at || new Date().toISOString()
    });
    
    await logActivity(userId, shopId, 'CREATE_QUOTATION', { 
      invoiceNumber, 
      party: quotation.party_name,
      amount: quotation.totals?.invoiceTotal 
    });
    
    await finalizeStorageAction('quotations', docRef.id, { ...quotation, invoiceNumber });
    return { id: docRef.id, invoiceNumber };
  } catch (err: any) {
    logError(userId, shopId, err.message, err.stack);
    console.error('Failed to save quotation:', err);
    throw err;
  }
};

export const getSalesInvoices = async (userId: string, limitCount: number = 50) => {
  try {
    const q = query(
      collection(db, 'sales_invoices'), 
      where('userId', '==', userId), 
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch sales invoices. Client might be offline.', err);
    return [];
  }
};

export const getPurchaseInvoices = async (userId: string, limitCount: number = 50) => {
  try {
    const q = query(
      collection(db, 'purchase_invoices'), 
      where('userId', '==', userId), 
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch purchase invoices. Client might be offline.', err);
    return [];
  }
};



export const saveBusinessSettings = async (userId: string, settings: any) => {
  await prepareStorageAction();
  try {
    await setDoc(doc(db, 'business_settings', userId), settings, { merge: true });
    cachedBusinessSettings = { ...cachedBusinessSettings, ...settings };
    settingsUserId = userId;
    await finalizeStorageAction('business_settings', userId, settings);
  } catch (err) {
    console.error('Failed to save business settings:', err);
  }
};


let cachedBusinessSettings: any = null;
let settingsUserId: string | null = null;

export const getGlobalConfig = async () => {
  try {
    const docRef = doc(db, 'system_settings', 'global_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return {
      trialDays: 15,
      upiId: '',
      qrCodeUrl: '',
      razorpayKeyId: '',
      razorpayKeySecret: ''
    };
  } catch (err) {
    console.warn('Failed to fetch global config, using defaults:', err);
    return {
      trialDays: 15,
      upiId: '',
      qrCodeUrl: '',
      razorpayKeyId: '',
      razorpayKeySecret: ''
    };
  }
};

/**
 * DATA GOVERNANCE & SANITATION
 */

// Global Wipeout (Master Reset) - USE WITH EXTREME CAUTION
export const masterResetSystem = async () => {
  const collections = [
    'sales_invoices', 'purchase_invoices', 'customer_payments', 'supplier_payments',
    'shop_expenses', 'stock_wastages', 'products', 'contacts', 'activity_logs',
    'security_alerts', 'business_settings', 'users'
  ];

  const batch = writeBatch(db);
  for (const coll of collections) {
    const snap = await getDocs(collection(db, coll));
    snap.docs.forEach(d => {
      // Prevent deleting the Super Admin user
      if (coll === 'users' && d.data().email === 'parbadiyaakbar@gmail.com') return;
      batch.delete(d.ref);
    });
  }
  await batch.commit();
};

// Shop Demo Reset (Purge transactions only)
export const resetShopDemoData = async (shopId: string) => {
  const transactionCollections = [
    'sales_invoices', 'purchase_invoices', 'customer_payments', 
    'supplier_payments', 'shop_expenses', 'stock_wastages', 'activity_logs'
  ];

  const batch = writeBatch(db);
  for (const coll of transactionCollections) {
    const q = query(collection(db, coll), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    snap.docs.forEach(d => batch.delete(d.ref));
  }
  
  // Reset shop balance or stats if they exist in business_settings
  const settingsRef = doc(db, 'business_settings', shopId);
  await setDoc(settingsRef, { 
    lastResetAt: new Date().toISOString(),
    demoResetCount: increment(1) 
  }, { merge: true });

  await batch.commit();
};

// Permanent Shop Deletion (Cascading)
export const permanentlyDeleteShop = async (shopId: string) => {
  const allCollections = [
    'sales_invoices', 'purchase_invoices', 'customer_payments', 'supplier_payments',
    'shop_expenses', 'stock_wastages', 'products', 'contacts', 'activity_logs', 'business_settings'
  ];

  const batch = writeBatch(db);
  
  // Delete all shop-related data
  for (const coll of allCollections) {
    const q = query(collection(db, coll), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    snap.docs.forEach(d => batch.delete(d.ref));
  }

  // Delete associated users
  const userQuery = query(collection(db, 'users'), where('shopId', '==', shopId));
  const userSnap = await getDocs(userQuery);
  userSnap.docs.forEach(d => batch.delete(d.ref));

  await batch.commit();
};

export const getCachedBusinessSettings = () => cachedBusinessSettings;

export const getBusinessSettings = async (userId: string, forceRefresh = false) => {
  if (!forceRefresh && cachedBusinessSettings && settingsUserId === userId) {
    return cachedBusinessSettings;
  }

  const docRef = doc(db, 'business_settings', userId);

  // Aggressive Cache Check
  try {
    const cachedSnap = await getDocFromCache(docRef);
    if (cachedSnap.exists()) {
      cachedBusinessSettings = cachedSnap.data();
      settingsUserId = userId;
      return cachedBusinessSettings;
    }
  } catch (e) {
    // Cache miss
  }

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cachedBusinessSettings = docSnap.data();
      settingsUserId = userId;
      return cachedBusinessSettings;
    }
    return null;
  } catch (err: any) {
    console.warn('Failed to fetch business settings from network. Client might be offline.', err);
    return null;
  }
};

export const saveDraft = async (userId: string, draftType: string, draftData: any) => {
  try {
    await setDoc(doc(db, 'drafts', `${userId}_${draftType}`), draftData, { merge: true });
  } catch (err) {
    console.warn('Failed to save draft.', err);
  }
};

export const getDraft = async (userId: string, draftType: string) => {
  try {
    const docRef = doc(db, 'drafts', `${userId}_${draftType}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    console.warn('Failed to fetch draft. Client might be offline.', err);
    return null;
  }
};

export const clearDraft = async (userId: string, draftType: string) => {
  try {
    await deleteDoc(doc(db, 'drafts', `${userId}_${draftType}`));
  } catch (err) {
    console.warn('Failed to clear draft.', err);
  }
};

export const saveSupplierPayment = async (userId: string, payment: any) => {
  await prepareStorageAction();
  const docRef = await addDoc(collection(db, 'supplier_payments'), {
    ...payment,
    userId,
    created_at: payment.created_at || new Date().toISOString()
  });
  await finalizeStorageAction('supplier_payments', docRef.id, payment);
  return docRef.id;
};

export const getSupplierPayments = async (userId: string) => {
  try {
    const q = query(collection(db, 'supplier_payments'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch supplier payments.', err);
    return [];
  }
};

export const saveCustomerPayment = async (userId: string, payment: any) => {
  await prepareStorageAction();
  const docRef = await addDoc(collection(db, 'customer_payments'), {
    ...payment,
    userId,
    created_at: payment.created_at || new Date().toISOString()
  });
  await finalizeStorageAction('customer_payments', docRef.id, payment);
  return docRef.id;
};

export const getCustomerPayments = async (userId: string) => {
  try {
    const q = query(collection(db, 'customer_payments'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch customer payments.', err);
    return [];
  }
};

export const saveShopExpense = async (userId: string, expense: any) => {
  await prepareStorageAction();
  const persistenceData = expenseMapper.toPersistence(expense);
  const docRef = await addDoc(collection(db, 'shop_expenses'), {
    ...persistenceData,
    userId
  });
  await finalizeStorageAction('shop_expenses', docRef.id, persistenceData);
  return docRef.id;
};

export const getShopExpenses = async (userId: string) => {
  try {
    const q = query(collection(db, 'shop_expenses'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => expenseMapper.toDomain({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch shop expenses.', err);
    return [];
  }
};

export const saveStockWastage = async (userId: string, wastage: any) => {
  await prepareStorageAction();
  const docRef = await addDoc(collection(db, 'stock_wastages'), {
    ...wastage,
    userId,
    created_at: wastage.created_at || new Date().toISOString()
  });
  await finalizeStorageAction('stock_wastages', docRef.id, wastage);
  return docRef.id;
};

export const getStockWastages = async (userId: string) => {
  try {
    const q = query(collection(db, 'stock_wastages'), where('userId', '==', userId), orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch stock wastages.', err);
    return [];
  }
};

export const saveDailyCashState = async (userId: string, date: string, state: any) => {
  const docRef = doc(db, `daily_cash_states`, `${userId}_${date}`);
  await setDoc(docRef, { userId, date, ...state, updated_at: new Date().toISOString() }, { merge: true });
};

export const getDailyCashStates = async (userId: string) => {
  try {
    const q = query(collection(db, 'daily_cash_states'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch daily cash states.', err);
    return [];
  }
};

export const saveProduct = async (userId: string, shopId: string, product: any) => {
  await prepareStorageAction();
  try {
    if (product.id) {
      const docRef = doc(db, 'products', product.id);
      await setDoc(docRef, { ...product, updated_at: new Date().toISOString() }, { merge: true });
      await logActivity(userId, shopId, 'UPDATE_PRODUCT', { productId: product.id, name: product.name, stock: product.currentStock });
      await finalizeStorageAction('products', product.id, product);
      return product.id;
    } else {
      const docRef = doc(collection(db, 'products'));
      await setDoc(docRef, {
        id: docRef.id,
        userId: shopId,
        createdBy: userId,
        ...product,
        created_at: new Date().toISOString()
      });
      await logActivity(userId, shopId, 'CREATE_PRODUCT', { productId: docRef.id, name: product.name, stock: product.currentStock });
      await finalizeStorageAction('products', docRef.id, product);
      return docRef.id;
    }
  } catch (err: any) {
    logError(userId, shopId, err.message, err.stack);
    throw err;
  }
};

export const getProducts = async (userId: string, limitCount: number = 100) => {
  try {
    const q = query(
      collection(db, 'products'), 
      where('userId', '==', userId),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => productMapper.toDomain({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch products.', err);
    return [];
  }
};

export const saveContact = async (userId: string, contact: any) => {
  await prepareStorageAction();
  const persistenceData = contactMapper.toPersistence(contact);
  const q = query(
    collection(db, 'contacts'),
    where('userId', '==', userId),
    where('phone', '==', contact.phone),
    where('type', '==', contact.type)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const existingDoc = querySnapshot.docs[0];
    const docRef = doc(db, 'contacts', existingDoc.id);
    await setDoc(docRef, { ...existingDoc.data(), ...persistenceData }, { merge: true });
    await finalizeStorageAction('contacts', existingDoc.id, persistenceData);
    return existingDoc.id;
  } else {
    const docRef = doc(collection(db, 'contacts'));
    await setDoc(docRef, {
      id: docRef.id,
      userId,
      ...persistenceData
    });
    await finalizeStorageAction('contacts', docRef.id, persistenceData);
    return docRef.id;
  }
};

export const getContacts = async (userId: string) => {
  try {
    const q = query(collection(db, 'contacts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => contactMapper.toDomain({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Failed to fetch contacts.', err);
    return [];
  }
};

export const exportAllData = async (userId: string) => {
  const [sales, purchases, sPayments, cPayments, expenses, wastages, products, contacts, settings] = await Promise.all([
    getSalesInvoices(userId),
    getPurchaseInvoices(userId),
    getSupplierPayments(userId),
    getCustomerPayments(userId),
    getShopExpenses(userId),
    getStockWastages(userId),
    getProducts(userId),
    getContacts(userId),
    getBusinessSettings(userId)
  ]);
  return {
    sales, purchases, sPayments, cPayments, expenses, wastages, products, contacts, settings,
    timestamp: new Date().toISOString()
  };
};



export const restoreAllData = async (userId: string, data: any) => {
  // A simple restore: just add all items if they don't already exist.
  // To keep it simple and avoid duplicates, we can't easily clear the whole collection from the client side without multiple queries.
  // Since this is a backup restore, we'll write all items with their original IDs (doc(db, col, id)).
  
  const restoreCollection = async (colName: string, items: any[]) => {
    if (!items || !items.length) return;
    const batch = writeBatch(db);
    let count = 0;
    for (const item of items) {
      const id = item.id;
      const ref = id ? doc(db, colName, id) : doc(collection(db, colName));
      const { id: _id, ...itemData } = item;
      batch.set(ref, { ...itemData, userId });
      count++;
      if (count === 490) {
        await batch.commit();
        count = 0;
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  };

  await Promise.all([
    restoreCollection('sales_invoices', data.sales || []),
    restoreCollection('purchase_invoices', data.purchases || []),
    restoreCollection('supplier_payments', data.sPayments || []),
    restoreCollection('customer_payments', data.cPayments || []),
    restoreCollection('shop_expenses', data.expenses || []),
    restoreCollection('stock_wastages', data.wastages || []),
    restoreCollection('products', data.products || []),
    restoreCollection('contacts', data.contacts || [])
  ]);
  
  if (data.settings) {
    await saveBusinessSettings(userId, data.settings);
  }
};
