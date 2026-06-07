import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Maximize, Bed, Bath } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import CurrencySymbol from './CurrencySymbol';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  userLat?: number;
  userLng?: number;
  key?: React.Key;
}

export default function PropertyCard({ property, userLat, userLng }: PropertyCardProps) {
  const { t, lang } = useSettings();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  React.useEffect(() => {
    if (property.id) {
      try {
        const favs = JSON.parse(localStorage.getItem('ahh_favorites') || '[]');
        setIsWishlisted(favs.includes(property.id));
      } catch (err) {
        console.error(err);
      }
    }
  }, [property.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!property.id) return;
    try {
      const favs = JSON.parse(localStorage.getItem('ahh_favorites') || '[]');
      const isAlreadyFav = favs.includes(property.id);
      let updated;
      if (isAlreadyFav) {
        updated = favs.filter((id: string) => id !== property.id);
        setIsWishlisted(false);
      } else {
        updated = [...favs, property.id];
        setIsWishlisted(true);
      }
      localStorage.setItem('ahh_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          wishlist: isAlreadyFav ? arrayRemove(property.id) : arrayUnion(property.id)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPrimaryImage = () => {
    const imgs = property.images;
    if (!imgs) return 'https://via.placeholder.com/800x600?text=Listing';
    return imgs.webp?.[0] || imgs.png?.[0] || imgs.avif?.[0] || 'https://via.placeholder.com/800x600?text=Listing';
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="group relative bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-all shadow-sm hover:shadow-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <picture>
          {property.images?.avif?.[0] && <source srcSet={property.images.avif[0]} type="image/avif" />}
          {property.images?.webp?.[0] && <source srcSet={property.images.webp[0]} type="image/webp" />}
          <img 
            src={getPrimaryImage()} 
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </picture>
        
        <div className="absolute top-4 left-4 flex gap-2">
           <span className="px-3 py-1 bg-brand text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">{property.category}</span>
           <span className="px-3 py-1 bg-white/90 backdrop-blur text-zinc-900 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">{property.purpose}</span>
        </div>

        <button 
          onClick={toggleWishlist}
          className="absolute top-4 right-4 p-2.5 bg-white/30 backdrop-blur-md rounded-full text-white hover:bg-white/50 transition-colors z-10"
        >
          <Heart 
            size={20} 
            fill={isWishlisted ? "#D91F28" : "none"} 
            className={isWishlisted ? "text-brand" : "text-white"}
          />
        </button>
        <div className="absolute bottom-4 left-4 right-4">
           <div className="bg-zinc-900/40 backdrop-blur-md px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-white text-[10px] font-bold">
              <Star size={12} className="fill-yellow-400 text-yellow-400 border-none" />
              {property.rating?.toFixed(1) || '5.0'} ({property.reviewCount || 0})
           </div>
        </div>
      </div>

      <Link to={`/property/${property.id}`} className="block p-6">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white line-clamp-1">
            {property.title}
          </h3>
          <div className="flex flex-col items-end shrink-0">
            <div className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-0.5 leading-none tracking-tighter">
              <CurrencySymbol size="0.8em" className="text-brand" />
              {property.price}
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 tracking-normal ml-0.5">/night</span>
            </div>
            {property.priceMonthly ? (
              <div className="text-xs font-extrabold text-zinc-605 dark:text-zinc-350 flex items-center gap-0.5 mt-1 leading-none">
                <CurrencySymbol size="0.8em" className="text-zinc-400" />
                {property.priceMonthly}
                <span className="text-[9px] font-medium text-zinc-400/80 tracking-normal ml-0.5">/month</span>
              </div>
            ) : null}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-4 justify-between">
          <div className="flex items-center gap-1.5 truncate max-w-[75%]">
            <MapPin size={14} className="text-brand flex-shrink-0" />
            <span className="truncate">{property.location.address}</span>
          </div>
          {userLat !== undefined && userLng !== undefined && property.location?.lat && property.location?.lng && (
            <span className="text-[9px] font-black text-brand uppercase tracking-wider bg-brand/5 dark:bg-brand/10 px-2 py-0.5 rounded-md flex-shrink-0">
              {(() => {
                const R = 6371; 
                const dLat = (property.location.lat - userLat!) * (Math.PI / 180);
                const dLon = (property.location.lng - userLng!) * (Math.PI / 180);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLat! * (Math.PI / 180)) * Math.cos(property.location.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const d = R * c; 
                return d.toFixed(1);
              })()} km
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 py-4 border-t border-zinc-100 dark:border-zinc-800">
           <div className="flex items-center gap-1.5 text-zinc-400">
              <Bed size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-300">{property.bedrooms || 0}</span>
           </div>
           <div className="flex items-center gap-1.5 text-zinc-400">
              <Bath size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-300">{property.bathrooms || 0}</span>
           </div>
           <div className="flex items-center gap-1.5 text-zinc-400">
              <Maximize size={14} />
              <span className="text-[10px] font-black uppercase tracking-tight text-zinc-600 dark:text-zinc-300">{property.size || 0}</span>
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
