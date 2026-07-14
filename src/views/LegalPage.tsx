import React from 'react';
import { Shield, FileText, ArrowLeft } from 'lucide-react';
import { LEGAL_CONTENT } from '../data/legal';
import { motion } from 'motion/react';

interface LegalPageProps {
  type: 'terms' | 'privacy';
  onBack: () => void;
}

export default function LegalPage({ type, onBack }: LegalPageProps) {
  const activeContent = LEGAL_CONTENT[type];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 md:p-12 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-4">
                {type === 'terms' ? (
                  <FileText className="w-10 h-10 text-amber-500" />
                ) : (
                  <Shield className="w-10 h-10 text-green-500" />
                )}
                {activeContent.title}
              </h1>
              <p className="text-zinc-500">Last updated: July 2026 • Version 1.0.0 (Beta)</p>
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            {activeContent.sections.map((section, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-800/50 rounded-2xl">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100">{section.heading}</h2>
                </div>
                <div className="pl-16">
                  <p className="text-zinc-400 leading-relaxed text-lg">
                    {section.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-8 md:p-12 bg-zinc-950/50 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">
              If you have any questions regarding these documents, please contact <br className="hidden md:block" />
              <span className="text-indigo-400 font-medium">support@parbadiya.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
