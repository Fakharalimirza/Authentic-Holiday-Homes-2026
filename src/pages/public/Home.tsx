import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../contexts/SettingsContext';
import PropertyCard from '../../components/PropertyCard';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Property } from '../../types';
import PropertiesMap from '../../components/PropertiesMap';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1549944850-84e00be4203b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1546412414-e1885261bb9b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800"
];

const ImageColumn = ({ images, speed, reverse = false }: { images: string[], speed: number, reverse?: boolean }) => (
  <motion.div 
    className="flex flex-col gap-4 w-full"
    animate={{ 
      y: reverse ? [0, -1000] : [-1000, 0]
    }}
    transition={{ 
      duration: speed, 
      repeat: Infinity, 
      ease: "linear" 
    }}
  >
    {[...images, ...images, ...images].map((src, i) => (
      <div key={i} className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl">
        <img src={src} alt="Lifestyle" className="w-full h-full object-cover grayscale opacity-100 hover:grayscale-0 hover:opacity-100 transition-all duration-700" referrerPolicy="no-referrer" />
      </div>
    ))}
  </motion.div>
);

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Penthouse with Burj Khalifa View',
    location: { address: 'Downtown Dubai, UAE', lat: 25.1972, lng: 55.2744 },
    price: 2500,
    images: { webp: ['https://images.unsplash.com/photo-1549944850-84e00be4203b?q=80&w=1200&auto=format&fit=crop'], png: [], avif: [] },
    rating: 4.9,
    reviewCount: 320,
    amenities: {
       features: ['Burj View', 'Infinity Pool'],
       building: [],
       healthFitness: [],
       recreationFamily: [],
       cleaningMaintenance: [],
       businessSecurity: [],
       technology: [],
       miscellaneous: []
    },
    category: 'Penthouse',
    purpose: 'For Rent',
    referenceNo: 'AHH-H-1'
  }
];

export default function Home() {
  const { t, lang } = useSettings();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const words = lang === 'ar' 
    ? ["الاستثنائي", "الفخم", "الأصيل", "الحصري"]
    : ["the Extraordinary", "the Luxurious", "the Authentic", "the Exclusive"];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [lang]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch('/api/db/properties');
        if (!response.ok) {
          throw new Error('Network response status error ' + response.status);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.properties)) {
          const data = result.properties.slice(0, 8);
          setProperties(data.length > 0 ? data : MOCK_PROPERTIES);
        } else {
          setProperties(MOCK_PROPERTIES);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setProperties(MOCK_PROPERTIES); // Fallback to mock
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] md:h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
        {/* Background Animation */}
        <div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 opacity-30 md:opacity-50">
          <ImageColumn images={HERO_IMAGES.slice(0, 4)} speed={40} />
          <ImageColumn images={HERO_IMAGES.slice(4, 8)} speed={50} reverse />
          <div className="hidden md:block">
            <ImageColumn images={HERO_IMAGES.slice(2, 6)} speed={45} />
          </div>
          <div className="hidden md:block">
            <ImageColumn images={HERO_IMAGES.slice(1, 5)} speed={55} reverse />
          </div>
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-zinc-950 via-zinc-950/20 to-zinc-950" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950 opacity-60" />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-widest mb-8 border border-brand/20 backdrop-blur-md"
            >
              <Sparkles size={14} />
              {t('emirati_hospitality')}
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-white mb-8 uppercase leading-[0.9]">
              {lang === 'ar' ? 'اكتشف' : 'Discover'} <br />
              <div className="h-[1.2em] relative overflow-hidden w-full">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={textIndex}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="absolute inset-0 text-brand italic whitespace-nowrap"
                  >
                    {words[textIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-white/60 font-medium mb-12 max-w-2xl leading-relaxed"
            >
              {t('hero_subtitle')}
            </motion.p>

            {/* Search Bar - Refined */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-3xl border border-white/10 p-2 rounded-[2rem] md:rounded-full flex flex-col md:flex-row items-center gap-2 shadow-2xl"
            >
              <div className="flex-1 flex items-center gap-3 px-6 py-4 w-full md:border-r border-white/10">
                <MapPin className="text-brand" size={20} />
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')}
                  className="bg-transparent border-none focus:outline-none text-white placeholder:text-white/30 w-full font-medium"
                />
              </div>
              
              <div className="hidden lg:flex flex-1 items-center gap-3 px-6 py-4 border-r border-white/10">
                <Calendar className="text-white/40" size={20} />
                <span className="text-white/30 font-medium">{t('availability')}</span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto p-1">
                <Link to="/properties" className="bg-brand text-white rounded-full px-10 py-4 font-bold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all w-full md:w-auto shadow-xl shadow-brand/20">
                  <Search size={22} className="stroke-[3]" />
                  {t('search_btn')}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Property Feed */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-sm uppercase tracking-[0.2em] font-semibold text-zinc-500 mb-2">{t('featured_collection')}</h2>
            <h3 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white uppercase">{t('curated_homes')}</h3>
          </div>
          <Link to="/properties" className="hidden md:flex items-center gap-2 text-zinc-900 dark:text-white font-medium group underline underline-offset-8 decoration-zinc-200 dark:decoration-zinc-800 hover:decoration-zinc-900 dark:hover:decoration-white transition-all uppercase tracking-widest text-xs">
            {t('explore_all')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Map Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 mt-24">
        <div className="mb-12">
          <h2 className="text-sm uppercase tracking-[0.2em] font-black text-zinc-400 dark:text-zinc-500 mb-2">
            {lang === 'ar' ? 'مواقع مميزة' : 'Prime Locations'}
          </h2>
          <h3 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
            {lang === 'ar' ? 'اكتشف على الخريطة' : 'Explore Homes on Map'}
          </h3>
        </div>
        
        <PropertiesMap properties={properties} height="520px" />
      </section>
    </div>
  );
}
