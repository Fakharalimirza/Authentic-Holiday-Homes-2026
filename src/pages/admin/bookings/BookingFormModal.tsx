import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, DollarSign, User, Mail, Phone, Info, AlertTriangle, Search, ChevronDown, Check } from 'lucide-react';
import { Property } from '../../../types';
import { AdminBooking } from './types';
import { UnitItem, BuildingItem } from '../types';
import CurrencySymbol from '../../../components/CurrencySymbol';
import { useGlobalSettings } from '../../../contexts/GlobalSettingsContext';

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
  const [source, setSource] = useState('Direct Booking / Agent');
  const [notes, setNotes] = useState('');
  
  const { settings } = useGlobalSettings();
  const leadChannels = settings?.availableLeadChannels || ['Direct Booking / Agent', 'WhatsApp Group Chat', 'Airbnb Portal Listings', 'Booking.com', 'Property Finder', 'Bayut', 'Dubizzle', 'Other'];

  useEffect(() => {
    if (leadChannels && leadChannels.length > 0 && source === 'direct') {
      setSource(leadChannels[0]);
    }
  }, [leadChannels]);

  // Guest Portfolio history search state
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  // Load unique guest history from previous bookings
  const uniqueHistoryGuests = React.useMemo(() => {
    const list: { name: string; email: string; phone: string }[] = [];
    const seen = new Set<string>();
    for (const b of existingBookings) {
      if (b.guestName && !b.guestName.includes('📅 BLOCKED DATES')) {
        const nameClean = b.guestName.trim();
        const emailClean = (b.guestEmail || '').trim();
        const phoneClean = (b.guestPhone || '').trim();
        const key = `${nameClean.toLowerCase()}__${emailClean.toLowerCase()}__${phoneClean}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: nameClean,
            email: emailClean,
            phone: phoneClean
          });
        }
      }
    }
    return list;
  }, [existingBookings]);

  // Filter history list based on search query
  const filteredHistoryGuests = React.useMemo(() => {
    if (!historySearchTerm.trim()) return [];
    const term = historySearchTerm.toLowerCase();
    return uniqueHistoryGuests.filter(g => 
      g.name.toLowerCase().includes(term) || 
      g.email.toLowerCase().includes(term) || 
      g.phone.toLowerCase().includes(term)
    );
  }, [uniqueHistoryGuests, historySearchTerm]);

  // Real-world dynamic stay values according to system guidelines
  const [rentPerMonth, setRentPerMonth] = useState<number>(0);
  const [dtcmFee, setDtcmFee] = useState<number>(0);
  const [agencyFee, setAgencyFee] = useState<number>(0);
  const [securityDeposit, setSecurityDeposit] = useState<number>(0);
  const [cleaningFee, setCleaningFee] = useState<number>(0);
  const [miscFee, setMiscFee] = useState<number>(0);
  const [billingMonths, setBillingMonths] = useState<number>(1);
  const [specialTerms, setSpecialTerms] = useState<string>('');

  // Custom rents split state
  const [monthlyRentList, setMonthlyRentList] = useState<number[]>([]);

  useEffect(() => {
    setMonthlyRentList(prev => {
      const newList = [...prev];
      if (newList.length < billingMonths) {
        const padCount = billingMonths - newList.length;
        for (let i = 0; i < padCount; i++) {
          newList.push(rentPerMonth || 0);
        }
      } else if (newList.length > billingMonths) {
        newList.splice(billingMonths);
      }
      return newList;
    });
  }, [billingMonths, rentPerMonth]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [dateConflict, setDateConflict] = useState<AdminBooking | null>(null);

  const [units, setUnits] = useState<UnitItem[]>([]);
  const [buildings, setBuildings] = useState<BuildingItem[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchUnitsData = async () => {
        setIsLoadingUnits(true);
        try {
          const [unitsRes, buildingsRes] = await Promise.all([
            fetch('/api/admin/units'),
            fetch('/api/admin/buildings')
          ]);
          const [unitsData, buildingsData] = await Promise.all([
            unitsRes.json(),
            buildingsRes.json()
          ]);
          if (unitsData.success) {
            setUnits(unitsData.units || []);
          }
          if (buildingsData.success) {
            setBuildings(buildingsData.buildings || []);
          }
        } catch (err) {
          console.error("Error loading units for booking form dropdown:", err);
        } finally {
          setIsLoadingUnits(false);
        }
      };
      fetchUnitsData();
    }
  }, [isOpen]);

  const [unitSearchQuery, setUnitSearchQuery] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setUnitSearchQuery('');
      setIsUnitDropdownOpen(false);
    }
  }, [isOpen]);

  const filteredUnits = React.useMemo(() => {
    const q = unitSearchQuery.toLowerCase().trim();
    if (!q) return units;
    return units.filter(u => {
      const bld = buildings.find(b => b.id === u.buildingId);
      const labelBuild = bld ? bld.name.toLowerCase() : '';
      const unitNum = (u.unitNumber || '').toLowerCase();
      const status = (u.status || '').toLowerCase();
      const price = String(u.price || '');
      return labelBuild.includes(q) || unitNum.includes(q) || status.includes(q) || price.includes(q);
    });
  }, [units, buildings, unitSearchQuery]);

  const filteredProperties = React.useMemo(() => {
    const q = unitSearchQuery.toLowerCase().trim();
    if (!q) return properties;
    return properties.filter(p => {
      const title = (p.title || '').toLowerCase();
      const ref = (p.referenceNo || '').toLowerCase();
      return title.includes(q) || ref.includes(q);
    });
  }, [properties, unitSearchQuery]);

  const getSelectedUnitLabel = () => {
    if (propertyId) {
      if (units.length > 0) {
        const u = units.find(item => item.id === propertyId);
        if (u) {
          const bld = buildings.find(b => b.id === u.buildingId);
          const labelBuild = bld ? bld.name : 'Building';
          return `${labelBuild} - Unit ${u.unitNumber} (${u.status}) - AED ${u.price}/mo`;
        }
      }
      const p = properties.find(item => item.id === propertyId);
      if (p) {
        return `${p.title} - ${p.referenceNo || p.id.slice(0,6)}`;
      }
      return propertyId;
    }
    return '-- Choose Accommodation unit --';
  };

  const selectedUnit = units.find(u => u.id === propertyId);
  const unitDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutsideDropdown(event: MouseEvent) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setIsUnitDropdownOpen(false);
      }
    }
    if (isUnitDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsideDropdown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, [isUnitDropdownOpen]);

  const selectedBuilding = selectedUnit ? buildings.find(b => b.id === selectedUnit.buildingId) : null;
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

  // Adjust default monthly rent based on property / unit chosen
  useEffect(() => {
    if (selectedUnit) {
      setRentPerMonth(selectedUnit.price || 0);
    } else if (selectedProperty) {
      // Standard monthly rent is property.price if it represents a monthly rate (>= 1000)
      // or property.price * 30 if it represents a nightly rate (< 1000)
      const suggestedRent = selectedProperty.price < 1000 ? selectedProperty.price * 30 : selectedProperty.price;
      setRentPerMonth(suggestedRent);
    } else {
      setRentPerMonth(0);
    }
  }, [propertyId, selectedUnit, selectedProperty]);

  // Financial calculations with support for custom rent list
  const totalRent = monthlyRentList.length > 0
    ? monthlyRentList.reduce((acc, curr) => acc + curr, 0)
    : rentPerMonth * billingMonths;

  const firstMonthTotal = (monthlyRentList[0] ?? rentPerMonth) + dtcmFee + agencyFee + securityDeposit + cleaningFee + miscFee;
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
    const firstMonthRentVal = monthlyRentList[0] ?? rentPerMonth;
    list.push({
      payment_no: 1,
      due_date: checkIn,
      description: `First month rent + ${feesDesc}`,
      amount: firstMonthRentVal + dtcmFee + agencyFee + securityDeposit + cleaningFee + miscFee,
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
      const monthRentVal = monthlyRentList[i] ?? rentPerMonth;
      list.push({
        payment_no: i + 1,
        due_date: dueDateStr,
        description: `Month ${i + 1} Rent`,
        amount: monthRentVal,
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
    const minNights = selectedUnit ? 30 : ((selectedProperty as any)?.minimumNights ?? 30); // Business model default is monthly
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
        propertyTitle: selectedUnit 
          ? `${selectedBuilding ? selectedBuilding.name : 'Unknown Building'} - Unit ${selectedUnit.unitNumber}`
          : (selectedProperty?.title || 'Property Unit'),
        propertyRef: selectedUnit
          ? (selectedUnit.unitNumber || selectedUnit.id)
          : (selectedProperty?.referenceNo || propertyId),
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
        nextMonthTotal: monthlyRentList[1] ?? rentPerMonth,
        grandTotalAmount,
        paymentSchedule,
        specialTermsAndConditions: specialTerms,
        customMonthlyRents: monthlyRentList
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
      setSource(leadChannels[0] || 'Direct Booking / Agent');
      setNotes('');
      setRentPerMonth(0);
      setDtcmFee(0);
      setAgencyFee(0);
      setSecurityDeposit(0);
      setCleaningFee(0);
      setMiscFee(0);
      setBillingMonths(1);
      setSpecialTerms('');
      setMonthlyRentList([]);
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
            <div className="relative" ref={unitDropdownRef}>
              <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                Accommodation Listing Unit {isLoadingUnits ? '(Loading Inventory...)' : ''}
              </label>
              
              <button
                type="button"
                onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <span className="truncate">{getSelectedUnitLabel()}</span>
                <ChevronDown size={14} className={`text-zinc-400 transition-transform duration-200 ${isUnitDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUnitDropdownOpen && (
                <div className="absolute z-20 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <Search size={14} className="text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      className="w-full bg-transparent text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                      placeholder="Type building name, unit number, status or price..."
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      autoFocus
                    />
                    {unitSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUnitSearchQuery('')}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors px-1"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto py-1">
                    {units.length > 0 ? (
                      filteredUnits.length > 0 ? (
                        filteredUnits.map(u => {
                          const bld = buildings.find(b => b.id === u.buildingId);
                          const labelBuild = bld ? bld.name : 'Unknown Building';
                          const isSelected = propertyId === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setPropertyId(u.id);
                                setIsUnitDropdownOpen(false);
                                setUnitSearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
                                isSelected 
                                  ? 'bg-brand/10 text-brand font-bold' 
                                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                              }`}
                            >
                              <div className="truncate">
                                <span className={isSelected ? 'font-black text-brand' : 'font-semibold text-zinc-800 dark:text-zinc-200'}>
                                  {labelBuild} - Unit {u.unitNumber}
                                </span>
                                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">
                                  Status: <span className={u.status === 'vacant' || u.status === 'available' ? 'text-emerald-500 font-extrabold' : 'text-amber-500 font-semibold'}>{u.status}</span> | Rent: AED {u.price}/mo
                                </span>
                              </div>
                              {isSelected && <Check size={12} className="text-brand shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-4 text-xs text-zinc-400 dark:text-zinc-550 text-center italic">
                          No matching units found for "{unitSearchQuery}"
                        </div>
                      )
                    ) : (
                      filteredProperties.length > 0 ? (
                        filteredProperties.map(p => {
                          const isSelected = propertyId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setPropertyId(p.id);
                                setIsUnitDropdownOpen(false);
                                setUnitSearchQuery('');
                              }}
                              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors ${
                                isSelected 
                                  ? 'bg-brand/10 text-brand font-bold' 
                                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                              }`}
                            >
                              <div className="truncate">
                                <span className={isSelected ? 'font-black text-brand' : 'font-semibold text-zinc-800 dark:text-zinc-200'}>
                                  {p.title}
                                </span>
                                <span className="block text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-0.5">
                                  Ref: {p.referenceNo || p.id.slice(0,6)}
                                </span>
                              </div>
                              {isSelected && <Check size={12} className="text-brand shrink-0 ml-2" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-4 text-xs text-zinc-400 dark:text-zinc-550 text-center italic">
                          No matching accommodations found
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
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

            {/* Guest Portfolio History Search */}
            {uniqueHistoryGuests.length > 0 && (
              <div className="relative pb-2 border-b border-zinc-200/55 dark:border-zinc-800/50">
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>Guest Portfolio Search (Load past client records)</span>
                  <span className="text-[9px] text-zinc-500 font-bold lowercase">{uniqueHistoryGuests.length} saved profiles</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name, email or phone to search past guests..."
                    value={historySearchTerm}
                    onChange={(e) => {
                      setHistorySearchTerm(e.target.value);
                      setShowHistoryDropdown(true);
                    }}
                    onFocus={() => setShowHistoryDropdown(true)}
                    className="w-full p-3.5 pr-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs">
                    🔍
                  </div>
                </div>

                {/* Dropdown overlay */}
                {showHistoryDropdown && historySearchTerm && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {filteredHistoryGuests.length > 0 ? (
                      <div className="p-1.5 space-y-1">
                        {filteredHistoryGuests.map((g, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setGuestName(g.name);
                              setGuestEmail(g.email);
                              setGuestPhone(g.phone);
                              setHistorySearchTerm('');
                              setShowHistoryDropdown(false);
                            }}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors flex flex-col gap-0.5 cursor-pointer"
                          >
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">{g.name}</span>
                            <span className="text-[10px] text-zinc-500 flex justify-between w-full">
                              <span>✉ {g.email || 'N/A'}</span>
                              <span>📞 {g.phone || 'N/A'}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-zinc-400 font-medium">No historical guest profiles match "{historySearchTerm}"</div>
                    )}
                  </div>
                )}
              </div>
            )}

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
            <h3 className="text-[11px] uppercase tracking-widest text-zinc-450 font-black">
              3. Stay Fee & Rent Structuring
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Billing Months (Read-only/Calculated because it can't change manually) */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1 flex items-center gap-1">
                  Billing Months <span className="opacity-60">🔒</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    readOnly
                    disabled
                    value={billingMonths || ''}
                    className="w-full p-4 bg-zinc-150/70 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-2xl text-xs font-bold text-zinc-550 dark:text-zinc-400 cursor-not-allowed"
                  />
                  <p className="text-[9px] text-brand-dark dark:text-brand-light mt-1.5 uppercase font-black tracking-wider">
                    Calculated from dates selected ({systemCalculatedMonths} month{systemCalculatedMonths > 1 ? 's' : ''})
                  </p>
                </div>
              </div>

              {/* Baseline Rent Field */}
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1">
                  Base Rent Rate Per Month (AED)
                </label>
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

            {/* Dynamic rent per month inputs if billingMonths > 1 */}
            {billingMonths > 1 && (
              <div className="pt-4 pb-2 border-t border-zinc-205 dark:border-zinc-800 space-y-3">
                <p className="text-[10px] uppercase font-black tracking-wider text-brand-dark dark:text-brand-light">
                  Custom Monthly rent input ({billingMonths} billing cycles)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: billingMonths }).map((_, idx) => {
                    const val = monthlyRentList[idx] ?? rentPerMonth ?? 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[9px] uppercase font-extrabold text-zinc-450 dark:text-zinc-500">
                          Month {idx + 1} Rent amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={val || ''}
                          onChange={(e) => {
                            const valNum = Number(e.target.value);
                            setMonthlyRentList(prev => {
                              const next = [...prev];
                              next[idx] = valNum;
                              return next;
                            });
                          }}
                          className="w-full p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-xs font-bold rounded-xl text-zinc-800 dark:text-zinc-150 focus:ring-1 focus:ring-brand focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  {leadChannels.map((chan) => (
                    <option key={chan} value={chan}>{chan}</option>
                  ))}
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
