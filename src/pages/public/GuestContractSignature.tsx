import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, db } from '../../lib/firebase';
import { AdminBooking } from '../admin/bookings/types';
import { AlertCircle, FileText, CheckCircle2, ChevronRight, PenTool, Type, RefreshCw, Printer, ShieldCheck, Download, Calendar } from 'lucide-react';

export default function GuestContractSignature() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<AdminBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signature States
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [termAccepted, setTermAccepted] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signedRecord, setSignedRecord] = useState<{
    ip: string;
    userAgent: string;
    signedAt: string;
    serialNo: string;
  } | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Client Information
  const [ipAddress, setIpAddress] = useState('127.0.0.1');

  // Load IP address of the guest
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) setIpAddress(data.ip);
      })
      .catch(() => {});
  }, []);

  // Fetch Booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) {
        setError("Invalid lease reference number.");
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'bookings', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as AdminBooking;
          setBooking({ id: snap.id, ...data });
          if (data.contractSigned) {
            setSignedRecord({
              ip: (data as any).contractSignedIp || 'Record On File',
              userAgent: (data as any).contractSignedUserAgent || 'Mozilla/5.0',
              signedAt: (data as any).contractSignedAt || new Date().toISOString(),
              serialNo: `AHH-AGR-${snap.id.substring(0, 8).toUpperCase()}`
            });
            setSignatureImage((data as any).contractSignature || null);
          }
        } else {
          setError("Rental Booking not found. Please review your link.");
        }
      } catch (err) {
        console.error("Error loading agreement:", err);
        setError("Network error fetching agreement details. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id]);

  // Canvas drawing handlers
  useEffect(() => {
    if (sigMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [sigMode, loading]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e, canvas);
    if (ctx && pos) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCoordinates(e, canvas);
    if (ctx && pos) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Convert Typed Name to decorative Canvas Text (to store signature consistently)
  const generateTypedSignature = (): string | null => {
    if (!typedName.trim()) return null;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 150;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 150);
      ctx.fillStyle = '#0f172a'; // charcoal slate tint 
      ctx.font = 'italic 34px "Georgia", "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 65);
      
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(20, 110);
      ctx.lineTo(380, 110);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('DYNAMICALLY DIGITALLY SIGNED', 200, 128);
      return tempCanvas.toDataURL();
    }
    return null;
  };

  // Action Submit Signature
  const handleSubmitSignature = async () => {
    if (!booking) return;
    if (!termAccepted) {
      alert("Please check and accept the Rental Terms and Conditions checkbox.");
      return;
    }

    let sigDataUrl = '';
    if (sigMode === 'draw') {
      if (canvasRef.current) {
        // Simple check to make sure they sketched something (not empty white canvas)
        sigDataUrl = canvasRef.current.toDataURL();
      }
    } else {
      const typedSig = generateTypedSignature();
      if (!typedSig) {
        alert("Please enter your formal full name first.");
        return;
      }
      sigDataUrl = typedSig;
    }

    setIsSigning(true);
    const signTimestamp = new Date().toISOString();
    const agreementSerial = `AHH-AGR-${booking.id.substring(0, 8).toUpperCase()}`;

    try {
      const docRef = doc(db, 'bookings', booking.id);
      await updateDoc(docRef, {
        contractSigned: true,
        contractSent: true,
        contractSignature: sigDataUrl,
        contractSignedAt: signTimestamp,
        contractSignedIp: ipAddress,
        contractSignedUserAgent: navigator.userAgent,
        contractSignedName: sigMode === 'type' ? typedName : 'Drawn Digitally'
      });

      setSignedRecord({
        ip: ipAddress,
        userAgent: navigator.userAgent,
        signedAt: signTimestamp,
        serialNo: agreementSerial
      });
      setSignatureImage(sigDataUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Failed to commit e-contract sign:", err);
      alert("Failed to submit digital signature. Please try again or contact IT.");
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full shadow"
          />
          <span className="text-sm font-black tracking-widest text-zinc-500 uppercase">
            Synchronizing Rental Agreement / جاري استرجاع عقد الإيجار...
          </span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Lease Error</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error || "Requested stay documentation is currently unavailable."}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-brand text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-brand-hover shadow-lg transition-transform"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const serialNo = signedRecord?.serialNo || `AHH-AGR-${booking.id.substring(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950/60 pb-20 print:bg-white print:pb-0">
      
      {/* Dynamic Printing Banner for signed status */}
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <button 
            onClick={() => window.history.back()}
            className="text-[11px] font-black tracking-widest text-zinc-400 uppercase hover:text-brand flex items-center gap-1 mb-2"
          >
            <span>← Go Back</span>
          </button>
          <h1 className="text-2xl font-black text-zinc-800 dark:text-white uppercase tracking-tight">
            Tenant Digital Signing Portal
          </h1>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
            Licensed short-term letting agreement Dubai / رقم الاتفاقية: {serialNo}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2 shadow-sm"
          >
            <Printer size={14} className="text-zinc-400" />
            <span>Print Contract</span>
          </button>
        </div>
      </div>

      {/* Main Contract Container */}
      <div className="max-w-4xl mx-auto px-4 print:px-0">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200/60 dark:border-zinc-800/80 shadow-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none"
        >
          {/* Header Cover Banner */}
          <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
            <div className="flex items-center gap-3">
              <img 
                src="/logo_light.png" 
                alt="Authentic Holiday Homes" 
                className="h-12 w-auto object-contain dark:brightness-110"
                onError={(e) => {
                  // Fallback logo typography styling if image is physically missing
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <span className="text-[11px] font-black tracking-widest text-[#B22234] dark:text-rose-500 uppercase block leading-none">
                  Authentic Holiday Homes
                </span>
                <span className="text-[8px] font-mono text-zinc-400 tracking-wider">
                  LICENSE NO: 1061365 | DTCM REGISTERED OPERATOR
                </span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand/10 text-brand text-[10px] font-black uppercase tracking-wider rounded-full mb-1">
                Short-Term Tenancy Agreement
              </span>
              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                Dubai, United Arab Emirates / دبي، الإمارات العربية المتحدة
              </p>
            </div>
          </div>

          {/* Bilingual Alert if signed */}
          {signedRecord && (
            <div className="m-8 p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-4 text-xs font-bold leading-relaxed text-emerald-800 dark:text-emerald-400">
              <ShieldCheck size={28} className="text-emerald-500 shrink-0" />
              <div>
                <span className="text-sm font-black block uppercase tracking-wide">
                  E-CONTRACT SIGNED & BIOMETRICALLY SEALED / تم التوقيع الإلكتروني بنجاح
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
                  Signed At: <span className="text-zinc-800 dark:text-zinc-300 font-black">{new Date(signedRecord.signedAt).toLocaleString()}</span> | 
                  IP Address: <span className="text-zinc-800 dark:text-zinc-300 font-black">{signedRecord.ip}</span> | 
                  ID Serial: <span className="text-zinc-800 dark:text-zinc-300 font-black">{signedRecord.serialNo}</span>
                </p>
              </div>
            </div>
          )}

          {/* Document Content Paper */}
          <div className="p-8 md:p-12 space-y-10 text-zinc-800 dark:text-zinc-200">
            
            {/* Parties Box */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand border-b border-zinc-100 dark:border-zinc-800 pb-1.5 font-sans flex items-center justify-between">
                <span>1. AGREEMENT PARTIES / أطراف الاتفاقية</span>
                <span className="text-[10px] text-zinc-400 font-mono">AHH-REF: {booking.id.substring(0, 8).toUpperCase()}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <span className="font-black text-zinc-500 uppercase tracking-wider block text-[10px]">
                    THE OPERATOR (First Party) / الطرف الأول (المشغل)
                  </span>
                  <p className="font-extrabold text-zinc-900 dark:text-white text-sm">Authentic Holiday Homes L.L.C</p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    License No: 1061365<br />
                    Office: Dubai, United Arab Emirates<br />
                    Email: reservations@authenticholidayhomes.ae<br />
                    Contact: +971 4 286 6788
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <span className="font-black text-zinc-500 uppercase tracking-wider block text-[10px]">
                    THE TENANT (Second Party) / الطرف الثاني (العميل)
                  </span>
                  <p className="font-extrabold text-zinc-900 dark:text-white text-sm">{booking.guestName}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Phone ID: {booking.guestPhone}<br />
                    Email: {booking.guestEmail || "No Email Provided"}<br />
                    Guest Code: {booking.guestId}<br />
                    Status: Verified Resident / Visitor
                  </p>
                </div>
              </div>
            </div>

            {/* Accommodation Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                2. ACCOMMODATION & STAY TIMES / وحدة السكن ومدة الإقامة
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] uppercase font-black text-zinc-400 block mb-1">Building name</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-white">{booking.propertyTitle || "Main Portfolio Unit"}</span>
                </div>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] uppercase font-black text-zinc-400 block mb-1">Unit reference</span>
                  <span className="text-xs font-black text-zinc-900 dark:text-white">{booking.propertyRef || booking.propertyId.substring(0, 6)}</span>
                </div>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] uppercase font-black text-zinc-400 block mb-1">Check-in / الدخول</span>
                  <span className="text-xs font-black text-brand uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                    <Calendar size={12} />
                    {booking.checkIn}
                  </span>
                </div>
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] uppercase font-black text-zinc-400 block mb-1">Check-out / الخروج</span>
                  <span className="text-xs font-black text-[#B22234] uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                    <Calendar size={12} />
                    {booking.checkOut}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand border-b border-zinc-100 dark:border-zinc-800 pb-1.5 flex items-center justify-between">
                <span>3. STAY LEDGER STATEMENT & PAYMENTS / البيان المالي والأقساط</span>
                <span className="text-[10px] text-zinc-400 lowercase italic">Calculated in United Arab Emirates Dirhams (AED)</span>
              </h3>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-300">
                    <tr className="border-b border-zinc-150-dark dark:border-zinc-800">
                      <th className="px-5 py-3">Fee Specification / بيان الرسوم</th>
                      <th className="px-5 py-3 text-right">Calculation Basis / أساس الاحتساب</th>
                      <th className="px-5 py-3 text-right">Amount / الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                    {booking.rentPerMonth ? (
                      <tr>
                        <td className="px-5 py-3 font-extrabold text-zinc-900 dark:text-white">Base Monthly Rent / قيمة الإيجار الشهري</td>
                        <td className="px-5 py-3 text-right font-mono">AED {booking.rentPerMonth.toLocaleString()} per month</td>
                        <td className="px-5 py-3 text-right font-black text-zinc-900 dark:text-white">AED {(booking.rentPerMonth * (booking.billingMonths || 1)).toLocaleString()}</td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="px-5 py-3 font-extrabold text-zinc-900 dark:text-white">Stay Accommodation Rental / إيجار السكن للفترة الكلية</td>
                        <td className="px-5 py-3 text-right font-mono">Full contract tenure length</td>
                        <td className="px-5 py-3 text-right font-black text-zinc-900 dark:text-white">AED {booking.totalPrice.toLocaleString()}</td>
                      </tr>
                    )}
                    {booking.dtcmFee && booking.dtcmFee > 0 ? (
                      <tr>
                        <td className="px-5 py-3">DTCM Tourism Dirham Fee / رسوم دائرة السياحة والتسويق</td>
                        <td className="px-5 py-3 text-right font-mono">Dubai Gov Standard 10-15 AED/night for first 30 nights</td>
                        <td className="px-5 py-3 text-right">AED {booking.dtcmFee.toLocaleString()}</td>
                      </tr>
                    ) : null}
                    {booking.securityDeposit && booking.securityDeposit > 0 ? (
                      <tr>
                        <td className="px-5 py-3 text-rose-500 font-extrabold dark:text-rose-400">Refundable Damage Deposit / تأمين الصيانة المسترد</td>
                        <td className="px-5 py-3 text-right font-mono">Refunded within 2-5 days post inspection</td>
                        <td className="px-5 py-3 text-right">AED {booking.securityDeposit.toLocaleString()}</td>
                      </tr>
                    ) : null}
                    {booking.cleaningFee && booking.cleaningFee > 0 ? (
                      <tr>
                        <td className="px-5 py-3">Professional Departure Sanitization / رسوم تنظيف المغادرة</td>
                        <td className="px-5 py-3 text-right font-mono">One-time checkout sterilization fee</td>
                        <td className="px-5 py-3 text-right">AED {booking.cleaningFee.toLocaleString()}</td>
                      </tr>
                    ) : null}
                    {booking.agencyFee && booking.agencyFee > 0 ? (
                      <tr>
                        <td className="px-5 py-3">Administrative & Agency Portal Fee / رسوم معاملات وبوابة إدارية</td>
                        <td className="px-5 py-3 text-right font-mono">Operational dispatch and key handling</td>
                        <td className="px-5 py-3 text-right">AED {booking.agencyFee.toLocaleString()}</td>
                      </tr>
                    ) : null}
                    {booking.miscFee && booking.miscFee > 0 ? (
                      <tr>
                        <td className="px-5 py-3">Utility Surcharge / Extras / خدمات إضافية ورسوم مختلفة</td>
                        <td className="px-5 py-3 text-right font-mono">DEWA / high speed fiber and cooling</td>
                        <td className="px-5 py-3 text-right">AED {booking.miscFee.toLocaleString()}</td>
                      </tr>
                    ) : null}
                    
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 font-black text-zinc-900 dark:text-white">
                      <td className="px-5 py-4 uppercase">Grand Net Value Due / الصافي الإجمالي المستحق</td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400 dark:text-zinc-500">VAT elements included where calculated</td>
                      <td className="px-5 py-4 text-right text-sm text-[#B22234] dark:text-rose-400 underline decoration-double">
                        AED {booking.grandTotalAmount ? booking.grandTotalAmount.toLocaleString() : booking.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Installments Table */}
              {booking.paymentSchedule && booking.paymentSchedule.length > 0 && (
                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    Installments Timeline Schedule / جدول أقساط الدفع والتحصيل
                  </span>
                  <div className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-[#B22234]/5 text-zinc-900 dark:text-white font-bold border-b border-zinc-150-dark dark:border-zinc-800">
                        <tr>
                          <th className="px-4 py-2">Installment # / القسط</th>
                          <th className="px-4 py-2">Due Date / تاريخ الاستحقاق</th>
                          <th className="px-4 py-2 text-right">Amount / القيمة المستحقة</th>
                          <th className="px-4 py-2 text-right">Status / الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {booking.paymentSchedule.map((inst, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{inst.payment_no}. {inst.description}</td>
                            <td className="px-4 py-2">{inst.due_date}</td>
                            <td className="px-4 py-2 text-right font-black">AED {inst.amount.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                inst.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                inst.status === 'Partially Paid' ? 'bg-amber-100 text-amber-850' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Conditions (Extracted from previous blade/app Terms) */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                4. CORE LEASE TERMS & REGULATORY CODE / بنود وشروط الإيجار لقضاء العطلات
              </h3>

              <div className="text-[11px] space-y-3 leading-relaxed text-zinc-600 dark:text-zinc-400 max-h-72 overflow-y-auto p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150-dark dark:border-zinc-850 rounded-2xl">
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.1 Paid Bookings & Cancellations:</strong> Any paid amounts including security deposits are strictly non-refundable in the event of canceling a booking, contract, or reservation 14 days or less prior to the scheduled check-in arrival date. All annual/bi-annual bookings require a strict one (1) month formal notice and one (1) month financial penalty for early termination of the contract period.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.2 Transit Timings:</strong> Official check-in time is 3:00 PM and check-out time is exactly 12:00 Noon. Any delay in vacating the property not authorized in writing will mandate a penalty charge of AED 200 per hour, which will be directly deducted from the security/damage deposit held.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.3 Refundable Security Deposit:</strong> A deposit will be held by the Company as insurance against damage, keys/card replacement, or utility exceeding. This deposit is processed and dispatched for refund within 2 to 5 working days post-handover inspection by an Authentic Holiday Homes L.L.C representative.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.4 Code of Conduct and Behavior:</strong> Extreme noise, rowdiness, and parties with loud music are strictly prohibited by Dubai community laws. Authentic Holiday Homes maintains a zero-tolerance policy; any breach will result in immediate tenant eviction without refund and withholding the security deposit as a regulatory violation penalty.
                </p>
                <p className="p-3 bg-red-100/30 dark:bg-red-950/10 border border-red-200/20 rounded-xl text-rose-500">
                  <strong className="font-bold">1.5 STRICT PETS & NON-SMOKING ENFORCEMENT:</strong> All company properties are certified as strictly non-smoking and pets are not permitted (unless a specific written permission is granted by the operator). Violation of this clean-air rule mandates an automatic AED 2,000 extra cleaning and sanitization penalty fee plus the cost of any damage.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.6 Dubai Tourism Fee:</strong> Tourism Dirham Fees are legal tariffs registered under the Dubai DTCM Department, and are collected on page 1 of this agreement for up to the first 30 nights of stay.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.14 Key and Card Surcharge:</strong> Key loss triggers locks rekeying. A charge of AED 200 is levied for any lost apartment key, and access card replacements are charged at cost as determined by Building Management.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.17 No Liability Undertaking:</strong> The Operator undertakes no liability for personal injury, water/electricity misuse, balconing, slips, or personal item loss. Tenants must closely supervise minors at all times.
                </p>
                <p>
                  <strong className="text-zinc-900 dark:text-white">1.19 Right of Entry:</strong> The operator reserves the right to absolute entry for urgent maintenance or regulatory inspection with reasonable warning, or with 24 hours notice for future booking viewings.
                </p>
              </div>
            </div>

            {/* Signatures Panel */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Operator Signature Display */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    ON BEHALF OF OPERATOR / الطرف الأول (المشغل)
                  </span>
                  <div className="border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-6 h-48 bg-zinc-50 dark:bg-zinc-950/30 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center gap-1.5 text-zinc-500 font-extrabold text-[10px] uppercase">
                      <ShieldCheck size={14} className="text-[#B22234]" />
                      <span>Licensing Authorized Stamp</span>
                    </div>

                    {/* Styled Digital Stamp & Vector signature */}
                    <div className="my-auto self-center flex flex-col items-center justify-center relative">
                      <div className="w-24 h-24 border-[3px] border-[#B22234]/40 rounded-full flex flex-col items-center justify-center text-[7px] text-[#B22234] font-black uppercase tracking-tight rotate-12 bg-white/40 dark:bg-zinc-900/40 relative z-10 select-none shadow-sm">
                        <span>AUTHENTIC</span>
                        <span className="text-[10px] text-brand border-y border-brand/20 my-0.5 px-1 font-sans">DUBAI HOLIDAY</span>
                        <span>HOMES L.L.C</span>
                      </div>
                      <span className="font-serif italic text-xl font-bold tracking-wider text-zinc-350 dark:text-zinc-700 select-none absolute select-none pointer-events-none -rotate-12 translate-y-3 z-0">
                        AuthHolidayHomes
                      </span>
                    </div>

                    <div className="text-[9px] uppercase font-mono text-zinc-400">
                      Signature: Representative - Authentic Holiday Homes LLC
                    </div>
                  </div>
                </div>

                {/* Tenant Signature Pad and Drawer */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    TENANT DIGITAL SIGNATURE / الطرف الثاني - توقيع الضيف
                  </span>

                  <AnimatePresence mode="wait">
                    {signatureImage ? (
                      /* Display Signed State */
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border border-emerald-200 bg-emerald-50/10 dark:border-emerald-900/60 rounded-2xl p-6 h-48 flex flex-col justify-between overflow-hidden relative"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-[10px] uppercase">
                          <CheckCircle2 size={13} />
                          <span>Biometrical Signature Lock Registered</span>
                        </div>
                        
                        <div className="my-auto self-center bg-white dark:bg-zinc-905 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm">
                          <img 
                            src={signatureImage} 
                            alt="Tenant Digital E-Sign" 
                            className="h-20 w-auto object-contain max-w-[280px] dark:invert"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="text-[9px] uppercase font-mono text-zinc-450 flex items-center justify-between mt-1">
                          <span>Signed: {booking.guestName}</span>
                          <span>Verified Status</span>
                        </div>
                      </motion.div>
                    ) : (
                      /* Design Interactive signing fields */
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/40 dark:bg-zinc-950/20 p-5 space-y-4 print:hidden"
                      >
                        {/* Selector Modes */}
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => setSigMode('draw')}
                            className={`flex-1 py-1.5 bg-transparent rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                              sigMode === 'draw' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-450 hover:text-zinc-600'
                            }`}
                          >
                            <PenTool size={13} />
                            <span>Draw Signature</span>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => setSigMode('type')}
                            className={`flex-1 py-1.5 bg-transparent rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                              sigMode === 'type' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-450 hover:text-zinc-600'
                            }`}
                          >
                            <Type size={13} />
                            <span>Type Signature</span>
                          </button>
                        </div>

                        {/* Interactive fields depending on mode */}
                        <div className="h-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden shadow-inner">
                          {sigMode === 'draw' ? (
                            <>
                              <canvas 
                                ref={canvasRef}
                                width={380}
                                height={176}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                                className="w-full h-full cursor-crosshair touch-none"
                              />
                              <button 
                                type="button"
                                onClick={clearCanvas}
                                className="absolute right-3.5 bottom-3.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 p-2 rounded-lg transition-transform hover:scale-105 active:scale-95"
                                title="Clear Drawing"
                              >
                                <RefreshCw size={12} />
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full p-6 space-y-3">
                              <input 
                                type="text"
                                placeholder="Enter Your Full Legal Name / الاسم بالكامل"
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                className="w-full max-w-sm border-b-2 border-zinc-200 dark:border-zinc-800 outline-none p-2 text-center font-bold text-zinc-900 dark:text-white bg-transparent focus:border-brand transition-colors uppercase tracking-wider"
                              />
                              {typedName.trim() && (
                                <p className="font-serif italic text-2xl text-zinc-900 dark:text-white select-none translate-y-1">
                                  {typedName}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Verification checklist checkbox */}
                        <label className="flex items-start gap-2.5 cursor-pointer text-[10px] leading-relaxed font-bold text-zinc-500 select-none">
                          <input 
                            type="checkbox"
                            checked={termAccepted}
                            onChange={(e) => setTermAccepted(e.target.checked)}
                            className="w-4 h-4 text-brand border-zinc-300 rounded focus:ring-brand mt-0.5 cursor-pointer"
                          />
                          <span>
                            I confirm that I have read, understood, and accept the Dubai Holiday Homes letting code of conduct, lease terms 1.1 - 1.19, and authorize this transaction. / أقر بقبول كافة الشروط والبنود الرسمية.
                          </span>
                        </label>

                        {/* CTA submission buttons */}
                        <button
                          type="button"
                          onClick={handleSubmitSignature}
                          disabled={isSigning || (!termAccepted)}
                          className="w-full py-3 bg-[#B22234] hover:bg-[#901c22] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 disabled:dark:text-zinc-650 text-white border-none rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-rose-900/10"
                        >
                          {isSigning ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Signing Legally In Force...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} />
                              <span>Submit Digitally Sealed Signature</span>
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            {/* Regulatory Footer Stamp */}
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between text-[9px] text-zinc-400 font-mono gap-4 uppercase print:mt-10">
              <p>Biometrical Serial stamp: UUID-{booking.id.toUpperCase()}</p>
              <p className="text-center md:text-right text-[10px] font-black text-zinc-450 font-sans tracking-tight">
                Authentic Holiday Homes L.L.C is licensed by Dubai Department of Economy and Tourism (DET).
              </p>
            </div>

          </div>
        </motion.div>
      </div>

    </div>
  );
}
