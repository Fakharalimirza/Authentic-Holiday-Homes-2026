import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { GlobalSettingsProvider } from './contexts/GlobalSettingsContext';
import { LogIn, LogOut, Heart, User as UserIcon, MessageSquare, Menu, X, Sun, Moon, Sparkles, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, signOut } from './lib/firebase';
import AuthModal from './components/AuthModal';
import AnnouncementPopup from './components/AnnouncementPopup';
import NotificationCenter from './components/NotificationCenter';

// Lazy load pages
const Home = React.lazy(() => import('./pages/public/Home'));
const PropertyDetails = React.lazy(() => import('./pages/public/PropertyDetails'));
const Profile = React.lazy(() => import('./pages/portal/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Chat = React.lazy(() => import('./pages/portal/Chat'));
const About = React.lazy(() => import('./pages/public/About'));
const Contact = React.lazy(() => import('./pages/public/Contact'));
const Privacy = React.lazy(() => import('./pages/public/Privacy'));
const Terms = React.lazy(() => import('./pages/public/Terms'));
const ListProperty = React.lazy(() => import('./pages/public/ListProperty'));
const Properties = React.lazy(() => import('./pages/public/Properties'));
const Booking = React.lazy(() => import('./pages/portal/Booking'));
const AcceptInvite = React.lazy(() => import('./pages/portal/AcceptInvite'));
import Footer from './components/Footer';
import Logo from './components/Logo';

const USFlag = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5 rounded-full inline-block shadow-sm overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
    <rect width="100" height="100" fill="#ffffff" />
    <rect y="0" width="100" height="7.69" fill="#B22234" />
    <rect y="15.38" width="100" height="7.69" fill="#B22234" />
    <rect y="30.77" width="100" height="7.69" fill="#B22234" />
    <rect y="46.15" width="100" height="7.69" fill="#B22234" />
    <rect y="61.54" width="100" height="7.69" fill="#B22234" />
    <rect y="76.92" width="100" height="7.69" fill="#B22234" />
    <rect y="92.31" width="100" height="7.69" fill="#B22234" />
    <rect width="40" height="53.8" fill="#3C3B6E" />
    <g fill="#ffffff">
      <circle cx="8" cy="10" r="1.5" />
      <circle cx="20" cy="10" r="1.5" />
      <circle cx="32" cy="10" r="1.5" />
      <circle cx="14" cy="22" r="1.5" />
      <circle cx="26" cy="22" r="1.5" />
      <circle cx="8" cy="34" r="1.5" />
      <circle cx="20" cy="34" r="1.5" />
      <circle cx="32" cy="34" r="1.5" />
      <circle cx="14" cy="44" r="1.5" />
      <circle cx="26" cy="44" r="1.5" />
    </g>
  </svg>
);

const UAEFlag = () => (
  <svg viewBox="0 0 100 100" className="w-5 h-5 rounded-full inline-block shadow-sm overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
    <rect width="100" height="100" fill="#ffffff" />
    <rect width="25" height="100" fill="#FF0000" />
    <rect x="25" width="75" height="33.3" fill="#00732F" />
    <rect x="25" y="66.6" width="75" height="33.4" fill="#000000" />
  </svg>
);

function Navbar() {
  const { user, profile, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const { t, theme, resolvedTheme, setTheme, lang, setLang } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (user) {
      await signOut(auth);
      navigate('/');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <Link to="/properties" className="text-[13px] font-bold text-zinc-900 dark:text-white hover:text-brand transition-colors uppercase tracking-widest">{t('properties')}</Link>
            <Link to="/about" className="text-[13px] font-bold text-zinc-900 dark:text-white hover:text-brand transition-colors uppercase tracking-widest">{t('about')}</Link>
            <Link to="/contact" className="text-[13px] font-bold text-zinc-900 dark:text-white hover:text-brand transition-colors uppercase tracking-widest">{t('contact')}</Link>
          </div>

          {/* Global Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/list-your-property" className="hidden xl:flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-full text-[10px] font-black transition-all duration-300 uppercase tracking-widest mr-4 border border-brand/20 shadow-sm hover:shadow-brand/20">
              <Sparkles size={12} />
              {t('list_your_property')}
            </Link>
            <div className="flex items-center border-r border-zinc-200 dark:border-zinc-800 pr-4 mr-2 gap-2">
              <NotificationCenter />
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                {lang === 'en' ? <UAEFlag /> : <USFlag />}
              </button>
              <button onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                {resolvedTheme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/wishlist" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <Heart size={20} />
                </Link>
                <Link to="/chat" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <MessageSquare size={20} />
                </Link>
                <Link to="/profile" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <UserIcon size={20} />
                </Link>
                {((user?.email?.toLowerCase() === 'fakharalimirza@gmail.com') || ['host', 'super_admin', 'admin', 'agent', 'maintenance', 'landlord'].includes(profile?.role)) && (
                  <Link to="/admin" className="px-4 py-2 bg-brand text-white rounded-full text-sm font-medium transition-transform hover:scale-105 hover:bg-brand-hover uppercase tracking-widest text-[10px]">
                    {['landlord', 'maintenance'].includes(profile?.role) ? 'Portal' : t('admin_panel')}
                  </Link>
                )}
                <button onClick={handleAuth} className="text-sm font-medium text-red-500 hover:text-red-600">
                  {t('sign_out')}
                </button>
              </div>
            ) : (
              <button onClick={handleAuth} className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-full text-sm font-medium transition-transform hover:scale-105 hover:bg-brand-hover">
                <LogIn size={18} />
                {t('sign_in')}
              </button>
            )}
          </div>

          {/* Mobile & Tablet Header Controls */}
          <div className="flex lg:hidden items-center gap-2.5">
            {user && (
              <div className="mr-1">
                <NotificationCenter />
              </div>
            )}
            
            <button 
              className="p-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all active:scale-95" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile/Tablet Drawer - Off Canvas */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99998] lg:hidden"
            />

            {/* Slide-out Off-canvas Panel */}
            <motion.div
              initial={{ x: lang === 'ar' ? '-100%' : '105%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '-100%' : '105%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className={`fixed top-0 bottom-0 ${
                lang === 'ar' ? 'left-0' : 'right-0'
              } w-[340px] max-w-[85vw] bg-white dark:bg-zinc-950 border-r border-l border-zinc-100 dark:border-zinc-900 shadow-2xl z-[99999] flex flex-col h-full overflow-hidden lg:hidden`}
            >
              {/* Drawer Top Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50">
                <Logo />
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all border border-zinc-200 dark:border-zinc-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Contents Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 flex flex-col gap-6">
                
                {/* User Info Greeting Box */}
                {user && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand/10 text-brand rounded-full flex items-center justify-center font-black text-sm uppercase">
                        {(profile?.displayName || user?.displayName || user.email || 'U').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                          {profile?.displayName || user?.displayName || (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}` : 'Authenticated User')}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate font-mono">{user.email}</p>
                      </div>
                    </div>
                    {profile?.role && (
                      <div className="mt-2.5 flex items-center gap-1 self-start px-2 py-0.5 bg-brand text-white text-[9px] font-black tracking-widest uppercase rounded">
                        {profile.role.replace('_', ' ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Base Links */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1">
                    {lang === 'ar' ? 'استكشف' : 'Explore'}
                  </span>
                  
                  <Link 
                    to="/properties" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-white px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-brand dark:hover:text-brand rounded-xl transition-all"
                  >
                    <span>{t('properties')}</span>
                    <span className="text-xs text-zinc-400">&rarr;</span>
                  </Link>

                  <Link 
                    to="/about" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-white px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-brand dark:hover:text-brand rounded-xl transition-all"
                  >
                    <span>{t('about')}</span>
                    <span className="text-xs text-zinc-400">&rarr;</span>
                  </Link>

                  <Link 
                    to="/contact" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-white px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-brand dark:hover:text-brand rounded-xl transition-all"
                  >
                    <span>{t('contact')}</span>
                    <span className="text-xs text-zinc-400">&rarr;</span>
                  </Link>

                  <Link 
                    to="/list-your-property" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="mt-2 flex items-center gap-2 bg-brand/10 text-brand border border-brand/20 dark:bg-brand/20 dark:border-brand/10 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
                  >
                    <Sparkles size={14} className="animate-pulse" />
                    <span>{t('list_your_property')}</span>
                  </Link>
                </div>

                {/* Account Dashboard Links */}
                {user && (
                  <div className="flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1">
                      {lang === 'ar' ? 'الحساب' : 'Your Account'}
                    </span>
                    
                    <Link 
                      to="/wishlist" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      <Heart size={16} className="text-red-500 fill-red-500" />
                      <span>{t('wishlist')}</span>
                    </Link>

                    <Link 
                      to="/chat" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      <MessageSquare size={16} className="text-brand" />
                      <span>{t('chat')}</span>
                    </Link>

                    <Link 
                      to="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                    >
                      <UserIcon size={16} className="text-zinc-500 dark:text-zinc-400" />
                      <span>{t('my_bookings')}</span>
                    </Link>

                    {/* Admin Panel and Portal Access */}
                    {((user?.email?.toLowerCase() === 'fakharalimirza@gmail.com') || ['host', 'super_admin', 'admin', 'agent', 'maintenance', 'landlord'].includes(profile?.role)) && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-brand uppercase tracking-widest rounded-xl hover:bg-brand/10 bg-brand/5 dark:bg-brand/10 transition-all border border-brand/10 mt-1 pb-2.5"
                      >
                        <Sparkles size={14} />
                        <span>{['landlord', 'maintenance'].includes(profile?.role) ? 'Portal' : t('admin_panel')}</span>
                      </Link>
                    )}
                  </div>
                )}

                {/* Preference Switchers */}
                <div className="flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1">
                    {lang === 'ar' ? 'التفضيلات' : 'Preferences'}
                  </span>
                  <div className="grid grid-cols-2 gap-3 px-1">
                    <button 
                      onClick={() => {
                        setLang(lang === 'en' ? 'ar' : 'en');
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-2xl text-xs font-bold text-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-800 transition-all shadow-sm"
                    >
                      {lang === 'en' ? <UAEFlag /> : <USFlag />}
                      <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                    </button>
                    <button 
                      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')} 
                      className="flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-2xl text-xs font-bold text-zinc-700 dark:text-zinc-250 border border-zinc-100 dark:border-zinc-800 transition-all shadow-sm"
                    >
                      {resolvedTheme === 'light' ? <Moon size={15} className="text-zinc-500" /> : <Sun size={15} className="text-amber-500" />} 
                      <span>{resolvedTheme === 'light' ? t('dark_mode') : t('light_mode')}</span>
                    </button>
                  </div>
                </div>

                {/* Emergency Hotline Support */}
                <div className="flex flex-col gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 mb-1">
                    {lang === 'ar' ? 'تواصل معنا' : 'Support Hotline'}
                  </span>
                  <div className="flex flex-col gap-2.5 px-1">
                    <a 
                      href="tel:+97142866788" 
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                    >
                      <Phone size={14} />
                      <span>{t('call_us_today')}</span>
                    </a>
                    
                    <a 
                      href="https://wa.me/971569969332" 
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                      <span>WhatsApp Support</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Drawer Bottom Sign-out or Sign-in Action */}
              <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 mt-auto">
                {user ? (
                  <button 
                    onClick={() => {
                      handleAuth();
                      setIsMenuOpen(false);
                    }} 
                    className="flex items-center gap-3.5 w-full px-5 py-3.5 text-red-500 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all justify-center border border-red-200/20 shadow-sm"
                  >
                    <LogOut size={14} />
                    <span>{t('sign_out')}</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      handleAuth();
                      setIsMenuOpen(false);
                    }} 
                    className="flex items-center gap-3.5 w-full px-5 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all justify-center shadow-lg shadow-brand/10 hover:shadow-brand/20 active:scale-[0.98]"
                  >
                    <LogIn size={14} />
                    <span>{t('sign_in')}</span>
                  </button>
                )}
                <div className="mt-4 text-center">
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide uppercase">
                    &copy; 2026 Authentic Holiday Homes
                  </p>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full"
      />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AuthModalContainer() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      )}
    </AnimatePresence>
  );
}

function AppContent() {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();

  const hideFooter = pathname.startsWith('/admin') || pathname === '/admin';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      <Navbar />
      <AuthModalContainer />
      <AnnouncementPopup />
      <main className="pt-16">
        <React.Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/list-your-property" element={<ListProperty />} />
            <Route path="/wishlist" element={<Profile defaultTab="wishlist" />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
          </Routes>
        </React.Suspense>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function AppWrapper() {
  const { lang } = useSettings();

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <AuthProvider>
      <GlobalSettingsProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </GlobalSettingsProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppWrapper />
    </SettingsProvider>
  );
}
