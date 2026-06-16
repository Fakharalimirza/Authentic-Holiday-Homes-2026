import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step1Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  diffNights: number;
  statusColors: Record<string, string>;
  onNext: () => void;
}

export default function Step1ProfileVerification({
  booking,
  activeStep,
  selectedStepTab,
  diffNights,
  statusColors,
  onNext,
}: Step1Props) {
  if (selectedStepTab !== 1) return null;

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150-dark dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
            Step 1 / الخطوة الأولى
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Resident Profile Verification / تحقق من الملف التعريفي للنزيل
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Resident Occupant / اسم المقيم
          </span>
          <span className="block text-zinc-800 dark:text-zinc-200 mt-1 font-black leading-tight truncate">
            {booking.guestName}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Staying Check-In / تاريخ الدخول
          </span>
          <span className="block text-zinc-800 dark:text-zinc-200 mt-1 font-black leading-tight truncate font-mono">
            {booking.checkIn}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Staying Check-Out / تاريخ المغادرة
          </span>
          <span className="block text-zinc-800 dark:text-zinc-200 mt-1 font-black leading-tight truncate font-mono">
            {booking.checkOut}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Stay Duration / مدة الإقامة
          </span>
          <span className="block text-zinc-800 dark:text-zinc-200 mt-1 font-black leading-tight truncate">
            {diffNights} nights / {diffNights} ليالي
          </span>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150-dark dark:border-zinc-850 space-y-2 text-xs">
        <label className="text-[10px] uppercase text-zinc-400 font-extrabold block">
          Financial Structure / الهيكل المالي للحجز
        </label>
        <div className="flex justify-between text-zinc-500 font-extrabold pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
          <span>Base Monthly Rent / الإيجار الشهري الأساسي:</span>
          <span className="text-zinc-850 dark:text-zinc-150 font-black">
            AED {booking.rentPerMonth || (booking.totalPrice / (booking.billingMonths || 1))} / month
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-1 text-[11px] text-zinc-430 font-bold">
          <div>
            • DTCM Tourism Fee / رسوم السياحة: <span className="font-mono text-zinc-705 dark:text-zinc-350 font-black">AED {booking.dtcmFee || 0}</span>
          </div>
          <div>
            • Agency Commission / عمولة الوكالة: <span className="font-mono text-zinc-705 dark:text-zinc-350 font-black">AED {booking.agencyFee || 0}</span>
          </div>
          <div>
            • Security Deposit / مبلغ التأمين المسترد: <span className="font-mono text-zinc-705 dark:text-zinc-350 font-black">AED {booking.securityDeposit || 0}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full ${statusColors[booking.status]}`}>
          Status / حالة الحجز: {booking.status}
        </span>
        {activeStep === 1 ? (
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Next: Advance Desk / التالي: مكتب الدفع</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <span className="text-xs text-zinc-400 font-bold italic">
            Step 1 is completed / تم إكمال الخطوة الأولى. Active is Step {activeStep}
          </span>
        )}
      </div>
    </div>
  );
}
