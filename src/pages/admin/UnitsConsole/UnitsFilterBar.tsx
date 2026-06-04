import React from 'react';
import { Search, Loader2, LayoutGrid, List } from 'lucide-react';

interface UnitsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function UnitsFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  loading,
  onRefresh
}: UnitsFilterBarProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          id="unit-search-input"
          placeholder="Search units by unit number, building name, landlord details, or unit type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-0 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-2">
        {['ALL', 'VACANT', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'].map(statusOption => (
          <button
            key={statusOption}
            id={`filter-unit-status-${statusOption}`}
            onClick={() => setStatusFilter(statusOption)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${
              statusFilter === statusOption
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-955 dark:hover:bg-zinc-900 text-zinc-550 dark:text-zinc-450'
            }`}
          >
            {statusOption}
          </button>
        ))}

        <button
          onClick={onRefresh}
          id="btn-refresh-units"
          className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-955 dark:hover:bg-zinc-900 text-zinc-500 rounded-xl transition-all cursor-pointer"
          title="Refresh List"
        >
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center border border-zinc-200 dark:border-zinc-805 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-955 ml-1">
          <button
            type="button"
            id="btn-view-grid"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-900 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-650'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-view-list"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-900 shadow-xs text-zinc-900 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-650'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
