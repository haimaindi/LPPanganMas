import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Info, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  key?: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const navigate = useNavigate();

  const branches = [
    { name: 'Magelang', path: '/cabang/magelang' },
    { name: 'Malang', path: '/cabang/malang' }
  ];

  return (
    <>
      <motion.article 
        variants={{
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
          hidden: { opacity: 0, y: 40 }
        }}
        className="group relative flex flex-col overflow-hidden rounded-[1.5rem] bg-white border border-gray-100 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      >
        {product.badge && (
          <span className="absolute top-[1.25rem] left-[1.25rem] z-10 rounded-full bg-[#01470b] px-[1rem] py-[0.35rem] text-[0.7rem] font-bold tracking-widest text-white uppercase backdrop-blur-md">
            {product.badge}
          </span>
        )}
        
        <div className="relative h-[16rem] w-full overflow-hidden bg-gray-50">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 transition-opacity duration-300 z-10 group-hover:opacity-100" />
          <img 
            src={product.image_url} 
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="flex flex-grow flex-col p-[1.5rem] sm:p-[2rem]">
          <span className="mb-[0.5rem] text-[0.7rem] tracking-[0.1em] font-bold text-[#01470b] uppercase">
            {product.category}
          </span>
          <h3 className="mb-[0.75rem] text-[1.25rem] font-black text-gray-900 leading-tight">
            {product.title}
          </h3>
          <p className="mt-0 mb-[1.5rem] line-clamp-2 text-[0.875rem] leading-relaxed text-gray-500">
            {product.specs}
          </p>

          <div className="mt-auto flex w-full gap-[0.75rem]">
            <button 
              onClick={() => setShowDetail(true)}
              className="flex w-full items-center justify-center gap-[0.5rem] rounded-[1rem] border-2 border-gray-200 bg-white py-[0.75rem] text-[0.875rem] font-bold text-gray-700 transition-all duration-300 hover:scale-[1.05] hover:bg-gray-50 hover:border-gray-300"
            >
              Lihat
            </button>
            
            <button 
              onClick={() => setShowBranchDialog(true)}
              className="group flex w-full items-center justify-center gap-[0.5rem] rounded-[1rem] bg-[#fc9403] outline outline-2 outline-[#fc9403] outline-offset-[2px] py-[0.75rem] text-[0.875rem] font-bold text-white transition-all duration-300 hover:scale-[1.05] hover:bg-[#01470b] hover:outline-transparent hover:outline-offset-0 hover:shadow-lg"
            >
              Pesan 
            </button>
          </div>
        </div>
      </motion.article>

      {/* Modal Detail Produk */}
      <AnimatePresence>
        {showDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl"
            >
              <button 
                onClick={() => setShowDetail(false)}
                className="absolute top-4 right-4 z-10 rounded-full bg-black/10 p-2 text-gray-600 backdrop-blur-md transition-colors hover:bg-black/20"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="h-64 md:h-full">
                  <img 
                    src={product.image_url} 
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#01470b]">
                    {product.category}
                  </span>
                  <h2 className="mt-2 text-2xl font-black text-gray-900">{product.title}</h2>
                  <div className="mt-6 space-y-4">
                    <h4 className="font-bold text-gray-900">Deskripsi:</h4>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {product.specs}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowDetail(false);
                      setShowBranchDialog(true);
                    }}
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#01470b] py-4 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ShoppingCart size={20} />
                    Pesan Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Pilihan Cabang */}
      <AnimatePresence>
        {showBranchDialog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBranchDialog(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm rounded-[1.5rem] bg-white p-8 text-center shadow-2xl"
            >
              <h3 className="text-xl font-black text-gray-900">Pilih Cabang</h3>
              <p className="mt-2 text-gray-500">Silakan pilih cabang terdekat untuk pemesanan.</p>
              
              <div className="mt-8 flex flex-col gap-3">
                {branches.map((branch) => (
                  <button
                    key={branch.path}
                    onClick={() => navigate(branch.path)}
                    className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-[#01470b] hover:bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#01470b] text-white">
                        <MapPin size={20} />
                      </div>
                      <span className="font-bold text-gray-900">{branch.name}</span>
                    </div>
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="text-[#01470b]"
                    >
                      <ShoppingCart size={18} />
                    </motion.div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowBranchDialog(false)}
                className="mt-6 text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Batal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
