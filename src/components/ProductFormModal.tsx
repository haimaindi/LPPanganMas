import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Plus, Trash2, X, Upload, Save, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';
import { Product } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  editingProduct: Product | null;
  allProducts: Product[];
}

export default function ProductFormModal({ isOpen, onClose, onRefresh, editingProduct, allProducts }: ProductFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    specs: '',
    image_url: '',
    badge: '',
    isPromote: false,
    isActive: true,
    order: 0
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        title: editingProduct.title,
        category: editingProduct.category,
        specs: editingProduct.specs,
        image_url: editingProduct.image_url || '',
        badge: editingProduct.badge || '',
        isPromote: editingProduct.isPromote || false,
        isActive: typeof editingProduct.isActive === 'boolean' ? editingProduct.isActive : true,
        order: editingProduct.order || 0
      });
      // If editing and has image, we show the URL option by default if it looks like a URL
      // but actually, we don't know if it's from upload or url just by looking at it.
      // Let's just reset image states.
      setImage(null);
      setImageSource('url');
    } else {
      setFormData({ title: '', category: '', specs: '', image_url: '', badge: '', isPromote: false, isActive: true, order: 0 });
      setImage(null);
      setImageSource('upload');
    }
  }, [editingProduct, isOpen]);

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
    
    if (formData.isPromote) {
      const promotedCount = allProducts.filter(p => p.isPromote && p.id !== editingProduct?.id).length;
      if (promotedCount >= 6) {
        Swal.fire({ title: 'Error', text: 'Maksimal 6 produk yang bisa dipromosikan.', icon: 'error' });
        return;
      }
    }

    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;

      if (imageSource === 'upload' && image && croppedAreaPixels) {
        // 1. Get cropped image blob
        const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
        
        // 2. Upload to Tigris
        const uploadFormData = new FormData();
        uploadFormData.append('image', croppedBlob, 'product.jpg');
        
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
      
      if (!finalImageUrl && imageSource === 'upload' && !image && !editingProduct) {
         Swal.fire({ title: 'Error', text: 'Please upload an image', icon: 'error' });
         setLoading(false);
         return;
      }

      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

      // 3. Save/Update Product
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          image_url: finalImageUrl
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan produk');

      // Cleanup
      onClose();
      onRefresh();
      
      Swal.fire({
        title: 'Berhasil!',
        text: editingProduct ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    } catch (error) {
      console.error('Submit Error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Gagal menyimpan produk.',
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
            className="relative w-full max-w-[64rem] max-h-[90vh] overflow-y-auto rounded-[1.5rem] border border-gray-100 bg-white p-[1.5rem] sm:p-[2.5rem] shadow-2xl"
          >
            <div className="mb-[2rem] flex items-center justify-between">
              <div>
                <h4 className="text-[1.5rem] font-bold text-gray-900">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h4>
                <p className="text-[0.875rem] text-gray-500">Lengkapi detail produk di bawah ini.</p>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-full p-[0.5rem] text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-[2.5rem] lg:grid-cols-2">
              {/* Left Column: Image & Cropping */}
              <div className="flex flex-col gap-[1rem]">
                <div className="flex items-center justify-between">
                  <label className="text-[0.875rem] font-semibold text-gray-700">Foto Produk (1:1)</label>
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
                          aspect={1 / 1}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                        />
                        <div className="absolute bottom-[1rem] right-[1rem] z-10">
                          <label 
                            htmlFor="product-upload"
                            className="flex cursor-pointer items-center gap-[0.5rem] rounded-[0.5rem] bg-black/60 px-[1rem] py-[0.5rem] text-[0.75rem] font-bold text-white backdrop-blur-md transition-all hover:bg-black/80"
                          >
                            <Upload size={14} /> Ganti Foto
                          </label>
                        </div>
                      </>
                    ) : (
                      <label 
                        htmlFor="product-upload"
                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-[1rem] transition-colors hover:bg-gray-50"
                      >
                        <div className="rounded-full bg-primary/10 p-[1.5rem] text-primary">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-[1rem] font-bold text-gray-900">Upload Foto Produk</p>
                          <p className="text-[0.75rem] text-gray-500">Klik untuk memilih file</p>
                        </div>
                      </label>
                    )
                  ) : (
                    <div className="flex flex-col h-full bg-white p-6">
                      <div className="mb-4 flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Public Image URL</label>
                        <div className="flex gap-2">
                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 border border-gray-200">
                             <LinkIcon size={18} />
                           </div>
                           <input 
                            type="url"
                            value={formData.image_url}
                            onChange={e => setFormData({...formData, image_url: e.target.value})}
                            placeholder="https://example.com/image.jpg"
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
                              (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Invalid+Image+URL';
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
                    id="product-upload" 
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
                <div className="grid grid-cols-2 gap-[1rem]">
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Nama Produk</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Beras Premium"
                    />
                  </div>
                  <div className="flex flex-col gap-[0.5rem]">
                    <label className="text-[0.875rem] font-semibold text-gray-700">Kategori</label>
                    <input 
                      required
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Sembako"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-[0.5rem]">
                   <label className="text-[0.875rem] font-semibold text-gray-700">Badge (Opsional)</label>
                   <input 
                    value={formData.badge}
                    onChange={e => setFormData({...formData, badge: e.target.value})}
                    className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Best Seller, New Arrival"
                  />
                </div>

                <div className="flex flex-col gap-[0.5rem]">
                  <label className="text-[0.875rem] font-semibold text-gray-700">Spesifikasi / Deskripsi</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.specs}
                    onChange={e => setFormData({...formData, specs: e.target.value})}
                    className="rounded-[0.75rem] border border-gray-200 bg-gray-50 px-[1.25rem] py-[0.875rem] outline-none transition-all focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
                    placeholder="Detail produk..."
                  />
                </div>

                <div className="pt-[1rem]">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-[0.75rem] rounded-[1rem] bg-primary py-[1.25rem] text-[1.1rem] font-bold text-white shadow-xl transition-all hover:bg-primary/90 hover:shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Memproses...
                      </span>
                    ) : (
                      <><Save size={20} /> {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}</>
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
