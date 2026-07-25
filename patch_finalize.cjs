const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

// Replace waitForPendingWrites block
content = content.replace(
  /if \(navigator\.onLine\) \{\s*waitForPendingWrites\(db\)\.catch\(err => \{\s*console\.warn\('Background sync encountered a delay:', err\);\s*\}\);\s*\}/,
  `if (navigator.onLine) {
      startSync();
      waitForPendingWrites(db).catch(err => {
        console.warn('Background sync encountered a delay:', err);
      }).finally(() => {
        endSync();
      });
    } else {
      // It will sync later when online
    }`
);

fs.writeFileSync('src/services/FirebaseService.ts', content);
