import React from 'react';
import { Globe, Shield, RefreshCw } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface IntegrationsStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function IntegrationsStep({ localSettings, setLocalSettings }: IntegrationsStepProps) {
  // Ensure default safety keys
  const bayutEnabled = localSettings.bayutEnabled ?? false;
  const bayutApiKey = localSettings.bayutApiKey ?? '';
  const bayutApiUrl = localSettings.bayutApiUrl ?? 'https://www.bayut.com/api-v7/stats/website-client-leads';
  const dubizzleEnabled = localSettings.dubizzleEnabled ?? false;
  const dubizzleApiKey = localSettings.dubizzleApiKey ?? '';
  const dubizzleApiUrl = localSettings.dubizzleApiUrl ?? 'https://dubizzle.com/profolio/api-v7/stats/website-client-leads';
  const syncIntervalMinutes = localSettings.syncIntervalMinutes ?? 30;

  // Property Finder defaults
  const pfEnabled = localSettings.pfEnabled ?? false;
  const pfApiKey = localSettings.pfApiKey ?? '';
  const pfApiSecret = localSettings.pfApiSecret ?? '';
  const pfApiUrl = localSettings.pfApiUrl ?? 'https://atlas.propertyfinder.com/v1';
  const pfBrokerLicense = localSettings.pfBrokerLicense ?? '';

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Globe className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">7. Portal Leads Sync Integrations</h3>
      </div>

      <div className="space-y-6">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
          Integrate lead generation metrics from live Dubai property portals. When enabled, your background scheduler will run at the configured cron interval to pull new inquiries, WhatsApp conversations, views, and phone logs into the database records automatically.
        </p>

        {/* Sync Frequency / Cron settings */}
        <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="text-zinc-500" size={16} />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">Background Cron Scheduler Frequency</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Synchronize Leads Every:</p>
              <p className="text-[11px] text-zinc-400">Specifies the recurring cron check delay interval.</p>
            </div>
            <div>
              <select
                value={syncIntervalMinutes}
                onChange={e => setLocalSettings(prev => ({ ...prev, syncIntervalMinutes: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none"
              >
                <option value={5}>5 Minutes (Real-Time Polling)</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour (60 mins)</option>
                <option value={120}>2 Hours (120 mins)</option>
                <option value={360}>6 Hours</option>
                <option value={720}>12 Hours</option>
                <option value={1440}>24 Hours (Daily Sync)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bayut Integration Card */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
          {/* Accent Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400">
                B
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Bayut Leads Pull API</h4>
                <p className="text-[11px] text-zinc-400">Fetch active email leads, phones, & WhatsApp logs</p>
              </div>
            </div>

            {/* Turn On/Off Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${bayutEnabled ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {bayutEnabled ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, bayutEnabled: !prev.bayutEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  bayutEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    bayutEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {bayutEnabled && (
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-805">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bayut Endpoint URL</label>
                <input
                  type="text"
                  value={bayutApiUrl}
                  onChange={e => setLocalSettings(prev => ({ ...prev, bayutApiUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  placeholder="https://www.bayut.com/api-v7/stats/website-client-leads"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bayut Unique API Key (Bearer Token)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Shield size={14} />
                  </span>
                  <input
                    type="password"
                    value={bayutApiKey}
                    onChange={e => setLocalSettings(prev => ({ ...prev, bayutApiKey: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="Enter unique Bayut Client API token..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dubizzle Integration Card */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
          {/* Accent Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center font-black text-red-600 dark:text-red-400">
                D
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Dubizzle Leads Pull API</h4>
                <p className="text-[11px] text-zinc-400">Sync customer views, SMS leads, & call logs</p>
              </div>
            </div>

            {/* Turn On/Off Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${dubizzleEnabled ? 'text-red-500' : 'text-zinc-400'}`}>
                {dubizzleEnabled ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, dubizzleEnabled: !prev.dubizzleEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dubizzleEnabled ? 'bg-red-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    dubizzleEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {dubizzleEnabled && (
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-805">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dubizzle Endpoint URL</label>
                <input
                  type="text"
                  value={dubizzleApiUrl}
                  onChange={e => setLocalSettings(prev => ({ ...prev, dubizzleApiUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  placeholder="https://dubizzle.com/profolio/api-v7/stats/website-client-leads"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dubizzle Unique API Key (Bearer Token)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Shield size={14} />
                  </span>
                  <input
                    type="password"
                    value={dubizzleApiKey}
                    onChange={e => setLocalSettings(prev => ({ ...prev, dubizzleApiKey: e.target.value }))}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                    placeholder="Enter unique Dubizzle Client API token..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Property Finder Enterprise API Integration Card */}
        <div className="relative overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 space-y-5">
          {/* Accent Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center font-black text-rose-600 dark:text-rose-400">
                P
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-100">Property Finder Enterprise API</h4>
                <p className="text-[11px] text-zinc-400">Real-time listing sync, RERA DLD & ADREC permit auto-validation</p>
              </div>
            </div>

            {/* Turn On/Off Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${pfEnabled ? 'text-rose-500' : 'text-zinc-400'}`}>
                {pfEnabled ? 'Active' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, pfEnabled: !prev.pfEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  pfEnabled ? 'bg-rose-500' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    pfEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {pfEnabled && (
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-805">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">PF API Base Endpoint URL</label>
                  <input
                    type="text"
                    value={pfApiUrl}
                    onChange={e => setLocalSettings(prev => ({ ...prev, pfApiUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    placeholder="https://atlas.propertyfinder.com/v1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Company Broker/DLD License</label>
                  <input
                    type="text"
                    value={pfBrokerLicense}
                    onChange={e => setLocalSettings(prev => ({ ...prev, pfBrokerLicense: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    placeholder="e.g. 1501234 or ADREC license"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Enterprise API Key (Client ID)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Shield size={14} />
                    </span>
                    <input
                      type="text"
                      value={pfApiKey}
                      onChange={e => setLocalSettings(prev => ({ ...prev, pfApiKey: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
                      placeholder="Enter Property Finder Client API Key (ID)..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Enterprise API Secret (Client Secret)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Shield size={14} />
                    </span>
                    <input
                      type="password"
                      value={pfApiSecret}
                      onChange={e => setLocalSettings(prev => ({ ...prev, pfApiSecret: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
