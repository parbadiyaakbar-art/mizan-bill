const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const newHookCode = `
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (user) setCurrentView('sales-new');
      }
    };
    const handleOpenShortcuts = () => setShowShortcutsModal(true);
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-shortcuts', handleOpenShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-shortcuts', handleOpenShortcuts);
    }
  }, [user]);
`;

content = content.replace(/useEffect\(\(\) => \{\s*const handleKeyDown =[\s\S]*?\}, \[user\]\);/, newHookCode);

// Add the modal component to rendering
content = content.replace(/<SyncIndicator \/>/, "<SyncIndicator />\n      <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />");

fs.writeFileSync('src/App.tsx', content);
