import { useState, useEffect } from 'react';
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
          <section id="produk" className="mx-auto max-w-[75rem] px-[1rem] sm:px-[2rem] py-[3rem] sm:py-[5rem]">
            <div className="mb-[2rem] sm:mb-[3rem] flex flex-col justify-between gap-[1rem] md:flex-row md:items-end">
              <div>
                <h2 className="text-[2rem] font-bold text-[#01470b]">Produk Unggulan</h2>
                <p className="mt-[0.5rem] text-gray-500">Pilihan terbaik untuk konsumsi keluarga Anda.</p>
              </div>
              <Link to="/produk" className="inline-flex w-fit rounded-full bg-[#01470b] px-[1.5rem] py-[0.625rem] font-semibold text-white transition-all hover:bg-[#01600f]">
                Lihat Semua
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-[2rem] sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-[25rem] animate-pulse rounded-[0.75rem] bg-gray-100" />
                ))
              ) : (
                featured.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </section>
        )}
      </main>

      <Footer isRestricted={isRestricted} />
    </div>
  );
}
