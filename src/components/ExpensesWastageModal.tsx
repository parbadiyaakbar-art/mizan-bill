import { useState } from 'react';
import { X } from 'lucide-react';
import ShopExpenses from '../views/ShopExpenses';
import StockWastage from '../views/StockWastage';

interface ExpensesWastageModalProps {
  onClose: () => void;
  shopId: string;
  userId: string;
}

export default function ExpensesWastageModal({ onClose, shopId, userId }: ExpensesWastageModalProps) {
  const [activeTab, setActiveTab] = useState<'expenses' | 'wastage'>('expenses');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-[1440px] h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`text-lg font-bold transition-colors ${activeTab === 'expenses' ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-zinc-500 hover:text-zinc-300 pb-1'}`}
            >
              Shop Expenses
            </button>
            <button
              onClick={() => setActiveTab('wastage')}
              className={`text-lg font-bold transition-colors ${activeTab === 'wastage' ? 'text-indigo-400 border-b-2 border-indigo-500 pb-1' : 'text-zinc-500 hover:text-zinc-300 pb-1'}`}
            >
              Damage & Wastage
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-zinc-950/50">
          {activeTab === 'expenses' ? <ShopExpenses shopId={shopId} userId={userId} /> : <StockWastage shopId={shopId} userId={userId} />}
        </div>
      </div>
    </div>
  );
}
