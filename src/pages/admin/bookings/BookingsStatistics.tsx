import React from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { AdminBooking } from './types';
import CurrencySymbol from '../../../components/CurrencySymbol';

interface BookingsStatisticsProps {
  bookings: AdminBooking[];
}

export default function BookingsStatistics({ bookings }: BookingsStatisticsProps) {
  // Calculated summaries
  const totalBookingsCount = bookings.length;
  
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const activeCheckIns = bookings.filter(b => b.status === 'checked_in').length;
  const completedCount = bookings.filter(b => b.status === 'completed' || b.status === 'checked_out').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {/* Gross Revenue */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <DollarSign size={12} className="text-emerald-500" />
          <span>Active Revenue</span>
        </span>
        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-1 truncate">
          <CurrencySymbol size="0.9em" />
          <span>{totalRevenue.toLocaleString()}</span>
        </p>
      </div>

      {/* Confirmed / Stays checkins */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <Calendar size={12} className="text-blue-500" />
          <span>Current Stays</span>
        </span>
        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white">
          {activeCheckIns} <span className="text-xs text-zinc-405 font-bold">active</span>
        </p>
      </div>

      {/* Completed reservation stays */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <CheckCircle size={12} className="text-purple-500" />
          <span>Completed Stays</span>
        </span>
        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white">
          {completedCount} <span className="text-xs text-zinc-405 font-bold">stays</span>
        </p>
      </div>

      {/* Pending status waitings */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
        <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <Clock size={12} className="text-yellow-500" />
          <span>Holds & Pending</span>
        </span>
        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white">
          {pendingCount} <span className="text-xs text-zinc-405 font-bold">holds</span>
        </p>
      </div>

      {/* Cancelled reservations */}
      <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl col-span-2 md:col-span-1">
        <span className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider mb-2">
          <AlertCircle size={12} className="text-rose-500" />
          <span>Cancellations</span>
        </span>
        <p className="text-lg md:text-2xl font-black text-zinc-900 dark:text-white">
          {cancelledCount} <span className="text-xs text-zinc-405 font-bold">cancelled</span>
        </p>
      </div>
    </div>
  );
}
