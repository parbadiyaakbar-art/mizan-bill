const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<LandingPage\s+onLogin/g,
  '<LandingPage adminConfig={adminConfig} onLogin'
);

const announcementModal = `
      {adminConfig?.announcement?.active && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => {
                const newConfig = {...adminConfig};
                newConfig.announcement.active = false;
                setAdminConfig(newConfig);
              }}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="text-center space-y-4">
              <div className={\`w-16 h-16 rounded-full flex items-center justify-center mx-auto \${adminConfig.announcement.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : adminConfig.announcement.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}\`}>
                <span className="text-2xl">{adminConfig.announcement.type === 'success' ? '✨' : adminConfig.announcement.type === 'warning' ? '⚠️' : '📢'}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{adminConfig.announcement.title || 'Announcement'}</h2>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{adminConfig.announcement.message}</p>
              <button 
                onClick={() => {
                  const newConfig = {...adminConfig};
                  newConfig.announcement.active = false;
                  setAdminConfig(newConfig);
                }}
                className="w-full py-3.5 mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  /\{adminConfig && adminConfig\.updateMessage && \(/g,
  announcementModal + '\n      {adminConfig && adminConfig.updateMessage && ('
);

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx patched successfully');
