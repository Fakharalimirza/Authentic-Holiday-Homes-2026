import React from 'react';
import { Building } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface CorporateStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function CorporateStep({ localSettings, setLocalSettings }: CorporateStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Building className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">1. Corporate Profile</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Legal Company Name</label>
          <input
            type="text"
            value={localSettings.companyName || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, companyName: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. Authentic Holiday Homes LLC"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">TRN (Tax Registration No)</label>
          <input
            type="text"
            value={localSettings.trn || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, trn: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. 100234567890003"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Trade License Number</label>
          <input
            type="text"
            value={localSettings.licenseNumber || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, licenseNumber: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. 1501234"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Website URL</label>
          <input
            type="text"
            value={localSettings.website || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. www.authentichomes.ae"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contact Hotline</label>
          <input
            type="text"
            value={localSettings.phone || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. +971 4 123 4567"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Official Support Email</label>
          <input
            type="email"
            value={localSettings.email || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            placeholder="e.g. billing@authentichomes.ae"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Physical HQ Address</label>
          <textarea
            value={localSettings.address || ''}
            onChange={e => setLocalSettings(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 h-20 resize-none focus:outline-none"
            placeholder="HQ physical office address details"
          />
        </div>

        {/* Social media links configuration area requested by user */}
        <div className="sm:col-span-2 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-brand" style={{ color: localSettings.customBrandColor }}>
              Official Social Media Channels
            </h4>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">
              Configure URLs for your official handles. Empty fields will hide their corresponding buttons globally across all footers on the site.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Instagram Profile Link</label>
              <input
                type="text"
                value={localSettings.socialInstagram || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialInstagram: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://instagram.com/authenticholidayhomes"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Facebook Page Link</label>
              <input
                type="text"
                value={localSettings.socialFacebook || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialFacebook: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://facebook.com/authenticholidayhomes"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">LinkedIn Business Page</label>
              <input
                type="text"
                value={localSettings.socialLinkedin || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialLinkedin: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://linkedin.com/company/authentic-holiday-homes"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Twitter / X Profile Link</label>
              <input
                type="text"
                value={localSettings.socialTwitter || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialTwitter: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://x.com/authenticholidayhomes"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">YouTube Channel Link</label>
              <input
                type="text"
                value={localSettings.socialYoutube || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialYoutube: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://youtube.com/@authenticholidayhomes"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-405">TikTok Profile Link</label>
              <input
                type="text"
                value={localSettings.socialTiktok || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialTiktok: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://tiktok.com/@authenticholidayhomes"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-405">Snapchat Profile Link</label>
              <input
                type="text"
                value={localSettings.socialSnapchat || ''}
                onChange={e => setLocalSettings(prev => ({ ...prev, socialSnapchat: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="e.g. https://snapchat.com/add/authenticholidayhomes"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
