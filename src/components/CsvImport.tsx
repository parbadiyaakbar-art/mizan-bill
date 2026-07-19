import React, { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface CsvImportProps {
  onImport: (data: any[]) => Promise<void>;
  type: 'Inventory' | 'Contacts';
  disabled?: boolean;
}

export default function CsvImport({ onImport, type, disabled }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error('Invalid CSV format. Please check your file.');
          }
          await onImport(results.data);
        } catch (err: any) {
          setError(err.message || 'Error importing data');
        } finally {
          setIsLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || disabled}
        className="flex items-center gap-2 bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        <span>Import {type}</span>
      </button>

      {error && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-red-500/10 border border-red-500/50 rounded-lg p-3 z-10 flex items-start gap-2 shadow-xl backdrop-blur-sm">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200 leading-tight">{error}</p>
        </div>
      )}
    </div>
  );
}
