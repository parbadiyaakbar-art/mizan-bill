import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, X, Calendar, Database } from 'lucide-react';

interface BackupReminderProps {
  onDownload: () => void;
}

export default function BackupReminder({ onDownload }: BackupReminderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const lastReminder = localStorage.getItem('mizan_last_backup_reminder');
    const now = new Date().getTime();
    
    // Remind every 24 hours if not dismissed, or every 15 days if dismissed?
    // Let's keep it simple: Show if it's been more than 24 hours since last shown.
    if (!lastReminder || (now - parseInt(lastReminder)) > 24 * 60 * 60 * 1000) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('mizan_last_backup_reminder', new Date().getTime().toString());
  };

  const handleDownload = () => {
    onDownload();
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative overflow-hidden group">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        
        <div className="shrink-0 p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Database className="w-6 h-6 text-indigo-400" />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <h4 className="font-semibold text-zinc-100">Beta Backup Reminder</h4>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-500/20">
              Mandatory
            </span>
          </div>
          <p className="text-sm text-zinc-400 max-w-2xl">
            We are in the Beta Phase. To protect against potential data loss during infrastructure migrations, please download a local JSON backup of your records today.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Backup Now
          </button>
          <button
            onClick={handleDismiss}
            className="p-2.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
            title="Remind me later"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
