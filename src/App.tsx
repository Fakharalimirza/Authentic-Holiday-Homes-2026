import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { LogIn, LogOut, Heart, User as UserIcon, MessageSquare, Menu, X, Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from './lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Lazy load pages
const Home = React.lazy(() => import('./pages/Home'));
const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Chat = React.lazy(() => import('./pages/Chat'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const ListProperty = React.lazy(() => import('./pages/ListProperty'));
const Properties = React.lazy(() => import('./pages/Properties'));
import Footer from './components/Footer';
import Logo from './components/Logo';

function Navbar() {
  const { user, profile } = useAuth();
  const { t, theme, setTheme, lang, setLang } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleAuth = async () => {
    if (user) {
      await signOut(auth);
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-bottom border-zinc-200 dark:border-zinc-800">
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

        {/* Global Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/list-your-property" className="hidden xl:flex items-center gap-2 px-4 py-2 bg-brand/10 hover:bg-brand text-brand hover:text-white rounded-full text-[10px] font-black transition-all duration-300 uppercase tracking-widest mr-4 border border-brand/20 shadow-sm hover:shadow-brand/20">
            <Sparkles size={12} />
            {t('list_your_property')}
          </Link>
          <div className="flex items-center border-r border-zinc-200 dark:border-zinc-800 pr-4 mr-2 gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-lg">
              {lang === 'en' ? '🇦🇪' : '🇺🇸'}
            </button>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
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
              {profile?.role === 'host' && (
                <Link to="/admin" className="px-4 py-2 bg-brand text-white rounded-full text-sm font-medium transition-transform hover:scale-105 hover:bg-brand-hover">
                  {t('admin_panel')}
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

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-zinc-950 border-bottom border-zinc-200 dark:border-zinc-800 p-6"
          >
            <div className="flex flex-col gap-6">
              <Link to="/properties" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">{t('properties')}</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">{t('about')}</Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">{t('contact')}</Link>
              <Link to="/list-your-property" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold text-brand uppercase tracking-widest">{t('list_your_property')}</Link>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-sm font-bold text-zinc-900 dark:text-white border border-zinc-100 dark:border-zinc-800">
                  <span className="text-xl">{lang === 'en' ? '🇦🇪' : '🇺🇸'}</span> {t(lang === 'en' ? 'arabic' : 'english')}
                </button>
                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="flex items-center justify-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />} {t(theme === 'light' ? 'dark_mode' : 'light_mode')}
                </button>
              </div>

              <a href="tel:+97142866788" className="flex items-center justify-center gap-3 p-4 bg-brand text-white rounded-2xl font-bold shadow-lg">
                {t('call_us_today')}
              </a>
              {user && (
                <>
                  <Link to="/wishlist" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">{t('wishlist')}</Link>
                  <Link to="/chat" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">{t('chat')}</Link>
                  <Link to="/profile" className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">{t('my_bookings')}</Link>
                </>
              )}
              <button onClick={handleAuth} className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                {user ? t('sign_out') : t('sign_in')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
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

function AppWrapper() {
  const { lang } = useSettings();

  React.useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
          <Navbar />
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
              </Routes>
            </React.Suspense>
          </main>
          <Footer />
        </div>
      </Router>
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
