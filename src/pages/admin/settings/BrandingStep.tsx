import React from 'react';
import { Palette } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface BrandingStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const COLOR_PRESETS = [
  { name: 'Emirati Red (Default)', hex: '#D91F28' },
  { name: 'Downtown Gold', hex: '#D4AF37' },
  { name: 'Burj Khalifa Navy', hex: '#1E3A8A' },
  { name: 'Sufouh Emerald', hex: '#059669' },
  { name: 'Jumeirah Slate', hex: '#111827' },
  { name: 'Marina Coral', hex: '#F97316' },
];

export default function BrandingStep({ localSettings, setLocalSettings }: BrandingStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Palette className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">4. Branding & Live Theme Settings</h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Custom Accent Hex Color</label>
          <div className="flex gap-4">
            <input
              type="color"
              value={localSettings.customBrandColor}
              onChange={e => setLocalSettings(prev => ({ ...prev, customBrandColor: e.target.value }))}
              className="w-14 h-11 border border-zinc-200 dark:border-zinc-805 rounded-xl cursor-pointer bg-transparent shrink-0"
            />
            <input
              type="text"
              value={localSettings.customBrandColor}
              onChange={e => setLocalSettings(prev => ({ ...prev, customBrandColor: e.target.value }))}
              className="w-36 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="#D91F28"
            />
            <div className="flex-1 flex items-center font-sans">
              <span className="text-zinc-400 dark:text-zinc-500 text-xs">Applies immediately to brand colors, buttons, and badges!</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Or Select a Luxury Preset:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, customBrandColor: preset.hex }))}
                className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-left hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer font-medium"
              >
                <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: preset.hex }} />
                <span className="truncate font-semibold text-zinc-700 dark:text-zinc-350">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
