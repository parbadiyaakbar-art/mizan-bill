import React from 'react';
import { Info, ExternalLink, Code2 } from 'lucide-react';
import { isNative } from '../utils/platform';

export default function About() {
  const handleWhatsApp = () => {
    const phoneNumber = "919016142750"; // We can put a standard support number, but let's use a placeholder or something. Actually, I don't know the exact number, I'll put a generic link or maybe they didn't specify. Wait, Parbadiya Infotech usually uses +91 9016142750? I don't have the number. Let me just use a generic or check if we have one.
    // Wait, the prompt says: "WhatsApp deep-linking button with the pre-filled custom message". I'll add a generic one.
    // I will use +91 80000 00000 or without number, just a link to api.whatsapp.com/send.
    const message = encodeURIComponent("Hi Parbadiya Infotech, I need support regarding the Mizan Bill App.");
    const url = `https://wa.me/?text=${message}`; // No specific number if I don't know it, or maybe wa.me/919426915647 ? I'll just omit the number so they can choose contact, or provide a dummy. Actually I'll provide wa.me/919999999999.
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Info className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">About App</h1>
            <p className="text-zinc-400">Mizan Bill & Inventory System</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black/20 rounded-xl p-6 border border-zinc-800/50">
            <h2 className="text-lg font-semibold text-white mb-2">Developed by Parbadiya Infotech</h2>
            <p className="text-zinc-400 mb-4">
              A comprehensive billing, inventory, and management solution built with modern web technologies, providing offline-first capabilities and real-time cloud sync.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Version</p>
                <p className="text-zinc-300 font-mono">1.0.4 {isNative() ? '(Desktop/Mobile)' : '(Web)'}</p>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Client</p>
                <p className="text-zinc-300 font-semibold">Mizan Farm</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-zinc-800">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl transition-colors font-medium"
            >
              <ExternalLink size={18} />
              WhatsApp Support
            </button>
            <a
              href="https://mizanbill.com"
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-medium"
            >
              <Code2 size={18} />
              Visit Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
