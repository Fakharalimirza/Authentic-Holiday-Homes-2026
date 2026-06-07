import React from 'react';
import { Megaphone } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface PopupsStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function PopupsStep({ localSettings, setLocalSettings }: PopupsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Megaphone className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">6. Interactive Greetings & Marketing Popups</h3>
      </div>

      <div className="space-y-5">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium font-sans">
          Configure dynamic public popups to welcome users, showcase seasonal greeting cards, announce discounts, or direct traffic to special holiday homes listings.
        </p>

        {/* Enabled Toggle */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 font-sans">Enable Promotional Popup</h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-450 font-semibold font-sans mt-0.5">When checked, visitors will view the configured popup card upon opening the app.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={!!localSettings.popupEnabled}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, popupEnabled: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-805 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shrink-0"></div>
          </label>
        </div>

        {/* Show On Every Visit Toggle */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-100 dark:border-zinc-850">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200 font-sans">Show On Every Page Refresh</h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-455 font-semibold font-sans mt-0.5">Disable this to only show the popup once per session (using localStorage check) so as not to annoy users.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={!!localSettings.popupShowOnEveryVisit}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, popupShowOnEveryVisit: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-805 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shrink-0"></div>
          </label>
        </div>

        {/* Configuration of Popup Content Type and Image URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Popup Content Strategy</label>
            <select
              value={localSettings.popupContentType || 'both'}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupContentType: e.target.value as any }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="text">📄 Text Headline & Body Only</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="image">🖼️ Large Image / Banner Only</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="both">🎨 Combo (Text, Body, and Banner)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Popup Picture URL</label>
            <input
              type="text"
              required={!!localSettings.popupEnabled && localSettings.popupContentType === 'image'}
              value={localSettings.popupImageUrl || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupImageUrl: e.target.value }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. https://images.unsplash.com/... or /banner.png"
            />
          </div>
        </div>

        {/* Popup Title */}
        {localSettings.popupContentType !== 'image' && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Popup Headline / Title</label>
            <input
              type="text"
              required={!!localSettings.popupEnabled}
              value={localSettings.popupTitle || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupTitle: e.target.value }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. Ramadan Mubarak from Authentic Homes"
            />
          </div>
        )}

        {/* Popup Message */}
        {localSettings.popupContentType !== 'image' && (
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Announcement / Details Body</label>
            <textarea
              rows={4}
              required={!!localSettings.popupEnabled}
              value={localSettings.popupMessage || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupMessage: e.target.value }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed animate-none"
              placeholder="Provide greeting messages, sales terms, rules, code counts, booking offers..."
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Popup Theme */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Visual Presentation Vibe</label>
            <select
              value={localSettings.popupTheme || 'gold'}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupTheme: e.target.value as any }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white focus:outline-none"
            >
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="gold">🕌 Downtown Gold (Luxury Greeting)</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="red">🔴 Corporate Ruby (Flash Sales / Offers)</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="navy">🔵 Burj Navy (Corporate Alerts)</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="emerald">🟢 Oasis Emerald (Green / Wellness Events)</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="minimal">⚪ Elegant Minimalist (Clean Gray)</option>
              <option className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white" value="celebration">✨ Celebration Sparkle (Party / New Year / Eid)</option>
            </select>
          </div>

          {/* Button Action URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-405">Button Call-to-Action Link</label>
            <input
              type="text"
              value={localSettings.popupActionUrl || ''}
              onChange={e => setLocalSettings(prev => ({ ...prev, popupActionUrl: e.target.value }))}
              className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="e.g. /properties or external url"
            />
          </div>
        </div>

        {/* Button Action Text */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-405">Button Call-to-Action Label</label>
          <input
            type="text"
            value={localSettings.popupActionText || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, popupActionText: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-2xl text-xs font-bold text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="e.g. Explore Offers Now"
          />
        </div>

        {/* LIVE POPUP PREVIEW CARD inside options */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 font-mono">Real-Time Presentation Preview Card:</span>
          <div className={`p-6 rounded-[2rem] border min-h-[120px] shadow-inner relative overflow-hidden text-left ${
            localSettings.popupTheme === 'gold' 
              ? 'bg-gradient-to-br from-zinc-900 via-amber-950 to-zinc-900 text-white border-amber-600/40 shadow-emerald-900/10' 
              : localSettings.popupTheme === 'red'
              ? 'bg-gradient-to-br from-zinc-900 via-rose-950 to-zinc-900 text-white border-rose-500/40 shadow-rose-900/10'
              : localSettings.popupTheme === 'navy'
              ? 'bg-gradient-to-br from-zinc-900 via-sky-950 to-zinc-900 text-white border-sky-500/40 shadow-sky-900/10'
              : localSettings.popupTheme === 'emerald'
              ? 'bg-gradient-to-br from-zinc-900 via-emerald-950 to-zinc-900 text-white border-emerald-500/40 shadow-emerald-900/10'
              : localSettings.popupTheme === 'celebration'
              ? 'bg-gradient-to-br from-purple-950 via-zinc-950 to-neutral-900 text-white border-purple-500/40 shadow-purple-900/10'
              : 'bg-zinc-50 dark:bg-black text-zinc-850 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800'
          }`}>
            {/* Live Preview Image banner */}
            {(localSettings.popupContentType === 'image' || localSettings.popupContentType === 'both') && localSettings.popupImageUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/20 aspect-video max-h-48 bg-black/40 flex items-center justify-center">
                <img 
                  src={localSettings.popupImageUrl} 
                  alt="Banner Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Render an elegant fallback pattern if broken or empty
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
                  }}
                />
              </div>
            )}

            {localSettings.popupContentType !== 'image' && localSettings.popupTitle && (
              <h4 className={`text-sm font-black tracking-tight mb-2 uppercase ${
                localSettings.popupTheme === 'gold' ? 'text-amber-400' :
                localSettings.popupTheme === 'red' ? 'text-rose-400' :
                localSettings.popupTheme === 'emerald' ? 'text-emerald-400' :
                localSettings.popupTheme === 'navy' ? 'text-sky-450' :
                localSettings.popupTheme === 'celebration' ? 'text-purple-300' : ''
              }`}>{localSettings.popupTitle}</h4>
            )}
            {localSettings.popupContentType !== 'image' && localSettings.popupMessage && (
              <p className="text-xs opacity-90 leading-relaxed font-semibold max-w-lg mb-4 text-zinc-300 dark:text-zinc-200">{localSettings.popupMessage}</p>
            )}
            <div className="flex gap-2.5">
              {localSettings.popupActionText && (
                <button type="button" className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-default transition-all ${
                  localSettings.popupTheme === 'gold' ? 'bg-amber-500 text-zinc-950 font-black' :
                  localSettings.popupTheme === 'red' ? 'bg-rose-600 text-white' :
                  localSettings.popupTheme === 'emerald' ? 'bg-emerald-600 text-white' :
                  localSettings.popupTheme === 'navy' ? 'bg-sky-600 text-white' :
                  localSettings.popupTheme === 'celebration' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                  'bg-zinc-850 dark:bg-zinc-800 text-white'
                }`}>
                  {localSettings.popupActionText}
                </button>
              )}
              <button type="button" className="px-3.5 py-2 text-[10px] font-bold uppercase transition-all rounded-xl cursor-default border border-zinc-300 dark:border-zinc-700 bg-transparent opacity-60">
                Dismiss Announcement
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
