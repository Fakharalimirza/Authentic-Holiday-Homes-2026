import React, { useState, useEffect } from 'react';
import { ArrowRight, PenTool } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step3Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  defaultChecklists: Record<string, string[]>;
  onSave: (payload: {
    unitType: string;
    items: Record<string, { status: 'good' | 'damaged'; notes: string }>;
    guestSignature: string;
    agentSignature: string;
    keysHandedOver: boolean;
    signedAt: string;
  }) => Promise<void>;
}

export default function Step3CheckInInspection({
  booking,
  activeStep,
  selectedStepTab,
  defaultChecklists,
  onSave,
}: Step3Props) {
  const [checkInUnitType, setCheckInUnitType] = useState<string>(booking.checkInChecklist?.unitType || '1bhk');
  const [checkInItems, setCheckInItems] = useState<Record<string, { status: 'good' | 'damaged'; notes: string }>>({});
  const [checkInGuestSig, setCheckInGuestSig] = useState<string>(booking.checkInChecklist?.guestSignature || '');
  const [checkInAgentSig, setCheckInAgentSig] = useState<string>(booking.checkInChecklist?.agentSignature || '');
  const [checkInHandoverKeys, setCheckInHandoverKeys] = useState<boolean>(booking.checkInChecklist?.keysHandedOver || false);

  // Initialize checklist items when layout changes or booking provides existing items
  useEffect(() => {
    if (booking.checkInChecklist?.items) {
      setCheckInItems(booking.checkInChecklist.items);
    } else {
      const defaults: Record<string, { status: 'good' | 'damaged'; notes: string }> = {};
      const labels = defaultChecklists[checkInUnitType] || defaultChecklists['1bhk'];
      labels.forEach((_, idx) => {
        defaults[`item_${idx}`] = { status: 'good', notes: '' };
      });
      setCheckInItems(defaults);
    }
  }, [checkInUnitType, booking.checkInChecklist, defaultChecklists]);

  if (selectedStepTab !== 3) return null;

  const handleSave = () => {
    onSave({
      unitType: checkInUnitType,
      items: checkInItems,
      guestSignature: checkInGuestSig,
      agentSignature: checkInAgentSig,
      keysHandedOver: checkInHandoverKeys,
      signedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-200/50">
      <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">
            Step 3 / الخطوة الثالثة
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Physical Check-In & Premise Turn-Over / تسجيل الدخول وفحص جاهزية العقار
          </span>
        </div>
        
        {/* Unit Configuration selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-zinc-500">Unit Type Layout / طراز الوحدة:</span>
          <select 
            value={checkInUnitType}
            onChange={(e) => setCheckInUnitType(e.target.value)}
            disabled={booking.workflowStep !== 3}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 outline-none p-1.5 rounded-lg font-black text-xs uppercase text-zinc-900 dark:text-white"
          >
            <option value="studio">STUDIO / استوديو</option>
            <option value="1bhk">1 BHK / غرف وصالة</option>
            <option value="2bhk">2 BHK / غرفتين وصالة</option>
            <option value="3bhk">3 BHK / ثلاث غرف وصالة</option>
          </select>
        </div>
      </div>

      {/* Interactive Checklist Elements */}
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {(defaultChecklists[checkInUnitType] || defaultChecklists['1bhk']).map((lbl, idx) => {
          const curVal = checkInItems[`item_${idx}`] || { status: 'good', notes: '' };
          return (
            <div key={idx} className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150-dark dark:border-zinc-850 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-3 text-xs">
              <div className="flex-1">
                <p className="font-black text-zinc-850 dark:text-zinc-150">{lbl}</p>
                <input 
                  type="text" 
                  placeholder="Enter physical blemishes or specific remarks / أدخل ملاحظات حول الحالة الفيزيائية..."
                  value={curVal.notes}
                  onChange={(e) => {
                    setCheckInItems(prev => ({
                      ...prev,
                      [`item_${idx}`]: { ...curVal, notes: e.target.value }
                    }));
                  }}
                  disabled={booking.workflowStep !== 3}
                  className="w-full bg-transparent mt-1 border-b border-dashed border-zinc-250 dark:border-zinc-700 outline-none py-1 text-[11px] text-zinc-550 italic placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => {
                    if (booking.workflowStep !== 3) return;
                    setCheckInItems(prev => ({
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
                    if (booking.workflowStep !== 3) return;
                    setCheckInItems(prev => ({
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
                  Damaged / Issue (متضرر / ملاحظة)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Signature Blocks - Typewrite signature concept */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150-dark dark:border-zinc-850 space-y-3">
        <h4 className="text-[11px] font-black uppercase text-zinc-405 dark:text-zinc-400 tracking-wider">
          Verification Authorities & Handover / توثيق التواقيع والتسليم الرسمي
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-black text-zinc-450 block">
              Occupant Signature (Typewrite) / توقيع النزيل (مكتوب)
            </span>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type full legal name as digital sign / اكتب الاسم الكامل للتوقيع الرقمي"
                value={checkInGuestSig}
                onChange={(e) => setCheckInGuestSig(e.target.value)}
                disabled={booking.workflowStep !== 3}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none p-2.5 rounded-xl text-xs font-semibold pl-8 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <PenTool size={12} className="absolute left-2.5 top-3.5 text-zinc-400" />
            </div>
            {checkInGuestSig.trim() && (
              <p className="text-[10px] text-emerald-600 font-bold italic font-serif">
                ✍ Electronic Signature generated: {checkInGuestSig.trim().toUpperCase()}
              </p>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-black text-zinc-450 block">
              Agent/Host Representative / توقيع ممثل الوكالة
            </span>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Type dispatch officer name / الاسم الكامل للموظف المعني"
                value={checkInAgentSig}
                onChange={(e) => setCheckInAgentSig(e.target.value)}
                disabled={booking.workflowStep !== 3}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 outline-none p-2.5 rounded-xl text-xs font-semibold pl-8 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
              />
              <PenTool size={12} className="absolute left-2.5 top-3.5 text-zinc-400" />
            </div>
            {checkInAgentSig.trim() && (
              <p className="text-[10px] text-zinc-500 font-bold italic font-serif">
                ✍ Representative: {checkInAgentSig.trim().toUpperCase()}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
          <label className="flex items-center gap-1.5 font-bold text-xs text-brand dark:text-brand-light cursor-pointer">
            <input 
              type="checkbox" 
              checked={checkInHandoverKeys} 
              onChange={(e) => setCheckInHandoverKeys(e.target.checked)}
              disabled={booking.workflowStep !== 3}
              className="w-4.5 h-4.5 text-brand bg-zinc-105 border-zinc-300 rounded focus:ring-brand cursor-pointer"
            />
            <span>Keys & Building RFID Handover Completed / تم تسليم المفاتيح وبطاقة البوابة بالكامل للنزيل</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        {activeStep === 3 ? (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Lock Checklist & Move In / قفل القائمة وتسجيل الدخول الفعلي</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <div className="text-xs text-zinc-400 font-bold italic space-y-1 text-right">
            <p>Step 3 finalized / تم إنهاء الخطوة الثالثة</p>
            <p className="text-[10px] text-zinc-500">Handed by Agent: {booking.checkInChecklist?.agentSignature || 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
