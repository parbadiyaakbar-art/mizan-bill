const fs = require('fs');
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');
code = code.replace("import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, Plus, FileText, ChevronDown } from 'lucide-react';", "import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, Plus, FileText, ChevronDown, EyeOff } from 'lucide-react';");
code = code.replace("const [showBillingDropdown, setShowBillingDropdown] = useState(false);", "const [showBillingDropdown, setShowBillingDropdown] = useState(false);\n  const [isUnlocked, setIsUnlocked] = useState(false);");
fs.writeFileSync('src/views/Dashboard.tsx', code);
