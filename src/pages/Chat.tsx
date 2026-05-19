import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Send, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  read: boolean;
  chatId: string;
}

export default function Chat() {
  const { user } = useAuth();
  const { t } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // In a real app, we'd fetch chats first. For now, we'll use a fixed chatId or derive it.
  const chatId = activeChat || 'global_chat';

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [user, chatId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'chats'), {
        chatId,
        senderId: user.uid,
        receiverId: 'host_id_placeholder',
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage('');
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  if (!user) return <div className="p-20 text-center">Please sign in to chat with hosts.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-80px)] flex gap-6">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-80 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-bottom border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button className="w-full p-4 flex items-center gap-4 hover:bg-brand/5 dark:hover:bg-brand/10 transition-colors border-left-4 border-brand bg-brand/5 dark:bg-brand/10">
            <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <UserIcon className="text-zinc-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Property Host</p>
              <p className="text-xs text-zinc-500 truncate">How can I help you?</p>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
        <div className="p-6 border-bottom border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
           <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <UserIcon size={18} className="text-zinc-500" />
            </div>
            <div>
               <h3 className="font-bold">Property Host</h3>
               <p className="text-xs text-green-500 flex items-center gap-1">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
               </p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] p-4 rounded-2xl ${
                  msg.senderId === user.uid 
                    ? 'bg-brand text-white rounded-br-none' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-none shadow-sm border border-zinc-100 dark:border-zinc-700'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.senderId === user.uid ? 'justify-end text-white/50 dark:text-zinc-400' : 'text-zinc-400'}`}>
                    <span className="text-[10px]">
                      {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderId === user.uid && (
                      msg.read ? <CheckCheck size={12} /> : <Check size={12} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        <form onSubmit={sendMessage} className="p-6 bg-white dark:bg-zinc-900 border-top border-zinc-200 dark:border-zinc-800 flex gap-4">
           <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-6 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
           />
           <button 
            type="submit"
            className="p-4 bg-brand text-white rounded-2xl hover:scale-105 transition-transform hover:bg-brand-hover"
           >
             <Send size={20} />
           </button>
        </form>
      </div>
    </div>
  );
}
