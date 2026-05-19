import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PropertyCard from '../components/PropertyCard';
import { Property } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Profile({ defaultTab = 'bookings' }: { defaultTab?: 'bookings' | 'wishlist' | 'settings' }) {
  const { user, profile } = useAuth();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [wishlistItems, setWishlistItems] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Wishlist
        if (profile.wishlist && profile.wishlist.length > 0) {
          const propertyPromises = profile.wishlist.map((id: string) => getDoc(doc(db, 'properties', id)));
          const snaps = await Promise.all(propertyPromises);
          setWishlistItems(snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() } as Property)));
        }

        // Fetch Bookings
        const q = query(collection(db, 'bookings'), where('guestId', '==', user.uid));
        const bookingSnaps = await getDocs(q);
        setBookings(bookingSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, profile]);

  if (!user) return <div className="p-20 text-center">Please sign in to view your profile.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 space-y-2">
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl mb-6 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 overflow-hidden">
               {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-2xl">{user.displayName?.[0]}</div>}
             </div>
             <h2 className="font-bold text-lg">{user.displayName}</h2>
             <p className="text-zinc-500 text-sm">{user.email}</p>
          </div>

          {[
            { id: 'bookings', label: t('my_bookings'), icon: Calendar },
            { id: 'wishlist', label: t('wishlist'), icon: Heart },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-brand text-white' 
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}

          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all mt-12"
          >
            <LogOut size={20} />
            {t('sign_out')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-8">{t('my_bookings')}</h2>
                {loading ? <div className="animate-pulse">Loading bookings...</div> : (
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                      <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl text-zinc-500 underline decoration-zinc-200">
                        No bookings found. Time for an adventure?
                      </div>
                    ) : (
                      bookings.map(b => (
                        <div key={b.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex justify-between items-center">
                           <div>
                             <p className="text-xs uppercase tracking-widest font-bold text-zinc-400 mb-1">Booking #{b.id.slice(-6)}</p>
                             <h4 className="font-bold text-lg">Property ID: {b.propertyId}</h4>
                             <p className="text-sm text-zinc-500">{new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-xl">${b.totalPrice}</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                              }`}>{b.status}</span>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-8">{t('wishlist')}</h2>
                {loading ? <div className="animate-pulse">Loading wishlist...</div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {wishlistItems.length === 0 ? (
                      <div className="col-span-full p-12 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl text-zinc-500 underline decoration-zinc-200">
                        Your wishlist is empty.
                      </div>
                    ) : (
                      wishlistItems.map(item => (
                        <PropertyCard key={item.id} property={item} />
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-8">Account Settings</h2>
                <div className="max-w-md space-y-6">
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-500">Display Name</label>
                     <input type="text" defaultValue={user.displayName || ''} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-zinc-900" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-zinc-500">Email Address</label>
                     <input type="email" readOnly value={user.email || ''} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed" />
                   </div>
                   <button className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-colors">Save Changes</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
