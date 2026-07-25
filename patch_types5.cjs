const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/gstRate\?: number;/, 'gstRate?: number;\n  taxType?: string;');

fs.writeFileSync('src/types.ts', content);
console.log('types patched again');
