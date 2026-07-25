const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

// We need to add getDocsFromCache to the imports from firebase/firestore
content = content.replace(/getDocFromCache,/, 'getDocFromCache, getDocsFromCache,');

// Helper to update a function to use getDocsFromCache
function patchFunctionToOfflineFirst(funcName) {
  const regex = new RegExp(`(export const ${funcName} = async \\([^)]+\\) => {)([\\s\\S]*?)(^};)`, 'm');
  content = content.replace(regex, (match, p1, p2, p3) => {
    // Remove the old LRU cache check for this function
    let body = p2.replace(/const cacheKey = [^;]+;\s*const cached = getFromCache\(cacheKey\);\s*if \(cached\) return cached;/, '');
    
    // Replace the getDocs call with a custom offline-first pattern
    body = body.replace(/const querySnapshot = await getDocs\(q\);/, `
    let querySnapshot;
    try {
      querySnapshot = await getDocsFromCache(q);
      if (querySnapshot.empty) {
        startSync();
        querySnapshot = await getDocs(q);
        endSync();
      } else {
        // Background sync
        startSync();
        getDocs(q).then(snap => {
           // We could cache it, but firestore does it automatically
        }).finally(endSync);
      }
    } catch (e) {
      startSync();
      querySnapshot = await getDocs(q);
      endSync();
    }
    `);
    return p1 + body + p3;
  });
}

['getProducts', 'getContacts', 'getSalesInvoices', 'getPurchaseInvoices', 'getSupplierPayments', 'getCustomerPayments', 'getShopExpenses', 'getStockWastages', 'getDailyCashStates'].forEach(patchFunctionToOfflineFirst);

fs.writeFileSync('src/services/FirebaseService.ts', content);
