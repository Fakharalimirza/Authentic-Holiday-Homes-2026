import React from 'react';
import { motion } from 'framer-motion';
import { PropertyForm } from '../types';

interface PropertyFormStep1Props {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  buildings: any[];
  landlords: any[];
  availableCategories: string[];
  availableFurnishing: string[];
  handleBuildingSelect: (buildingId: string) => void;
}

export default function PropertyFormStep1({
  form,
  setForm,
  buildings,
  landlords,
  availableCategories,
  availableFurnishing,
  handleBuildingSelect
}: PropertyFormStep1Props) {
  return (
    <motion.div 
      key="step-1"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 text-xs font-sans"
    >
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-0.5 font-sans">Basic Property Information</h3>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans">Start by setting up the title, category, and physical placement of your property listing.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Listing Title *</label>
          <input 
            type="text" 
            required
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
            placeholder="Burj Khalifa Penthouse"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Property Type *</label>
          <select 
            value={form.category}
            onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white font-sans text-xs"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Purpose</label>
          <select 
            value={form.purpose}
            onChange={e => setForm(prev => ({ ...prev, purpose: e.target.value as any }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs"
          >
            <option value="For Rent">For Rent</option>
            <option value="For Sale">For Sale</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Furnishing</label>
          <select 
            value={form.furnishing}
            onChange={e => setForm(prev => ({ ...prev, furnishing: e.target.value as any }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs"
          >
            {availableFurnishing.map((furn) => (
              <option key={furn} value={furn}>{furn}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Owner / Associated Landlord</label>
        <select 
          value={form.landlordId || ''}
          onChange={e => setForm(prev => ({ ...prev, landlordId: e.target.value }))}
          className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white font-sans text-xs"
        >
          <option value="">-- No select (Individual listing / Self-managed) --</option>
          {landlords.map((land) => (
            <option key={land.id} value={land.id}>
              {land.fullName} ({land.email})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Unit Number *</label>
          <input 
            type="text" 
            required
            value={form.unitNumber}
            onChange={e => setForm(prev => ({ ...prev, unitNumber: e.target.value }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
            placeholder="e.g. 101"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Building Name (Dropdown Select) *</label>
          <select
            value={form.buildingId || ''}
            onChange={e => handleBuildingSelect(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer text-zinc-900 dark:text-white text-xs font-bold font-sans"
          >
            <option value="">-- Custom Building / Manual Entry --</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city || 'Dubai'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MANUAL NAME AND MANUAL ADDRESS INPUT (shown if they choose '-- Custom Building --') */}
      {!form.buildingId && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Manual Building Name *</label>
            <input 
              type="text" 
              required
              value={form.buildingName}
              onChange={e => setForm(prev => ({ ...prev, buildingName: e.target.value }))}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white text-xs font-sans" 
              placeholder="e.g. Binghatti Avenue"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed Address (Dubai) *</label>
            <input 
              type="text" 
              required
              value={form.address}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white text-xs font-sans" 
              placeholder="e.g. Palm Jumeirah, Villa 45"
            />
          </div>
        </motion.div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description *</label>
        <textarea 
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={5}
          required
          className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white text-xs font-sans" 
          placeholder="Tell guests about your property..."
        />
      </div>
    </motion.div>
  );
}
