import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CompanyProfile } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageLoading from '../components/PageLoading';

const INITIAL_DATA: CompanyProfile = {
  heroTitle: 'Profil Perusahaan',
  heroTitleColor: '#ffffff',
  heroSubtitle: 'Membangun Masa Depan Pertanian Indonesia',
  heroSubtitleColor: '#ffffff',
  heroImage: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=2000',
  aboutTitle: 'Tentang Kami',
  aboutContent: '<p>PT Pangan Mas Abadi adalah pemimpin dalam inovasi pertanian dan distribusi pangan di Indonesia. Selama lebih dari satu dekade, kami telah berkomitmen untuk memberdayakan petani lokal melalui teknologi modern, penyediaan benih berkualitas tinggi, dan dukungan teknis yang tak tertandingi di lapangan.</p><p>Kami percaya bahwa kedaulatan pangan dimulai dari tanah yang subur dan petani yang sejahtera. Oleh karena itu, setiap langkah yang kami ambil didorong oleh misi untuk meningkatkan produktivitas pertanian nasional tanpa mengesampingkan keberlanjutan lingkungan.</p>',
  visionTitle: 'Visi Kami',
  visionText: '<p>Menjadi mitra terpercaya bagi petani Indonesia dalam mewujudkan kemandirian pangan melalui inovasi berkelanjutan dan penyediaan solusi pertanian terpadu.</p>',
  missionTitle: 'Misi Kami',
  missionContent: '<ul><li>Mengembangkan teknologi pertanian yang adaptif dan efisien.</li><li>Menjamin ketersediaan sarana produksi pertanian berkualitas.</li><li>Memberikan edukasi dan pendampingan berkelanjutan bagi komunitas petani.</li><li>Membangun ekosistem distribusi pangan yang transparan dan adil.</li></ul>'
};

export default function CompanyProfileDetail() {
  const [profile, setProfile] = useState<CompanyProfile>(INITIAL_DATA);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-[5rem]">
          <PageLoading />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-[5rem]">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
          <img 
            src={profile.heroImage} 
            alt="Agriculture field" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 
                className="text-[3rem] font-black tracking-tight md:text-[5rem]"
                style={{ color: profile.heroTitleColor || '#ffffff' }}
              >
                {profile.heroTitle}
              </h1>
              <p 
                className="mt-4 text-xl opacity-90"
                style={{ color: profile.heroSubtitleColor || '#ffffff' }}
              >
                {profile.heroSubtitle}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-gray-50/50 py-[5rem]">
          <div className="mx-auto max-w-[60rem] px-[2rem]">
            <div className="flex flex-col gap-[4rem]">
              {/* About */}
              <div className="overflow-hidden break-words bg-white rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm">
                <h2 className="text-[2.5rem] font-bold tracking-tight text-gray-900 mb-6">{profile.aboutTitle}</h2>
                <div 
                  className="prose prose-lg text-gray-600 max-w-none prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                  dangerouslySetInnerHTML={{ __html: profile.aboutContent }}
                />
                {profile.portfolioLink && (
                  <a 
                    href={profile.portfolioLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-8 bg-[#01470b] text-white px-6 py-3 rounded-full font-bold hover:bg-[#026312] transition-colors"
                  >
                    Lihat Portfolio Resmi
                  </a>
                )}
              </div>

              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm overflow-hidden break-words bg-white">
                  <h3 className="text-2xl font-bold text-[#01470b] mb-4">{profile.visionTitle}</h3>
                  <div 
                    className="prose prose-lg text-gray-600 max-w-none prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                    dangerouslySetInnerHTML={{ __html: profile.visionText }}
                  />
                </div>
                <div className="rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm overflow-hidden break-words bg-white">
                  <h3 className="text-2xl font-bold text-[#01470b] mb-4">{profile.missionTitle}</h3>
                  <div 
                    className="prose prose-sm text-gray-600 max-w-none prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                    dangerouslySetInnerHTML={{ __html: profile.missionContent }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
