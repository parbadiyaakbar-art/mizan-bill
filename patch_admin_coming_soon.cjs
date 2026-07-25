const fs = require('fs');
let content = fs.readFileSync('src/views/AdminPanel.tsx', 'utf8');

// Ensure showComingSoon is in default config
content = content.replace(
  /comingSoonFeatures: \[\]/,
  'comingSoonFeatures: [],\n      showComingSoon: true'
);

// Add toggle to the UI
const comingSoonToggle = `
                  <div className="space-y-2 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase">Coming Soon Section</label>
                        <p className="text-[10px] text-zinc-600">Show upcoming premium features on landing page</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={adminConfig.branding.showComingSoon !== false}
                          onChange={e => setAdminConfig({...adminConfig, branding: {...adminConfig.branding, showComingSoon: e.target.checked}})}
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
`;

content = content.replace(
  /<div className="space-y-2">\s*<label className="text-xs font-bold text-zinc-500 uppercase">Hashtags \(comma separated\)<\/label>/,
  comingSoonToggle + '\n                  <div className="space-y-2">\n                    <label className="text-xs font-bold text-zinc-500 uppercase">Hashtags (comma separated)</label>'
);

fs.writeFileSync('src/views/AdminPanel.tsx', content);
console.log('AdminPanel updated for Coming Soon toggle');
