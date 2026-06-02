import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Mail, Phone, MessageSquare, FileText, Globe, Check, AlertCircle, Save, Printer } from 'lucide-react';
import { AdminBooking } from './types';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

interface BookingDetailsModalProps {
  booking: AdminBooking;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
}

export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateNotes
}: BookingDetailsModalProps) {
  const { settings, formatDate, formatPrice } = useGlobalSettings();
  const [internalNotes, setInternalNotes] = useState(booking.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  if (!isOpen) return null;

  // Calculate nights count
  const dateIn = new Date(booking.checkIn);
  const dateOut = new Date(booking.checkOut);
  const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
  const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(booking.id, internalNotes);
    } catch (e) {
      alert("Failed to update notes: " + (e as Error).message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Status styling colors
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-905/20 text-yellow-700 dark:text-yellow-405',
    confirmed: 'bg-emerald-100 dark:bg-emerald-905/20 text-emerald-700 dark:text-emerald-405',
    checked_in: 'bg-blue-105 dark:bg-blue-905/20 text-blue-700 dark:text-blue-405',
    checked_out: 'bg-indigo-105 dark:bg-indigo-905/20 text-indigo-700 dark:text-indigo-405',
    completed: 'bg-purple-105 dark:bg-purple-905/20 text-purple-700 dark:text-purple-405',
    cancelled: 'bg-red-105 dark:bg-red-905/20 text-red-700 dark:text-red-405',
  };

  const paymentStatusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-905/20 dark:text-green-405',
    unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-905/20 dark:text-rose-405',
    partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-905/20 dark:text-amber-405',
  };

  const acquisitionLabels: Record<string, string> = {
    direct: 'Direct Booking',
    whatsapp: 'WhatsApp chat group',
    airbnb: 'Airbnb Portal link',
    'booking.com': 'Booking.com API',
    other: 'Other offline channel',
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
      />

      {/* Modal surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden my-auto"
      >
        {/* Top Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Booking Ref: #{booking.id.slice(0, 10).toUpperCase()}
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1 leading-snug">
              Stay Reservation Details
            </h2>
          </div>
          <button
            title="Close details"
            type="button"
            onClick={onClose}
            className="p-3 text-zinc-450 dark:text-zinc-550 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable contents wrapper */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* Quick status row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
              <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Status</span>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[booking.status] || 'bg-zinc-100 text-zinc-650'}`}>
                {booking.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
              <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Financial State</span>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${paymentStatusColors[booking.paymentStatus] || 'bg-zinc-100 text-zinc-650'}`}>
                {booking.paymentStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
              <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1">Reservation Source</span>
              <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 block truncate">
                {acquisitionLabels[booking.source] || booking.source.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Accommodation info & Stay Dates */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">Accommodation Premises</h3>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-base font-black text-zinc-900 dark:text-white">
                  {booking.propertyTitle || 'Property Unit'}
                </p>
                <p className="text-xs text-zinc-500 font-bold mt-1">
                  Reference Code: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-black">{booking.propertyRef || 'N/A'}</span>
                </p>
              </div>
            </div>

            {/* Checkin / checkout dates row */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400">Check-In</span>
                <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase mt-1">
                  <Calendar size={13} className="text-zinc-450 shrink-0" />
                  <span>{new Date(booking.checkIn).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-400">Check-Out</span>
                <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-black text-xs uppercase mt-1">
                  <Calendar size={13} className="text-zinc-450 shrink-0" />
                  <span>{new Date(booking.checkOut).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
            </div>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right mt-3">
              Total Duration: {diffNights} {diffNights === 1 ? 'Night' : 'Nights'}
            </p>
          </div>

          {/* Guest Contact info */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">Guest Contacts</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500">Full Name:</span>
                <span className="text-xs font-black text-zinc-850 dark:text-zinc-150">{booking.guestName}</span>
              </div>
              
              {booking.guestEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500">Email Address:</span>
                  <a
                    href={`mailto:${booking.guestEmail}`}
                    className="flex items-center gap-1 text-xs font-black text-brand hover:underline"
                  >
                    <Mail size={12} />
                    <span>{booking.guestEmail}</span>
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-500">Phone Number:</span>
                <div className="flex items-center gap-1 text-xs font-black text-zinc-800 dark:text-zinc-200">
                  <Phone size={12} className="text-zinc-400" />
                  <span>{booking.guestPhone || 'N/A'}</span>
                </div>
              </div>

              {/* Instant WhatsApp reachability */}
              {booking.guestPhone && (
                <div className="flex justify-end pt-1">
                  <a
                    href={`https://wa.me/${booking.guestPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-wide transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                    </svg>
                    <span>Open on WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Breakdown / Rent Structure */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1 block">Financial Summary & Fee Structure</h3>
            
            {booking.rentPerMonth ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between font-bold text-zinc-605 dark:text-zinc-400 border-b border-zinc-200/40 dark:border-zinc-800 pb-1.5">
                  <span>Monthly Base Rent:</span>
                  <span>AED {booking.rentPerMonth} / month × {booking.billingMonths || 1} stay billing months</span>
                </div>
                
                {/* Itemized extra fees */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-zinc-500 font-bold">
                  {!!booking.dtcmFee && (
                    <div className="flex justify-between">
                      <span>DTCM Tourism Fee:</span>
                      <span>AED {booking.dtcmFee}</span>
                    </div>
                  )}
                  {!!booking.agencyFee && (
                    <div className="flex justify-between">
                      <span>Agency/Booking Fee:</span>
                      <span>AED {booking.agencyFee}</span>
                    </div>
                  )}
                  {!!booking.securityDeposit && (
                    <div className="flex justify-between">
                      <span>Refundable Deposit:</span>
                      <span>AED {booking.securityDeposit}</span>
                    </div>
                  )}
                  {!!booking.cleaningFee && (
                    <div className="flex justify-between">
                      <span>Exit Cleaning Fee:</span>
                      <span>AED {booking.cleaningFee}</span>
                    </div>
                  )}
                  {!!booking.miscFee && (
                    <div className="flex justify-between">
                      <span>Miscellaneous Charges:</span>
                      <span>AED {booking.miscFee}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-805 space-y-1 font-bold text-zinc-650 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>First Month Combined:</span>
                    <span>AED {booking.firstMonthTotal || (booking.rentPerMonth + (booking.dtcmFee || 0) + (booking.agencyFee || 0) + (booking.securityDeposit || 0) + (booking.cleaningFee || 0) + (booking.miscFee || 0))}</span>
                  </div>
                  {(booking.billingMonths || 1) > 1 && (
                    <div className="flex justify-between">
                      <span>Subsequent Rent/Month:</span>
                      <span>AED {booking.nextMonthTotal || booking.rentPerMonth}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-black text-zinc-800 dark:text-zinc-200 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span>Grand Total Amount:</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1">
                    AED {booking.grandTotalAmount || booking.totalPrice}
                  </span>
                </div>
              </div>
            ) : (
              // Legacy fallback spacing calculation
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-500 font-bold">
                  <span>Total Stays (Nightly Rate):</span>
                  <span>{diffNights} nights x <CurrencySymbol />{Math.round(booking.totalPrice / (diffNights || 1))} avg</span>
                </div>
                <div className="flex justify-between font-black text-zinc-800 dark:text-zinc-200 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                  <span>Gross Total Invoice Price:</span>
                  <span className="text-sm text-zinc-900 dark:text-white flex items-center gap-1">
                    <CurrencySymbol />{booking.totalPrice}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Special Terms & Conditions details if any */}
          {booking.specialTermsAndConditions && (
            <div className="p-5 bg-amber-50/45 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-3xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-505 mb-2 block">Special Terms and Conditions</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-330 leading-relaxed font-bold">
                {booking.specialTermsAndConditions}
              </p>
            </div>
          )}

          {/* Live Payment Schedule Progress */}
          {booking.paymentSchedule && booking.paymentSchedule.length > 0 && (
            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Payment Instalments Schedule</h3>
              <div className="space-y-2">
                {booking.paymentSchedule.map((installment: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-extrabold text-zinc-805 dark:text-zinc-200">
                        Instalment #{installment.payment_no}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                        Due Date: <span className="font-mono">{installment.due_date}</span>
                      </div>
                      <div className="text-[10px] text-zinc-550 font-bold max-w-[180px] truncate mt-0.5">
                        {installment.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-zinc-900 dark:text-white">
                        AED {installment.amount}
                      </div>
                      <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                        installment.status === 'Paid' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : installment.status === 'Overdue'
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                          : 'bg-zinc-105 dark:bg-zinc-800 text-zinc-500'
                      }`}>
                        {installment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Host Notes (Editable directly from Details) */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <FileText size={12} />
                <span>Private Host Annotations</span>
              </h3>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="flex items-center gap-1 px-3 py-1 bg-zinc-900 dark:bg-zinc-105 text-white dark:text-zinc-900 hover:scale-105 rounded-xl text-[10px] uppercase font-black tracking-wide transition-all disabled:opacity-50"
              >
                <Save size={10} />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record cleaning notes, door codes, security deposits, guest preferences, or special requests..."
              className="w-full p-4 text-xs font-medium text-zinc-805 dark:text-zinc-200 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Actions Timeline panel for state machine */}
          <div className="p-5 border-2 border-brand/10 dark:border-brand/20 bg-brand/5 dark:bg-brand/5 rounded-3xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-dark dark:text-brand-light mb-3 block">
              Administrative Command Center
            </h3>
            <p className="text-xs text-zinc-500 mb-4 font-semibold leading-relaxed">
              Transition the guest itinerary safely through stay statuses below. Date conflicts are automatically locked.
            </p>
            
            <div className="flex flex-wrap gap-2.5">
              {booking.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Confirm Stay
                </button>
              )}

              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(booking.id, 'checked_in')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Register Check-In
                </button>
              )}

              {booking.status === 'checked_in' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(booking.id, 'checked_out')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Register Check-Out
                </button>
              )}

              {booking.status === 'checked_out' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(booking.id, 'completed')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Mark Stay Completed
                </button>
              )}

              {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'checked_out' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-900/20 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  Abruptly Cancel Reservation
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-zinc-200/40 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowInvoice(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl text-[10px] font-black tracking-widest uppercase cursor-pointer shadow-md"
              >
                <Printer size={13} />
                <span>View & Print Corporate Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Corporate Letterhead Invoice Overlay popup */}
      {showInvoice && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto">
          <div 
            className="bg-white text-zinc-950 w-full max-w-3xl rounded-3xl shadow-2xl relative print:shadow-none print:rounded-none flex flex-col justify-between min-h-[750px] overflow-hidden print:block"
            style={{
              paddingTop: `${settings.letterheadMarginTop ?? 20}px`,
              paddingBottom: `${settings.letterheadMarginBottom ?? 20}px`,
              paddingLeft: `${settings.letterheadMarginLeft ?? 20}px`,
              paddingRight: `${settings.letterheadMarginRight ?? 20}px`,
            }}
          >
            
            {/* Action buttons (hidden on print) */}
            <div className="absolute top-4 right-4 flex gap-2 print:hidden z-20">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              >
                <Printer size={14} /> Print / Export PDF
              </button>
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-805 rounded-xl transition-all"
              >
                ✕
              </button>
            </div>

            {/* Custom Background Letterhead PNG Background */}
            {settings.letterheadImageUrl ? (
              <div 
                className="absolute inset-0 pointer-events-none z-0" 
                style={{ 
                  backgroundImage: `url(${settings.letterheadImageUrl})`,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }} 
              />
            ) : (
              <div className="absolute inset-0 pointer-events-none z-0 bg-zinc-50/10 flex items-center justify-center border border-dashed border-zinc-200 print:hidden">
                <span className="text-[11px] uppercase tracking-wider text-zinc-350 font-black animate-pulse">No Custom PNG Letterhead Loaded</span>
              </div>
            )}

            {/* Base Company Receipt Header Info overlaid on the layout nicely */}
            <div className="border-b border-zinc-150 pb-4 z-10 flex justify-between items-end">
              <div>
                <h1 className="text-lg font-black tracking-tight" style={{ color: settings.customBrandColor }}>
                  {settings.companyName || 'Authentic Holiday Homes LLC'}
                </h1>
                <p className="text-[10px] text-zinc-550 font-bold tracking-wide mt-1">
                  Tax TRN: <span className="text-zinc-800">{settings.trn || 'XXXXXXXXX'}</span> | License: <span className="text-zinc-800">{settings.licenseNumber || 'XXXXXXX'}</span>
                </p>
              </div>
              <div className="text-right text-[10px] text-zinc-500 font-sans max-w-[200px]">
                <p className="whitespace-pre-line leading-tight">{settings.address}</p>
              </div>
            </div>

            {/* Doc Invoice Body */}
            <div className="my-6 z-10 space-y-5 flex-1 select-text">
              <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div>
                  <h2 className="text-sm font-black tracking-tight text-zinc-850 uppercase font-sans">OFFICIAL BOOKING INVOICE</h2>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">Reference ID: <span className="text-zinc-800 font-bold">{booking.id.toUpperCase()}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest leading-none">Date Issued</p>
                  <p className="text-xs font-black text-zinc-850 mt-1">{formatDate(new Date())}</p>
                </div>
              </div>

              {/* Guest & Property stay details card */}
              <div className="grid grid-cols-2 gap-6 text-[11px] text-zinc-600 leading-normal bg-zinc-50 py-4 px-5 rounded-2xl border border-zinc-100">
                <div>
                  <h3 className="font-black text-zinc-400 uppercase tracking-wider text-[9px] mb-2">GUEST CLIENT</h3>
                  <p><span className="font-bold text-zinc-700">Resident Name:</span> {booking.guestName}</p>
                  {booking.guestPhone && <p><span className="font-bold text-zinc-700">Phone Hotline:</span> {booking.guestPhone}</p>}
                  {booking.guestEmail && <p><span className="font-bold text-zinc-700">Email Address:</span> {booking.guestEmail}</p>}
                </div>
                <div>
                  <h3 className="font-black text-zinc-400 uppercase tracking-wider text-[9px] mb-2">STAY DETAILS</h3>
                  <p><span className="font-bold text-zinc-700">Property Unit:</span> {booking.propertyTitle || 'Holiday Home Unit'}</p>
                  <p><span className="font-bold text-zinc-700">Apt Reference:</span> {booking.propertyRef || 'N/A'}</p>
                  <p><span className="font-bold text-zinc-700">Stay Period:</span> {formatDate(booking.checkIn)} to {formatDate(booking.checkOut)} ({diffNights} nights)</p>
                </div>
              </div>

              {/* Invoice Itemized table */}
              <div className="pt-2">
                {booking.rentPerMonth ? (
                  <div className="space-y-4">
                    <table className="w-full text-xs text-zinc-700 border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400 text-left">
                          <th className="py-2">Fee Element Description</th>
                          <th className="py-2 text-right">Unit Rate</th>
                          <th className="py-2 text-right">Quantity / Months</th>
                          <th className="py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-zinc-100 font-semibold">
                          <td className="py-3 text-zinc-850">Base Monthly Rent - Luxe Listing Stay</td>
                          <td className="py-3 text-right font-mono font-bold">{formatPrice(booking.rentPerMonth)}</td>
                          <td className="py-3 text-right font-semibold">{booking.billingMonths || 1} months</td>
                          <td className="py-3 text-right font-mono font-extrabold">{formatPrice(booking.rentPerMonth * (booking.billingMonths || 1))}</td>
                        </tr>
                        {!!booking.dtcmFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Tourism Dirham Fee (DTCM Approved)</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.dtcmFee)}</td>
                          </tr>
                        )}
                        {!!booking.agencyFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Agency Processing & Admin Fee</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.agencyFee)}</td>
                          </tr>
                        )}
                        {!!booking.securityDeposit && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-650">
                            <td className="py-2 font-semibold">Refundable Guest Security Deposit</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Held in escrow</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.securityDeposit)}</td>
                          </tr>
                        )}
                        {!!booking.cleaningFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Exit Cleaning & Sanitization Service</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.cleaningFee)}</td>
                          </tr>
                        )}
                        {!!booking.miscFee && (
                          <tr className="border-b border-zinc-100 text-[11px] text-zinc-600">
                            <td className="py-2">Miscellaneous Supplementary Services</td>
                            <td className="py-2 text-right font-mono">N/A</td>
                            <td className="py-2 text-right">Flat One-time</td>
                            <td className="py-2 text-right font-mono font-bold">{formatPrice(booking.miscFee)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Installments in printed invoice */}
                    {booking.paymentSchedule && booking.paymentSchedule.length > 0 && (
                      <div className="pt-2 border-t border-dashed border-zinc-200">
                        <h4 className="text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-wider">Scheduled Installment Apportionment</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {booking.paymentSchedule.map((ps: any, idx: number) => (
                            <div key={idx} className="bg-zinc-50 border border-zinc-100 py-1.5 px-3 rounded-xl flex justify-between items-center text-[10px] font-semibold text-zinc-700">
                              <div>
                                <span>No. {ps.payment_no} (Due {formatDate(new Date(ps.due_date))})</span>
                                <span className="block text-[8px] text-zinc-400 font-bold truncate max-w-[130px]">{ps.description}</span>
                              </div>
                              <span className="font-mono font-extrabold">{formatPrice(ps.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-xs text-zinc-700 border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400 text-left">
                        <th className="py-2">Short-Term Vacation Description</th>
                        <th className="py-2 text-center">Nights</th>
                        <th className="py-2 text-right">Nightly Price</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100">
                        <td className="py-3 font-semibold text-zinc-850">
                          Luxury Accommodation Stay at [{booking.propertyTitle || 'Holiday Home Unit'}]
                        </td>
                        <td className="py-3 text-center font-semibold">{diffNights}</td>
                        <td className="py-3 text-right font-mono font-bold">{formatPrice(Math.round(booking.totalPrice / (diffNights || 1)))}</td>
                        <td className="py-3 text-right font-mono font-extrabold">{formatPrice(booking.totalPrice)}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-[10px] text-zinc-400 italic" colSpan={2}>
                          Includes tourism dirham fees, utility charges, and service handling. Fully compliant under DTCM regulation parameters.
                        </td>
                        <td className="py-3 text-right font-bold text-zinc-400 text-[10px]">VAT Inclusive Rate:</td>
                        <td className="py-3 text-right font-mono text-zinc-500 text-[10px]">5.0%</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Total Summary */}
              <div className="flex flex-col items-end pt-4 border-t border-zinc-100 space-y-1">
                <div className="flex justify-between w-64 text-xs">
                  <span className="text-zinc-500 font-bold">Price Subtotal:</span>
                  <span className="font-mono text-zinc-700 font-bold">{formatPrice(booking.grandTotalAmount || booking.totalPrice)}</span>
                </div>
                <div className="flex justify-between w-64 text-xs font-black text-zinc-900 pt-2 border-t border-zinc-200">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-sm leading-none" style={{ color: settings.customBrandColor }}>{formatPrice(booking.grandTotalAmount || booking.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Letterhead Footer */}
            <div className="border-t border-zinc-200 pt-4 text-center text-[9px] text-zinc-400 z-10 flex justify-between items-center font-semibold">
              <span>Hotline support: {settings.phone}</span>
              <span>General email: {settings.email}</span>
              <span className="font-bold text-zinc-650 uppercase tracking-widest">{settings.website}</span>
            </div>

            {/* print-override layout */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                .print\\:block, .print\\:block * {
                  visibility: visible !important;
                }
                .fixed {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}} />

          </div>
        </div>
      )}
    </div>
  );
}
