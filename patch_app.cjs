const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import ShortcutsModal')) {
  content = content.replace(/import SyncIndicator from '.\/components\/SyncIndicator';/, "import SyncIndicator from './components/SyncIndicator';\nimport ShortcutsModal from './components/ShortcutsModal';");
  
  content = content.replace(/const \[syncStatus, setSyncStatus\] = useState<SyncStatus \| null>\(null\);/, 
    "const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);\n  const [showShortcutsModal, setShowShortcutsModal] = useState(false);");
    
  // In the existing useEffect for keydown, we replace it or modify it
  // Wait, I created patch_shortcuts.cjs before that added the keydown for F2. Let's see what's there.
}
fs.writeFileSync('src/App.tsx', content);
