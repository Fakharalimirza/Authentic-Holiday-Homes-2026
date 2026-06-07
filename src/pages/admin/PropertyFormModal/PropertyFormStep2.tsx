import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { PropertyForm } from '../types';

interface PropertyFormStep2Props {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  uploadingStates: { [key: string]: 'uploading' | 'completed' | 'error' };
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  moveImage: (index: number, direction: 'left' | 'right') => void;
}

export default function PropertyFormStep2({
  form,
  setForm,
  uploadingStates,
  handleFileChange,
  moveImage
}: PropertyFormStep2Props) {
  
  const handleDeleteImage = (indexToDelete: number) => {
    setForm(prev => {
      const avif = prev.imageUrls.avif.filter((_, i) => i !== indexToDelete);
      const webp = prev.imageUrls.webp.filter((_, i) => i !== indexToDelete);
      const png = prev.imageUrls.png.filter((_, i) => i !== indexToDelete);
      return {
        ...prev,
        imageUrls: { avif, webp, png }
      };
    });
  };

  return (
    <motion.div 
      key="step-2"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-xs font-sans"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-0.5 font-sans">Space, Pricing & Media</h3>
        <p className="text-[11px] text-zinc-550 dark:text-zinc-400 font-sans">Provide pricing, general layout details, capacity settings, and upload listing images.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price (AED/Night) *</label>
          <input 
            type="number" 
            required
            value={form.price || ''}
            onChange={e => setForm(prev => ({ ...prev, price: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Price (AED/Month)</label>
          <input 
            type="number" 
            value={form.priceMonthly || ''}
            onChange={e => setForm(prev => ({ ...prev, priceMonthly: Number(e.target.value) || 0 }))}
            placeholder="Optional monthly rate"
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs placeholder-zinc-400 dark:placeholder-zinc-550" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Size (sqft)</label>
          <input 
            type="number" 
            value={form.size || ''}
            onChange={e => setForm(prev => ({ ...prev, size: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Min Stay Nights</label>
          <input 
            type="number" 
            value={form.minimumNights || ''}
            onChange={e => setForm(prev => ({ ...prev, minimumNights: Number(e.target.value) }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bedrooms</label>
          <input 
            type="number" 
            value={form.bedrooms} 
            onChange={e => setForm(prev => ({ ...prev, bedrooms: Number(e.target.value) }))} 
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Bathrooms</label>
          <input 
            type="number" 
            value={form.bathrooms} 
            onChange={e => setForm(prev => ({ ...prev, bathrooms: Number(e.target.value) }))} 
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Guests</label>
          <input 
            type="number" 
            value={form.maxGuests} 
            onChange={e => setForm(prev => ({ ...prev, maxGuests: Number(e.target.value) }))} 
            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white font-sans text-xs" 
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Property Images</label>
        <div className="relative group">
          <input 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
          />
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-zinc-455 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-colors bg-zinc-50 dark:bg-zinc-950/40">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 group-hover:text-zinc-650 transition-colors border border-zinc-100 dark:border-zinc-850">
              <Upload size={18} />
            </div>
            <div className="text-center font-sans">
              <p className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Click or Drag images here</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-widest font-black">Max 10 images • Automated webp compression</p>
            </div>
          </div>
        </div>
        
        {/* Image Preview Grid */}
        {((form.imageUrls.webp && form.imageUrls.webp.length > 0)) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {form.imageUrls.webp.map((url, i) => (
              <div key={url || i} className="aspect-square relative rounded-xl overflow-hidden group border border-zinc-150 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-850 shadow-xs">
                <img src={url} alt="" className="w-full h-full object-cover" />
                
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-mono font-bold rounded z-10">
                  #{i + 1}
                </div>

                <div className="absolute top-1 right-1 p-1 bg-emerald-500 text-white rounded-full shadow-lg z-10">
                  <Check size={8} />
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                  <button 
                    type="button"
                    disabled={i === 0}
                    onClick={(e) => {
                      e.preventDefault();
                      moveImage(i, 'left');
                    }}
                    className="p-1 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                    title="Move Left"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    type="button"
                    disabled={i === form.imageUrls.webp.length - 1}
                    onClick={(e) => {
                      e.preventDefault();
                      moveImage(i, 'right');
                    }}
                    className="p-1 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white cursor-pointer"
                    title="Move Right"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteImage(i);
                    }}
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 cursor-pointer"
                    title="Delete Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
