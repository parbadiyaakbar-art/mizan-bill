import { X, Keyboard } from 'lucide-react';
import React, { useEffect } from 'react';

export default function ShortcutsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  // Prevent closing when clicking inside the modal
  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F1', description: 'Show this Help Guide' },
    { key: 'F2', description: 'New Sales Invoice' },
    { key: 'Ctrl + S', description: 'Save Invoice' },
    { key: 'Ctrl + P', description: 'Print Invoice' },
    { key: 'Esc', description: 'Close Modals' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={handleContentClick}
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Keyboard className="text-indigo-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
              <span className="text-zinc-300">{s.description}</span>
              <kbd className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-md text-xs font-mono text-zinc-300 font-semibold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="p-4 bg-zinc-800/50 rounded-b-2xl text-center text-xs text-zinc-500">
          Work faster with keyboard shortcuts.
        </div>
      </div>
    </div>
  );
}
