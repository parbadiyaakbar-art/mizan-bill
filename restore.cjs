const fs = require('fs');

// 1. Restore Sidebar.tsx
const sidebarCode = `import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  FileText,
  Wallet,
  Settings,
  Users,
  Banknote,
  CreditCard,
  Calculator,
  PackageMinus
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily-cash', label: 'Daily Cash / Rojmel', icon: Calculator },
    { id: 'sales', label: 'Sales Invoices', icon: Receipt },
    { id: 'purchases', label: 'Purchase Invoices', icon: ShoppingCart },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'supplier-payments', label: 'Supplier Payments', icon: CreditCard },
    { id: 'customer-payments', label: 'Customer Payments', icon: Banknote },
    { id: 'gst', label: 'GST Returns', icon: Wallet },
    { id: 'shop-expenses', label: 'Shop Expenses', icon: FileText },
    { id: 'stock-wastage', label: 'Damage & Wastage', icon: PackageMinus },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 mb-4">
        <div className="w-8 h-8 rounded bg-indigo-500 text-white flex items-center justify-center mr-3 font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">M</div>
        <div>
          <div className="text-xl font-bold text-indigo-400">Mizan Bill</div>
          <div className="text-xs text-zinc-400">GST Management</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || currentView === (item.id + '-new');
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all \${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              }\`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-400' : ''} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
`;
fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);

// 2. Restore App.tsx routing and imports
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace("import Payments from './views/Payments';\nimport Contacts from './views/Contacts';\nimport ExpensesDamage from './views/ExpensesDamage';", "import CustomerPayments from './views/CustomerPayments';\nimport SupplierPayments from './views/SupplierPayments';\nimport ShopExpenses from './views/ShopExpenses';\nimport StockWastage from './views/StockWastage';");

const newRoutesRegex = /case 'payments':[\s\S]*?case 'profit-loss': return <ProfitLoss onBack={\(\) => setCurrentView\('dashboard'\)} \/>;/;
const oldRoutes = "case 'customer-payments':\n        return <CustomerPayments />;\n      case 'supplier-payments':\n        return <SupplierPayments />;\n      case 'daily-cash':\n        return <DailyCash />;\n      case 'shop-expenses':\n        return <ShopExpenses />;\n      case 'profit-loss': return <ProfitLoss onBack={() => setCurrentView('dashboard')} />;\n      case 'stock-wastage':\n        return <StockWastage />;"

appCode = appCode.replace(newRoutesRegex, oldRoutes);
fs.writeFileSync('src/App.tsx', appCode);

// 3. Remove files we created
if (fs.existsSync('src/views/Payments.tsx')) fs.unlinkSync('src/views/Payments.tsx');
if (fs.existsSync('src/views/Contacts.tsx')) fs.unlinkSync('src/views/Contacts.tsx');
if (fs.existsSync('src/views/ExpensesDamage.tsx')) fs.unlinkSync('src/views/ExpensesDamage.tsx');

