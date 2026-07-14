import fs from 'fs';
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');
code = code.replace("import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, Plus, FileText, ChevronDown } from 'lucide-react';", "import { TrendingUp, Banknote, Users, AlertTriangle, Receipt, ShoppingCart, Clock, Wallet, Plus, FileText, ChevronDown, EyeOff } from 'lucide-react';");
code = code.replace("const [showBillingDropdown, setShowBillingDropdown] = useState(false);", "const [showBillingDropdown, setShowBillingDropdown] = useState(false);\n  const [isUnlocked, setIsUnlocked] = useState(false);");

// Fix the extra `</button> </div> </div> )}`
let idx = code.indexOf('<EyeOff size={16} /> Hide Dashboard');
if (idx !== -1) {
  let sub = code.substring(idx);
  let endBtn = sub.indexOf('</button>');
  let rest = sub.substring(endBtn + 9);
  
  // Find the exact string we want to remove
  let toRemove = `          </button>
              </div>
            </div>
          )}
`;
  if(rest.includes(toRemove)) {
    code = code.replace(toRemove, "");
  } else {
    // maybe just replace all `</button>\n              </div>\n            </div>\n          )}`
    code = code.replace(/<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)}/, "");
  }
}

// Add unlocked logic
const returnStart = 'return (';
if(code.includes(returnStart)) {
  const newReturn = `
  if (!isUnlocked) {
    return (
      <div className="max-w-[1440px] mx-auto h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-zinc-900/80 rounded-full flex items-center justify-center border border-zinc-800/80 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <EyeOff size={32} className="text-zinc-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-400">Dashboard is Locked</h2>
          <p className="text-zinc-600 mt-2 max-w-md mx-auto">Sensitive financial matrices and GST data are hidden for privacy.</p>
        </div>
        <button
          onClick={() => setIsUnlocked(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
        >
          Unlock View
        </button>
      </div>
    );
  }

  return (`;
  code = code.replace(returnStart, newReturn);
}

fs.writeFileSync('src/views/Dashboard.tsx', code);
