import fs from 'fs';
let code = fs.readFileSync('src/views/DailyCash.tsx', 'utf8');

const oldStr = `      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Calculator className="text-indigo-400" /> Daily Cash & Sales (રોજમેળ)
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time daily financial health and counter cash.</p>
        </div>
        
        {/* Prominent Billing Action Button */}
        <div className="relative shrink-0">`;

const newStr = `      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Calculator className="text-indigo-400" /> Daily Cash & Sales (રોજમેળ)
          </h2>
          <p className="text-zinc-400 text-sm mt-1">Real-time daily financial health and counter cash.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Prominent Billing Action Button */}
          <div className="relative shrink-0">`;

const oldStr2 = `          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">`;

const newStr2 = `          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide shrink-0">`;

const oldStr3 = `          <button 
            onClick={handlePrint}
            className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>`;

const newStr3 = `          <button 
            onClick={handlePrint}
            className="bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0"
          >
            <Printer size={20} />
          </button>
        </div>
        </div>
      </div>`;

code = code.replace(oldStr, newStr);
code = code.replace(oldStr2, newStr2);
code = code.replace(oldStr3, newStr3);

fs.writeFileSync('src/views/DailyCash.tsx', code);
