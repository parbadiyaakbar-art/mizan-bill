const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

const updateFunctions = `
export const updateSalesInvoice = async (userId: string, shopId: string, invoiceId: string, updatedData: any) => {
  await prepareStorageAction();
  const docRef = doc(db, 'sales_invoices', invoiceId);
  const oldSnap = await getDoc(docRef);
  
  if (oldSnap.exists()) {
    const oldData = oldSnap.data();
    // Reverse old stock
    for (const item of oldData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, item.qty);
      else if (item.item) {
         // find product by name
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, item.qty);
      }
    }
  }

  // Deduct new stock
  for (const item of updatedData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, -item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, -item.qty);
      }
  }

  await setDoc(docRef, { ...updatedData, updated_at: new Date().toISOString() }, { merge: true });
  await logActivity(userId, shopId, 'UPDATE_SALES_INVOICE', { invoiceId, party: updatedData.party_name });
  
  // also need the invoiceNumber to be retained, let's keep oldData.invoiceNumber
  const finalData = { ...oldSnap.data(), ...updatedData };
  await finalizeStorageAction('sales_invoices', invoiceId, finalData);
};

export const deleteSalesInvoice = async (userId: string, shopId: string, invoiceId: string) => {
  await prepareStorageAction();
  const docRef = doc(db, 'sales_invoices', invoiceId);
  const oldSnap = await getDoc(docRef);
  if (oldSnap.exists()) {
    const oldData = oldSnap.data();
    for (const item of oldData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, item.qty);
      }
    }
  }
  await deleteDoc(docRef);
  await logActivity(userId, shopId, 'DELETE_SALES_INVOICE', { invoiceId });
  
  // Remove from persistence
  const data = await getPersistenceData();
  const filtered = (data.sales_invoices || []).filter((i: any) => i.id !== invoiceId);
  await setPersistenceData({ ...data, sales_invoices: filtered });
};

export const updatePurchaseInvoice = async (userId: string, shopId: string, invoiceId: string, updatedData: any) => {
  await prepareStorageAction();
  const docRef = doc(db, 'purchase_invoices', invoiceId);
  const oldSnap = await getDoc(docRef);
  
  if (oldSnap.exists()) {
    const oldData = oldSnap.data();
    for (const item of oldData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, -item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, -item.qty);
      }
    }
  }

  for (const item of updatedData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, item.qty);
      }
  }

  await setDoc(docRef, { ...updatedData, updated_at: new Date().toISOString() }, { merge: true });
  await logActivity(userId, shopId, 'UPDATE_PURCHASE_BILL', { invoiceId, party: updatedData.party_name });
  
  const finalData = { ...oldSnap.data(), ...updatedData };
  await finalizeStorageAction('purchase_invoices', invoiceId, finalData);
};

export const deletePurchaseInvoice = async (userId: string, shopId: string, invoiceId: string) => {
  await prepareStorageAction();
  const docRef = doc(db, 'purchase_invoices', invoiceId);
  const oldSnap = await getDoc(docRef);
  if (oldSnap.exists()) {
    const oldData = oldSnap.data();
    for (const item of oldData.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, -item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, -item.qty);
      }
    }
  }
  await deleteDoc(docRef);
  await logActivity(userId, shopId, 'DELETE_PURCHASE_BILL', { invoiceId });
  
  const data = await getPersistenceData();
  const filtered = (data.purchase_invoices || []).filter((i: any) => i.id !== invoiceId);
  await setPersistenceData({ ...data, purchase_invoices: filtered });
};

export const updateQuotation = async (userId: string, shopId: string, invoiceId: string, updatedData: any) => {
  await prepareStorageAction();
  const docRef = doc(db, 'quotations', invoiceId);
  const oldSnap = await getDoc(docRef);
  await setDoc(docRef, { ...updatedData, updated_at: new Date().toISOString() }, { merge: true });
  await logActivity(userId, shopId, 'UPDATE_QUOTATION', { invoiceId, party: updatedData.party_name });
  
  const finalData = { ...(oldSnap.exists() ? oldSnap.data() : {}), ...updatedData };
  await finalizeStorageAction('quotations', invoiceId, finalData);
};

export const deleteQuotation = async (userId: string, shopId: string, invoiceId: string) => {
  await prepareStorageAction();
  const docRef = doc(db, 'quotations', invoiceId);
  await deleteDoc(docRef);
  await logActivity(userId, shopId, 'DELETE_QUOTATION', { invoiceId });
  
  const data = await getPersistenceData();
  const filtered = (data.quotations || []).filter((i: any) => i.id !== invoiceId);
  await setPersistenceData({ ...data, quotations: filtered });
};
`;

if (!content.includes('updateSalesInvoice')) {
  content += '\n' + updateFunctions;
  
  // Also need to inject stock logic into create functions!
  content = content.replace(/await finalizeStorageAction\('sales_invoices', docRef\.id, \{ \.\.\.invoice, invoiceNumber \}\);/, 
    `await finalizeStorageAction('sales_invoices', docRef.id, { ...invoice, invoiceNumber });
    // Deduct stock
    for (const item of invoice.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, -item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, -item.qty);
      }
    }`);

  content = content.replace(/await finalizeStorageAction\('purchase_invoices', docRef\.id, \{ \.\.\.invoice, invoiceNumber \}\);/, 
    `await finalizeStorageAction('purchase_invoices', docRef.id, { ...invoice, invoiceNumber });
    // Add stock
    for (const item of invoice.items) {
      if (item.productId) await updateProductStock(userId, shopId, item.productId, item.qty);
      else if (item.item) {
         const prods = await getDocs(query(collection(db, 'products'), where('userId', '==', shopId)));
         const p = prods.docs.find(d => d.data().name === item.item);
         if (p) await updateProductStock(userId, shopId, p.id, item.qty);
      }
    }`);
    
  fs.writeFileSync('src/services/FirebaseService.ts', content);
}

