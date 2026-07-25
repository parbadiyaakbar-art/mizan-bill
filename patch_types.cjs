const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/name: string;/, 'name?: string;');
content = content.replace(/costPrice\?: number;/, 'costPrice?: number;\n  sellingPrice?: number;');

fs.writeFileSync('src/types.ts', content);
console.log('types patched');
