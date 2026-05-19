import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin, Maximize, Bed, Bath } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import CurrencySymbol from './CurrencySymbol';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  key?: React.Key;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { t, lang } = useSettings();
  const [isWishlisted, setIsWishlisted] = React.useState(false);

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
          onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
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
          <div className="flex flex-col items-end">
            <div className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1 leading-none tracking-tighter">
              <CurrencySymbol size="0.8em" className="text-brand" />
              {property.price}
            </div>
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{property.purpose === 'For Rent' ? t('monthly') : ''}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-4">
          <MapPin size={14} className="text-brand" />
          <span className="truncate">{property.location.address}</span>
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
