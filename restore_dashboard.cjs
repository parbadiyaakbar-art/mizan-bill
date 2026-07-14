const fs = require('fs');

let dashboardCode = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');

const regex = /<div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">[\s\S]*?<\/div>\s*<\/div>/;
const originalHeader = `      <div>
        <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">Overview</h2>
        <p className="text-zinc-400 mt-2">High-level financial performance and activity.</p>
      </div>`;

dashboardCode = dashboardCode.replace(regex, originalHeader);

// Fix the imports
dashboardCode = dashboardCode.replace("import { useState } from 'react';\n", "");
dashboardCode = dashboardCode.replace("import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, Plus, FileText, ChevronDown } from 'lucide-react';", "import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet } from 'lucide-react';");
dashboardCode = dashboardCode.replace("const [showCreateMenu, setShowCreateMenu] = useState(false);\n", "");

fs.writeFileSync('src/views/Dashboard.tsx', dashboardCode);
