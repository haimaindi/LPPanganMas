import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, ArrowLeft, Upload, Loader2, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyProfile } from '../types';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

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

export default function CompanyProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<CompanyProfile>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profileData = await response.json();
          setData(profileData);
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const result = await Swal.fire({
      title: 'Simpan Perubahan?',
      text: 'Data profil perusahaan akan diperbarui di database.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      confirmButtonText: 'Ya, Simpan!'
    });

    if (result.isConfirmed) {
      setSaving(true);
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          Swal.fire('Berhasil!', 'Profil perusahaan telah diperbarui.', 'success');
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        console.error("Profile Update Error:", error);
        Swal.fire('Error!', 'Gagal memperbarui profil.', 'error');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          setData({ ...data, heroImage: result.imageUrl });
          Swal.fire('Berhasil!', 'Gambar berhasil diunggah.', 'success');
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Upload Error:', error);
        Swal.fire('Error!', 'Gagal mengunggah gambar.', 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#01470b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[#01470b] text-white sticky top-0 z-50 shadow-md">
        <div className="mx-auto max-w-[90rem] px-[2rem] py-[1rem] flex items-center justify-between">
          <div className="flex items-center gap-[2.5rem]">
            <Link to="/admin" className="flex items-center gap-[0.5rem] text-white/80 hover:text-white transition-colors text-[0.875rem] font-medium">
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
            <div className="h-[1.5rem] w-[1px] bg-white/20 hidden sm:block" />

          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-[0.5rem] bg-[#F59400] text-White px-[1.25rem] py-[0.625rem] rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 text-[0.9rem]"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </header>

      <main className="">
        {/* Hero Section - EDITABLE */}
        <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden group">
          <img 
            src={data.heroImage} 
            alt="Agriculture field" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-8 text-white">
            <div className="text-center w-full max-w-4xl space-y-4 overflow-hidden break-words">
              <div className="flex flex-col items-center">
                <input 
                  type="text"
                  value={data.heroTitle}
                  onChange={(e) => setData({...data, heroTitle: e.target.value})}
                  style={{ color: data.heroTitleColor || '#ffffff' }}
                  className="w-full bg-transparent text-center text-[3rem] font-black tracking-tight border-none outline-none focus:ring-0 md:text-[5rem] break-words"
                  placeholder="Masukkan Judul Hero..."
                />
                <input 
                  type="color" 
                  value={data.heroTitleColor || '#ffffff'}
                  onChange={(e) => setData({...data, heroTitleColor: e.target.value})}
                  className="w-8 h-8 rounded-full border-2 border-white/50 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                  title="Warna Judul"
                />
              </div>
              <div className="flex flex-col items-center">
                <input 
                  type="text"
                  value={data.heroSubtitle}
                  onChange={(e) => setData({...data, heroSubtitle: e.target.value})}
                  style={{ color: data.heroSubtitleColor || '#ffffff' }}
                  className="w-full bg-transparent text-center text-xl opacity-90 border-none outline-none focus:ring-0 break-words"
                  placeholder="Masukkan Subjudul Hero..."
                />
                <input 
                  type="color" 
                  value={data.heroSubtitleColor || '#ffffff'}
                  onChange={(e) => setData({...data, heroSubtitleColor: e.target.value})}
                  className="w-6 h-6 rounded-full border-2 border-white/50 cursor-pointer overflow-hidden p-0 bg-transparent shrink-0"
                  title="Warna Subjudul"
                />
              </div>
            </div>
          </div>
          {/* Image Editor */}
          <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/30 text-sm hover:bg-white/40 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {uploading ? 'Mengunggah...' : 'Ganti Background'}
            </button>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-[60rem] px-[2rem] py-[5rem]">
          <div className="flex flex-col gap-[5rem]">
            {/* About Article - EDITABLE */}
            <div>
              <input 
                type="text"
                value={data.aboutTitle}
                onChange={(e) => setData({...data, aboutTitle: e.target.value})}
                className="w-full text-[2.5rem] font-bold tracking-tight text-gray-900 mb-6 border-none outline-none focus:ring-0 p-0"
                placeholder="Judul Tentang Kami..."
              />
              <div className="admin-rich-editor">
                <ReactQuill 
                  theme="snow"
                  value={data.aboutContent}
                  onChange={(val) => setData({...data, aboutContent: val})}
                  modules={quillModules}
                />
              </div>
            </div>

            {/* Vision & Mission - EDITABLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm bg-white flex flex-col">
                <input 
                  type="text"
                  value={data.visionTitle}
                  onChange={(e) => setData({...data, visionTitle: e.target.value})}
                  className="w-full text-2xl font-bold text-[#01470b] mb-4 border-none outline-none focus:ring-0 p-0"
                  placeholder="Judul Visi..."
                />
                <div className="flex-1 admin-rich-editor small-editor">
                  <ReactQuill 
                    theme="snow"
                    value={data.visionText}
                    onChange={(val) => setData({...data, visionText: val})}
                    modules={quillModules}
                  />
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm bg-white flex flex-col">
                <input 
                  type="text"
                  value={data.missionTitle}
                  onChange={(e) => setData({...data, missionTitle: e.target.value})}
                  className="w-full text-2xl font-bold text-[#01470b] mb-4 border-none outline-none focus:ring-0 p-0"
                  placeholder="Judul Misi..."
                />
                <div className="flex-1 admin-rich-editor small-editor">
                  <ReactQuill 
                    theme="snow"
                    value={data.missionContent}
                    onChange={(val) => setData({...data, missionContent: val})}
                    modules={quillModules}
                  />
                </div>
              </div>
            </div>
            {/* Portfolio Link Section */}
            <div className="rounded-[1.5rem] border border-gray-100 p-[2rem] shadow-sm bg-white">
              <label className="block text-sm font-bold text-gray-700 mb-2">Link Dokumen Portofolio (Opsional)</label>
              <input 
                type="url"
                value={data.portfolioLink || ''}
                onChange={(e) => setData({...data, portfolioLink: e.target.value})}
                className="w-full p-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#01470b]"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
