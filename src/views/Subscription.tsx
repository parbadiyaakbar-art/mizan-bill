import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Clock, ShieldAlert, Banknote, QrCode, Lock, CheckCircle2 } from 'lucide-react';
import { getGlobalConfig } from '../services/FirebaseService';

export default function Subscription({ user, onPaymentSuccess }: { user: any, onPaymentSuccess?: () => void }) {
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const data = await getGlobalConfig();
      setConfig(data);
      setIsLoading(false);
    };
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isExpired = new Date(user.expiryDate) < new Date();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Status Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between space-y-8">
          <div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${isExpired ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
              {isExpired ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isExpired ? 'Subscription Expired' : 'Active Subscription'}
            </h2>
            <p className="text-zinc-400">
              {isExpired 
                ? 'Your trial or subscription period has ended. Please renew to continue managing your business.' 
                : 'Your account is currently active. You can renew early to ensure uninterrupted service.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span className="text-sm text-zinc-300 font-medium">Valid Until</span>
              </div>
              <span className={`text-sm font-bold font-mono ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
                {new Date(user.expiryDate).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Subscription Perks</h3>
              <div className="space-y-2">
                {['Cloud-native Auto Backup', 'GST Returns & Reports', 'Multi-user Staff Control', 'Unlimited Invoicing'].map(perk => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle2 size={14} className="text-indigo-500" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
            <p className="text-[11px] text-indigo-300 leading-relaxed italic text-center font-medium">
              Note: Your data is securely preserved for 30 days after expiration.
            </p>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-zinc-900 border-2 border-indigo-500/30 rounded-3xl p-8 space-y-8 shadow-[0_0_50px_rgba(79,70,229,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Banknote size={120} className="rotate-12" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <CreditCard className="text-indigo-400" />
              Upgrade / Renew
            </h3>
            <p className="text-zinc-500 text-sm mt-1">Select your preferred payment method.</p>
          </div>

          <div className="space-y-6">
            {/* UPI Option */}
            {config?.upiId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                    <QrCode size={18} className="text-emerald-400" />
                    Direct UPI Payment
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase font-bold tracking-wider italic">Instant Activation</span>
                </div>
                
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-center p-4 bg-white rounded-xl aspect-square w-48 mx-auto">
                    {config.qrCodeUrl ? (
                      <img src={config.qrCodeUrl} alt="Payment QR" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-zinc-400 flex flex-col items-center justify-center gap-2">
                        <QrCode size={40} />
                        <span className="text-[10px] text-center font-mono">SCAN TO PAY</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-zinc-500">Payee UPI ID:</p>
                    <p className="text-sm font-bold font-mono text-zinc-200">{config.upiId}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Gateway Option */}
            {config?.razorpayKeyId && (
              <button className="w-full group bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-bold flex items-center justify-between transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-95">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm leading-none">Credit / Debit Card</div>
                    <div className="text-[10px] text-indigo-200 font-normal mt-1 italic">via Razorpay Gateway</div>
                  </div>
                </div>
                <Lock size={18} className="text-indigo-300" />
              </button>
            )}

            <div className="text-center pt-2">
              <p className="text-[10px] text-zinc-500">
                After payment, please send a screenshot to support for immediate activation if using UPI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
