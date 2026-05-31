import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft, Plus, Trash2, Package, Building2, Image as ImageIcon, Save, Mail, CheckCircle, Circle, Archive, MapPin, Phone, Edit2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Swal from 'sweetalert2';
import { Product, Client, Slide, Contact, Branch } from '../types';
import BannerManager from '../components/BannerManager';
import PartnerManager from '../components/PartnerManager';
import ProductFormModal from '../components/ProductFormModal';

const SortableTableRow = ({ product, handleDeleteProduct, setEditingProduct, setIsProductModalOpen }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-gray-50 transition-colors ${!product.isActive ? 'bg-gray-100/50' : ''}`}>
      <td className="px-[1.5rem] py-[1rem]">
        <div className="flex items-center gap-[1rem]">
          <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
            <GripVertical size={20} />
          </div>
          <div className="h-[3.5rem] w-[3.5rem] shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-100">
            <img src={product.image_url} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-gray-900">{product.title}</span>
        </div>
      </td>
      <td className="px-[1.5rem] py-[1rem]">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-[#01470b] border border-green-100">
          {product.category}
        </span>
      </td>
      <td className="px-[1.5rem] py-[1rem]">
        {product.badge ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-tighter bg-orange-100 text-orange-600 border border-orange-200">
            {product.badge}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-[1.5rem] py-[1rem]">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {product.isActive ? 'Aktif' : 'Non-Aktif'}
        </span>
      </td>
      <td className="px-[1.5rem] py-[1rem] max-w-[18.75rem]">
          <p className="line-clamp-2 text-gray-500 text-[0.875rem] leading-relaxed">
            {product.specs}
          </p>
      </td>
      <td className="px-[1.5rem] py-[1rem] text-right">
        <div className="flex justify-end gap-[0.5rem]">
          <button 
            onClick={() => {
              setEditingProduct(product);
              setIsProductModalOpen(true);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button 
            onClick={() => handleDeleteProduct(product.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    Swal.fire({
      title: 'Yakin ingin keluar?',
      text: "Anda akan mengakhiri sesi login saat ini.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#01470b',
      confirmButtonText: 'Ya, Logout',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('isAuthenticated');
        navigate('/');
      }
    });
  };

  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'clients' | 'banners' | 'inbox' | 'branches'>(location.state?.activeTab || 'products');
  const [inboxTab, setInboxTab] = useState<'Customer' | 'Suplier'>(location.state?.fromInboxTab || 'Customer');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeTabProduk, setActiveTabProduk] = useState<'aktif' | 'non-aktif'>('aktif');

  const filteredProducts = products
    .filter(p => activeTabProduk === 'aktif' ? p.isActive : !p.isActive)
    .sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = filteredProducts.findIndex((p) => p.id === active.id);
      const newIndex = filteredProducts.findIndex((p) => p.id === over.id);
      const newOrderedProducts = arrayMove(filteredProducts, oldIndex, newIndex) as Product[];
      
      // Update local state
      setProducts(prev => {
        const others = prev.filter(p => !newOrderedProducts.find(np => np.id === p.id));
        return [...others, ...newOrderedProducts.map((p, index) => ({ ...p, order: index + 1 }))];
      });

      // Update backend
      for (let i = 0; i < newOrderedProducts.length; i++) {
        await fetch(`/api/products/${newOrderedProducts[i].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newOrderedProducts[i], order: i + 1 })
        });
      }
      fetchData();
    }
  };

  // Helper to format time to local
  const formatToLocal = (utcString: string) => {
    if (!utcString) return new Date();
    const isoStr = utcString.includes('T') ? utcString : utcString.replace(' ', 'T') + 'Z';
    return new Date(isoStr);
  };

  const formatLocalTime = (utcString: string) => {
    const date = formatToLocal(utcString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatLocalDate = (utcString: string) => {
    const date = formatToLocal(utcString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, cRes, sRes, coRes, bRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/clients'),
        fetch('/api/slides'),
        fetch('/api/contacts'),
        fetch('/api/branches')
      ]);

      if (!pRes.ok || !cRes.ok || !sRes.ok || !coRes.ok || !bRes.ok) {
        throw new Error('Gagal mengambil data dari server');
      }

      const pData = await pRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      const coData = await coRes.json();
      const bData = await bRes.json();
      setProducts(pData);
      setClients(cData);
      setSlides(sData);
      setContacts(coData);
      setBranches(bData);
    } catch (error) {
      console.error("Fetch Data Error:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Gagal memuat data. Pastikan koneksi server stabil.',
        icon: 'error',
        confirmButtonColor: '#01470b',
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#01470b',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
      Swal.fire({
        title: 'Terhapus!',
        text: 'Produk telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    }
  };

  const handleToggleRead = async (id: number, currentStatus: number) => {
    await fetch(`/api/contacts/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: !currentStatus })
    });
    fetchData();
  };

  const handleDeleteContact = async (id: number) => {
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

    if (result.isConfirmed) {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      fetchData();
      Swal.fire({
        title: 'Terhapus!',
        text: 'Pesan telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#01470b',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Header */}
      <header className="bg-[#01470b] text-white sticky top-0 z-50 shadow-md">
        <div className="mx-auto max-w-[90rem] px-[2rem] py-[1rem] flex items-center justify-between">
          <div className="flex items-center gap-[1rem]">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-[0.3rem] text-red-400 hover:text-red-500 transition-colors"
            >
              <span className="text-[0.8rem] font-bold">Logout</span>
            </button>
            <div className="h-[1rem] w-[1px] bg-white/20" />
            <Link to="/" className="flex items-center gap-[0.3rem] text-white/90 hover:text-white transition-colors">
              <span className="text-[0.8rem] font-medium">View Site</span>
            </Link>
          </div>

          <nav className="flex items-center gap-[0.5rem]">
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium transition-all ${activeTab === 'inbox' ? 'bg-white text-[#01470b] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <div className="relative">
                <Mail size={18} />
                {contacts.some(c => !c.is_read) && (
                  <span className="absolute -top-[5px] -right-[5px] h-[8px] w-[8px] rounded-full bg-red-500 border border-white" />
                )}
              </div>
              <span className="hidden md:inline">Inbox</span>
            </button>
            <button 
              onClick={() => setActiveTab('banners')}
              className={`flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium transition-all ${activeTab === 'banners' ? 'bg-white text-[#01470b] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <ImageIcon size={18} />
              <span className="hidden md:inline">Banners</span>
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium transition-all ${activeTab === 'products' ? 'bg-white text-[#01470b] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Package size={18} />
              <span className="hidden md:inline">Products</span>
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium transition-all ${activeTab === 'clients' ? 'bg-white text-[#01470b] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Building2 size={18} />
              <span className="hidden md:inline">Partners</span>
            </button>
            <button 
              onClick={() => setActiveTab('branches')}
              className={`flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium transition-all ${activeTab === 'branches' ? 'bg-white text-[#01470b] shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <MapPin size={18} />
              <span className="hidden md:inline">Branches</span>
            </button>
            <Link 
              to="/admin/profil"
              className="flex items-center gap-[0.5rem] px-[1.25rem] py-[0.625rem] rounded-[0.5rem] text-[0.9rem] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <ImageIcon size={18} />
              <span className="hidden md:inline">Profile</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-[90rem] p-[2rem] md:p-[3rem]">
        <div className="mb-[2.5rem]">
          <h2 className="text-[1.8rem] font-black text-gray-900 tracking-tight">
            {activeTab === 'products' ? 'Product Catalog' : activeTab === 'clients' ? 'Corporate Partners' : activeTab === 'banners' ? 'Landing Banners' : activeTab === 'branches' ? 'Branch Management' : 'Message Inbox'}
          </h2>
          <div className="mt-[0.5rem] h-[0.25rem] w-[3rem] bg-[#01470b] rounded-full" />
        </div>

        {activeTab === 'branches' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {branches.map((branch) => (
                <Link
                  key={branch.id}
                  to={`/admin/branch/${branch.id}`}
                  className="flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:border-[#01470b] hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#01470b] text-white">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#01470b] transition-colors">{branch.name}</h3>
                        <p className="text-sm text-gray-500 uppercase tracking-widest">{branch.slug}</p>
                      </div>
                    </div>
                    <CheckCircle className="text-[#01470b] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <MapPin size={16} className="shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone size={16} className="shrink-0" />
                      <span>{branch.phone}</span>
                    </div>
                  </div>
                  <span className="mt-4 text-sm font-bold text-[#01470b] flex items-center gap-2">
                    Manage Branch Data
                    <ArrowLeft className="rotate-180" size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="flex flex-col gap-[1.5rem]">
            {/* Sub Tabs for Inbox */}
            <div className="flex items-center gap-[1rem] border-b border-gray-200 pb-[1rem]">
              <button 
                onClick={() => setInboxTab('Customer')}
                className={`px-[1.5rem] py-[0.5rem] rounded-full text-[0.9rem] font-bold transition-all ${inboxTab === 'Customer' ? 'bg-[#01470b] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Customers ({contacts.filter(c => c.type === 'Customer' && !c.is_read).length} unread)
              </button>
              <button 
                onClick={() => setInboxTab('Suplier')}
                className={`px-[1.5rem] py-[0.5rem] rounded-full text-[0.9rem] font-bold transition-all ${inboxTab === 'Suplier' ? 'bg-[#01470b] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Suppliers ({contacts.filter(c => c.type === 'Suplier' && !c.is_read).length} unread)
              </button>
            </div>

            {contacts.filter(c => c.type === inboxTab).length === 0 ? (
              <div className="bg-white rounded-[1rem] p-[4rem] text-center shadow-sm">
                <div className="mx-auto w-[4rem] h-[4rem] bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-[1.5rem]">
                  <Mail size={32} />
                </div>
                <h3 className="text-[1.25rem] font-bold text-gray-900">Belum Ada Pesan {inboxTab === 'Suplier' ? 'Supplier' : 'Customer'}</h3>
                <p className="text-gray-500 mt-[0.5rem]">Pesan dari formulir {inboxTab === 'Suplier' ? 'Supplier' : 'Customer'} akan muncul di sini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-[1rem] shadow-sm divide-y divide-gray-50">
                {contacts
                  .filter(c => c.type === inboxTab)
                  .sort((a, b) => {
                    // Unread first, then by date descending
                    if (!a.is_read && b.is_read) return -1;
                    if (a.is_read && !b.is_read) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((contact) => (
                    <Link
                      key={contact.id}
                      to={`/admin/inbox/${contact.id}`}
                      state={{ from: inboxTab }}
                      className={`block p-[1.25rem] hover:bg-gray-50 transition-colors relative group`}
                    >
                      <div className="flex items-center justify-between gap-[1rem] mb-[0.25rem]">
                        <div className="flex items-center gap-[0.75rem]">
                          <h4 className={`text-[1rem] ${contact.is_read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                            {contact.nama}
                          </h4>
                          {!contact.is_read && (
                            <span className="flex items-center gap-[0.25rem] px-[0.5rem] py-[0.125rem] rounded-full bg-red-100 text-red-600 text-[0.65rem] font-black uppercase tracking-tighter">
                              <span className="h-[4px] w-[4px] rounded-full bg-red-600 animate-pulse" />
                              Unread
                            </span>
                          )}
                        </div>
                        <span className="text-[0.75rem] text-gray-400 font-medium">
                          {formatLocalDate(contact.created_at)} • {formatLocalTime(contact.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-[1rem]">
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.875rem] text-gray-500 truncate leading-relaxed">
                            <span className="font-semibold text-gray-600">{contact.perusahaan}</span> — {contact.pesan}
                          </p>
                        </div>
                        <div className="flex items-center gap-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteContact(contact.id);
                            }}
                            className="p-[0.5rem] text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'banners' && (
          <BannerManager slides={slides} onRefresh={fetchData} />
        )}

        {activeTab === 'products' && (
          <div className="space-y-[2rem]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[1.25rem] font-bold text-gray-900">Catalogue List</h3>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => setActiveTabProduk('aktif')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold ${activeTabProduk === 'aktif' ? 'bg-[#01470b] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Aktif
                  </button>
                  <button 
                    onClick={() => setActiveTabProduk('non-aktif')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold ${activeTabProduk === 'non-aktif' ? 'bg-[#01470b] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Non-Aktif
                  </button>
                </div>
              </div>
              <button 
                onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                className="flex items-center gap-[0.5rem] rounded-[0.5rem] bg-[#01470b] px-[1.5rem] py-[0.75rem] font-semibold text-white shadow-lg transition-all hover:bg-[#026312]"
              >
                <Plus size={20} /> Tambah Produk
              </button>
            </div>

            <ProductFormModal 
              isOpen={isProductModalOpen} 
              onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} 
              onRefresh={fetchData}
              editingProduct={editingProduct}
              allProducts={products}
            />

            {/* List */}
            <section className="w-full">
              <div className="overflow-hidden rounded-[1rem] bg-white shadow-sm border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[0.875rem] font-bold text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-[1.5rem] py-[1.25rem]">Product</th>
                      <th className="px-[1.5rem] py-[1.25rem]">Category</th>
                      <th className="px-[1.5rem] py-[1.25rem]">Badge</th>
                      <th className="px-[1.5rem] py-[1.25rem]">Status</th>
                      <th className="px-[1.5rem] py-[1.25rem]">Specifications</th>
                      <th className="px-[1.5rem] py-[1.25rem] text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {filteredProducts.map((product) => (
                          <SortableTableRow 
                            key={product.id} 
                            product={product} 
                            handleDeleteProduct={handleDeleteProduct}
                            setEditingProduct={setEditingProduct}
                            setIsProductModalOpen={setIsProductModalOpen}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-[1.5rem] py-[5rem] text-center text-gray-400 font-medium">
                           <Package size={48} className="mx-auto mb-2 opacity-20" />
                           Belum ada produk. Silakan tambah produk baru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'clients' && (
          <PartnerManager clients={clients} onRefresh={fetchData} />
        )}
      </main>
    </div>
  );
}
