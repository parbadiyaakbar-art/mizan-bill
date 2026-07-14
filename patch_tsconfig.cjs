const fs = require('fs');
let tsconfig = fs.readFileSync('tsconfig.json', 'utf8');
const data = JSON.parse(tsconfig);
data.compilerOptions.types = ["vite/client"];
fs.writeFileSync('tsconfig.json', JSON.stringify(data, null, 2));
