import React from 'react';
import { Layout } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface LetterheadPreviewProps {
  localSettings: AppSettings;
}

export default function LetterheadPreview({ localSettings }: LetterheadPreviewProps) {
  return (
    <div className="sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <Layout size={18} className="text-brand" style={{ color: localSettings.customBrandColor }} />
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-800 dark:text-zinc-250 font-sans">
          Letterhead Print-Background
        </h4>
      </div>

      {/* Letterhead Visual Representation */}
      <div 
        className="w-full bg-white text-zinc-900 border border-zinc-200 shadow-xl rounded-2xl flex flex-col justify-between overflow-hidden relative select-none transition-all duration-300"
        style={{
          aspectRatio: localSettings.letterheadPageSize === 'Letter' 
            ? '1/1.294' 
            : localSettings.letterheadPageSize === 'Legal' 
              ? '1/1.647' 
              : '1/1.414',
          paddingTop: `${localSettings.letterheadMarginTop ?? 20}px`,
          paddingBottom: `${localSettings.letterheadMarginBottom ?? 20}px`,
          paddingLeft: `${localSettings.letterheadMarginLeft ?? 20}px`,
          paddingRight: `${localSettings.letterheadMarginRight ?? 20}px`,
        }}
      >
        
        {/* Custom Letterhead Background PNG */}
        {localSettings.letterheadImageUrl ? (
          <div 
            className="absolute inset-0 pointer-events-none z-0" 
            style={{ 
              backgroundImage: `url(${localSettings.letterheadImageUrl})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} 
          />
        ) : (
          <div className="absolute inset-0 pointer-events-none z-0 bg-zinc-50/30 flex items-center justify-center border border-dashed border-zinc-200">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold">No PNG Background Loaded</span>
          </div>
        )}

        {/* Document Mock content wrapper */}
        <div className="w-full h-full flex flex-col justify-between z-10 relative">
          
          {/* Minimalist Receipt Header */}
          <div className="border-b border-zinc-100 pb-2 flex justify-between items-center text-left">
            <div>
              <h5 className="text-[8px] font-black tracking-tight uppercase" style={{ color: localSettings.customBrandColor }}>
                {localSettings.companyName || 'Authentic Holiday Homes LLC'}
              </h5>
              <p className="text-[5px] text-zinc-400">HQ Document System</p>
            </div>
            <span className="text-[6px] font-bold text-zinc-400">TRN: {localSettings.trn || 'XXXXXXXXX'}</span>
          </div>

          {/* Sample Invoice Body mock */}
          <div className="my-auto space-y-2 font-sans py-2 text-left">
            <div className="flex justify-between items-center bg-zinc-50/90 p-2 rounded border border-zinc-100">
              <span className="text-[7px] font-bold text-zinc-650">INVOICE DOCUMENT</span>
              <span className="text-[6px] text-zinc-400">DATE: 2026-05-21</span>
            </div>
            
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[6px] text-zinc-500 font-bold border-b border-zinc-100 pb-0.5">
                <span>Description / Nights</span>
                <span>Total ({localSettings.currencyOfChoice})</span>
              </div>
              <div className="flex justify-between text-[6px] text-zinc-700 py-0.5">
                <span>Premium Downtown Luxury Duplex x 3 Nights</span>
                <span className="font-mono">{localSettings.currencySymbol} 4,500</span>
              </div>
              <div className="flex justify-between text-[6px] text-zinc-750 font-black border-t border-zinc-100 pt-1 text-right">
                <span className="ml-auto">Grand Total Amount:</span>
                <span className="ml-2 font-mono">{localSettings.currencySymbol} 4,500</span>
              </div>
            </div>
          </div>

          {/* Footer Inside Letterhead */}
          <div className="border-t border-zinc-100 pt-2 text-center text-[5px] text-zinc-400 flex justify-between items-center font-sans">
            <span>Phone: {localSettings.phone}</span>
            <span>Email: {localSettings.email}</span>
            <span className="font-bold text-zinc-600">{localSettings.website}</span>
          </div>

        </div>

      </div>
      
      <p className="text-zinc-550 dark:text-zinc-500 text-[11px] leading-relaxed text-center mt-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850">
        The layout above shows exactly how dynamic print PDF receipts and documents render on top of the custom Letterhead background.
      </p>
    </div>
  );
}
