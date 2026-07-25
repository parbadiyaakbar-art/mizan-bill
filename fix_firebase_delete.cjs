const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

// The persistent storage removal isn't strictly necessary since it acts as a cache
// We can just remove the getPersistenceData and setPersistenceData lines
content = content.replace(/const data = await getPersistenceData\(\);\s*const filtered = \(data\.sales_invoices \|\| \[\]\)\.filter\(\(i: any\) => i\.id !== invoiceId\);\s*await setPersistenceData\(\{ \.\.\.data, sales_invoices: filtered \}\);/g, '');

content = content.replace(/const data = await getPersistenceData\(\);\s*const filtered = \(data\.purchase_invoices \|\| \[\]\)\.filter\(\(i: any\) => i\.id !== invoiceId\);\s*await setPersistenceData\(\{ \.\.\.data, purchase_invoices: filtered \}\);/g, '');

content = content.replace(/const data = await getPersistenceData\(\);\s*const filtered = \(data\.quotations \|\| \[\]\)\.filter\(\(i: any\) => i\.id !== invoiceId\);\s*await setPersistenceData\(\{ \.\.\.data, quotations: filtered \}\);/g, '');

fs.writeFileSync('src/services/FirebaseService.ts', content);
