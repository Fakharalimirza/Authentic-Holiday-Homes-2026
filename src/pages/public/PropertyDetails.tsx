import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, MapPin, Users, Bed, Bath, Wifi, Coffee, Wind, Shield, ChevronLeft, 
  Heart, Share2, Sparkles, Maximize, Calendar, Hash, Building2, Layout, Sofa, 
  X, Check, Zap, Car, ArrowUpDown, Dumbbell, Flame, Trash2, Wrench, Briefcase, 
  Eye, Tv, Clock, Dog, Key, Trees, DoorOpen, Waves, Smile, Home, Info,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, 
  addDoc, getDocs, query, orderBy, serverTimestamp, runTransaction,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import PropertyMap from '../../components/Map';
import CurrencySymbol from '../../components/CurrencySymbol';
import ImageCarousel from '../../components/ImageCarousel';
import CalendarPopover from '../../components/CalendarPopover';
import { Property } from '../../types';
import { FormattedText } from '../../components/RichTextEditor';

function getAmenityIcon(item: string) {
  const norm = item.toLowerCase();
  
  if (norm.includes('furnish')) return <Sofa size={12} className="text-amber-600 dark:text-amber-400" />;
  if (norm.includes('electricity') || norm.includes('backup') || norm.includes('power')) return <Zap size={12} className="text-yellow-500" />;
  if (norm.includes('parking') || norm.includes('garage') || norm.includes('car')) return <Car size={12} className="text-blue-500" />;
  if (norm.includes('air-condition') || norm.includes('ac ') || norm.includes('cooling')) return <Wind size={12} className="text-sky-400" />;
  
  if (norm.includes('balcony') || norm.includes('terrace') || norm.includes('outdoor')) return <Home size={12} className="text-emerald-500" />;
  if (norm.includes('lobby')) return <DoorOpen size={12} className="text-amber-700 dark:text-amber-500" />;
  if (norm.includes('elevator') || norm.includes('lift')) return <ArrowUpDown size={12} className="text-purple-500" />;
  if (norm.includes('reception') || norm.includes('waiting')) return <Clock size={12} className="text-teal-500" />;
  
  if (norm.includes('gym') || norm.includes('health') || norm.includes('fitness')) return <Dumbbell size={12} className="text-red-500" />;
  if (norm.includes('pool') || norm.includes('swim')) return <Waves size={12} className="text-cyan-500" />;
  
  if (norm.includes('kids') || norm.includes('play') || norm.includes('children')) return <Smile size={12} className="text-indigo-500" />;
  if (norm.includes('lawn') || norm.includes('garden') || norm.includes('greenwork')) return <Trees size={12} className="text-green-500" />;
  if (norm.includes('barbeque') || norm.includes('bbq') || norm.includes('grill')) return <Flame size={12} className="text-amber-600" />;
  
  if (norm.includes('waste') || norm.includes('disposal') || norm.includes('rubbish')) return <Trash2 size={12} className="text-zinc-400 dark:text-zinc-500" />;
  if (norm.includes('maintenance') || norm.includes('staff')) return <Wrench size={12} className="text-amber-600 dark:text-amber-400" />;
  
  if (norm.includes('business') || norm.includes('office')) return <Briefcase size={12} className="text-slate-500" />;
  if (norm.includes('security') || norm.includes('guard')) return <Shield size={12} className="text-blue-600 dark:text-blue-400" />;
  if (norm.includes('cctv') || norm.includes('camera')) return <Eye size={12} className="text-rose-500" />;
  
  if (norm.includes('internet') || norm.includes('wifi') || norm.includes('broadband')) return <Wifi size={12} className="text-sky-500" />;
  if (norm.includes('satellite') || norm.includes('cable') || norm.includes('tv')) return <Tv size={12} className="text-indigo-400" />;
  
  if (norm.includes('concierge') || norm.includes('24 hour')) return <Clock size={12} className="text-amber-600" />;
  if (norm.includes('pet')) return <Dog size={12} className="text-amber-500" />;
  if (norm.includes('freehold')) return <Key size={12} className="text-emerald-600" />;
  
  return <Check size={12} className="text-emerald-500" />;
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { t, lang } = useSettings();
  const formatDate = (dateStr: string) => {
    if (!dateStr) return lang === 'ar' ? 'اختر التاريخ' : 'Select Date';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [description, setDescription] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [amenitySearchQuery, setAmenitySearchQuery] = useState('');

  // Review states
  const [reviews, setReviews] = useState<any[]>([]);
  const [fetchingReviews, setFetchingReviews] = useState(true);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Booking date states
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    async function fetchProperty() {
      if (!id) return;
      try {
        const response = await fetch(`/api/db/properties/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch property details');
        }
        const result = await response.json();
        if (result.success && result.property) {
          setProperty(result.property);
          setDescription(result.property.description || '');
        } 
      } catch (error) {
        console.error("Error loading property in details page:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  useEffect(() => {
    async function fetchReviews() {
      if (!id) return;
      setFetchingReviews(true);
      try {
        const response = await fetch(`/api/db/properties/${id}/reviews`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.reviews)) {
          setReviews(result.reviews);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setFetchingReviews(false);
      }
    }
    fetchReviews();
  }, [id]);

  // Load and sync wishlist favorites from localStorage
  useEffect(() => {
    if (!id) return;
    const syncFavorites = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('ahh_favorites') || '[]');
        setIsFavorite(favs.includes(id));
      } catch (err) {
        console.error(err);
      }
    };
    syncFavorites();
    window.addEventListener('storage', syncFavorites);
    return () => window.removeEventListener('storage', syncFavorites);
  }, [id]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isAmenitiesModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAmenitiesModalOpen]);

  const toggleFavorite = async () => {
    if (!id || !property) return;
    try {
      const favs = JSON.parse(localStorage.getItem('ahh_favorites') || '[]');
      const isAlreadyFav = favs.includes(id);
      let updated;
      if (isAlreadyFav) {
        updated = favs.filter((item: string) => item !== id);
        setIsFavorite(false);
        setToastMessage('Removed from Wishlist');
      } else {
        updated = [...favs, id];
        setIsFavorite(true);
        setToastMessage('Added to Wishlist!');
      }
      localStorage.setItem('ahh_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          wishlist: isAlreadyFav ? arrayRemove(id) : arrayUnion(id)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToastMessage("Please sign in to rate & review!");
      return;
    }
    if (!id || !property) return;
    if (!reviewComment.trim()) {
      setToastMessage("Please write a comment!");
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewId = Math.random().toString(36).substring(2, 12);
      const reviewPayload = {
        id: reviewId,
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        userPhoto: user.photoURL || '',
        rating: reviewRating,
        comment: reviewComment
      };

      // 1. Save review in MySQL DB
      const res = await fetch(`/api/db/properties/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload)
      });
      if (!res.ok) {
        throw new Error('Failed to save review in database');
      }

      // 2. Re-calculate listing ratings and save to listings table in SQL DB
      const currentCount = property.reviewCount || 0;
      const currentRating = property.rating || 5.0;
      const newCount = currentCount + 1;
      const newRating = Number((((currentRating * currentCount) + reviewRating) / newCount).toFixed(1));

      await fetch('/api/db/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...property,
          reviewCount: newCount,
          rating: newRating
        })
      });

      // 3. Append to User Profile's reviewsList in Firestore (fallback option)
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          reviewsList: arrayUnion({
            reviewId,
            propertyId: id,
            propertyName: property.title,
            rating: reviewRating,
            comment: reviewComment,
            createdAt: new Date().toISOString()
          })
        });
      } catch (errProfile) {
        console.warn("Could not sync review to Firebase profile", errProfile);
      }

      // 4. Update local state
      const localReview = {
        id: reviewId,
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        userPhoto: user.photoURL || '',
        rating: reviewRating,
        comment: reviewComment,
        createdAt: new Date().toISOString()
      };
      setReviews(prev => [localReview, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      setProperty(prev => {
        if (!prev) return null;
        return { ...prev, reviewCount: newCount, rating: newRating };
      });

      setToastMessage("Review posted!");
    } catch (err) {
      console.error("Submit review error:", err);
      setToastMessage("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string, itemRating: number) => {
    if (!id || !user || !property) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      // 1. Delete review from SQL DB
      const res = await fetch(`/api/db/properties/${id}/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Failed to delete review from database');
      }

      // 2. Decrement and update parent property stats in listings table
      const currentCount = property.reviewCount || 0;
      const currentRating = property.rating || 5.0;
      const newCount = Math.max(0, currentCount - 1);
      let newRating = 5.0;
      if (newCount > 0) {
        newRating = Number((((currentRating * currentCount) - itemRating) / newCount).toFixed(1));
      }

      await fetch('/api/db/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...property,
          reviewCount: newCount,
          rating: newRating
        })
      });

      // 3. Remove from User Profile's reviewsList in Firestore
      try {
        const reviewSummary = profile?.reviewsList?.find((r: any) => r.reviewId === reviewId);
        const userRef = doc(db, 'users', user.uid);
        if (reviewSummary) {
          await updateDoc(userRef, {
            reviewsList: arrayRemove(reviewSummary)
          });
        } else {
          const updatedList = (profile?.reviewsList || []).filter((r: any) => r.reviewId !== reviewId);
          await updateDoc(userRef, {
            reviewsList: updatedList
          });
        }
      } catch (errProfile) {
        console.warn("Could not remove review from Firebase profile", errProfile);
      }

      // 4. Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setProperty(prev => {
        if (!prev) return null;
        return { ...prev, reviewCount: newCount, rating: newRating };
      });

      setToastMessage("Review deleted");
    } catch (err) {
      console.error("Delete review error:", err);
      setToastMessage("Failed to delete review");
    }
  };

  const handleShare = async () => {
    if (!property) return;
    const shareData = {
      title: property.title,
      text: `Check out ${property.title} in ${property.location.address} on Authentic Holiday Homes!`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setToastMessage('Shared successfully!');
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Link copied to clipboard!');
    } catch (err) {
      setToastMessage('Failed to copy link');
    }
  };

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
      <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-900 mb-6">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] uppercase tracking-widest font-black leading-none mt-0.5">
              {lang === 'ar' ? 'الرجوع للعقارات' : 'Back to stays'}
            </span>
          </button>

          <span className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden md:inline-block" />

          {/* Breadcrumb line */}
          <div className="hidden md:flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
            <span>Home</span>
            <span className="text-[8px] font-bold text-zinc-300 dark:text-zinc-700">/</span>
            <span>{property.category}</span>
            <span className="text-[8px] font-bold text-zinc-300 dark:text-zinc-700">/</span>
            <span className="text-zinc-650 dark:text-zinc-300">
              {property.location.city || property.location.address.split(',').slice(-1)[0]?.trim() || 'Dubai'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          {property.referenceNo && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-805 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              {lang === 'ar' ? 'مرجع:' : 'Ref:'} #{property.referenceNo}
            </span>
          )}
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={handleShare}
              className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-transparent hover:border-zinc-150 dark:hover:border-zinc-800 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              title="Share Page"
            >
              <Share2 size={16} />
            </button>
            <button 
              type="button"
              onClick={toggleFavorite}
              className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-transparent hover:border-zinc-150 dark:hover:border-zinc-800 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              title="Save to Wishlist"
            >
              <Heart 
                size={16} 
                fill={isFavorite ? "#EF4444" : "none"} 
                className={isFavorite ? "text-red-500" : "text-zinc-650 dark:text-zinc-300"} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {(() => {
        const normalizedImages = property.images
          ? (property.images.webp || property.images.png || property.images.avif || []).map((_, idx) => {
              const imgs = property.images;
              return {
                webp: imgs.webp?.[idx],
                png: imgs.png?.[idx],
                avif: imgs.avif?.[idx],
                fallback: imgs.webp?.[idx] || imgs.png?.[idx] || imgs.avif?.[idx] || 'https://via.placeholder.com/1200x800?text=Authentic+Holiday+Home'
              };
            })
          : [];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[60vh] mb-8">
            <div className="lg:col-span-3 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
              <ImageCarousel 
                images={normalizedImages} 
                activeIndex={activeImage} 
                onChangeActiveIndex={setActiveImage} 
                title={property.title} 
              />
            </div>
            <div className="hidden lg:flex flex-col gap-4 overflow-y-auto no-scrollbar pr-1">
              {normalizedImages.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`relative rounded-3xl overflow-hidden aspect-video flex-shrink-0 border-4 transition-all bg-zinc-100 dark:bg-zinc-900/50 ${activeImage === idx ? 'border-brand shadow-xl' : 'border-transparent opacity-65 hover:opacity-100'}`}
                >
                  <img src={getPrimaryImage(idx)} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

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
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Building</p>
                <p className="font-bold flex items-center gap-2"><Building2 size={14} className="text-zinc-300" /> {property.buildingName}</p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-100 dark:border-zinc-850 pb-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{t('description')}</h2>
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base font-medium opacity-95">
              <FormattedText text={description} />
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-100 dark:border-zinc-850 pb-2.5">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Features & Amenities</h2>
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-sans mt-0.5">Premium comfort options inside your stay</p>
              </div>
            </div>

            {/* Premium, ultra-clean compact list without heavy cards or filters */}
            {property.amenities && (() => {
              const amenities = property.amenities as Record<string, string[]>;
              const allAmenities: { name: string; category: string }[] = [];
              Object.entries(amenities).forEach(([cat, items]) => {
                if (Array.isArray(items)) {
                  items.forEach((item: string) => {
                    allAmenities.push({ name: item, category: cat });
                  });
                }
              });

              if (allAmenities.length === 0) {
                return (
                  <p className="text-zinc-400 italic text-xs font-semibold">No specific amenities declared.</p>
                );
              }

              // Display up to 8 key amenities on-page
              const maxOnPage = 8;
              const displayList = allAmenities.slice(0, maxOnPage);

              // Filtered list inside the modal based on search query
              let filteredModalCategories: [string, string[]][] = [];
              if (isAmenitiesModalOpen) {
                filteredModalCategories = Object.entries(amenities).map(([category, items]) => {
                  const matchedItems = items.filter((item: string) =>
                    item.toLowerCase().includes(amenitySearchQuery.toLowerCase())
                  );
                  return [category, matchedItems] as [string, string[]];
                }).filter(([_, items]) => items.length > 0);
              }

              return (
                <div>
                  {/* Clean standard list layout without heavy card boundaries */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                    {displayList.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="flex items-center gap-4 py-3.5 border-b border-zinc-100/50 dark:border-zinc-900/40 last:border-0 md:even:border-b">
                        <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-805">
                          {getAmenityIcon(item.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">
                            {item.name}
                          </p>
                          <span className="block text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                            {item.category.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allAmenities.length > maxOnPage && (
                    <button
                      type="button"
                      onClick={() => setIsAmenitiesModalOpen(true)}
                      className="mt-8 px-6 py-3.5 bg-white dark:bg-zinc-950 border border-zinc-905 dark:border-zinc-300 font-bold uppercase text-[10px] tracking-widest text-zinc-900 dark:text-white rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:border-zinc-950 dark:hover:border-white transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-3xs"
                    >
                      Show all {allAmenities.length} amenities
                    </button>
                  )}

                  {/* Accessible Airbnb-style Detailed Modal */}
                  <AnimatePresence>
                    {isAmenitiesModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => {
                            setIsAmenitiesModalOpen(false);
                            setAmenitySearchQuery('');
                          }}
                          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
                        />

                        {/* Modal Panel */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                          className="relative bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 w-full max-w-2xl max-h-[80vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col z-10"
                        >
                          {/* Main Modal Header */}
                          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-850 shrink-0">
                            <div>
                              <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">What this place offers</h3>
                              <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold font-sans mt-0.5">Categorized catalog of accommodations</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAmenitiesModalOpen(false);
                                setAmenitySearchQuery('');
                              }}
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer border border-zinc-100 dark:border-zinc-850"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          {/* Search Area */}
                          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/10 shrink-0">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                              <input
                                type="text"
                                placeholder="Search amenities (e.g. WiFi, Pool, Gym...)"
                                value={amenitySearchQuery}
                                onChange={(e) => setAmenitySearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-805 rounded-xl pl-11 pr-16 py-3 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all text-zinc-900 dark:text-white"
                              />
                              {amenitySearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setAmenitySearchQuery('')}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase font-black tracking-widest text-zinc-400 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Scrollable Categories & Amenities List */}
                          <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                            {filteredModalCategories.length === 0 ? (
                              <div className="text-center py-12">
                                <p className="text-sm text-zinc-400 font-medium italic">No matches found for "{amenitySearchQuery}"</p>
                              </div>
                            ) : (
                              filteredModalCategories.map(([category, items]) => {
                                const displayName = category.replace(/([A-Z])/g, ' $1').trim();
                                return (
                                  <div key={category} className="space-y-4">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-850 pb-2">
                                      {displayName}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {items.map((item: string) => (
                                        <div key={item} className="flex items-center gap-3 py-1 bg-transparent group">
                                          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                            {getAmenityIcon(item)}
                                          </div>
                                          <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                                            {item}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
          </div>

          <div className="mb-12">
             <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-8">{t('location')}</h2>
             <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
               <PropertyMap center={property.location} />
             </div>
          </div>

          <div className="mb-16 mt-16 pt-12 border-t border-zinc-100 dark:border-zinc-800">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-4 animate-fade-in">
              {lang === 'ar' ? 'التقييمات والآراء' : 'Guest Reviews & Ratings'}
            </h2>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1 bg-yellow-400 text-zinc-950 font-black px-3.5 py-1.5 rounded-2xl text-sm shadow-sm">
                <Star size={16} className="fill-zinc-950 text-zinc-950" />
                {property.rating || '5.0'}
              </div>
              <span className="text-zinc-500 font-bold text-sm uppercase tracking-wider">
                {property.reviewCount || 0} {property.reviewCount === 1 ? 'Review' : 'Reviews'} for this property
              </span>
            </div>

            {/* Submitting form */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100/50 dark:border-zinc-800/60 p-6 rounded-[2rem] mb-12">
                <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white mb-4">
                  Write a Review
                </h3>
                
                {/* Stars selector */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-2">Your Rating</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={`${
                          star <= reviewRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        } border-none`}
                      />
                    </button>
                  ))}
                </div>

                {/* Comment textarea */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">Your Feedback</span>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand/50 dark:text-white transition-all resize-none"
                    maxLength={500}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-xs tracking-widest rounded-2xl flex items-center gap-2 hover:bg-black dark:hover:bg-zinc-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {submittingReview ? 'Posting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800/80 p-8 rounded-[2rem] text-center mb-12 shadow-sm">
                <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-4">You must be logged in to leave a review and keep it in your profile.</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Log In or Sign Up
                </button>
              </div>
            )}

            {/* List of reviews */}
            {fetchingReviews ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-zinc-50 dark:bg-zinc-900/20 h-28 rounded-3xl" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-205 dark:border-zinc-800 rounded-[2rem]">
                <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No reviews yet. Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-6 bg-white dark:bg-zinc-900/30 border border-zinc-100/80 dark:border-zinc-800 rounded-3xl shadow-sm transition-all hover:shadow-md relative group/review"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-brand text-xs shrink-0 overflow-hidden">
                          {item.userPhoto ? (
                            <img src={item.userPhoto} alt={item.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            item.userName?.slice(0, 2).toUpperCase() || 'GU'
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{item.userName || 'Anonymous'}</h4>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-yellow-400">
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

                    <p className="text-sm text-zinc-650 dark:text-zinc-400 font-medium leading-relaxed mb-1 pr-6">
                      {item.comment}
                    </p>

                    {/* Delete action */}
                    {user && (item.userId === user.uid || profile?.role === 'host') && (
                      <button
                        onClick={() => handleDeleteReview(item.id, item.rating)}
                        className="absolute bottom-4 right-4 text-rose-500 hover:text-rose-600 transition-colors p-1.5 opacity-0 group-hover/review:opacity-100 focus:opacity-100 shrink-0"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="relative w-full">
          <div className="lg:sticky lg:top-24 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 bg-white dark:bg-zinc-950 shadow-2xl ring-1 ring-zinc-900/5">
             <div className="flex justify-between items-baseline mb-10">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Starting from</span>
                 <div className="text-4xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5 tracking-tight">
                   <CurrencySymbol size="0.8em" className="text-brand" />
                   {property.price}
                   <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">/night</span>
                 </div>
                 {property.priceMonthly ? (
                   <div className="text-lg font-black text-zinc-500 dark:text-zinc-400 flex items-center gap-1 tracking-tight mt-1.5">
                     <CurrencySymbol size="0.8em" className="text-zinc-400" />
                     {property.priceMonthly}
                     <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">/month</span>
                   </div>
                 ) : null}
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-full"><Star size={14} className="fill-yellow-400 text-yellow-400 border-none" /> <span className="text-xs font-black">{property.rating || '5.0'}</span></div>
             </div>
             
             <div className="space-y-4 mb-5 relative">
                <div 
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="grid grid-cols-2 gap-0 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-inner cursor-pointer hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-300"
                >
                   <div className="py-2 px-3.5 border-r-2 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-all group flex flex-col justify-between">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-0.5 block">{lang === 'ar' ? 'تاريخ الدخول' : 'Check-In'}</label>
                      <div className="flex items-center gap-1.5 mt-0.5 min-h-[1.25rem] relative z-0">
                        <Calendar size={14} className="text-zinc-400 group-hover:text-brand transition-colors shrink-0" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-tight font-mono">
                          {formatDate(checkIn)}
                        </span>
                      </div>
                   </div>
                   <div className="py-2 px-3.5 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 transition-all group flex flex-col justify-between">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-0.5 block">{lang === 'ar' ? 'تاريخ الخروج' : 'Check-Out'}</label>
                      <div className="flex items-center gap-1.5 mt-0.5 min-h-[1.25rem] relative z-0">
                        <Calendar size={14} className="text-zinc-400 group-hover:text-brand transition-colors shrink-0" />
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-tight font-mono">
                          {formatDate(checkOut)}
                        </span>
                      </div>
                   </div>
                </div>

                <AnimatePresence>
                  {isCalendarOpen && (
                    <CalendarPopover
                      checkIn={checkIn}
                      checkOut={checkOut}
                      onDatesChange={(start, end) => {
                        setCheckIn(start);
                        setCheckOut(end);
                      }}
                      isOpen={isCalendarOpen}
                      onClose={() => setIsCalendarOpen(false)}
                      lang={lang}
                      inline={true}
                    />
                  )}
                </AnimatePresence>
             </div>

             {/* Real-time Stay duration & Minimum Nights check */}
             {checkIn && checkOut && (() => {
               const dateIn = new Date(checkIn);
               const dateOut = new Date(checkOut);
               const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
               const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               const minNights = property.minimumNights ?? 30; // default to 30 nights (monthly)
               const isLongEnough = diffNights >= minNights;

               return (
                 <div className={`p-4 rounded-2xl flex items-start gap-3 border text-xs mb-5 ${
                   isLongEnough
                     ? "bg-zinc-50 border-zinc-100 dark:bg-zinc-900/30 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                     : "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-600 dark:text-rose-450 font-bold"
                 }`}>
                   <Info size={16} className={`shrink-0 mt-0.5 ${isLongEnough ? "text-zinc-500" : "text-rose-500"}`} />
                   <div>
                     {isLongEnough ? (
                       <span>
                         <div className="flex flex-col gap-1">
                            <span>Selected: <strong className="font-extrabold">{diffNights} nights</strong></span>
                            <span>Estimated Price: <strong className="font-extrabold"><CurrencySymbol />{Math.round(diffNights * property.price)}</strong></span>
                          </div>
                       </span>
                     ) : (
                       <span>
                         This unit requires a minimum stay of <strong className="font-extrabold">{minNights} nights</strong>. You selected {diffNights} {diffNights === 1 ? 'night' : 'nights'}.
                       </span>
                     )}
                   </div>
                 </div>
               );
             })()}

             <button 
              disabled={(() => {
                if (property.purpose !== 'For Rent' || !checkIn || !checkOut) return false;
                const dIn = new Date(checkIn);
                const dOut = new Date(checkOut);
                const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffNights < (property.minimumNights ?? 30);
              })()}
              onClick={() => navigate(`/booking/${property.id}?checkIn=${checkIn}&checkOut=${checkOut}`)}
              className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all ring-4 ring-zinc-900/10 ${
                (() => {
                  if (property.purpose !== 'For Rent' || !checkIn || !checkOut) return false;
                  const dIn = new Date(checkIn);
                  const dOut = new Date(checkOut);
                  const diffTime = Math.abs(dOut.getTime() - dIn.getTime());
                  const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffNights < (property.minimumNights ?? 30);
                })()
                  ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed hover:scale-100 active:scale-100"
                  : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-black dark:hover:bg-zinc-100"
              }`}
             >
               {property.purpose === 'For Rent' ? t('book_now') : 'Inquire Now'}
             </button>

             


          </div>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950/95 text-white dark:bg-white dark:text-zinc-950 px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 border border-zinc-800 dark:border-zinc-200 text-xs font-black uppercase tracking-[0.1em] pointer-events-none"
          >
            <span>✨ {toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
