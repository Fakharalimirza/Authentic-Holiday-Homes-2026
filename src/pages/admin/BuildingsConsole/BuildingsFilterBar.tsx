import React from 'react';
import { Search, Loader2, LayoutGrid, List } from 'lucide-react';

interface BuildingsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  onRefresh: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

export default function BuildingsFilterBar({
  searchQuery,
  setSearchQuery,
  loading,
  onRefresh,
  viewMode,
  setViewMode
}: BuildingsFilterBarProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3 font-sans">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search buildings by name, company, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-0 text-xs rounded-xl text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-700 transition-all font-sans"
        />
      </div>
      <button
        onClick={onRefresh}
        className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-500 rounded-xl transition-all cursor-pointer"
        title="Refresh List"
      >
        <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin animate-infinite' : ''}`} />
      </button>

      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
          onClick={() => setViewMode('list')}
          className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
  );
}
