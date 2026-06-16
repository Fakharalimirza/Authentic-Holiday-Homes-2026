import React, { useState } from 'react';
import { ArrowRight, Mail, Copy, Check, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { AdminBooking } from '../types';

interface Step2Props {
  booking: AdminBooking;
  activeStep: number;
  selectedStepTab: number;
  diffNights: number;
  onSave: (payload: {
    advanceBookingFee: number;
    advancePaidStatus: string;
    paymentStatus: string;
    contractSent: boolean;
    contractSigned: boolean;
  }) => Promise<void>;
}

export default function Step2FinanceChecklist({
  booking,
  activeStep,
  selectedStepTab,
  diffNights,
  onSave,
}: Step2Props) {
  const [advanceAmount, setAdvanceAmount] = useState<number>(booking.advanceBookingFee || 500);
  const [advanceStatus, setAdvanceStatus] = useState<string>(booking.advancePaidStatus || 'Pending');
  const [moveInPaidStatus, setMoveInPaidStatus] = useState<string>(booking.paymentStatus || 'unpaid');
  const [moveInContractSent, setMoveInContractSent] = useState<boolean>(booking.contractSent || false);
  const [moveInContractSigned, setMoveInContractSigned] = useState<boolean>(booking.contractSigned || false);

  // E-contract local states
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [mailFeedback, setMailFeedback] = useState<string | null>(null);

  if (selectedStepTab !== 2) return null;

  const contractUrl = `${window.location.origin}/guest/contract/${booking.id}`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(contractUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendContractEmail = async () => {
    if (!booking.guestEmail) {
      alert("This guest is missing a registered email in their booking file. Please open Guest Directory or manual details to add one.");
      return;
    }

    setIsSending(true);
    setMailFeedback(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: booking.guestEmail,
          guestName: booking.guestName,
          propertyTitle: booking.propertyTitle || 'Licensed Holiday Home Unit',
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          signUrl: contractUrl
        })
      });

      if (res.ok) {
        setMoveInContractSent(true);
        setMailFeedback("Tenancy agreement link dispatched to: " + booking.guestEmail);
      } else {
        let errMsg = "SMTP pipeline malfunction. Verify MAIL_PASSWORD.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errMsg = errorData.error || errMsg;
          } else {
            const text = await res.text();
            errMsg = text.substring(0, 150) || errMsg;
          }
        } catch (parseErr) {
          console.error("Failed to parse status response:", parseErr);
        }
        alert("Dispenser error: " + errMsg);
      }
    } catch (err: any) {
      console.error(err);
      alert("Connectivity error dispatching contract email transaction. Please check your internet or retry.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = () => {
    onSave({
      advanceBookingFee: advanceAmount,
      advancePaidStatus: advanceStatus,
      paymentStatus: moveInPaidStatus,
      contractSent: moveInContractSent,
      contractSigned: moveInContractSigned,
    });
  };

  return (
    <div className="space-y-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150-dark dark:border-zinc-850">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-black block">
            Step 2 / الخطوة الثانية
          </span>
          <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
            Escrow Advance & Contract Management / إدارة الدفعة المقدمة والاتفاقية
          </span>
        </div>
      </div>

      <div className="p-4 bg-purple-50/45 dark:bg-purple-950/10 border border-purple-105 rounded-2xl text-xs space-y-1 font-bold">
        <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
          Move-In Mode Assessor / تقدير آلية الدخول وحالة الحجز بالتواريخ
        </span>
        <p className="text-zinc-550 dark:text-zinc-350 leading-relaxed font-semibold">
          Check-In date / تاريخ الدخول: <span className="text-purple-750 dark:text-purple-300 font-black">{booking.checkIn}</span>. 
          {diffNights <= 3 ? (
            <span className="text-brand font-black">
              {' '}
              [INSTANT / عاجل] Urgent Move-In. Collect total rents & refundable deposit on dispatch.
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-brand font-black">
              {' '}
              [ADVANCE HOLD / عادي] Collect booking protection retainer to lock the calendar.
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box A - Advance Hold */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Advance Escrow Hold / حجز الدفعة المقدمة لتأكيد التقويم
          </h4>
          <div className="space-y-2 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Advance Amount (AED) / قيمة الدفعة المقدمة
            </label>
            <input 
              type="number" 
              value={advanceAmount} 
              onChange={(e) => setAdvanceAmount(Number(e.target.value))}
              disabled={activeStep !== 2}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 outline-none p-2 rounded-lg font-bold text-zinc-900 dark:text-white"
            />
          </div>
          <div className="space-y-1.5 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Advance Paid Status / حالة الدفع للدفعة المقدمة
            </label>
            <select 
              value={advanceStatus}
              onChange={(e) => setAdvanceStatus(e.target.value)}
              disabled={activeStep !== 2}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 outline-none p-2 rounded-lg font-bold text-zinc-900 dark:text-white"
            >
              <option value="Pending">Pending Escrow / في الانتظار</option>
              <option value="Paid">Paid & Disbursed / تم استلام الدفعة بنجاح</option>
            </select>
          </div>
        </div>

        {/* Box B - Ledger Mark Status */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-155 dark:border-zinc-800 rounded-2xl space-y-3">
          <h4 className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
            Full Ledger Status / حالة التحصيل المالي الكلي والوصول
          </h4>
          <div className="space-y-2 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Primary Rental Cost / تكلفة الإيجار المتوقعة
            </label>
            <input 
              type="text" 
              readOnly 
              disabled
              value={`AED ${booking.totalPrice || 0}`}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 outline-none p-2 rounded-lg font-bold text-zinc-500 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5 text-xs">
            <label className="block text-[10px] uppercase text-zinc-400 font-extrabold">
              Ledger Mark Status / الحالة العامة لدفتر الأقساط
            </label>
            <select 
              value={moveInPaidStatus}
              onChange={(e) => setMoveInPaidStatus(e.target.value)}
              disabled={activeStep !== 2}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 outline-none p-2 rounded-lg font-bold text-zinc-900 dark:text-white"
            >
              <option value="unpaid">Unpaid / غير مدفوع</option>
              <option value="partially_paid">Partially Received / مستلم جزئياً</option>
              <option value="paid">Paid In Full / مدفوع بالكامل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document signatures compliance */}
      <div className="p-5 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-155 dark:border-zinc-800 space-y-4 text-xs">
        <div>
          <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-wider font-sans">
            Document Compliance Checklist / التحقق من جاهزية الأوراق والعقود
          </h4>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <label className="flex items-center gap-1.5 font-bold cursor-pointer">
            <input 
              type="checkbox" 
              checked={moveInContractSent} 
              onChange={(e) => setMoveInContractSent(e.target.checked)}
              disabled={activeStep !== 2}
              className="w-4 h-4 text-brand bg-zinc-100 border-zinc-300 rounded focus:ring-brand cursor-pointer"
            />
            <span>Agreement Sent to Occupant / تم إرسال مسودة العقد</span>
          </label>

          <label className="flex items-center gap-1.5 font-bold cursor-pointer">
            <input 
              type="checkbox" 
              checked={moveInContractSigned} 
              onChange={(e) => setMoveInContractSigned(e.target.checked)}
              disabled={activeStep !== 2}
              className="w-4 h-4 text-brand bg-zinc-100 border-zinc-300 rounded focus:ring-brand cursor-pointer"
            />
            <span className="text-brand font-extrabold dark:text-brand-light">
              E-Contract Signed by Tenant / تم توقيع العقد الإلكتروني
            </span>
          </label>
        </div>

        {/* Dynamic Interactive E-Signing Deck */}
        <div className="space-y-3 pt-1">
          <span className="text-[10px] font-black uppercase text-brand tracking-wider block">
            ⚡ e-contract signing cockpit / لوحة إدارة عقود الإيجار
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Share link and clipboard console */}
            <div className="space-y-2 p-4 bg-white dark:bg-zinc-900 border border-zinc-150-dark dark:border-zinc-800 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                Shareable Agreement Link / رابط توقيع العقد المباشر للضيف
              </span>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={contractUrl}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-950/40 p-2 rounded border border-zinc-150-dark text-[10px] text-zinc-500 font-mono select-all outline-none"
                />
                <button 
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-650 rounded hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title="Copy e-contract link"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
                <a 
                  href={contractUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-650 rounded hover:scale-105 active:scale-95 transition-transform flex items-center"
                  title="Open Agreement Preview"
                >
                  <ExternalLink size={13} />
                </a>
              </div>

              {/* Mail trigger dispatch pipeline */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendContractEmail}
                  disabled={isSending}
                  className="w-full py-2 bg-[#B22234] text-white hover:bg-[#901c22] disabled:bg-zinc-100 disabled:text-zinc-400 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>Dispatching Email Link...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={12} />
                      <span>Email Agreement to {booking.guestEmail || 'Occupant'}</span>
                    </>
                  )}
                </button>
                {mailFeedback && (
                  <p className="text-[10px] font-bold text-emerald-650 mt-1.5">✓ {mailFeedback}</p>
                )}
              </div>
            </div>

            {/* Signature Biometrical audit console */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-150-dark dark:border-zinc-800 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                  Tenant signature file / صورة ونظام بصمة التوقيع المعتمدة
                </span>
                
                {booking.contractSigned && (booking as any).contractSignature ? (
                  <div className="flex gap-3 items-center mt-2.5">
                    <div className="p-1.5 bg-emerald-50 rounded border border-emerald-100 shrink-0">
                      <ShieldCheck size={18} className="text-emerald-600" />
                    </div>
                    <div className="text-[10px] leading-relaxed">
                      <p className="text-emerald-700 font-extrabold">E-Contract Biometrically Sealed</p>
                      <p className="text-zinc-550 font-semibold text-[9px]">
                        IP: <span className="font-bold text-zinc-800 dark:text-zinc-300">{(booking as any).contractSignedIp || '127.0.0.1'}</span><br />
                        Date: <span className="font-bold text-zinc-800 dark:text-zinc-300">{new Date((booking as any).contractSignedAt || Date.now()).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-[10px] font-bold text-zinc-400 italic">
                    No active digital signature has been recorded for this lease agreement yet.
                  </div>
                )}
              </div>

              {/* Small expanded view model of signed image */}
              {booking.contractSigned && (booking as any).contractSignature && (
                <div className="mt-1 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-850 flex items-center justify-center">
                  <img 
                    src={(booking as any).contractSignature} 
                    alt="Tenant E-Sign Snapshot" 
                    className="h-10 w-auto object-contain max-w-[200px] dark:invert"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <div className="flex justify-end pt-2">
        {activeStep === 2 ? (
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>Agree & Next: Unit Report / تأكيد والانتقال لتقرير الدخول</span>
            <ArrowRight size={13} />
          </button>
        ) : (
          <span className="text-xs text-zinc-400 font-bold italic">
            Step 2 completed / الخطوة الثانية مكتملة. Active flow is at Step {activeStep}
          </span>
        )}
      </div>
    </div>
  );
}
