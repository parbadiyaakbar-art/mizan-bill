const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/case 'sales':\n        return <Sales \/>;/g, "case 'sales':\n        return <Sales startCreating={false} />;\n      case 'sales-new':\n        return <Sales startCreating={true} />;\n");
code = code.replace(/case 'purchases':\n        return <Purchases \/>;/g, "case 'purchases':\n        return <Purchases startCreating={false} />;\n      case 'purchases-new':\n        return <Purchases startCreating={true} />;\n");
code = code.replace(/case 'quotations':\n        return <Quotations \/>;/g, "case 'quotations':\n        return <Quotations startCreating={false} />;\n      case 'quotations-new':\n        return <Quotations startCreating={true} />;\n");

fs.writeFileSync('src/App.tsx', code);
