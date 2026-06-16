import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step4Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  onSave: (payload: {
    stayDecision: 'checkout' | 'renew' | 'extend';
    renewalNewCheckOut?: string;
    renewalNewRentPerMonth?: number;
    renewalContractSigned?: boolean;
    extensionNewCheckOut?: string;
    extensionRate?: number;
    extensionPaperworkSigned?: boolean;
  }) => Promise<void>;
}

export default function Step4StayDecision({
  booking,
  activeStep,
  selectedStepTab,
  onSave,
}: Step4Props) {
  const [stayDecision, setStayDecision] = useState<'checkout' | 'renew' | 'extend'>(booking.stayDecision || 'checkout');
  
  // States if renew
  const [renewDate, setRenewDate] = useState<string>(booking.renewalNewCheckOut || booking.checkOut);
  const [renewRent, setRenewRent] = useState<number>(booking.renewalNewRentPerMonth || booking.rentPerMonth || 1000);
  const [renewContractSigned, setRenewContractSigned] = useState<boolean>(booking.renewalContractSigned || false);

  // States if extend
  const [extendDate, setExtendDate] = useState<string>(booking.extensionNewCheckOut || booking.checkOut);
  const [extendRate, setExtendRate] = useState<number>(booking.extensionRate || 100);
  const [extendSigned, setExtendSigned] = useState<boolean>(booking.extensionPaperworkSigned || false);

  if (selectedStepTab !== 4) return null;

  const handleSave = () => {
    onSave({
      stayDecision,
      ...(stayDecision === 'renew' ? {
        renewalNewCheckOut: renewDate,
        renewalNewRentPerMonth: renewRent,
        renewalContractSigned: renewContractSigned,
      } : {}),
      ...(stayDecision === 'extend' ? {
        extensionNewCheckOut: extendDate,
        extensionRate: extendRate,
        extensionPaperworkSigned: extendSigned,
      } : {}),
    });
  };

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150-dark dark:border-zinc-800">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Step 4 / الخطوة الرابعة
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Stay Modification & Decision Center / قرار استمرار الإقامة أو الخروج والمغادرة
          </span>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850 text-xs space-y-3">
        <label className="block text-[10px] uppercase font-black text-zinc-400 tracking-wider">
          Itinerary Stay Decision / قرار البقاء والمغادرة
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Scheduled Exit */}
          <label className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl flex items-center gap-2.5 font-bold cursor-pointer hover:border-brand/50 transition-colors">
            <input 
              type="radio" 
              name="stay_decision" 
              value="checkout"
              checked={stayDecision === 'checkout'}
              onChange={() => setStayDecision('checkout')}
              disabled={booking.workflowStep !== 4}
              className="w-4.5 h-4.5 text-zinc-900 dark:text-white dark:bg-zinc-950 focus:ring-zinc-800 cursor-pointer"
            />
            <div>
              <span className="block font-black text-zinc-850 dark:text-zinc-150">
                Scheduled Exit / المغادرة المقررة
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
                Proceed directly to exit inspection / المضي بتسجيل الخروج المجدول
              </span>
            </div>
          </label>

          {/* Option 2: Renew Stay */}
          <label className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl flex items-center gap-2.5 font-bold cursor-pointer hover:border-brand/50 transition-colors">
            <input 
              type="radio" 
              name="stay_decision" 
              value="renew"
              checked={stayDecision === 'renew'}
              onChange={() => setStayDecision('renew')}
              disabled={booking.workflowStep !== 4}
              className="w-4.5 h-4.5 text-zinc-900 dark:text-white dark:bg-zinc-950 focus:ring-zinc-800 cursor-pointer"
            />
            <div>
              <span className="block font-black text-indigo-650 dark:text-indigo-400">
                Renew Stay / تجديد العقد
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
                Lease for 1 Month or more / التجديد بعقد شهري أو سنوي إضافي
              </span>
            </div>
          </label>

          {/* Option 3: Extend Stay */}
          <label className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl flex items-center gap-2.5 font-bold cursor-pointer hover:border-brand/50 transition-colors">
            <input 
              type="radio" 
              name="stay_decision" 
              value="extend"
              checked={stayDecision === 'extend'}
              onChange={() => setStayDecision('extend')}
              disabled={booking.workflowStep !== 4}
              className="w-4.5 h-4.5 text-zinc-900 dark:text-white dark:bg-zinc-950 focus:ring-zinc-800 cursor-pointer"
            />
            <div>
              <span className="block font-black text-emerald-650 dark:text-emerald-450">
                Extend Stay / تمديد الإقامة قصيرة
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 block">
                Short daily-rate padding / التمديد على سعر يومي متفق عليه
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Dynamic displays predicated on decision */}
      <AnimatePresence mode="wait">
        {stayDecision === 'checkout' && (
          <motion.div 
            key="checkout-info"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs space-y-1 font-bold text-zinc-500"
          >
            <span className="text-[10px] uppercase font-black text-zinc-450 block mb-1">
              Itinerary Exit Schedule / جدول تسليم الغرفة والمغادرة
            </span>
            <p className="leading-relaxed">
              Exit dates are locked on <span className="text-zinc-800 dark:text-zinc-100 font-extrabold">{booking.checkOut}</span>. At the departure point, administrative staff will compile comparison check-out notes based on physical check-in metrics.
            </p>
          </motion.div>
        )}

        {stayDecision === 'renew' && (
          <motion.div 
            key="renew-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-950 rounded-2xl text-xs space-y-4"
          >
            <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider block">
              Stay Renewal Ledger Configuration / تفاصيل تجديد مدة الإقامة والقيمة المالية
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
                  New Scheduled Check-Out Date / تاريخ المغادرة الجديد بعد التجديد
                </label>
                <input 
                  type="date" 
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  disabled={booking.workflowStep !== 4}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
                  Supplementary Rent (AED / Month) / قيمة الإيجار الشهري الجديد
                </label>
                <input 
                  type="number" 
                  value={renewRent}
                  onChange={(e) => setRenewRent(Number(e.target.value))}
                  disabled={booking.workflowStep !== 4}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-1.5 pt-1 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={renewContractSigned}
                onChange={(e) => setRenewContractSigned(e.target.checked)}
                disabled={booking.workflowStep !== 4}
                className="w-4 h-4 text-brand bg-zinc-100 border-zinc-300 rounded focus:ring-brand cursor-pointer"
              />
              <span>I verify that the tenant has signed the renewal lease agreement / أؤكد من واقع المستندات توقيع النزيل لعقد الإيجار المجدد</span>
            </label>
          </motion.div>
        )}

        {stayDecision === 'extend' && (
          <motion.div 
            key="extend-form"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-emerald-100 dark:border-emerald-950 rounded-2xl text-xs space-y-4"
          >
            <span className="text-xs font-black text-emerald-650 dark:text-emerald-400 uppercase tracking-wider block">
              Stay Extension Setup / تمديد الإقامة قصيرة المدة (أيام) والتكلفة
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
                  Supplementary Checkout Date Limit / تاريخ الخروج الجديد الممدد
                </label>
                <input 
                  type="date" 
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  disabled={booking.workflowStep !== 4}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white"
                />
              </div>
              <div className="space-y-1 text-xs">
                <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
                  Supplementary Extension Rate Fee (AED) / تكلفة التمديد الإضافية الإجمالية
                </label>
                <input 
                  type="number" 
                  value={extendRate}
                  onChange={(e) => setExtendRate(Number(e.target.value))}
                  disabled={booking.workflowStep !== 4}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <label className="flex items-center gap-1.5 pt-1 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={extendSigned}
                onChange={(e) => setExtendSigned(e.target.checked)}
                disabled={booking.workflowStep !== 4}
                className="w-4 h-4 text-brand bg-zinc-100 border-zinc-300 rounded focus:ring-brand cursor-pointer"
              />
              <span>I confirm that pro-rata rates are accepted and signed by the occupant / أقر بموافقة وتوقيع النزيل على الأسعار والتمديد المبين</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end pt-2">
        {activeStep === 4 ? (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Apply Stay Decision / حفظ القرار والانتقال للتالي</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <span className="text-xs text-zinc-400 font-bold italic">
            Decision step closed / تم إغلاق خطوة اتخاذ القرار. Assigned selection: {(booking.stayDecision || 'Scheduled exit').toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
