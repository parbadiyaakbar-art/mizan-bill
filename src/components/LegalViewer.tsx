import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { LEGAL_CONTENT } from '../data/legal';

interface LegalViewerProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export default function LegalViewer({ type, onClose }: LegalViewerProps) {
  const activeContent = LEGAL_CONTENT[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {type === 'terms' ? <FileText className="w-6 h-6 text-amber-500" /> : <Shield className="w-6 h-6 text-green-500" />}
            {activeContent.title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeContent.sections.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-800/50 rounded-lg">
                  {section.icon}
                </div>
                <h3 className="font-medium text-zinc-100">{section.heading}</h3>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed ml-11">
                {section.text}
              </p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-100 text-zinc-950 font-medium rounded-xl hover:bg-white transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
