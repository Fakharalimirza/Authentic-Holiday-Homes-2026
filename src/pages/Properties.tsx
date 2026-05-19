import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, X, Star, LayoutGrid, List, Navigation } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import PropertyCard from '../components/PropertyCard';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Property } from '../types';

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Penthouse with Burj Khalifa View',
    location: { address: 'Downtown Dubai, UAE', lat: 25.1972, lng: 55.2744 },
    price: 2500,
    images: {
       webp: ['https://images.unsplash.com/photo-1549944850-84e00be4203b?q=80&w=1200&auto=format&fit=crop'],
       png: [],
       avif: []
    },
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
    bedrooms: 3,
    maxGuests: 6,
    category: 'Penthouse',
    purpose: 'For Rent',
    referenceNo: 'AHH-MOCK1'
  }
];

export default function Properties() {
  const { t, lang } = useSettings();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minBedrooms, setMinBedrooms] = useState(0);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const q = query(collection(db, 'properties'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        const finalData = data.length > 0 ? data : MOCK_PROPERTIES;
        setProperties(finalData);
        setFilteredProperties(finalData);
      } catch (error) {
        console.error("Fetch error:", error);
        setProperties(MOCK_PROPERTIES);
        setFilteredProperties(MOCK_PROPERTIES);
      } finally {
        setLoading(false);
      }
    }
    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.buildingName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = (p.price || 0) >= priceRange[0] && (p.price || 0) <= priceRange[1];
      const matchesBeds = (p.bedrooms || 0) >= minBedrooms;
      return matchesSearch && matchesPrice && matchesBeds;
    });
    setFilteredProperties(filtered);
  }, [searchQuery, priceRange, minBedrooms, properties]);

  const getPrimaryImage = (p: Property) => {
    const imgs = p.images;
    if (!imgs) return 'https://via.placeholder.com/800x600?text=Listing';
    return imgs.webp?.[0] || imgs.png?.[0] || imgs.avif?.[0] || 'https://via.placeholder.com/800x600?text=Listing';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-8 pb-32">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">
              Explore <span className="text-brand italic font-medium tracking-normal">Collection</span>
            </h1>
            <p className="text-zinc-500 mt-4 font-bold uppercase tracking-widest text-[10px]">
              {filteredProperties.length} Properties matched in Dubai
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-200'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-200'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sticky top-20 z-40 bg-zinc-900/10 dark:bg-zinc-100/10 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/20 shadow-2xl mb-12 flex flex-col md:flex-row items-center gap-2">
          <div className="flex-1 flex items-center gap-4 px-8 py-4 w-full">
            <Search className="text-brand" size={24} />
            <input 
              type="text" 
              placeholder="Building, Landmark or Area..."
              className="bg-transparent border-none focus:outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 w-full font-black text-lg tracking-tight uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-8 ml-2 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all ${showFilters ? 'bg-brand text-white shadow-xl' : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-900/5'}`}
          >
            <SlidersHorizontal size={18} />
            {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.95 }}
              animate={{ height: 'auto', opacity: 1, scale: 1 }}
              exit={{ height: 0, opacity: 0, scale: 0.95 }}
              className="overflow-hidden mb-12 origin-top"
            >
              <div className="p-10 bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Price Range (AED)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                       <input 
                        type="number" 
                        placeholder="Min"
                        value={priceRange[0]} 
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-brand transition-all"
                       />
                    </div>
                    <div className="flex-1 space-y-2">
                       <input 
                        type="number" 
                        placeholder="Max"
                        value={priceRange[1]} 
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-brand transition-all"
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rooms</h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3, 4].map(num => (
                      <button 
                        key={num}
                        onClick={() => setMinBedrooms(num)}
                        className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-sm transition-all ${minBedrooms === num ? 'bg-brand border-brand text-white shadow-lg' : 'bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-brand/30'}`}
                      >
                        {num === 0 ? 'ALL' : `${num}+`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Villa', 'Penthouse', 'Apartment'].map(cat => (
                      <button 
                        key={cat}
                        className="px-6 py-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-brand hover:border-brand transition-all"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-900 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {filteredProperties.map(property => (
              <motion.div 
                layout 
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={viewMode === 'list' ? 'flex flex-col md:flex-row gap-8 bg-white dark:bg-zinc-900 p-6 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-shadow' : ''}
              >
                {viewMode === 'list' ? (
                  <>
                    <Link to={`/property/${property.id}`} className="w-full md:w-[28rem] aspect-[16/10] rounded-[2rem] overflow-hidden relative group">
                        <picture>
                          {property.images?.avif?.[0] && <source srcSet={property.images.avif[0]} type="image/avif" />}
                          {property.images?.webp?.[0] && <source srcSet={property.images.webp[0]} type="image/webp" />}
                          <img 
                            src={getPrimaryImage(property)} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                        </picture>
                        <div className="absolute top-5 left-5 px-4 py-1.5 bg-zinc-900/60 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                          {property.category}
                        </div>
                    </Link>
                    <div className="flex-1 flex flex-col justify-between py-2">
                       <div className="space-y-4">
                          <Link to={`/property/${property.id}`}><h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight hover:text-brand transition-colors">{property.title}</h3></Link>
                          <div className="flex items-center gap-2 text-zinc-400 font-bold">
                            <MapPin size={18} className="text-brand" />
                            <span className="text-sm">{property.location.address}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {Object.values(property.amenities || {}).flat().slice(0, 6).map((a: any) => (
                               <span key={a} className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-[9px] font-black text-zinc-400 border border-zinc-100 dark:border-zinc-800 uppercase tracking-widest">{a}</span>
                            ))}
                          </div>
                       </div>
                       <div className="flex items-end justify-between mt-8 pt-8 border-t border-zinc-50 dark:border-zinc-950">
                          <div>
                             <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-1">Starting from</p>
                             <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-baseline gap-1.5">
                               {property.price} <span className="text-xs text-zinc-400 tracking-normal uppercase">AED / {property.purpose === 'For Rent' ? 'Mo' : 'Total'}</span>
                             </p>
                          </div>
                          <Link to={`/property/${property.id}`} className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">Details</Link>
                       </div>
                    </div>
                  </>
                ) : (
                  <PropertyCard property={property} />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 space-y-8 bg-white dark:bg-zinc-900/50 rounded-[4rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800">
            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto ring-8 ring-zinc-50/50 dark:ring-zinc-950/50">
               <Navigation size={40} className="text-zinc-300" />
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-widest">No Matches Found</h3>
              <p className="text-zinc-500 font-medium text-sm leading-relaxed">We couldn't find any properties matching your current filters. Try resetting to see all listings.</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setPriceRange([0, 100000]); setMinBedrooms(0); }}
              className="px-12 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
