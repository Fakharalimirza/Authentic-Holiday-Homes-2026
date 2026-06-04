import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { AMENITY_CATEGORIES, PropertyForm } from '../types';

interface PropertyFormStep3Props {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  availableAmenities?: string[];
}

export default function PropertyFormStep3({
  form,
  setForm,
  availableAmenities = []
}: PropertyFormStep3Props) {
  return (
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-xs font-sans"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-0.5 font-sans">Amenities & Comfort</h3>
        <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-sans">Select specialized premium options, luxury features, and shared community benefits.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white font-sans">Manage Comfort Options</h3>
          <div className="flex gap-2.5 items-center bg-zinc-50 dark:bg-zinc-955 px-3 py-1.5 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-sm font-sans">
            <button
              type="button"
              onClick={() => {
                const newAmenities: any = {};
                Object.entries(AMENITY_CATEGORIES).forEach(([cId, cItems]) => {
                  newAmenities[cId] = [...cItems];
                });
                newAmenities.customAmenities = [...availableAmenities];
                setForm(prev => ({
                  ...prev,
                  amenities: newAmenities
                }));
              }}
              className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
            >
              Select All
            </button>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => {
                const newAmenities: any = {};
                Object.keys(AMENITY_CATEGORIES).forEach(cId => {
                  newAmenities[cId] = [];
                });
                newAmenities.customAmenities = [];
                setForm(prev => ({
                  ...prev,
                  amenities: newAmenities
                }));
              }}
              className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:underline transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="space-y-6 max-h-[340px] overflow-y-auto px-1 no-scrollbar text-zinc-900 dark:text-white pb-4">
          {Object.entries({
            ...AMENITY_CATEGORIES,
            customAmenities: availableAmenities
          }).map(([catId, items]) => (
            <div key={catId} className="space-y-2">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {catId.replace(/([A-Z])/g, ' $1')}
                </h4>
                <div className="flex gap-1.5 items-center font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        amenities: {
                          ...prev.amenities,
                          [catId]: [...items]
                        }
                      }));
                    }}
                    className="text-[8px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[8px] text-zinc-300 dark:text-zinc-700 font-mono">/</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        amenities: {
                          ...prev.amenities,
                          [catId]: []
                        }
                      }));
                    }}
                    className="text-[8px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-550 dark:hover:text-zinc-300 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 font-sans">
                {items.map(item => (
                  <button 
                    key={item}
                    type="button"
                    onClick={() => {
                      const current = (form.amenities as any)[catId] || [];
                      const updated = current.includes(item) 
                        ? current.filter((i: string) => i !== item)
                        : [...current, item];
                      setForm(prev => ({
                        ...prev,
                        amenities: { ...prev.amenities, [catId]: updated }
                      }));
                    }}
                    className={`flex items-center gap-1.5 p-2 px-2.5 rounded-lg border text-[9px] font-bold uppercase tracking-tight transition-all text-left cursor-pointer ${
                      ((form.amenities as any)[catId] || []).includes(item)
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-500 hover:border-zinc-350 dark:hover:border-zinc-650'
                    }`}
                  >
                    {((form.amenities as any)[catId] || []).includes(item) ? (
                      <Check size={10} strokeWidth={4} className="shrink-0" />
                    ) : (
                      <Plus size={10} className="shrink-0 text-zinc-400" />
                    )}
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
