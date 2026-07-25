const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import SyncIndicator')) {
  content = content.replace(/import { SyncService, SyncStatus } from '.\/services\/SyncService';/, "import { SyncService, SyncStatus } from './services/SyncService';\nimport SyncIndicator from './components/SyncIndicator';");
  
  // add SyncIndicator right before <Sidebar
  content = content.replace(/<Sidebar/, "<SyncIndicator />\n      <Sidebar");
  
  fs.writeFileSync('src/App.tsx', content);
}
