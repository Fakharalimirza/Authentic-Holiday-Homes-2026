import React from 'react';
import { Shield } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="p-20 text-center flex flex-col items-center gap-4 animate-fade-in">
      <Shield size={64} className="text-zinc-350 dark:text-zinc-750 mb-4" />
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Access Restricted</h2>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
        Only registered hosts can access the Authentic Management Portal. Would you like to apply to become a host?
      </p>
      <button className="mt-4 px-8 py-3 bg-brand text-white rounded-full hover:bg-brand-hover hover:scale-[1.02] active:scale-[0.98] font-bold transition-all shadow-lg shadow-brand/20">
        Contact Support
      </button>
    </div>
  );
}
