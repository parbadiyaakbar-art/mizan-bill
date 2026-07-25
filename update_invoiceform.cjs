const fs = require('fs');
let content = fs.readFileSync('src/components/InvoiceForm.tsx', 'utf8');

content = content.replace(
  /export default function InvoiceForm\(\{ type, onBack, shopId, userId, isEstimate = false \}: InvoiceFormProps\) \{/,
  "export default function InvoiceForm({ type, onBack, shopId, userId, isEstimate = false, initialInvoice }: InvoiceFormProps) {"
);

// We need to initialize states using initialInvoice if available
content = content.replace(
  /const \[items, setItems\] = useState<LineItem\[\]>\(\[\n    \{ id: '1', item: '', category: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, discount: 0, gst: 18, warehouse: 'Main Godown', batchNo: '', expiryDate: '' \}\n  \]\);/,
  `const [items, setItems] = useState<LineItem[]>(initialInvoice ? initialInvoice.items : [
    { id: '1', item: '', category: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, discount: 0, gst: 18, warehouse: 'Main Godown', batchNo: '', expiryDate: '' }
  ]);`
);

content = content.replace(/const \[paymentMode, setPaymentMode\] = useState\('Cash'\);/, "const [paymentMode, setPaymentMode] = useState(initialInvoice ? initialInvoice.payment_mode : 'Cash');");
content = content.replace(/const \[flatDiscount, setFlatDiscount\] = useState\(0\);/, "const [flatDiscount, setFlatDiscount] = useState(initialInvoice?.totals?.flatDiscount || 0);");
content = content.replace(/const \[partyName, setPartyName\] = useState\(''\);/, "const [partyName, setPartyName] = useState(initialInvoice?.party_name || '');");
content = content.replace(/const \[partyMobile, setPartyMobile\] = useState\(''\);/, "const [partyMobile, setPartyMobile] = useState(initialInvoice?.party_mobile || '');");
content = content.replace(/const \[invoiceDate, setInvoiceDate\] = useState<string>\(new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\);/, "const [invoiceDate, setInvoiceDate] = useState<string>(initialInvoice?.date || new Date().toISOString().split('T')[0]);");

// Wait, I need to know where the rest of the variables are.
fs.writeFileSync('src/components/InvoiceForm.tsx', content);
