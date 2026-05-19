import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MapPin, Users, Bed, Bath, Wifi, Coffee, Wind, Shield, ChevronLeft, Heart, Share2, Sparkles, Maximize, Calendar, Hash, Building2, Layout, Sofa, X, Check } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PropertyMap from '../components/Map';
import CurrencySymbol from '../components/CurrencySymbol';
import { Property } from '../types';

export default function PropertyDetails() {
  const { id } = useParams();
  const { t, lang } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const docRef = doc(db, 'properties', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Property;
          setProperty({ id: docSnap.id, ...data });
          setDescription(data.description || '');
        } 
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  const enhanceDescription = async () => {
    if (!property) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: property.title,
          amenities: property.amenities,
          location: property.location.address
        })
      });
      const data = await res.json();
      if (data.description) setDescription(data.description);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-zinc-400 font-bold uppercase tracking-widest">Checking available units...</div>;
  if (!property) return (
    <div className="p-20 text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400"><X size={32} /></div>
      <h2 className="text-2xl font-bold">Unit not found</h2>
      <button onClick={() => navigate('/properties')} className="px-6 py-3 bg-brand text-white rounded-full font-bold">Back to Search</button>
    </div>
  );

  const getPrimaryImage = (idx: number) => {
    const imgs = property.images;
    if (!imgs) return 'https://via.placeholder.com/1200x800?text=Authentic+Holiday+Home';
    return imgs.webp?.[idx] || imgs.png?.[idx] || imgs.avif?.[idx] || 'https://via.placeholder.com/1200x800?text=Authentic+Holiday+Home';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="py-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <ChevronLeft />
        </button>
        <div className="flex gap-4">
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all hover:scale-110 active:scale-95"><Share2 size={20} /></button>
          <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all hover:scale-110 active:scale-95"><Heart size={20} /></button>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[60vh] mb-8">
        <div className="lg:col-span-3 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <picture>
            {property.images?.avif?.[activeImage] && <source srcSet={property.images.avif[activeImage]} type="image/avif" />}
            {property.images?.webp?.[activeImage] && <source srcSet={property.images.webp[activeImage]} type="image/webp" />}
            <img 
              src={getPrimaryImage(activeImage)} 
              alt={property.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </picture>
        </div>
        <div className="hidden lg:flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1">
          {(property.images?.webp || property.images?.png || []).map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveImage(idx)}
              className={`relative rounded-3xl overflow-hidden aspect-video flex-shrink-0 border-4 transition-all ${activeImage === idx ? 'border-brand shadow-xl' : 'border-transparent opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
            >
              <img src={getPrimaryImage(idx)} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="px-4 py-1 bg-brand text-white rounded-full text-[10px] font-black uppercase tracking-widest">{property.category}</span>
                <span className="px-4 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest">{property.purpose}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[1.1]">
                {property.title}
              </h1>
              <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5"><MapPin size={18} className="text-brand" /> {property.location.address}</div>
                <div className="flex items-center gap-1.5"><Star size={18} className="fill-yellow-400 text-yellow-400 border-none" /> {property.rating || '5.0'} ({property.reviewCount || 0} reviews)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 py-8 border-y border-zinc-100 dark:border-zinc-800 mb-8 mt-12 bg-white/50 dark:bg-zinc-900/50 rounded-[2rem] px-8">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 group relative">
                  <Bed size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-black tracking-tight">{property.bedrooms || 0}</span>
                 <span className="text-[10px] uppercase font-bold text-zinc-400">{lang === 'ar' ? 'غرف نوم' : 'Bedrooms'}</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400">
                  <Bath size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-black tracking-tight">{property.bathrooms || 0}</span>
                 <span className="text-[10px] uppercase font-bold text-zinc-400">{lang === 'ar' ? 'حمامات' : 'Bathrooms'}</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400">
                 <Maximize size={24} />
               </div>
               <div className="flex flex-col">
                 <span className="text-sm font-black tracking-tight">{property.size || 0} sqft</span>
                 <span className="text-[10px] uppercase font-bold text-zinc-400">{lang === 'ar' ? 'المساحة' : 'Total Area'}</span>
               </div>
             </div>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">Property Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Type</p>
                <p className="font-bold flex items-center gap-2"><Layout size={14} className="text-zinc-300" /> {property.category}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Purpose</p>
                <p className="font-bold flex items-center gap-2"><Calendar size={14} className="text-zinc-300" /> {property.purpose}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Furnishing</p>
                <p className="font-bold flex items-center gap-2"><Sofa size={14} className="text-zinc-300" /> {property.furnishing}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Reference No.</p>
                <p className="font-bold flex items-center gap-2"><Hash size={14} className="text-zinc-300" /> {property.referenceNo}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Building</p>
                <p className="font-bold flex items-center gap-2"><Building2 size={14} className="text-zinc-300" /> {property.buildingName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Unit</p>
                <p className="font-bold">{property.unitNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Added on</p>
                <p className="font-bold">{property.createdAt?.toDate ? property.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '9 May 2026'}</p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{t('description')}</h2>
                <button 
                onClick={enhanceDescription}
                disabled={isEnhancing}
                className="flex items-center gap-2 text-[10px] text-brand hover:text-brand-hover font-black uppercase tracking-widest"
              >
                <motion.div animate={isEnhancing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Sparkles size={14} />
                </motion.div>
                {isEnhancing ? "Enhancing..." : "Enhance with AI"}
              </button>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg font-medium opacity-90">
              {description}
            </p>
          </div>

          <div className="mb-16">
             <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">Features / Amenities</h2>
             <div className="space-y-10">
                {Object.entries(property.amenities || {}).map(([category, items]) => (
                  (items as string[]).length > 0 && (
                    <div key={category} className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">{category.replace(/([A-Z])/g, ' $1')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(items as string[]).map((item: string) => (
                          <div key={item} className="flex items-center gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl group hover:bg-white dark:hover:bg-zinc-900 shadow-sm transition-all border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                             <div className="p-2.5 bg-white dark:bg-zinc-950 rounded-xl shadow-sm text-brand group-hover:scale-110 transition-transform"><Check size={16} strokeWidth={3} /></div>
                             <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-tight">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
             </div>
          </div>

          <div className="mb-12">
             <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">{t('location')}</h2>
             <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
               <PropertyMap center={property.location} />
             </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="hidden lg:block relative">
          <div className="sticky top-24 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 bg-white dark:bg-zinc-950 shadow-2xl ring-1 ring-zinc-900/5">
             <div className="flex justify-between items-baseline mb-10">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Starting from</span>
                 <div className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                   <CurrencySymbol size="0.8em" className="text-brand" />
                   {property.price}
                   <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">{property.purpose === 'For Rent' ? t('monthly') : ''}</span>
                 </div>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-full"><Star size={14} className="fill-yellow-400 text-yellow-400 border-none" /> <span className="text-xs font-black">{property.rating || '5.0'}</span></div>
             </div>
             
             <div className="space-y-4 mb-10">
                <div className="grid grid-cols-2 gap-0 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-inner">
                   <div className="p-5 border-r-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1 block">Arrival</label>
                      <input type="date" className="block w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer" />
                   </div>
                   <div className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1 block">Departure</label>
                      <input type="date" className="block w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer" />
                   </div>
                </div>
                <div className="p-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-inner hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                   <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-1 block">Occupants</label>
                   <select className="block w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 cursor-pointer uppercase tracking-tight">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {lang === 'ar' ? 'ضيوف' : (n>1?'People':'Person')}</option>)}
                   </select>
                </div>
             </div>

             <button 
              onClick={() => navigate(`/booking/${property.id}`)}
              className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-black dark:hover:bg-zinc-100 ring-4 ring-zinc-900/10"
             >
               {property.purpose === 'For Rent' ? t('book_now') : 'Inquire Now'}
             </button>

             <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-6">Instant confirmation for selected units</p>

             <div className="mt-10 space-y-4 pt-10 border-t-2 border-dashed border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                   <span>Unit Reference</span>
                   <span>{property.referenceNo}</span>
                </div>
                <div className="flex justify-between text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                   <span>Manager</span>
                   <span>AHH Support</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
