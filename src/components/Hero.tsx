import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Slide } from '../types';
import { getAbsoluteUrl } from '../lib/utils';

export default function Hero() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/slides')
      .then(res => res.json())
      .then(data => {
        setSlides(data);
        // Preload images
        data.forEach((slide: Slide) => {
          const img = new Image();
          img.src = slide.image_url;
        });
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isLoading || slides.length === 0) return (
    <div className="relative mt-[5rem] h-[90vh] w-full bg-gray-900 flex items-center justify-center">
      <div className="h-[2rem] w-[2rem] animate-spin rounded-full border-2 border-white border-t-transparent" />
    </div>
  );

  return (
    <section className="relative mt-[5rem] h-[90vh] w-full overflow-hidden bg-gray-900">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slides[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.8, ease: "easeInOut" },
          }}
          className="absolute inset-0 h-full w-full"
        >
          <div className="relative h-full w-full">
            <img 
              src={slides[current].image_url} 
              className="h-full w-full object-cover" 
              alt=""
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#01470b]/90 via-[#01470b]/40 to-transparent" />
            
            <div className="absolute inset-0 z-10 flex h-full items-center px-[2rem]">
              <div className="mx-auto w-full max-w-[75rem]">
                <div className="max-w-[50rem]">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    <h1 className="mb-[1.5rem] text-[2.8rem] font-black leading-[1.1] text-white md:text-[5rem] tracking-tight">
                      {slides[current].title}
                    </h1>
                    <p className="mb-[2.5rem] max-w-[40rem] text-[1.15rem] leading-relaxed text-white/90 md:text-[1.4rem]">
                      {slides[current].subtitle}
                    </p>
                    <div className="flex flex-wrap gap-[1.5rem]">
                      <motion.a
                        href={getAbsoluteUrl(slides[current].cta_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-[0.5rem] rounded-[1rem] bg-[#ffffff] outline outline-2 outline-[#ffffff] outline-offset-[4px] px-[3rem] py-[1.2rem] font-bold text-[#01470b] transition-all duration-300 hover:scale-[1.05] hover:bg-[#fc9403] hover:outline-transparent hover:outline-offset-0"
                      >
                        {slides[current].cta_text}
                      </motion.a>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Indicators */}
      <div className="absolute bottom-[3rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-[1rem] rounded-full bg-black/10 px-[1.5rem] py-[0.75rem] backdrop-blur-md">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`group relative h-[0.5rem] overflow-hidden rounded-full transition-all duration-500 ${current === idx ? 'w-[3rem] bg-white' : 'w-[0.5rem] bg-white/30 hover:bg-white/50'}`}
            aria-label={`Go to slide ${idx + 1}`}
          >
            {current === idx && (
              <motion.div 
                className="absolute inset-0 bg-[#01470b]/20"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                transition={{ duration: 6, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
