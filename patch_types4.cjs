const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/lowStockAlert\?: number;/, 'lowStockAlert?: number;\n  lowStockLimit?: number;');

fs.writeFileSync('src/types.ts', content);
console.log('types patched again');
