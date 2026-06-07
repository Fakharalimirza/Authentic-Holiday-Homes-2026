import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Mail, Phone, ArrowLeft, ShieldAlert, CreditCard, Sparkles, CheckCircle2, MapPin } from 'lucide-react';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import CurrencySymbol from '../../components/CurrencySymbol';
import CalendarPopover from '../../components/CalendarPopover';
import { Property } from '../../types';

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useSettings();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorHeader, setErrorHeader] = useState('');

  // Form states initialized empty on load
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [guestName, setGuestName] = useState(user?.displayName || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState('');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return lang === 'ar' ? 'اختر التاريخ' : 'Select Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Pre-load property details
  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty({ id: docSnap.id, ...(docSnap.data() as Property) });
        } else {
          setErrorHeader('Property listing not found');
        }
      } catch (err) {
        console.error("Booking page: Error loading property details:", err);
        setErrorHeader('Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  // Pricing calculations helper
  const calculateStayDetails = () => {
    if (!property || !checkIn || !checkOut) return null;
    const dIn = new Date(checkIn);
    const dOut = new Date(checkOut);
    if (isNaN(dIn.getTime()) || isNaN(dOut.getTime()) || dOut <= dIn) return null;

    const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const minNights = property.minimumNights ?? 30; // Rent stays are default to 30 nights (monthly model)

    const accommodationPrice = nights * property.price;
    const touristFee = 15 * nights; // standard DTCM Tourism fee
    const serviceFee = Math.round(accommodationPrice * 0.05); // 5% service commission
    const grantTotal = accommodationPrice + touristFee + serviceFee;

    return {
      nights,
      minNights,
      accommodationPrice,
      touristFee,
      serviceFee,
      grantTotal,
      isValidStay: nights >= minNights
    };
  };

  const stayDetails = calculateStayDetails();

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorHeader('Please login or register to reserve this holiday home unit');
      return;
    }
    if (!property || !checkIn || !checkOut || !stayDetails) {
      setErrorHeader('Please provide valid check-in and check-out stay parameters');
      return;
    }
    const finalGuestName = guestName.trim() || user?.displayName || user?.email || 'Guest';
    const finalGuestPhone = guestPhone.trim() || user?.phoneNumber || '+971 50 123 4567';

    if (!stayDetails.isValidStay) {
      setErrorHeader(`Stay requires a minimum of ${stayDetails.minNights} nights. Selected duration is only ${stayDetails.nights} nights.`);
      return;
    }

    setSubmitting(true);
    setErrorHeader('');

    try {
      const dataPayload = {
        propertyId: property.id,
        propertyTitle: property.title,
        propertyRef: property.referenceNo || property.id,
        checkIn,
        checkOut,
        guestId: user.uid,
        guestName: finalGuestName,
        guestEmail: guestEmail.trim() || user?.email || '',
        guestPhone: finalGuestPhone,
        totalPrice: stayDetails.grantTotal,
        paymentStatus: 'unpaid',
        status: 'pending',
        source: 'direct',
        notes: `Online public guest reservation of ${stayDetails.nights} nights for DTCM approved holiday home apartment.`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), dataPayload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3500);
    } catch (err) {
      console.error("Booking: Error saving guest reservation:", err);
      setErrorHeader((err as Error).message || 'Failed to construct check-out reservation itinerary');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 pb-20 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand animate-spin mb-4" />
          <span className="text-sm font-black uppercase tracking-widest text-zinc-500">Preparing Custom Checkout...</span>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 pb-20 flex justify-center items-center px-4">
        <div className="max-w-md text-center p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl">
          <ShieldAlert size={48} className="text-zinc-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight mb-3 text-zinc-900 dark:text-white">Listing Unavailable</h2>
          <p className="text-sm text-zinc-500 mb-8">This vacation unit is either booked or has been temporarily unlisted by the landlord portfolio manager.</p>
          <button onClick={() => navigate('/properties')} className="px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest">
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 pb-24 font-sans text-zinc-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 mb-10 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Details
        </button>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl text-center"
          >
            <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-zinc-900 dark:text-white">Booking Confirmed!</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-450 leading-relaxed max-w-sm mx-auto mb-10">
              Your rental reservation itinerary has been logged successfully under code <span className="font-mono text-zinc-800 dark:text-white font-bold">AHH-{(Math.random()*1000).toString(16).slice(0, 6).toUpperCase()}</span>.
            </p>
            <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center gap-3 text-left">
              <Sparkles size={18} className="text-brand shrink-0" />
              <p className="text-[11px] uppercase font-black text-zinc-450 dark:text-zinc-400">
                Redirecting you to your account dashboard shortly to review invoice details...
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Primary Guest Checkout form details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-8 sm:p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
                <div className="mb-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand block mb-2">Authentic Holiday Homes</span>
                  <h1 className="text-4xl font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white mb-2">Checkout Details</h1>
                  <p className="text-sm font-medium text-zinc-500 pr-4">Review stay dates and provide authorized legal contact occupant details for DTCM certification logs.</p>
                </div>

                {errorHeader && (
                  <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold leading-relaxed mb-8">
                    {errorHeader}
                  </div>
                )}

                <form onSubmit={handleCreateBooking} className="space-y-6">
                  {/* Calendar / Itinerary Dates */}
                  <div className="space-y-4 mb-5 relative text-left">
                    <div 
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="grid grid-cols-2 gap-0 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-inner cursor-pointer hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300"
                    >
                       <div className="py-2 px-3.5 border-r-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-all group flex flex-col justify-between">
                          <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-0.5 block">Check-In</label>
                          <div className="flex items-center gap-1.5 mt-0.5 min-h-[1.25rem] relative z-0">
                            <Calendar size={14} className="text-zinc-400 group-hover:text-brand transition-colors shrink-0" />
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">
                              {formatDate(checkIn)}
                            </span>
                          </div>
                       </div>
                       <div className="py-2 px-3.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-all group flex flex-col justify-between">
                          <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-0.5 block">Check-Out</label>
                          <div className="flex items-center gap-1.5 mt-0.5 min-h-[1.25rem] relative z-0">
                            <Calendar size={14} className="text-zinc-400 group-hover:text-brand transition-colors shrink-0" />
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">
                              {formatDate(checkOut)}
                            </span>
                          </div>
                       </div>
                    </div>

                    <AnimatePresence>
                      {isCalendarOpen && (
                        <CalendarPopover
                          checkIn={checkIn}
                          checkOut={checkOut}
                          onDatesChange={(start, end) => {
                            setCheckIn(start);
                            setCheckOut(end);
                          }}
                          isOpen={isCalendarOpen}
                          onClose={() => setIsCalendarOpen(false)}
                          lang={lang}
                          inline={true}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {!user && (
                    <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs text-zinc-500 font-medium">
                      🔒 Secured via Firebase. Registration completes account access immediately upon reservation submit.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || (stayDetails !== null && !stayDetails.isValidStay)}
                    className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm select-none ${
                      submitting || (stayDetails !== null && !stayDetails.isValidStay)
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-zinc-100"
                    }`}
                  >
                    {submitting ? 'Confirming stay...' : 'Reserve Holiday Home'}
                  </button>
                </form>
              </div>
            </div>

            {/* Price invoice & property highlights list */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              {/* Property summary */}
              <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[3rem] shadow-xl overflow-hidden relative">
                <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden mb-6 relative">
                  {property.images?.webp?.[0] || property.images?.png?.[0] ? (
                    <img
                      src={property.images?.webp?.[0] || property.images?.png?.[0]}
                      alt={property.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-zinc-400">
                      No Property Media
                    </div>
                  )}
                  <div className="absolute top-4 left-4 p-2 bg-zinc-950/80 backdrop-blur-md rounded-xl text-[9px] uppercase font-black text-white tracking-widest">
                    Apt Ref: {property.referenceNo || 'AHH-N/A'}
                  </div>
                </div>

                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-2 leading-none">
                  {property.title}
                </h2>
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium pb-6 border-b border-zinc-100 dark:border-zinc-800/60">
                  <MapPin size={14} className="text-zinc-400 shrink-0" />
                  <span className="truncate">{property.location?.address || property.address}</span>
                </div>

                {/* Pricing / Invoice Breakdown */}
                <div className="pt-6 space-y-4 font-sans text-xs">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Pricing Summary</h3>

                  {stayDetails ? (
                    <>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                        <span>Stay Duration</span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">{stayDetails.nights} {stayDetails.nights === 1 ? 'Night' : 'Nights'}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                        <span>Rent Rate (<CurrencySymbol />{property.price} / night)</span>
                        <span className="font-bold text-zinc-900 dark:text-white"><CurrencySymbol />{stayDetails.accommodationPrice}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                        <span>DTCM Tourism Fee (AED 15 / night)</span>
                        <span className="font-bold text-zinc-900 dark:text-white"><CurrencySymbol />{stayDetails.touristFee}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                        <span>AHH Holiday Home Service Fee (5%)</span>
                        <span className="font-bold text-zinc-900 dark:text-white"><CurrencySymbol />{stayDetails.serviceFee}</span>
                      </div>

                      <div className="pt-4 border-t-2 border-dashed border-zinc-100 dark:border-zinc-800/60 flex justify-between items-baseline">
                        <span className="text-sm font-black uppercase tracking-tight">Grant Total</span>
                        <span className="text-2xl font-black text-brand tracking-tight flex items-center gap-1.5 leading-none">
                          <CurrencySymbol size="0.9em" />
                          {stayDetails.grantTotal}
                        </span>
                      </div>

                      {!stayDetails.isValidStay && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed font-bold mt-4">
                          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                          <span>
                            This unit has a minimum stay constraint of {stayDetails.minNights} nights. Your selected duration is only {stayDetails.nights} nights.
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-[11px] text-zinc-500 font-bold uppercase tracking-widest text-center">
                      Select valid stay dates to estimate rates
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
