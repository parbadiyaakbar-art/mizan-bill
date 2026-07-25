import { useState, useEffect } from 'react';
import { CloudUpload } from 'lucide-react';
import { SyncEvents } from '../services/FirebaseService';

export default function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return SyncEvents.subscribe((syncState) => {
      setIsSyncing(syncState);
    });
  }, []);

  if (!isSyncing) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-indigo-600/90 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shadow-lg backdrop-blur animate-in fade-in slide-in-from-bottom-4">
      <CloudUpload size={14} className="animate-pulse" />
      Syncing...
    </div>
  );
}
