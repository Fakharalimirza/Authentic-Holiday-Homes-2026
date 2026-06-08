import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, X, Star, LayoutGrid, List, Navigation, Crosshair, ArrowUpDown, Check, Plus } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import PropertyCard from '../../components/PropertyCard';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Property } from '../../types';
import { useUserLocation } from '../../hooks/useUserLocation';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

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
  const { settings } = useGlobalSettings();
  const availableCategories = settings?.availableCategories || ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Holiday Home'];

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Location Hub Setup
  const { location, requestGPSLocation } = useUserLocation();
  const [sortByProximity, setSortByProximity] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Filters State
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const POPULAR_AMENITIES = [
    'Swimming Pool',
    'Gym or Health Club',
    'Centrally Air-Conditioned',
    'Balcony or Terrace',
    'Broadband Internet',
    'Security Staff',
    'CCTV Security',
    'Pets Allowed'
  ];

  useEffect(() => {
    async function fetchProperties() {
      try {
        const response = await fetch('/api/db/properties');
        if (!response.ok) {
          throw new Error('Network response status error ' + response.status);
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.properties)) {
          const data = result.properties;
          const finalData = data.length > 0 ? data : MOCK_PROPERTIES;
          setProperties(finalData);
          setFilteredProperties(finalData);
        } else {
          setProperties(MOCK_PROPERTIES);
          setFilteredProperties(MOCK_PROPERTIES);
        }
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
    let filtered = properties.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           p.buildingName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = (p.price || 0) >= priceRange[0] && (p.price || 0) <= priceRange[1];
      const matchesBeds = (p.bedrooms || 0) >= minBedrooms;
      const matchesCategory = !selectedCategory || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      
      const matchesAmenities = selectedAmenities.every(amenity => {
        if (!p.amenities) return false;
        return Object.values(p.amenities).some(arr => Array.isArray(arr) && arr.includes(amenity));
      });

      return matchesSearch && matchesPrice && matchesBeds && matchesCategory && matchesAmenities;
    });

    if (sortByProximity && location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      filtered = [...filtered].sort((a, b) => {
        const distA = calculateDistance(location.lat!, location.lng!, a.location.lat, a.location.lng);
        const distB = calculateDistance(location.lat!, location.lng!, b.location.lat, b.location.lng);
        return distA - distB;
      });
    }

    setFilteredProperties(filtered);
  }, [searchQuery, priceRange, minBedrooms, selectedCategory, selectedAmenities, properties, sortByProximity, location]);

  const handleGpsActivation = async () => {
    setGpsLoading(true);
    setGpsError('');
    try {
      await requestGPSLocation();
      setSortByProximity(true);
    } catch (err: any) {
      setGpsError(err || 'Failed to acquire fine location.');
    } finally {
      setGpsLoading(false);
    }
  };

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
              <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 md:gap-6">
                  {/* Categories Dropdown */}
                  <div className="flex flex-col gap-1.5 w-full md:w-auto md:min-w-[180px]">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Categories</h4>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rooms Dropdown */}
                  <div className="flex flex-col gap-1.5 w-full md:w-auto md:min-w-[140px]">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Rooms</h4>
                    <select
                      value={minBedrooms}
                      onChange={(e) => setMinBedrooms(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 outline-none focus:border-brand cursor-pointer"
                    >
                      <option value={0}>Any Bedrooms</option>
                      <option value={1}>1+ Bedroom</option>
                      <option value={2}>2+ Bedrooms</option>
                      <option value={3}>3+ Bedrooms</option>
                      <option value={4}>4+ Bedrooms</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="flex flex-col gap-1.5 flex-1 w-full">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Price Range (AED)</h4>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        placeholder="Min"
                        value={priceRange[0] || ''} 
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-brand text-zinc-750 dark:text-white"
                      />
                      <span className="text-zinc-400 text-xs font-bold shrink-0">—</span>
                      <input 
                        type="number" 
                        placeholder="Max"
                        value={priceRange[1] || ''} 
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:border-brand text-zinc-750 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Amenities Section */}
                <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Filter by Amenities</h4>
                    {selectedAmenities.length > 0 && (
                      <button 
                        onClick={() => setSelectedAmenities([])}
                        className="text-[9px] font-black uppercase text-brand hover:underline transition-all cursor-pointer"
                      >
                        Reset Amenities
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_AMENITIES.map(amenity => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => {
                            setSelectedAmenities(prev => 
                              prev.includes(amenity)
                                ? prev.filter(a => a !== amenity)
                                : [...prev, amenity]
                            );
                          }}
                          className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-tight border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected 
                              ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow'
                              : 'bg-zinc-55 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                        >
                          {isSelected ? <Check size={10} strokeWidth={4} /> : <Plus size={10} className="text-zinc-400" />}
                          <span>{amenity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800/40">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setPriceRange([0, 100000]);
                      setMinBedrooms(0);
                      setSelectedCategory(null);
                      setSelectedAmenities([]);
                    }}
                    className="px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 hover:border-zinc-300 rounded-2xl text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-all cursor-pointer flex items-center gap-1.5 animate-fade-in"
                  >
                    <X size={10} />
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Geolocation Status Hub - Ultra-compact, elegant and scannable */}
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              location?.source === 'gps' 
                ? 'bg-brand/10 text-brand' 
                : 'bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500'
            }`}>
              <MapPin size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-zinc-900 dark:text-white capitalize">
                  {location?.city || 'Dubai'}, {location?.country || 'United Arab Emirates'}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.25 rounded text-[8px] font-black uppercase ${
                  location?.source === 'gps'
                    ? 'bg-brand text-white animate-pulse'
                    : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-650 dark:text-zinc-350'
                }`}>
                  {location?.source === 'gps' ? 'GPS' : 'IP'}
                </span>
                {location?.isProxyOrVpn && (
                  <span className="inline-flex items-center px-1.5 py-0.25 rounded text-[8px] font-black uppercase bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/30" title="VPN detected: coordinates match fallback or server origin.">
                    Proxy/VPN
                  </span>
                )}
              </div>
              {gpsError ? (
                <p className="text-[9px] font-bold text-red-500 mt-0.5 uppercase tracking-wider">{gpsError}</p>
              ) : (
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                  {location?.isProxyOrVpn 
                    ? "VPN detected. Use GPS for accurate local recommendation distances." 
                    : "Nearest properties are calculated with dynamic physical network coordinates."}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
            {location?.lat !== undefined && location?.lng !== undefined && (
              <button
                onClick={() => setSortByProximity(!sortByProximity)}
                className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                  sortByProximity 
                    ? 'bg-brand border-brand text-white shadow-sm' 
                    : 'bg-white dark:bg-zinc-800 text-zinc-750 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                }`}
              >
                <ArrowUpDown size={12} />
                {sortByProximity ? "Sorted" : "Sort By Distance"}
              </button>
            )}

            <button
              onClick={handleGpsActivation}
              disabled={gpsLoading}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Crosshair size={12} className={gpsLoading ? 'animate-spin' : ''} />
              {gpsLoading ? 'Tracking...' : 'Use Precise GPS'}
            </button>
          </div>
        </div>

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
                          <div className="flex items-center gap-2 text-zinc-400 font-bold justify-between">
                            <div className="flex items-center gap-2 truncate max-w-[75%]">
                              <MapPin size={18} className="text-brand flex-shrink-0" />
                              <span className="text-sm truncate">{property.location.address}</span>
                            </div>
                            {location?.lat !== undefined && location?.lng !== undefined && (
                              <span className="text-[10px] font-black text-brand uppercase tracking-wider bg-brand/10 dark:bg-brand/20 px-3 py-1 rounded-xl flex-shrink-0">
                                {calculateDistance(location.lat, location.lng, property.location.lat, property.location.lng).toFixed(1)} km away
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2">
                            {Object.values(property.amenities || {}).flat().slice(0, 6).map((a: any) => (
                               <span key={a} className="px-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-[9px] font-black text-zinc-400 border border-zinc-100 dark:border-zinc-800 uppercase tracking-widest">{a}</span>
                            ))}
                          </div>
                       </div>
                       <div className="flex items-end justify-between mt-8 pt-8 border-t border-zinc-50 dark:border-zinc-950">
                          <div className="flex flex-wrap items-baseline gap-6">
                             <div>
                                <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-1">Nightly Rate</p>
                                <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-baseline gap-1">
                                  {property.price} <span className="text-xs text-zinc-400 tracking-normal uppercase font-bold">AED</span>
                                </p>
                             </div>
                             {property.priceMonthly ? (
                               <div className="border-l border-zinc-200 dark:border-zinc-800 pl-6">
                                  <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mb-1">Monthly Rate</p>
                                  <p className="text-3xl font-black text-zinc-600 dark:text-zinc-300 tracking-tighter flex items-baseline gap-1">
                                    {property.priceMonthly} <span className="text-xs text-zinc-400 tracking-normal uppercase font-bold">AED</span>
                                  </p>
                               </div>
                             ) : null}
                          </div>
                          <Link to={`/property/${property.id}`} className="px-10 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">Details</Link>
                       </div>
                    </div>
                  </>
                ) : (
                  <PropertyCard property={property} userLat={location?.lat} userLng={location?.lng} />
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
