import React from 'react';
import CurrencySymbol from '../../components/CurrencySymbol';

interface AdminStatsProps {
  stats: {
    totalRevenue: number;
    pendingBookings: number;
    activeProperties: number;
  };
}

export default function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Total Revenue</p>
        <p className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <CurrencySymbol size="0.8em" /> {stats.totalRevenue.toLocaleString()}
        </p>
      </div>
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Pending Approv.</p>
        <p className="text-3xl font-black text-zinc-900 dark:text-white">
          {stats.pendingBookings}
        </p>
      </div>
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-widest">Active Units</p>
        <p className="text-3xl font-black text-zinc-900 dark:text-white">
          {stats.activeProperties}
        </p>
      </div>
    </div>
  );
}
