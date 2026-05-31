import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ClientMarquee from '../components/ClientMarquee';
import CompanyProfile from '../components/CompanyProfile';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { Product } from '../types';

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const featured = products
    .filter(p => p.isActive)
    .sort((a, b) => a.order - b.order)
    .slice(0, 6);

  const isRestricted = featured.length === 0;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#01470b] selection:text-white">
      <Navbar isRestricted={isRestricted} />
      
      <main>
        <Hero />
        
        <ClientMarquee />

        <CompanyProfile />

        {!isRestricted && (
          <section id="produk" className="relative w-full overflow-hidden bg-gray-50 pt-[3rem] pb-[6rem] sm:pt-[4rem] sm:pb-[8rem]">
            {/* Background minimal gradients */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            
            <div className="mx-auto max-w-[75rem] px-[1.5rem] sm:px-[2rem]">
              <div className="mb-[4rem] sm:mb-[6rem] flex flex-col justify-between gap-[2rem] md:flex-row md:items-end">
                <div className="max-w-[35rem]">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <h2 className="text-[2.5rem] font-black tracking-tight text-gray-900 md:text-[3.5rem] leading-[1.1]">
                      Produk <span className="text-[#01470b]">Unggulan</span>
                    </h2>
                    <p className="mt-[1.5rem] text-[1.125rem] leading-relaxed text-gray-500 font-medium">
                      Temukan koleksi produk terbaik kami sesuai kebutuhan bisnis atau pribadi Anda.
                    </p>
                  </motion.div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                >
                  <Link to="/produk" className="group relative inline-flex items-center gap-[1rem] rounded-[1rem] bg-[#fc9403] outline outline-2 outline-[#fc9403] outline-offset-[4px] px-[2rem] py-[1rem] font-bold text-white overflow-hidden transition-all duration-300 hover:scale-[1.05] hover:bg-[#01470b] hover:outline-transparent hover:outline-offset-0">
                    <span className="text-center justify-center relative z-10 transition-transform duration-300 ">Lihat Semua Katalog</span>

                  </Link>
                </motion.div>
              </div>

              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  visible: { transition: { staggerChildren: 0.15 } },
                  hidden: {}
                }}
                className="grid grid-cols-1 gap-[2rem] sm:gap-[3rem] sm:grid-cols-2 lg:grid-cols-3"
              >
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-[28rem] animate-pulse rounded-[1.5rem] bg-white border border-gray-100 shadow-sm" />
                  ))
                ) : (
                  featured.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))
                )}
              </motion.div>
            </div>
          </section>
        )}
      </main>

      <Footer isRestricted={isRestricted} />
    </div>
  );
}
