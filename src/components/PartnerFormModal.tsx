import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, Upload, Save, Building2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';
import { Client } from '../types';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  editingClient: Client | null;
}

export default function PartnerFormModal({ isOpen, onClose, onRefresh, editingClient }: PartnerFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    logo_url: ''
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        logo_url: editingClient.logo_url || ''
      });
      setImage(null);
      setImageSource('url');
    } else {
      setFormData({ name: '', logo_url: '' });
      setImage(null);
      setImageSource('upload');
    }
  }, [editingClient, isOpen]);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
    if (!formData.name) return;
    
    setLoading(true);
    try {
      let finalLogoUrl = formData.logo_url;

      if (imageSource === 'upload' && image && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
        const uploadFormData = new FormData();
        uploadFormData.append('image', croppedBlob, 'partner_logo.jpg');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        });
        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.imageUrl;
      }

      if (!finalLogoUrl && imageSource === 'url') {
         Swal.fire({ title: 'Error', text: 'Logo URL is required', icon: 'error' });
         setLoading(false);
         return;
      }
      
      const method = editingClient ? 'PUT' : 'POST';
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          logo_url: finalLogoUrl
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan partner');

      onClose();
      onRefresh();
      
      Swal.fire({
        title: 'Berhasil!',
        text: editingClient ? 'Partner berhasil diperbarui.' : 'Partner baru telah ditambahkan.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    } catch (error) {
      console.error('Submit Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Gagal menyimpan partner.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-[1rem] sm:p-[2rem]">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[50rem] max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-gray-100 bg-white p-[1.5rem] sm:p-[2.5rem] shadow-2xl"
          >
            <div className="mb-[2rem] flex items-center justify-between">
              <div>
                <h4 className="text-[1.5rem] font-bold text-gray-900">
                  {editingClient ? 'Edit Partner' : 'Tambah Partner Baru'}
                </h4>
                <p className="text-[0.875rem] text-gray-500">Logo partner akan tampil di running gallery.</p>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-full p-[0.5rem] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-[2.5rem] lg:grid-cols-2">
              <div className="flex flex-col gap-[1rem]">
                <div className="flex items-center justify-between">
                  <label className="text-[0.875rem] font-semibold text-gray-700">Logo Partner (1:1)</label>
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

                <div className="relative group h-[18.75rem] w-full overflow-hidden rounded-[1rem] bg-gray-100 border-2 border-dashed border-gray-200">
                  {imageSource === 'upload' ? (
                    image ? (
                      <>
                        <Cropper
                          image={image}
                          crop={crop}
                          zoom={zoom}
                          aspect={1 / 1}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                        />
                        <div className="absolute bottom-[1rem] right-[1rem] z-10">
                          <label 
                            htmlFor="partner-modal-upload"
                            className="flex cursor-pointer items-center gap-[0.5rem] rounded-[0.5rem] bg-black/60 px-[1rem] py-[0.5rem] text-[0.75rem] font-bold text-white backdrop-blur-md transition-all hover:bg-black/80"
                          >
                            <Upload size={14} /> Ganti Logo
                          </label>
                        </div>
                      </>
                    ) : (
                      <label 
                        htmlFor="partner-modal-upload"
                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-[1rem] transition-colors hover:bg-gray-50"
                      >
                        <div className="rounded-full bg-primary/10 p-[1.5rem] text-primary">
                          <Upload size={32} />
                        </div>
                        <div className="text-center px-4">
                          <p className="text-[1rem] font-bold text-gray-900">Upload Logo Partner</p>
                          <p className="text-[0.75rem] text-gray-500">Format JPG/PNG, Max 2MB</p>
                        </div>
                      </label>
                    )
                  ) : (
                    <div className="flex flex-col h-full bg-white p-6">
                      <div className="mb-4 flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo URL</label>
                        <div className="flex gap-2">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200">
                             <LinkIcon size={18} />
                           </div>
                           <input 
                            type="url"
                            value={formData.logo_url}
                            onChange={e => setFormData({...formData, logo_url: e.target.value})}
                            placeholder="https://example.com/logo.png"
                            className="flex-1 rounded-lg border border-gray-200 px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                           />
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-8">
                        {formData.logo_url ? (
                          <img 
                            src={formData.logo_url} 
                            alt="Preview" 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Invalid+Logo+URL';
                            }}
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <Building2 size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Preview Logo</p>
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
                    id="partner-modal-upload" 
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

              <div className="flex flex-col justify-between py-[0.5rem]">
                <div className="space-y-[1.5rem]">
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Nama Partner</label>
                    <input 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                      placeholder="Contoh: PT Swakarya Utama"
                    />
                  </div>
                </div>

                <div className="pt-[2rem]">
                  <button 
                    type="submit" 
                    disabled={loading || !formData.name}
                    className="flex w-full items-center justify-center gap-[0.75rem] rounded-[1rem] bg-primary py-[1.25rem] text-[1.1rem] font-bold text-white shadow-xl transition-all hover:bg-primary/90 hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Memproses...
                      </span>
                    ) : (
                      <><Save size={20} /> {editingClient ? 'Simpan Perubahan' : 'Terbitkan Partner'}</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
