import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { AppSettings } from '../../../contexts/GlobalSettingsContext';

interface DropdownsStepProps {
  localSettings: AppSettings;
  setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

type DropdownFields = 'availableCategories' | 'availableAreas' | 'availableAmenities' | 'availableFurnishing' | 'availableLeadChannels';

export default function DropdownsStep({ localSettings, setLocalSettings }: DropdownsStepProps) {
  const [newCategory, setNewCategory] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newAmenity, setNewAmenity] = useState('');
  const [newFurnishing, setNewFurnishing] = useState('');
  const [newLeadChannel, setNewLeadChannel] = useState('');

  // Service Provider inputs
  const [gasName, setGasName] = useState('');
  const [gasContact, setGasContact] = useState('');
  const [coolingName, setCoolingName] = useState('');
  const [coolingContact, setCoolingContact] = useState('');
  const [internetName, setInternetName] = useState('');
  const [internetContact, setInternetContact] = useState('');

  type ServiceProviderFields = 'availableGasCompanies' | 'availableCoolingCompanies' | 'availableInternetProviders';

  const handleAddProvider = (
    field: ServiceProviderFields,
    name: string,
    contact: string,
    resetFn: () => void
  ) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    const cleanContact = contact.trim();
    
    const existing = localSettings[field] || [];
    if (existing.some(item => item.name.toLowerCase() === cleanName.toLowerCase())) {
      alert('This provider option already exists.');
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      [field]: [...existing, { name: cleanName, contact: cleanContact }]
    }));
    resetFn();
  };

  const handleRemoveProvider = (
    field: ServiceProviderFields,
    indexToRemove: number
  ) => {
    const existing = localSettings[field] || [];
    setLocalSettings(prev => ({
      ...prev,
      [field]: existing.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleAddOption = (
    field: DropdownFields,
    value: string,
    resetFn: (v: string) => void
  ) => {
    if (!value.trim()) return;
    const cleanVal = value.trim();
    if (localSettings[field]?.includes(cleanVal)) {
      alert('This option already exists.');
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), cleanVal]
    }));
    resetFn('');
  };

  const handleRemoveOption = (
    field: DropdownFields,
    indexToRemove: number
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, idx) => idx !== indexToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 text-zinc-900 dark:text-white pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <Settings className="text-brand shrink-0" size={20} style={{ color: localSettings.customBrandColor }} />
        <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">3. Variable Dropdowns Manager</h3>
      </div>

      <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Add and remove array variables dynamically used throughout the listing screens and main filters.</p>
      
      <div className="space-y-8">
        
        {/* Categories */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Categories / Types</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Add e.g. Studio, Loft, Chalet..."
            />
            <button
              type="button"
              onClick={() => handleAddOption('availableCategories', newCategory, setNewCategory)}
              className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: localSettings.customBrandColor }}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableCategories || []).map((cat, i) => (
              <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveOption('availableCategories', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Areas */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dubai Neighborhoods / Areas</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newArea}
              onChange={e => setNewArea(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Add e.g. Jumeirah Heights, Sufouh..."
            />
            <button
              type="button"
              onClick={() => handleAddOption('availableAreas', newArea, setNewArea)}
              className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: localSettings.customBrandColor }}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableAreas || []).map((area, i) => (
              <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                {area}
                <button
                  type="button"
                  onClick={() => handleRemoveOption('availableAreas', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Available Amenities List</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAmenity}
              onChange={e => setNewAmenity(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Add e.g. EV Charger, Private Elevator..."
            />
            <button
              type="button"
              onClick={() => handleAddOption('availableAmenities', newAmenity, setNewAmenity)}
              className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: localSettings.customBrandColor }}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto border border-zinc-100 dark:border-zinc-850 p-3 rounded-2xl bg-zinc-500/5">
            {(localSettings.availableAmenities || []).map((amen, i) => (
              <span key={amen} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-lg text-xs font-medium">
                {amen}
                <button
                  type="button"
                  onClick={() => handleRemoveOption('availableAmenities', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Furnishing */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Available Furnishing List</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFurnishing}
              onChange={e => setNewFurnishing(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Add e.g. Fully Furnished, Unfurnished, Semi-Furnished..."
            />
            <button
              type="button"
              onClick={() => handleAddOption('availableFurnishing', newFurnishing, setNewFurnishing)}
              className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: localSettings.customBrandColor }}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableFurnishing || []).map((furn, i) => (
              <span key={furn} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                {furn}
                <button
                  type="button"
                  onClick={() => handleRemoveOption('availableFurnishing', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Lead Channels */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Lead Channel Sources</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLeadChannel}
              onChange={e => setNewLeadChannel(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Add e.g. Property Finder, Bayut, Instagram, Referral..."
            />
            <button
              type="button"
              onClick={() => handleAddOption('availableLeadChannels', newLeadChannel, setNewLeadChannel)}
              className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
              style={{ backgroundColor: localSettings.customBrandColor }}
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableLeadChannels || []).map((chan, i) => (
              <span key={chan} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                {chan}
                <button
                  type="button"
                  onClick={() => handleRemoveOption('availableLeadChannels', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Separator / Sub-header */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850">
          <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider mb-1">Building Utilities Directories</h4>
          <p className="text-zinc-400 text-[11px]">Define standard service and utility dispatchers used throughout building profiles as quick selectable options.</p>
        </div>

        {/* Gas Companies */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Gas Network Companies</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={gasName}
              onChange={e => setGasName(e.target.value)}
              className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Company name e.g. Lootah Gas"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={gasContact}
                onChange={e => setGasContact(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="Contact standard e.g. 800 566824"
              />
              <button
                type="button"
                onClick={() => handleAddProvider('availableGasCompanies', gasName, gasContact, () => { setGasName(''); setGasContact(''); })}
                className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
                style={{ backgroundColor: localSettings.customBrandColor }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableGasCompanies || []).map((gas, i) => (
              <span key={gas.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                <span>{gas.name} <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px] ml-1">({gas.contact || 'No Phone'})</span></span>
                <button
                  type="button"
                  onClick={() => handleRemoveProvider('availableGasCompanies', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Cooling Companies */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">District Cooling Providers</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={coolingName}
              onChange={e => setCoolingName(e.target.value)}
              className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="Airco company e.g. Empower"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={coolingContact}
                onChange={e => setCoolingContact(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="Support dispatch e.g. 800 3676937"
              />
              <button
                type="button"
                onClick={() => handleAddProvider('availableCoolingCompanies', coolingName, coolingContact, () => { setCoolingName(''); setCoolingContact(''); })}
                className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
                style={{ backgroundColor: localSettings.customBrandColor }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableCoolingCompanies || []).map((cool, i) => (
              <span key={cool.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                <span>{cool.name} <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px] ml-1">({cool.contact || 'No Phone'})</span></span>
                <button
                  type="button"
                  onClick={() => handleRemoveProvider('availableCoolingCompanies', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Internet Providers */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Internet Providers</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={internetName}
              onChange={e => setInternetName(e.target.value)}
              className="px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
              placeholder="e.g. du, Etisalat"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={internetContact}
                onChange={e => setInternetContact(e.target.value)}
                className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
                placeholder="Helpline e.g. 101, 800 155"
              />
              <button
                type="button"
                onClick={() => handleAddProvider('availableInternetProviders', internetName, internetContact, () => { setInternetName(''); setInternetContact(''); })}
                className="px-4 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer hover:opacity-90 active:scale-95 transition-all shrink-0"
                style={{ backgroundColor: localSettings.customBrandColor }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1">
            {(localSettings.availableInternetProviders || []).map((net, i) => (
              <span key={net.name} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-200 rounded-xl text-xs font-semibold">
                <span>{net.name} <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px] ml-1">({net.contact || 'No Phone'})</span></span>
                <button
                  type="button"
                  onClick={() => handleRemoveProvider('availableInternetProviders', i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer font-extrabold text-[10px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
