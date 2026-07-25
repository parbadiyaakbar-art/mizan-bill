const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Replace the HelpCircle with Keyboard icon and dispatch event
content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, "import { $1, Keyboard } from 'lucide-react';");

content = content.replace(
  /<button className="hover:text-indigo-400 transition-colors">\s*<HelpCircle size=\{20\} \/>\s*<\/button>/,
  `<button onClick={() => window.dispatchEvent(new Event('open-shortcuts'))} className="hover:text-indigo-400 transition-colors flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs">
          <Keyboard size={14} />
          <span className="hidden sm:inline">Shortcuts</span>
        </button>`
);

fs.writeFileSync('src/components/Header.tsx', content);
