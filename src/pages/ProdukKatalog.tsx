import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { Product } from '../types';

export default function ProdukKatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
    
    // Scroll to top when page loaded
    window.scrollTo(0, 0);
  }, []);

  const categories = ['Semua', ...new Set(products.map(p => p.category))];

  const filteredProducts = (activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category === activeCategory))
    .filter(p => p.isActive)
    .sort((a, b) => a.order - b.order); // ASCENDING: 1 is primary

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#01470b] selection:text-white">
      <Navbar />
      
      <main className="pt-[5rem]">
        {/* Header Section */}
        <section className="bg-gray-50 py-[4rem] px-[2rem]">
          <div className="mx-auto max-w-[75rem]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center md:text-left"
            >
              <h1 className="text-[3rem] font-black tracking-tight text-[#01470b] md:text-[4rem]">Katalog Produk</h1>
              <p className="mt-4 text-xl text-gray-600 max-w-2xl">
                Jelajahi berbagai pilihan produk pangan berkualitas tinggi yang kami tawarkan untuk kebutuhan Anda.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter & Grid Section */}
        <section className="mx-auto max-w-[75rem] px-[2rem] py-[4rem]">
          {/* Categories Filter */}
          <div className="mb-[3rem] flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400 mr-2">Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#01470b] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{filteredProducts.length}</span> produk
            </p>
          </div>

          {/* Product Grid */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid grid-cols-1 gap-[2rem] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-[25rem] animate-pulse rounded-[1.5rem] bg-gray-100" />
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-[5rem] text-center">
                <p className="text-xl text-gray-500">Tidak ada produk ditemukan dalam kategori ini.</p>
              </div>
            )}
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
