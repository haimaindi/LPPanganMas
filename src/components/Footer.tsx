import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ASSETS } from '../assets';
import { useEffect, useState } from 'react';
import { CompanyProfile } from '../types';

export default function Footer({ isRestricted }: { isRestricted?: boolean }) {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error);
  }, []);

  const footerLinks = [
    { label: 'Beranda', href: '/' },
    /*{ label: 'Cabang', href: '#' },*/
    { label: 'Produk', href: '/produk' },
    { label: 'Hubungi Kami', href: '/kontak' },
    { label: 'Profil', href: '/profil' },
    { label: 'Tim', href: '/admin' }
  ];

  return (
    <footer id="kontak" className="bg-[#01470b] pt-[4rem] pb-[1rem] text-white">
      <div className="mx-auto grid max-w-[75rem] grid-cols-1 gap-[3rem] px-[2rem] md:grid-cols-3">
        <div className="flex flex-col gap-[1.5rem]">
          <div className="flex items-center gap-[0.75rem]">
            <img 
              src={ASSETS.DEV_BRAND} 
              alt="Logo" 
              className="hidden bg-White rounded-[0.5rem] h-[2.5rem] w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-[1.25rem] font-bold text-white">PT Pangan Mas Abadi</span>
          </div>
          <p className="text-[0.95rem] text-white/80">
            {profile?.footerText || 'Mitra terpercaya dalam penyediaan kebutuhan pangan segar dan berkualitas untuk keluarga Indonesia.'}
          </p>
          <div className="hidden flex gap-[1rem]">
            {[Facebook, Instagram, Linkedin].map((Icon, idx) => (
              <a key={idx} href="#" className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-full bg-white/10 transition-all hover:bg-white hover:text-[#01470b]">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="relative mb-[1.5rem] pb-[0.625rem] text-[1.2rem] font-semibold after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-[3.125rem] after:bg-white">
            Navigasi
          </h3>
          <ul className="flex flex-col gap-[0.8rem]">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.href} className={`text-[0.95rem] text-white/80 transition-colors hover:text-white ${isRestricted && link.label === 'Produk' ? 'opacity-50 pointer-events-none' : ''}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="relative mb-[1.5rem] pb-[0.625rem] text-[1.2rem] font-semibold after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-[3.125rem] after:bg-white">
            Kontak
          </h3>
          <ul className="flex flex-col gap-[0.8rem] text-[0.95rem] text-white/80">
            <li className="flex gap-[0.625rem]"><MapPin size={18} /> {profile?.contactAddress || 'Jl. Raya Pangan No. 88, Jakarta'}</li>
            <li className="flex gap-[0.625rem]"><Phone size={18} /> {profile?.contactPhone || '+62 21 5555 8888'}</li>
            <li className="flex gap-[0.625rem]"><Mail size={18} /> {profile?.contactEmail || 'info@panganmasabadi.co.id'}</li>
          </ul>
        </div>
      </div>
      <div className="mt-[3rem] border-t border-white/10 pt-[2rem] flex flex-col items-center gap-[0.5rem] text-[0.9rem] text-white/60">
        <p>&copy; 2026 PT Pangan Mas Abadi. All Rights Reserved.</p>
        <div className="flex items-center gap-[0.35rem] text-[0.75rem]">
          <span className="opacity-70">supported by </span>
          <a href="https://maindi.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[0.35rem] font-bold text-white/80 transition-colors hover:text-white">
            Maindi.id
            <img 
  src="https://lh3.googleusercontent.com/d/1-4t-OyOrBrV3SEdXyMM1fUhCZ9Rq-E1w" 
  alt="Logo Maindi" 
  className="h-[1.5rem] w-[1.5rem] p-[2px] bg-white rounded-full object-contain"
  referrerPolicy="no-referrer"
/>
          </a>
        </div>
      </div>
    </footer>
  );
}
