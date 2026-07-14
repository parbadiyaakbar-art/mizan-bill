/**
 * Mappers for strict data serialization and deserialization.
 * This ensures data portability when migrating between Firestore and SQL/JSON systems.
 */

export const productMapper = {
  fromJson: (json: any) => productMapper.toDomain(json),
  toJson: (domain: any) => productMapper.toPersistence(domain),

  toDomain: (doc: any) => ({
    id: doc.id,
    name: doc.name || '',
    category: doc.category || '',
    brand: doc.brand || '',
    unit: doc.unit || 'PCS',
    purchasePrice: Number(doc.purchasePrice) || 0,
    salesPrice: Number(doc.salesPrice) || 0,
    mrp: Number(doc.mrp) || 0,
    currentStock: Number(doc.currentStock) || 0,
    minStock: Number(doc.minStock) || 0,
    gstRate: Number(doc.gstRate) || 0,
    taxType: doc.taxType || 'Exclusive',
    hsnCode: doc.hsnCode || '',
    sku: doc.sku || '',
    description: doc.description || '',
    imageUrl: doc.imageUrl || '', // Store as relative path
    lastUpdated: doc.updated_at || doc.created_at || new Date().toISOString(),
  }),
  
  toPersistence: (domain: any) => ({
    ...domain,
    updated_at: new Date().toISOString(),
  })
};

export const invoiceMapper = {
  fromJson: (json: any) => invoiceMapper.toDomain(json),
  toJson: (domain: any) => invoiceMapper.toPersistence(domain),

  toDomain: (doc: any) => ({
    id: doc.id,
    invoiceNumber: doc.invoiceNumber,
    date: doc.date,
    partyName: doc.party_name || '',
    partyGstin: doc.party_gstin || '',
    items: doc.items || [],
    totals: doc.totals || {},
    paymentMode: doc.paymentMode || 'Cash',
    type: doc.type,
    created_at: doc.created_at
  }),
  
  toPersistence: (domain: any) => ({
    ...domain,
    created_at: domain.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
};

export const expenseMapper = {
  toDomain: (doc: any) => ({
    id: doc.id,
    date: doc.date,
    category: doc.category,
    amount: Number(doc.amount) || 0,
    paymentMode: doc.paymentMode || 'Cash',
    notes: doc.notes || '',
    created_at: doc.created_at
  }),
  toPersistence: (domain: any) => ({
    ...domain,
    created_at: domain.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
};

export const contactMapper = {
  toDomain: (doc: any) => ({
    id: doc.id,
    name: doc.name || '',
    type: doc.type || 'Customer',
    phone: doc.phone || '',
    gstin: doc.gstin || '',
    address: doc.address || '',
    created_at: doc.created_at
  }),
  toPersistence: (domain: any) => ({
    ...domain,
    created_at: domain.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
};
