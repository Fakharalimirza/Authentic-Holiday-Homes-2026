import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { chatCache } from '../../lib/chatCache';
import { Send, User as UserIcon, MessageSquare, Search, ShieldCheck, ChevronLeft, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  recipientId: string;
  channelId: string;
  text: string;
  createdAt: any;
}

interface StaffProfile {
  uid: string;
  email?: string;
  displayName?: string;
  role?: string;
}

export default function Chat() {
  const { user, profile } = useAuth();
  const { t } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Available Staff roster
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Load workspace users and filter staff members
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as StaffProfile[];

      // Filter users who hold official management/host/support roles
      const staffOnly = list.filter(u => 
        u.uid !== user?.uid && 
        ['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(u.role || '')
      );

      setStaffList(staffOnly);
      
      // Default to first staff member if nothing is selected
      if (staffOnly.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffOnly[0].uid);
      }
      setLoading(false);
    }, (error) => {
      console.error("Failed to load official support hosts:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user, selectedStaffId]);

  // Compute bidirectional conversation channel identifier
  const channelId = user && selectedStaffId ? [user.uid, selectedStaffId].sort().join('_') : null;

  // 2. Fetch Personal DM messages dynamically
  useEffect(() => {
    if (!user || !channelId) {
      setMessages([]);
      return;
    }

    // Modern performance technique: pre-populate instantly from client cache
    const cached = chatCache.getMessages(channelId);
    if (cached.length > 0) {
      setMessages(cached);
      setLoading(false);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 30);
    } else {
      setLoading(true);
    }

    const qDms = query(
      collection(db, 'staff_dms'),
      where('channelId', '==', channelId)
    );

    const unsubscribe = onSnapshot(qDms, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Sort client-side sequentially to maintain temporal integrity
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000 + 3600);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000 + 3600);
        return timeA - timeB;
      });

      setMessages(list);
      // Asynchronously cache messages
      chatCache.saveMessages(channelId, list);
      setLoading(false);

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      console.error("Failed to sync direct messaging list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, channelId]);

  // Smooth scroll helper
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedStaffId || !channelId || !newMessage.trim()) return;

    const textPayload = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'staff_dms'), {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || 'Resident Guest',
        senderRole: profile?.role || 'guest',
        recipientId: selectedStaffId,
        channelId,
        text: textPayload,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to dispatch client message:", error);
    }
  };

  if (!user) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 bg-zinc-100 rounded-full text-zinc-400">
          <MessageSquare size={32} />
        </div>
        <h3 className="font-bold text-lg text-zinc-800">Support Chat Offline</h3>
        <p className="text-sm text-zinc-500 max-w-sm">Please sign in with your verified profile to start a direct secure coordinate chat session with hosts.</p>
      </div>
    );
  }

  const activeStaffMember = staffList.find(s => s.uid === selectedStaffId);
  const filteredStaff = staffList.filter(s => 
    (s.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex gap-6">
      
      {/* Sidebar - Support Desk Roster */}
      <div className={`w-full md:w-80 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col ${
        showSidebarOnMobile ? 'block' : 'hidden md:flex'
      }`}>
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-white">Workspace Staff</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand/10 text-brand">
              Concierge
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Filter support staff, agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          {filteredStaff.map((staff) => {
            const isSelected = staff.uid === selectedStaffId;
            return (
              <button
                key={staff.uid}
                onClick={() => {
                  setSelectedStaffId(staff.uid);
                  setShowSidebarOnMobile(false);
                }}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                  isSelected ? 'bg-brand text-white' : 'bg-brand/10 text-brand'
                }`}>
                  {staff.displayName ? staff.displayName.substring(0, 2) : 'ST'}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-bold text-xs truncate">{staff.displayName || 'Support Manager'}</p>
                  <p className={`text-[8.5px] font-black uppercase tracking-widest mt-0.5 truncate ${
                    isSelected ? 'text-zinc-350' : 'text-zinc-400'
                  }`}>
                    {staff.role || 'Property Manager'}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredStaff.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">
              No personnel found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area viewport */}
      <div className={`flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl flex flex-col ${
        !showSidebarOnMobile ? 'block' : 'hidden md:flex'
      }`}>
        
        {/* Chat header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => setShowSidebarOnMobile(true)}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 rounded-lg md:hidden cursor-pointer shrink-0"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center shrink-0">
            <UserIcon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-zinc-850 dark:text-white truncate">
              {activeStaffMember?.displayName || 'Concierge Host'}
            </h3>
            <p className="text-[10px] text-green-550 font-bold flex items-center gap-1 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-green-550 rounded-full animate-pulse"></span> Official Support Chanel
            </p>
          </div>
        </div>

        {/* Message logs list */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isCurrentUser = msg.senderId === user.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl ${
                    isCurrentUser 
                      ? 'bg-brand text-white rounded-br-none shadow-sm' 
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-none shadow-xs border border-zinc-100 dark:border-zinc-700'
                  }`}>
                    <p className={`text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap ${
                      isCurrentUser ? 'text-white' : 'text-zinc-900 dark:text-white'
                    }`}>{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1.5 justify-end ${
                      isCurrentUser ? 'text-white/60' : 'text-zinc-400'
                    }`}>
                      <span className="text-[8.5px] font-mono">
                        {msg.createdAt?.seconds 
                          ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'sending...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {messages.length === 0 && (
            <div className="text-center py-24 flex flex-col items-center justify-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-3xl m-4">
              <MessageSquare className="text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Secure DM with {activeStaffMember?.displayName || 'Host'}</p>
              <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">This conversation is encrypted and monitored by building management. Ask any question regarding stay turnover, payment queries, maintenance, checkin-checkout details.</p>
            </div>
          )}
        </div>

        {/* Form dock */}
        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex gap-3">
          <input 
            type="text" 
            required
            value={newMessage}
            disabled={!selectedStaffId}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedStaffId ? "Type a secure message..." : "Select a staff member from sidebar to chat..."}
            className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-xs font-semibold focus:outline-none focus:border-brand"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim() || !selectedStaffId}
            className="p-3.5 bg-brand text-white rounded-2xl hover:scale-105 active:scale-95 transition-all hover:bg-brand-hover shrink-0 disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>

      </div>
    </div>
  );
}
