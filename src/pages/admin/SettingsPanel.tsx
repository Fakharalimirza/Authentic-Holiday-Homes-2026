import React, { useState } from 'react';
import { useGlobalSettings, AppSettings } from '../../contexts/GlobalSettingsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Save, Building, Globe, Palette, FileText, Settings, Megaphone, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import our modular settings files
import CorporateStep from './settings/CorporateStep';
import LocalizationStep from './settings/LocalizationStep';
import DropdownsStep from './settings/DropdownsStep';
import BrandingStep from './settings/BrandingStep';
import LetterheadStep from './settings/LetterheadStep';
import PopupsStep from './settings/PopupsStep';
import LetterheadPreview from './settings/LetterheadPreview';

export default function SettingsPanel() {
  const { settings, saveSettings } = useGlobalSettings();
  const { t } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  // Sync with fetched global settings
  React.useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, name: 'Corporate', label: 'Corporate Profile', icon: Building, description: 'Legal, contacts & HQ' },
    { id: 2, name: 'Localization', label: 'Localization', icon: Globe, description: 'Currency, timezone & date formats' },
    { id: 3, name: 'Dropdowns', label: 'Lists Dropdowns', icon: Settings, description: 'Categories, areas & options' },
    { id: 4, name: 'Branding', label: 'Branding Theme', icon: Palette, description: 'Accent and visual luxury' },
    { id: 5, name: 'Letterhead', label: 'Letterhead Print', icon: FileText, description: 'Invoice borders and templates' },
    { id: 6, name: 'Popups', label: 'Aesthetics & Greeting Popups', icon: Megaphone, description: 'Configure active promotional alerts and greetings' }
  ];
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await saveSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update administrative settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderActiveStep = () => {
    switch (currentStep) {
      case 1:
        return <CorporateStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      case 2:
        return <LocalizationStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      case 3:
        return <DropdownsStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      case 4:
        return <BrandingStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      case 5:
        return <LetterheadStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      case 6:
        return <PopupsStep localSettings={localSettings} setLocalSettings={setLocalSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-805 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Admin Central Settings</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Configure app localizations, appearance, company metadata, and dropdown values.</p>
        </div>
        
        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-brand/20 cursor-pointer text-xs uppercase tracking-wider"
          style={{ backgroundColor: localSettings.customBrandColor }}
        >
          {isSaving ? (
            <span className="flex items-center gap-1.5 font-bold">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={18} />
              Save Settings
            </span>
          )}
        </button>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-6 py-4 rounded-2xl text-sm border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 font-semibold text-left"
        >
          <div className="p-1 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
            <Check size={16} />
          </div>
          All global application parameters and variable options saved successfully to Firebase!
        </motion.div>
      )}

      {saveError && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl text-sm border border-red-200/50 dark:border-red-900/50 font-mono text-left">
          <strong>Database Sync Failed:</strong> {saveError}
        </div>
      )}

      <form onSubmit={(e) => handleSave(e)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Column - Forms as Step-by-Step Wizard */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Stepper Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl">
            <div className="relative flex justify-between items-center w-full">
              {/* Progress Line Background */}
              <div className="absolute top-[22px] left-6 right-6 h-0.5 bg-zinc-100 dark:bg-zinc-800 z-0" />
              
              {/* Progress Line Active Fill */}
              <div 
                className="absolute top-[22px] left-6 h-0.5 transition-all duration-300 z-0"
                style={{ 
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                  backgroundColor: localSettings.customBrandColor 
                }}
              />

              {steps.map((st) => {
                const IconComponent = st.icon;
                const isActive = currentStep === st.id;
                const isCompleted = currentStep > st.id;
                
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setCurrentStep(st.id)}
                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    {/* Circle Indicator */}
                    <div 
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-200 ${
                        isActive 
                          ? 'border-brand bg-white dark:bg-zinc-900 shadow-md scale-110' 
                          : isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400 group-hover:border-zinc-400'
                      }`}
                      style={
                        isActive 
                          ? { borderColor: localSettings.customBrandColor, color: localSettings.customBrandColor } 
                          : {}
                      }
                    >
                      {isCompleted ? (
                        <Check size={16} strokeWidth={3} />
                      ) : (
                        <IconComponent size={16} />
                      )}
                    </div>

                    {/* Step Title Label */}
                    <span 
                      className={`mt-2 text-[11px] font-black tracking-wide uppercase font-sans hidden sm:block ${
                        isActive 
                          ? 'text-zinc-800 dark:text-zinc-100 font-extrabold' 
                          : isCompleted 
                            ? 'text-emerald-500' 
                            : 'text-zinc-400 group-hover:text-zinc-655'
                      }`}
                    >
                      {st.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Step Description block on Mobile/Desktop */}
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md">
                  Step {currentStep} of {steps.length}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {steps[currentStep - 1].label}
                </span>
              </div>
              <span className="hidden md:inline italic text-zinc-400 dark:text-zinc-500 font-sans">
                {steps[currentStep - 1].description}
              </span>
            </div>
          </div>

          {/* Active Wizard Step Panel with Fade Animate */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-1 px-5 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold disabled:opacity-30 transition-all cursor-pointer text-sm font-sans"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
                className="flex items-center gap-1 px-6 py-3 text-white rounded-2xl font-bold hover:brightness-105 active:scale-98 transition-all cursor-pointer text-sm font-sans shrink-0"
                style={{ backgroundColor: localSettings.customBrandColor }}
              >
                Next Step
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-bold shadow-lg hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 cursor-pointer text-sm font-sans shrink-0"
                style={{ backgroundColor: localSettings.customBrandColor }}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Finish & Save Settings
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Right Column - Live Letterhead Print Preview */}
        <div className="lg:col-span-4 space-y-6">
          <LetterheadPreview localSettings={localSettings} />
        </div>

      </form>
    </div>
  );
}
