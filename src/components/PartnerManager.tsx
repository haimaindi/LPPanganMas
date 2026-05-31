import React, { useState } from 'react';
import { Plus, Trash2, Building2, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Client } from '../types';
import PartnerFormModal from './PartnerFormModal';

interface PartnerManagerProps {
  clients: Client[];
  onRefresh: () => void;
}

export default function PartnerManager({ clients, onRefresh }: PartnerManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Partner?',
      text: "Partner ini tidak akan muncul di running gallery!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      onRefresh();
      Swal.fire({
        title: 'Terhapus!',
        text: 'Partner telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    }
  };

  return (
    <div className="space-y-[2.5rem]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[1.25rem] font-bold text-gray-900">Corporate Partners</h3>
          <p className="text-[0.875rem] text-gray-500">Partner yang ditampilkan pada running gallery di halaman utama.</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="flex items-center gap-[0.5rem] rounded-[0.5rem] bg-[#01470b] px-[1.5rem] py-[0.75rem] font-semibold text-white shadow-lg transition-all hover:bg-[#026312]"
        >
          <Plus size={20} /> Add Partner
        </button>
      </div>

      <PartnerFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingClient(null); }} 
        onRefresh={onRefresh}
        editingClient={editingClient}
      />

      <section className="w-full">
        <div className="overflow-hidden rounded-[1rem] bg-white shadow-sm border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[0.875rem] font-bold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-[1.5rem] py-[1.25rem]">Logo</th>
                <th className="px-[1.5rem] py-[1.25rem]">Partner Name</th>
                <th className="px-[1.5rem] py-[1.25rem] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-[1.5rem] py-[1rem]">
                    <div className="h-[3.5rem] w-[7rem] overflow-hidden rounded-lg bg-white border border-gray-100 p-2">
                      <img src={client.logo_url} alt="" className="h-full w-full object-contain" />
                    </div>
                  </td>
                  <td className="px-[1.5rem] py-[1rem]">
                    <span className="font-bold text-gray-900">{client.name}</span>
                  </td>
                  <td className="px-[1.5rem] py-[1rem] text-right">
                    <div className="flex justify-end gap-[0.5rem]">
                      <button 
                        onClick={() => handleEdit(client)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-[1.5rem] py-[5rem] text-center text-gray-400 font-medium">
                    <Building2 size={48} className="mx-auto mb-2 opacity-20" />
                    Belum ada partner. Silakan tambah partner baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
