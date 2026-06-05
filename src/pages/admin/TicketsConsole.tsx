import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { 
  MessageSquare, Plus, CheckCircle2, RefreshCw, X, Calendar, User, 
  ClipboardList, PlusCircle, AlertCircle, Send, ArrowRight, ShieldAlert,
  Clock, CheckSquare, MessageCircle, Home
 } from 'lucide-react';
import Pagination from '../../components/Pagination';

export interface TicketReply {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string; // ISO format
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userProfileRole: string;
  propertyId?: string;
  propertyTitle?: string;
  category: 'maintenance' | 'cleaning' | 'amenity_issue' | 'general' | 'other';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt?: any;
  replies?: TicketReply[];
}

interface TicketsConsoleProps {
  userUid?: string;
  userRole?: string;
  userName?: string;
  propertiesList?: any[]; // To associate ticket to a unit
}

export default function TicketsConsole({ userUid, userRole, userName, propertiesList = [] }: TicketsConsoleProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketId = searchParams.get('ticketId');
  
  // Navigation & Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [selectedTicketId, setSelectedTicketIdState] = useState<string | null>(ticketId);

  const setSelectedTicketId = (id: string | null) => {
    setSelectedTicketIdState(id);
    const currentTab = searchParams.get('tab') || 'support';
    const newParams: Record<string, string> = { tab: currentTab };
    if (id) {
      newParams.ticketId = id;
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    const curId = searchParams.get('ticketId');
    if (curId && curId !== selectedTicketId) {
      setSelectedTicketIdState(curId);
    }
  }, [searchParams]);

  // Forms support state
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState<'maintenance' | 'cleaning' | 'amenity_issue' | 'general' | 'other'>('maintenance');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPropId, setNewPropId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom reply state
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Status changing state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load tickets on Snapshot
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'tickets'), (snapshot) => {
      let ticketList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      
      // Filter out payments tickets from the Support desk categories if needed, or keep for compatibility.
      // Since we split support and payments, the support tab should focus on maintenance, cleaning, amenities, general, other etc.
      // (This prevents overlap between the two tabs for a cleaner, split workflow)
      ticketList = ticketList.filter(t => 
        (t.category as string) !== 'rent_collection' && (t.category as string) !== 'invoice_query'
      );

      // Filter logically: guests/landlords should only see their own tickets!
      const isPrivileged = ['super_admin', 'admin', 'agent', 'host'].includes(userRole || '');
      if (!isPrivileged && userUid) {
        ticketList = ticketList.filter(t => t.userId === userUid);
      }
      
      // Sort in descending order of creation
      ticketList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setTickets(ticketList);
      setLoading(false);
    }, (error) => {
      console.error("TicketsConsole: Snapshot reading error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userUid, userRole]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) {
      alert("Please populate title and description.");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedProp = propertiesList.find(p => p.id === newPropId);
      
      const ticketPayload: any = {
        userId: userUid || 'unknown_anon',
        userName: userName || 'Resident Name',
        userProfileRole: userRole || 'guest',
        category: newCategory,
        title: newTitle.trim(),
        description: newDesc.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        replies: []
      };

      if (newPropId) {
        ticketPayload.propertyId = newPropId;
        ticketPayload.propertyTitle = selectedProp?.title || 'Selected Unit';
      }

      await addDoc(collection(db, 'tickets'), ticketPayload);
      
      // Reset forms
      setNewTitle('');
      setNewDesc('');
      setNewPropId('');
      setIsAdding(false);
    } catch (err: any) {
      console.error("Error creating support ticket:", err);
      alert("Failed to lodge support request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: 'pending' | 'in_progress' | 'resolved') => {
    setUpdatingId(ticketId);
    try {
      // Add a status system update log inside replies automatically!
      const statusMessage = `⚠️ [System Status Update] Ticket status has been updated to "${status.replace('_', ' ').toUpperCase()}" by ${userName || 'Staff'} (${userRole || 'admin'}).`;
      
      await updateDoc(doc(db, 'tickets', ticketId), { 
        status,
        replies: arrayUnion({
          id: `status_log_${Math.random().toString(36).substring(2, 9)}`,
          senderId: 'system',
          senderName: 'System Log',
          senderRole: 'system',
          message: statusMessage,
          createdAt: new Date().toISOString()
        })
      });
    } catch (err: any) {
      console.error("Error updating ticket status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReply = async (e: React.FormEvent, ticketId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const newReply: TicketReply = {
        id: `reply_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        senderId: userUid || 'anonymous_user',
        senderName: userName || 'Resident Guest',
        senderRole: userRole || 'guest',
        message: replyText.trim(),
        createdAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'tickets', ticketId), {
        replies: arrayUnion(newReply)
      });
      setReplyText('');
    } catch (err: any) {
      console.error("Error sending response thread reply:", err);
      alert("Failed to send reply: " + err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'maintenance': return '🛠️';
      case 'cleaning': return '🧹';
      case 'amenity_issue': return '📶';
      case 'general': return '💬';
      default: return '🛡️';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'maintenance': return 'Maintenance & Repair';
      case 'cleaning': return 'Cleaning & Housekeeping';
      case 'amenity_issue': return 'Amenity & Internet Access';
      case 'general': return 'General Query';
      default: return 'Other Operational';
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40';
      case 'cleaning':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-405 border border-emerald-200/40';
      case 'amenity_issue':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/40';
      case 'general':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200/40';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200';
    }
  };

  const isPrivileged = ['super_admin', 'admin', 'agent', 'host'].includes(userRole || '');

  // Filter queue by category filter
  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6">
      {/* Page Header Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white dark:bg-zinc-900 duration-300 p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="text-brand shrink-0 animate-pulse" size={24} />
            Support Desk & Task Tickets
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium mt-1">
            {isPrivileged 
              ? "Oversee user maintenance requests, turnarounds, amenities queries and real-time support threads."
              : "Lodge detailed physical apartment maintenance, cleaning assistance or security tickets directly to our desk."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand hover:bg-brand/90 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand/20 shrink-0 cursor-pointer"
          >
            <Plus size={16} /> New Ticket
          </button>
        </div>
      </div>

      {/* Lodge support request card */}
      {isAdding && (
        <div className="p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] space-y-6 relative animate-feed">
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full cursor-pointer"
          >
            <X size={18} />
          </button>

          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-805 dark:text-white flex items-center gap-2">
              <PlusCircle size={18} className="text-brand animate-spin-slow" /> Create New Support Ticket
            </h3>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-400 font-semibold font-sans mt-0.5">Please provide specific parameters so maintenance agents can troubleshoot immediately.</p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Support Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="maintenance">🛠️ Physical Maintenance & Repair</option>
                  <option value="cleaning">🧹 Cleaning, Linen & Turnovers</option>
                  <option value="amenity_issue">📶 Amenity Access & Wi-Fi issues</option>
                  <option value="general">💬 General Query or Request</option>
                  <option value="other">🛡️ Other Operational request</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Related Real Estate Unit</label>
                <select
                  value={newPropId}
                  onChange={(e) => setNewPropId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-805 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">No property unit selected</option>
                  {propertiesList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.unitNumber ? `[Unit ${p.unitNumber}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Headline Summary</label>
              <input
                type="text"
                required
                maxLength={90}
                placeholder="e.g. Living room AC not cooling or Balcony lock malfunction"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-201 dark:border-zinc-800 rounded-2xl text-xs font-bold text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Detailed Description context</label>
              <textarea
                required
                rows={4}
                placeholder="Briefly explain what went wrong and how we can access your unit if needed..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-4 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-201 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-205 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-brand dark:hover:bg-brand dark:hover:text-white transition-all shadow-md cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Split Layout: Tickets queue on left (collapsed) and conversation on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Ticket List queue Column */}
        <div className={`col-span-1 ${selectedTicketId ? 'lg:col-span-4 hidden lg:block' : 'lg:col-span-12'} space-y-4`}>
          
          {/* Quick status tabs filter */}
          <div className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-2xl">
            {(['all', 'pending', 'in_progress', 'resolved'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  statusFilter === f 
                    ? 'bg-brand text-white shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {paginatedTickets.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer shadow-sm relative group hover:scale-[1.005] duration-200 ${
                  selectedTicketId === t.id 
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-700' 
                    : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5 mb-3.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${getCategoryTheme(t.category)}`}>
                    {getCategoryEmoji(t.category)} {t.category.replace(/_/g, ' ')}
                  </span>
                  
                  {/* Color-coded custom status tag */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                    t.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : t.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wide group-hover:text-brand transition-colors line-clamp-1">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-zinc-450 dark:text-zinc-400 font-semibold font-sans line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-850/60 pt-3 mt-4 text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest">
                  <div className="flex items-center gap-1 justify-start">
                    <User size={11} className="text-zinc-455" />
                    <span className="truncate max-w-[90px]">{t.userName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <MessageCircle size={11} className="text-zinc-455" />
                    <span>{t.replies?.filter(r => r.senderRole !== 'system').length || 0} replies</span>
                  </div>
                </div>

                {/* Micro Arrow indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={14} className="text-brand" />
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                <ClipboardList className="mx-auto text-zinc-350 dark:text-zinc-700 mb-3" size={32} />
                <p className="text-zinc-455 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest">No matching support tickets</p>
              </div>
            )}

            {/* Elegant Universal Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredTickets.length}
              itemsPerPage={itemsPerPage}
            />
          </div>

        </div>

        {/* Selected Interactive Ticket conversation Column */}
        <div className={`col-span-1 ${selectedTicketId ? 'lg:col-span-8' : 'hidden lg:block lg:col-span-12'}`}>
          
          {selectedTicket ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[560px] animate-feed">
              
              {/* Card Chat Header */}
              <div className="p-5 sm:p-6 bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-850/60 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="p-2 -ml-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 lg:hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>

                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getCategoryTheme(selectedTicket.category)}`}>
                      {getCategoryLabel(selectedTicket.category)}
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wide mt-1.5 line-clamp-1">
                      {selectedTicket.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-zinc-450 hidden sm:inline mr-1">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    selectedTicket.status === 'resolved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : selectedTicket.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400'
                      : 'bg-zinc-105 text-zinc-650 border-zinc-200 dark:bg-zinc-805 dark:text-zinc-350'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Status Tracking Progress interactive Timeline */}
              <div className="p-4 sm:px-6 bg-zinc-50/20 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-850/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-405 font-bold uppercase tracking-widest leading-none">
                  <Clock size={12} className="text-zinc-450" />
                  <span>Timeline Tracker</span>
                </div>

                {isPrivileged ? (
                  <div className="flex items-center gap-1.5">
                    {(['pending', 'in_progress', 'resolved'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        disabled={updatingId !== null || selectedTicket.status === st}
                        onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          selectedTicket.status === st 
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm' 
                            : 'bg-zinc-100 hover:bg-zinc-150 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-650 dark:text-zinc-400'
                        }`}
                      >
                        {st === 'in_progress' ? 'Work' : st}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-zinc-400 font-mono">
                      Started: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                )}
              </div>

              {/* Chat replies list container Scroll area */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[360px] bg-zinc-50/10 dark:bg-zinc-950/5">
                
                {/* Original Ticket Description context box */}
                <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5"><ClipboardList size={11} /> Base Issue Description</span>
                    <span className="font-mono text-[9px]">LODGED BY {(selectedTicket.userName || 'Guest').toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>

                  {selectedTicket.propertyTitle && (
                    <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-black text-brand bg-brand/10 dark:bg-brand/15 rounded-lg uppercase tracking-wider">
                      <Home size={10} /> Unit: {selectedTicket.propertyTitle}
                    </div>
                  )}
                </div>

                {/* Replies feed */}
                {(selectedTicket.replies || []).map((reply) => {
                  const isSystem = reply.senderRole === 'system';
                  const isMe = reply.senderId === userUid;

                  if (isSystem) {
                    return (
                      <div key={reply.id} className="flex justify-center my-3">
                        <span className="px-4 py-1.5 bg-yellow-50 dark:bg-yellow-950/10 border border-yellow-200/50 text-yellow-805 dark:text-yellow-405 rounded-xl text-[10px] font-bold tracking-tight text-center max-w-md shadow-sm">
                          {reply.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={reply.id} 
                      className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end animate-slide-left' : 'mr-auto items-start animate-slide-right'}`}
                    >
                      {/* Message author badge */}
                      <span className="text-[9.5px] font-black uppercase text-zinc-400 tracking-widest mb-1 px-1.5">
                        {isMe ? 'You' : reply.senderName} ({reply.senderRole.replace('_', ' ')})
                      </span>

                      {/* Message bubble */}
                      <div className={`p-4 rounded-3xl text-xs font-semibold leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-zinc-900 border border-zinc-800 text-white rounded-br-none dark:bg-white dark:text-zinc-900 dark:border-none' 
                          : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none dark:bg-zinc-800 dark:border-zinc-700 dark:text-white'
                      }`}>
                        <p>{reply.message}</p>
                      </div>

                      {/* Message timestamp */}
                      <span className="text-[9px] font-mono text-zinc-400 mt-1 px-2">
                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {(!selectedTicket.replies || selectedTicket.replies.length === 0) && (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest font-mono">No communication messages yet. Write a response below!</p>
                  </div>
                )}
              </div>

              {/* Chat action input editor tray */}
              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850/60 font-sans">
                <form onSubmit={(e) => handleSendReply(e, selectedTicket.id)} className="flex gap-3">
                  <input
                    type="text"
                    required
                    disabled={isSendingReply || selectedTicket.status === 'resolved'}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={selectedTicket.status === 'resolved' 
                      ? "This conversation is resolved (closed). Staff can re-open to reply." 
                      : "Type your official support response or query details..."
                    }
                    className="flex-1 px-4 py-3 bg-white dark:bg-zinc-900 disabled:opacity-60 border border-zinc-200 dark:border-zinc-805 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim() || selectedTicket.status === 'resolved'}
                    className="p-3 bg-brand hover:bg-brand-hover text-white disabled:opacity-40 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center py-32 p-10 text-center col-span-1 lg:col-span-8">
              <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 text-brand mb-4">
                <MessageSquare size={36} />
              </div>
              <h3 className="text-sm font-black text-zinc-805 dark:text-white uppercase tracking-wider">No Active Support Thread Selected</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-400 font-semibold max-w-sm font-sans mt-1.5 leading-relaxed">
                Click on any support ticket in the left-hand queue to view live message history logs, status progress logs, or send dynamic staff queries.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
