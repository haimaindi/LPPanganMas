import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Save, MapPin, Phone, Mail, Image as ImageIcon, Trash2, Plus, CheckCircle, X, Building2, LayoutDashboard, Edit2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import PhotoGalleryPopup from '../components/PhotoGalleryPopup';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Swal from 'sweetalert2';
import { Branch, BranchGalleryItem } from '../types';

import PageLoading from '../components/PageLoading';

// Fix for Leaflet default icon issues in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface BranchWithGallery extends Branch {
  gallery: BranchGalleryItem[];
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
    },
  });

  return (
    <Marker position={position} />
  );
}

export default function AdminBranchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    lat: -7.4706,
    lng: 110.2178,
    whatsapp_pilihan: ''
  });

  const [gallery, setGallery] = useState<BranchGalleryItem[]>([]);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<BranchGalleryItem | null>(null);
  const [showGalleryAdd, setShowGalleryAdd] = useState(false);
  const [showGalleryEdit, setShowGalleryEdit] = useState(false);

  const [newGalleryItem, setNewGalleryItem] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  const [editGalleryItem, setEditGalleryItem] = useState({
    title: '',
    description: '',
    image_url: ''
  });

  useEffect(() => {
    fetchBranch();
  }, [id]);

  const fetchBranch = async () => {
    try {
      const res = await fetch(`/api/branches/${id}`);
      if (!res.ok) throw new Error('Failed to fetch branch');
      const data: BranchWithGallery = await res.json();
      setFormData({
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        whatsapp_pilihan: data.whatsapp_pilihan || ''
      });
      setGallery(data.gallery);
      setLoading(false);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal mengambil data cabang', 'error');
      navigate('/admin');
    }
  };

  const handleReverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleSetPosition = (pos: [number, number]) => {
    setFormData(prev => ({ ...prev, lat: pos[0], lng: pos[1] }));
    handleReverseGeocode(pos[0], pos[1]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Update failed');
      
      Swal.fire({
        title: 'Berhasil!',
        text: 'Data cabang berhasil diperbarui',
        icon: 'success',
        confirmButtonColor: '#01470b'
      });
    } catch (error) {
      Swal.fire('Error', 'Gagal menyimpan perubahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/branches/${id}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGalleryItem)
      });
      
      if (!res.ok) throw new Error('Add failed');
      
      setNewGalleryItem({ title: '', description: '', image_url: '' });
      setShowGalleryAdd(false);
      fetchBranch();
      Swal.fire('Berhasil', 'Foto galeri ditambahkan', 'success');
    } catch (error) {
      Swal.fire('Error', 'Gagal menambah galeri', 'error');
    }
  };

  const handleEditGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    console.log("Submitting edit for:", editingGalleryItem.id, editGalleryItem);
    try {
      const res = await fetch(`/api/branches/gallery/${editingGalleryItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGalleryItem)
      });
      
      console.log("Edit response status:", res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Edit error data:", errorData);
        throw new Error(errorData.error || 'Update failed');
      }
      
      setEditGalleryItem({ title: '', description: '', image_url: '' });
      setEditingGalleryItem(null);
      setShowGalleryEdit(false);
      fetchBranch();
      Swal.fire('Berhasil', 'Foto galeri diperbarui', 'success');
    } catch (error) {
      console.error("Edit gallery error:", error);
      Swal.fire('Error', 'Gagal memperbarui galeri', 'error');
    }
  };

  const handleDeleteGallery = async (galleryId: number) => {
    const result = await Swal.fire({
      title: 'Hapus foto ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      confirmButtonText: 'Hapus'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/branches/gallery/${galleryId}`, { method: 'DELETE' });
        fetchBranch();
      } catch (err) {
        Swal.fire('Error', 'Gagal menghapus', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
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
            form="branch-form"
            disabled={saving}
            className="flex items-center gap-[0.5rem] bg-[#F59400] text-White px-[1.25rem] py-[0.625rem] rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 text-[0.9rem]"
          >
            <Save size={18} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[75rem] p-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Main Form */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 pb-4 border-b border-gray-50 flex items-center gap-3">
              <Building2 className="text-[#01470b]" />
              Data Utama Cabang
            </h2>
            <form id="branch-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nama Cabang</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] focus:ring-1 focus:ring-[#01470b] outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Telepon</label>
                  <input 
                    type="text" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] focus:ring-1 focus:ring-[#01470b] outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] focus:ring-1 focus:ring-[#01470b] outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="hidden text-sm font-bold text-gray-400 uppercase tracking-widest">WhatsApp ID (Contoh: 628123..)</label>
                <input 
                  type="text" 
                  required
                  value={formData.whatsapp_pilihan}
                  onChange={e => setFormData({...formData, whatsapp_pilihan: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] focus:ring-1 focus:ring-[#01470b] outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Alamat Lengkap (Editable)</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] focus:ring-1 focus:ring-[#01470b] outline-none transition-all font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                  <span className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider">Latitude</span>
                  <span className="font-mono text-gray-900">{formData.lat.toFixed(6)}</span>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                  <span className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider">Longitude</span>
                  <span className="font-mono text-gray-900">{formData.lng.toFixed(6)}</span>
                </div>
              </div>
            </form>
          </section>

          {/* Map Section */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-[#01470b]" />
                Geotag Position
              </h3>
              <p className="text-sm text-gray-500 mt-1">Klik pada peta untuk mengubah koordinat dan memperbarui alamat otomatis.</p>
            </div>
            <div className="flex-1 relative z-10">
              <MapContainer 
                center={[formData.lat, formData.lng]} 
                zoom={14} 
                className="w-full h-full min-h-[400px]"
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={[formData.lat, formData.lng]} setPosition={handleSetPosition} />
              </MapContainer>
            </div>
          </section>
        </div>

        {/* Gallery Management */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Galeri Cabang</h2>
              <p className="text-gray-500">Kelola foto-foto fasilitas dan operasional cabang ini.</p>
            </div>
            <button 
              onClick={() => setShowGalleryAdd(true)}
              className="flex items-center gap-2 bg-[#01470b] text-white px-6 py-2.5 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              <Plus size={18} />
              Tambah Foto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gallery.map((item, index) => (
              <motion.div 
                layout
                key={item.id}
                className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
              >
                <div className="aspect-video overflow-hidden cursor-pointer" onClick={() => setPopupIndex(index)}>
                  <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-gray-900 truncate">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                </div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingGalleryItem(item);
                      setEditGalleryItem({ title: item.title, description: item.description, image_url: item.image_url });
                      setShowGalleryEdit(true);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 active:scale-90 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGallery(item.id)}
                    className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          {popupIndex !== null && (
            <PhotoGalleryPopup
              images={gallery}
              initialIndex={popupIndex}
              onClose={() => setPopupIndex(null)}
            />
          )}
        </section>
      </main>

      {/* Edit Gallery Modal */}
      <AnimatePresence>
        {showGalleryEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGalleryEdit(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Edit Foto Galeri</h3>
                <button onClick={() => setShowGalleryEdit(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleEditGallery} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul Foto</label>
                  <input 
                    type="text" required
                    value={editGalleryItem.title}
                    onChange={e => setEditGalleryItem({...editGalleryItem, title: e.target.value})}
                    placeholder="Contoh: Gedung Front Office"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Keterangan Singkat ({editGalleryItem.description.length}/200)
                  </label>
                  <textarea 
                    required
                    maxLength={200}
                    rows={3}
                    value={editGalleryItem.description}
                    onChange={e => setEditGalleryItem({...editGalleryItem, description: e.target.value})}
                    placeholder="Jelaskan fasilitas atau area ini..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">URL Gambar</label>
                  <input 
                    type="url" required
                    value={editGalleryItem.image_url}
                    onChange={e => setEditGalleryItem({...editGalleryItem, image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#01470b] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Gallery Modal */}
      <AnimatePresence>
        {showGalleryAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGalleryAdd(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-gray-900">Tambah Foto Galeri</h3>
                <button onClick={() => setShowGalleryAdd(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X />
                </button>
              </div>

              <form onSubmit={handleAddGallery} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Judul Foto</label>
                  <input 
                    type="text" required
                    value={newGalleryItem.title}
                    onChange={e => setNewGalleryItem({...newGalleryItem, title: e.target.value})}
                    placeholder="Contoh: Gedung Front Office"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Keterangan Singkat ({newGalleryItem.description.length}/200)
                  </label>
                  <textarea 
                    required
                    maxLength={200}
                    rows={3}
                    value={newGalleryItem.description}
                    onChange={e => setNewGalleryItem({...newGalleryItem, description: e.target.value})}
                    placeholder="Jelaskan fasilitas atau area ini..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">URL Gambar</label>
                  <input 
                    type="url" required
                    value={newGalleryItem.image_url}
                    onChange={e => setNewGalleryItem({...newGalleryItem, image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 focus:bg-white focus:border-[#01470b] outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#01470b] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Upload ke Galeri
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
