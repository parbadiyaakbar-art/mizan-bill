const fs = require('fs');
let content = fs.readFileSync('src/components/InvoiceForm.tsx', 'utf8');

// Modify interface InvoiceFormProps
content = content.replace(/interface InvoiceFormProps \{/, "interface InvoiceFormProps {\n  initialInvoice?: any;");

fs.writeFileSync('src/components/InvoiceForm.tsx', content);
