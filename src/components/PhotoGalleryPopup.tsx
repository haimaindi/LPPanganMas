import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BranchGalleryItem } from '../types';

interface PhotoGalleryPopupProps {
  images: BranchGalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoGalleryPopup({ images, initialIndex, onClose }: PhotoGalleryPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4 md:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[2001] p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
        >
          <X size={24} />
        </button>

        <button
          onClick={prev}
          className="absolute left-6 z-[2001] p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
        >
          <img
            src={images[currentIndex].image_url}
            alt={images[currentIndex].title}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl"
          />
          <div className="mt-4 text-center text-white">
            <h3 className="text-xl font-bold">{images[currentIndex].title}</h3>
            <p className="text-sm opacity-80">{images[currentIndex].description}</p>
          </div>
        </motion.div>

        <button
          onClick={next}
          className="absolute right-6 z-[2001] p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
