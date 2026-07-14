import { Download, Smartphone, Laptop, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';

export default function Releases() {
  const releases = [
    {
      id: 'android',
      platform: 'Android',
      version: 'v1.0.2-beta',
      date: '2026-07-10',
      status: 'Ready',
      icon: Smartphone,
      description: 'Mobile application for shop billing and field collections.',
      link: 'https://mizanbill.com/releases/android/mizan-bill-v1.0.2.apk'
    },
    {
      id: 'windows',
      platform: 'Windows',
      version: 'v1.0.2-beta',
      date: '2026-07-10',
      status: 'Ready',
      icon: Laptop,
      description: 'Desktop application for high-speed counter billing and accounting.',
      link: 'https://mizanbill.com/releases/windows/mizan-bill-setup-v1.0.2.exe'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-100">App Releases</h2>
        <p className="text-zinc-400 mt-2">Download the latest builds for your devices. Real-time sync is enabled across all platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {releases.map((release) => (
          <div key={release.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <release.icon size={24} />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 size={12} />
                {release.status}
              </div>
            </div>

            <h3 className="text-xl font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">
              {release.platform} Build
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-mono">
              <span>{release.version}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {release.date}
              </span>
            </div>

            <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
              {release.description}
            </p>

            <div className="mt-8">
              <button
                onClick={() => alert('Download scheduled: The build is being finalized and will be sent to your registered email (parbadiyaakbar@gmail.com) shortly.')}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all active:scale-95"
              >
                <Download size={20} />
                Download {release.platform} Build
              </button>
              <p className="text-[10px] text-center text-zinc-600 mt-3 uppercase tracking-widest font-bold">
                Securely Compiled by Parbadiya Infotech
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-8 text-center">
        <h4 className="text-lg font-bold text-indigo-300">Continuous Integration</h4>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl mx-auto">
          Our build system automatically packages and syncs the latest code across all device families. 
          If you encounter any issues with the downloads, please contact Parbadiya Support.
        </p>
      </div>
    </div>
  );
}
