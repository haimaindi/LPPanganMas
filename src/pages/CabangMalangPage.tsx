import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhotoGalleryPopup from '../components/PhotoGalleryPopup';
import { ASSETS } from '../assets';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

export default function CabangMalangPage() {
  const [branch, setBranch] = useState<BranchWithGallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [popupIndex, setPopupIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/branches/malang')
      .then(res => res.json())
      .then(data => {
        setBranch(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching branch:", err);
        setLoading(false);
      });
    
    window.scrollTo(0, 0);
  }, []);

  if (loading || !branch) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Navbar />
        <main className="pt-[5rem] pb-16">
          <PageLoading />
        </main>
        <Footer />
      </div>
    );
  }

  const position: [number, number] = [branch.lat, branch.lng];
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      
      <main className="pt-[5rem] pb-16">
        <div className="mx-auto max-w-7xl px-8">
          {/* Top Section: Info & Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Info Column */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              <h1 className="text-5xl font-extrabold text-[#01470b] leading-tight mb-6">
                {branch.name}
              </h1>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#01470b]/10 text-[#01470b]">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telepon</p>
                    <p className="text-lg text-gray-900">{branch.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#01470b]/10 text-[#01470b]">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-lg text-gray-900">{branch.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#01470b]/10 text-[#01470b]">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alamat</p>
                    <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-line">
                      {branch.address}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map Column */}
            <motion.div 
              key={`${branch.lat}-${branch.lng}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 h-96 lg:h-auto min-h-[24rem]"
            >
              <MapContainer 
                center={position} 
                zoom={14} 
                className="w-full h-full z-10"
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                  <Popup>
                    PT Pangan Mas Abadi <br /> {branch.name}
                  </Popup>
                </Marker>
              </MapContainer>
              
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-6 right-6 z-[1001] flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#01470b] shadow-lg hover:bg-gray-50 transition-all border border-gray-100"
              >
                Navigasi Ke Google Maps
                <ExternalLink size={16} />
              </a>
            </motion.div>
          </div>

          {/* Gallery Section */}
          <div className="mt-16">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Galeri Fasilitas Malang</h2>
              <div className="mt-2 h-0.5 w-16 bg-[#01470b]"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {branch.gallery.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setPopupIndex(index)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md border border-gray-100 cursor-pointer"
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            {popupIndex !== null && (
              <PhotoGalleryPopup
                images={branch.gallery}
                initialIndex={popupIndex}
                onClose={() => setPopupIndex(null)}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Floating WhatsApp Button Container */}
<div className="fixed bottom-[0.5rem] right-[0.5rem] z-[9999] flex h-[6rem] w-[4rem] flex-col items-center justify-end">
  
  {/* 1. TOMBOL (Melayang Naik Turun) */}
  <motion.a
    href={`https://wa.me/${branch.whatsapp_pilihan}?text=Halo%20Pangan%20Mas%20Abadi%20${branch.name}`}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, y: 0 }}
    animate={{ 
      opacity: 1, 
      // Menggunakan angka minus agar objek benar-benar bergerak ke ATAS menjauhi shadow
      y: [0, -24, 0] 
    }}
    transition={{
      y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
      opacity: { duration: 0.5 }
    }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    // Menggunakan absolute top-0 agar terpisah secara flow dari shadow di bawah
    className="absolute top-0 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-White shadow-lg transition-transform"
    id="wa-floating-button"
  >
    <img 
      src={ASSETS.WA_ICON} 
      alt="WhatsApp" 
      className="h-[3rem] w-[3rem] object-contain"
      referrerPolicy="no-referrer"
    />
  </motion.a>

  {/* 2. DYNAMIC SHADOW (Bentuk Ellipse di Tanah) */}
  <motion.div
    animate={{ 
      // Sinkron dengan tombol: 
      // Saat tombol di y: 0 (dekat tanah) -> shadow lebar (scaleX: 1) & tebal (opacity: 0.4)
      // Saat tombol di y: -24 (tinggi di atas) -> shadow menyusut (scaleX: 0.5) & pudar (opacity: 0.15)
      scaleX: [1, 0.5, 1], 
      opacity: [0.7, 0.5, 0.7],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    // Menggunakan ukuran fixed kecil di paling bawah container sebagai jangkar tanah
    className="h-[6px] w-[2.5rem] rounded-[50%] bg-black blur-[3px]" 
  />

</div>
    </div>
  );
}
