import React from 'react';
import { Search, Filter, RefreshCcw, Plus, SlidersHorizontal } from 'lucide-react';
import { BookingFiltersState } from './types';
import { Property } from '../../../types';

interface BookingsFiltersProps {
  filters: BookingFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<BookingFiltersState>>;
  properties: Property[];
  onAddNewManualBooking: () => void;
}

export default function BookingsFilters({
  filters,
  setFilters,
  properties,
  onAddNewManualBooking
}: BookingsFiltersProps) {
  
  // Reset all filters back to default
  const handleReset = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      propertyId: 'all',
      source: 'all'
    });
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 p-6 rounded-3xl mb-8 space-y-4">
      {/* Top row: search bar & manual trigger */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search guest name, phone, email, or property ID..."
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
          />
        </div>
        
        <button
          type="button"
          onClick={onAddNewManualBooking}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-brand/20"
        >
          <Plus size={16} />
          <span>Manual Intake</span>
        </button>
      </div>

      {/* Bottom row: advanced filter controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-widest shrink-0">
            <SlidersHorizontal size={12} />
            <span>Refine BY:</span>
          </span>

          {/* Status Filter Dropdown */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-brand outline-none"
          >
            <option value="all">ANY STATUS</option>
            <option value="pending">PENDING</option>
            <option value="confirmed">CONFIRMED</option>
            <option value="checked_in">CHECKED IN</option>
            <option value="checked_out">CHECKED OUT</option>
            <option value="completed">COMPLETED</option>
            <option value="cancelled">CANCELLED</option>
          </select>

          {/* Property Selector */}
          <select
            value={filters.propertyId}
            onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
            className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-brand outline-none max-w-xs"
          >
            <option value="all">ALL UNITS</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.title.length > 25 ? `${p.title.substring(0, 25)}...` : p.title} ({p.referenceNo || p.id.slice(0,6)})
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={filters.source}
            onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
            className="px-4 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-brand outline-none"
          >
            <option value="all">ANY ACQUISITION SOURCE</option>
            <option value="direct">DIRECT BOOKING</option>
            <option value="whatsapp">WHATSAPP CHAT</option>
            <option value="airbnb">AIRBNB PORTAL</option>
            <option value="booking.com">BOOKING.COM</option>
            <option value="other">OTHER CHANNELS</option>
          </select>
        </div>

        {/* Action: Clear refinement filters */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-bold transition-colors uppercase tracking-widest"
        >
          <RefreshCcw size={12} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
