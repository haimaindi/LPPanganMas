export interface Product {
  id: number;
  title: string;
  category: string;
  specs: string;
  image_url: string;
  badge?: string;
  isPromote: boolean;
  isActive: boolean;
  order: number;
}

export interface Client {
  id: number;
  name: string;
  logo_url: string;
}

export interface Slide {
  id: number;
  image_url: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_url: string;
}

export interface Contact {
  id: number;
  type: 'Customer' | 'Suplier';
  nama: string;
  perusahaan: string;
  telepon: string;
  email: string;
  pesan: string;
  attachments: string[];
  is_read: number; 
  created_at: string;
}

export interface CompanyProfile {
  heroTitle: string;
  heroTitleColor?: string;
  heroSubtitle: string;
  heroSubtitleColor?: string;
  heroImage: string;
  aboutTitle: string;
  aboutContent: string;
  visionTitle: string;
  visionText: string;
  missionTitle: string;
  missionContent: string;
  portfolioLink?: string;
}

export interface Branch {
  id: number;
  slug: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  whatsapp_pilihan: string;
}

export interface BranchGalleryItem {
  id: number;
  branch_id: number;
  title: string;
  description: string;
  image_url: string;
}
