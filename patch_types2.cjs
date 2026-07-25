const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/stock: number;/, 'stock: number;\n  currentStock?: number;');

fs.writeFileSync('src/types.ts', content);
console.log('types patched again');
