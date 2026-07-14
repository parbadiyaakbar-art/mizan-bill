import React, { useState, useEffect, useMemo } from 'react';
import * as db from '../services/FirebaseService';
import { Search, Plus, Package, Edit, Save, X, Filter, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product, BusinessType } from '../types';
import { compressImage, uploadFile, resolveStorageUrl } from '../services/StorageService';
import { TableSkeleton } from '../components/Skeleton';

export default function Inventory({ shopId, userId }: { shopId: string, userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');

  useEffect(() => {
    // Resolve relative paths for images whenever products list changes
    const resolveImages = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(products.map(async (p) => {
        if (p.imageUrl) {
          urls[p.id] = await resolveStorageUrl(p.imageUrl);
        }
      }));
      setResolvedImages(urls);
    };
    resolveImages();
  }, [products]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  
  // Wastage States
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [wastageProduct, setWastageProduct] = useState<Product | null>(null);
  const [wastageQty, setWastageQty] = useState<number>(0);
  const [wastageReason, setWastageReason] = useState<string>('Damaged');

  // View states
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [expiryFilter, setExpiryFilter] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let unsubscribe: () => void;
    
    // Fetch settings once
    db.getBusinessSettings(shopId).then(settings => {
      setBusinessType(settings?.businessType || '');
    });

    // Delay initialization to prioritize UI rendering
    const timer = setTimeout(() => {
      unsubscribe = db.subscribeToProducts(shopId, (prods) => {
        setProducts(prods as Product[]);
        setLoading(false);
      });
    }, 800);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [shopId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !shopId) return;

    try {
      setIsUploading(true);
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadFile(compressed, `shops/${shopId}/products/${fileName}`);
      setCurrentProduct({ ...currentProduct, imageUrl: url });
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const isElectronics = businessType === 'Electrical & Hardware (ઇલેક્ટ્રોનિક્સ અને હાર્ડવેર)' || businessType === 'Mobile & Accessories (મોબાઈલ અને એક્સેસરીઝ)';
  const isGrocery = businessType === 'Grocery / Mini Mart (કરિયાણું અને નાના મોલ)' || businessType === 'Dairy & Bakery (ડેરી અને પાર્લર)';
  const isClothing = businessType === 'Garments & Footwear (કપડાં અને રેડીમેડ)';
  const isWholesaler = businessType === 'Small Wholesale / FMCG Distributor (નાના હોલસેલ વેપારીઓ)';
  const isUniversal = !businessType;
  const isGeneral = isUniversal || (!isElectronics && !isGrocery && !isClothing && !isWholesaler);
  const isFoodRelated = isGrocery || isWholesaler || isUniversal;
  const isHardGoods = isElectronics || isUniversal;
  const isWearables = isClothing || isUniversal;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!currentProduct.name || currentProduct.sellingPrice === undefined) return;

    if (isGrocery && !isUniversal) {
      if (!currentProduct.mfgDate || !currentProduct.expiryDate) {
        alert('Manufacture Date and Expiry Date are required for Grocery/Bakery profiles.');
        return;
      }
    }

    try {
      const prodToSave = {
        ...currentProduct,
        costPrice: Number(currentProduct.costPrice || 0),
        sellingPrice: Number(currentProduct.sellingPrice || 0),
        currentStock: Number(currentProduct.currentStock || 0),
        lowStockLimit: Number(currentProduct.lowStockLimit || 0),
        gstRate: Number(currentProduct.gstRate || 0),
        piecesPerBulkUnit: Number(currentProduct.piecesPerBulkUnit || 0),
        taxType: currentProduct.taxType || 'Exclusive',
      };
      
      await db.saveProduct(userId, shopId, prodToSave);
      setIsEditing(false);
      setCurrentProduct({});
    } catch (err) {
      console.error(err);
    }
  };

  const groups = useMemo(() => {
    const g = new Set<string>();
    products.forEach(p => { if (p.category) g.add(p.category); });
    return ['All', ...Array.from(g)];
  }, [products]);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach(p => { if (p.brandCompany) b.add(p.brandCompany); });
    return ['All', ...Array.from(b)];
  }, [products]);

  const handleSaveWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !wastageProduct || wastageQty <= 0) return;

    try {
      // 1. Deduct from stock
      const updatedProduct = {
        ...wastageProduct,
        currentStock: wastageProduct.currentStock - wastageQty
      };
      await db.saveProduct(userId, shopId, updatedProduct);

      // 2. Log in wastage module
      const wastageEntry = {
        date: new Date().toISOString().split('T')[0],
        type: 'Stock Wastage',
        itemId: wastageProduct.id,
        item: wastageProduct.name,
        qty: wastageQty,
        cost: wastageQty * wastageProduct.costPrice,
        reason: wastageReason,
        storageLocation: wastageProduct.storageLocation || 'Main Shop'
      };
      await db.saveStockWastage(userId, wastageEntry);

      setIsWastageModalOpen(false);
      setWastageProduct(null);
      setWastageQty(0);
    } catch (err) {
      console.error(err);
    }
  };

  const isNearExpiry = (dateStr?: string, days?: number) => {
    if (!dateStr || !days) return false;
    const expiryDate = new Date(dateStr);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.barcode?.includes(searchTerm) || 
                          p.serialImei?.includes(searchTerm);
    const matchesGroup = selectedGroup === 'All' || p.category === selectedGroup;
    const matchesBrand = selectedBrand === 'All' || p.brandCompany === selectedBrand;
    
    let matchesExpiry = true;
    if (expiryFilter !== 'All') {
      matchesExpiry = isNearExpiry(p.expiryDate, parseInt(expiryFilter));
    }

    return matchesSearch && matchesGroup && matchesBrand && matchesExpiry;
  });

  const lowStockCount = products.filter(p => p.currentStock <= (p.lowStockLimit || 5)).length;
  const nearExpiryCount = products.filter(p => p.expiryDate && isNearExpiry(p.expiryDate, 15)).length;

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Package className="text-indigo-400" /> Inventory & Stock Management
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="text-zinc-400 text-sm">
              {businessType ? `Optimized for ${businessType}` : 'Universal Inventory Management'}
            </p>
            {lowStockCount > 0 && (
              <span className="bg-red-500/10 text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-red-500/20">
                {lowStockCount} Low Stock Items
              </span>
            )}
            {nearExpiryCount > 0 && (
              <span className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-amber-500/20">
                {nearExpiryCount} Near Expiry Items
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Bulk Upload feature coming soon! Please prepare your CSV with columns: name, barcode, sellingPrice, costPrice, currentStock.')}
            className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
          >
            Import CSV
          </button>
          <button
            onClick={() => {
              const defaults: Partial<Product> = { 
                costPrice: 0, 
                sellingPrice: 0, 
                currentStock: 0, 
                gstRate: 0, 
                lowStockLimit: 5, 
                taxType: 'Exclusive' 
              };

              // Apply business type specific defaults
              if (isGrocery) {
                defaults.unit = 'KG';
                defaults.category = 'Grocery Items';
              } else if (isElectronics) {
                defaults.unit = 'PCs';
                defaults.category = 'Electronics';
              } else if (isClothing) {
                defaults.unit = 'PCs';
                defaults.category = 'Garments';
              }

              setCurrentProduct(defaults);
              setIsEditing(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          >
            <Plus size={18} /> Add / Edit Stock
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Search products by name, barcode, serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
            >
              {groups.map(g => <option key={g} value={g}>{g === 'All' ? 'All Groups' : g}</option>)}
            </select>
          </div>
          {(isGeneral || isFoodRelated) && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="All">All Expiries</option>
                <option value="7">Near Expiry (7 Days)</option>
                <option value="15">Near Expiry (15 Days)</option>
                <option value="30">Near Expiry (30 Days)</option>
              </select>
            </div>
          )}
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
            >
              {brands.map(b => <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                {(isGeneral || isGrocery) && <th className="px-6 py-4 font-medium">Group</th>}
                {(isGeneral || isElectronics) && <th className="px-6 py-4 font-medium">Brand & Model</th>}
                <th className="px-6 py-4 font-medium text-right">Stock</th>
                <th className="px-6 py-4 font-medium text-right">Price</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-200">{product.name}</div>
                    <div className="text-xs text-zinc-500 mt-1 space-x-2">
                      {(isGeneral || isGrocery) && product.barcode && <span>Code: {product.barcode}</span>}
                      {(isGeneral || isElectronics) && product.serialImei && <span>SN/IMEI: {product.serialImei}</span>}
                      {(isGeneral || isClothing) && product.size && <span>Size: {product.size}</span>}
                      {(isGeneral || isClothing) && product.color && <span>Color: {product.color}</span>}
                    </div>
                  </td>
                  {(isGeneral || isGrocery) && (
                    <td className="px-6 py-4 text-zinc-400">
                      <span className="bg-zinc-800 px-2 py-1 rounded text-xs">{product.category || 'N/A'}</span>
                    </td>
                  )}
                  {(isGeneral || isElectronics) && (
                    <td className="px-6 py-4 text-zinc-400">
                      <div>{product.brandCompany || '-'}</div>
                      <div className="text-xs text-zinc-500">{product.modelNumber || ''}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${product.currentStock > 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {product.currentStock} {product.unit || ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-zinc-200">₹{product.sellingPrice}</div>
                    <div className="text-xs text-zinc-500">Cost: ₹{product.costPrice}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setWastageProduct(product);
                          setWastageQty(1);
                          setIsWastageModalOpen(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Mark as Damaged/Wastage"
                      >
                        <AlertCircle size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentProduct(product);
                          setIsEditing(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No products found in stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-100">
                {currentProduct.id ? 'Edit Stock' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-zinc-400 hover:text-zinc-100">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Product Image (Optional)</label>
                  <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
                        {currentProduct.imageUrl ? (
                          <img 
                            src={resolvedImages[currentProduct.id] || currentProduct.imageUrl} 
                            alt="Product" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <ImageIcon className="text-zinc-700" size={24} />
                        )}
                      </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="product-image-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          isUploading ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                        }`}
                      >
                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                        {isUploading ? 'Uploading...' : 'Choose Image'}
                      </label>
                      <p className="text-[10px] text-zinc-500 mt-1">Image will be compressed and stored in Cloud Storage.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={currentProduct.name || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, name: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., iPhone 15, Amul Milk..."
                  />
                </div>

                {(isGeneral || isHardGoods) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Brand / Company</label>
                      <input
                        type="text"
                        value={currentProduct.brandCompany || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, brandCompany: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., Apple, Samsung"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Model Number</label>
                      <input
                        type="text"
                        value={currentProduct.modelNumber || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, modelNumber: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-zinc-400">Serial Number / IMEI</label>
                      <input
                        type="text"
                        value={currentProduct.serialImei || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, serialImei: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {(isGeneral || isFoodRelated) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Product Group</label>
                      <input
                        type="text"
                        value={currentProduct.category || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, category: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., Dairy Items, Bakery Goods"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Barcode</label>
                      <input
                        type="text"
                        value={currentProduct.barcode || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, barcode: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Mfg Date (મેન્યુફેક્ચરિંગ ડેટ) {isGrocery && '*'}</label>
                      <input
                        type="date"
                        required={isGrocery}
                        value={currentProduct.mfgDate || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, mfgDate: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Expiry Date {isGrocery && '*'}</label>
                      <input
                        type="date"
                        required={isGrocery}
                        value={currentProduct.expiryDate || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, expiryDate: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Unit (KG, Ltr, GM, PCs)</label>
                      <input
                        type="text"
                        list="unit-suggestions"
                        value={currentProduct.unit || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, unit: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., KG, GM, Liters, ML, PCs"
                      />
                      <datalist id="unit-suggestions">
                        <option value="KG" />
                        <option value="GM" />
                        <option value="Ltr" />
                        <option value="ML" />
                        <option value="PCs" />
                        <option value="Box" />
                        <option value="Packet" />
                        <option value="Dozen" />
                      </datalist>
                    </div>
                  </>
                )}

                {(isGeneral || isWearables) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Size</label>
                      <input
                        type="text"
                        value={currentProduct.size || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, size: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., S, M, L, XL, 32, 34"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Color Variant</label>
                      <input
                        type="text"
                        value={currentProduct.color || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, color: e.target.value})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., Red, Navy Blue"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 md:col-span-2 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Wholesale Bulk Unit (Optional)</label>
                    <select
                      value={currentProduct.bulkUnit || ''}
                      onChange={(e) => setCurrentProduct({...currentProduct, bulkUnit: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
                    >
                      <option value="">None / Loose Items Only</option>
                      <option value="Box">Box</option>
                      <option value="Carton">Carton</option>
                      <option value="Packet">Packet</option>
                      <option value="Bag/Sack">Bag / Sack</option>
                    </select>
                  </div>
                  
                  {currentProduct.bulkUnit && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Loose Pieces per {currentProduct.bulkUnit}</label>
                      <input
                        type="number"
                        min="1"
                        value={currentProduct.piecesPerBulkUnit || ''}
                        onChange={(e) => setCurrentProduct({...currentProduct, piecesPerBulkUnit: Number(e.target.value)})}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g., 24"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Storage Location (દુકાન / ગોડાઉન)</label>
                  <select
                    value={currentProduct.storageLocation || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, storageLocation: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Main Shop (મુખ્ય દુકાન)</option>
                    <option value="Godown 1">Godown 1 (ગોડાઉન ૧)</option>
                    <option value="Godown 2">Godown 2 (ગોડાઉન ૨)</option>
                    <option value="Warehouse">Warehouse (વેરહાઉસ)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Current Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={currentProduct.currentStock || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, currentStock: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    placeholder="Enter total loose pieces"
                  />
                  {currentProduct.bulkUnit && currentProduct.piecesPerBulkUnit && currentProduct.currentStock ? (
                    <div className="text-xs text-indigo-400 mt-1">
                      ≈ {Math.floor(currentProduct.currentStock / currentProduct.piecesPerBulkUnit)} {currentProduct.bulkUnit} and {currentProduct.currentStock % currentProduct.piecesPerBulkUnit} loose pieces
                    </div>
                  ) : null}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={currentProduct.costPrice || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, costPrice: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={currentProduct.sellingPrice || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, sellingPrice: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">GST Rate (%)</label>
                  <select
                    value={currentProduct.gstRate || 0}
                    onChange={(e) => setCurrentProduct({...currentProduct, gstRate: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value={0}>0% (Exempted)</option>
                    <option value={5}>5% (Essentials)</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18% (Most Goods)</option>
                    <option value={28}>28% (Luxury)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Tax Type</label>
                  <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setCurrentProduct({...currentProduct, taxType: 'Exclusive'})}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        currentProduct.taxType === 'Exclusive' 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Exclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentProduct({...currentProduct, taxType: 'Inclusive'})}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                        currentProduct.taxType === 'Inclusive' 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Inclusive
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Low Stock Warning Limit</label>
                  <input
                    type="number"
                    value={currentProduct.lowStockLimit || ''}
                    onChange={(e) => setCurrentProduct({...currentProduct, lowStockLimit: Number(e.target.value)})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                >
                  <Save size={18} /> Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damaged / Wastage Modal */}
      {isWastageModalOpen && wastageProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsWastageModalOpen(false)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-500/30">
                  <AlertCircle className="text-rose-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Mark as Damaged</h3>
                  <p className="text-xs text-zinc-500">{wastageProduct.name}</p>
                </div>
              </div>
              <button onClick={() => setIsWastageModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveWastage} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Wastage Quantity ({wastageProduct.unit || 'PCs'})</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={wastageProduct.currentStock}
                  value={wastageQty}
                  onChange={(e) => setWastageQty(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-zinc-500">Max available: {wastageProduct.currentStock}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Reason / Description</label>
                <select
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="Damaged">Damaged / Broken (તૂટેલો માલ)</option>
                  <option value="Expired">Expired (એક્સપાયરી)</option>
                  <option value="Stolen">Missing / Stolen (ઓછો માલ)</option>
                  <option value="Sample">Given as Sample (સેમ્પલ આપેલ)</option>
                  <option value="Personal Use">Personal Use (ઘર વપરાશ)</option>
                </select>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                >
                  Deduct from Stock & Log Wastage
                </button>
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="w-full bg-zinc-900 text-zinc-400 py-2 rounded-xl text-sm hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
