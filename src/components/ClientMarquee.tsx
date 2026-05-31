import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Client } from '../types';

function MarqueeItem({ client }: { client: Client | undefined; key?: number | string }) {
  return (
    <div className="flex-shrink-0">
      <div className="group flex flex-col items-center justify-center">
        {client ? (
          <>
            <div className="relative flex h-[5rem] w-[10rem] items-center justify-center md:h-[6rem] md:w-[12.5rem]">
              <img 
                src={client.logo_url} 
                alt={client.name} 
                className="max-h-full max-w-full object-contain transition-opacity duration-300 group-hover:opacity-80" 
                draggable={false}
              />
            </div>
            
            <span className="mt-[1.5rem] text-[0.75rem] font-bold tracking-[0.15em] text-gray-400 uppercase transition-colors group-hover:text-[#01470b]">
              {client.name}
            </span>

            {/* Enhanced Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-[2rem] -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="relative whitespace-nowrap rounded-[0.5rem] bg-[#01470b] px-[1.25rem] py-[0.6rem] text-[0.8rem] font-bold text-white shadow-2xl">
                {client.name}
                <div className="absolute top-full left-1/2 -mt-[1px] -translate-x-1/2 border-[6px] border-transparent border-t-[#01470b]" />
              </div>
            </div>
          </>
        ) : (
          <div className="h-[3rem] w-[8rem] animate-pulse bg-gray-100 rounded-[0.5rem]" />
        )}
      </div>
    </div>
  );
}

export default function ClientMarquee() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data));
  }, []);

  // Triple the list for smooth infinite scrolling
  const displayClients = [...clients, ...clients, ...clients];

  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { scrollWidth, offsetWidth } = containerRef.current;
      setDragConstraints({ left: -(scrollWidth - offsetWidth), right: 0 });
    }
  }, [clients]);

  return (
    <section className="bg-white pt-[4rem] pb-[3rem] sm:pt-[5rem] sm:pb-[4rem] overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="mb-[3rem] sm:mb-[4rem] text-center px-[1.5rem]"
      >
        <span className="mb-[1rem] inline-block text-[0.875rem] font-bold leading-none uppercase tracking-[0.2em] text-[#000000]">
          Kepercayaan Berharga
        </span>
        <h2 className="text-[2rem] font-black text-[#01470b] md:text-[3rem] tracking-tight leading-tight">
          Mitra <span className="text-[#fc9403]">Strategis</span>
        </h2>
      </motion.div>

      <div 
        className="relative flex w-full cursor-grab active:cursor-grabbing overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div 
          ref={containerRef}
          drag="x"
          dragConstraints={dragConstraints}
          className="flex gap-[6rem] px-[4rem] items-center"
          animate={!isHovered ? { x: [0, -1500] } : {}}
          transition={{ 
            x: {
              repeat: Infinity, 
              duration: 40, 
              ease: "linear" 
            }
          }}
        >
          {displayClients.map((client, idx) => (
            <MarqueeItem key={idx} client={client} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
