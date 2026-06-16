import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { PropertyForm } from '../types';
import RichTextEditor from '../../../components/RichTextEditor';

interface PropertyFormStep1Props {
  form: PropertyForm;
  setForm: React.Dispatch<React.SetStateAction<PropertyForm>>;
  buildings: any[];
  landlords: any[];
  availableCategories: string[];
  availableFurnishing: string[];
  handleBuildingSelect: (buildingId: string) => void;
}

interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  emptyMessage?: string;
}

function SearchableSelect({
  id,
  label,
  options,
  selectedValue,
  onSelect,
  placeholder,
  emptyMessage = "No results found"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = options.filter(option => {
    const term = searchQuery.toLowerCase();
    const lMatch = option.label.toLowerCase().includes(term);
    const sMatch = option.sublabel?.toLowerCase().includes(term) || false;
    return lMatch || sMatch;
  });

  const selectedOption = options.find(o => o.value === selectedValue);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      
      {/* Selector Trigger Button */}
      <button
        id={`btn-${id}`}
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-left text-zinc-900 dark:text-white font-sans text-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer"
      >
        <span className="truncate mr-2">
          {selectedOption ? (
            <span className="font-semibold">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-zinc-400 dark:text-zinc-500 font-normal ml-1 text-[11px]">
                  ({selectedOption.sublabel})
                </span>
              )}
            </span>
          ) : (
            <span className="text-zinc-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className="text-zinc-400 shrink-0 ml-auto" />
      </button>

      {/* Floating Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl shadow-xl overflow-hidden font-sans flex flex-col max-h-72"
          >
            {/* Search Input field inside Dropdown */}
            <div className="relative border-b border-zinc-100 dark:border-zinc-800 p-2 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                id={`search-input-${id}`}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-8 py-2 bg-zinc-55 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* List Options */}
            <div className="overflow-y-auto py-1 divide-y divide-zinc-50/50 dark:divide-zinc-805/40 no-scrollbar max-h-52">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <button
                      key={opt.value}
                      id={`opt-${id}-${opt.value || 'empty'}`}
                      type="button"
                      onClick={() => {
                        onSelect(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors ${
                        isSelected 
                          ? 'bg-zinc-50/80 dark:bg-zinc-800 text-zinc-900 dark:text-white font-extrabold' 
                          : 'text-zinc-700 dark:text-zinc-355'
                      }`}
                    >
                      <div className="truncate flex-1 pr-4">
                        <span className="truncate block font-semibold">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal truncate block mt-0.5">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={12} className="text-zinc-900 dark:text-zinc-100 shrink-0 ml-2" strokeWidth={3} />
                      )}
                    </button>
                  );
                })
              ) : (
                <div id={`no-results-${id}`} className="px-4 py-4 text-center text-zinc-400 dark:text-zinc-500 italic text-[11px]">
                  {emptyMessage}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  // Option Map for Owners / Landlords list
  const landlordOptions: DropdownOption[] = [
    { value: "", label: "-- No select (Individual listing / Self-managed) --" },
    ...landlords.map(land => ({
      value: land.id,
      label: land.fullName || 'Unnamed Landlord',
      sublabel: land.email
    }))
  ];

  // Option Map for Buildings list
  const buildingOptions: DropdownOption[] = [
    { value: "", label: "-- Custom Building / Manual Entry --" },
    ...buildings.map(b => ({
      value: b.id,
      label: b.name || 'Unnamed Building',
      sublabel: b.city ? `${b.city} (Area: ${b.area || 'N/A'})` : 'Dubai'
    }))
  ];

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
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs" 
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Listing Status</label>
          <select 
            value={form.status || 'live'}
            onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-808 rounded-xl focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white font-sans text-xs"
          >
            <option value="live">🟢 Live Listing</option>
            <option value="draft">🟡 Draft Mode</option>
          </select>
        </div>
      </div>

      {/* SEARCHABLE LANDLORD LIST SELECT */}
      <SearchableSelect
        id="landlord"
        label="Owner / Associated Landlord"
        options={landlordOptions}
        selectedValue={form.landlordId || ''}
        onSelect={val => setForm(prev => ({ ...prev, landlordId: val }))}
        placeholder="Search landlord email or name..."
        emptyMessage="No matching landlords found"
      />

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

        {/* SEARCHABLE BUILDING LIST SELECT */}
        <SearchableSelect
          id="building"
          label="Building Name (Dropdown Select) *"
          options={buildingOptions}
          selectedValue={form.buildingId || ''}
          onSelect={handleBuildingSelect}
          placeholder="Search corporate building..."
          emptyMessage="No matching buildings found"
        />
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

      <div className="pt-2">
        <RichTextEditor 
          value={form.description}
          onChange={val => setForm(prev => ({ ...prev, description: val }))}
          rows={6}
          required
          label="Description"
          placeholder="Tell guests about your property..."
        />
      </div>
    </motion.div>
  );
}
