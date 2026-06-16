import React, { useState, useEffect } from 'react';
import { ArrowRight, PenTool } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step5Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  defaultChecklists: Record<string, string[]>;
  onSave: (payload: {
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    completed: boolean;
    signedAt: string;
  }) => Promise<void>;
}

export default function Step5CheckOutInspection({
  booking,
  activeStep,
  selectedStepTab,
  defaultChecklists,
  onSave,
}: Step5Props) {
  const [checkOutItems, setCheckOutItems] = useState<Record<string, { status: 'good' | 'damaged'; notes: string }>>({});
  const [checkOutGuestSig, setCheckOutGuestSig] = useState<string>(booking.checkOutChecklist?.guestSignature || '');
  const [checkOutAgentSig, setCheckOutAgentSig] = useState<string>(booking.checkOutChecklist?.agentSignature || '');
  const [checkOutSigned, setCheckOutSigned] = useState<boolean>(booking.checkOutChecklist?.completed || false);

  useEffect(() => {
    const activeUnitKey = booking.checkInChecklist?.unitType || '1bhk';
    if (booking.checkOutChecklist?.items) {
      setCheckOutItems(booking.checkOutChecklist.items);
    } else {
      const defaults: Record<string, { status: 'good' | 'damaged'; notes: string }> = {};
      const labels = defaultChecklists[activeUnitKey] || defaultChecklists['1bhk'];
      labels.forEach((_, idx) => {
        const prevStatus = booking.checkInChecklist?.items?.[`item_${idx}`]?.status || 'good';
        defaults[`item_${idx}`] = { status: prevStatus, notes: '' };
      });
      setCheckOutItems(defaults);
    }
  }, [booking.checkInChecklist, booking.checkOutChecklist, defaultChecklists]);

  if (selectedStepTab !== 5) return null;

  const handleSave = () => {
    onSave({
      items: checkOutItems,
      guestSignature: checkOutGuestSig,
      agentSignature: checkOutAgentSig,
      completed: checkOutSigned,
      signedAt: new Date().toISOString(),
    });
  };

  const activeUnitKey = booking.checkInChecklist?.unitType || '1bhk';
  const checklistLabels = defaultChecklists[activeUnitKey] || defaultChecklists['1bhk'];

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/50">
      <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Step 5 / الخطوة الخامسة
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Exit Physical Inspection & Check-Out / فحص الخروج وتسليم الوحدة
          </span>
        </div>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Unit Type / طراز الوحدة: <span className="font-black text-brand dark:text-brand-light">{activeUnitKey}</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {checklistLabels.map((lbl, idx) => {
          const checkInStatus = booking.checkInChecklist?.items?.[`item_${idx}`]?.status || 'good';
          const curVal = checkOutItems[`item_${idx}`] || { status: 'good', notes: '' };
          
          return (
            <div key={idx} className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150-dark dark:border-zinc-850 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-3 text-xs">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-black text-zinc-850 dark:text-zinc-150">{lbl}</p>
                  <span className={`text-[8px] uppercase px-2 py-0.5 rounded-full font-bold ${
                    checkInStatus === 'good' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                  }`}>
                    Check-in was: {checkInStatus}
                  </span>
                </div>
                <input 
                  type="text" 
                  placeholder="Enter custom damage or wear/tear comments / سجل حالة التضرر أو الملاحظات عند المغادرة..."
                  value={curVal.notes}
                  onChange={(e) => {
                    setCheckOutItems(prev => ({
                      ...prev,
                      [`item_${idx}`]: { ...curVal, notes: e.target.value }
                    }));
                  }}
                  disabled={booking.workflowStep !== 5}
                  className="w-full bg-transparent border-b border-dashed border-zinc-250 dark:border-zinc-700 outline-none py-1 text-[11px] text-zinc-550 italic placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => {
                    if (booking.workflowStep !== 5) return;
                    setCheckOutItems(prev => ({
                      ...prev,
                      [`item_${idx}`]: { ...curVal, status: 'good' }
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] cursor-pointer transition-colors ${
                    curVal.status === 'good'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-805 hover:bg-zinc-200 text-zinc-500'
                  }`}
                >
                  Good / Perfect (سليم)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (booking.workflowStep !== 5) return;
                    setCheckOutItems(prev => ({
                      ...prev,
                      [`item_${idx}`]: { ...curVal, status: 'damaged' }
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase text-[9px] cursor-pointer transition-colors ${
                    curVal.status === 'damaged'
                      ? 'bg-rose-500 text-white font-extrabold animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-805 hover:bg-rose-50 text-zinc-500'
                  }`}
                >
                  Damaged / Issue (متضرر)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150-dark dark:border-zinc-850 space-y-3">
        <h4 className="text-[11px] font-black uppercase text-zinc-405 dark:text-zinc-400 tracking-wider">
          Exit Off-boarding Verification / توثيق المغادرة والتسليم الرقمي
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-black text-zinc-450 block">
              Occupant Exit Signature / توقيع النزيل عند الخروج
            </span>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type full legal name as digital signature / اكتب الاسم الكامل للنزيل للتسليم"
                value={checkOutGuestSig}
                onChange={(e) => setCheckOutGuestSig(e.target.value)}
                disabled={booking.workflowStep !== 5}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none p-2.5 rounded-xl text-xs font-semibold pl-8 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <PenTool size={12} className="absolute left-2.5 top-3.5 text-zinc-400" />
            </div>
            {checkOutGuestSig.trim() && (
              <p className="text-[10px] text-emerald-600 font-bold italic font-serif">
                ✍ Electronic Signature generated: {checkOutGuestSig.trim().toUpperCase()}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-black text-zinc-450 block">
              Agent/Host Official / توقيع الموظف المتابع
            </span>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type officer name / اكتب اسم الموظف المعاين"
                value={checkOutAgentSig}
                onChange={(e) => setCheckOutAgentSig(e.target.value)}
                disabled={booking.workflowStep !== 5}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none p-2.5 rounded-xl text-xs font-semibold pl-8 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
              />
              <PenTool size={12} className="absolute left-2.5 top-3.5 text-zinc-400" />
            </div>
            {checkOutAgentSig.trim() && (
              <p className="text-[10px] text-zinc-500 font-bold italic font-serif">
                ✍ Representative: {checkOutAgentSig.trim().toUpperCase()}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <label className="flex items-center gap-1.5 font-bold text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={checkOutSigned} 
              onChange={(e) => setCheckOutSigned(e.target.checked)}
              disabled={booking.workflowStep !== 5}
              className="w-4.5 h-4.5 text-brand bg-zinc-105 border-zinc-300 rounded focus:ring-brand cursor-pointer"
            />
            <span>I confirm that the keys, parking fobs, and access tags have been successfully recovered / تؤكد استعادة بطاقات العبور والمفاتيح بنجاح</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        {activeStep === 5 ? (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Lock Checkout List / قفل تقرير المغادرة وتسوية الخروج</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <div className="text-xs text-zinc-400 font-bold italic text-right">
            <p>Step 5 finalized / الخطوة الخامسة مكتملة بنجاح</p>
            <p className="text-[10px] text-zinc-500 font-normal">Completed by: {booking.checkOutChecklist?.agentSignature || 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
