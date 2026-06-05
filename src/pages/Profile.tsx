import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { db, auth, collection, query, where, getDocs, doc, getDoc, setDoc, signOut } from '../lib/firebase';
import PropertyCard from '../components/PropertyCard';
import { Property } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Settings as SettingsIcon, LogOut, Star, Trash2, MessageSquare } from 'lucide-react';
import TicketsConsole from './admin/TicketsConsole';

export default function Profile({ defaultTab = 'bookings' }: { defaultTab?: 'bookings' | 'wishlist' | 'settings' | 'reviews' | 'support' }) {
  const { user, profile } = useAuth();
  const { t, theme, setTheme } = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTabState] = useState<'bookings' | 'wishlist' | 'settings' | 'reviews' | 'support'>(() => {
    const qTab = searchParams.get('tab') as any;
    const validTabs = ['bookings', 'wishlist', 'settings', 'reviews', 'support'];
    return qTab && validTabs.includes(qTab) ? qTab : defaultTab;
  });

  const setActiveTab = (tabId: 'bookings' | 'wishlist' | 'settings' | 'reviews' | 'support') => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as any;
    const validTabs = ['bookings', 'wishlist', 'settings', 'reviews', 'support'];
    if (tab && validTabs.includes(tab) && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams]);
  const [wishlistItems, setWishlistItems] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookedPropertiesList, setBookedPropertiesList] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Local Settings States
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.displayName || user?.displayName || '');
      setProfilePhone(profile.phone || '');
      setProfileDob(profile.dob || '');
    }
  }, [profile, user]);

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
        const fetchedBookings = bookingSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
        setBookings(fetchedBookings);

        // Fetch properties related to bookings for dropdown selection
        if (fetchedBookings.length > 0) {
          const propIds = Array.from(new Set(fetchedBookings.map((b: any) => b.propertyId)));
          const propertyPromises = propIds.map((id: string) => getDoc(doc(db, 'properties', id)));
          const snaps = await Promise.all(propertyPromises);
          const bookedProps = snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() } as Property));
          setBookedPropertiesList(bookedProps);
        }
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
               {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold text-2xl">{(profile?.displayName || user?.displayName)?.[0]}</div>}
             </div>
             <h2 className="font-bold text-lg">{profile?.displayName || user?.displayName}</h2>
             <p className="text-zinc-500 text-sm">{user.email}</p>
          </div>

          {[
            { id: 'bookings', label: t('my_bookings'), icon: Calendar },
            { id: 'wishlist', label: t('wishlist'), icon: Heart },
            { id: 'reviews', label: 'My Reviews', icon: Star },
            { id: 'support', label: 'Support Tickets', icon: MessageSquare },
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
            onClick={async () => {
              await signOut(auth);
              navigate('/');
            }}
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

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-3xl font-bold mb-8">My Reviews</h2>
                <div className="space-y-6">
                  {!profile || !profile.reviewsList || profile.reviewsList.length === 0 ? (
                    <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-900 rounded-3xl text-zinc-500">
                      You haven't left any reviews yet. Rated properties will appear here!
                    </div>
                  ) : (
                    profile.reviewsList.map((item: any) => (
                      <div 
                        key={item.reviewId} 
                        className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-[2rem] shadow-sm relative group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-black text-zinc-900 dark:text-white text-lg hover:underline transition-all">
                              <a href={`/property/${item.propertyId}`}>{item.propertyName || 'Property Review'}</a>
                            </h3>
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest block mt-0.5">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={`${
                                  i < (item.rating || 5)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-zinc-200 dark:text-zinc-700'
                                } border-none`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-zinc-650 dark:text-zinc-400 text-sm font-semibold leading-relaxed">
                          "{item.comment}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div
                key="support"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-4">
                  <h2 className="text-3xl font-semibold mb-1">Support Desk</h2>
                  <p className="text-xs text-zinc-400">Lodge maintenance requests, rent payment coordination options, or query invoicing errors directly.</p>
                </div>
                <TicketsConsole 
                  userUid={user.uid} 
                  userRole={profile?.role || 'guest'} 
                  userName={profile?.displayName || user.displayName || 'Resident'} 
                  propertiesList={bookedPropertiesList} 
                />
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
                
                {/* SETTINGS FORM */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!user) return;
                    setSavingSettings(true);
                    setSettingsStatus(null);
                    try {
                      // Save profile in our SQL backend using setDoc adapter
                      const bodyData = {
                        ...profile,
                        displayName: profileName,
                        phone: profilePhone,
                        dob: profileDob || null
                      };

                      await setDoc(doc(db, 'users', user.uid), bodyData);

                      // Synchronize client auth session state to keep memory and localStorage ahh_user consistent upon reload
                      auth.updateUserSession({
                        ...user,
                        displayName: profileName
                      }, localStorage.getItem("ahh_token") || undefined);

                      setSettingsStatus({ type: 'success', message: 'Your profile settings have been successfully synchronized!' });
                      
                      // Optionally trigger page auto-refresh after 1s to let changes populate everywhere
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } catch (err) {
                      setSettingsStatus({ type: 'error', message: 'Error establishing connection with database service.' });
                    } finally {
                      setSavingSettings(false);
                    }
                  }} 
                  className="max-w-md space-y-6"
                >
                  {settingsStatus && (
                    <div className={`p-4 rounded-xl border text-sm flex items-center gap-2.5 ${
                      settingsStatus.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
                        : 'bg-red-50 border-red-250 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400'
                    }`}>
                      <span className="font-semibold">{settingsStatus.message}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Display Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-zinc-900 text-zinc-900 dark:text-zinc-50" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Contact Number (Phone)</label>
                    <input 
                      type="text" 
                      placeholder="+971 XX XXX XXXX"
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-zinc-900 text-zinc-900 dark:text-zinc-50" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Date of Birth (Birthday Rewards 🎉)</label>
                    <input 
                      type="date" 
                      value={profileDob} 
                      onChange={(e) => setProfileDob(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent focus:ring-2 focus:ring-zinc-900 text-zinc-900 dark:text-zinc-50" 
                    />
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Provide your birthday to automatically receive greetings and booking rewards on your special day.</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Email Address</label>
                    <input type="email" readOnly value={user.email || ''} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider block">Theme Mode</label>
                    <div className="grid grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/50 w-full p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      {[
                        { id: 'system', label: t('system_mode'), desc: 'Matches device' },
                        { id: 'light', label: t('light_mode'), desc: 'Always crisp' },
                        { id: 'dark', label: t('dark_mode'), desc: 'Always dark' }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTheme(opt.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all ${
                            theme === opt.id
                              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50'
                              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-800/30'
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-tight">{opt.label}</span>
                          <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={savingSettings}
                    className="px-8 py-3 bg-brand text-white rounded-xl font-bold hover:bg-brand-hover transition-colors disabled:bg-zinc-400 flex items-center gap-2"
                  >
                    {savingSettings ? 'Saving changes...' : 'Save Changes'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
