export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date;
}
export class SyncService {
  static async checkSyncStatus() { return { lastSync: new Date().toISOString(), pendingCount: 0 }; }
  static async syncNow() {}
  static async queueOperation() {}
  static getSyncStatus(): SyncStatus { return { isOnline: navigator.onLine, lastSync: new Date() }; }
  static updateSyncTimestamp() {}
}
