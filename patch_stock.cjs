const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

const updateStockCode = `
export const updateProductStock = async (userId: string, shopId: string, productId: string, quantityChange: number) => {
  const docRef = doc(db, 'products', productId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    const newStock = (data.currentStock || 0) + quantityChange;
    await setDoc(docRef, { currentStock: newStock, updated_at: new Date().toISOString() }, { merge: true });
    await logActivity(userId, shopId, 'STOCK_UPDATE', { productId, newStock, change: quantityChange });
    await finalizeStorageAction('products', productId, { ...data, currentStock: newStock });
  }
};
`;

if (!content.includes('updateProductStock')) {
  content = content + '\n' + updateStockCode;
  fs.writeFileSync('src/services/FirebaseService.ts', content);
}
