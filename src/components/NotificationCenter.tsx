import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { notificationService } from '../lib/notifications';
import { MessageSquare, ClipboardList, X, Bell, LayoutGrid, Check, Trash2, Heart, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Toast {
  id: string;
  title: string;
  description: string;
  type: 'dm' | 'ticket' | 'reply';
  link: string;
}

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  type: 'dm' | 'ticket' | 'reply';
  link: string;
  timestamp: number;
  isRead: boolean;
}

export default function NotificationCenter() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize event history from local storage for high durability reload persistence
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('user_notification_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // We use refs to avoid playing notifications upon first historical load
  const isFirstDmsLoad = useRef(true);
  const isFirstTicketsLoad = useRef(true);
  const dmsUnsubRef = useRef<(() => void) | null>(null);
  const ticketsUnsubRef = useRef<(() => void) | null>(null);

  // Caches to prevent duplicate notifications from resubscriptions or transient write updates
  const processedDmsRef = useRef<Set<string>>(new Set());
  const processedTicketsRef = useRef<Map<string, { status: string; repliesCount: number; lastReplyId?: string }>>(new Map());

  // Synchronize history shifts to local storage
  const saveHistoryToStore = (newHistory: HistoryItem[]) => {
    try {
      localStorage.setItem('user_notification_history_v1', JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Could not save notifications history log:", e);
    }
  };

  const appendToHistory = (title: string, description: string, type: 'dm' | 'ticket' | 'reply', link: string) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title,
      description,
      type,
      link,
      timestamp: Date.now(),
      isRead: false
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 40); // Cap history log records to latest 40 items
      saveHistoryToStore(updated);
      return updated;
    });
  };

  // Helper to append a beautiful toast banner
  const addToast = (title: string, description: string, type: 'dm' | 'ticket' | 'reply', link: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newToast: Toast = { id, title, description, type, link };
    
    setToasts((prev) => [newToast, ...prev].slice(0, 4)); // Limit to maximum 4 simultaneous toasts on screen

    // Append to notifications log history
    appendToHistory(title, description, type, link);

    // Play synthesized acoustic chime in the user context
    if (type === 'dm') {
      notificationService.playDMChime();
    } else {
      notificationService.playTicketAlert();
    }

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Subscribe to Received Direct Messages (DMs)
  useEffect(() => {
    if (!user) {
      if (dmsUnsubRef.current) {
        dmsUnsubRef.current();
        dmsUnsubRef.current = null;
      }
      isFirstDmsLoad.current = true;
      processedDmsRef.current.clear();
      return;
    }

    isFirstDmsLoad.current = true;
    
    // Listen to personal DMs targeting the current logged in user
    const qDms = query(
      collection(db, 'staff_dms'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(qDms, (snapshot) => {
      let isInitial = false;
      if (isFirstDmsLoad.current) {
        isFirstDmsLoad.current = false;
        isInitial = true;
      }

      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        if (isInitial) {
          processedDmsRef.current.add(docId);
        } else {
          if (change.type === 'added') {
            if (!processedDmsRef.current.has(docId)) {
              processedDmsRef.current.add(docId);
              const docData = change.doc.data();
              const isStaff = profile?.role && ['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(profile.role);
              addToast(
                `New Message`,
                `Message from ${docData.senderName || 'Staff'}: "${docData.text || ''}"`,
                'dm',
                isStaff
                  ? `/admin?tab=staff_chat&chatUser=${docData.senderId}` // Staff members go straight to specific DM conversation in admin portal
                  : '/chat'  // Guests go to standard chat page
              );
            }
          }
        }
      });
    }, (error) => {
      console.warn("NotificationCenter staff_dms listener error:", error);
    });

    dmsUnsubRef.current = unsubscribe;

    return () => {
      if (dmsUnsubRef.current) {
        dmsUnsubRef.current();
        dmsUnsubRef.current = null;
      }
    };
  }, [user, profile]);

  // 2. Subscribe to Support & Service Tickets
  useEffect(() => {
    if (!user) {
      if (ticketsUnsubRef.current) {
        ticketsUnsubRef.current();
        ticketsUnsubRef.current = null;
      }
      isFirstTicketsLoad.current = true;
      processedTicketsRef.current.clear();
      return;
    }

    isFirstTicketsLoad.current = true;
    const isPrivileged = ['super_admin', 'admin', 'agent', 'maintenance', 'host'].includes(profile?.role || '');

    // Set query constraint: staff members listen to all ticket alterations; guests listen only to their own tickets.
    const qTickets = isPrivileged
      ? query(collection(db, 'tickets'))
      : query(collection(db, 'tickets'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(qTickets, (snapshot) => {
      let isInitial = false;
      if (isFirstTicketsLoad.current) {
        isFirstTicketsLoad.current = false;
        isInitial = true;
      }

      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        const docData = change.doc.data();
        const replies = docData.replies || [];
        const status = docData.status || 'open';
        const lastReply = replies[replies.length - 1];
        const lastReplyId = lastReply ? (lastReply.id || `${lastReply.senderId}_${lastReply.createdAt?.seconds || lastReply.timestamp || 0}`) : undefined;

        if (isInitial) {
          processedTicketsRef.current.set(docId, {
            status,
            repliesCount: replies.length,
            lastReplyId
          });
        } else {
          const oldState = processedTicketsRef.current.get(docId);

          if (change.type === 'added') {
            if (!oldState) {
              processedTicketsRef.current.set(docId, {
                status,
                repliesCount: replies.length,
                lastReplyId
              });

              // Do not toast if the current user added the ticket themselves
              if (docData.userId !== user.uid) {
                addToast(
                  `New Service Ticket`,
                  `Room alert: "${docData.title || docData.description || 'No Title'}" - Category: ${String(docData.category || 'Maintenance').toUpperCase()}`,
                  'ticket',
                  isPrivileged ? `/admin?tab=support&ticketId=${docId}` : `/profile?tab=support&ticketId=${docId}`
                );
              }
            }
          } else if (change.type === 'modified') {
            const replyCountIncreased = !oldState || replies.length > oldState.repliesCount || (lastReplyId && lastReplyId !== oldState.lastReplyId);
            const statusChanged = !oldState || status !== oldState.status;

            processedTicketsRef.current.set(docId, {
              status,
              repliesCount: replies.length,
              lastReplyId
            });

            if (replyCountIncreased && lastReply) {
              // If the last reply is not by the current user, toast it!
              if (lastReply.senderId !== user.uid) {
                addToast(
                  `Support Ticket Reply`,
                  `Reply from ${lastReply.senderName || 'Staff'}: "${lastReply.message || lastReply.text || ''}"`,
                  'reply',
                  isPrivileged ? `/admin?tab=support&ticketId=${docId}` : `/profile?tab=support&ticketId=${docId}`
                );
              }
            } else if (statusChanged) {
              // General ticket update (status update, etc.)
              addToast(
                `Ticket Status Shifted`,
                `"${docData.title || docData.description || 'No Title'}" updated to status [${String(status).replace('_', ' ').toUpperCase()}]`,
                'ticket',
                isPrivileged ? `/admin?tab=support&ticketId=${docId}` : `/profile?tab=support&ticketId=${docId}`
              );
            }
          }
        }
      });
    }, (error) => {
      console.warn("NotificationCenter tickets listener error:", error);
    });

    ticketsUnsubRef.current = unsubscribe;

    return () => {
      if (ticketsUnsubRef.current) {
        ticketsUnsubRef.current();
        ticketsUnsubRef.current = null;
      }
    };
  }, [user, profile]);

  const removeToast = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast: Toast) => {
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    navigate(toast.link);
  };

  // Unread badge calculation
  const unreadCount = history.filter((item) => !item.isRead).length;

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.map((item) => ({ ...item, isRead: true }));
    setHistory(updated);
    saveHistoryToStore(updated);
  };

  const clearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    saveHistoryToStore([]);
  };

  const markItemAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.map((item) => item.id === id ? { ...item, isRead: true } : item);
    setHistory(updated);
    saveHistoryToStore(updated);
  };

  const formatDistanceToNow = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Interactive Bell Icon Trigger */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2.5 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all focus:outline-none hover:scale-105 active:scale-95 duration-200 cursor-pointer flex items-center justify-center h-10 w-10"
        title="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-black text-white px-1 shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Elegant Dropdown log list portal */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-3 w-auto sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-[9999] overflow-hidden backdrop-blur-md select-none"
          >
            {/* Dropdown Header */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Bell size={13} className="text-brand" /> Notifications Center
                </h3>
                <p className="text-[9.5px] text-zinc-400 mt-0.5 font-bold uppercase tracking-wide">
                  {unreadCount} UNREAD STATUS LOGS
                </p>
              </div>

              <div className="flex items-center gap-1">
                {history.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="p-1 px-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800/80 rounded-lg text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check size={11} /> Read All
                    </button>
                    <button
                      onClick={clearAllHistory}
                      className="p-1 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 transition-colors cursor-pointer"
                      title="Clear log history"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notification logs list */}
            <div className="max-h-[350px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 no-scrollbar">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // Mark item as read asynchronously on navigation click
                    const updated = history.map((old) => old.id === item.id ? { ...old, isRead: true } : old);
                    setHistory(updated);
                   saveHistoryToStore(updated);
                    navigate(item.link);
                  }}
                  className={`p-4 flex gap-3 cursor-pointer select-none transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 relative group ${
                    !item.isRead ? 'bg-brand/5 dark:bg-brand/5 border-l-2 border-brand font-medium' : ''
                  }`}
                >
                  <div className={`p-2 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shrink-0 ${
                    item.type === 'dm' 
                      ? 'bg-brand/10 text-brand' 
                      : item.type === 'reply' 
                      ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' 
                      : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  }`}>
                    {item.type === 'dm' ? <MessageSquare size={14} /> : <ClipboardList size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11.5px] font-bold text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[8px] font-semibold text-zinc-400 shrink-0 uppercase tracking-widest font-mono">
                        {formatDistanceToNow(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-snug break-words">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 text-[8px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-brand transition-colors">
                      <ExternalLink size={10} /> Launch view details
                    </div>
                  </div>

                  {/* Actions for single item */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 rounded-lg p-1 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    {!item.isRead && (
                      <button
                        onClick={(e) => markItemAsRead(item.id, e)}
                        className="p-1 hover:bg-zinc-150 dark:hover:bg-zinc-850 text-green-600 rounded cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-12 p-6 text-center text-zinc-450 flex flex-col items-center justify-center">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/80 text-zinc-350 dark:text-zinc-650 rounded-2xl mb-2.5">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Quiet workspace, no alerts</p>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    You're completely up to date. Direct support messages and room ticket shifts will spawn logs here in real-time.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-150 dark:border-zinc-850 text-center">
              <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-400">
                Workspace Security Verified &bull; Live Channels
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Global Screen Toasts Portal container */}
      <div className="fixed top-18 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none md:right-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 120, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              onClick={() => handleToastClick(toast)}
              className="w-full bg-zinc-950/95 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-white p-4 mx-auto rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3.5 cursor-pointer pointer-events-auto hover:bg-zinc-900/95 dark:hover:bg-zinc-850 transition-colors select-none group min-h-16"
            >
              {/* Visual Type Indicator */}
              <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                toast.type === 'dm' 
                  ? 'bg-brand' 
                  : toast.type === 'reply' 
                  ? 'bg-[#155e75]/90' 
                  : 'bg-[#9a3412]/90'
              }`}>
                {toast.type === 'dm' ? <MessageSquare size={16} /> : <ClipboardList size={16} />}
              </div>

              {/* Informational Text */}
              <div className="flex-1 min-w-0 pr-1.5">
                <h4 className="text-[11.5px] font-black uppercase tracking-widest text-[#d97706] flex items-center gap-1.5">
                  <Bell size={11} className="animate-bounce" /> {toast.title}
                </h4>
                <p className="text-xs font-semibold text-zinc-100 dark:text-zinc-200 mt-1 leading-snug break-words whitespace-pre-wrap line-clamp-3">
                  {toast.description}
                </p>
                <div className="flex items-center gap-1 mt-2 text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 group-hover:text-amber-500 duration-300">
                  <LayoutGrid size={11} /> Click to view details
                </div>
              </div>

              {/* Close Button Anchor */}
              <button
                onClick={(e) => removeToast(toast.id, e)}
                className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5"
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
