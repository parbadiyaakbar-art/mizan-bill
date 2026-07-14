import { motion } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Laptop, 
  Cloud, 
  ShieldCheck, 
  MessageSquare,
  Bell,
  BookOpen,
  Layout,
  Zap,
  Globe,
  Database
} from 'lucide-react';
import { View } from '../types';

interface LandingPageProps {
  onLogin: () => void;
  onViewReleases: () => void;
  onViewPrivacy: () => void;
  onViewTerms: () => void;
}

export default function LandingPage({ onLogin, onViewReleases, onViewPrivacy, onViewTerms }: LandingPageProps) {
  const features = [
    {
      title: 'Real-time Sync',
      description: 'Instant data synchronization between your mobile and desktop devices.',
      icon: Zap,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      title: 'Cloud Backup',
      description: 'Automated backups to your Google Drive ensures your data is always safe.',
      icon: Cloud,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      title: 'Offline Billing',
      description: 'Continue your business even without internet. Data syncs when online.',
      icon: Database,
      color: 'from-emerald-400 to-cyan-500'
    },
    {
      title: 'Cross-Platform',
      description: 'Dedicated builds for Android (APK) and Windows Desktop (.exe).',
      icon: Smartphone,
      color: 'from-indigo-400 to-purple-500'
    },
    {
      title: 'GST Management',
      description: 'Simple GST invoicing and return filing reports built-in.',
      icon: ShieldCheck,
      color: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Multi-User Access',
      description: 'Manage multiple users and permissions for your staff.',
      icon: Globe,
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const upcomingFeatures = [
    {
      title: 'WhatsApp Billing',
      description: 'Automatically send invoices and payment links to customers via WhatsApp.',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Smart Stock Alerts',
      description: 'AI-powered notifications when your inventory levels are running low.',
      icon: Bell,
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Supplier Khaata',
      description: 'Complete digital ledger to manage supplier credits and payments.',
      icon: BookOpen,
      color: 'from-indigo-500 to-blue-500'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30 font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <span className="font-bold text-xl italic">M</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Mizan Bill</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <button onClick={onViewReleases} className="hover:text-white transition-colors">Download</button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
              v1.0.4-stable
            </span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Web Version Coming Soon
            </div>
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Professional Billing <br /> Now for Android & Windows
            </h2>
            <p className="mt-8 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              The Mizan Bill web platform is currently under maintenance. 
              Download our native apps to continue your business operations completely offline with secure local sync.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/builds/mizan-bill-v1.apk" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                <Smartphone size={20} />
                Download Android APK
              </a>
              <a 
                href="/builds/mizan-bill-setup.exe" 
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-zinc-700"
              >
                <Laptop size={20} />
                Download Windows EXE
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 relative group"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] -z-10 rounded-full max-w-4xl mx-auto opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[2.5rem] p-4 shadow-2xl backdrop-blur-sm">
              <div className="aspect-video bg-zinc-950 rounded-[1.8rem] flex items-center justify-center overflow-hidden border border-zinc-800 relative shadow-inner">
                {/* Product Mockup Display Slot */}
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-zinc-950">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Placeholder for Laptop Frame */}
                    <div className="hidden md:block w-3/4 aspect-video bg-zinc-900 rounded-lg border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-800 flex items-center px-2 gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      </div>
                      <img 
                        src="/assets/mockup_desktop.png" 
                        alt="Desktop Dashboard" 
                        className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://picsum.photos/seed/dashboard/1200/800";
                        }}
                      />
                    </div>
                    {/* Placeholder for Mobile Frame */}
                    <div className="absolute bottom-4 right-4 md:right-12 w-20 md:w-32 aspect-[9/19] bg-zinc-900 rounded-[2rem] border-4 border-zinc-800 shadow-2xl overflow-hidden translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-zinc-800 rounded-full z-10" />
                      <img 
                        src="/assets/mockup_mobile.png" 
                        alt="Mobile App" 
                        className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://picsum.photos/seed/mobile/400/800";
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-zinc-400 text-xs font-mono flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Live Preview Mode
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h3 className="text-3xl md:text-4xl font-bold">Powerful Features for Growing Businesses</h3>
            <p className="text-zinc-400 mt-4">Everything you need to manage your business from anywhere in the world.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/30 transition-all group"
              >
                <div className={`p-4 rounded-2xl bg-zinc-950 w-fit mb-6 shadow-xl relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-20`} />
                  <feature.icon size={24} className={`relative z-10 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} blur-lg opacity-40 group-hover:opacity-60 transition-opacity`} />
                </div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-32">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-indigo-500 font-mono text-xs font-bold tracking-[0.2em] uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Future Roadmap</span>
                <h3 className="text-3xl md:text-4xl font-bold mt-4">Coming Soon to Mizan Bill</h3>
              </div>
              <p className="text-zinc-500 max-w-sm text-sm">We are constantly evolving. Here are the premium modules currently in development.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingFeatures.map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 group relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 rounded bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-600/30">
                      Premium Upgrade
                    </span>
                  </div>
                  
                  <div className={`p-4 rounded-2xl bg-zinc-950 w-fit mb-6 shadow-xl relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10`} />
                    <feature.icon size={24} className={`relative z-10 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} />
                  </div>
                  
                  <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
                    {feature.title}
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  </h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <span>Alpha Testing</span>
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-indigo-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Ready to take your business <br className="hidden md:block" /> to the next level?
            </h3>
            <p className="mt-6 text-indigo-100 text-lg max-w-xl mx-auto">
              Download the Mizan Bill app on your phone or install the desktop version to start your journey today.
            </p>
            <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
              <button 
                onClick={onViewReleases}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4 bg-white text-indigo-600 font-extrabold rounded-2xl hover:bg-zinc-100 transition-all active:scale-95 shadow-xl"
              >
                View Latest Releases
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm italic">M</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-500 tracking-tight">Mizan Bill</h1>
          </div>
          
          <div className="flex items-center gap-6 text-zinc-500 text-sm">
            <button onClick={onViewPrivacy} className="hover:text-zinc-300 transition-colors">Privacy Policy</button>
            <button onClick={onViewTerms} className="hover:text-zinc-300 transition-colors">Terms of Service</button>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Built with Precision by Parbadiya Infotech</span>
            </div>
          </div>

          <p className="text-zinc-600 text-xs">
            © 2026 Mizan Bill Software. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
