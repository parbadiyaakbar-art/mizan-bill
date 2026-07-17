
export const SYNC_KEY = 'mizan_last_sync_timestamp';
const OFFLINE_LIMIT_DAYS = 7;
const WARNING_LIMIT_DAYS = 4;

export interface SyncStatus {
  lastSync: number;
  daysSinceLastSync: number;
  isLocked: boolean;
  isWarning: boolean;
  daysRemaining: number;
}

export const SyncService = {
  /**
   * Updates the last sync timestamp in local storage.
   * Should be called whenever an online operation succeeds.
   */
  updateSyncTimestamp: () => {
    if (navigator.onLine) {
      const now = Date.now();
      localStorage.setItem(SYNC_KEY, now.toString());
      console.log('Sync timestamp updated:', new Date(now).toLocaleString());
    }
  },

  /**
   * Gets the last sync timestamp.
   * If none exists, sets it to now (first run).
   */
  getLastSync: (): number => {
    const stored = localStorage.getItem(SYNC_KEY);
    if (!stored) {
      const now = Date.now();
      localStorage.setItem(SYNC_KEY, now.toString());
      return now;
    }
    return parseInt(stored, 10);
  },

  /**
   * Checks the sync status and returns if the app should be locked or warned.
   */
  getSyncStatus: (): SyncStatus => {
    const lastSync = SyncService.getLastSync();
    const now = Date.now();
    const diffMs = now - lastSync;
    const daysSinceLastSync = diffMs / (1000 * 60 * 60 * 24);
    
    const isLocked = daysSinceLastSync >= OFFLINE_LIMIT_DAYS;
    const isWarning = daysSinceLastSync >= WARNING_LIMIT_DAYS;
    const daysRemaining = Math.max(0, Math.ceil(OFFLINE_LIMIT_DAYS - daysSinceLastSync));

    return {
      lastSync,
      daysSinceLastSync,
      isLocked,
      isWarning,
      daysRemaining
    };
  }
};
