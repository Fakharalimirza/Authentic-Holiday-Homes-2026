import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Property } from '../../../types';
import { AdminBooking, BookingFiltersState } from './types';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Eye, Phone, Calendar, AlertCircle, Sparkles, Ban } from 'lucide-react';
import CurrencySymbol from '../../../components/CurrencySymbol';
import Pagination from '../../../components/Pagination';

// Modular files imports
import BookingsFilters from './BookingsFilters';
import BookingDetailsModal from './BookingDetailsModal';
import BookingFormModal from './BookingFormModal';
import BookingsStatistics from './BookingsStatistics';
import BlockedDatesManager from './BlockedDatesManager';

interface BookingConsoleProps {
  properties: Property[];
  onRefreshStats: () => void;
}

export default function BookingConsole({ properties, onRefreshStats }: BookingConsoleProps) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'roster' | 'blocker'>('roster');

  // Filters State
  const [filters, setFilters] = useState<BookingFiltersState>({
    searchQuery: '',
    status: 'all',
    propertyId: 'all',
    source: 'all'
  });

  // Modals Visibility
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Fetch all bookings
  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Query bookings. Hosts generally only see their property bookings.
      // If we want to check and display all active, query collection 'bookings'.
      const bQuery = query(collection(db, 'bookings'));
      const snapshot = await getDocs(bQuery);
      
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as any)
      })) as AdminBooking[];

      // Filter local lists where the booking property ID belongs to host portfolio
      // or if host is top admin (fakharalimirza@gmail.com) see everything.
      const isAdminEmail = user.email?.toLowerCase() === 'fakharalimirza@gmail.com';
      const hostPropertyIds = new Set(properties.map(p => p.id));
      
      const filteredList = list.filter(b => 
        isAdminEmail || hostPropertyIds.has(b.propertyId)
      );

      // Sort bookings chronologically by check-in date
      filteredList.sort((a,b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

      setBookings(filteredList);
    } catch (err) {
      console.error("BookingConsole: Error loading database bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user, properties]);

  // Update status changes
  const handleUpdateStatus = async (bookingId: string, nextStatus: string) => {
    try {
      const bRef = doc(db, 'bookings', bookingId);
      const bSnap = await getDoc(bRef);
      const bookingData = bSnap.exists() ? bSnap.data() as AdminBooking : null;

      await updateDoc(bRef, { 
        status: nextStatus,
        updatedAt: serverTimestamp() 
      });

      // Maintain business flow rules on the property status
      if (bookingData && bookingData.propertyId) {
        const pRef = doc(db, 'properties', bookingData.propertyId);
        
        if (nextStatus === 'checked_in') {
          // Check-In: Property status is occupied, isAvailable is false
          await updateDoc(pRef, {
            status: 'occupied',
            isAvailable: false
          });
        } else if (nextStatus === 'checked_out') {
          // Check-Out: Property status is maintenance, isAvailable is false
          await updateDoc(pRef, {
            status: 'maintenance',
            isAvailable: false
          });

          // Generate automated Turnover queue task!
          await addDoc(collection(db, 'turnovers'), {
            propertyId: bookingData.propertyId,
            propertyTitle: bookingData.propertyTitle || 'Property Unit',
            referenceNo: bookingData.propertyRef || bookingData.propertyId.slice(0, 6),
            status: 'pending_cleaning',
            notes: `Automated turnover triggered after Check-Out registration for guest ${bookingData.guestName}.`,
            createdAt: serverTimestamp()
          });
        }
      }
      
      // Update local state
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus as any } : b));
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: nextStatus as any } : null);
      }
      onRefreshStats();
    } catch (err) {
      console.error("BookingConsole: Status transition failed:", err);
      alert("Failed to update status: " + (err as Error).message);
    }
  };

  // Update Notes
  const handleUpdateNotes = async (bookingId: string, updatedNotes: string) => {
    try {
      const bRef = doc(db, 'bookings', bookingId);
      await updateDoc(bRef, { 
        notes: updatedNotes,
        updatedAt: serverTimestamp()
      });
      // Sync local lists
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, notes: updatedNotes } : b));
      alert("Host annotations successfully updated!");
    } catch (err) {
      console.error("BookingConsole: Notes revision failed:", err);
      alert("Failed to update notes: " + (err as Error).message);
    }
  };

  // Save manual intake booking
  const handleSaveManual = async (manualData: Omit<AdminBooking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const colRef = collection(db, 'bookings');
      await addDoc(colRef, {
        ...manualData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await fetchBookings();
      alert("Manual intake reservation established!");
      onRefreshStats();
    } catch (err) {
      console.error("BookingConsole: Error saving manual stay:", err);
      alert("Manual entry failed: " + (err as Error).message);
    }
  };

  // Lock Date Block (Creates special reservation)
  const handleAddBlock = async (block: { propertyId: string; checkIn: string; checkOut: string; notes: string }) => {
    const selectedProp = properties.find(p => p.id === block.propertyId);
    try {
      const blockPayload = {
        propertyId: block.propertyId,
        propertyTitle: selectedProp?.title || 'Blocked Unit',
        propertyRef: selectedProp?.referenceNo || block.propertyId,
        checkIn: block.checkIn,
        checkOut: block.checkOut,
        guestId: `block_${Math.random().toString(36).substring(2, 9)}`,
        guestName: '📅 BLOCKED DATES (Locked for Stay/Cleaning)',
        guestPhone: '',
        totalPrice: 0,
        paymentStatus: 'paid' as const,
        status: 'confirmed' as const,
        source: 'other' as const,
        notes: block.notes
      };

      const colRef = collection(db, 'bookings');
      await addDoc(colRef, {
        ...blockPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await fetchBookings();
      onRefreshStats();
    } catch (err) {
      console.error("BookingConsole: Lock block creation failed:", err);
      throw err;
    }
  };

  // Remove Date Block (Deletes/Cancels block booking)
  const handleRemoveBlock = async (blockBookingId: string) => {
    if (!window.confirm("Restore vacancy for these dates? This clears the custom block.")) return;
    try {
      await deleteDoc(doc(db, 'bookings', blockBookingId));
      setBookings(prev => prev.filter(b => b.id !== blockBookingId));
      alert("Date calendar block deleted successfully!");
      onRefreshStats();
    } catch (err) {
      console.error("BookingConsole: Error physical delete block:", err);
      alert("Failed to clear block: " + (err as Error).message);
    }
  };

  // Apply refining filters to list
  const filteredBookings = bookings.filter(b => {
    // 1. Status Filter
    if (filters.status !== 'all' && b.status !== filters.status) return false;
    
    // 2. Property Unit Filter
    if (filters.propertyId !== 'all' && b.propertyId !== filters.propertyId) return false;
    
    // 3. Source Filter
    if (filters.source !== 'all' && b.source !== filters.source) return false;

    // 4. Seach query match
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchPhone = b.guestPhone.toLowerCase().includes(q);
      const matchEmail = (b.guestEmail || '').toLowerCase().includes(q);
      const matchPropTitle = (b.propertyTitle || '').toLowerCase().includes(q);
      const matchRefNo = (b.propertyRef || '').toLowerCase().includes(q);
      const matchId = b.id.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail || matchPropTitle || matchRefNo || matchId;
    }

    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, bookings.length]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Calculate duration in nights for grid display
  const calculateBookingNights = (inStr: string, outStr: string) => {
    const d1 = new Date(inStr);
    const d2 = new Date(outStr);
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) || 1;
  };

  // Status colors list
  const statusLabels: Record<string, string> = {
    pending: 'bg-yellow-105 text-yellow-705 dark:bg-yellow-950/20 dark:text-yellow-405 borders-none',
    confirmed: 'bg-emerald-105 text-emerald-750 dark:bg-emerald-950/20 dark:text-emerald-405 borders-none',
    checked_in: 'bg-blue-105 text-blue-700 dark:bg-blue-955/20 dark:text-blue-405 borders-none',
    checked_out: 'bg-indigo-105 text-indigo-700 dark:bg-indigo-955/20 dark:text-indigo-405 borders-none',
    completed: 'bg-purple-105 text-purple-700 dark:bg-purple-955/20 dark:text-purple-405 borders-none',
    cancelled: 'bg-zinc-150 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-450 line-through',
  };

  return (
    <div className="space-y-6">
      {/* 1. Dashboard mini portfolio statistics */}
      <BookingsStatistics bookings={bookings} />

      {/* 2. Sub-tabs to alternate listing roster and blocking utility */}
      <div className="flex gap-4 mb-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveConsoleTab('roster')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-xl relative ${
            activeConsoleTab === 'roster' 
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Stay Reservation Roster
        </button>
        <button
          type="button"
          onClick={() => setActiveConsoleTab('blocker')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-xl ${
            activeConsoleTab === 'blocker' 
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950' 
              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Calendar Lock Blocks
        </button>
      </div>

      {activeConsoleTab === 'roster' ? (
        <>
          {/* 3. Dropdowns and Input Searching tools */}
          <BookingsFilters
            filters={filters}
            setFilters={setFilters}
            properties={properties}
            onAddNewManualBooking={() => setIsManualModalOpen(true)}
          />

          {/* 4. Complete Roster table */}
          {loading ? (
            <div className="text-center py-20 text-xs font-bold font-mono tracking-widest text-zinc-550 shrink-0 uppercase animate-pulse">
              Re-synchronizing itineraries list...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">
                    <th className="px-6 py-4">Property Unit</th>
                    <th className="px-6 py-4">Stay Cohort Dates</th>
                    <th className="px-6 py-4">Registered Guest</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4 text-right">Invoice Total</th>
                    <th className="px-6 py-4 text-center">Status state</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map(b => {
                    const isManualBlock = b.guestName.includes('📅 BLOCKED DATES');
                    return (
                      <tr key={b.id} className={`bg-white dark:bg-zinc-900 group border border-zinc-100 ${
                        isManualBlock ? 'opacity-70 saturate-50' : ''
                      }`}>
                        {/* Accommodation title */}
                        <td className="px-6 py-4.5 rounded-l-3xl font-extrabold text-zinc-900 dark:text-white max-w-xs truncate">
                          <div>
                            <span className="block text-[11px] font-black tracking-tight text-zinc-800 dark:text-zinc-200">
                              {b.propertyTitle || 'Property Unit'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono block mt-1 font-bold">
                              Ref: {b.propertyRef || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Stay Dates */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-350 font-bold">
                            <Calendar size={13} className="text-zinc-400" />
                            <span>
                              {b.checkIn} to {b.checkOut}
                            </span>
                          </div>
                          <span className="text-[9px] text-zinc-400 font-black uppercase mt-1 block">
                            {calculateBookingNights(b.checkIn, b.checkOut)} Nights stay
                          </span>
                        </td>

                        {/* Guest details */}
                        <td className="px-6 py-4.5 font-bold">
                          {isManualBlock ? (
                            <span className="text-[11px] font-mono font-black text-rose-500 uppercase tracking-tight">
                              🔒 Date Blocked (Admin)
                            </span>
                          ) : (
                            <div>
                              <span className="block text-xs font-black text-zinc-800 dark:text-zinc-150">
                                {b.guestName}
                              </span>
                              {b.guestPhone && (
                                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-medium block mt-1">
                                  📞 {b.guestPhone}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Channel Source */}
                        <td className="px-6 py-4.5 text-xs font-black text-zinc-450 uppercase tracking-tight font-mono">
                          {b.source || 'direct'}
                        </td>

                        {/* Invoice price */}
                        <td className="px-6 py-4.5 text-right font-black text-zinc-850 dark:text-zinc-150">
                          {isManualBlock ? (
                            <span className="text-[10px] text-zinc-400 uppercase font-bold">NONE</span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              <CurrencySymbol size="13px" />
                              <span>{b.totalPrice}</span>
                            </span>
                          )}
                        </td>

                        {/* Booking status */}
                        <td className="px-6 py-4.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusLabels[b.status] || 'bg-zinc-100 text-zinc-700'}`}>
                            {b.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Command buttons */}
                        <td className="px-6 py-4.5 rounded-r-3xl text-right">
                          <div className="flex gap-1.5 justify-end">
                            {isManualBlock ? (
                              <button
                                type="button"
                                title="Delete Block"
                                onClick={() => handleRemoveBlock(b.id)}
                                className="p-2 text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                              >
                                <Ban size={14} />
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBooking(b)}
                                  className="p-2 text-zinc-450 hover:text-zinc-800 dark:text-zinc-550 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 rounded-xl transition-colors"
                                  title="Inspect detail receipt"
                                >
                                  <Eye size={14} />
                                </button>
                                
                                {b.status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                    className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-colors"
                                    title="Confirm Booking"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}

                                {b.status !== 'cancelled' && b.status !== 'completed' && b.status !== 'checked_out' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors"
                                    title="Cancel Stay"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredBookings.length === 0 && (
                <div className="text-center py-20 text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-850 uppercase tracking-widest text-xs font-black">
                  No active guest itineraries match search parameters
                </div>
              )}

              {/* Elegant Universal Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredBookings.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </>
      ) : (
        /* Date Blocking console tab view */
        <BlockedDatesManager
          properties={properties}
          existingBookings={bookings}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
        />
      )}

      {/* Details examination Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            isOpen={selectedBooking !== null}
            onClose={() => setSelectedBooking(null)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateNotes={handleUpdateNotes}
          />
        )}
      </AnimatePresence>

      {/* New manual Intake booking modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <BookingFormModal
            isOpen={isManualModalOpen}
            onClose={() => setIsManualModalOpen(false)}
            properties={properties}
            existingBookings={bookings}
            onSave={handleSaveManual}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
