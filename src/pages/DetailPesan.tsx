import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Building2, Phone, Mail, Archive, Trash2, CheckCircle, Clock, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import { Contact } from '../types';

export default function DetailPesan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine back path
  const backPath = '/admin';
  const fromTab = location.state?.from || 'Customer';

  const handleBack = () => {
    navigate(backPath, { state: { activeTab: 'inbox', fromInboxTab: fromTab } });
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Gagal memuat data');
      const data: Contact[] = await response.json();
      const found = data.find(c => c.id === Number(id));
      
      if (found) {
        setContact(found);
        // Mark as read automatically if not already read
        if (!found.is_read) {
          handleToggleRead(found.id, 0);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRead = async (contactId: number, currentStatus: number) => {
    await fetch(`/api/contacts/${contactId}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: !currentStatus })
    });
    // Update local state
    if (contact) {
      setContact({ ...contact, is_read: currentStatus ? 0 : 1 });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Hapus Pesan?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed && contact) {
      await fetch(`/api/contacts/${contact.id}`, { method: 'DELETE' });
      navigate(backPath, { state: { activeTab: 'inbox', fromInboxTab: fromTab } });
      Swal.fire({
        title: 'Terhapus!',
        text: 'Pesan telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    }
  };

  const formatToLocal = (utcString: string) => {
    if (!utcString) return new Date();
    const isoStr = utcString.includes('T') ? utcString : utcString.replace(' ', 'T') + 'Z';
    return new Date(isoStr);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="h-[2rem] w-[2rem] border-4 border-[#01470b]/20 border-t-[#01470b] rounded-full animate-spin" />
    </div>
  );

  if (!contact) return (
    <div className="min-h-screen bg-gray-50 p-[2rem] text-center">
      <p>Pesan tidak ditemukan.</p>
      <button onClick={handleBack} className="mt-[1rem] text-[#01470b] font-bold">Kembali</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#01470b] text-white sticky top-0 z-50 shadow-md">
        <div className="mx-auto max-w-[90rem] px-[2rem] py-[1rem] flex items-center justify-between">
          <div className="flex items-center gap-[2.5rem]">
            <button 
              onClick={handleBack} 
              className="flex items-center gap-[0.5rem] text-white/80 hover:text-white transition-colors text-[0.875rem] font-medium"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Kembali ke Inbox {fromTab}</span>
            </button>
            <div className="h-[1.5rem] w-[1px] bg-white/20 hidden sm:block" />

          </div>
          
          <div className="flex items-center gap-[0.75rem]">
            <button 
              onClick={() => handleToggleRead(contact.id, contact.is_read)}
              className={`p-[0.625rem] rounded-full transition-all ${contact.is_read ? 'bg-white/10 text-white/60' : 'bg-white text-[#01470b]'}`}
              title={contact.is_read ? "Tandai Belum Dibaca" : "Tandai Sudah Dibaca"}
            >
              <CheckCircle size={20} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-[0.625rem] rounded-full bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white transition-all shadow-lg"
              title="Hapus Pesan"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[60rem] p-[1.5rem] md:p-[3rem]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Header Section */}
          <div className="p-[2rem] border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap items-center justify-between gap-[1.5rem] mb-[1.5rem]">
              <div className="flex items-center gap-[1rem]">
                <div className="w-[3.5rem] h-[3.5rem] rounded-full bg-[#01470b] flex items-center justify-center text-white text-[1.25rem] font-black">
                  {contact.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[1.5rem] font-black text-gray-900 tracking-tight leading-tight">{contact.nama}</h2>
                  <div className="flex items-center gap-[0.5rem] mt-[0.25rem]">
                    <span className={`px-[0.625rem] py-[0.125rem] rounded-full text-[0.65rem] font-black uppercase tracking-wider ${
                      contact.type === 'Customer' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {contact.type}
                    </span>
                    <span className="text-[0.8125rem] text-gray-400 font-medium flex items-center gap-[0.25rem]">
                      <Clock size={12} />
                      {formatToLocal(contact.created_at).toLocaleDateString('id-ID', {
                         day: 'numeric',
                         month: 'long',
                         year: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
              <div className="flex items-center gap-[0.75rem] text-gray-600">
                <div className="w-[2.25rem] h-[2.25rem] rounded-[0.5rem] bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Building2 size={16} className="text-[#01470b]" />
                </div>
                <div>
                  <p className="text-[0.75rem] text-gray-400 font-bold uppercase">Perusahaan</p>
                  <p className="text-[0.9375rem] font-bold text-gray-900">{contact.perusahaan}</p>
                </div>
              </div>
              <div className="flex items-center gap-[0.75rem] text-gray-600">
                <div className="w-[2.25rem] h-[2.25rem] rounded-[0.5rem] bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Mail size={16} className="text-[#01470b]" />
                </div>
                <div>
                  <p className="text-[0.75rem] text-gray-400 font-bold uppercase">Email</p>
                  <p className="text-[0.9375rem] font-bold text-gray-900">{contact.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-[0.75rem] text-gray-600">
                <div className="w-[2.25rem] h-[2.25rem] rounded-[0.5rem] bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                  <Phone size={16} className="text-[#01470b]" />
                </div>
                <div>
                  <p className="text-[0.75rem] text-gray-400 font-bold uppercase">Telepon</p>
                  <p className="text-[0.9375rem] font-bold text-gray-900">{contact.telepon}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div className="p-[2rem]">
            <h3 className="text-[0.75rem] text-gray-400 font-black uppercase tracking-widest mb-[1rem]">Pesan</h3>
            <div className="bg-gray-50 rounded-[1rem] p-[1.5rem] border border-gray-100 ring-1 ring-gray-100">
              <p className="text-gray-700 text-[1.0625rem] leading-[1.8] whitespace-pre-wrap">{contact.pesan}</p>
            </div>

            {contact.attachments.length > 0 && contact.attachments[0] !== '' && (
              <div className="mt-[2rem]">
                <h3 className="text-[0.75rem] text-gray-400 font-black uppercase tracking-widest mb-[1rem]">Lampiran</h3>
                <div className="flex flex-wrap gap-[1rem]">
                  {contact.attachments.map((link, i) => link && (
                    <a 
                      key={i} 
                      href={link} 
                      target="_blank" 
                      rel="noreferrer"
                      className="group flex items-center gap-[0.75rem] px-[1.25rem] py-[0.75rem] bg-white border border-gray-200 rounded-[0.75rem] text-gray-700 font-bold shadow-sm transition-all hover:border-[#01470b] hover:text-[#01470b]"
                    >
                      <div className="w-[2.5rem] h-[2.5rem] rounded-[0.5rem] bg-gray-50 flex items-center justify-center group-hover:bg-[#01470b]/10 transition-colors">
                        <Archive size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.875rem]">Lampiran {i + 1}</span>
                        <span className="text-[0.75rem] text-gray-400 font-medium">Buka file</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
