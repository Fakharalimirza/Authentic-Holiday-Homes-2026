import React from 'react';
import { FileText, Upload } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface LetterheadStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function LetterheadStep({ localSettings, setLocalSettings }: LetterheadStepProps) {
  const handleLetterheadUpload = (file: File) => {
    if (!file.type.includes('png')) {
      alert('Please upload an image in PNG format only.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalSettings(prev => ({
          ...prev,
          letterheadImageUrl: event.target!.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-805">
        <FileText className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-805 dark:text-zinc-100">5. Custom PNG Letterhead Background</h3>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Upload an official corporate letterhead in <strong className="text-zinc-800 dark:text-zinc-200">PNG format</strong>. Your PDF invoices and printed receipts will dynamically fit on top of this background.
        </p>

        {/* Drag and Drop Area */}
        <div 
          className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 transition-colors relative cursor-pointer group min-h-[160px]"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files && files[0]) {
              handleLetterheadUpload(files[0]);
            }
          }}
        >
          <input
            type="file"
            accept="image/png"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleLetterheadUpload(e.target.files[0]);
              }
            }}
          />
          
          {localSettings.letterheadImageUrl ? (
            <div className="flex flex-col items-center text-center z-20">
              <img 
                src={localSettings.letterheadImageUrl} 
                alt="Letterhead Preview" 
                className="h-24 max-w-full object-contain mb-2 rounded border border-zinc-200 dark:border-zinc-850 shadow-sm"
              />
              <span className="text-[11px] font-black uppercase text-green-500 tracking-wider">✓ Custom PNG Letterhead Loaded</span>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Drag another PNG file or click here to replace</p>
            </div>
          ) : (
            <div className="text-center font-sans flex flex-col items-center z-25">
              <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 group-hover:text-brand transition-colors mb-3">
                <Upload size={24} />
              </div>
              <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                Click or drag your PNG letterhead here
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450 mt-1 uppercase tracking-widest font-black">
                PNG Format Only
              </p>
            </div>
          )}
        </div>

        {localSettings.letterheadImageUrl && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, letterheadImageUrl: '' }))}
              className="text-xs text-red-500 hover:text-red-600 hover:underline font-bold cursor-pointer"
            >
              Remove Background Image
            </button>
          </div>
        )}

        {/* Page Size & Configured Margins */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 block">Page Document Size</label>
            <select
              value={localSettings.letterheadPageSize || 'A4'}
              onChange={e => setLocalSettings(prev => ({ ...prev, letterheadPageSize: e.target.value as any }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none"
            >
              <option value="A4">A4 Page Size (210mm × 297mm)</option>
              <option value="Letter">US Letter Page Size (8.5" × 11")</option>
              <option value="Legal">US Legal Page Size (8.5" × 14")</option>
            </select>
          </div>

          <div className="space-y-4 sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 block">Document Content Margins (in pixels)</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-sans">Top Margin</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.letterheadMarginTop ?? 20}
                  onChange={e => setLocalSettings(prev => ({ ...prev, letterheadMarginTop: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none font-bold text-center"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-sans">Bottom Margin</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.letterheadMarginBottom ?? 20}
                  onChange={e => setLocalSettings(prev => ({ ...prev, letterheadMarginBottom: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-sans">Left Margin</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.letterheadMarginLeft ?? 20}
                  onChange={e => setLocalSettings(prev => ({ ...prev, letterheadMarginLeft: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-sans">Right Margin</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={localSettings.letterheadMarginRight ?? 20}
                  onChange={e => setLocalSettings(prev => ({ ...prev, letterheadMarginRight: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs focus:outline-none font-bold text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
