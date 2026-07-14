const fs = require('fs');
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');

const regex = /      <div>\n        <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-\[0_0_8px_rgba\(165,180,252,0.5\)\]">Overview<\/h2>\n        <p className="text-zinc-400 mt-2">High-level financial performance and activity\.<\/p>\n      <\/div>[\s\S]*?<div className="bg-zinc-900\/60 border border-indigo-500\/20 rounded-xl p-6 hover:border-indigo-500\/40 transition-colors cursor-pointer" onClick=\{\(\) => onViewChange \&\& onViewChange\("profit-loss"\)\}>/;

const replacement = `      <div>
        <h2 className="text-3xl font-bold text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]">Overview</h2>
        <p className="text-zinc-400 mt-2">High-level financial performance and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-6 hover:border-indigo-500/40 transition-colors cursor-pointer" onClick={() => onViewChange && onViewChange("profit-loss")}>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/views/Dashboard.tsx', code);
