const fs = require('fs');

// Patch Sales.tsx
let salesContent = fs.readFileSync('src/views/Sales.tsx', 'utf8');
salesContent = salesContent.replace(/due: b\.dueDate \|\| '---',/, "due: b.dueDate || '---',\n        raw: b,");

// Add handleEdit and handleDelete in Sales.tsx
const salesAdminCheck = `
  const handleEdit = (inv: any) => {
    const userRole = localStorage.getItem('mizan_user_role');
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      alert('Only Admins can edit invoices.');
      return;
    }
    setEditingInvoice(inv.raw);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const userRole = localStorage.getItem('mizan_user_role');
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      alert('Only Admins can delete invoices.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this invoice? Stock and ledger balances will be restored.')) {
      try {
        await db.deleteSalesInvoice(userId, shopId, id);
      } catch (e: any) {
        alert('Failed to delete: ' + e.message);
      }
    }
  };
`;
if (!salesContent.includes('const [editingInvoice, setEditingInvoice] = useState<any>(null);')) {
   salesContent = salesContent.replace(/const \[isCreating, setIsCreating\] = useState\(startCreating\);/, 
     "const [isCreating, setIsCreating] = useState(startCreating);\n  const [editingInvoice, setEditingInvoice] = useState<any>(null);");
   
   salesContent = salesContent.replace(/const handleExportCSV = \(\) => \{/, salesAdminCheck + "\n  const handleExportCSV = () => {");
   
   salesContent = salesContent.replace(/return <InvoiceForm type="sales" onBack=\{\(\) => setIsCreating\(false\)\} shopId=\{shopId\} userId=\{userId\} \/>;/,
     "return <InvoiceForm type=\"sales\" onBack={() => { setIsCreating(false); setEditingInvoice(null); }} shopId={shopId} userId={userId} initialInvoice={editingInvoice} />;");
     
   salesContent = salesContent.replace(/<button className="text-zinc-500 hover:text-indigo-400 transition-colors ml-2"><MoreVertical size=\{18\} \/><\/button>/,
     `<button onClick={() => handleEdit(inv)} className="text-zinc-400 hover:text-indigo-400 transition-colors ml-2" title="Edit"><Edit size={16} /></button>
      <button onClick={() => handleDelete(inv.id)} className="text-zinc-400 hover:text-rose-400 transition-colors ml-2" title="Delete"><Trash2 size={16} /></button>`);

   // Ensure Edit, Trash2 are imported
   if (!salesContent.includes('Edit,')) {
      salesContent = salesContent.replace(/MoreVertical \} from 'lucide-react';/, "MoreVertical, Edit, Trash2 } from 'lucide-react';");
   }
   
   fs.writeFileSync('src/views/Sales.tsx', salesContent);
}

// Patch Purchases.tsx
let purchasesContent = fs.readFileSync('src/views/Purchases.tsx', 'utf8');
purchasesContent = purchasesContent.replace(/due: b\.dueDate \|\| '---'/, "due: b.dueDate || '---',\n            raw: b,");

const purchasesAdminCheck = `
  const handleEdit = (inv: any) => {
    const userRole = localStorage.getItem('mizan_user_role');
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      alert('Only Admins can edit invoices.');
      return;
    }
    setEditingInvoice(inv.raw);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const userRole = localStorage.getItem('mizan_user_role');
    if (userRole !== 'Owner' && userRole !== 'Admin') {
      alert('Only Admins can delete invoices.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this purchase bill? Stock and ledger balances will be restored.')) {
      try {
        await db.deletePurchaseInvoice(userId, shopId, id);
        fetchInvoices();
      } catch (e: any) {
        alert('Failed to delete: ' + e.message);
      }
    }
  };
`;
if (!purchasesContent.includes('const [editingInvoice, setEditingInvoice] = useState<any>(null);')) {
   purchasesContent = purchasesContent.replace(/const \[isCreating, setIsCreating\] = useState\(startCreating\);/, 
     "const [isCreating, setIsCreating] = useState(startCreating);\n  const [editingInvoice, setEditingInvoice] = useState<any>(null);");
     
   purchasesContent = purchasesContent.replace(/const handleExportCSV = \(\) => \{/, purchasesAdminCheck + "\n  const handleExportCSV = () => {");
   
   purchasesContent = purchasesContent.replace(/return <InvoiceForm type="purchase" onBack=\{\(\) => setIsCreating\(false\)\} shopId=\{shopId\} userId=\{userId\} \/>;/,
     "return <InvoiceForm type=\"purchase\" onBack={() => { setIsCreating(false); setEditingInvoice(null); fetchInvoices(); }} shopId={shopId} userId={userId} initialInvoice={editingInvoice} />;");
     
   purchasesContent = purchasesContent.replace(/<button className="text-zinc-500 hover:text-indigo-400 transition-colors ml-2"><MoreVertical size=\{18\} \/><\/button>/,
     `<button onClick={() => handleEdit(inv)} className="text-zinc-400 hover:text-indigo-400 transition-colors ml-2" title="Edit"><Edit size={16} /></button>
      <button onClick={() => handleDelete(inv.id)} className="text-zinc-400 hover:text-rose-400 transition-colors ml-2" title="Delete"><Trash2 size={16} /></button>`);

   // Ensure Edit, Trash2 are imported
   if (!purchasesContent.includes('Edit,')) {
      purchasesContent = purchasesContent.replace(/MoreVertical \} from 'lucide-react';/, "MoreVertical, Edit, Trash2 } from 'lucide-react';");
   }
   
   // fetchInvoices is in useEffect, need to make it accessible or inline.
   // Wait, fetchInvoices is defined INSIDE useEffect in Purchases.tsx. Let's fix that.
   purchasesContent = purchasesContent.replace(/useEffect\(\(\) => \{\n    const fetchInvoices = async \(\) => \{/, 
     "const fetchInvoices = async () => {\n      try {\n        const data = await db.getPurchaseInvoices(shopId);\n        if (data) {\n          const formatted = data.map((b: any) => ({\n            id: b.id,\n            date: b.date || new Date().toISOString().split('T')[0],\n            client: b.party_name || 'Generic Supplier',\n            amount: b.totals?.invoiceTotal?.toFixed(2) || '0.00',\n            status: b.payment_mode === 'Udhaar' ? 'Pending' : 'Paid',\n            due: b.dueDate || '---',\n            raw: b,\n          }));\n          setInvoices(formatted);\n        }\n      } catch (err) {\n        console.error('Error fetching purchase invoices:', err);\n      } finally {\n        setIsLoading(false);\n      }\n    };\n\n  useEffect(() => {\n    ");
   purchasesContent = purchasesContent.replace(/      \} catch \(err\) \{\n        console\.error\('Error fetching purchase invoices:', err\);\n      \} finally \{\n        setIsLoading\(false\);\n      \}\n    \};\n        \n    if \(!isCreating\) \{/, "    if (!isCreating) {");
   
   fs.writeFileSync('src/views/Purchases.tsx', purchasesContent);
}
