import React, { useState } from 'react';
import { Edit, Trash2, Plus, ArrowRight, Loader2, LayoutGrid, List } from 'lucide-react';
import CurrencySymbol from '../../components/CurrencySymbol';
import { Property } from '../../types';
import Pagination from '../../components/Pagination';

interface PropertiesTableProps {
  loading: boolean;
  properties: Property[];
  toggleAvailability: (id: string, current: boolean) => Promise<void>;
  handleEdit: (p: Property) => void;
  handleDuplicate: (p: Property) => void;
  setConfirmDeleteId: (id: string) => void;
  deletingId: string | null;
}

export default function PropertiesTable({
  loading,
  properties,
  toggleAvailability,
  handleEdit,
  handleDuplicate,
  setConfirmDeleteId,
  deletingId
}: PropertiesTableProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [properties.length]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">No units match your search</p>
      </div>
    );
  }

  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = properties.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      {/* View Mode Toggle Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-zinc-400 font-extrabold uppercase tracking-widest pl-1">
          Registered Units Directory ({properties.length} Active Listings)
        </span>
        <div className="flex items-center border border-zinc-250 dark:border-zinc-800 rounded-xl p-1 bg-zinc-50 dark:bg-zinc-950 shadow-xs">
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

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 gap-4">
          {paginatedProperties.map(p => (
            <div 
              key={p.id} 
              className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-hover hover:border-zinc-300 dark:hover:hover:border-zinc-700"
            >
              <img 
                src={p.images?.webp?.[0] || 'https://via.placeholder.com/300x300?text=Listing'} 
                className="w-full md:w-32 h-32 object-cover rounded-xl bg-zinc-100 dark:bg-zinc-800" 
                alt={p.title || 'Property representation'} 
              />
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{p.title}</h3>
                  <span className={`w-2 h-2 rounded-full ${p.isAvailable ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(34,197,94,0.4)]`} />
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                    {p.category}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded text-brand">
                    {p.referenceNo}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-405 mt-2">{p.location?.address}</p>
              </div>
              <div className="text-center md:text-right px-4">
                <p className="font-bold text-zinc-650 dark:text-zinc-350 flex items-center justify-center md:justify-end gap-1">
                  <CurrencySymbol size="1.1em" /> {p.price}
                </p>
                <button 
                  type="button"
                  onClick={() => toggleAvailability(p.id, !!p.isAvailable)}
                  className={`text-[10px] uppercase font-bold mt-1 px-3 py-1 rounded-full border transition-all ${
                    p.isAvailable 
                      ? 'text-green-500 border-green-200 bg-green-50 dark:bg-green-905/10' 
                      : 'text-red-500 border-red-200 bg-red-50 dark:bg-red-905/10'
                  }`}
                >
                  {p.isAvailable ? 'Available' : 'Booked'}
                </button>
              </div>
              <div className="flex gap-2 p-2">
                <button 
                  type="button"
                  title="View Property"
                  onClick={() => window.open(`/property/${p.id}`, '_blank')}
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <ArrowRight size={18} />
                </button>
                <button 
                  type="button"
                  title="Edit" 
                  onClick={() => handleEdit(p)} 
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
                >
                  <Edit size={18} />
                </button>
                <button 
                  type="button"
                  title="Duplicate" 
                  onClick={() => handleDuplicate(p)} 
                  className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-650 dark:text-zinc-400"
                >
                  <Plus size={18} />
                </button>
                <button 
                  type="button"
                  title="Delete" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirmDeleteId(p.id);
                  }} 
                  disabled={deletingId === p.id}
                  className="p-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                >
                  {deletingId === p.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProperties.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative">
                  <img
                    src={p.images?.webp?.[0] || 'https://via.placeholder.com/300x300?text=Listing'}
                    className="w-full h-44 object-cover bg-zinc-100 dark:bg-zinc-800"
                    alt={p.title || 'Property representation'}
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${p.isAvailable ? 'bg-green-500' : 'bg-red-500'} ring-4 ring-white dark:ring-zinc-900`} />
                  </div>
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 pb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-950/75 backdrop-blur-xs px-2 py-0.5 rounded text-white border border-white/10">
                      {p.category}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-brand px-2 py-0.5 rounded text-white shadow-sm">
                      {p.referenceNo}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate" title={p.title}>{p.title}</h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{p.location?.address}</p>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-105 dark:border-zinc-850">
                    <span className="text-[10px] uppercase font-bold text-zinc-450 tracking-wider">Per Month Rent:</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-100 text-xs flex items-center gap-1 font-sans">
                      <CurrencySymbol size="1.1em" /> {p.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-zinc-50 dark:border-zinc-850 mt-1 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold select-none">Listing Plan:</span>
                  <button 
                    type="button"
                    onClick={() => toggleAvailability(p.id, !!p.isAvailable)}
                    className={`text-[9.5px] uppercase font-bold px-2.5 py-1 rounded-full border transition-all ${
                      p.isAvailable 
                        ? 'text-green-500 border-green-200 bg-green-50 dark:bg-green-950/20' 
                        : 'text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20'
                    }`}
                  >
                    {p.isAvailable ? 'Available' : 'Booked'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button 
                    type="button"
                    title="View Property"
                    onClick={() => window.open(`/property/${p.id}`, '_blank')}
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400 flex items-center justify-center cursor-pointer"
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button 
                    type="button"
                    title="Edit" 
                    onClick={() => handleEdit(p)} 
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400 flex items-center justify-center cursor-pointer"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    type="button"
                    title="Duplicate" 
                    onClick={() => handleDuplicate(p)} 
                    className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-650 dark:text-zinc-400 flex items-center justify-center cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    type="button"
                    title="Delete" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmDeleteId(p.id);
                    }} 
                    disabled={deletingId === p.id}
                    className="p-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {deletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Elegant Universal Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={properties.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
