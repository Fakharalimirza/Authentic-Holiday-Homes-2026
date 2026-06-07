import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarPopoverProps {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  onDatesChange: (checkIn: string, checkOut: string) => void;
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  inline?: boolean;
}

export default function CalendarPopover({
  checkIn,
  checkOut,
  onDatesChange,
  isOpen,
  onClose,
  lang = 'en',
  inline = false
}: CalendarPopoverProps) {
  // Use May 2026 as the baseline current date based on user local time
  const today = useMemo(() => new Date('2026-05-20'), []);
  
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (checkIn) {
      const d = new Date(checkIn);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(2026, 4, 1); // May 2026
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const weekDaysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekDaysAr = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const monthName = lang === 'ar' ? monthNamesAr[month] : monthNamesEn[month];
  const weekDays = lang === 'ar' ? weekDaysAr : weekDaysEn;

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0-6)
    const totalDays = new Date(year, month + 1, 0).getDate(); // Last day of month
    
    const days: (Date | null)[] = [];
    
    // Empty offsets
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    
    return days;
  }, [year, month]);

  const getLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleDayClick = (date: Date) => {
    const dateStr = getLocalDateStr(date); // YYYY-MM-DD
    
    if (!checkIn || (checkIn && checkOut)) {
      onDatesChange(dateStr, '');
    } else {
      const start = new Date(checkIn + 'T00:00:00');
      if (date < start) {
        onDatesChange(dateStr, '');
      } else {
        onDatesChange(checkIn, dateStr);
        // Automatically close shortly after setting both dates for smooth UX
        setTimeout(() => {
          onClose();
        }, 300);
      }
    }
  };

  const isSelected = (date: Date) => {
    const dateStr = getLocalDateStr(date);
    return dateStr === checkIn || dateStr === checkOut;
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    const dateStr = getLocalDateStr(date);
    return dateStr > checkIn && dateStr < checkOut;
  };

  const isPast = (date: Date) => {
    // Zero out hours to compare only year, month, date
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < t;
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    // Don't go past the target starting baseline 
    if (year === 2026 && month <= 4) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  if (!isOpen) return null;

  const content = (
    <motion.div 
      initial={inline ? { opacity: 0, height: 0, scale: 0.98 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={inline ? { opacity: 1, height: 'auto', scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={inline ? { opacity: 0, height: 0, scale: 0.98 } : { opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`relative z-10 overflow-hidden ${
        inline 
          ? 'w-full bg-zinc-50 dark:bg-zinc-900/40 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl p-5 shadow-inner mt-2' 
          : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl'
      }`}
    >
      <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200 text-xs uppercase tracking-wider">
          <CalendarIcon size={14} className="text-brand" />
          <span>{lang === 'ar' ? 'اختر التواريخ' : 'Select Dates'}</span>
        </div>
        <button 
          type="button" 
          onClick={onClose}
          className="p-1 rounded-full text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Month Selector Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={year === 2026 && month <= 4}
          className={`p-1.5 rounded-full border border-zinc-150 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${year === 2026 && month <= 4 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-xs uppercase font-black tracking-widest text-zinc-900 dark:text-white px-2">
          {monthName} {year}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-full border border-zinc-150 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-zinc-400 mb-2">
        {weekDays.map((w, idx) => (
          <div key={idx} className="w-8 h-8 flex items-center justify-center">
            {w}
          </div>
        ))}
      </div>

      {/* Grid days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="w-8 h-8" />;
          
          const isSel = isSelected(day);
          const inRng = isInRange(day);
          const isPst = isPast(day);
          const dateStr = getLocalDateStr(day);
          const isChIn = dateStr === checkIn;
          const isChOut = dateStr === checkOut;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPst}
              onClick={() => handleDayClick(day)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center relative ${
                isPst 
                  ? 'text-zinc-350 dark:text-zinc-700 cursor-not-allowed line-through' 
                  : isSel 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 scale-105 z-10 font-bold shadow-md' 
                  : inRng
                  ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-light rounded-none'
                  : 'text-zinc-850 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {/* Connecting styling visual feedback */}
              {inRng && (
                <div className="absolute inset-y-0 -left-1 -right-1 bg-brand/10 dark:bg-brand/20 -z-10 pointer-events-none" />
              )}
              {isChIn && checkOut && (
                <div className="absolute inset-y-0 right-0 left-1/2 bg-brand/10 dark:bg-brand/20 -z-10 pointer-events-none" />
              )}
              {isChOut && (
                <div className="absolute inset-y-0 left-0 right-1/2 bg-brand/10 dark:bg-brand/20 -z-10 pointer-events-none" />
              )}
              <span className="relative z-10">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-zinc-400">
        <div>May 20, 2026 Baseline</div>
        <button 
          type="button" 
          onClick={() => onDatesChange('', '')}
          className="text-rose-500 hover:text-rose-600 transition-colors"
        >
          {lang === 'ar' ? 'مسح' : 'Clear'}
        </button>
      </div>
    </motion.div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-3 z-50">
      {/* Backdrop for click-away detection */}
      <div className="fixed inset-0 z-0" onClick={onClose} />
      {content}
    </div>
  );
}
