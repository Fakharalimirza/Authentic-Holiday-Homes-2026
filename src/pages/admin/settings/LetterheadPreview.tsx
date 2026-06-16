import React from 'react';
import { Layout } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface LetterheadPreviewProps {
  localSettings: AppSettings;
}

export default function LetterheadPreview({ localSettings }: LetterheadPreviewProps) {
  return (
    <div>
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

      </div>
      
      <p className="text-zinc-550 dark:text-zinc-500 text-[11px] leading-relaxed text-center mt-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-850">
        The layout above shows exactly how dynamic print PDF receipts and documents render on top of the custom Letterhead background.
      </p>
    </div>
  );
}
