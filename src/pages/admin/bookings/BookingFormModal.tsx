import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, DollarSign, User, Mail, Phone, Info, AlertTriangle } from 'lucide-react';
import { Property } from '../../../types';
import { AdminBooking } from './types';
import CurrencySymbol from '../../../components/CurrencySymbol';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  existingBookings: AdminBooking[];
  onSave: (bookingData: Omit<AdminBooking, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export default function BookingFormModal({
  isOpen,
  onClose,
  properties,
  existingBookings,
  onSave
}: BookingFormModalProps) {
  const [propertyId, setPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partially_paid' | 'overdue' | 'refunded' | 'deposit_held' | 'deposit_refunded'>('unpaid');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('confirmed');
  const [source, setSource] = useState<'direct' | 'whatsapp' | 'airbnb' | 'booking.com' | 'other'>('direct');
  const [notes, setNotes] = useState('');
  
  // Real-world dynamic stay values according to system guidelines
  const [rentPerMonth, setRentPerMonth] = useState<number>(0);
  const [dtcmFee, setDtcmFee] = useState<number>(0);
  const [agencyFee, setAgencyFee] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [miscFee, setMiscFee] = useState<number>(0);
  const [billingMonths, setBillingMonths] = useState<number>(1);
  const [specialTerms, setSpecialTerms] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [dateConflict, setDateConflict] = useState<AdminBooking | null>(null);

  const selectedProperty = properties.find(p => p.id === propertyId);

  // Auto-calculate stay duration and prefill billing months and monthly rent
  const dateIn = checkIn ? new Date(checkIn) : null;
  const dateOut = checkOut ? new Date(checkOut) : null;
  const numberOfStayDays = (dateIn && dateOut && dateOut > dateIn) 
    ? Math.ceil(Math.abs(dateOut.getTime() - dateIn.getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const systemCalculatedMonths = Math.max(1, Math.ceil(numberOfStayDays / 30));

  // Sync state for billing months when systemCalculatedMonths changes
  useEffect(() => {
    if (systemCalculatedMonths > 0) {
      setBillingMonths(systemCalculatedMonths);
    }
  }, [systemCalculatedMonths]);

  // Adjust default monthly rent based on property
  useEffect(() => {
    if (selectedProperty) {
      // Standard monthly rent is property.price if it represents a monthly rate (>= 1000)
      // or property.price * 30 if it represents a nightly rate (< 1000)
      const suggestedRent = selectedProperty.price < 1000 ? selectedProperty.price * 30 : selectedProperty.price;
      setRentPerMonth(suggestedRent);
    } else {
      setRentPerMonth(0);
    }
  }, [propertyId, selectedProperty]);

  // Financial calculations
  const totalRent = rentPerMonth * billingMonths;
  const firstMonthTotal = rentPerMonth + dtcmFee + agencyFee + securityDeposit + cleaningFee + miscFee;
  const grandTotalAmount = totalRent + dtcmFee + agencyFee + securityDeposit + cleaningFee + miscFee;

  // Sync totalPrice state with the calculated grandTotalAmount
  useEffect(() => {
    setTotalPrice(grandTotalAmount);
  }, [grandTotalAmount]);

  // Handle checking for overlaps in dates
  useEffect(() => {
    if (!propertyId || !checkIn || !checkOut) {
      setDateConflict(null);
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (start >= end) {
      setDateConflict(null);
      return;
    }

    // Check overlaps against confirmed/paid/pending bookings for this property
    const conflict = existingBookings.find(b => {
      if (b.propertyId !== propertyId || b.status === 'cancelled') return false;
      const bStart = new Date(b.checkIn);
      const bEnd = new Date(b.checkOut);
      return start < bEnd && end > bStart;
    });

    setDateConflict(conflict || null);
  }, [propertyId, checkIn, checkOut, existingBookings]);

  // Helper to generate schedule description dynamically
  const getFeesDescription = () => {
    const activeFees: string[] = [];
    if (dtcmFee > 0) activeFees.push(`DTCM (${dtcmFee})`);
    if (agencyFee > 0) activeFees.push(`Agency (${agencyFee})`);
    if (securityDeposit > 0) activeFees.push(`Deposit (${securityDeposit})`);
    if (cleaningFee > 0) activeFees.push(`Cleaning (${cleaningFee})`);
    if (miscFee > 0) activeFees.push(`Misc (${miscFee})`);
    return activeFees.length > 0 ? activeFees.join(' + ') : 'additional fees';
  };

  // Generate dynamic payment schedule array
  const generateSchedule = () => {
    const list: any[] = [];
    if (!checkIn || billingMonths <= 0) return list;

    const feesDesc = getFeesDescription();
    list.push({
      payment_no: 1,
      due_date: checkIn,
      description: `First month rent + ${feesDesc}`,
      amount: firstMonthTotal,
      status: 'Pending'
    });

    const startDate = new Date(checkIn);
    for (let i = 1; i < billingMonths; i++) {
      const nextDate = new Date(startDate);
      nextDate.setMonth(startDate.getMonth() + i);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const dueDateStr = `${yyyy}-${mm}-${dd}`;
      list.push({
        payment_no: i + 1,
        due_date: dueDateStr,
        description: 'Monthly rent only',
        amount: rentPerMonth,
        status: 'Pending'
      });
    }
    return list;
  };

  const paymentSchedule = generateSchedule();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!propertyId) {
      setValidationError('Select a lodging property unit');
      return;
    }
    if (!checkIn || !checkOut) {
      setValidationError('Please input both Stay Check-In and Check-Out dates');
      return;
    }
    const startD = new Date(checkIn);
    const endD = new Date(checkOut);
    if (endD <= startD) {
      setValidationError('Stay Check-Out date must proceed Check-In date');
      return;
    }

    if (rentPerMonth <= 0) {
      setValidationError('Rent per month is required and must be greater than zero');
      return;
    }

    // Minimum stay check
    const minNights = (selectedProperty as any)?.minimumNights ?? 30; // Business model default is monthly
    if (numberOfStayDays < minNights) {
      setValidationError(`Minimum stay duration for this listing is ${minNights} nights. Your selected duration is only ${numberOfStayDays} nights.`);
      return;
    }
    if (!guestName || !guestPhone) {
      setValidationError('Guest Full Name and Telephone phone number are required details');
      return;
    }
    if (dateConflict) {
      setValidationError('This date range overlaps with an existing guest itinerary reservation!');
      return;
    }

    setIsSubmitting(true);
    try {
      const dataPayload = {
        propertyId,
        propertyTitle: selectedProperty?.title || 'Property Unit',
        propertyRef: selectedProperty?.referenceNo || propertyId,
        checkIn,
        checkOut,
        guestId: `manual_agent_${Math.random().toString(36).substring(2, 9)}`,
        guestName,
        guestEmail,
        guestPhone,
        totalPrice: grandTotalAmount,
        paymentStatus,
        status,
        source,
        notes,
        // Fee and stay flow fields
        numberOfStayDays,
        calculatedNumberofMonths: systemCalculatedMonths,
        billingMonths,
        rentPerMonth,
        dtcmFee,
        agencyFee,
        securityDeposit,
        cleaningFee,
        miscFee,
        firstMonthTotal,
        nextMonthTotal: rentPerMonth,
        grandTotalAmount,
        paymentSchedule,
        specialTermsAndConditions: specialTerms
      };
      
      await onSave(dataPayload);
      onClose();
      // Reset inputs
      setPropertyId('');
      setCheckIn('');
      setCheckOut('');
      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setTotalPrice(0);
      setPaymentStatus('unpaid');
      setStatus('confirmed');
      setSource('direct');
      setNotes('');
      setRentPerMonth(0);
      setDtcmFee(0);
      setAgencyFee(0);
      setSecurityDeposit(0);
      setCleaningFee(0);
      setMiscFee(0);
      setBillingMonths(1);
      setSpecialTerms('');
    } catch (err) {
      setValidationError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
      />

      {/* Modal Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden my-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-brand-light">
              Manual Reservation Booking
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
              Intake New Booking
            </h2>
          </div>
          <button
            title="Dismiss intake"
            type="button"
            onClick={onClose}
            className="p-3 text-zinc-450 dark:text-zinc-550 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {/* Validation Error banner */}
          {validationError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl flex items-center gap-2 text-xs font-bold border border-rose-100 dark:border-rose-900">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Date Block Overlay banner */}
          {dateConflict && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-455 rounded-2xl flex items-start gap-2.5 text-xs font-bold border border-amber-100 dark:border-amber-900/55">
              <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wide">Stay Date Conflict!</p>
                <p className="font-medium text-[11px] mt-1 text-zinc-500 max-w-sm leading-relaxed">
                  These dates overlap custom guest stay {dateConflict.guestName} (#{dateConflict.id.slice(0,6)}) from {dateConflict.checkIn} to {dateConflict.checkOut}.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Core details */}
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
              1. Accommodation & Stay Period
            </h3>

            {/* Select unit */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                Accommodation Listing Unit
              </label>
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">-- Choose Accommodation unit --</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.referenceNo || p.id.slice(0,6)}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid CheckIn / CheckOut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Check-In Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-4 pl-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Check-Out Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-4 pl-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                </div>
              </div>
            </div>

            {numberOfStayDays > 0 && (
              <div className="p-3 bg-brand/5 dark:bg-brand/10 text-brand-dark dark:text-brand-light font-bold text-xs rounded-xl flex justify-between">
                <span>Total Calculated Days: <strong className="font-black">{numberOfStayDays} days</strong></span>
                <span>Est. Stay Months: <strong className="font-black">{systemCalculatedMonths}</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Guest Profile */}
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
              2. Guest Portfolio
            </h3>

            {/* Guest Name & email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Guest Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-4 pl-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Guest Email (Optional)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="guest@mail.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-4 pl-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                </div>
              </div>
            </div>

            {/* Guest Phone number */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                Guest Phone Number (WhatsApp / Mobile)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g. +971 50 123 4567"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-4 pl-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              </div>
            </div>
          </div>

          {/* Section 3: Fee Collection & Bill Structure */}
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
              3. Stay Fee & Rent Structuring
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Rent Per Month (AED)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={rentPerMonth || ''}
                    onChange={(e) => setRentPerMonth(Number(e.target.value))}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-bold text-zinc-850 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Billing Months
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={billingMonths || ''}
                    onChange={(e) => setBillingMonths(Number(e.target.value))}
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-bold text-zinc-850 dark:text-zinc-100"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1 uppercase font-semibold">
                    System calculated default: {systemCalculatedMonths}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                  DTCM Fee (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={dtcmFee || ''}
                  onChange={(e) => setDtcmFee(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                  Agency Fee (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={agencyFee || ''}
                  onChange={(e) => setAgencyFee(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                  Security Deposit (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={securityDeposit || ''}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                  Cleaning Fee (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cleaningFee || ''}
                  onChange={(e) => setCleaningFee(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-black tracking-wider text-zinc-400 mb-1">
                  Misc Fee (AED)
                </label>
                <input
                  type="number"
                  min="0"
                  value={miscFee || ''}
                  onChange={(e) => setMiscFee(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Calculations review panel */}
            <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-zinc-650 dark:text-zinc-400">
                <span>Total Calculated Stay Rent ({rentPerMonth} × {billingMonths} months)</span>
                <span>AED {totalRent}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-650 dark:text-zinc-400">
                <span>First Month Combined Total (Rent + All Fees)</span>
                <span>AED {firstMonthTotal}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                <span className="font-extrabold uppercase tracking-widest text-[10px]">Grand Total Amount (Due for stay)</span>
                <span className="font-black text-sm">AED {grandTotalAmount}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Live Payment Schedule Generated Preview */}
          {paymentSchedule.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-3">
              <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
                4. Automatically Generated Payment Schedule
              </h3>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-955 border-b border-zinc-150 uppercase text-[9px] font-black tracking-wider text-zinc-400">
                      <th className="p-3">Pmnt No</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSchedule.map((ps, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 font-semibold text-zinc-700 dark:text-zinc-300">
                        <td className="p-3">{ps.payment_no}</td>
                        <td className="p-3 font-mono">{ps.due_date}</td>
                        <td className="p-3 text-zinc-550 dark:text-zinc-400 max-w-[200px] truncate">{ps.description}</td>
                        <td className="p-3 text-right font-black">AED {ps.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 5: Specific Terms and Channel details */}
          <div className="bg-zinc-50 dark:bg-zinc-950/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-850 space-y-4">
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-400 font-black">
              5. Lead Channels, Special Terms & Remarks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Lead Channel Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="direct">Direct Booking / Agent</option>
                  <option value="whatsapp">WhatsApp Group Chat</option>
                  <option value="airbnb">Airbnb Portal Listings</option>
                  <option value="booking.com">Booking.com</option>
                  <option value="other">Other Booking Channels</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Initial Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="unpaid">Unpaid / Awaiting Deposit</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Fully Settled (Paid)</option>
                </select>
              </div>
            </div>

            {/* Special terms and conditions */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-450 mb-1">
                Special Terms and Conditions (Guest visible)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Guest will pay DEWA separately. Security deposit refundable after inspection on checkout."
                value={specialTerms}
                onChange={(e) => setSpecialTerms(e.target.value)}
                className="w-full p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Private Host Notes */}
            <div>
              <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                Internal Host Annotations / Remarks (Admin only)
              </label>
              <textarea
                rows={2}
                placeholder="Internal notes, custom agreements, approved managers exceptions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Trigger buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-xs uppercase text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950 grid place-items-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!dateConflict}
              className="flex-2 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-black dark:hover:bg-zinc-100 transition-all disabled:opacity-40"
            >
              {isSubmitting ? 'Registering...' : 'Register Reservation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
