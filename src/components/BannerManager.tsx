import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, X, Upload, Edit2, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';
import { Slide } from '../types';

interface BannerManagerProps {
  slides: Slide[];
  onRefresh: () => void;
}

export default function BannerManager({ slides, onRefresh }: BannerManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    cta_text: 'Lihat Produk',
    cta_url: '#produk',
    image_url: ''
  });

  useEffect(() => {
    if (editingSlide) {
      setFormData({
        title: editingSlide.title,
        subtitle: editingSlide.subtitle,
        cta_text: editingSlide.cta_text,
        cta_url: editingSlide.cta_url,
        image_url: editingSlide.image_url || ''
      });
      setImage(null);
      setImageSource('url');
    } else {
      setFormData({ title: '', subtitle: '', cta_text: 'Lihat Produk', cta_url: '#produk', image_url: '' });
      setImage(null);
      setImageSource('upload');
    }
  }, [editingSlide, isAdding]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleEdit = (slide: Slide) => {
    setEditingSlide(slide);
    setIsAdding(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImage(reader.result as string);
        setImageSource('upload');
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (error) => reject(error));
      img.setAttribute('crossOrigin', 'anonymous');
      img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (imageSource === 'upload' && image && croppedAreaPixels) {
        // 1. Get cropped image blob
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
        
        // 2. Upload to Tigris
        const uploadFormData = new FormData();
        uploadFormData.append('image', croppedBlob, 'banner.jpg');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.imageUrl;
      }

      if (!finalImageUrl && imageSource === 'url') {
        Swal.fire({ title: 'Error', text: 'Image URL is required', icon: 'error' });
        setLoading(false);
        return;
      }

      if (!finalImageUrl && imageSource === 'upload' && !image && !editingSlide) {
        Swal.fire({ title: 'Error', text: 'Please upload an image', icon: 'error' });
        setLoading(false);
        return;
      }

      const method = editingSlide ? 'PUT' : 'POST';
      const url = editingSlide ? `/api/slides/${editingSlide.id}` : '/api/slides';

      // 3. Save/Update Slide
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: finalImageUrl
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan banner');

      // Cleanup
      setIsAdding(false);
      setEditingSlide(null);
      setImage(null);
      onRefresh();
      
      Swal.fire({
        title: 'Berhasil!',
        text: editingSlide ? 'Banner berhasil diperbarui.' : 'Banner baru telah diterbitkan.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    } catch (error) {
      console.error('Submit Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Gagal menyimpan banner.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (slides.length <= 1) {
      Swal.fire({
        title: 'Tidak Bisa Menghapus!',
        text: 'Aplikasi membutuhkan minimal satu banner aktif untuk ditampilkan.',
        icon: 'error',
        confirmButtonColor: '#01470b',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Hapus Banner?',
      text: "Banner ini akan hilang dari halaman utama!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      await fetch(`/api/slides/${id}`, { method: 'DELETE' });
      onRefresh();
      Swal.fire({
        title: 'Terhapus!',
        text: 'Banner telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    }
  };

  return (
    <div className="space-y-[2.5rem]">
      {!isAdding && slides.length < 3 && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[1.25rem] font-bold text-gray-900">Active Banners</h3>
            <p className="text-[0.875rem] text-gray-500">Maksimum 3 banner aktif yang ditampilkan di halaman utama.</p>
          </div>
          <button 
            onClick={() => { setIsAdding(true); setEditingSlide(null); }}
            className="flex items-center gap-[0.5rem] rounded-[0.5rem] bg-[#01470b] px-[1.5rem] py-[0.75rem] font-semibold text-white shadow-lg transition-all hover:bg-[#026312]"
          >
            <Plus size={20} /> Add Banner
          </button>
        </div>
      )}

      {/* Modal Form */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-[1rem] sm:p-[2rem]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAdding(false); setEditingSlide(null); setImage(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[64rem] max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-gray-100 bg-white p-[1.5rem] sm:p-[2.5rem] shadow-2xl"
            >
              <div className="mb-[2rem] flex items-center justify-between">
                <div>
                  <h4 className="text-[1.5rem] font-bold text-gray-900">
                    {editingSlide ? 'Edit Banner' : 'Tambah Banner Baru'}
                  </h4>
                  <p className="text-[0.875rem] text-gray-500">Lengkapi detail banner di bawah ini.</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingSlide(null); setImage(null); }} 
                  className="rounded-full p-[0.5rem] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-[2.5rem] lg:grid-cols-2">
                {/* Left Column: Image & Cropping */}
                <div className="flex flex-col gap-[1rem]">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Banner Image (16:9)</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setImageSource('upload')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${imageSource === 'upload' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageSource('url')}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${imageSource === 'url' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  <div className="relative group h-[20rem] sm:h-[25rem] w-full overflow-hidden rounded-[1rem] bg-gray-100 border-2 border-dashed border-gray-200">
                    {imageSource === 'upload' ? (
                      image ? (
                        <>
                          <Cropper
                            image={image}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                          <div className="absolute bottom-[1rem] right-[1rem] z-10">
                            <label 
                              htmlFor="banner-upload"
                              className="flex cursor-pointer items-center gap-[0.5rem] rounded-[0.5rem] bg-black/60 px-[1rem] py-[0.5rem] text-[0.75rem] font-bold text-white backdrop-blur-md transition-all hover:bg-black/80"
                            >
                              <Upload size={14} /> Ganti Foto
                            </label>
                          </div>
                        </>
                      ) : editingSlide ? (
                        <div className="relative h-full w-full">
                          <img src={editingSlide.image_url} alt="" className="h-full w-full object-cover opacity-50" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
                            <label 
                              htmlFor="banner-upload"
                              className="flex cursor-pointer flex-col items-center gap-[1rem] rounded-[1rem] bg-white/90 px-[2rem] py-[1.5rem] shadow-xl transition-transform hover:scale-105"
                            >
                              <Upload size={32} className="text-primary" />
                              <span className="font-bold text-primary">Klik untuk Ganti Foto</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label 
                          htmlFor="banner-upload"
                          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-[1rem] transition-colors hover:bg-gray-50"
                        >
                          <div className="rounded-full bg-primary/10 p-[1.5rem] text-primary">
                            <Upload size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-[1rem] font-bold text-gray-900">Pilih Foto Banner</p>
                            <p className="text-[0.75rem] text-gray-500">Rekomendasi ukuran 1920x1080 px</p>
                          </div>
                        </label>
                      )
                    ) : (
                      <div className="flex flex-col h-full bg-white p-6">
                        <div className="mb-4 flex flex-col gap-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Public Image URL</label>
                          <div className="flex gap-2">
                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200">
                               <ImageIcon size={18} />
                             </div>
                             <input 
                              type="url"
                              value={formData.image_url}
                              onChange={e => setFormData({...formData, image_url: e.target.value})}
                              placeholder="https://example.com/banner.jpg"
                              className="flex-1 rounded-lg border border-gray-200 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                             />
                          </div>
                        </div>
                        <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
                          {formData.image_url ? (
                            <img 
                              src={formData.image_url} 
                              alt="Preview" 
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/1920x1080?text=Invalid+Image+URL';
                              }}
                            />
                          ) : (
                            <div className="text-center text-gray-400">
                              <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                              <p className="text-sm">Preview akan muncul di sini</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="hidden" 
                      id="banner-upload" 
                    />
                  </div>

                  {imageSource === 'upload' && image && (
                    <div className="flex items-center gap-[1rem] rounded-[0.75rem] bg-gray-50 p-[1rem]">
                      <span className="text-[0.75rem] font-bold text-gray-500 uppercase tracking-wider">Zoom</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Right Column: Details */}
                <div className="space-y-[1.5rem]">
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Judul Utama</label>
                    <input 
                      required
                      maxLength={100}
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                      placeholder="Contoh: Kualitas Pangan Terbaik"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Sub-judul / Deskripsi</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.subtitle}
                      onChange={e => setFormData({...formData, subtitle: e.target.value})}
                      className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                      placeholder="Deskripsi singkat yang muncul di bawah judul..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-[1rem]">
                    <div className="flex flex-col gap-[0.5rem]">
                      <label className="text-[0.875rem] font-semibold text-gray-700">Teks Tombol (CTA)</label>
                      <input 
                        required
                        maxLength={25}
                        value={formData.cta_text}
                        onChange={e => setFormData({...formData, cta_text: e.target.value})}
                        className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        placeholder="Lihat Produk"
                      />
                    </div>
                    <div className="flex flex-col gap-[0.5rem]">
                      <label className="text-[0.875rem] font-semibold text-gray-700">Link Tujuan</label>
                      <input 
                        required
                        value={formData.cta_url}
                        onChange={e => setFormData({...formData, cta_url: e.target.value})}
                        className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        placeholder="#produk atau URL..."
                      />
                    </div>
                  </div>

                  <div className="pt-[1rem]">
                    <button 
                      type="submit" 
                      disabled={loading || (!editingSlide && !image && imageSource === 'upload') || (imageSource === 'url' && !formData.image_url)}
                      className="flex w-full items-center justify-center gap-[0.75rem] rounded-[1rem] bg-primary py-[1.25rem] text-[1.1rem] font-bold text-white shadow-xl transition-all hover:bg-primary/90 hover:shadow-primary/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Memproses...
                        </span>
                      ) : (
                        <><Save size={20} /> {editingSlide ? 'Simpan Perubahan' : 'Terbitkan Banner'}</>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide) => (
          <div key={slide.id} className={`group relative overflow-hidden rounded-[1.25rem] border bg-white shadow-md transition-all hover:shadow-xl ${editingSlide?.id === slide.id ? 'border-primary ring-2 ring-primary' : 'border-gray-100'}`}>
            <div className="relative h-[12.5rem] w-full overflow-hidden">
              <img src={slide.image_url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute top-[1rem] right-[1rem] z-10 flex gap-[0.5rem] opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  onClick={() => handleEdit(slide)}
                  className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full bg-white text-primary shadow-lg transition-transform hover:scale-110"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(slide.id)}
                  className={`flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 ${
                    slides.length <= 1 
                    ? 'bg-gray-400 text-white/50 cursor-not-allowed' 
                    : 'bg-red-500 text-white'
                  }`}
                  title={slides.length <= 1 ? "Minimal 1 banner harus aktif" : "Hapus Banner"}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-[1.5rem]">
              <h5 className="mb-[0.5rem] line-clamp-1 font-bold text-gray-900">{slide.title}</h5>
              <p className="mb-[1.25rem] line-clamp-2 text-[0.875rem] text-gray-500">{slide.subtitle}</p>
              <div className="flex items-center justify-between border-t border-gray-50 pt-[1.25rem]">
                <span className="text-[0.75rem] font-bold text-primary uppercase tracking-wider">{slide.cta_text}</span>
                <span className="text-[0.75rem] text-gray-400 font-mono truncate max-w-[10rem]">{slide.cta_url}</span>
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && !isAdding && (
          <div className="col-span-full py-[5rem] text-center">
            <ImageIcon className="mx-auto mb-[1rem] text-gray-200" size={64} />
            <p className="text-gray-400">Belum ada banner yang dikonfigurasi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
