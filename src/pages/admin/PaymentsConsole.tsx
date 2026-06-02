import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { 
  CreditCard, DollarSign, Calendar, User, FileText, CheckCircle2, 
  RefreshCw, PlusCircle, Clock, AlertTriangle, ShieldCheck, Mail, Phone, ExternalLink, X, MapPin
} from 'lucide-react';
import { AdminBooking, BookingPaymentInstallment } from './bookings/types';

interface PaymentsConsoleProps {
  userUid?: string;
  userRole?: string;
  userName?: string;
  userNameEmail?: string;
  propertiesList?: any[];
}

export default function PaymentsConsole({ userUid, userRole, userName, userNameEmail, propertiesList = [] }: PaymentsConsoleProps) {
  const [paymentsTab, setPaymentsTab] = useState<'invoices' | 'collections'>('invoices');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [paymentTickets, setPaymentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for invoice details
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // New cash-retrieval scheduling state
  const [isAddingPickup, setIsAddingPickup] = useState(false);
  const [newPropId, setNewPropId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPrivileged = ['super_admin', 'admin', 'agent', 'host'].includes(userRole || '');

  useEffect(() => {
    setLoading(true);
    
    // 1. Subscribe to Booking lists
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      let bList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminBooking[];

      if (!isPrivileged && userUid) {
        bList = bList.filter(b => b.guestId === userUid);
      }

      // Sort by creation or checkIn desc
      bList.sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
      setBookings(bList);
    }, (err) => {
      console.error("PaymentsConsole: Error fetching bookings dataset:", err);
    });

    // 2. Subscribe to rent pickup requests / billing disputes (tickets filtered to payments categories)
    const unsubTickets = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      let allTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Filter specifically for payments-related components
      let payTickets = allTickets.filter(t => 
        t.category === 'rent_collection' || t.category === 'invoice_query'
      );

      if (!isPrivileged && userUid) {
        payTickets = payTickets.filter(t => t.userId === userUid);
      }

      payTickets.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPaymentTickets(payTickets);
      setLoading(false);
    }, (err) => {
      console.error("PaymentsConsole: Error fetching financial tickets dataset:", err);
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubTickets();
    };
  }, [userUid, userRole]);

  // Handle lodging new rent pickup or billing dispute
  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newDate) {
      alert("Please fill in scheduled pickup date, title & payment details.");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedProp = propertiesList.find(p => p.id === newPropId);
      
      const ticketPayload: any = {
        userId: userUid || 'unknown_anon',
        userName: userName || 'Resident Name',
        userProfileRole: userRole || 'guest',
        category: 'rent_collection',
        title: `💰 [Rent pickup] ${newTitle.trim()}`,
        description: newDesc.trim(),
        status: 'pending',
        scheduledDate: newDate,
        createdAt: serverTimestamp(),
        replies: []
      };

      if (newPropId) {
        ticketPayload.propertyId = newPropId;
        ticketPayload.propertyTitle = selectedProp?.title || 'Selected Unit';
      }

      await addDoc(collection(db, 'tickets'), ticketPayload);
      
      // Reset
      setNewTitle('');
      setNewDesc('');
      setNewPropId('');
      setNewDate('');
      setIsAddingPickup(false);
      alert("Cash Pickup request submitted successfully!");
    } catch (err: any) {
      console.error("Failed to submit cash collection pickup:", err);
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modify invoice payment status (Admins only)
  const handleUpdatePaymentStatus = async (bookingId: string, status: any) => {
    setUpdatingPaymentId(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus: status
      });
      // update current model if open
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, paymentStatus: status } : null);
      }
    } catch (err: any) {
      console.error("Error updating payment status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Mark scheduled pickup ticket complete
  const handleUpdateCollectionStatus = async (ticketId: string, status: 'pending' | 'in_progress' | 'resolved') => {
    try {
      const statusMessage = `✅ [Cash Collection Update] Rent retrieval status changed to "${status.toUpperCase()}" by ${userName || 'Rent Collector'}.`;
      await updateDoc(doc(db, 'tickets', ticketId), {
        status,
        replies: arrayUnion({
          id: `pay_log_${Math.random().toString(36).substring(2, 9)}`,
          senderId: 'system',
          senderName: 'Finance System',
          senderRole: 'system',
          message: statusMessage,
          createdAt: new Date().toISOString()
        })
      });
    } catch (err: any) {
      console.error("Error completing pickup request:", err);
      alert("Failed to modify: " + err.message);
    }
  };

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border border-green-220';
      case 'partially_paid':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-200';
      case 'deposit_held':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200';
      default:
        return 'bg-zinc-150 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200';
    }
  };

  // Financial aggregates
  const totalInvoiced = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  const totalPaid = bookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + (Number(b.totalPrice) || 0) : sum, 0);
  const totalPending = totalInvoiced - totalPaid;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-950 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Total Value Invoiced</span>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-none font-mono">
              AED {(totalInvoiced).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-400 rounded-2xl border border-zinc-100 dark:border-zinc-850">
            <FileText size={20} />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-405 tracking-wider text-green-600 dark:text-green-400">Payments Cleared</span>
            <h3 className="text-2xl font-black text-green-600 dark:text-green-400 leading-none font-mono">
              AED {(totalPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-3xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-405 tracking-wider text-amber-600 dark:text-amber-400">Balance Pending</span>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none font-mono">
              AED {(totalPending).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-655 dark:text-amber-400 rounded-2xl">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Settings layout header card */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-zinc-50 dark:bg-zinc-900/10 p-4 rounded-[2rem] border border-zinc-100 dark:border-zinc-850 gap-4">
        <div className="flex items-center gap-2 border border-zinc-201 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm w-full md:w-auto">
          <button
            type="button"
            onClick={() => setPaymentsTab('invoices')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center ${
              paymentsTab === 'invoices' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <CreditCard size={14} /> Invoices & Billings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setPaymentsTab('collections')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center ${
              paymentsTab === 'collections' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' 
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <DollarSign size={14} /> Rent Cash Collections ({paymentTickets.length})
          </button>
        </div>

        {paymentsTab === 'collections' && !isPrivileged && (
          <button
            type="button"
            onClick={() => setIsAddingPickup(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle size={14} /> Schedule Rent Cash-Pickup
          </button>
        )}
      </div>

      {/* Cash pickup modal / drawer */}
      {isAddingPickup && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] space-y-4 relative animate-feed">
          <button
            type="button"
            onClick={() => setIsAddingPickup(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-2 hover:bg-zinc-105 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
          >
            <X size={16} />
          </button>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-white flex items-center gap-2">
              <DollarSign size={16} className="text-brand" /> Schedule On-Site Rental Cash Pickup
            </h3>
            <p className="text-[10px] text-zinc-500 font-semibold font-sans mt-0.5">Lodge scheduled check-outs, booking payments or deposit handovers by cash directly in your unit location.</p>
          </div>

          <form onSubmit={handleCreatePickup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assointed Villa / Penthouse</label>
                <select
                  value={newPropId}
                  onChange={(e) => setNewPropId(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="">No unit associated</option>
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.unitNumber ? `[Unit ${p.unitNumber}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Cash Retrieval Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-800 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Receipt / Payment Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Schedule final 1st-month cash installment pickup"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-800 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Particular Details & Amount breakdown</label>
              <textarea
                required
                rows={3}
                placeholder="Specify precise cash amount (AED) to be handed over and timeslot preferences..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 rounded-2xl text-xs font-medium text-zinc-800 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingPickup(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 text-zinc-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-brand transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? "Lodging request..." : "Schedule Cash Collection"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List rendered by tab */}
      {paymentsTab === 'invoices' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-850/60 mb-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450">Active Bills & Statements</h4>
            <span className="text-[9.5px] font-mono text-zinc-400">{bookings.length} reservations invoices recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-850/60 text-[9.5px] font-black uppercase tracking-widest text-zinc-400 pb-3">
                  <th className="pb-3 pr-4 font-black">Guest Reservation</th>
                  <th className="pb-3 pr-4 font-black">Linked Premium Unit</th>
                  <th className="pb-3 pr-4 font-black">Check In - Out</th>
                  <th className="pb-3 pr-4 font-black">Grand Total Amount</th>
                  <th className="pb-3 pr-4 font-black">Statement Status</th>
                  <th className="pb-3 text-right font-black">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850/40 text-xs font-semibold text-zinc-850 dark:text-zinc-200">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                    <td className="py-4 pr-4">
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white uppercase text-xs tracking-wider">{b.guestName}</div>
                        <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono tracking-widest mt-1">ID: #{b.id.substring(0,6).toUpperCase()}</div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="max-w-[200px] truncate font-semibold">
                        {b.propertyTitle || 'Elite Dubai Property'}
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-mono text-[10.5px]">
                      {b.checkIn} ➔ {b.checkOut}
                    </td>
                    <td className="py-4 pr-4 font-mono font-black text-zinc-900 dark:text-white">
                      AED {Number(b.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${getPaymentStatusStyle(b.paymentStatus)}`}>
                        {b.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 font-bold transition-all text-[9.5px] uppercase tracking-widest cursor-pointer"
                      >
                        Receipt / Bill
                      </button>
                    </td>
                  </tr>
                ))}

                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-zinc-400 font-bold uppercase tracking-widest">
                      No invoicing or billing records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cash Retrevals ledger */
        <div className="space-y-4">
          {paymentTickets.map(t => (
            <div 
              key={t.id}
              className="p-6 bg-white dark:bg-zinc-900 border border-zinc-202 dark:border-zinc-800/80 rounded-3xl relative flex flex-col justify-between hover:border-zinc-350 transition-all shadow-sm gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-850/60 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200">
                    💰 Rent Collection Request
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border ${
                    t.status === 'resolved'
                      ? 'bg-green-50 text-green-700 border-green-220 dark:bg-green-950/10 dark:text-green-400'
                      : 'bg-zinc-50 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    {t.status === 'resolved' ? 'Completed & Clear' : t.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[9.5px] text-zinc-400 font-bold uppercase tracking-widest">
                  <User size={12} className="text-zinc-400" />
                  <span>{t.userName} ({t.userProfileRole})</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                  {t.title}
                </h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  {t.description}
                </p>

                {t.scheduledDate && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950/10 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-950">
                    <Calendar size={12} /> Scheduled Retrieval On-Site: {new Date(t.scheduledDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
              </div>

              {isPrivileged && t.status !== 'resolved' && (
                <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateCollectionStatus(t.id, 'resolved')}
                    className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={12} /> Mark as Collected & Clear
                  </button>
                </div>
              )}
            </div>
          ))}

          {paymentTickets.length === 0 && (
            <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950/10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
              <DollarSign className="mx-auto text-zinc-350 dark:text-zinc-700 mb-2" size={32} />
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">No cash collection pickups scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Bill / Booking Invoice Detail modal popup */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-10 shadow-2xl relative font-sans animate-feed">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Simulated premium design invoice receipt brand */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-850 pb-6">
                <div>
                  <span className="text-[10px] font-black text-brand uppercase tracking-widest">Elite Dubai Apartments</span>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mt-1">Payment Invoice</h3>
                  <p className="text-[10.5px] font-mono text-zinc-400">INVOICE: #{selectedBooking.id.substring(0,8).toUpperCase()}</p>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPaymentStatusStyle(selectedBooking.paymentStatus)}`}>
                    {selectedBooking.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Booking metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold leading-normal p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Guest Credentials</h5>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white uppercase">{selectedBooking.guestName}</div>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-medium font-mono text-[10.5px] truncate mt-1">
                      <Mail size={11} /> {selectedBooking.guestEmail || 'fakharalimirza@gmail.com'}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-medium font-mono text-[10.5px] mt-0.5">
                      <Phone size={11} /> {selectedBooking.guestPhone || '+971 00 0000'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Stay Breakdown</h5>
                  <div className="space-y-1">
                    <div className="text-zinc-900 dark:text-white font-bold">{selectedBooking.propertyTitle || 'Premium Apartment'}</div>
                    <div className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                      <Calendar size={11} /> {selectedBooking.checkIn} to {selectedBooking.checkOut}
                    </div>
                    {selectedBooking.numberOfStayDays && (
                      <div className="text-zinc-550 text-[10.5px] font-semibold uppercase tracking-wider">Length of Stay: {selectedBooking.numberOfStayDays} Nights</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial calculations lists */}
              <div className="space-y-3.5 pt-2">
                <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Statement Of Account Particulars</h5>
                
                <div className="space-y-2.5 divide-y divide-zinc-100 dark:divide-zinc-850/40 text-xs font-semibold">
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-zinc-500">Dubai Real Estate Apartment Rent</span>
                    <span className="font-mono text-zinc-900 dark:text-white">AED {(Number(selectedBooking.totalPrice) * 0.85).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5">
                    <span className="text-zinc-500">Government tourism tax (DTCM fee)</span>
                    <span className="font-mono text-zinc-900 dark:text-white">AED {(selectedBooking.dtcmFee || 140).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5">
                    <span className="text-zinc-500">Authorized cleaning & service levy</span>
                    <span className="font-mono text-zinc-900 dark:text-white">AED {(selectedBooking.cleaningFee || 350).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200 font-bold text-zinc-950 dark:text-white text-sm">
                    <span>Grand Total Invoiced</span>
                    <span className="font-mono">AED {Number(selectedBooking.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Installments schedule list (if any) */}
              {selectedBooking.paymentSchedule && selectedBooking.paymentSchedule.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Payment Breakdown Schedule</h5>
                  <div className="space-y-2 font-mono text-[11px]">
                    {selectedBooking.paymentSchedule.map((inst, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-brand text-[9.5px]">#{inst.payment_no}</span>
                          <span className="font-medium text-zinc-405">Due {inst.due_date}:</span>
                          <span className="font-semibold text-zinc-802 dark:text-zinc-250 truncate max-w-[120px]">{inst.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-zinc-905 dark:text-white">AED {Number(inst.amount).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-widest ${
                            inst.status === 'Paid' 
                              ? 'bg-green-105/10 text-green-600' 
                              : 'bg-zinc-105 dark:bg-zinc-800 text-zinc-400'
                          }`}>
                            {inst.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin status adjustments controls (Admins only) */}
              {isPrivileged && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-3 pt-3 mt-6">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-405 font-black uppercase tracking-widest">
                    <ShieldCheck size={14} className="text-brand shrink-0" />
                    <span>Executive Payments Registry Controls</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2.5">
                    {(['paid', 'unpaid', 'partially_paid', 'overdue', 'deposit_held'] as const).map(pStat => (
                      <button
                        key={pStat}
                        type="button"
                        disabled={updatingPaymentId !== null || selectedBooking.paymentStatus === pStat}
                        onClick={() => handleUpdatePaymentStatus(selectedBooking.id, pStat)}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          selectedBooking.paymentStatus === pStat
                            ? 'bg-brand text-white shadow-sm'
                            : 'bg-white hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 text-zinc-500'
                        }`}
                      >
                        Set {pStat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl hover:bg-zinc-820 font-black text-[9.5px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Print invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 text-zinc-450 dark:text-zinc-405 font-black text-[9.5px] uppercase tracking-widest hover:underline cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
