import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../assets';

export default function Navbar({ isRestricted }: { isRestricted?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isCabangOpen, setIsCabangOpen] = useState(false);

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Profil', href: '/profil' },
    { label: 'Produk', href: '/produk' },
    { 
      label: 'Cabang', 
      href: '#',
      children: [
        { label: 'Magelang', href: '/cabang/magelang' },
        { label: 'Malang', href: '/cabang/malang' }
      ]
    },
    { label: 'Hubungi Kami', href: '/kontak' },
    { label: 'Tim', href: '/admin' }
  ];

  return (
    <header className={`fixed top-0 left-0 z-[1000] w-full h-[5rem] transition-all duration-300 flex items-center ${isScrolled ? 'bg-white/70 shadow-sm backdrop-blur-xl' : 'bg-transparent'}`}>
      <nav className="mx-auto w-full max-w-7xl flex items-center justify-between px-8">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={ASSETS.DEV_BRAND} 
            alt="Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="hidden text-xl font-black tracking-tight text-[#01470b]">
            Pangan Mas Abadi
          </span>
        </Link>

        {/* Desktop Nav */}
<ul className="hidden items-center gap-10 md:flex">
  {navLinks.map((link) => (
    <li key={link.label} className="relative flex items-center">
      {link.children ? (
        <div 
          className="relative flex items-center group" 
          onMouseEnter={() => setIsCabangOpen(true)}
          onMouseLeave={() => setIsCabangOpen(false)}
          style={{ padding: '10px' }} 
        >
          <button className="flex items-center text-sm font-medium text-gray-900 transition-colors hover:text-[#01470b] cursor-pointer pointer-events-none">
            {link.label}
          </button>
          
          {/* Gunakan group-hover logic jika memungkinkan, atau tetap state */}
          <AnimatePresence mode="wait"> {/* mode="wait" membantu mencegah tumpang tindih animasi masuk/keluar */}
            {isCabangOpen && (
              <motion.ul
                
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-1/2 -translate-x-1/2 top-full mt-4 w-48 rounded-[1rem] bg-white/95 p-2 shadow-2xl backdrop-blur-xl border border-white/50 z-50" 
              >
                {link.children.map((child) => (
                  <li key={child.label}>
                    <Link
                      to={child.href}
                      className="block rounded-[0.5rem] px-4 py-3 text-[0.875rem] font-medium text-gray-700 hover:bg-[#01470b] hover:text-white transition-colors"
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      ) : (
                link.href.startsWith('/') || link.href === '/' ? (
                  <Link to={link.href} className={`text-sm font-medium text-gray-900 transition-colors hover:text-[#01470b] ${isRestricted && link.label === 'Produk' ? 'opacity-50 pointer-events-none' : ''}`}>
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.href} className="text-sm font-medium text-gray-900 transition-colors hover:text-[#01470b]">
                    {link.label}
                  </a>
                )
              )}
            </li>
          ))}
        </ul>

        {/* Mobile Toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#01470b] md:hidden">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full border-t border-gray-100 bg-white p-8 shadow-xl md:hidden overflow-y-auto max-h-[80vh]"
          >
            <ul className="flex flex-col gap-6 text-center">
              {navLinks.map((link) => (
                <li key={link.label}>
                  {link.children ? (
                    <div className="flex flex-col gap-3">
                      <span className="text-lg font-semibold text-[#01470b]">{link.label}</span>
                      <ul className="flex flex-col gap-2">
                        {link.children.map((child) => (
                          <li key={child.label}>
                            <Link 
                              to={child.href} 
                              onClick={() => setIsMenuOpen(false)}
                              className="text-base text-gray-600"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    link.href.startsWith('/') || link.href === '/' ? (
                      <Link to={link.href} onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-900">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-900">
                        {link.label}
                      </a>
                    )
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
