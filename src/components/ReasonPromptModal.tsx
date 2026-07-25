import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ReasonPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, staffName: string) => void;
  title: string;
  actionType: 'Edit' | 'Delete';
}

export default function ReasonPromptModal({ isOpen, onClose, onConfirm, title, actionType }: ReasonPromptModalProps) {
  const [reason, setReason] = useState('');
  const [staffName, setStaffName] = useState(localStorage.getItem('mizan_user_name') || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !staffName.trim()) {
      alert('Please provide both Staff Name and a valid Reason.');
      return;
    }
    onConfirm(reason, staffName);
    setReason('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${actionType === 'Delete' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                <AlertCircle size={20} />
              </div>
              <h3 className="text-xl font-bold text-zinc-100">Audit Trail: {actionType}</h3>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <p className="text-sm text-zinc-400">
              This action requires a mandatory reason for the audit log.
              <span className="block mt-1 font-medium text-zinc-300">{title}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Staff Name / ID</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Reason for {actionType}</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Why are you ${actionType.toLowerCase()}ing this invoice?`}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-lg ${
                  actionType === 'Delete' 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                }`}
              >
                Confirm {actionType}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
