import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone, Sparkles, Gift } from 'lucide-react';

export default function AnnouncementPopup() {
  const { settings } = useGlobalSettings();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasPopupTrigger = settings?.popupEnabled && (settings?.popupTitle || settings?.popupImageUrl);
    if (hasPopupTrigger) {
      const showOnEveryVisit = settings.popupShowOnEveryVisit ?? false;
      if (!showOnEveryVisit) {
        // Only show if not dismissed for this specific title or image
        const uniqueKey = settings.popupTitle || settings.popupImageUrl || 'ahh_greetings_default';
        const lastDismissedTitle = localStorage.getItem('ahh_popup_dismissed_title');
        if (lastDismissedTitle !== uniqueKey) {
          // Add a tiny delay to look very professional when entering the page
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      } else {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      setIsOpen(false);
    }
  }, [settings?.popupEnabled, settings?.popupTitle, settings?.popupImageUrl, settings?.popupShowOnEveryVisit]);

  if (!isOpen || !settings?.popupEnabled) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    const showOnEveryVisit = settings.popupShowOnEveryVisit ?? false;
    if (!showOnEveryVisit) {
      const uniqueKey = settings?.popupTitle || settings?.popupImageUrl || 'ahh_greetings_default';
      localStorage.setItem('ahh_popup_dismissed_title', uniqueKey);
    }
  };

  const handleActionClick = () => {
    handleDismiss();
    if (settings.popupActionUrl) {
      if (settings.popupActionUrl.startsWith('http://') || settings.popupActionUrl.startsWith('https://')) {
        window.open(settings.popupActionUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(settings.popupActionUrl);
      }
    }
  };

  // Set theme configuration
  const theme = settings.popupTheme || 'gold';

  // Determine styles
  let containerClass = '';
  let badgeText = '';
  let IconComponent = Megaphone;
  let titleColorClass = '';
  let buttonClass = '';

  switch (theme) {
    case 'gold':
      containerClass = 'bg-gradient-to-br from-zinc-950 via-amber-950 to-zinc-950 text-white border-amber-500/30';
      badgeText = 'Exclusive Invitation';
      IconComponent = Sparkles;
      titleColorClass = 'text-amber-400';
      buttonClass = 'bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-500/30';
      break;
    case 'red':
      containerClass = 'bg-gradient-to-br from-zinc-950 via-rose-950 to-zinc-950 text-white border-rose-500/30';
      badgeText = 'Flash Deal / Event';
      IconComponent = Gift;
      titleColorClass = 'text-rose-450';
      buttonClass = 'bg-rose-650 hover:bg-rose-700 text-white shadow-rose-600/30';
      break;
    case 'navy':
      containerClass = 'bg-gradient-to-br from-zinc-950 via-sky-950 to-zinc-950 text-white border-sky-550/30';
      badgeText = 'Property Alert';
      IconComponent = Megaphone;
      titleColorClass = 'text-sky-400';
      buttonClass = 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30';
      break;
    case 'emerald':
      containerClass = 'bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-950 text-white border-emerald-550/30';
      badgeText = 'Oasis Direct Offer';
      IconComponent = Sparkles;
      titleColorClass = 'text-emerald-400';
      buttonClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30';
      break;
    case 'celebration':
      containerClass = 'bg-gradient-to-br from-purple-950 via-zinc-950 to-indigo-950 text-white border-purple-500/30';
      badgeText = 'Seasonal Celebration';
      IconComponent = Gift;
      titleColorClass = 'text-purple-300';
      buttonClass = 'bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white shadow-purple-500/30';
      break;
    case 'minimal':
    default:
      containerClass = 'bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 shadow-xl';
      badgeText = 'Announcement';
      IconComponent = Megaphone;
      titleColorClass = 'text-brand';
      buttonClass = 'bg-zinc-900 hover:bg-zinc-855 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-zinc-900/10';
      break;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ backdropFilter: 'blur(4px)' }}
          className="absolute inset-0 bg-black/60"
          onClick={handleDismiss}
        />

        {/* Popup Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={`relative w-[92%] md:w-[75%] max-w-5xl border rounded-[2.5rem] shadow-2xl overflow-hidden p-0 z-10 ${containerClass}`}
        >
          {/* Subtle elegant radial background flare for gradient schemes */}
          {theme !== 'minimal' && (
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />
          )}

          <div className="relative w-full h-full">
            {/* If content type is "both" and there is an image, render a responsive two-column grid on desktop */}
            {settings.popupContentType === 'both' && settings.popupImageUrl ? (
              <div className="grid grid-cols-1 md:grid-cols-12 md:min-h-[420px] items-stretch">
                
                {/* Image Showcase Column - Fills completely (no padding/borders) */}
                <div className="col-span-1 md:col-span-5 relative min-h-[220px] sm:min-h-[280px] md:h-auto overflow-hidden">
                  <img 
                    src={settings.popupImageUrl} 
                    alt={settings.popupTitle || "Special Showcase Alert"} 
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle top/bottom shadow transition for image in mobile view */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 md:hidden" />
                </div>

                {/* Content Details Column */}
                <div className="col-span-1 md:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between space-y-6 md:space-y-8">
                  
                  {/* Header row: Heading and close button in same line */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                          theme === 'minimal' ? 'bg-zinc-100 dark:bg-zinc-900 text-brand' : 'bg-white/10 text-white'
                        }`}>
                          <IconComponent size={14} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          theme === 'minimal' ? 'text-zinc-400' : 'text-white/60'
                        }`}>
                          {badgeText}
                        </span>
                      </div>
                      {settings.popupTitle && (
                        <h3 className={`text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase ${titleColorClass}`}>
                          {settings.popupTitle}
                        </h3>
                      )}
                    </div>

                    {/* Close button in same line */}
                    <button
                      onClick={handleDismiss}
                      className={`p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 ${
                        theme === 'minimal' 
                          ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 w-10 h-10 flex items-center justify-center' 
                          : 'bg-white/10 hover:bg-white/20 text-white w-10 h-10 flex items-center justify-center'
                      }`}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Body Message */}
                  {settings.popupMessage && (
                    <p className={`text-xs sm:text-sm leading-relaxed font-semibold flex-1 ${
                      theme === 'minimal' ? 'text-zinc-550 dark:text-zinc-400' : 'text-zinc-100/90'
                    }`}>
                      {settings.popupMessage}
                    </p>
                  )}

                  {/* Trigger Call to Action button (No dismiss button) */}
                  {settings.popupActionText && (
                    <div className="pt-2">
                      <button
                        onClick={handleActionClick}
                        className={`px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md ${buttonClass}`}
                      >
                        {settings.popupActionText}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : settings.popupContentType === 'image' && settings.popupImageUrl ? (
              /* Image banner only - fully cover/fill the card screen area beautifully */
              <div className="relative w-full aspect-[4/3] md:aspect-[21/9] min-h-[280px] md:min-h-[400px] overflow-hidden flex items-center justify-center">
                <img 
                  src={settings.popupImageUrl} 
                  alt="Special Showcase Announcement" 
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual shade wash to ensure buttons and header details pop out */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/50 z-10" />

                {/* Header row inside absolute layout for full width image - puts title on same line as close button */}
                <div className="absolute top-5 inset-x-5 sm:top-8 sm:inset-x-8 flex justify-between items-center z-20">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/95 bg-black/45 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    {badgeText || 'Special Offer'}
                  </span>
                  
                  {/* Keep close button top right nicely aligned */}
                  <button
                    onClick={handleDismiss}
                    className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer w-10 h-10 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Overlaid center-bottom Action CTA */}
                {settings.popupActionText && (
                  <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[80%] sm:w-auto text-center">
                    <button
                      onClick={handleActionClick}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xl ${buttonClass}`}
                    >
                      {settings.popupActionText}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Text details only layout */
              <div className="p-6 sm:p-10 md:p-12 space-y-6 md:space-y-8">
                
                {/* Header Row: Heading headline and close button in the same line */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 justify-start">
                      <div className={`p-1.5 rounded-lg flex items-center justify-center ${
                        theme === 'minimal' ? 'bg-zinc-100 dark:bg-zinc-900 text-brand' : 'bg-white/10 text-white'
                      }`}>
                        <IconComponent size={14} />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        theme === 'minimal' ? 'text-zinc-400' : 'text-white/60'
                      }`}>
                        {badgeText}
                      </span>
                    </div>
                    {settings.popupTitle && (
                      <h3 className={`text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight uppercase ${titleColorClass}`}>
                        {settings.popupTitle}
                      </h3>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={handleDismiss}
                    className={`p-2.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 ${
                      theme === 'minimal' 
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 w-10 h-10 flex items-center justify-center' 
                        : 'bg-white/10 hover:bg-white/20 text-white w-10 h-10 flex items-center justify-center'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Message detail lines */}
                {settings.popupMessage && (
                  <p className={`text-xs sm:text-base leading-relaxed font-semibold max-w-2xl ${
                    theme === 'minimal' ? 'text-zinc-550 dark:text-zinc-400' : 'text-zinc-105/90'
                  }`}>
                    {settings.popupMessage}
                  </p>
                )}

                {/* Large responsive action button (No dismiss button) */}
                {settings.popupActionText && (
                  <div className="pt-2">
                    <button
                      onClick={handleActionClick}
                      className={`px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md ${buttonClass}`}
                    >
                      {settings.popupActionText}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
