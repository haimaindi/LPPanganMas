import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Send, User, Building2, Phone, Mail, MessageSquare, Link as LinkIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface ContactForm {
  type: 'Customer' | 'Suplier';
  nama: string;
  perusahaan: string;
  telepon: string;
  email: string;
  pesan: string;
  attachments: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s@\.]+\.[^\s@\.]+$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;

export default function KontakPage() {
  const [formData, setFormData] = useState<ContactForm>({
    type: 'Customer',
    nama: '',
    perusahaan: '',
    telepon: '',
    email: '',
    pesan: '',
    attachments: ['']
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone formatting: remove all non-digits, then add space every 3 chars
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.match(/.{1,3}/g)?.join(' ') || '';
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, telepon: formatted });
    
    if (errors.telepon) {
      setErrors({ ...errors, telepon: '' });
    }
  };

  const handleAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...formData.attachments];
    newAttachments[index] = value;
    setFormData({ ...formData, attachments: newAttachments });
  };

  const addAttachmentField = () => {
    setFormData({ ...formData, attachments: [...formData.attachments, ''] });
  };

  const removeAttachmentField = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments.length ? newAttachments : [''] });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi';
    if (!formData.perusahaan.trim()) newErrors.perusahaan = 'Nama perusahaan wajib diisi';
    
    const phoneDigits = formData.telepon.replace(/\s/g, '');
    if (!phoneDigits) {
      newErrors.telepon = 'Nomor telepon wajib diisi';
    } else if (!/^\d+$/.test(phoneDigits)) {
      newErrors.telepon = 'Hanya diperbolehkan angka';
    }

    if (!formData.email) {
      newErrors.email = 'Email wajib diisi';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Email tidak valid';
    }

    if (!formData.pesan.trim()) newErrors.pesan = 'Pesan wajib diisi';

    formData.attachments.forEach((link, index) => {
      if (link.trim() && !URL_REGEX.test(link)) {
        newErrors[`attachment_${index}`] = 'Link tidak valid';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim pesan ke server');
      }

      Swal.fire({
        title: 'Terima Kasih!',
        text: 'Pesan Anda telah kami terima dan akan segera kami respon.',
        icon: 'success',
        confirmButtonColor: '#01470b',
        confirmButtonText: 'Tutup',
        customClass: {
          popup: 'rounded-[1.5rem]',
          confirmButton: 'rounded-[0.75rem] px-[2rem] py-[0.75rem] font-bold'
        }
      });

      setFormData({
        type: 'Customer',
        nama: '',
        perusahaan: '',
        telepon: '',
        email: '',
        pesan: '',
        attachments: ['']
      });
    } catch (error) {
      console.error("Submit Error:", error);
      Swal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.',
        icon: 'error',
        confirmButtonColor: '#01470b',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fcf9] font-sans selection:bg-[#01470b] selection:text-white">
      <Navbar />

      <main className="mx-auto max-w-[50rem] px-[1.5rem] py-[5rem]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[1.5rem] bg-white p-[2rem] shadow-xl shadow-gray-200/50 md:p-[3.5rem]"
        >
          <div className="mb-[2.5rem] text-center">
            <h1 className="text-[2.5rem] font-extrabold tracking-tight text-[#01470b]">Hubungi Kami</h1>
            <p className="mt-[0.75rem] text-gray-600">Silakan isi formulir di bawah ini untuk mengirimkan pesan kepada kami.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-[1.5rem]">
            {/* Type Category */}
              <div className="flex justify-center gap-[1rem]">
                {(['Customer', 'Suplier'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`flex-1 rounded-[1rem] border-2 px-[1rem] py-[1rem] font-bold transition-all ${
                      formData.type === type
                        ? 'border-[#01470b] bg-[#01470b] text-white shadow-lg shadow-[#01470b]/20'
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-2">
                {/* Nama */}
                <div className="space-y-[0.5rem]">
                  <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                    <User className="h-[1rem] w-[1rem] text-[#01470b]" /> Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                      errors.nama ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                    }`}
                  />
                  {errors.nama && <p className="text-[0.75rem] font-medium text-red-500">{errors.nama}</p>}
                </div>

                {/* Perusahaan */}
                <div className="space-y-[0.5rem]">
                  <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                    <Building2 className="h-[1rem] w-[1rem] text-[#01470b]" /> Perusahaan
                  </label>
                  <input
                    type="text"
                    value={formData.perusahaan}
                    onChange={(e) => setFormData({ ...formData, perusahaan: e.target.value })}
                    placeholder="Nama perusahaan Anda"
                    className={`w-full rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                      errors.perusahaan ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                    }`}
                  />
                  {errors.perusahaan && <p className="text-[0.75rem] font-medium text-red-500">{errors.perusahaan}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-[1.5rem] md:grid-cols-2">
                {/* Nomor Telepon */}
                <div className="space-y-[0.5rem]">
                  <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                    <Phone className="h-[1rem] w-[1rem] text-[#01470b]" /> Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={handlePhoneChange}
                    placeholder="Contoh: 628 123 456 789"
                    className={`w-full rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                      errors.telepon ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                    }`}
                  />
                  {errors.telepon && <p className="text-[0.75rem] font-medium text-red-500">{errors.telepon}</p>}
                </div>

                {/* Email */}
                <div className="space-y-[0.5rem]">
                  <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                    <Mail className="h-[1rem] w-[1rem] text-[#01470b]" /> Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@perusahaan.com"
                    className={`w-full rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                    }`}
                  />
                  {errors.email && <p className="text-[0.75rem] font-medium text-red-500">{errors.email}</p>}
                </div>
              </div>

              {/* Pesan */}
              <div className="space-y-[0.5rem]">
                <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                  <MessageSquare className="h-[1rem] w-[1rem] text-[#01470b]" /> Pesan
                </label>
                <textarea
                  rows={5}
                  value={formData.pesan}
                  onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                  placeholder="Ceritakan apa yang bisa kami bantu..."
                  className={`w-full resize-none rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                    errors.pesan ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                  }`}
                />
                {errors.pesan && <p className="text-[0.75rem] font-medium text-red-500">{errors.pesan}</p>}
              </div>

              {/* Attachments */}
              <div className="space-y-[0.75rem]">
                <label className="flex items-center gap-[0.5rem] text-[0.875rem] font-semibold text-slate-700">
                  <LinkIcon className="h-[1rem] w-[1rem] text-[#01470b]" /> Link Lampiran (Multiple)
                </label>
                <div className="space-y-[0.5rem]">
                  <AnimatePresence mode="popLayout">
                    {formData.attachments.map((link, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex gap-[0.5rem]"
                      >
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={link}
                            onChange={(e) => handleAttachmentChange(index, e.target.value)}
                            placeholder="https://link-file.com/attachment"
                            className={`w-full rounded-[0.75rem] border px-[1rem] py-[0.75rem] transition-all focus:outline-none focus:ring-2 ${
                              errors[`attachment_${index}`] ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-[#01470b] focus:ring-[#01470b]/10'
                            }`}
                          />
                          {errors[`attachment_${index}`] && (
                            <p className="mt-[0.25rem] text-[0.75rem] font-medium text-red-500">{errors[`attachment_${index}`]}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachmentField(index)}
                          className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-[0.75rem] border border-slate-200 bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-[1.25rem] w-[1.25rem]" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <button
                  type="button"
                  onClick={addAttachmentField}
                  className="flex items-center gap-[0.5rem] text-[0.875rem] font-bold text-[#01470b] hover:underline"
                >
                  <Plus className="h-[1rem] w-[1rem]" /> Tambah Link Baru
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`relative mt-[1rem] flex w-full items-center justify-center gap-[0.75rem] rounded-[1rem] bg-[#01470b] py-[1rem] font-bold text-white transition-all hover:bg-[#003808] disabled:opacity-70 ${
                  isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:shadow-[#01470b]/20 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-[1.25rem] w-[1.25rem] animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-[1.25rem] w-[1.25rem]" />
                    <span>Kirim Pesan</span>
                  </>
                )}
              </button>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
