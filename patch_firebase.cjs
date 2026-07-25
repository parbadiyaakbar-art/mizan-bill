const fs = require('fs');
let content = fs.readFileSync('src/services/FirebaseService.ts', 'utf8');

const syncEvents = `
export const SyncEvents = {
  listeners: [] as ((isSyncing: boolean) => void)[],
  subscribe(fn: (isSyncing: boolean) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  },
  notify(isSyncing: boolean) {
    this.listeners.forEach(fn => fn(isSyncing));
  }
};
let syncCount = 0;
const startSync = () => {
  syncCount++;
  if (syncCount === 1) SyncEvents.notify(true);
};
const endSync = () => {
  syncCount = Math.max(0, syncCount - 1);
  if (syncCount === 0) SyncEvents.notify(false);
};
`;

content = content.replace(/const PLATFORM_MODE = getPlatformMode\(\);/, syncEvents + '\nconst PLATFORM_MODE = getPlatformMode();');

fs.writeFileSync('src/services/FirebaseService.ts', content);
