const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import CustomerPayments from './views/CustomerPayments';", "import Payments from './views/Payments';\nimport Contacts from './views/Contacts';\nimport ExpensesDamage from './views/ExpensesDamage';");
code = code.replace("import SupplierPayments from './views/SupplierPayments';\n", "");
code = code.replace("import ShopExpenses from './views/ShopExpenses';\n", "");
code = code.replace("import StockWastage from './views/StockWastage';\n", "");

const regexOldRoutes = /case 'customer-payments':[\s\S]*?case 'stock-wastage':\n        return <StockWastage \/>;/;
const newRoutes = `case 'payments':\n        return <Payments />;\n      case 'contacts':\n        return <Contacts />;\n      case 'expenses-damage':\n        return <ExpensesDamage />;\n      case 'daily-cash':\n        return <DailyCash />;\n      case 'profit-loss': return <ProfitLoss onBack={() => setCurrentView('dashboard')} />;`;

code = code.replace(regexOldRoutes, newRoutes);

fs.writeFileSync('src/App.tsx', code);
