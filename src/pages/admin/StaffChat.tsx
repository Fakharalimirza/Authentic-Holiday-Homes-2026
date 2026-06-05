import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { chatCache } from '../../lib/chatCache';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, MessageSquare, Search, User, Shield, ChevronLeft, 
  Users, Crown, Briefcase, Landmark, Wrench, Sparkles, AlertCircle, MessageCircle
} from 'lucide-react';

interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt?: any;
}

interface StaffDMMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  channelId: string;
  text: string;
  createdAt: any;
}

interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  phone?: string;
  role?: string;
}

export default function StaffChat() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatUser = searchParams.get('chatUser');
  
  // Roster & active conversation state
  const [activeTab, setActiveTabState] = useState<'global' | string>(() => {
    return chatUser || 'global';
  });

  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    const newParams: Record<string, string> = { tab: 'staff_chat' };
    if (tabId !== 'global') {
      newParams.chatUser = tabId;
    }
    setSearchParams(newParams);
  };

  useEffect(() => {
    const cu = searchParams.get('chatUser');
    const tab = searchParams.get('tab');
    if (tab === 'staff_chat') {
      if (cu) {
        setActiveTabState(cu);
      } else {
        setActiveTabState('global');
      }
    }
  }, [searchParams]);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Messaging logs
  const [globalMessages, setGlobalMessages] = useState<StaffMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<StaffDMMessage[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  // 1. Fetch available workspace members / registered staff
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(list);
    }, (error) => {
      console.error("StaffChat list fetch users failed:", error);
    });

    return () => unsubscribeUsers();
  }, []);

  // 2. Fetch Global channel coordination messages
  useEffect(() => {
    // Instant pre-population from cache
    const cached = chatCache.getMessages('global_team_feed');
    if (cached.length > 0) {
      setGlobalMessages(cached);
      if (activeTab === 'global') {
        setLoading(false);
        setTimeout(scrollToBottom, 50);
      }
    } else if (activeTab === 'global') {
      setLoading(true);
    }

    const qGlobalDocs = query(
      collection(db, 'staff_messages'),
      orderBy('createdAt', 'asc'),
      limit(80)
    );

    const unsubscribeGlobalChat = onSnapshot(qGlobalDocs, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffMessage[];
      setGlobalMessages(list);
      chatCache.saveMessages('global_team_feed', list);
      
      if (activeTab === 'global') {
        setLoading(false);
        setTimeout(scrollToBottom, 150);
      }
    }, (error) => {
      console.error("Global chat loading failed:", error);
      if (activeTab === 'global') setLoading(false);
    });

    return () => unsubscribeGlobalChat();
  }, [activeTab]);

  // 3. Fetch Personal DMs if a specific recipient is chosen
  useEffect(() => {
    if (activeTab === 'global' || !user) {
      setDmMessages([]);
      setLoading(false);
      return;
    }

    const channelId = [user.uid, activeTab].sort().join('_');

    // Instant pre-population from cache
    const cached = chatCache.getMessages(channelId);
    if (cached.length > 0) {
      setDmMessages(cached);
      setLoading(false);
      setTimeout(scrollToBottom, 30);
    } else {
      setLoading(true);
    }

    const qDms = query(
      collection(db, 'staff_dms'),
      where('channelId', '==', channelId)
    );

    const unsubscribeDms = onSnapshot(qDms, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StaffDMMessage[];

      // Sort client-side by timestamp to avoid requiring composite indexes
      list.sort((a,b) => {
        const timeA = a.createdAt?.seconds || (Date.now() / 1000 + 3600);
        const timeB = b.createdAt?.seconds || (Date.now() / 1000 + 3600);
        return timeA - timeB;
      });

      setDmMessages(list);
      chatCache.saveMessages(channelId, list);
      setLoading(false);

      setTimeout(scrollToBottom, 150);
    }, (error) => {
      console.error("DMs query reading failed:", error);
      setLoading(false);
    });

    return () => unsubscribeDms();
  }, [activeTab, user]);

  // Auto scroll top level when tab changes
  useEffect(() => {
    setTimeout(scrollToBottom, 150);
  }, [activeTab]);

  // Sending message dispatch
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !user) return;
    
    setIsSending(true);
    const contentText = inputText.trim();
    setInputText('');

    try {
      if (activeTab === 'global') {
        // Post to global room
        const payload = {
          senderId: user.uid,
          senderName: profile?.displayName || user.displayName || 'Staff Member',
          senderRole: profile?.role || 'agent',
          text: contentText,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'staff_messages'), payload);
      } else {
        // Direct Message channel
        const channelId = [user.uid, activeTab].sort().join('_');
        const payload = {
          senderId: user.uid,
          senderName: profile?.displayName || user.displayName || 'Staff Member',
          senderRole: profile?.role || 'agent',
          recipientId: activeTab,
          channelId,
          text: contentText,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'staff_dms'), payload);
      }
    } catch (error: any) {
      console.error("Failed to post message:", error);
      alert("Messaging anomaly: failed to send message. " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Helper styles for role badge presentation
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'super_admin':
      case 'host':
        return <Crown size={11} className="text-amber-550 mr-1" />;
      case 'admin':
        return <Shield size={11} className="text-rose-555 mr-1" />;
      case 'agent':
        return <Briefcase size={11} className="text-indigo-550 mr-1" />;
      case 'landlord':
        return <Landmark size={11} className="text-emerald-555 mr-1" />;
      case 'maintenance':
        return <Wrench size={11} className="text-cyan-555 mr-1" />;
      default:
        return <User size={11} className="text-zinc-400 mr-1" />;
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'super_admin':
      case 'host':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200';
      case 'admin':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200';
      case 'agent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200';
      case 'landlord':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200';
      default:
        return 'bg-zinc-100 text-zinc-655 dark:bg-zinc-800 dark:text-zinc-300';
    }
  };

  // Active chat profile presentation
  const selectedUser = activeTab === 'global' ? null : users.find(u => u.uid === activeTab);

  // Divide roster into Staff collaborators and other registered users
  const staffMembers = users.filter(u => 
    u.uid !== user?.uid && 
    ['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(u.role || '')
  );

  const otherMembers = users.filter(u => 
    u.uid !== user?.uid && 
    !['super_admin', 'admin', 'agent', 'maintenance', 'host', 'landlord'].includes(u.role || '')
  );

  // Apply search filtering
  const filterByTerm = (memberList: UserProfile[]) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return memberList;
    return memberList.filter(m => 
      (m.displayName || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.role || '').toLowerCase().includes(term)
    );
  };

  const filteredStaff = filterByTerm(staffMembers);
  const filteredOthers = filterByTerm(otherMembers);

  return (
    <div id="staff_chat_personal_dm_arena" className="border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm flex h-[620px]">
      
      {/* Sidebar Roster container */}
      <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-805 flex flex-col bg-white dark:bg-zinc-900 select-none ${
        showSidebarOnMobile ? 'block' : 'hidden md:flex'
      }`}>
        {/* Search & Setup Header */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-805 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-white flex items-center gap-1.5">
              <MessageCircle size={16} className="text-brand" /> Staff Inbox
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-[#16a34a]/10 text-[#16a34a] dark:text-[#22c55e] border border-[#22c55e]/20">
              Live Team
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search staff, agents, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none focus:border-brand placeholder-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* Sidebar scrolling channel items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 no-scrollbar">
          
          {/* Default Global Board */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-2">Public Channels</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('global');
                setShowSidebarOnMobile(false);
              }}
              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                activeTab === 'global'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeTab === 'global' ? 'bg-brand text-white' : 'bg-brand/10 text-brand'}`}>
                <Users size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate uppercase tracking-wider">Global Team Feed</div>
                <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 truncate leading-snug">Public staff bulletin chat</div>
              </div>
            </button>
          </div>

          {/* DM Staff list */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-zinc-405 uppercase tracking-widest">Registered Staff</span>
              <span className="text-[9px] font-mono text-zinc-400 font-bold">{filteredStaff.length}</span>
            </div>

            <div className="space-y-1">
              {filteredStaff.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => {
                    setActiveTab(u.uid);
                    setShowSidebarOnMobile(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                    activeTab === u.uid
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand/15 text-brand flex items-center justify-center font-black text-[11px] uppercase shrink-0">
                    {u.displayName ? u.displayName.substring(0, 2) : 'US'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate flex items-center justify-between">
                      <span className="truncate">{u.displayName || 'Staff Collaborator'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center text-[7.5px] font-black uppercase tracking-wider px-1 px-1.5 rounded ${
                        activeTab === u.uid 
                          ? 'bg-zinc-850 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-900' 
                          : getRoleBadgeStyle(u.role)
                      }`}>
                        {getRoleIcon(u.role)}
                        {u.role || 'agent'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {filteredStaff.length === 0 && (
                <div className="text-center py-4 text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  No staff members matched
                </div>
              )}
            </div>
          </div>

          {/* Optional Direct messaging for guests & others */}
          {filteredOthers.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-zinc-150 dark:border-zinc-805">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-zinc-405 uppercase tracking-widest">Other Members</span>
                <span className="text-[9px] font-mono text-zinc-400 font-bold">{filteredOthers.length}</span>
              </div>

              <div className="space-y-1">
                {filteredOthers.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => {
                      setActiveTab(u.uid);
                      setShowSidebarOnMobile(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                      activeTab === u.uid
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold shadow-sm'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-350 flex items-center justify-center font-black text-[11px] uppercase shrink-0">
                      {u.displayName ? u.displayName.substring(0, 2) : 'US'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{u.displayName || 'Resident Member'}</div>
                      <div className="text-[9.5px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Messaging Arena Panel */}
      <div className={`flex-1 flex flex-col bg-zinc-50/40 dark:bg-zinc-955/5 ${
        !showSidebarOnMobile ? 'block' : 'hidden md:flex'
      }`}>
        
        {/* Active conversation Header */}
        <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-805 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back navigation button */}
            <button
              type="button"
              onClick={() => setShowSidebarOnMobile(true)}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg md:hidden cursor-pointer shrink-0"
            >
              <ChevronLeft size={18} />
            </button>

            {activeTab === 'global' ? (
              <>
                <div className="p-2.5 bg-brand/10 text-brand rounded-2xl shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-white flex items-center gap-2">
                    Global Team Feed
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase bg-[#16a34a] text-white">
                      Internal Board
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 leading-snug truncate">Private broadcast feed for coordinating internal operations and turnovers.</p>
                </div>
              </>
            ) : selectedUser ? (
              <>
                <div className="w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center font-black text-xs uppercase shrink-0">
                  {selectedUser.displayName ? selectedUser.displayName.substring(0, 2) : 'US'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-850 dark:text-white flex items-center gap-2">
                    <span className="truncate">{selectedUser.displayName || 'Staff Collaborator'}</span>
                    <span className={`px-1.5 py-0.3 rounded text-[8px] font-black tracking-widest ${getRoleBadgeStyle(selectedUser.role)}`}>
                      {selectedUser.role || 'agent'}
                    </span>
                  </h3>
                  <p className="text-[10px] font-serif italic text-zinc-400 leading-none mt-0.5 truncate">{selectedUser.email || 'Email not classified'}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Conversation Unselected</span>
              </div>
            )}
          </div>
        </div>

        {/* Message scroll container */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 animate-pulse">
              <MessageSquare className="text-zinc-350 animate-bounce" size={24} />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Syncing logs securely...</p>
            </div>
          ) : (
            <>
              {activeTab === 'global' ? (
                // Render global board messages
                globalMessages.map((msg, index) => {
                  const isCurrentUser = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-feed`}>
                      <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl p-3 sm:p-4 shadow-xs relative ${
                        isCurrentUser 
                          ? 'bg-zinc-900 text-white rounded-tr-none dark:bg-zinc-100 dark:text-zinc-900' 
                          : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-white rounded-tl-none border border-zinc-150 dark:border-zinc-800/80'
                      }`}>
                        
                        {!isCurrentUser && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[9.5px] font-black uppercase tracking-wide text-zinc-900 dark:text-white">
                              {msg.senderName}
                            </span>
                            <span className={`text-[7.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded ${getRoleBadgeStyle(msg.senderRole)}`}>
                              {msg.senderRole}
                            </span>
                          </div>
                        )}

                        <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        <span className={`text-[8.5px] mt-1.5 block text-right font-mono ${isCurrentUser ? 'text-zinc-300 dark:text-zinc-500' : 'text-zinc-405'}`}>
                          {msg.createdAt?.seconds 
                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : 'Sending...'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Render Direct Messages
                dmMessages.map((msg, index) => {
                  const isCurrentUser = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-feed`}>
                      <div className={`max-w-[75%] sm:max-w-[65%] rounded-2xl p-3 sm:p-4 shadow-xs relative ${
                        isCurrentUser 
                          ? 'bg-brand text-white rounded-tr-none' 
                          : 'bg-white dark:bg-zinc-850 text-zinc-800 dark:text-white rounded-tl-none border border-zinc-150 dark:border-zinc-800/80'
                      }`}>
                        
                        {!isCurrentUser && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[9.5px] font-black uppercase tracking-wide text-zinc-900 dark:text-white">
                              {msg.senderName}
                            </span>
                          </div>
                        )}

                        <p className="text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        <span className={`text-[8.5px] mt-1.5 block text-right font-mono ${isCurrentUser ? 'text-zinc-200' : 'text-zinc-405'}`}>
                          {msg.createdAt?.seconds 
                            ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : 'Sending...'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Empty state views */}
              {activeTab === 'global' && globalMessages.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <Sparkles className="text-zinc-300 mb-3" size={28} />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Collaboration logs clear</p>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">No internal broadcasts recorded today. Post an announcement to start.</p>
                </div>
              )}

              {activeTab !== 'global' && dmMessages.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center justify-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-3xl m-4">
                  <MessageCircle className="text-zinc-300 dark:text-zinc-750 mb-3" size={28} />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Beginning of Direct Conversation</p>
                  <p className="text-[10px] text-zinc-400 mt-1 max-w-xs leading-relaxed">Your conversation is confidential. Type a private direct message below to begin chatting with {selectedUser?.displayName || 'this staff member'}.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Messaging Input dock */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-900">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder={
                activeTab === 'global'
                  ? 'Broadcast operational reminders, turnover state info...'
                  : `Type your secure private message to ${selectedUser?.displayName || 'colleague'}...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none focus:border-brand placeholder-zinc-400 transition-colors"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-5 py-3 bg-brand text-white rounded-2xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <Send size={11} /> Send
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
