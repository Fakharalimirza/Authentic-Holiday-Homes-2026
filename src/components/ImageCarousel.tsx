import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselImage {
  webp?: string;
  png?: string;
  avif?: string;
  fallback: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  activeIndex: number;
  onChangeActiveIndex: (index: number) => void;
  title?: string;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function ImageCarousel({
  images,
  activeIndex,
  onChangeActiveIndex,
  title = 'Property Image'
}: ImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNext = () => {
    if (images.length === 0) return;
    onChangeActiveIndex((activeIndex + 1) % images.length);
  };

  const handlePrev = () => {
    if (images.length === 0) return;
    onChangeActiveIndex((activeIndex - 1 + images.length) % images.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center rounded-[2.5rem]">
        <span className="text-zinc-400 font-bold tracking-widest uppercase text-xs">No Images Available</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-zinc-950 rounded-[2.5rem]"
    >
      {/* Draggable/Swipeable main container */}
      <div className="absolute inset-0 w-full h-full touch-pan-y">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                handleNext();
              } else if (swipe > swipeConfidenceThreshold) {
                handlePrev();
              } else if (Math.abs(offset.x) > 80) {
                if (offset.x < 0) {
                  handleNext();
                } else {
                  handlePrev();
                }
              }
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <picture className="w-full h-full pointer-events-none flex items-center justify-center">
              {images[activeIndex]?.avif && (
                <source srcSet={images[activeIndex].avif} type="image/avif" />
              )}
              {images[activeIndex]?.webp && (
                <source srcSet={images[activeIndex].webp} type="image/webp" />
              )}
              <img
                src={images[activeIndex]?.fallback}
                alt={`${title} - View ${activeIndex + 1}`}
                className="max-w-full max-h-full object-contain select-none shadow-md"
                referrerPolicy="no-referrer"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Ambient Gradient Overlays */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

      {/* Custom Chevron Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 dark:bg-black/20 hover:bg-white dark:hover:bg-white hover:text-zinc-950 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group pointer-events-auto"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} className="transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 dark:bg-black/20 hover:bg-white dark:hover:bg-white hover:text-zinc-950 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group pointer-events-auto"
            aria-label="Next image"
          >
            <ChevronRight size={24} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </>
      )}

      {/* Floating Image Counter Badge */}
      <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 text-white text-[11px] font-black tracking-widest rounded-full font-mono uppercase">
        {activeIndex + 1} / {images.length}
      </div>

      {/* Indicator Progress Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-6 inset-x-6 flex items-center justify-center gap-1.5 pointer-events-auto">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeActiveIndex(idx)}
              className="relative p-1 focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx 
                    ? 'w-6 bg-brand' 
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`} 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
