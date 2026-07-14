import { useState } from 'react';
import { Store, ChevronRight, CheckCircle2 } from 'lucide-react';
import { BusinessType } from '../types';

export const BUSINESS_TYPES: BusinessType[] = [
  'Grocery / Mini Mart (કરિયાણું અને નાના મોલ)',
  'Dairy & Bakery (ડેરી અને પાર્લર)',
  'Garments & Footwear (કપડાં અને રેડીમેડ)',
  'Electrical & Hardware (ઇલેક્ટ્રોનિક્સ અને હાર્ડવેર)',
  'Mobile & Accessories (મોબાઈલ અને એક્સેસરીઝ)',
  'Small Wholesale / FMCG Distributor (નાના હોલસેલ વેપારીઓ)'
];

interface OnboardingProps {
  onComplete: (businessType: BusinessType | '', shopName: string, stateCode: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selectedType, setSelectedType] = useState<BusinessType | ''>('');
  const [shopName, setShopName] = useState('');
  const [stateCode, setStateCode] = useState('24'); // Default to Gujarat (24)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (type: BusinessType | '') => {
    try {
      setIsSubmitting(true);
      await onComplete(type, shopName || 'My Shop', stateCode);
    } catch (err) {
      console.error('Onboarding completion error:', err);
      // Even if it fails, we should probably let them through if they are stuck
      onComplete(type, shopName || 'My Shop', stateCode); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100">
      <div className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-indigo-500/20 rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Store className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Welcome to Mizan Bill</h1>
          <p className="text-zinc-400">Let's set up your shop profile to customize your experience.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Shop Name / Business Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter shop name"
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Business State (for GST)
              </label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="24">Gujarat (24)</option>
                <option value="27">Maharashtra (27)</option>
                <option value="08">Rajasthan (08)</option>
                <option value="09">Uttar Pradesh (09)</option>
                <option value="33">Tamil Nadu (33)</option>
                <option value="29">Karnataka (29)</option>
                <option value="07">Delhi (07)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-4">
              What type of business do you run?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-4 rounded-xl text-left border transition-all flex items-start gap-3 group ${
                    selectedType === type
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] scale-[1.02]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    selectedType === type ? 'border-white text-white bg-white/20' : 'border-zinc-700 text-transparent'
                  }`}>
                    <CheckCircle2 size={14} />
                  </div>
                  <span className={`text-sm font-bold leading-tight transition-colors ${
                    selectedType === type ? 'text-white' : 'group-hover:text-zinc-200'
                  }`}>{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-500/5 p-4 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-indigo-300/70 leading-relaxed text-center font-medium">
              Selecting your business type configures default measurement units (like Kg/Gram or Pieces) and enables relevant fields (like IMEI for mobiles).
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            <button
              onClick={() => handleComplete('')}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
            >
              Skip / Set Up Later
            </button>
            <button
              onClick={() => handleComplete(selectedType)}
              disabled={!selectedType || isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
