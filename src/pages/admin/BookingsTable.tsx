import React from 'react';
import { Check, X } from 'lucide-react';
import CurrencySymbol from '../../components/CurrencySymbol';

interface Booking {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestId: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | string;
}

interface BookingsTableProps {
  bookings: Booking[];
  updateBookingStatus: (id: string, status: string) => Promise<void>;
}

export default function BookingsTable({ bookings, updateBookingStatus }: BookingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-zinc-400 text-xs uppercase tracking-widest font-bold">
            <th className="px-6 py-4">Property</th>
            <th className="px-6 py-4">Dates</th>
            <th className="px-6 py-4">Guest</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="bg-white dark:bg-zinc-900 group">
              <td className="px-6 py-4 rounded-l-2xl font-bold text-zinc-900 dark:text-white">{b.propertyId}</td>
              <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-zinc-705 dark:text-zinc-350">{b.guestId.slice(0, 8)}...</td>
              <td className="px-6 py-4 text-right font-bold text-zinc-600 dark:text-zinc-300">
                <span className="inline-flex items-center justify-end gap-1">
                  <CurrencySymbol size="1.1em" /> {b.totalPrice}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  b.status === 'confirmed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 
                  b.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                }`}>
                  {b.status}
                </span>
              </td>
              <td className="px-6 py-4 rounded-r-2xl">
                <div className="flex gap-2">
                  <button 
                    title="Confirm Booking"
                    type="button"
                    onClick={() => updateBookingStatus(b.id, 'confirmed')} 
                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-lg transition-colors"
                  >
                    <Check size={16}/>
                  </button>
                  <button 
                    title="Cancel Booking"
                    type="button"
                    onClick={() => updateBookingStatus(b.id, 'cancelled')} 
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  >
                    <X size={16}/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && (
        <div className="text-center py-20 text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 uppercase tracking-widest text-xs font-bold">
          No active bookings
        </div>
      )}
    </div>
  );
}
