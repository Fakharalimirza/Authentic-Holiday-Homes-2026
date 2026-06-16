import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step6Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  onSave: (payload: {
    damageDeductions: number;
    damageNotes: string;
    depositRefundedStatus: 'pending' | 'processing' | 'completed';
    completedAt: string;
  }) => Promise<void>;
}

export default function Step6DamagesSettlement({
  booking,
  activeStep,
  selectedStepTab,
  onSave,
}: Step6Props) {
  const [damageDeduction, setDamageDeduction] = useState<number>(booking.damageDeductions || 0);
  const [damageNotes, setDamageNotes] = useState<string>(booking.damageNotes || '');
  const [refundStatus, setRefundStatus] = useState<'pending' | 'processing' | 'completed'>(booking.depositRefundedStatus || 'pending');

  if (selectedStepTab !== 6) return null;

  const handleSave = () => {
    onSave({
      damageDeductions: damageDeduction,
      damageNotes: damageNotes,
      depositRefundedStatus: refundStatus,
      completedAt: new Date().toISOString(),
    });
  };

  const securityDepositAmount = booking.securityDeposit || 0;
  const finalRefundAmount = Math.max(0, securityDepositAmount - damageDeduction);

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150-dark space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Step 6 / الخطوة السادسة والأخيرة
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Escrow Refund & Asset Damages Adjustment / تسوية التأمين وإغلاق حساب الحجز
          </span>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 text-xs space-y-3.5">
        <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider block">
          Deposit Financial Summary / ملخص حساب مبلغ التأمين المسترد
        </span>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl">
            <span className="text-[10px] uppercase font-black text-zinc-400 block">
              Original Escrow Held / مبلغ التأمين المودع
            </span>
            <span className="text-base font-black text-zinc-850 dark:text-zinc-100 font-mono block mt-1">
              AED {securityDepositAmount}
            </span>
          </div>

          <div className="p-3 bg-amber-50/40 dark:bg-amber-955/10 border border-amber-200 dark:border-amber-900 rounded-xl">
            <span className="text-[10px] uppercase font-black text-amber-600 block">
              Claims / Damage Deductions / الاستقطاعات المتضررة
            </span>
            <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono block mt-1">
              AED {damageDeduction}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/40 dark:bg-emerald-955/10 border border-emerald-200 dark:border-emerald-900 rounded-xl">
            <span className="text-[10px] uppercase font-black text-emerald-600 block">
              Adjusted Refund Outstanding / المبلغ المتبقي المسترد
            </span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono block mt-1">
              AED {finalRefundAmount}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Claims Config */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-black uppercase text-zinc-500">
            Claims Deductions Config / ضبط الاستقطاع
          </h4>
          <div className="space-y-1 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Claim Amount Fee (AED) / قيمة الاستقطاع
            </label>
            <input 
              type="number" 
              max={securityDepositAmount}
              value={damageDeduction}
              onChange={(e) => setDamageDeduction(Number(e.target.value))}
              disabled={booking.workflowStep !== 6}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-1 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Adjudicate Reason Log / سبب الاستقطاع
            </label>
            <textarea 
              rows={2}
              placeholder="e.g. Broken master bedroom vase, deep carpet stain / مثال: كسر زجاج ومقاعد الصالة..."
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              disabled={booking.workflowStep !== 6}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg font-bold outline-none text-zinc-900 dark:text-white text-xs placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Dispatch & Closeout */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 rounded-2xl space-y-3 text-xs">
          <h4 className="text-[11px] font-black uppercase text-zinc-500">
            Refund Coordination State / آلية وحالة الاسترداد المصرفي
          </h4>
          
          <div className="space-y-1">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Wire/Refund Status / حالة الدفع المصرفي للنزيل
            </label>
            <select 
              value={refundStatus}
              onChange={(e) => setRefundStatus(e.target.value as any)}
              disabled={booking.workflowStep !== 6}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 outline-none p-2 rounded-lg font-bold text-zinc-900 dark:text-white"
            >
              <option value="pending">Hold / معلق في الحساب</option>
              <option value="processing">Processing / جاري التحويل البنكي</option>
              <option value="completed">Completed / تم إرجاع المبلغ الباقي بالكامل</option>
            </select>
          </div>

          <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-dashed rounded-xl text-[10px] text-zinc-500 leading-relaxed font-bold">
            <span className="block font-black text-brand-dark dark:text-brand-light uppercase mb-0.5">
              Turnover Notice / إشعار فريق النظافة والصيانة
            </span>
            Marking this step closes the occupant stay log, launches auto cleaning dispatcher, and releases room back into Active inventory.
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        {activeStep === 6 ? (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Close Contract & Discharge / إغلاق وحفظ الحجز نهائياً</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <span className="text-xs text-zinc-450 dark:text-zinc-500 font-bold italic">
            This booking is completed and financially closed / تم إكمال هذا الحجز وإغلاق حساباته وجاهز لتأجير آخر
          </span>
        )}
      </div>
    </div>
  );
}
