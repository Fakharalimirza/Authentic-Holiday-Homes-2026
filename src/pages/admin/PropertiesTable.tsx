import React from 'react';
import { Edit, Trash2, Plus, ArrowRight, Loader2 } from 'lucide-react';
import CurrencySymbol from '../../components/CurrencySymbol';
import { Property } from '../../types';

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

  return (
    <div className="grid grid-cols-1 gap-4">
      {properties.map(p => (
        <div 
          key={p.id} 
          className="flex flex-col md:flex-row items-center gap-6 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-hover hover:border-zinc-300 dark:hover:border-zinc-700"
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
              className="p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
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
  );
}
