const fs = require('fs');
let content = fs.readFileSync('src/views/Purchases.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{[\s\S]*?try \{[\s\S]*?if \(!isCreating\)/;
content = content.replace(regex, `useEffect(() => {
    if (!isCreating)`);

fs.writeFileSync('src/views/Purchases.tsx', content);
