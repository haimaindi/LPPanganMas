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
    <section className="mx-auto max-w-[75rem] px-[2rem] py-[5rem]">
      {/* Header */}
      <div className="mb-[3rem] flex flex-col justify-between gap-[1.5rem] md:flex-row md:items-start">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[40rem] text-[2.5rem] leading-[1.1] font-black tracking-tight text-black md:text-[3.5rem] break-words"
        >
          {profile.heroTitle}
        </motion.h2>
        <Link to="/profil">
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex h-fit items-center gap-[0.5rem] rounded-full bg-[#01470b] px-[1.5rem] py-[0.625rem] font-semibold text-white transition-all hover:bg-[#01600f] active:scale-95 shrink-0"
          >
            Profil
          </motion.button>
        </Link>
      </div>

      {/* Main Image */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="relative mb-[3rem] aspect-[16/9] overflow-hidden rounded-[1.5rem]"
      >
        <img 
          src={profile.heroImage} 
          alt="Agriculture solutions" 
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </motion.div>

      {/* Description Columns */}
      <div className="grid grid-cols-1 gap-[3rem] md:grid-cols-2">
        {/* Left: Vision */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="overflow-hidden break-words"
        >
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#01470b]">Vision</h3>
          <p className="text-[1.25rem] font-medium leading-relaxed text-black">
            {stripHtml(profile.visionText)}
          </p>
        </motion.div>
        
        {/* Right: Description (Truncated) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="overflow-hidden break-words"
        >
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#01470b]">About Us</h3>
          <p className="text-[1rem] leading-[1.6] text-black line-clamp-4">
            {stripHtml(profile.aboutContent)}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
