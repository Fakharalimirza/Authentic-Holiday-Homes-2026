import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Property } from '../../../types';
import { AdminBooking } from './types';

interface BlockedDatesManagerProps {
  properties: Property[];
  existingBookings: AdminBooking[];
  onAddBlock: (blockData: { propertyId: string; checkIn: string; checkOut: string; notes: string }) => Promise<void>;
  onRemoveBlock: (id: string) => Promise<void>;
}

export default function BlockedDatesManager({
  properties,
  existingBookings,
  onAddBlock,
  onRemoveBlock
}: BlockedDatesManagerProps) {
  const [propertyId, setPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sift out actual blocked date itineraries
  const blockedDatesBookings = existingBookings.filter(b => 
    b.guestName.includes('📅 BLOCKED DATES') && b.status !== 'cancelled'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!propertyId || !checkIn || !checkOut) {
      setErrorMsg('Please complete all form fields');
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (end <= start) {
      setErrorMsg('Check-out date must succeed check-in date');
      return;
    }

    // Overlap validation
    const overlap = existingBookings.find(b => {
      if (b.propertyId !== propertyId || b.status === 'cancelled') return false;
      const bStart = new Date(b.checkIn);
      const bEnd = new Date(b.checkOut);
      return start < bEnd && end > bStart;
    });

    if (overlap) {
      setErrorMsg(`Overlap warning: Conflict exists with guest ${overlap.guestName} (${overlap.status})`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddBlock({
        propertyId,
        checkIn,
        checkOut,
        notes: notes || 'General maintenance block'
      });
      setSuccessMsg(`Perfectly blocked date span from ${checkIn} to ${checkOut}!`);
      // Reset
      setPropertyId('');
      setCheckIn('');
      setCheckOut('');
      setNotes('');
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Form to add blocks */}
      <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl h-fit">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
          <ShieldAlert className="text-brand h-4 w-4" />
          <span>Lock Date Span</span>
        </h3>
        <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mb-6">
          Instruct our system to block a listing unit from any guest bookings. Ideal for cleaning, renovations, or private host usage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/25 border border-rose-100 dark:border-rose-900 rounded-xl text-[10px] font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-50 dark:bg-green-950/25 border border-green-100 dark:border-green-900 rounded-xl text-[10px] font-bold text-green-600">
              {successMsg}
            </div>
          )}

          {/* Unit selection */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Select Property</label>
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-brand outline-none"
            >
              <option value="">-- Choose Unit --</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.referenceNo || p.id.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          {/* Dates checkin checkout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Block Start</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Block End</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
          </div>

          {/* Reason notes */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">Reason/Block Notes</label>
            <input
              type="text"
              placeholder="e.g. Host family visit, pipe leakage..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-brand outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-black text-xs uppercase rounded-xl tracking-wider transition-all"
          >
            {isSubmitting ? 'Securing Block...' : 'Establish Block'}
          </button>
        </form>
      </div>

      {/* 2. List of current blocks */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-2 flex items-center gap-1.5">
          <Calendar className="text-purple-500 h-4 w-4" />
          <span>Active Calendar blocks</span>
        </h3>
        <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed mb-6">
          Review established calendar blocks and clear them when vacancy needs to be open again.
        </p>

        <div className="space-y-3 overflow-y-auto max-h-[350px]">
          {blockedDatesBookings.map(b => {
            const correspondingUnit = properties.find(p => p.id === b.propertyId);
            return (
              <div 
                key={b.id}
                className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-between border border-zinc-150 dark:border-zinc-850 group hover:border-brand/20 dark:hover:border-brand/20 transition-all duration-300"
              >
                <div>
                  <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-150">
                    {correspondingUnit?.title || b.propertyTitle || 'Unknown Unit'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                    Dates: <span className="text-zinc-650 dark:text-zinc-350">{b.checkIn}</span> to <span className="text-zinc-650 dark:text-zinc-350">{b.checkOut}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1 italic">
                    Reason: {b.notes || 'System reservation block'}
                  </p>
                </div>

                <button
                  type="button"
                  title="Remove Block"
                  onClick={() => onRemoveBlock(b.id)}
                  className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/15 rounded-xl transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}

          {blockedDatesBookings.length === 0 && (
            <div className="py-12 text-center uppercase text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl tracking-widest">
              No active blocked spans found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
