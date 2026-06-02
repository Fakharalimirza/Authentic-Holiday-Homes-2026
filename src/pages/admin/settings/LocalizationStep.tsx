import React from 'react';
import { Globe } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface LocalizationStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function LocalizationStep({ localSettings, setLocalSettings }: LocalizationStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Globe className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">2. Localization & Transactions</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Base Currency Code</label>
          <select
            value={localSettings.currencyOfChoice}
            onChange={e => setLocalSettings(prev => ({ ...prev, currencyOfChoice: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none"
          >
            <option value="AED">AED (UAE Dirham)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
            <option value="SAR">SAR (Saudi Riyal)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Currency Symbol Display</label>
          <input
            type="text"
            value={localSettings.currencySymbol}
            onChange={e => setLocalSettings(prev => ({ ...prev, currencySymbol: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none"
            placeholder="e.g. AED or د.إ or $"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">System Timezone</label>
          <select
            value={localSettings.timezoneValue}
            onChange={e => setLocalSettings(prev => ({ ...prev, timezoneValue: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none"
          >
            <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
            <option value="UTC">Coordinated Universal Time (UTC)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Date Format</label>
          <select
            value={localSettings.dateFormat}
            onChange={e => setLocalSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:outline-none"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-05-21)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 21/05/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 05/21/2026)</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY (e.g. May 21, 2026)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
