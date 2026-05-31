import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CompanyProfile as ProfileType } from '../types';

export default function CompanyProfile() {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Helper to strip HTML tags and decode common entities for plain text display
  const stripHtml = (html: string) => {
    const tmp = html.replace(/<[^>]*>?/gm, '');
    // Decode common entities like &nbsp;
    return tmp.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  };

  if (loading || !profile) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#01470b] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/50 border-t border-gray-100">
      <section className="mx-auto max-w-[85rem] px-[1.5rem] sm:px-[3rem] py-[8rem] lg:py-[10rem]">
        {/* Header and Hero Image Split */}
        <div className="flex flex-col lg:flex-row gap-[4rem] lg:gap-[6rem] items-center mb-[6rem]">
        
        <div className="w-full lg:w-[45%] flex flex-col gap-[2.5rem]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="text-[3rem] text-[#01470b] lg:text-[4.5rem] font-black leading-[1.05] tracking-tight text-gray-900 break-words">
              {profile.heroTitle}
            </h2>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <p className="text-[1.125rem] lg:text-[1.25rem] text-gray-500 font-medium leading-relaxed max-w-[35rem]">
              Inovasi tiada henti untuk memberikan solusi agrikultur berkelanjutan bagi bangsa dan masa depan yang lebih hijau.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            <Link to="/profil" className="group relative inline-flex items-center gap-[1rem] rounded-full bg-gray-900 px-[2.5rem] py-[1.25rem] font-bold text-white overflow-hidden transition-all hover:bg-[#01470b]">
              <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-2">Jelajahi Profil</span>
              <span className="relative z-10 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                →
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-[55%] relative"
        >
          <div className="absolute inset-0 -translate-x-4 translate-y-4 rounded-[2rem] bg-[#01470b]/10 -z-10" />
          <div className="aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-2xl">
            <img 
              src={profile.heroImage} 
              alt="Agriculture solutions" 
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
          </div>
        </motion.div>

      </div>

      {/* Description Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[4rem] lg:gap-[8rem] items-start">
        {/* Left: Vision */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="relative pt-[2rem]"
        >
          <div className="absolute top-0 left-0 w-[3rem] h-[0.25rem] bg-[#01470b] rounded-full" />
          <h3 className="mb-[1.5rem] text-[0.875rem] font-bold uppercase tracking-[0.2em] text-gray-400">Visi Kami</h3>
          <p className="text-[1.5rem] lg:text-[1.75rem] font-medium leading-[1.4] text-gray-900 tracking-tight">
            {stripHtml(profile.visionText)}
          </p>
        </motion.div>
        
        {/* Right: Description (Truncated) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          className="relative pt-[2rem]"
        >
          <div className="absolute top-0 left-0 w-[3rem] h-[0.25rem] bg-gray-200 rounded-full" />
          <h3 className="mb-[1.5rem] text-[0.875rem] font-bold uppercase tracking-[0.2em] text-gray-400">Tentang Kami</h3>
          <p className="text-[1.125rem] leading-[1.8] text-gray-600 line-clamp-5">
            {stripHtml(profile.aboutContent)}
          </p>
        </motion.div>
      </div>
    </section>
    </div>
  );
}
